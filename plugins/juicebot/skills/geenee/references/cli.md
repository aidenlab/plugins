# geenee CLI reference

The CLI is an MCP client over plain HTTPS. The Geenee server is stateless Streamable HTTP with no MCP session: every call carries the Room id as its `room` argument, and the CLI fills it in from a small state file. `scripts/geenee.py` (Python 3.8+) and `scripts/geenee.mjs` (Node 18+) are the same program; both use only the standard library.

## Contents

- Commands and options
- Where the script is
- Rooms
- Exit codes and errors
- Troubleshooting
- Changing the server

## Commands and options

```
geenee.py open                                Workspace link for this shell's Room (opens a new Room if none)
geenee.py status                              whether each viewer (Juicebox, IGV) is connected in the Room
geenee.py tools                               tool names with one-line descriptions
geenee.py call TOOL [JSON] [TOOL [JSON] ...]  one or more tool calls in one process, in order; room filled in
geenee.py room [ID_OR_LINK]                   show the current Room id, or switch to another Room
geenee.py reset                               forget the Room; the next command opens a new one
```

Options: `--json` prints each raw result as one JSON object (use it to read `structuredContent`); `--room ID` targets a Room for this invocation only (a Workspace link is accepted too); `--server URL` picks the MCP endpoint for this invocation.

Chain every step that does not depend on reading the previous result. One process means one TLS handshake, and for the model one shell call instead of three:

```bash
python3 scripts/geenee.py call \
  juicebox_load_map '{"url":"https://www.encodeproject.org/files/ENCFF216QQM/@@download/ENCFF216QQM.hic","name":"GM12878 in situ","normalization":"KR","locus":"HOXA1"}' \
  juicebox_load_track '{"url":"genes"}' \
  igv_go_to_gene '{"gene":"HOXA1"}'
```

A chain stops at the first tool that reports an error and exits 2. `call open_geenee` is allowed and behaves like `open`.

## Where the script is

Try in this order; the first that exists wins.

1. `${CLAUDE_PLUGIN_ROOT}/skills/geenee/scripts/geenee.py` (Claude Code sets the variable for plugin skills).
2. The directory this skill was loaded from: `find ~/.claude ~/.codex -path '*geenee/scripts/geenee.py' 2>/dev/null | head -1`.
3. Download: `curl -fsSL https://geenee-install.3dg.io/geenee.py -o geenee.py` (or `/geenee.mjs`).

Use `python3` when present, else `node`. Nothing to install either way.

## Rooms

- The first command calls `open_geenee`, which mints a Room id (10 letters and digits) and returns the Workspace link `https://<server>/?room=<ID>`; the CLI saves `{url, room}` to `~/.local/state/geenee/room.json` (`GEENEE_STATE` overrides). Later commands, in any shell, reuse it, so the Workspace stays the same for the whole conversation.
- A `call` that had to open a new Room prints the Workspace link first, before the tool results: the user has to open it before anything shows.
- `open` returns the link for the current Room (calling `open_geenee` with that Room, which gives the same Workspace back). `status` reports each viewer's connection from `juicebox_get_server_status` and `igv_read_session_summary`; exit 2 when neither is connected.
- `room <id-or-link>` switches to a Room a page already shows or a colleague shared; `room` alone prints the current id.
- A Room expires after a long idle. The server then reports no page or no viewer for it; `reset` (or `open_geenee` without `room`) starts a new one, and the user must open the new link.

## Exit codes and errors

| Code | Meaning | What to do |
|---|---|---|
| 0 | the tool succeeded | report what changed |
| 2 | the tool returned `isError` | read the message; "No page is connected" / "no Viewer is in Room" means re-send the Workspace link and wait for the user; "required when more than one panel" means pass `panel`; "not a Room id" means the saved Room is malformed, `reset` |
| 1 | transport or usage error, message on stderr | see Troubleshooting |

## Troubleshooting

- `HTTP 403 ... Browser Integrity Check`: Cloudflare error 1010 rejects some library User-Agents. The scripts send their own; if you wrote your own client, set any descriptive `User-Agent`.
- `HTTP 406`: the request must accept both `application/json` and `text/event-stream`.
- `HTTP 405`: only `POST /mcp` exists; there is no SSE stream to GET.
- `cannot reach ...` from Node in a sandbox: Node's `fetch` ignores `HTTPS_PROXY` unless `NODE_USE_ENV_PROXY=1`; `geenee.mjs` re-executes itself with it set, so this only affects hand-written code.
- Both scripts fail but `curl` works: run with `--server` and the URL `curl` used, then check `GEENEE_URL`.
- "geenee could not reach the server of the ... viewer": one upstream (igv-bot or Juicebox) is down; the other viewer's tools still work. Try again in a moment.
- The viewers cannot run headless inside an agent sandbox (its proxy refuses WebSocket upgrades). The Workspace is always the user's browser or the assistant's browser pane; only tool calls come from the shell.

## Changing the server

The scripts use `https://geenee-dev.3dg.io/mcp` and remember it with the Room. `GEENEE_URL` or `--server` overrides it. After a server change, `reset`.
