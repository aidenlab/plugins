# Aiden Lab plugins

**Geenee** lets you drive three genome viewers by chatting: the [IGV](https://igv.org) genome browser, the [Juicebox](https://aidenlab.org/juicebox/) Hi-C viewer and the [Spacewalk](https://github.com/aidenlab/spacewalk) 3D chromatin viewer, side by side on one web page. Nothing runs on your computer.

## Install

Geenee installs only from the **aidenlab** marketplace, in every app. That is how it gets updates, which matter while Geenee is young.

### Claude Code, Codex, or ChatGPT's Codex: paste one line

```
Set up Geenee for me: fetch https://geenee-install.3dg.io and follow its instructions for the app you are running in.
```

The assistant does the installing. Each time it asks for permission, click **Approve** (or **Allow**). When it finishes it gives you a message to paste into a new chat or session.

In the ChatGPT desktop app, open **Codex** first, then paste the line there. Plain ChatGPT chat cannot install Geenee.

### Claude (desktop app, claude.ai, Cowork): click through once

<!-- claude-steps:start -->
Follow these steps to install Geenee.

1. Go to **Customize → Plugins → +Add → Add marketplace → Add from a repository**. Enter this URL: `aidenlab/plugins`
2. Click **Sync**
3. You will be on the **Discover** tab. Click **Add** (Not **+Add**).
4. Select the **Connectors** tab. **Connect → Continue → Add**

**Things to know:**
- You need a paid plan.
- If you see **Sync automatically** next to **aidenlab**, turn it on. That's how Geenee's updates reach you.
- If you still have the old `juicebot` plugin, or a connection to `juicebot-mcp.3dg.io` or `geenee-dev.3dg.io`, remove it. Otherwise you'll get duplicate tools.

**To check it worked:** start a new chat and ask me to open Geenee. I'll call `open_geenee` and give you a link to a page with IGV, Juicebox and Spacewalk tabs. Keep that browser tab open while you use it. If a step fails, report it at [github.com/aidenlab/plugins/issues](https://github.com/aidenlab/plugins/issues) with a screenshot.
<!-- claude-steps:end -->

This covers every Claude app on your account, Claude Code included. You can also paste the one-line prompt above into a Claude chat: it walks you through these same steps.

## First thing to try

In a new chat:

> Open Geenee. In Juicebox, load the ENCODE GM12878 in situ Hi-C map at the HOXA cluster and add the gene track. In IGV, go to HOXA1 and add the GM12878 CTCF ChIP-seq track.

You get a link. Open it in a browser tab and keep it open: the assistant drives the viewers in that tab.

## More

- **Have the old `juicebot` plugin?** Remove it, then install Geenee as above.
- **Admins (Claude Team/Enterprise):** an Owner may need to allow user-added marketplaces, and to add Geenee's connector for the organization, before members can complete the steps above.
- **Maintainers:** [docs/maintaining.md](docs/maintaining.md). How plugins relate to a plain MCP URL: [docs/from-mcp-url-to-plugin.md](docs/from-mcp-url-to-plugin.md).

Server source: [aidenlab/geenee](https://github.com/aidenlab/geenee). License: MIT.
