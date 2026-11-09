# Geenee plugin

Drive [Geenee](https://github.com/aidenlab/geenee) from Claude, ChatGPT or Codex: one page beside the conversation holding the [igv](https://igv.org) genome browser, the [Juicebox](https://aidenlab.org/juicebox/) Hi-C contact-map viewer and the [Spacewalk](https://github.com/aidenlab/spacewalk) 3D chromatin viewer. The plugin registers the Aiden Lab's hosted MCP server (`https://geenee.3dg.io/mcp`, Streamable HTTP, no auth, nothing installed locally) and a skill that teaches the assistant the workflow: open Geenee once, keep the Room id, then search, load, navigate, compare and share in any of the three viewers.

Server source: [aidenlab/geenee](https://github.com/aidenlab/geenee).

## Install

In Claude Code or Codex, paste this and the assistant installs everything:

```
Set up Geenee for me: fetch https://geenee-install.3dg.io and follow its instructions for the app you are running in.
```

In claude.ai, the Claude desktop app and Cowork no prompt can install it: a chat cannot change account settings. Those take four short steps, listed in the [marketplace README](../../README.md). In ChatGPT, use Codex in the ChatGPT desktop app and paste the one-line prompt there. Geenee is installed only from the marketplace, never by adding the server address by hand. Quickest by hand: Claude Code `/plugin install geenee --marketplace aidenlab/plugins` then `/reload-plugins`; Codex `codex plugin marketplace add aidenlab/plugins` then `codex plugin add geenee@aidenlab`.

## Try it

> Open Geenee. In Juicebox, load the ENCODE GM12878 in situ Hi-C map at the HOXA cluster and add the gene track. In IGV, go to HOXA1 and add the GM12878 CTCF ChIP-seq track.

The assistant returns a Geenee link; open it in a tab, and you watch the Juicebox tab load the map at HOXA with a gene track, and the IGV tab show HOXA1 with a CTCF signal track. Then: "Show me an example 3D structure in Spacewalk."

## Contents

| Path | What |
|---|---|
| `.claude-plugin/plugin.json` | Claude manifest |
| `.mcp.json` | the `Geenee` remote MCP server (Claude) |
| `plugin.json`, `mcp.json` | the same for ChatGPT / Codex (Agent Plugins layout) |
| `skills/geenee/SKILL.md` | workflow guidance, loaded on demand |
| `skills/geenee/references/` | `tools.md` (generated from the server's `tools/list`), `cli.md` |
| `skills/geenee/scripts/` | `geenee.py` / `geenee.mjs`, the connector-free CLI |
| `assets/` | icons for the OpenAI manifest and directory submissions |
