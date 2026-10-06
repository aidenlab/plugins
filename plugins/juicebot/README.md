# Juicebot plugin

Drive the [Juicebox](https://aidenlab.org/juicebox/) Hi-C contact-map viewer from Claude. The plugin registers the Aiden Lab's hosted MCP server (`https://juicebox-mcp-v2.aidenlab.workers.dev/mcp`, Streamable HTTP, no auth, nothing installed locally) and a skill that teaches Claude the workflow: get a join link, open it in a browser, then search, load, navigate, compare and share.

Server source and tool reference: [weiszd/juicebox-mcp](https://github.com/weiszd/juicebox-mcp).

## Install

See the [marketplace README](../../README.md) for all clients. Quickest:

```
claude plugin marketplace add aidenlab/claude-plugins
claude plugin install juicebot@aidenlab
```

## Try it

> Open Juicebox, load the ENCODE GM12878 in situ Hi-C map and go to the HOXA cluster.

Claude returns a join link; open it in a tab, and the map appears there.

## Contents

| Path | What |
|---|---|
| `.claude-plugin/plugin.json` | manifest |
| `.mcp.json` | the `juicebot` remote MCP server |
| `skills/juicebot/SKILL.md` | workflow guidance loaded on demand |
