# Aiden Lab plugins

Plugins from [the Aiden Lab](https://aidenlab.org) for Claude, ChatGPT and Codex. One marketplace, `aidenlab/plugins`, in both the Claude Code and the OpenAI Agent Plugins layouts.

| Plugin | What it does |
|---|---|
| [`juicebot`](plugins/juicebot) | Drive the [Juicebox](https://aidenlab.org/juicebox/) Hi-C contact-map viewer by chatting: search ENCODE/4DN, load maps and tracks, navigate loci, compare panels, share sessions. Hosted MCP server, nothing runs locally. |

## Install Juicebot: paste one line

Paste this into Claude Code, Cowork, claude.ai, Codex or ChatGPT:

```
Set up Juicebot for me: fetch https://juicebot-install.3dg.io and follow its instructions for the app you are running in.
```

The assistant reads [`INSTALL-PROMPT.md`](INSTALL-PROMPT.md), works out which app it is in, installs what it can itself, walks you through the one or two clicks it cannot do, then opens Juicebox, loads a GM12878 map at HOXA and adds a gene track so you can see it working. If the short link is down, use `https://raw.githubusercontent.com/aidenlab/plugins/main/INSTALL-PROMPT.md` instead.

## Manual install

Juicebot has two halves: the **MCP server** (the tools) and the **skill** (how the assistant uses them). The server also sends its core workflow to every client on connect, so tools alone are enough to work; the plugin adds the fuller skill.

| App | Tools | Skill |
|---|---|---|
| Claude Code | plugin (bundled) or claude.ai connector | plugin |
| Cowork / Claude desktop | claude.ai connector | plugin |
| claude.ai chat | claude.ai connector | — |
| Codex | plugin (bundled) | plugin |
| ChatGPT | custom MCP server | — |

**Claude Code** — in a session: `/plugin install juicebot --marketplace aidenlab/plugins`, then `/reload-plugins`. From a terminal: `claude plugin install juicebot --marketplace aidenlab/plugins` (applies to the next session).

**Cowork / Claude desktop app** — Cowork does not start plugin MCP servers, so add the server as a connector: **Settings → Connectors → Add custom connector**, name `Juicebot`, URL `https://juicebox-mcp-v2.aidenlab.workers.dev/mcp`, no auth (on Team/Enterprise an admin adds it once as an organization connector; it then also appears in everyone's Claude Code). For the skill: **Cowork tab → Customize → Plugins → Add → Add marketplace → Add from a repository → `aidenlab/plugins` → Discover → Juicebot → Add**, or upload [`juicebot.plugin`](../../releases/latest) via **Add → Upload plugin**.

**claude.ai chat** — the connector above; no plugin.

**Codex** — `codex plugin marketplace add aidenlab/plugins`, then `codex plugin add juicebot@aidenlab`. `codex mcp list` shows the `juicebot` server; start a new chat.

**ChatGPT** — [chatgpt.com/plugins](https://chatgpt.com/plugins) → **+** → **Add custom MCP server**, name `Juicebot`, the URL above, authentication **None** (Pro, Team, Enterprise or Edu plans). Enable it in a new chat.

**Other MCP clients** (Cursor, stdio-only tools) — point them at the URL; bridge stdio-only clients with `npx -y mcp-remote https://juicebox-mcp-v2.aidenlab.workers.dev/mcp`.

## First run

> Open Juicebox, load the ENCODE GM12878 in situ Hi-C map, go to the HOXA cluster and add the gene track.

You get a join link. Open it in a browser tab: the map loads, the view jumps to HOXA, and a RefSeq gene track appears under the map. Every later command updates that tab. The join link is live and shared (everyone in the room follows along); "create a link I can share" makes a snapshot that preserves the current view.

## For the whole organization (admins)

1. **Connector:** add `https://juicebox-mcp-v2.aidenlab.workers.dev/mcp` as an organization connector (Claude Team/Enterprise; ChatGPT workspace admins can publish the plugin to the workspace). Members get the tools with no setup.
2. **Plugin:** Claude: Organization settings → Plugins & skills → Marketplaces → Add plugins → Sync from GitHub (needs a *private or internal* mirror with the Claude GitHub App) or upload `juicebot.plugin` as a ZIP. See [Manage plugins for your organization](https://support.claude.com/en/articles/13837433-manage-plugins-for-your-organization).

## Layout and maintenance

```
.claude-plugin/marketplace.json     Claude Code marketplace catalog
.agents/plugins/marketplace.json    OpenAI (ChatGPT/Codex) marketplace catalog
plugins/juicebot/
  .claude-plugin/plugin.json        Claude manifest
  .mcp.json                         Claude MCP server (type: http)
  plugin.json                       portable Agent Plugins manifest (ChatGPT/Codex)
  mcp.json                          portable MCP server (type: streamable-http)
  skills/juicebot/SKILL.md          the skill, shared by all
INSTALL-PROMPT.md                   what the one-line prompt fetches
install-worker/                     Cloudflare Worker serving it at juicebot-install.3dg.io
scripts/package.sh                  builds dist/juicebot.plugin
```

- Change the server URL in both `plugins/juicebot/.mcp.json` and `plugins/juicebot/mcp.json`.
- Bump `version` in all four manifests when anything changes; users on an older version stay there until they update (`/plugin marketplace update aidenlab` + `/plugin update juicebot@aidenlab` in Claude Code; `codex plugin marketplace upgrade aidenlab` in Codex).
- Validate: `claude plugin validate . && claude plugin validate ./plugins/juicebot`; `codex plugin marketplace add ./ && codex plugin add juicebot@aidenlab`.
- Tagging `v*` runs the release workflow, which attaches `juicebot.plugin` to the GitHub release.

Server source: [weiszd/juicebox-mcp](https://github.com/weiszd/juicebox-mcp). License: MIT.
