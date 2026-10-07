# Juicebot plugin

Drive the [Juicebox](https://aidenlab.org/juicebox/) Hi-C contact-map viewer from Claude. The plugin registers the Aiden Lab's hosted MCP server (`https://juicebot-mcp.3dg.io/mcp`, Streamable HTTP, no auth, nothing installed locally) and a skill that teaches Claude the workflow: get a join link, open it in a browser, then search, load, navigate, compare and share.

Server source and tool reference: [weiszd/juicebox-mcp](https://github.com/weiszd/juicebox-mcp).

## Install

Paste into Claude Code, Cowork, claude.ai, Codex or ChatGPT:

```
Set up Juicebot for me: fetch https://juicebot-install.3dg.io and follow its instructions for the app you are running in.
```

Manual paths for every client are in the [marketplace README](../../README.md). Quickest by hand: Claude Code `/plugin install juicebot --marketplace aidenlab/plugins` then `/reload-plugins`; Codex `codex plugin marketplace add aidenlab/plugins` then `codex plugin add juicebot@aidenlab`; Claude web/desktop/Cowork: https://juicebot-install.3dg.io/plugins → Add → Add marketplace → `aidenlab/plugins` → Discover → Juicebot → Add, then enable the juicebot connector; ChatGPT adds `https://juicebot-mcp.3dg.io/mcp` as a custom MCP server.

## Try it

> Open Juicebox, load the ENCODE GM12878 in situ Hi-C map, go to the HOXA cluster and add the gene track.

Claude returns a join link; open it in a tab, and you watch the map load, jump to HOXA and gain a gene track.

## Contents

| Path | What |
|---|---|
| `.claude-plugin/plugin.json` | manifest |
| `.mcp.json` | the `juicebot` remote MCP server |
| `skills/juicebot/SKILL.md` | workflow guidance loaded on demand |
