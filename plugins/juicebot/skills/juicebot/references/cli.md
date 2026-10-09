# juicebot CLI reference

The CLI is an MCP client over plain HTTPS. The JuiceBot server is stateless Streamable HTTP, so a "session" is only a header, and the session id is also the Juicebox room id. `scripts/juicebot.py` (Python 3.8+) and `scripts/juicebot.mjs` (Node 18+) are the same program; both use only the standard library.

## Contents

- Commands and options
- Where the script is
- Sessions and rooms
- Exit codes and errors
- Troubleshooting
- Changing the server

## Commands and options

```
juicebot.py url                               join link for this session's room (starts a session if needed)
juicebot.py status                            server status; "Browser Connected: Yes" means a page is live
juicebot.py tools                             tool names with one-line descriptions
juicebot.py call TOOL [JSON] [TOOL [JSON] ...]  one or more tool calls in one process, in order
juicebot.py join ROOM_OR_JOIN_LINK            bind this session to an existing room
juicebot.py reset                             forget the session; the next command starts a new room
```

Options: `--json` prints each raw result as one JSON object (use it to read `structuredContent`); `--room ID` targets a room for this invocation only; `--server URL` picks the MCP endpoint for this invocation.

Chain every step that does not depend on reading the previous result. One process means one TLS handshake, and for the model one shell call instead of three:

```bash
python3 scripts/juicebot.py call \
  load_map '{"url":"https://www.encodeproject.org/files/ENCFF216QQM/@@download/ENCFF216QQM.hic","name":"GM12878 in situ","normalization":"KR","locus":"HOXA1"}' \
  load_track '{"url":"genes"}' \
  list_panels
```

A chain stops at the first tool that reports an error and exits 2.

## Where the script is

Try in this order; the first that exists wins.

1. `${CLAUDE_PLUGIN_ROOT}/skills/juicebot/scripts/juicebot.py` (Claude Code sets the variable for plugin skills).
2. The directory this skill was loaded from: `find ~/.claude ~/.codex -path '*juicebot/scripts/juicebot.py' 2>/dev/null | head -1`.
3. Download: `curl -fsSL https://juicebot-install.3dg.io/juicebot.py -o juicebot.py` (or `/juicebot.mjs`).

Use `python3` when present, else `node`. Nothing to install either way.

## Sessions and rooms

- The first command creates a session and saves `{url, sid}` to `~/.local/state/juicebot/session.json` (`JUICEBOT_STATE` overrides). Later commands, in any shell, reuse it, so the room stays the same for the whole conversation.
- `url` returns the join link for that room. The user opens it; `status` then reports `Browser Connected: Yes`.
- `join <link>` binds the session to a room a page already started (its "Start room" link) or a colleague shared.
- Rooms expire after 24 h idle. If the server has forgotten the session, the CLI starts a new one automatically; the user must then open the new join link.
- `reset` deliberately starts over.

## Exit codes and errors

| Code | Meaning | What to do |
|---|---|---|
| 0 | the tool succeeded | report what changed |
| 2 | the tool returned `isError` | read the message; "No page is connected" means re-send the join link and wait for the user; "required when more than one panel" means pass `panel` |
| 1 | transport or usage error, message on stderr | see Troubleshooting |

## Troubleshooting

- `HTTP 403 ... Browser Integrity Check`: Cloudflare error 1010 rejects some library User-Agents (Python's default is one). The scripts send their own; if you wrote your own client, set any descriptive `User-Agent`.
- `HTTP 406`: the request must accept both `application/json` and `text/event-stream`.
- `cannot reach ...` from Node in a sandbox: Node's `fetch` ignores `HTTPS_PROXY` unless `NODE_USE_ENV_PROXY=1`; `juicebot.mjs` re-executes itself with it set, so this only affects hand-written code.
- Both scripts fail but `curl` works: run with `--server` and the URL `curl` used, then check `JUICEBOT_URL`.
- The viewer cannot run headless inside an agent sandbox (its proxy refuses WebSocket upgrades). The viewer is always the user's browser or the assistant's browser pane; only tool calls come from the shell.

## Changing the server

The scripts try `https://juicebot-mcp.3dg.io/mcp` and then the frozen demo `https://juicebox-mcp-v2.aidenlab.workers.dev/mcp`, and remember the first that answers. `JUICEBOT_URL` or `--server` overrides both (for example the dev stack `https://juicebot-mcp-dev.3dg.io/mcp`). After a server change, `reset`.
