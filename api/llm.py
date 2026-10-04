"""POST /api/llm  ->  Groq (Qwen) chat completions, with the key kept on the server.

Hardened version:
  * only a whitelist of fields is forwarded (messages / temperature / max_tokens)
  * the model is fixed on the server, output size is capped
  * per-IP rate limit (best effort, per server instance)
  * same-origin check, small body limit, no upstream error details leaked to the browser

Vercel -> Settings -> Environment Variables:
  GROQ_API_KEY      = gsk_...
  ALLOWED_ORIGINS   = (optional) extra origins, comma separated, e.g. https://4miem.com
"""
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse

import requests

GROQ_URL = "https://api.groq.com/openai/v1"
MODEL = "qwen/qwen3.8-27b"

MAX_BODY_BYTES = 16 * 1024
MAX_MESSAGES = 4
MAX_CONTENT_CHARS = 2500
MAX_TOKENS_CAP = 1024

RATE_LIMITS = ((60, 8), (3600, 60))  # (window seconds, max requests) per IP
_hits = {}
_lock = threading.Lock()


def _rate_limited(ip):
    now = time.time()
    with _lock:
        stamps = [t for t in _hits.get(ip, []) if now - t < 3600]
        for window, limit in RATE_LIMITS:
            if sum(1 for t in stamps if now - t < window) >= limit:
                _hits[ip] = stamps
                return True
        stamps.append(now)
        _hits[ip] = stamps
        if len(_hits) > 5000:  # keep memory bounded
            for key in list(_hits)[:1000]:
                _hits.pop(key, None)
    return False


class handler(BaseHTTPRequestHandler):
    # ---------- helpers ----------
    def _send(self, status, body, content_type="application/json"):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _error(self, status, code):
        self._send(status, json.dumps({"error": {"message": code}}, ensure_ascii=False))

    def _client_ip(self):
        fwd = self.headers.get("x-forwarded-for", "")
        return (fwd.split(",")[0].strip() or self.headers.get("x-real-ip", "") or self.client_address[0])

    def _origin_ok(self):
        origin = self.headers.get("Origin")
        if not origin:  # same-origin GET / server-side calls
            return True
        host = (urlparse(origin).netloc or "").lower()
        if host == (self.headers.get("Host") or "").lower():
            return True
        if host.split(":")[0] in ("localhost", "127.0.0.1"):
            return True
        extra = [o.strip().lower() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
        return origin.lower() in extra

    # ---------- routes ----------
    def do_GET(self):
        # The model is fixed server-side; no need to ask Groq (saves quota and latency).
        self._send(200, json.dumps({"data": [{"id": MODEL}]}))

    def do_POST(self):
        if not self._origin_ok():
            return self._error(403, "FORBIDDEN")
        if _rate_limited(self._client_ip()):
            return self._error(429, "RATE_LIMITED")

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self._error(400, "BAD_REQUEST")
        if length <= 0 or length > MAX_BODY_BYTES:
            return self._error(413, "TOO_LARGE")

        try:
            data = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return self._error(400, "BAD_REQUEST")

        messages = data.get("messages") if isinstance(data, dict) else None
        valid = (
            isinstance(messages, list)
            and 0 < len(messages) <= MAX_MESSAGES
            and all(
                isinstance(m, dict)
                and m.get("role") in ("system", "user")
                and isinstance(m.get("content"), str)
                and 0 < len(m["content"]) <= MAX_CONTENT_CHARS
                for m in messages
            )
        )
        if not valid:
            return self._error(400, "INVALID_MESSAGES")

        try:
            temperature = min(max(float(data.get("temperature", 0.7)), 0.0), 1.2)
            max_tokens = min(max(int(data.get("max_tokens", 700)), 1), MAX_TOKENS_CAP)
        except (TypeError, ValueError):
            return self._error(400, "BAD_REQUEST")

        payload = {
            "model": MODEL,
            "messages": [{"role": m["role"], "content": m["content"]} for m in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }
        self._forward(payload)

    def _forward(self, payload):
        api_key = os.environ.get("GROQ_API_KEY", "").strip()
        if not api_key:
            print("GROQ_API_KEY is not configured")
            return self._error(503, "AI_OFFLINE")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "python-requests/2.32.3",
        }
        try:
            response = requests.post(f"{GROQ_URL}/chat/completions", headers=headers, json=payload, timeout=55)
        except requests.RequestException as error:
            print("Groq request failed:", repr(error))
            return self._error(502, "AI_OFFLINE")

        if response.status_code == 200:
            return self._send(200, response.content)

        print("Groq returned", response.status_code, response.text[:300])
        if response.status_code == 429:
            return self._error(429, "RATE_LIMITED")
        self._error(502, "AI_OFFLINE")

    def log_message(self, *args):  # keep function logs quiet
        pass
