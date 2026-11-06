# Geenee setup — instructions for the assistant

You are reading this because a user pasted a one-line request to set up Geenee. Follow it in the application you are running in. Talk to the user as someone comfortable with chat but unfamiliar with plugins, terminals and MCP: plain language, short explanations, one action at a time when their participation is needed. Perform every step you can yourself; never ask them to type a terminal command you could run.

Start by telling them, in one or two sentences: Geenee lets them drive three genome viewers by typing ordinary requests: the IGV genome browser, the Juicebox Hi-C contact-map viewer and the Spacewalk 3D chromatin viewer, together on one page. That page opens in a browser tab, which must stay open while you work together.

## Facts

- Marketplace: `aidenlab/plugins` on GitHub (marketplace name `aidenlab`). Plugin: `geenee`, so `geenee@aidenlab`. Display name **Geenee**.
- MCP server: `https://geenee.3dg.io/mcp`, Streamable HTTP, no authentication. It sends workflow instructions to every client on connect; the plugin adds a fuller skill on top. The server name is **Geenee**.
- A server connection supplies tools (`open_geenee`, `igv_*`, `juicebox_*`, `spacewalk_*`). The plugin supplies the skill. Both is best; tools alone are enough to work.
- Reuse anything already installed or connected. Never add a second connection to the same server.
- Retired: an older plugin with the id `juicebot` (shown as JuiceBot or Geenee), and connections to `juicebot-mcp.3dg.io` or `geenee-dev.3dg.io`. If you find one, help the user remove or turn it off so two tool sets do not both appear.
- Distinguish three states and report only what you have verified: **installed** (plugin present and enabled), **server connected** (Geenee tools are callable in this conversation), **viewer working** (the page answered a command).

## Which application am I in?

Decide from your own environment; ask the user only if you cannot tell.

- A shell with the `claude` CLI, or `/plugin` slash commands → **Claude Code**.
- Any other Claude surface: claude.ai on the web, the Claude desktop app's Chat tab, or a Cowork task → **Claude (account path)**.
- A shell with the `codex` CLI → **Codex**.
- ChatGPT → **ChatGPT**.

## Claude (claude.ai web, desktop Chat, Cowork)

Plugins and marketplaces are added to the user's **account**, once, and then follow them to web chat, the desktop app, Cowork and Claude Code. There is no command for this; it is a few clicks on one settings page. Keep the conversation short: two user actions in total, each as a single message. Do not build or send plugin files.

1. If Geenee tools are already callable here, skip to verification.
2. If you have a tool that lists the plugins on the user's account, call it for `geenee` first. If the plugin is already there, skip to step 4. Otherwise, if you have a plugin-catalog search tool, search it for `geenee`; if listed, render the install card and tell the user to click **Install**, then go to step 4.
3. **One message, all the clicks.** Do not open the settings page yourself; send exactly this and wait for the user to say they are done:

   > Open **https://claude.ai/new#settings/customize-plugins** in a separate tab or window (Ctrl/Cmd-click, or right-click → Open in new tab) so this chat stays put. In the app the same page is **Customize → Plugins**; in Cowork, open the Cowork tab first. If the `aidenlab` marketplace is not there yet, click **Add → Add marketplace → Add from a repository**, enter `aidenlab/plugins` and confirm. In the **Discover** tab, find **Geenee** and click **Add**. Tell me when that's done.

4. **Confirm and connect the server.** When the user says it is done, call the tool that lists the plugins on their account, filtered to `geenee`. It renders a card for the plugin with a **Manage** button. Then say, as one message:

   > Geenee is on your account. Click **Manage** on the card above and turn on the **Geenee** server (its MCP connection). If there is no server switch there, open **Customize → Connectors** and enable **Geenee**; and if it is not listed there either, use **Settings → Connectors → Add custom connector** with the name `Geenee`, the URL `https://geenee.3dg.io/mcp`, no authentication.

   If the account also has the retired `juicebot` plugin or a JuiceBot connector, add one sentence asking them to remove it on the same page. On a Team or Enterprise plan, mention once that an admin can add the connector for the whole organization.
5. The tools appear in a new conversation. End as described under "How to end your reply".

Everything added this way also reaches Claude Code the next time it starts signed in with the same account (or after `/login`).

## Claude Code

1. Check `claude plugin list` for `geenee@aidenlab`. If present, run `claude plugin marketplace update aidenlab` then `claude plugin update geenee@aidenlab`, and skip to verification. If `juicebot@aidenlab` is listed, remove it with `claude plugin uninstall juicebot@aidenlab`.
2. Otherwise run `claude plugin install geenee --marketplace aidenlab/plugins`. If that flag is unsupported, run `claude plugin marketplace add aidenlab/plugins` (or `claude plugin marketplace update aidenlab` if it is already added) then `claude plugin install geenee@aidenlab`.
3. Confirm with `claude plugin list`. The plugin bundles the server, so no separate connection is needed.
4. If the Geenee tools are not callable in this conversation yet, tell the user to run `/reload-plugins` (or start a new session), then end as described under "How to end your reply".
5. If the user also has a claude.ai Geenee connector, the tools appear twice; harmless. They can turn one off with `/mcp`.

## Codex

1. Check `codex plugin list` for `geenee@aidenlab`. If installed, run `codex plugin marketplace upgrade aidenlab` and reuse it. If `juicebot@aidenlab` is installed, remove it.
2. Otherwise run `codex plugin marketplace add aidenlab/plugins` (or `codex plugin marketplace upgrade aidenlab` if already added) then `codex plugin add geenee@aidenlab`.
3. Verify: `codex plugin list` shows `installed, enabled`; `codex mcp list` shows `Geenee` with the server URL above. The plugin bundles the server; do not add it again with `codex mcp add`.
4. If the tools are not callable in this conversation, end as described under "How to end your reply"; add one line that restarting Codex fixes it if they still do not appear.

## ChatGPT

1. If Geenee tools are already available here, skip to verification. If tools from a JuiceBot server or a `geenee-dev` server are available instead, guide them through step 2 and suggest removing the old server afterwards.
2. Otherwise guide the user: **chatgpt.com/plugins → + → Add custom MCP server**, name `Geenee`, the server URL above, authentication **None**. Explain any confirmation ChatGPT shows in plain words.
3. Then help them install the resulting plugin, start a new chat, and enable Geenee in it (the tools menu or `@Geenee`, whichever the app offers). If an option is missing, explain the account or workspace limitation you can verify and the next step.
4. ChatGPT gets tools and the server's built-in instructions; it does not get the plugin skill. That is fine.

## How to end your reply when the tools are not callable yet (every application)

Whenever setup is done but the Geenee tools are not available in the current conversation, end your reply with exactly this shape, and nothing after it:

1. One or two short lines stating what is done (installed / connected) and that the tools appear in a new chat.
2. A line that says **Start a new chat and paste this:**
3. The message alone, in a fenced code block so the user can copy it with one click:

```
Open Geenee. In Juicebox, load the ENCODE GM12878 in situ Hi-C map at the HOXA cluster and add the gene track. In IGV, go to HOXA1 and add the GM12878 CTCF ChIP-seq track.
```

Do not put the message inside a bullet or a paragraph, do not add alternatives after it, and do not restate manual steps the user has already completed. Fallback instructions (another way to install) go *before* this block, and only if a step actually failed.

## Verification and first use (every application)

1. Call `open_geenee` once. It returns the Geenee link and a **Room id**; pass that Room id as `room` on every later tool call in this conversation. Open the link yourself only if you have a browser pane inside this app (never drive the user's own browser). If the app shows a Geenee card with an **Open geenee** button, point the user to it; otherwise show the link as a clickable URL. Ask the user to confirm the page is open: it has **IGV**, **Juicebox** and **Spacewalk** tabs.
2. Do not send viewer commands until the page is connected. If a tool reports "no page is connected" or "no Viewer is in Room", re-send the link.
3. Juicebox: find the ENCODE GM12878 in situ Hi-C map (`juicebox_search_map_catalogs`), load it at the HOXA cluster (`juicebox_load_map` with `locus`), and add the gene track (`juicebox_load_track` with `"url": "genes"`). IGV: `igv_go_to_gene` HOXA1, then `igv_search_catalogues` for GM12878 CTCF ChIP-seq and `igv_load_tracks` with the first bigWig result.
4. Tell the user what they should see: on the Juicebox tab a contact map with the HOXA region and gene annotations under it; on the IGV tab the HOXA1 locus with a CTCF signal track above the genes. Say which of installed / server connected / viewer working you have confirmed.
5. If a viewer disconnects, help them reopen the current Geenee link; if the Room has expired, open a new one.
6. Finish with three requests they can try: "Zoom out a little." "Show me an example 3D structure in Spacewalk." "Create a link I can share showing this map." Explain in one sentence that the Geenee link is live and shared (everyone who opens it follows along), while a shareable link preserves one viewer's current view.
