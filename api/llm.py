import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

import requests

GROQ_URL = "https://api.groq.com/openai/v1"
MODEL = "qwen/qwen3.8-27b"


class handler(BaseHTTPRequestHandler):
    def _send(self, status, body, content_type="application/json"):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _error(self, status, message):
        self._send(
            status,
            json.dumps({"error": {"message": message}}, ensure_ascii=False),
        )

    def _requested_path(self):
        query = parse_qs(urlparse(self.path).query)
        path = query.get("path", ["chat/completions"])[0]
        return "models" if path == "models" else "chat/completions"

    def do_GET(self):
        path = self._requested_path()
        if path != "models":
            self._error(405, "Method not allowed")
            return
        self._forward("GET", path, None)

    def do_POST(self):
        path = self._requested_path()
        if path != "chat/completions":
            self._error(405, "Method not allowed")
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(length)
            payload = json.loads(raw_body.decode("utf-8"))
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
            self._error(400, "Invalid JSON body")
            return

        payload["model"] = MODEL
        if "max_completion_tokens" in payload and "max_tokens" not in payload:
            payload["max_tokens"] = payload.pop("max_completion_tokens")
        payload["stream"] = False
        self._forward("POST", path, payload)

    def _forward(self, method, path, payload):
        api_key = os.environ.get("GROQ_API_KEY", "").strip()
        if not api_key:
            self._error(500, "GROQ_API_KEY is not configured in Vercel")
            return

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "python-requests/2.32.3",
        }

        try:
            response = requests.request(
                method=method,
                url=f"{GROQ_URL}/{path}",
                headers=headers,
                json=payload,
                timeout=60,
            )
            self._send(response.status_code, response.content)
        except requests.RequestException as error:
            print("Groq request failed:", repr(error))
            self._error(502, "Could not connect to Groq")
