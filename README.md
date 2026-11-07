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
You need a paid Claude plan (Pro, Max, Team or Enterprise). There are two parts, adding Geenee and then connecting it. Do both.

1. Click **Customize** in the left sidebar → **Plugins**

   *In a web browser you can instead go straight to [claude.ai/customize/plugins](https://claude.ai/customize/plugins). In Cowork, click the **Cowork** tab first.*

   ✓ You see a page called **Plugins** with a **Discover** tab.

2. Click **Add** → **Add marketplace** → **Add from a repository**

   *Already see **aidenlab** in your list of marketplaces? Skip to step 5. No **Add marketplace**? Your organization has turned it off: ask your Claude admin to allow user-added marketplaces, then come back to this step.*

3. Type `aidenlab/plugins` → click the button that adds it

   ✓ **aidenlab** now appears in your list of marketplaces.

4. If you see **Sync automatically** next to **aidenlab**, turn it on. This is how Geenee's updates reach you.

5. Click the **Discover** tab → find **Geenee** → click **Add**

6. Click **Geenee** → the **Connectors** tab

   ✓ It says **Not added**. That's expected.

7. Click **Add** if you see it → then click **Connect**. No login is needed.

   ✓ It now says **Connected**. *Skip this step and Geenee looks installed but does nothing.*

8. Start a new chat → click **+** in the message box → **Connectors** → make sure **Geenee** is switched on.

Stuck at any step? Open an issue at [github.com/aidenlab/plugins/issues](https://github.com/aidenlab/plugins/issues) and attach a screenshot of what you see.
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
