#!/usr/bin/env python3
"""juicebot.py - call the Juicebot MCP server without an MCP connector.

Python 3.8+, standard library only. A sibling juicebot.mjs offers the same
commands for machines without Python.

Usage:
  juicebot.py url                         join link for this session's room (starts a session if needed)
  juicebot.py status                      server status; "Browser Connected: Yes" means a page is live
  juicebot.py tools                       tool names with one-line descriptions
  juicebot.py call TOOL [JSON] [TOOL [JSON] ...]
                                          call one or more tools in one process, in order
                                          e.g. call load_map '{"url":"https://...hic","locus":"HOXA1"}' load_track '{"url":"genes"}'
  juicebot.py join ROOM_OR_JOIN_LINK      bind this session to an existing room (a page's "Start room" link)
  juicebot.py reset                       forget the session; the next command starts a new room

Options:
  --json         print raw tool results (JSON, one object per call) instead of their text
  --room ID      use this room for this invocation only
  --server URL   MCP endpoint for this invocation (overrides JUICEBOT_URL and the built-in list)

Environment:
  JUICEBOT_URL     MCP endpoint, e.g. https://juicebot-mcp.3dg.io/mcp
  JUICEBOT_STATE   state file (default: ~/.local/state/juicebot/session.json, or $XDG_STATE_HOME)

Exit codes: 0 ok; 2 the tool reported an error (most often: no page connected); 1 transport or usage error.
"""
import json
import os
import sys
import urllib.error
import urllib.request

# Candidate endpoints, tried in order the first time a session is created. The
# 3dg.io name is the lab's stable hostname (the Worker behind it may change);
# the workers.dev name is the frozen demo deployment. Override with --server or
# JUICEBOT_URL. The one that answers is remembered in the state file.
SERVERS = [
    "https://juicebot-mcp.3dg.io/mcp",
    "https://juicebox-mcp-v2.aidenlab.workers.dev/mcp",
]
# Cloudflare's Browser Integrity Check (error 1010) rejects Python's default
# "Python-urllib/x.y" User-Agent, so every request carries this one instead.
USER_AGENT = "juicebot-cli/1.0 (+https://github.com/aidenlab/plugins)"
# Tool calls wait up to 10 s for the page to acknowledge, plus the ENCODE portal
# searches that can take a while; 60 s leaves headroom without hanging forever.
TIMEOUT_SECONDS = 60
PROTOCOL_VERSION = "2025-06-18"

STATE_PATH = os.environ.get("JUICEBOT_STATE") or os.path.join(
    os.environ.get("XDG_STATE_HOME") or os.path.join(os.path.expanduser("~"), ".local", "state"),
    "juicebot", "session.json")


class Transport(Exception):
    pass


class SessionGone(Exception):
    """The server no longer knows this session id (HTTP 404)."""


_next_id = [0]


def post(url, message, session_id=None):
    """POST one JSON-RPC message. Returns (parsed result or None, session id header)."""
    headers = {
        "Content-Type": "application/json",
        # The server rejects requests (406) unless both media types are accepted.
        "Accept": "application/json, text/event-stream",
        "User-Agent": USER_AGENT,
    }
    if session_id:
        headers["mcp-session-id"] = session_id
    req = urllib.request.Request(url, data=json.dumps(message).encode(), method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            raw = resp.read()
            sid = resp.headers.get("mcp-session-id")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise SessionGone()
        body = e.read().decode(errors="replace")
        hint = ""
        if e.code == 403 and "1010" in body:
            hint = " (Cloudflare Browser Integrity Check rejected the request; check the User-Agent)"
        raise Transport("HTTP %d from %s%s" % (e.code, url, hint))
    except (urllib.error.URLError, OSError) as e:
        raise Transport("cannot reach %s: %s" % (url, getattr(e, "reason", e)))
    if not raw or "id" not in message:
        return None, sid
    data = json.loads(raw)
    if "error" in data:
        err = data["error"]
        raise Transport("MCP error %s: %s" % (err.get("code"), err.get("message")))
    return data.get("result"), sid


def rpc(url, method, params=None, session_id=None):
    _next_id[0] += 1
    msg = {"jsonrpc": "2.0", "id": _next_id[0], "method": method}
    if params is not None:
        msg["params"] = params
    return post(url, msg, session_id)


def notify(url, method, session_id):
    post(url, {"jsonrpc": "2.0", "method": method}, session_id)


def load_state():
    try:
        with open(STATE_PATH) as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def save_state(state):
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    with open(STATE_PATH, "w") as f:
        json.dump(state, f)


def initialize(url):
    params = {"protocolVersion": PROTOCOL_VERSION, "capabilities": {},
              "clientInfo": {"name": "juicebot-cli", "version": "1.0"}}
    result, sid = rpc(url, "initialize", params)
    if not sid:
        raise Transport("%s answered initialize without an mcp-session-id" % url)
    notify(url, "notifications/initialized", sid)
    return sid


class Session:
    def __init__(self, server=None, room=None):
        self.explicit_server = server or os.environ.get("JUICEBOT_URL")
        self.room = room
        self.url = None
        self.sid = None

    def open(self, fresh=False):
        state = load_state()
        if self.explicit_server:
            self.url = self.explicit_server
        if self.room:  # a room given on the command line: no state involved
            self.url = self.url or state.get("url") or self._first_live()
            self.sid = self.room
            return
        if not fresh and state.get("sid") and (not self.url or state.get("url") == self.url):
            self.url, self.sid = state["url"], state["sid"]
            return
        if self.url:
            self.sid = initialize(self.url)
        else:
            self.url, self.sid = self._first_live(with_sid=True)
        save_state({"url": self.url, "sid": self.sid})

    def _first_live(self, with_sid=False):
        errors = []
        for candidate in SERVERS:
            try:
                sid = initialize(candidate)
                return (candidate, sid) if with_sid else candidate
            except Transport as e:
                errors.append(str(e))
        raise Transport("no Juicebot server reachable:\n  " + "\n  ".join(errors))

    def call(self, name, args):
        try:
            result, _ = rpc(self.url, "tools/call", {"name": name, "arguments": args}, self.sid)
        except SessionGone:
            if self.room:
                raise Transport("room %s is unknown to the server (expired?)" % self.room)
            self.open(fresh=True)  # the server forgot us (idle > 24 h, redeploy): start a new room once
            result, _ = rpc(self.url, "tools/call", {"name": name, "arguments": args}, self.sid)
        return result

    def tools(self):
        result, _ = rpc(self.url, "tools/list", session_id=self.sid)
        return result["tools"]


def print_result(result, as_json):
    if as_json:
        print(json.dumps(result))
    else:
        for c in result.get("content", []):
            if c.get("type") == "text":
                print(c["text"])
        sc = result.get("structuredContent")
        if sc:
            sc = {k: v for k, v in sc.items() if k != "qrPng"}  # a base64 PNG is noise on a terminal
            print("structured: " + json.dumps(sc))
    return 2 if result.get("isError") else 0


def parse_args(argv):
    opts = {"json": False, "room": None, "server": None}
    rest = []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--json":
            opts["json"] = True
        elif a in ("--room", "--server"):
            if i + 1 >= len(argv):
                raise SystemExit("%s needs a value" % a)
            opts[a[2:]] = argv[i + 1]
            i += 1
        elif a.startswith("--"):
            raise SystemExit("unknown option %s" % a)
        else:
            rest.append(a)
        i += 1
    return opts, rest


def main(argv):
    if not argv or argv[0] in ("-h", "--help", "help"):
        print(__doc__.strip())
        return 0
    opts, rest = parse_args(argv)
    cmd, rest = rest[0], rest[1:]
    if cmd == "reset":
        try:
            os.remove(STATE_PATH)
        except OSError:
            pass
        print("session cleared")
        return 0
    s = Session(server=opts["server"], room=opts["room"])
    s.open()
    if cmd == "tools":
        for t in s.tools():
            first = t.get("description", "").split(". ")[0]
            print("%-28s %s" % (t["name"], first[:100]))
        return 0
    if cmd == "url":
        return print_result(s.call("get_juicebox_url", {}), opts["json"])
    if cmd == "status":
        return print_result(s.call("get_server_status", {}), opts["json"])
    if cmd == "join":
        if not rest:
            raise SystemExit("join needs a room id or a join link")
        room = rest[0].split("room=")[-1].split("&")[0].strip("/")
        return print_result(s.call("join_room", {"room": room}), opts["json"])
    if cmd == "call":
        if not rest:
            raise SystemExit("call needs at least one tool name")
        # Pair each tool name with the JSON object that follows it, if any.
        pairs, i = [], 0
        while i < len(rest):
            name, args = rest[i], {}
            if i + 1 < len(rest) and rest[i + 1].lstrip().startswith("{"):
                try:
                    args = json.loads(rest[i + 1])
                except ValueError as e:
                    raise SystemExit("arguments for %s are not valid JSON: %s" % (name, e))
                i += 1
            pairs.append((name, args))
            i += 1
        worst = 0
        for name, args in pairs:
            if len(pairs) > 1 and not opts["json"]:
                print("== " + name)
            code = print_result(s.call(name, args), opts["json"])
            worst = max(worst, code)
            if code and not opts["json"]:
                print("(stopping: %s reported an error)" % name)
                break
        return worst
    raise SystemExit("unknown command %r; try --help" % cmd)


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except Transport as e:
        print("error: %s" % e, file=sys.stderr)
        sys.exit(1)
    except BrokenPipeError:
        sys.exit(0)
