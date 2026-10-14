# Geenee plugin

Drive [Geenee](https://github.com/aidenlab/geenee) from Claude: one page beside the conversation holding the [igv](https://igv.org) genome browser and the [Juicebox](https://aidenlab.org/juicebox/) Hi-C contact-map viewer. The plugin registers the Aiden Lab's hosted MCP server (`https://geenee-dev.3dg.io/mcp`, Streamable HTTP, no auth, nothing installed locally) and a skill that teaches Claude the workflow: open Geenee once, keep the Room id, then search, load, navigate, compare and share in either viewer.

The plugin id is `juicebot` (its name up to 1.3, when it drove Juicebox alone); the id was kept so that existing installs upgrade in place.

Server source and tool reference: [aidenlab/geenee](https://github.com/aidenlab/geenee).

## Install

Paste into Claude Code, Cowork, claude.ai, Codex or ChatGPT:

```
Set up Geenee for me: fetch https://geenee-install.3dg.io and follow its instructions for the app you are running in.
```

Manual paths for every client are in the [marketplace README](../../README.md). Quickest by hand: Claude Code `/plugin install juicebot --marketplace aidenlab/plugins` then `/reload-plugins`; Codex `codex plugin marketplace add aidenlab/plugins` then `codex plugin add juicebot@aidenlab`; Claude web/desktop/Cowork: https://claude.ai/new#settings/customize-plugins → Add → Add marketplace → `aidenlab/plugins` → Discover → Geenee → Add, then enable the Geenee connector; ChatGPT adds `https://geenee-dev.3dg.io/mcp` as a custom MCP server.

## Try it

> Open Geenee. In Juicebox, load the ENCODE GM12878 in situ Hi-C map at the HOXA cluster and add the gene track. In IGV, go to HOXA1 and add the GM12878 CTCF ChIP-seq track.

Claude returns a Geenee link; open it in a tab, and you watch the Juicebox tab load the map at HOXA with a gene track, and the IGV tab show HOXA1 with a CTCF signal track.

## Contents

| Path | What |
|---|---|
| `.claude-plugin/plugin.json` | manifest |
| `.mcp.json` | the `Geenee` remote MCP server |
| `skills/geenee/SKILL.md` | workflow guidance loaded on demand |
| `skills/geenee/scripts/` | `geenee.py` / `geenee.mjs`, the connector-free CLI |
