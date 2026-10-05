"""Shared HTTP helper for the job-description pipeline.

Python's urllib fails TLS verification in this environment (the egress proxy
presents an expired certificate), while curl succeeds, so every fetch shells
out to curl rather than disabling verification.
"""

import json
import subprocess
import tempfile
import os

UA = "Mozilla/5.0 (compatible; jd-research/1.0)"


def fetch(url, method="GET", body=None, timeout=45, headers=None):
    """Return (http_code, text). Never raises on a network failure; code 0 means
    the connection itself failed."""
    fd, path = tempfile.mkstemp(suffix=".body")
    os.close(fd)
    cmd = [
        "curl", "-s", "-L", "-m", str(timeout),
        "-o", path, "-w", "%{http_code}",
        "-H", "User-Agent: " + UA,
        "-H", "Accept: application/json",
    ]
    for k, v in (headers or {}).items():
        cmd += ["-H", "%s: %s" % (k, v)]
    if method == "POST":
        cmd += ["-X", "POST", "-H", "Content-Type: application/json",
                "-d", json.dumps(body or {})]
    cmd.append(url)
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 15)
        code = int((out.stdout or "0").strip() or 0)
        with open(path, "rb") as f:
            text = f.read().decode("utf-8", "replace")
        return code, text
    except Exception:
        return 0, ""
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


def fetch_json(url, **kw):
    code, text = fetch(url, **kw)
    if code != 200 or not text:
        return code, None
    try:
        return code, json.loads(text)
    except ValueError:
        return code, None
