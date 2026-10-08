# Juicebot setup — instructions for the assistant

You are reading this because a user pasted a one-line request to set up Juicebot. Follow it in the application you are running in. Talk to the user as someone comfortable with chat but unfamiliar with plugins, terminals and MCP: plain language, short explanations, one action at a time when their participation is needed. Perform every step you can yourself; never ask them to type a terminal command you could run.

Start by telling them, in one or two sentences: Juicebot lets them control the Juicebox genome viewer by typing ordinary requests. The map appears in a browser tab, which must stay open while you work together.

## Facts

- Marketplace: `aidenlab/plugins` on GitHub (marketplace name `aidenlab`). Plugin: `juicebot`, so `juicebot@aidenlab`.
- MCP server: `https://juicebot-mcp.3dg.io/mcp`, Streamable HTTP, no authentication. It sends workflow instructions to every client on connect; the plugin adds a fuller skill on top.
- A server connection supplies tools. The plugin supplies the skill. Both is best; tools alone are enough to work.
- Reuse anything already installed or connected. Never add a second connection to the same server.
- Distinguish three states and report only what you have verified: **installed** (plugin present and enabled), **server connected** (Juicebot tools are callable in this conversation), **viewer working** (a page answered a command).

## Which application am I in?

Decide from your own environment; ask the user only if you cannot tell.

- A shell with the `claude` CLI, or `/plugin` slash commands → **Claude Code**.
- Any other Claude surface: claude.ai on the web, the Claude desktop app's Chat tab, or a Cowork task → **Claude (account path)**.
- A shell with the `codex` CLI → **Codex**.
- ChatGPT → **ChatGPT**.

## Claude (claude.ai web, desktop Chat, Cowork)

Plugins and marketplaces are added to the user's **account**, once, and then follow them to web chat, the desktop app, Cowork and Claude Code. There is no command for this; it is a few clicks on one settings page. Keep the conversation short: two user actions in total, each as a single message. Do not build or send plugin files.

1. If Juicebot tools are already callable here, skip to verification.
2. If you have a tool that lists the plugins on the user's account, call it for `juicebot` first. If the plugin is already there, skip to step 4. Otherwise, if you have a plugin-catalog search tool, search it for `juicebot`; if listed, render the install card and tell the user to click **Install**, then go to step 4.
3. **One message, all the clicks.** Do not open the settings page yourself; send exactly this and wait for the user to say they are done:

   > Open **https://claude.ai/new#settings/customize-plugins** in a separate tab or window (Ctrl/Cmd-click, or right-click → Open in new tab) so this chat stays put. In the app the same page is **Customize → Plugins**; in Cowork, open the Cowork tab first. Click **Add → Add marketplace → Add from a repository**, enter `aidenlab/plugins` and confirm. The **Discover** tab opens on its own; find **Juicebot** and click **Add**. Tell me when that's done.

4. **Confirm and connect the server.** When the user says it is done, call the tool that lists the plugins on their account, filtered to `juicebot`. It renders a card for the plugin with a **Manage** button. Then say, as one message:

   > Juicebot is on your account. Click **Manage** on the card above and turn on the **juicebot** server (its MCP connection). If there is no server switch there, open **Customize → Connectors** and enable **juicebot**; and if it is not listed there either, use **Settings → Connectors → Add custom connector** with the name `Juicebot`, the URL `https://juicebot-mcp.3dg.io/mcp`, no authentication.

   On a Team or Enterprise plan, mention once that an admin can add that connector for the whole organization.
5. The tools appear in a new conversation. End as described under "How to end your reply".

Everything added this way also reaches Claude Code the next time it starts signed in with the same account (or after `/login`).

## Claude Code

1. Check `claude plugin list` for `juicebot@aidenlab`. If present and enabled, skip to verification. If the user already added the plugin to their account (section above), it syncs in by itself; `/login` forces the sync.
2. Otherwise run `claude plugin install juicebot --marketplace aidenlab/plugins`. If that flag is unsupported, run `claude plugin marketplace add aidenlab/plugins` then `claude plugin install juicebot@aidenlab`.
3. Confirm with `claude plugin list`. The plugin bundles the server, so no separate connection is needed.
4. If the Juicebot tools are not callable in this conversation yet, tell the user to run `/reload-plugins` (or start a new session), then end as described under "How to end your reply".
5. If the user also has a claude.ai Juicebot connector, the tools appear twice; harmless. They can turn one off with `/mcp`.

## Codex

1. Check `codex plugin list` for `juicebot@aidenlab`. Reuse it if installed and enabled.
2. Otherwise run `codex plugin marketplace add aidenlab/plugins` then `codex plugin add juicebot@aidenlab`.
3. Verify: `codex plugin list` shows `installed, enabled`; `codex mcp list` shows `juicebot` with the server URL above. The plugin bundles the server; do not add it again with `codex mcp add`.
4. If the tools are not callable in this conversation, end as described under "How to end your reply"; add one line that restarting Codex fixes it if they still do not appear.

## ChatGPT

1. If Juicebot tools are already available here, skip to verification.
2. Otherwise guide the user: **chatgpt.com/plugins → + → Add custom MCP server**, name `Juicebot`, the server URL above, authentication **None**. Explain any confirmation ChatGPT shows in plain words. Custom MCP servers need a Pro, Team, Enterprise or Edu plan; on Free or Plus say so and stop, offering Claude Code or Codex as alternatives.
3. Then help them install the resulting plugin, start a new chat, and enable Juicebot in it (the tools menu or `@Juicebot`, whichever the app offers). If an option is missing, explain the account or workspace limitation you can verify and the next step.
4. ChatGPT gets tools and the server's built-in instructions; it does not get the plugin skill. That is fine.

## How to end your reply when the tools are not callable yet (every application)

Whenever setup is done but the Juicebot tools are not available in the current conversation, end your reply with exactly this shape, and nothing after it:

1. One or two short lines stating what is done (installed / connected) and that the tools appear in a new chat.
2. A line that says **Start a new chat and paste this:**
3. The message alone, in a fenced code block so the user can copy it with one click:

```
Open Juicebox, load the ENCODE GM12878 in situ Hi-C map, go to the HOXA cluster and add the gene track.
```

Do not put the message inside a bullet or a paragraph, do not add alternatives after it, and do not restate manual steps the user has already completed. Fallback instructions (another way to install) go *before* this block, and only if a step actually failed.

## Verification and first use (every application)

1. Call `get_juicebox_url`. Open the join link yourself if you have a browser tool; always also show it as a clickable link. Ask the user to confirm the page is open.
2. Do not send map commands until a page is connected. If a tool reports "no page connected", re-send the link.
3. Load the ENCODE GM12878 in situ Hi-C map (`search_map_catalogs`, then `load_map`), go to the HOXA cluster (`goto_locus`), and add the gene track (`load_track` with no URL).
4. Tell the user what they should see: a contact map, the HOXA region in the header, gene annotations under the map. Say which of installed / server connected / viewer working you have confirmed.
5. If the viewer disconnects, help them reopen the current join link; if the room has expired, get a fresh one.
6. Finish with three requests they can try: "Zoom out a little." "Go to MYC." "Create a link I can share showing this view." Explain in one sentence that the live join link puts people in the same session, while a shareable snapshot link preserves the current view.
