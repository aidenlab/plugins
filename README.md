# Aiden Lab plugins

**Geenee** lets you drive three genome viewers by chatting: the [IGV](https://igv.org) genome browser, the [Juicebox](https://aidenlab.org/juicebox/) Hi-C viewer and the [Spacewalk](https://github.com/aidenlab/spacewalk) 3D chromatin viewer, side by side on one web page. Nothing runs on your computer.

## Install

How you install depends on the app. Only Claude Code and Codex can install it for you; the others need a few clicks in settings, because a chat cannot change your account settings.

### Claude Code or Codex (CLI or desktop app): paste one line

```
Set up Geenee for me: fetch https://geenee-install.3dg.io and follow its instructions for the app you are running in.
```

The assistant installs everything itself. Start a new session when it says so.

### Claude (web, desktop app, Cowork): two parts, once

1. Open [claude.ai/new#settings/customize-plugins](https://claude.ai/new#settings/customize-plugins).
2. **Add → Add marketplace → Add from a repository**, enter `aidenlab/plugins`.
3. Find **Geenee**, click **Add**.
4. **Then click Connect.** Open Geenee's **Connectors** tab: it says **Not added** until you click **Connect**. Claude never does this for you, and without it Geenee looks installed but does nothing.
5. Start a new chat.

You can also paste the one-line prompt above into a Claude chat: it walks you through these same clicks.

This covers every Claude app on your account, Claude Code included. Paid plans only.

Only if there is no Connect button: **Settings → Connectors → Add custom connector**, name `Geenee`, URL `https://geenee.3dg.io/mcp`, no authentication. This gets no plugin updates, so prefer the plugin.

### ChatGPT: add the server by hand

[chatgpt.com/plugins](https://chatgpt.com/plugins) → **+** → **Add custom MCP server**, name `Geenee`, URL `https://geenee.3dg.io/mcp`, authentication **None** (if ChatGPT asks for Developer mode, turn it on in Settings). **Then** start a new chat and turn Geenee on in it from the **+** menu. ChatGPT does not use this marketplace.

### Other MCP apps (Cursor and others)

Point them at `https://geenee.3dg.io/mcp`.

## First thing to try

In a new chat:

> Open Geenee. In Juicebox, load the ENCODE GM12878 in situ Hi-C map at the HOXA cluster and add the gene track. In IGV, go to HOXA1 and add the GM12878 CTCF ChIP-seq track.

You get a link. Open it in a browser tab and keep it open: the assistant drives the viewers in that tab.

## More

- **Have the old `juicebot` plugin?** Remove it, then install Geenee as above.
- **Admins (Claude Team/Enterprise):** add `https://geenee.3dg.io/mcp` as an organization connector and members need no setup.
- **Maintainers:** [docs/maintaining.md](docs/maintaining.md). How plugins relate to a plain MCP URL: [docs/from-mcp-url-to-plugin.md](docs/from-mcp-url-to-plugin.md).

Server source: [aidenlab/geenee](https://github.com/aidenlab/geenee). License: MIT.
