# Aiden Lab Claude plugins

A Claude plugin marketplace from [the Aiden Lab](https://aidenlab.org). Add it once; install plugins from it in Claude Code or in Claude's desktop app (Cowork).

| Plugin | What it does |
|---|---|
| [`juicebot`](plugins/juicebot) | Drive the [Juicebox](https://aidenlab.org/juicebox/) Hi-C contact-map viewer from Claude: search ENCODE/4DN, load maps and tracks, navigate loci, compare panels, share sessions. Hosted MCP server, nothing runs locally. |

## Install Juicebot

### Claude Code — one line

Paste into a Claude Code session:

```
/plugin install juicebot --marketplace aidenlab/claude-plugins
```

or from a terminal:

```bash
claude plugin install juicebot --marketplace aidenlab/claude-plugins
```

That adds the marketplace and installs the plugin in one step. Restart Claude Code (or `/mcp` → reconnect) and the `juicebot` tools appear. Two-step equivalent: `/plugin marketplace add aidenlab/claude-plugins`, then `/plugin install juicebot@aidenlab`.

### Claude desktop app (Cowork)

1. Open the **Cowork** tab, then **Customize** in the left sidebar → **Plugins**.
2. **Add** → **Add marketplace** → **Add from a repository** → enter `aidenlab/claude-plugins`.
3. Open **Discover**, pick **Juicebot**, click **Add**.

Plugins installed here sync to Claude Code when you sign in with the same Claude account.

No marketplace? Download [`juicebot.plugin`](../../releases/latest) from the latest release and use **Customize → Plugins → Add → Upload plugin**.

### Claude.ai chat / Claude Desktop (no plugin needed)

Settings → Connectors → **Add custom connector**, URL `https://juicebox-mcp-v2.aidenlab.workers.dev/mcp`. You get the tools but not the skill.

### Other MCP clients (ChatGPT, Cursor, stdio-only)

Point them at `https://juicebox-mcp-v2.aidenlab.workers.dev/mcp` (Streamable HTTP, no auth). Bridge stdio-only clients with `npx -y mcp-remote https://juicebox-mcp-v2.aidenlab.workers.dev/mcp`.

### Let Claude do it

Paste the prompt in [`INSTALL-PROMPT.md`](INSTALL-PROMPT.md) into Claude Code or Cowork; it runs the steps above for you.

## First run

> Open Juicebox, load the ENCODE GM12878 in situ Hi-C map and go to the HOXA cluster.

Claude replies with a join link. Open it in a browser tab; the map loads there and every later command updates that tab.

## For the whole organization (admins)

Org admins can distribute plugins to everyone on a Team/Enterprise plan from **Organization settings → Plugins & skills → Marketplaces → Add plugins → Sync from GitHub**. That path requires a *private or internal* repository with the Claude GitHub App installed, so mirror this repo privately (or fork it) for org-wide push. Alternatively upload `juicebot.plugin` as a ZIP there. See [Manage plugins for your organization](https://support.claude.com/en/articles/13837433-manage-plugins-for-your-organization).

## Maintaining

```
.claude-plugin/marketplace.json   # the catalog: one entry per plugin
plugins/juicebot/                 # plugin.json, .mcp.json, skills/juicebot/SKILL.md
scripts/package.sh                # builds dist/juicebot.plugin for upload installs
```

- Change the server URL in `plugins/juicebot/.mcp.json`.
- Bump `version` in both `plugins/juicebot/.claude-plugin/plugin.json` and the marketplace entry when you change anything; users on an older version stay there until they update.
- Validate: `claude plugin validate ./plugins/juicebot` and `claude plugin validate .`
- Users refresh with `/plugin marketplace update aidenlab`.
- Tagging `v*` runs the release workflow, which attaches `juicebot.plugin` to the GitHub release.

Server source: [weiszd/juicebox-mcp](https://github.com/weiszd/juicebox-mcp). License: MIT.
