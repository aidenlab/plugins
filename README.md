# Aiden Lab Claude plugins

A Claude plugin marketplace from [the Aiden Lab](https://aidenlab.org). Add it once; install plugins from it in Claude Code or in Claude's desktop app (Cowork).

| Plugin | What it does |
|---|---|
| [`juicebot`](plugins/juicebot) | Drive the [Juicebox](https://aidenlab.org/juicebox/) Hi-C contact-map viewer from Claude: search ENCODE/4DN, load maps and tracks, navigate loci, compare panels, share sessions. Hosted MCP server, nothing runs locally. |

## Install Juicebot

Juicebot has two halves, and where you use Claude decides how each one gets there:

| | Tools (the MCP server) | Skill (how Claude uses them) |
|---|---|---|
| **Claude Code** | bundled in the plugin, or from your claude.ai connector | plugin |
| **Cowork / Claude desktop app** | claude.ai connector (Cowork does not start plugin MCP servers) | plugin |
| **claude.ai chat** | claude.ai connector | — |

So: **everyone on claude.ai adds the connector once** (step 1) and **installs the plugin for the skill** (step 2). Claude Code users who sign in with an API key instead of a claude.ai account skip step 1; the plugin brings its own copy of the server.

### 1. Add the connector (claude.ai, Cowork, and it syncs into Claude Code)

**Settings → Connectors → Add custom connector**, name `Juicebot`, URL

```
https://juicebox-mcp-v2.aidenlab.workers.dev/mcp
```

No authentication. Connectors added in claude.ai are available in Cowork and are fetched automatically by Claude Code whenever it is signed in with the same claude.ai account. On Team and Enterprise plans an **admin adds it once as an organization connector** and every member gets it with no setup.

### 2. Install the plugin (the skill)

**Claude Code** — one line, in a session:

```
/plugin install juicebot --marketplace aidenlab/plugins
```

then `/reload-plugins` so the new plugin's skill and server attach to the running session (a fresh session picks them up by itself). From a terminal instead: `claude plugin install juicebot --marketplace aidenlab/plugins`, which applies to the next session. Two-step equivalent: `/plugin marketplace add aidenlab/plugins`, then `/plugin install juicebot@aidenlab`.

**Cowork / Claude desktop app**

1. Open the **Cowork** tab, then **Customize** in the left sidebar → **Plugins**.
2. **Add** → **Add marketplace** → **Add from a repository** → enter `aidenlab/plugins`.
3. Open **Discover**, pick **Juicebot**, click **Add**.

No marketplace? Download [`juicebot.plugin`](../../releases/latest) from the latest release and use **Customize → Plugins → Add → Upload plugin**. Plugins installed here sync to Claude Code when you sign in with the same Claude account.

If you have both the connector and the plugin in Claude Code you will see the Juicebot tools twice (`claude.ai Juicebot` and `plugin:juicebot`). Harmless; `/mcp` toggles either one off per project.

### Other MCP clients (ChatGPT, Cursor, stdio-only)

Point them at `https://juicebox-mcp-v2.aidenlab.workers.dev/mcp` (Streamable HTTP, no auth). Bridge stdio-only clients with `npx -y mcp-remote https://juicebox-mcp-v2.aidenlab.workers.dev/mcp`.

### Let Claude do it

Paste the prompt in [`INSTALL-PROMPT.md`](INSTALL-PROMPT.md) into Claude Code or Cowork; it runs the plugin steps for you and walks you through the connector.

## First run

> Open Juicebox, load the ENCODE GM12878 in situ Hi-C map, go to the HOXA cluster and add the gene track.

Claude replies with a join link. Open it in a browser tab: the map loads, the view jumps to HOXA, and a RefSeq gene track appears under the map, so you can see each command land. Every later command updates that same tab.

## For the whole organization (admins)

Two admin actions make Juicebot zero-setup for everyone on a Team/Enterprise plan:

1. **Connector:** Organization settings → Connectors → add `https://juicebox-mcp-v2.aidenlab.workers.dev/mcp` as an organization connector. Members get the tools in claude.ai, Cowork and Claude Code.
2. **Plugin:** Organization settings → **Plugins & skills → Marketplaces → Add plugins → Sync from GitHub**. That path requires a *private or internal* repository with the Claude GitHub App installed, so mirror this repo privately (or fork it) for org-wide push; or upload `juicebot.plugin` as a ZIP there. See [Manage plugins for your organization](https://support.claude.com/en/articles/13837433-manage-plugins-for-your-organization).

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
