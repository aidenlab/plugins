# Aiden Lab plugins

> **Dev branch.** This is the `-dev` build of the plugin (`juicebot-dev@aidenlab-dev`, server name `Geenee-dev`), installable beside the production one. Production is on `main`.

Plugins from [the Aiden Lab](https://aidenlab.org) for Claude, ChatGPT and Codex. One marketplace, `aidenlab/plugins`, in both the Claude Code and the OpenAI Agent Plugins layouts.

| Plugin | What it does |
|---|---|
| [`juicebot`](plugins/juicebot) (display name **Geenee**) | Drive [Geenee](https://github.com/aidenlab/geenee), a genome workspace holding the [igv](https://igv.org) genome browser and the [Juicebox](https://aidenlab.org/juicebox/) Hi-C contact-map viewer side by side, by chatting: search ENCODE/4DN, load maps and tracks, navigate genes and loci, compare, share. Hosted MCP server, nothing runs locally. The skill bundles a dependency-free CLI (Python or Node) that calls the same server over HTTPS, so it works in Claude Code, Cowork and Codex even when the MCP connector is not set up. |

The plugin was called **JuiceBot** up to version 1.3 and drove Juicebox alone. Version 2.0 is the same plugin id (`juicebot`), so an existing install upgrades in place and then talks to Geenee; see [Upgrading from JuiceBot](#upgrading-from-juicebot).

## Install Geenee: paste one line

Paste this into Claude Code, Cowork, claude.ai, Codex or ChatGPT:

```
Set up Geenee (dev) for me: fetch https://geenee-install-dev.3dg.io and follow its instructions for the app you are running in.
```

The assistant reads [`INSTALL-PROMPT.md`](INSTALL-PROMPT.md), works out which app it is in, installs what it can itself (Claude Code, Codex), walks you through the three clicks it cannot do (Claude's account-level plugin page, ChatGPT's custom MCP server), then hands you the first message for a new chat: Geenee opens, Juicebox loads a GM12878 map at HOXA with the gene track, IGV goes to HOXA1 with a CTCF track. If the short link is down, use `https://raw.githubusercontent.com/aidenlab/plugins/main/INSTALL-PROMPT.md` instead.

## Manual install

Geenee has two halves: the **MCP server** (the tools: `open_geenee`, `igv_*`, `juicebox_*`) and the **skill** (how the assistant uses them). The server sends its core workflow to every client on connect, so tools alone are enough to work; the plugin adds the fuller skill.

With the plugin installed but no connector, the skill falls back to `skills/geenee/scripts/geenee.py` (or `.mjs`): the same tools by name over plain HTTPS, several per shell call (`call juicebox_load_map '{…}' juicebox_load_track '{"url":"genes"}'`), with the Room id filled in. Only the viewers must be a real browser.

**Claude — web, desktop Chat, Cowork (one account-level setup).** Plugins and marketplaces live on your Claude account and follow you to every surface, Claude Code included.

1. Open **https://claude.ai/new#settings/customize-plugins** in a separate tab or window (in the app: **Customize → Plugins**, in Cowork open the Cowork tab first). **Add → Add marketplace → Add from a repository** → `aidenlab/plugins`. The Discover tab opens; find **Geenee → Add**.
2. On the plugin's **Manage** page turn on the **Geenee-dev** server. If there is no switch, **Customize → Connectors** → enable **Geenee-dev**; failing that, **Settings → Connectors → Add custom connector**, name `Geenee-dev`, URL `https://geenee-dev.3dg.io/mcp`, no auth. Team/Enterprise admins can add that connector once for everyone.

Start a new conversation and the tools are there. Paid plans only (Pro, Max, Team, Enterprise).

**Claude Code** — picks up the account install above on next start (`/login` forces it). Standalone: `/plugin install juicebot-dev --marketplace aidenlab/plugins#dev` then `/reload-plugins`; from a terminal `claude plugin install juicebot-dev --marketplace aidenlab/plugins#dev`. The plugin bundles the server.

**Codex** — `codex plugin marketplace add aidenlab/plugins --ref dev`, then `codex plugin add juicebot-dev@aidenlab-dev`. `codex mcp list` shows the `Geenee-dev` server; start a new chat.

**ChatGPT** — [chatgpt.com/plugins](https://chatgpt.com/plugins) → **+** → **Add custom MCP server**, name `Geenee-dev`, the URL above, authentication **None**. Enable it in a new chat.

**Other MCP clients** (Cursor, stdio-only tools) — point them at the URL; bridge stdio-only clients with `npx -y mcp-remote https://geenee-dev.3dg.io/mcp`.

## Upgrading from JuiceBot

The plugin id did not change, so nothing has to be reinstalled.

- **Claude Code**: `/plugin marketplace update aidenlab-dev` then `/plugin update juicebot-dev@aidenlab-dev` (or turn on auto-update for the marketplace under `/plugin` → Marketplaces). The bundled server is now Geenee.
- **claude.ai / desktop / Cowork**: on the plugin's **Manage** page take the update, turn on the **Geenee-dev** server and turn off **JuiceBot**. If JuiceBot was added as a custom connector, add **Geenee** the same way and disable JuiceBot.
- **Codex**: `codex plugin marketplace upgrade aidenlab-dev`.
- **ChatGPT**: add the Geenee custom MCP server; remove JuiceBot.

The old server (`juicebot-mcp.3dg.io`) keeps running: Geenee forwards Juicebox commands to it.

## First run

> Open Geenee. In Juicebox, load the ENCODE GM12878 in situ Hi-C map at the HOXA cluster and add the gene track. In IGV, go to HOXA1 and add the GM12878 CTCF ChIP-seq track.

You get a Geenee link. Open it in a browser tab: the page has an **IGV** tab and a **Juicebox** tab, and the assistant drives both. Every later command updates that tab; the page switches to the viewer that was last driven. The Geenee link is live and shared (everyone in the Room follows along); "create a link I can share" makes a snapshot of one viewer that preserves the current view.

## Directory listing (one-click install, no marketplace)

Plugins listed in Anthropic's community directory appear in Cowork's **Discover** tab and in the claude.ai plugin catalog, so any Cowork session can offer an install card and nobody has to add a marketplace. Submit at [claude.ai/admin-settings/directory/submissions/plugins/new](https://claude.ai/admin-settings/directory/submissions/plugins/new) (Team/Enterprise owner) or [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit); run `claude plugin validate ./plugins/juicebot` first. ChatGPT has the equivalent "With MCP" submission for the remote server. Until listed, users add the `aidenlab/plugins` marketplace once as above.

## For the whole organization (admins)

1. **Connector:** add `https://geenee-dev.3dg.io/mcp` as an organization connector named Geenee (Claude Team/Enterprise; ChatGPT workspace admins can publish the plugin to the workspace). Members get the tools with no setup.
2. **Plugin:** Claude: Organization settings → Plugins & skills → Marketplaces → Add plugins → Sync from GitHub (needs a *private or internal* mirror with the Claude GitHub App) or upload the release's `juicebot.plugin` as a ZIP. See [Manage plugins for your organization](https://support.claude.com/en/articles/13837433-manage-plugins-for-your-organization).

## Layout and maintenance

```
.claude-plugin/marketplace.json     Claude Code marketplace catalog
.agents/plugins/marketplace.json    OpenAI (ChatGPT/Codex) marketplace catalog
plugins/juicebot/                   the Geenee plugin (id kept as juicebot, see above)
  .claude-plugin/plugin.json        Claude manifest
  .mcp.json                         Claude MCP server (type: http)
  plugin.json                       portable Agent Plugins manifest (ChatGPT/Codex)
  mcp.json                          portable MCP server (type: streamable-http)
  skills/geenee/SKILL.md            the skill, shared by all
  skills/geenee/scripts/            geenee.py / geenee.mjs: the connector-free CLI
  skills/geenee/references/         tools.md (generated from tools/list), cli.md
  assets/                           icon.svg (source: make_icon.py), icon.png 512, icon-128.png — used by the OpenAI
                                    manifest and the directory submission form; claude.ai strips an `icon` key from plugin.json
INSTALL-PROMPT.md                   what the one-line prompt fetches
install-worker/                     Cloudflare Worker serving it at geenee-install-dev.3dg.io (and juicebot-install-dev.3dg.io)
scripts/gen-tools-md.py             regenerates references/tools.md from the live server
scripts/package.sh                  builds dist/juicebot.plugin
scripts/make-dev.sh                 turns a checkout of main into the dev branch
```

- Change the server URL in both `plugins/juicebot/.mcp.json` and `plugins/juicebot/mcp.json`, in `SERVERS` of both CLI scripts, and in the docs.
- Bump `version` in all four manifests when anything changes; users on an older version stay there until they update (`/plugin marketplace update aidenlab-dev` + `/plugin update juicebot-dev@aidenlab-dev` in Claude Code; `codex plugin marketplace upgrade aidenlab-dev` in Codex). Never change the plugin `name`: it is the install id, and a rename breaks every existing install.
- Validate: `claude plugin validate . && claude plugin validate ./plugins/juicebot`; `codex plugin marketplace add ./ && codex plugin add juicebot-dev@aidenlab-dev`.
- CLI smoke test against the live server: `scripts/test-cli.sh`. Regenerate `references/tools.md` after a tool change: `scripts/gen-tools-md.py`.
- The MCP endpoint is `https://geenee-dev.3dg.io/mcp`, Geenee's development deployment (it forwards to the igv-bot and Juicebox dev servers). It will move to a production hostname without changing anything but the URL here.
- Tagging `v*` runs the release workflow, which attaches `juicebot.plugin` to the GitHub release.

Server source: [aidenlab/geenee](https://github.com/aidenlab/geenee) (forwarding to [aidenlab/igvjs-mcp](https://github.com/aidenlab/igvjs-mcp) and [weiszd/juicebox-mcp](https://github.com/weiszd/juicebox-mcp)). License: MIT.
