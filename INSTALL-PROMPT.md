# Geenee setup — instructions for the assistant

> Dev build: this installs **juicebot-dev** (display name Geenee (dev)) from the `dev` branch. Names below already say so; do not substitute the production ones.

You are reading this because a user pasted a one-line request to set up Geenee. Follow it in the application you are running in. Talk to the user as someone comfortable with chat but unfamiliar with plugins, terminals and MCP: plain language, short explanations, one action at a time when their participation is needed. Perform every step you can yourself; never ask them to type a terminal command you could run.

Start by telling them, in one or two sentences: Geenee lets them drive two genome viewers by typing ordinary requests: the IGV genome browser and the Juicebox Hi-C contact-map viewer, side by side on one page. That page opens in a browser tab, which must stay open while you work together.

## Facts

- Marketplace: `aidenlab/plugins` on GitHub (marketplace name `aidenlab-dev`, git branch `dev`). Plugin: `juicebot`, so `juicebot-dev@aidenlab-dev`. Its display name is **Geenee**; the plugin id stayed `juicebot` so that earlier installs upgrade in place. The plugin was called JuiceBot before 2.0; an installed JuiceBot is the same plugin and only needs updating.
- MCP server: `https://geenee-dev.3dg.io/mcp`, Streamable HTTP, no authentication. It sends workflow instructions to every client on connect; the plugin adds a fuller skill on top. The server name is **Geenee**.
- A server connection supplies tools (`open_geenee`, `igv_*`, `juicebox_*`). The plugin supplies the skill. Both is best; tools alone are enough to work.
- Reuse anything already installed or connected. Never add a second connection to the same server. A connection to the old JuiceBot server (`juicebot-mcp.3dg.io`) is superseded: help the user turn it off or remove it so the two tool sets do not both appear.
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
2. If you have a tool that lists the plugins on the user's account, call it for `juicebot` first. If the plugin is already there (it may still be labelled JuiceBot), skip to step 4: updating it is part of that step. Otherwise, if you have a plugin-catalog search tool, search it for `geenee` and `juicebot`; if listed, render the install card and tell the user to click **Install**, then go to step 4.
3. **One message, all the clicks.** Do not open the settings page yourself; send exactly this and wait for the user to say they are done:

   > Open **https://claude.ai/new#settings/customize-plugins** in a separate tab or window (Ctrl/Cmd-click, or right-click → Open in new tab) so this chat stays put. In the app the same page is **Customize → Plugins**; in Cowork, open the Cowork tab first. Click **Add → Add marketplace → Add from a repository** is main-only; for the dev build use **Add → Upload plugin** with `juicebot-dev.plugin` from https://github.com/aidenlab/plugins/releases and confirm. The **Discover** tab opens on its own; find **Geenee-dev** and click **Add**. Tell me when that's done.

4. **Confirm and connect the server.** When the user says it is done, call the tool that lists the plugins on their account, filtered to `juicebot`. It renders a card for the plugin with a **Manage** button. Then say, as one message:

   > Geenee is on your account. Click **Manage** on the card above; if it offers an update to version 2.0, take it. Then turn on the **Geenee-dev** server (its MCP connection) and turn off **JuiceBot** if it is still listed. If there is no server switch there, open **Customize → Connectors** and enable **Geenee-dev**; and if it is not listed there either, use **Settings → Connectors → Add custom connector** with the name `Geenee-dev`, the URL `https://geenee-dev.3dg.io/mcp`, no authentication.

   On a Team or Enterprise plan, mention once that an admin can add that connector for the whole organization.
5. The tools appear in a new conversation. End as described under "How to end your reply".

Everything added this way also reaches Claude Code the next time it starts signed in with the same account (or after `/login`).

## Claude Code

1. Check `claude plugin list` for `juicebot-dev@aidenlab-dev`. If present and at version 2.0.0 or later, skip to verification. If present at an older version (JuiceBot), run `claude plugin marketplace update aidenlab-dev` then `claude plugin update juicebot-dev@aidenlab-dev`; that is the whole upgrade. If the user already added the plugin to their account (section above), it syncs in by itself; `/login` forces the sync.
2. Otherwise run `claude plugin install juicebot-dev --marketplace aidenlab/plugins#dev`. If that flag is unsupported, run `claude plugin marketplace add aidenlab/plugins#dev` then `claude plugin install juicebot-dev@aidenlab-dev`.
3. Confirm with `claude plugin list`. The plugin bundles the server, so no separate connection is needed.
4. If the Geenee tools are not callable in this conversation yet, tell the user to run `/reload-plugins` (or start a new session), then end as described under "How to end your reply".
5. If the user also has a claude.ai Geenee connector, the tools appear twice; harmless. They can turn one off with `/mcp`. An old JuiceBot connector should be turned off there too.

## Codex

1. Check `codex plugin list` for `juicebot-dev@aidenlab-dev`. If installed at an older version, run `codex plugin marketplace upgrade aidenlab-dev` so it becomes Geenee; reuse it.
2. Otherwise run `codex plugin marketplace add aidenlab/plugins --ref dev` then `codex plugin add juicebot-dev@aidenlab-dev`.
3. Verify: `codex plugin list` shows `installed, enabled`; `codex mcp list` shows `Geenee-dev` with the server URL above. The plugin bundles the server; do not add it again with `codex mcp add`.
4. If the tools are not callable in this conversation, end as described under "How to end your reply"; add one line that restarting Codex fixes it if they still do not appear.

## ChatGPT

1. If Geenee tools are already available here, skip to verification. If only JuiceBot tools are available, the user has the old server: guide them through step 2 for Geenee and suggest removing the JuiceBot server afterwards.
2. Otherwise guide the user: **chatgpt.com/plugins → + → Add custom MCP server**, name `Geenee-dev`, the server URL above, authentication **None**. Explain any confirmation ChatGPT shows in plain words.
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

1. Call `open_geenee` once. It returns the Geenee link and a **Room id**; pass that Room id as `room` on every later tool call in this conversation. Open the link yourself only if you have a browser pane inside this app (never drive the user's own browser); always also show it as a clickable link. Ask the user to confirm the page is open: it has an **IGV** tab and a **Juicebox** tab.
2. Do not send viewer commands until the page is connected. If a tool reports "no page is connected" or "no Viewer is in Room", re-send the link.
3. Juicebox: find the ENCODE GM12878 in situ Hi-C map (`juicebox_search_map_catalogs`), load it at the HOXA cluster (`juicebox_load_map` with `locus`), and add the gene track (`juicebox_load_track` with `"url": "genes"`). IGV: `igv_go_to_gene` HOXA1, then `igv_search_catalogues` for GM12878 CTCF ChIP-seq and `igv_load_tracks` with the first bigWig result.
4. Tell the user what they should see: on the Juicebox tab a contact map with the HOXA region and gene annotations under it; on the IGV tab the HOXA1 locus with a CTCF signal track above the genes. Say which of installed / server connected / viewer working you have confirmed.
5. If a viewer disconnects, help them reopen the current Geenee link; if the Room has expired, open a new one.
6. Finish with three requests they can try: "Zoom out a little." "Go to MYC in both." "Create a link I can share showing this view." Explain in one sentence that the Geenee link is live and shared (everyone who opens it follows along), while a shareable link preserves one viewer's current view.
