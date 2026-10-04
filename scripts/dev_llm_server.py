"""Local stand-in for the Vercel function /api/llm (used by `vite` dev proxy on port 8001).

Run in a second terminal:   python scripts/dev_llm_server.py
Needs:  pip install requests   and   GROQ_API_KEY in .env (or in the environment).
"""
import os
import sys
from http.server import ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "api"))

env_file = ROOT / ".env"
if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

from llm import handler  # noqa: E402

if __name__ == "__main__":
    print("Local /api/llm proxy on http://127.0.0.1:8001  (GROQ_API_KEY %s)" % ("found" if os.environ.get("GROQ_API_KEY") else "MISSING"))
    ThreadingHTTPServer(("127.0.0.1", 8001), handler).serve_forever()
