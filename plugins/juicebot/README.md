# Juicebot plugin

Drive the [Juicebox](https://aidenlab.org/juicebox/) Hi-C contact-map viewer from Claude. The plugin registers the Aiden Lab's hosted MCP server (`https://juicebox-mcp-v2.aidenlab.workers.dev/mcp`, Streamable HTTP, no auth, nothing installed locally) and a skill that teaches Claude the workflow: get a join link, open it in a browser, then search, load, navigate, compare and share.

Server source and tool reference: [weiszd/juicebox-mcp](https://github.com/weiszd/juicebox-mcp).

## Install

See the [marketplace README](../../README.md) for all clients. Quickest, in Claude Code:

```
/plugin install juicebot --marketplace aidenlab/plugins
/reload-plugins
```

In Cowork and claude.ai the tools come from a connector (Settings → Connectors → Add custom connector → `https://juicebox-mcp-v2.aidenlab.workers.dev/mcp`); the plugin adds the skill.

## Try it

> Open Juicebox, load the ENCODE GM12878 in situ Hi-C map, go to the HOXA cluster and add the gene track.

Claude returns a join link; open it in a tab, and you watch the map load, jump to HOXA and gain a gene track.

## Contents

| Path | What |
|---|---|
| `.claude-plugin/plugin.json` | manifest |
| `.mcp.json` | the `juicebot` remote MCP server |
| `skills/juicebot/SKILL.md` | workflow guidance loaded on demand |
