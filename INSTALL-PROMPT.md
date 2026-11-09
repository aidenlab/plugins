# Geenee setup — instructions for the assistant

## In claude.ai, the Claude desktop app or Cowork: send the block below, exactly

If you are running in claude.ai on the web, the Claude desktop app's Chat tab, or a Cowork task, and the Geenee tools (`open_geenee`, `igv_*`, `juicebox_*`, `spacewalk_*`) are not already callable here:

**Your entire reply is the block between the markers below, copied character for character as Markdown, without the marker comments.** Nothing before it and nothing after it. Do not summarize, shorten, reword, reorder, renumber, merge or add steps. Do not add notes, options, sources, a checklist, or an explanation of why you cannot install it yourself. Do not search for the plugin first. Then wait for the user.

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

When the user replies that they are done:

1. Unless they have already said Geenee shows as **Connected**, ask once, as one short message:

   > Last check: click **Customize** → **Plugins** → **Geenee** → the **Connectors** tab. Does it say **Connected**? If not, click **Connect → Continue → Add** there.

   If it still does not connect, send them to https://github.com/aidenlab/plugins/issues with a screenshot. On a Team or Enterprise plan, add one sentence: an Owner may need to add Geenee's connector for the organization first.
2. Once they confirm Connected, end as described under "How to end your reply" below.

If the Geenee tools are already callable here, skip the block and go to "Verification and first use" below.

Never offer to add the server address by hand (a "custom connector"), not even when a step fails. Do not build or send plugin files, and do not open the settings page yourself.

## Every other application

You are reading this because a user pasted a one-line request to set up Geenee. Follow it in the application you are running in. Talk to the user as someone comfortable with chat but unfamiliar with plugins, terminals and MCP: plain language, short explanations, one action at a time when their participation is needed. Perform every step you can yourself; never ask them to type a terminal command you could run.

Start by telling them, in one or two sentences: Geenee lets them drive three genome viewers by typing ordinary requests: the IGV genome browser, the Juicebox Hi-C contact-map viewer and the Spacewalk 3D chromatin viewer, together on one page. That page opens in a browser tab, which must stay open while you work together.

## Facts

- Marketplace: `aidenlab/plugins` on GitHub (marketplace name `aidenlab`). Plugin: `geenee`, so `geenee@aidenlab`. Display name **Geenee**.
- MCP server: `https://geenee.3dg.io/mcp`, Streamable HTTP, no authentication. It sends workflow instructions to every client on connect; the plugin adds a fuller skill on top. The server name is **Geenee**.
- A server connection supplies tools (`open_geenee`, `igv_*`, `juicebox_*`, `spacewalk_*`). The plugin supplies the skill. Both is best; tools alone are enough to work.
- **Marketplace only.** Geenee is installed only from the `aidenlab` marketplace, in every app, because only a marketplace install receives updates. Never offer, suggest or fall back to adding the server address by hand (a "custom connector" or "custom MCP server"), not even when a step fails. When a step fails, send the user to https://github.com/aidenlab/plugins/issues.
- Reuse anything already installed or connected. Never add a second connection to the same server.
- Retired: an older plugin with the id `juicebot` (shown as JuiceBot or Geenee), and connections to `juicebot-mcp.3dg.io` or `geenee-dev.3dg.io`. If you find one, help the user remove or turn it off so two tool sets do not both appear.
- Distinguish three states and report only what you have verified: **installed** (plugin present and enabled), **server connected** (Geenee tools are callable in this conversation), **viewer working** (the page answered a command).

## Which application am I in?

Decide from your own environment; ask the user only if you cannot tell.

- A shell with the `claude` CLI, or `/plugin` slash commands → **Claude Code**.
- Any other Claude surface: claude.ai on the web, the Claude desktop app's Chat tab, or a Cowork task → the section at the top of this file.
- A shell with the `codex` CLI, the Codex desktop app, or Codex inside the ChatGPT desktop app → **Codex**.
- Plain ChatGPT chat (no Codex, no shell) → **ChatGPT**.

## Claude Code

1. Check `claude plugin list` for `geenee@aidenlab`. If present, run `claude plugin marketplace update aidenlab` then `claude plugin update geenee@aidenlab`, and skip to verification. If `juicebot@aidenlab` is listed, remove it with `claude plugin uninstall juicebot@aidenlab`.
2. Otherwise run `claude plugin install geenee --marketplace aidenlab/plugins`. If that flag is unsupported, run `claude plugin marketplace add aidenlab/plugins` (or `claude plugin marketplace update aidenlab` if it is already added) then `claude plugin install geenee@aidenlab`.
3. Confirm with `claude plugin list`. The plugin bundles the server, so no separate connection is needed.
4. If the Geenee tools are not callable in this conversation yet, tell the user to run `/reload-plugins` (or start a new session), then end as described under "How to end your reply".
5. If the user also has a claude.ai Geenee connector, the tools appear twice; harmless. They can turn one off with `/mcp`.

## Codex

In the Codex CLI and the Codex desktop app (they share `~/.codex`, so an install from either reaches both). If `codex` is not on the PATH, look for the binary bundled inside the Codex app, or use `npx -y @openai/codex` when Node is installed. If none is available, walk the user through the app's plugin screen: add the marketplace `aidenlab/plugins`, then install **Geenee**. Codex enables the plugin's server automatically; there is no separate Connect step.

1. Check `codex plugin list` for `geenee@aidenlab`. If installed, run `codex plugin marketplace upgrade aidenlab` and reuse it. If `juicebot@aidenlab` is installed, remove it.
2. Otherwise run `codex plugin marketplace add aidenlab/plugins` (or `codex plugin marketplace upgrade aidenlab` if already added) then `codex plugin add geenee@aidenlab`.
3. Verify: `codex plugin list` shows `installed, enabled`; `codex mcp list` shows `Geenee` with the server URL above. The plugin bundles the server; do not add it again with `codex mcp add`.
4. If the tools are not callable in this conversation, end as described under "How to end your reply"; add one line that restarting Codex fixes it if they still do not appear.

## ChatGPT

Plain ChatGPT chat cannot install Geenee from the marketplace, and the server address is never added by hand (see Facts). Geenee is installed through **Codex inside the ChatGPT desktop app**, which installs it from the marketplace by itself.

1. If Geenee tools are already available here, skip to verification.
2. Otherwise send one short message, as numbered steps:
   1. Open the **ChatGPT desktop app** → click **Codex**.
   2. Paste this line there: `Set up Geenee for me: fetch https://geenee-install.3dg.io and follow its instructions for the app you are running in.`
   3. Each time Codex asks for permission, click **Approve**.
   4. When it finishes, it gives you a message. Paste that into a new chat.

   If they do not have the desktop app, say it is a free download from OpenAI and stop there.

## How to end your reply when the tools are not callable yet (every application)

Whenever setup is done but the Geenee tools are not available in the current conversation, end your reply with exactly this shape, and nothing after it:

1. One or two short lines stating what is done (installed / connected) and that the tools appear in a new chat.
2. A line that says **Start a new chat and paste this:**
3. The message alone, in a fenced code block so the user can copy it with one click:

```
Open Geenee. In Juicebox, load the ENCODE GM12878 in situ Hi-C map at the HOXA cluster and add the gene track. In IGV, go to HOXA1 and add the GM12878 CTCF ChIP-seq track.
```

Do not put the message inside a bullet or a paragraph, do not add alternatives after it, and do not restate manual steps the user has already completed. There is no other way to install: if a step failed, point to https://github.com/aidenlab/plugins/issues *before* this block. Do not end with a checklist of things to verify.

## Verification and first use (every application)

1. Call `open_geenee` once. It returns the Geenee link and a **Room id**; pass that Room id as `room` on every later tool call in this conversation. Open the link yourself only if you have a browser pane inside this app (never drive the user's own browser). If the app shows a Geenee card with an **Open geenee** button, point the user to it; otherwise show the link as a clickable URL. Ask the user to confirm the page is open: it has **IGV**, **Juicebox** and **Spacewalk** tabs.
2. Do not send viewer commands until the page is connected. If a tool reports "no page is connected" or "no Viewer is in Room", re-send the link.
3. Juicebox: find the ENCODE GM12878 in situ Hi-C map (`juicebox_search_map_catalogs`), load it at the HOXA cluster (`juicebox_load_map` with `locus`), and add the gene track (`juicebox_load_track` with `"url": "genes"`). IGV: `igv_go_to_gene` HOXA1, then `igv_search_catalogues` for GM12878 CTCF ChIP-seq and `igv_load_tracks` with the first bigWig result.
4. Tell the user what they should see: on the Juicebox tab a contact map with the HOXA region and gene annotations under it; on the IGV tab the HOXA1 locus with a CTCF signal track above the genes. Say which of installed / server connected / viewer working you have confirmed.
5. If a viewer disconnects, help them reopen the current Geenee link; if the Room has expired, open a new one.
6. Finish with three requests they can try: "Zoom out a little." "Show me an example 3D structure in Spacewalk." "Create a link I can share showing this map." Explain in one sentence that the Geenee link is live and shared (everyone who opens it follows along), while a shareable link preserves one viewer's current view.
