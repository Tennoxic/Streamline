#!/usr/bin/env python3
import http.server
import json
import os
import base64
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone
from threading import Thread, Lock
from pathlib import Path
import signal
import sys
import time
import socketserver

PORT = int(os.environ.get("PORT", 8000))
GH_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GH_REPO = os.environ.get("GITHUB_REPO", "")
GH_API = f"https://api.github.com/repos/{GH_REPO}/contents"
SYNC_INTERVAL = int(os.environ.get("SYNC_INTERVAL", "180"))
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "")

VALID_USERS = {
    u.strip().lower()
    for u in os.environ.get("ALLOWED_USERS", "").split(",")
    if u.strip()
}

BASE_DIR = Path(__file__).parent

_buffer: dict = {}
_lock = Lock()


def current_period() -> str:
    now = datetime.now(timezone.utc)
    h = "H1" if now.month <= 6 else "H2"
    return f"{now.year}-{h}"


def gh_path(username: str, period: str) -> str:
    return f"data/{username}/{username}-{period}.json"


def gh_request(path: str, method: str = "GET", body=None):
    url = f"{GH_API}/{path}"
    headers = {
        "Authorization": f"token {GH_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Streamline/1.0",
    }
    req = urllib.request.Request(url, headers=headers, method=method)
    if body:
        req.data = json.dumps(body).encode("utf-8")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read()), None
    except urllib.error.HTTPError as e:
        return None, e


def gh_read(path: str):
    res, err = gh_request(path)
    if err:
        if err.code == 404:
            return None, None
        raise err
    raw = res["content"].replace("\n", "").replace("\r", "")
    content = base64.b64decode(raw).decode("utf-8")
    return json.loads(content), res["sha"]


def gh_write(path: str, data: dict, sha):
    content = base64.b64encode(
        json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    ).decode("utf-8")
    body = {
        "message": f"sync: {path} @ {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}",
        "content": content,
    }
    if sha:
        body["sha"] = sha

    res, err = gh_request(path, "PUT", body)

    if err and hasattr(err, "code") and err.code == 409:
        print(f"[WARN] 409 conflict on {path}, fetching fresh sha and retrying...", flush=True)
        try:
            _, fresh_sha = gh_read(path)
            if fresh_sha:
                body["sha"] = fresh_sha
            res, err = gh_request(path, "PUT", body)
        except Exception as retry_err:
            print(f"[ERROR] Retry failed for {path}: {retry_err}", flush=True)
            raise retry_err

    if err:
        raise err
    return res


def load_user_data(username: str) -> dict:
    now = datetime.now(timezone.utc)
    year, month = now.year, now.month

    periods = [current_period()]
    if month <= 6:
        periods.append(f"{year-1}-H2")
    else:
        periods.append(f"{year}-H1")

    merged = {"tasks": {}, "notes": {}, "counters": [], "schemas": [], "badges": []}
    for p in reversed(periods):
        path = gh_path(username, p)
        try:
            chunk, _ = gh_read(path)
            if chunk:
                merged["tasks"].update(chunk.get("tasks", {}))
                merged["notes"].update(chunk.get("notes", {}))
                if chunk.get("counters"):
                    merged["counters"] = chunk["counters"]
                if chunk.get("schemas"):
                    merged["schemas"] = chunk["schemas"]
                if chunk.get("badges"):
                    merged["badges"] = chunk["badges"]
        except Exception as e:
            print(f"[WARN] load_user_data {path}: {e}", flush=True)

    return merged


def save_user_data(username: str, data: dict):
    period = current_period()
    path = gh_path(username, period)
    _, sha = gh_read(path)
    gh_write(path, data, sha)
    print(f"[SYNC] Saved {username} ({period})", flush=True)


def sync_loop():
    while True:
        time.sleep(SYNC_INTERVAL)
        with _lock:
            items = [(u, b) for u, b in _buffer.items() if b.get("dirty")]
        for username, buf in items:
            try:
                save_user_data(username, buf["data"])
                with _lock:
                    _buffer[username]["dirty"] = False
            except Exception as e:
                print(f"[ERROR] Auto-sync {username}: {e}", flush=True)


Thread(target=sync_loop, daemon=True).start()


def handle_shutdown(signum, frame):
    print("[SHUTDOWN] Flushing dirty buffers...", flush=True)
    with _lock:
        items = [(u, b) for u, b in _buffer.items() if b.get("dirty")]
    for username, buf in items:
        try:
            save_user_data(username, buf["data"])
            print(f"[SHUTDOWN] Saved {username}", flush=True)
        except Exception as e:
            print(f"[SHUTDOWN] Save failed {username}: {e}", flush=True)
    sys.exit(0)


signal.signal(signal.SIGTERM, handle_shutdown)
signal.signal(signal.SIGINT, handle_shutdown)


class Handler(http.server.BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        print(f"[LOG] {self.path} — {format % args}", flush=True)

    def send_cors(self):
        if ALLOWED_ORIGIN:
            self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def send_json(self, code: int, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_cors()
        self.end_headers()
        self.wfile.write(body)

    def send_err(self, code: int, msg: str):
        self.send_json(code, {"error": msg})

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors()
        self.end_headers()

    def do_GET(self):
        p = self.path.split("?")[0]

        if p == "/api/health":
            self.send_json(200, {"status": "ok"})

        elif p.startswith("/api/data/"):
            username = p[len("/api/data/"):].lower()
            if username not in VALID_USERS:
                self.send_err(403, "Unauthorized user")
                return
            with _lock:
                if username not in _buffer:
                    try:
                        data = load_user_data(username)
                        _buffer[username] = {"data": data, "dirty": False, "period": current_period()}
                    except Exception as e:
                        self.send_err(500, str(e))
                        return
                data = _buffer[username]["data"]
            self.send_json(200, {"data": data})

        else:
            self._serve_static(p)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        p = self.path.split("?")[0]

        if p == "/api/login":
            try:
                payload = json.loads(raw)
                username = payload.get("username", "").strip().lower()
            except Exception:
                self.send_err(400, "Invalid request")
                return

            if username not in VALID_USERS:
                self.send_err(401, "User not found")
                return

            with _lock:
                if username not in _buffer:
                    try:
                        data = load_user_data(username)
                        _buffer[username] = {"data": data, "dirty": False, "period": current_period()}
                    except Exception as e:
                        self.send_err(500, str(e))
                        return
                data = _buffer[username]["data"]

            self.send_json(200, {"ok": True, "data": data})

        elif p.startswith("/api/data/"):
            username = p[len("/api/data/"):].lower()
            if username not in VALID_USERS:
                self.send_err(403, "Unauthorized")
                return
            try:
                payload = json.loads(raw)
                new_data = payload.get("data", payload)
            except Exception:
                self.send_err(400, "Invalid JSON")
                return

            if not isinstance(new_data.get("tasks"), dict):
                self.send_err(400, "Invalid data: tasks must be a dict")
                return
            if not isinstance(new_data.get("counters"), list):
                self.send_err(400, "Invalid data: counters must be a list")
                return
            if not isinstance(new_data.get("schemas"), list):
                self.send_err(400, "Invalid data: schemas must be a list")
                return
            if not isinstance(new_data.get("badges"), list):
                self.send_err(400, "Invalid data: badges must be a list")
                return

            with _lock:
                if username not in _buffer:
                    _buffer[username] = {"data": {}, "dirty": False, "period": current_period()}
                _buffer[username]["data"] = new_data
                _buffer[username]["dirty"] = True

            self.send_json(200, {"ok": True})

        else:
            self.send_err(404, "Not found")

    def _serve_static(self, path: str):
        if path in ("/", ""):
            path = "/index.html"

        safe = path.lstrip("/")
        frontend_root = (BASE_DIR.parent / "frontend").resolve()
        file_path = (frontend_root / safe).resolve()

        if not str(file_path).startswith(str(frontend_root)):
            self.send_response(403)
            self.end_headers()
            return

        if not file_path.exists() or not file_path.is_file():
            file_path = frontend_root / "index.html"

        if not file_path.exists():
            self.send_response(404)
            self.end_headers()
            return

        ext_map = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json",
            ".ico": "image/x-icon",
            ".png": "image/png",
            ".svg": "image/svg+xml",
        }
        ext = file_path.suffix.lower()
        mime = ext_map.get(ext, "application/octet-stream")
        body = file_path.read_bytes()

        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))
        self.send_cors()
        self.end_headers()
        self.wfile.write(body)


class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


if not GH_REPO or not GH_TOKEN:
    print("[WARN] GITHUB_REPO or GITHUB_TOKEN not set — GitHub sync will fail", flush=True)
if not VALID_USERS:
    print("[WARN] ALLOWED_USERS not set — no user will be able to log in", flush=True)
if not ALLOWED_ORIGIN:
    print("[WARN] ALLOWED_ORIGIN not set — CORS header will be omitted", flush=True)

print(f"Streamline started -> http://localhost:{PORT}", flush=True)
ThreadingServer(("0.0.0.0", PORT), Handler).serve_forever()
