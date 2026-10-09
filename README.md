# Aiden Lab plugins

> **Dev branch.** Everything here points at the Juicebot *dev* stack (`juicebot-mcp-dev.3dg.io`, page `juicebot-dev.3dg.io`). Production is on `main`.

Plugins from [the Aiden Lab](https://aidenlab.org) for Claude, ChatGPT and Codex. One marketplace, `aidenlab/plugins`, in both the Claude Code and the OpenAI Agent Plugins layouts.

| Plugin | What it does |
|---|---|
| [`juicebot`](plugins/juicebot) | Drive the [Juicebox](https://aidenlab.org/juicebox/) Hi-C contact-map viewer by chatting: search ENCODE/4DN, load maps and tracks, navigate loci, compare panels, share sessions. Hosted MCP server, nothing runs locally. The skill bundles a dependency-free CLI (Python or Node) that calls the same server over HTTPS, so it works in Claude Code, Cowork and Codex even when the MCP connector is not set up. |

## Install JuiceBot: paste one line

Paste this into Claude Code, Cowork, claude.ai, Codex or ChatGPT:

```
Set up JuiceBot for me: fetch https://juicebot-install-dev.3dg.io and follow its instructions for the app you are running in.
```

The assistant reads [`INSTALL-PROMPT.md`](INSTALL-PROMPT.md), works out which app it is in, installs what it can itself (Claude Code, Codex), walks you through the three clicks it cannot do (Claude's account-level plugin page, ChatGPT's custom MCP server), then hands you the first message for a new chat: Juicebox opens, loads a GM12878 map at HOXA and adds a gene track so you can see it working. If the short link is down, use `https://raw.githubusercontent.com/aidenlab/plugins/main/INSTALL-PROMPT.md` instead.

## Manual install

JuiceBot has two halves: the **MCP server** (the tools) and the **skill** (how the assistant uses them). The server sends its core workflow to every client on connect, so tools alone are enough to work; the plugin adds the fuller skill.

With the plugin installed but no connector, the skill falls back to `skills/juicebot/scripts/juicebot.py` (or `.mjs`): the same tools by name over plain HTTPS, several per shell call (`call load_map '{…}' load_track '{"url":"genes"}'`). Only the viewer must be a real browser.

**Claude — web, desktop Chat, Cowork (one account-level setup).** Plugins and marketplaces live on your Claude account and follow you to every surface, Claude Code included.

1. Open **https://claude.ai/new#settings/customize-plugins** in a separate tab or window (in the app: **Customize → Plugins**, in Cowork open the Cowork tab first). **Add → Add marketplace → Add from a repository** → `aidenlab/plugins`. The Discover tab opens; find **JuiceBot → Add**.
2. On the plugin's **Manage** page turn on the **JuiceBot-dev** server. If there is no switch, **Customize → Connectors** → enable **JuiceBot-dev**; failing that, **Settings → Connectors → Add custom connector**, name `JuiceBot-dev`, URL `https://juicebot-mcp-dev.3dg.io/mcp`, no auth. Team/Enterprise admins can add that connector once for everyone.

Start a new conversation and the tools are there. Paid plans only (Pro, Max, Team, Enterprise).

**Claude Code** — picks up the account install above on next start (`/login` forces it). Standalone: `/plugin install juicebot-dev --marketplace aidenlab/plugins#dev` then `/reload-plugins`; from a terminal `claude plugin install juicebot-dev --marketplace aidenlab/plugins#dev`. The plugin bundles the server.

**Codex** — `codex plugin marketplace add aidenlab/plugins --ref dev`, then `codex plugin add juicebot-dev@aidenlab-dev`. `codex mcp list` shows the `JuiceBot-dev` server; start a new chat.

**ChatGPT** — [chatgpt.com/plugins](https://chatgpt.com/plugins) → **+** → **Add custom MCP server**, name `JuiceBot-dev`, the URL above, authentication **None** (Pro, Team, Enterprise or Edu plans). Enable it in a new chat.

**Other MCP clients** (Cursor, stdio-only tools) — point them at the URL; bridge stdio-only clients with `npx -y mcp-remote https://juicebot-mcp-dev.3dg.io/mcp`.

## First run

> Open Juicebox, load the ENCODE GM12878 in situ Hi-C map, go to the HOXA cluster and add the gene track.

You get a join link. Open it in a browser tab: the map loads, the view jumps to HOXA, and a RefSeq gene track appears under the map. Every later command updates that tab. The join link is live and shared (everyone in the room follows along); "create a link I can share" makes a snapshot that preserves the current view.

## Directory listing (one-click install, no marketplace)

Plugins listed in Anthropic's community directory appear in Cowork's **Discover** tab and in the claude.ai plugin catalog, so any Cowork session can offer an install card and nobody has to add a marketplace. Submit at [claude.ai/admin-settings/directory/submissions/plugins/new](https://claude.ai/admin-settings/directory/submissions/plugins/new) (Team/Enterprise owner) or [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit); run `claude plugin validate ./plugins/juicebot` first. ChatGPT has the equivalent "With MCP" submission for the remote server. Until listed, users add the `aidenlab/plugins` marketplace once as above.

## For the whole organization (admins)

1. **Connector:** add `https://juicebot-mcp-dev.3dg.io/mcp` as an organization connector (Claude Team/Enterprise; ChatGPT workspace admins can publish the plugin to the workspace). Members get the tools with no setup.
2. **Plugin:** Claude: Organization settings → Plugins & skills → Marketplaces → Add plugins → Sync from GitHub (needs a *private or internal* mirror with the Claude GitHub App) or upload the release's `juicebot.plugin` as a ZIP. See [Manage plugins for your organization](https://support.claude.com/en/articles/13837433-manage-plugins-for-your-organization).

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
  skills/juicebot/scripts/          juicebot.py / juicebot.mjs: the connector-free CLI
  skills/juicebot/references/       tools.md (generated from tools/list), cli.md
  assets/                           icon.svg (source: make_icon.py), icon.png 512, icon-128.png — used by the OpenAI
                                    manifest and the directory submission form; claude.ai strips an `icon` key from plugin.json
INSTALL-PROMPT.md                   what the one-line prompt fetches
install-worker/                     Cloudflare Worker serving it at juicebot-install-dev.3dg.io
scripts/package.sh                  builds dist/juicebot.plugin
```

- Change the server URL in both `plugins/juicebot/.mcp.json` and `plugins/juicebot/mcp.json`.
- Bump `version` in all four manifests when anything changes; users on an older version stay there until they update (`/plugin marketplace update aidenlab` + `/plugin update juicebot-dev@aidenlab-dev` in Claude Code; `codex plugin marketplace upgrade aidenlab` in Codex).
- Validate: `claude plugin validate . && claude plugin validate ./plugins/juicebot`; `codex plugin marketplace add ./ && codex plugin add juicebot-dev@aidenlab-dev`.
- CLI smoke test against the live server: `scripts/test-cli.sh`. Regenerate `references/tools.md` after a tool change (it mirrors `tools/list`).
- The MCP endpoint is `https://juicebot-mcp-dev.3dg.io/mcp`, the Juicebot dev stack (Worker `juicebot-mcp-dev`, page `juicebot-dev.3dg.io`). The dev CLIs have no fallback server.
- Tagging `v*` runs the release workflow, which attaches `juicebot.plugin` to the GitHub release.

Server source: [weiszd/juicebox-mcp](https://github.com/weiszd/juicebox-mcp). License: MIT.
