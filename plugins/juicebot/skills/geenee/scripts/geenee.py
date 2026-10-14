#!/usr/bin/env python3
"""geenee.py - call the Geenee MCP server without an MCP connector.

Python 3.8+, standard library only. A sibling geenee.mjs offers the same
commands for machines without Python.

Geenee drives two viewers (the igv genome browser and the Juicebox contact-map
viewer) on one page, the Workspace, identified by a Room id. The first command
opens a Room and remembers it, so later commands in any shell act on the same
Workspace.

Usage:
  geenee.py open                          Workspace link for this shell's Room (opens a new Room if none)
  geenee.py status                        whether each viewer is connected in the Room
  geenee.py tools                         tool names with one-line descriptions
  geenee.py call TOOL [JSON] [TOOL [JSON] ...]
                                          call one or more tools in one process, in order; room is filled in
                                          e.g. call juicebox_load_map '{"url":"https://...hic","locus":"HOXA1"}' juicebox_load_track '{"url":"genes"}'
  geenee.py room [ID_OR_LINK]             show the current Room id, or switch to another Room (a Workspace link works)
  geenee.py reset                         forget the Room; the next command opens a new one

Options:
  --json         print raw tool results (JSON, one object per call) instead of their text
  --room ID      use this Room for this invocation only
  --server URL   MCP endpoint for this invocation (overrides GEENEE_URL and the built-in list)

Environment:
  GEENEE_URL     MCP endpoint, e.g. https://geenee-dev.3dg.io/mcp
  GEENEE_STATE   state file (default: ~/.local/state/geenee/room.json, or $XDG_STATE_HOME)

Exit codes: 0 ok; 2 the tool reported an error (most often: no viewer connected); 1 transport or usage error.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request

# PROFILE names the deployment this copy of the script belongs to ("" for
# production, "dev" on the dev branch). It keeps the state files apart so a
# dev and a production CLI on one machine never share a Room.
PROFILE = "dev"
# Candidate endpoints, tried in order when no Room is known yet. Override with
# --server or GEENEE_URL. The one that answers is remembered with the Room.
SERVERS = [
    "https://geenee-dev.3dg.io/mcp",
]
# A descriptive User-Agent: Cloudflare's Browser Integrity Check (error 1010)
# rejects some library defaults on some hostnames.
USER_AGENT = "geenee-cli-dev/2.0 (+https://github.com/aidenlab/plugins)"
# Viewer acks take up to 15 s and catalogue searches can be slow; 60 s leaves headroom.
TIMEOUT_SECONDS = 60
OPEN_TOOL = "open_geenee"
ROOM_ID = re.compile(r"^[0-9A-HJKMNP-TV-Z]{10}$")

STATE_PATH = os.environ.get("GEENEE_STATE") or os.path.join(
    os.environ.get("XDG_STATE_HOME") or os.path.join(os.path.expanduser("~"), ".local", "state"),
    "geenee", "room%s.json" % ("-" + PROFILE if PROFILE else ""))


class Transport(Exception):
    pass


_next_id = [0]


def rpc(url, method, params):
    """POST one JSON-RPC request; the server is stateless, so no handshake or session header."""
    _next_id[0] += 1
    message = {"jsonrpc": "2.0", "id": _next_id[0], "method": method, "params": params}
    headers = {
        "Content-Type": "application/json",
        # The server rejects requests (406) unless both media types are accepted.
        "Accept": "application/json, text/event-stream",
        "User-Agent": USER_AGENT,
    }
    req = urllib.request.Request(url, data=json.dumps(message).encode(), method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        hint = ""
        if e.code == 403 and "1010" in body:
            hint = " (Cloudflare Browser Integrity Check rejected the request; check the User-Agent)"
        raise Transport("HTTP %d from %s%s" % (e.code, url, hint))
    except (urllib.error.URLError, OSError) as e:
        raise Transport("cannot reach %s: %s" % (url, getattr(e, "reason", e)))
    data = json.loads(raw)
    if "error" in data:
        err = data["error"]
        raise Transport("MCP error %s: %s" % (err.get("code"), err.get("message")))
    return data.get("result")


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


def parse_room(value):
    """A Room id as typed or as part of a Workspace link (…?room=ID); None if it is not one."""
    value = value.strip()
    if "room=" in value:
        value = value.split("room=", 1)[1].split("&")[0].strip("/ ")
    value = value.upper()
    return value if ROOM_ID.match(value) else None


class Session:
    """The server to talk to and the Room to act in."""

    def __init__(self, server=None, room=None):
        self.explicit_server = server or os.environ.get("GEENEE_URL")
        self.explicit_room = room
        self.url = None
        self.room = None
        self.opened = None  # the open_geenee result when this process opened the Room

    def open(self):
        state = load_state()
        self.url = self.explicit_server or (state.get("url") if state.get("url") in SERVERS else None)
        if self.explicit_room:
            self.room = self.explicit_room
            self.url = self.url or self._first_live()
            return
        if state.get("room") and self.url and state.get("url") == self.url:
            self.room = state["room"]
            return
        self.url = self.url or self._first_live()
        self.open_workspace()

    def _first_live(self):
        errors = []
        for candidate in SERVERS:
            try:
                rpc(candidate, "tools/list", {})
                return candidate
            except Transport as e:
                errors.append(str(e))
        raise Transport("no Geenee server reachable:\n  " + "\n  ".join(errors))

    def open_workspace(self, room=None):
        """Call open_geenee (for the known Room, or a new one) and remember the Room."""
        args = {"room": room} if room else {}
        result = rpc(self.url, "tools/call", {"name": OPEN_TOOL, "arguments": args})
        sc = result.get("structuredContent") or {}
        if result.get("isError") or not sc.get("room"):
            raise Transport("open_geenee failed: " + " ".join(c.get("text", "") for c in result.get("content", [])))
        self.room = sc["room"]
        self.opened = result
        save_state({"url": self.url, "room": self.room})
        return result

    def call(self, name, args):
        if name == OPEN_TOOL:
            return self.open_workspace(args.get("room") or self.room)
        args = dict(args)
        args.setdefault("room", self.room)
        return rpc(self.url, "tools/call", {"name": name, "arguments": args})

    def tools(self):
        return rpc(self.url, "tools/list", {})["tools"]


def text_of(result):
    return "\n".join(c["text"] for c in result.get("content", []) if c.get("type") == "text")


def print_result(result, as_json):
    if as_json:
        print(json.dumps(result))
    else:
        text = text_of(result)
        if text:
            print(text)
        sc = result.get("structuredContent")
        if sc:
            sc = {k: v for k, v in sc.items() if k != "qrPng"}  # a base64 PNG is noise on a terminal
            print("structured: " + json.dumps(sc))
    return 2 if result.get("isError") else 0


def print_opened(s, as_json):
    """The Workspace link and Room id, in the shape print_result uses."""
    sc = s.opened["structuredContent"]
    if as_json:
        print(json.dumps({"room": sc["room"], "workspaceUrl": sc["workspaceUrl"]}))
    else:
        print("Geenee link: %s\nRoom id: %s" % (sc["workspaceUrl"], sc["room"]))


def status(s, as_json):
    """Connection state of both viewers, from the tools that change nothing."""
    jb = s.call("juicebox_get_server_status", {})
    igv = s.call("igv_read_session_summary", {})
    jb_ok = "Browser Connected: Yes" in text_of(jb)
    igv_ok = not igv.get("isError")
    if as_json:
        print(json.dumps({"room": s.room, "server": s.url, "juicebox": {"connected": jb_ok, "result": jb},
                          "igv": {"connected": igv_ok, "result": igv}}))
    else:
        print("Room: %s\nServer: %s\nJuicebox: %s\nIGV: %s" % (
            s.room, s.url, "connected" if jb_ok else "not connected", "connected" if igv_ok else "not connected"))
        if not (jb_ok and igv_ok):
            print("(open the Workspace link from `open` in a browser; both viewers connect from that page)")
    return 0 if (jb_ok or igv_ok) else 2


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
    if opts["room"]:
        room = parse_room(opts["room"])
        if not room:
            raise SystemExit("%r is not a Room id (10 letters/digits) or a Workspace link" % opts["room"])
        opts["room"] = room
    return opts, rest


def main(argv):
    if not argv or argv[0] in ("-h", "--help", "help"):
        print(__doc__.strip())
        return 0
    opts, rest = parse_args(argv)
    if not rest:
        raise SystemExit("missing command; try --help")
    cmd, rest = rest[0], rest[1:]
    if cmd == "reset":
        try:
            os.remove(STATE_PATH)
        except OSError:
            pass
        print("room forgotten")
        return 0
    if cmd == "room" and rest:
        room = parse_room(rest[0])
        if not room:
            raise SystemExit("%r is not a Room id or a Workspace link" % rest[0])
        s = Session(server=opts["server"], room=room)
        s.open()
        s.open_workspace(room)  # confirms the server and gets the link for that Room
        print_opened(s, opts["json"])
        return 0
    s = Session(server=opts["server"], room=opts["room"])
    s.open()
    if cmd == "room":
        print(s.room)
        return 0
    if cmd == "open":
        if not s.opened:
            s.open_workspace(s.room)
        print_opened(s, opts["json"])
        return 0
    if cmd == "tools":
        for t in s.tools():
            first = t.get("description", "").split(". ")[0]
            print("%-34s %s" % (t["name"], first[:100]))
        return 0
    if cmd == "status":
        return status(s, opts["json"])
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
        if s.opened and not opts["json"]:
            # This process opened a new Room: the user has to open its link before anything shows.
            print_opened(s, False)
            print("(new Room; open the link in a browser for the viewers to show anything)")
        worst = 0
        for n, (name, args) in enumerate(pairs):
            if len(pairs) > 1 and not opts["json"]:
                print("== " + name)
            code = print_result(s.call(name, args), opts["json"])
            worst = max(worst, code)
            if code and not opts["json"]:
                if n + 1 < len(pairs):
                    print("(stopping: %s reported an error; %d call(s) not sent)" % (name, len(pairs) - n - 1))
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
