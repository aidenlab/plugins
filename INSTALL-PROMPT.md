# Juicebot setup — instructions for the assistant

You are reading this because a user pasted a one-line request to set up Juicebot. Follow it in the application you are running in. Talk to the user as someone comfortable with chat but unfamiliar with plugins, terminals and MCP: plain language, short explanations, one action at a time when their participation is needed. Perform every step you can yourself; never ask them to type a terminal command you could run.

Start by telling them, in one or two sentences: Juicebot lets them control the Juicebox genome viewer by typing ordinary requests. The map appears in a browser tab, which must stay open while you work together.

## Facts

- Marketplace: `aidenlab/plugins` on GitHub (marketplace name `aidenlab`). Plugin: `juicebot`, so `juicebot@aidenlab`.
- MCP server: `https://juicebox-mcp-v2.aidenlab.workers.dev/mcp`, Streamable HTTP, no authentication. It sends workflow instructions to every client on connect; the plugin adds a fuller skill on top.
- A server connection supplies tools. The plugin supplies the skill. Both is best; tools alone are enough to work.
- Reuse anything already installed or connected. Never add a second connection to the same server.
- Distinguish three states and report only what you have verified: **installed** (plugin present and enabled), **server connected** (Juicebot tools are callable in this conversation), **viewer working** (a page answered a command).

## Which application am I in?

Decide from your own environment; ask the user only if you cannot tell.

- A shell with the `claude` CLI, or `/plugin` slash commands → **Claude Code**.
- A Claude desktop app task without a persistent shell, or claude.ai chat → **Cowork / Claude desktop / claude.ai**.
- A shell with the `codex` CLI → **Codex**.
- ChatGPT → **ChatGPT**.

## Claude Code

1. Check `claude plugin list` for `juicebot@aidenlab`. If present and enabled, skip to verification.
2. Run `claude plugin install juicebot --marketplace aidenlab/plugins`. If that flag is unsupported, run `claude plugin marketplace add aidenlab/plugins` then `claude plugin install juicebot@aidenlab`.
3. Confirm with `claude plugin list`. The plugin bundles the server, so no separate connection is needed.
4. If the Juicebot tools are not callable in this conversation yet, tell the user to run `/reload-plugins` (or start a new session) and give them the exact first message to paste afterwards: `Open Juicebox, load the ENCODE GM12878 in situ Hi-C map, go to the HOXA cluster and add the gene track.`
5. If the user also has a claude.ai Juicebot connector, the tools appear twice; harmless. They can turn one off with `/mcp`.

## Cowork, Claude desktop app, claude.ai

Cowork and claude.ai do not start a plugin's MCP server; the tools come from a connector.

1. If Juicebot tools are already callable here, the connector exists; skip to the plugin.
2. Otherwise walk the user through it, one step at a time: **Settings → Connectors → Add custom connector**, name `Juicebot`, the server URL above, no authentication. On a Team or Enterprise plan an admin can add it once as an organization connector so nobody else has to. Tell them this connector also shows up automatically in Claude Code when it is signed in with the same account.
3. Plugin, for the skill (Cowork and the desktop app only): if you can fetch the web, download `https://github.com/aidenlab/plugins/releases/latest/download/juicebot.plugin` and send it to the user as a file so they can accept it from the chat. Otherwise: **Cowork tab → Customize → Plugins → Add → Add marketplace → Add from a repository → `aidenlab/plugins` → Discover → Juicebot → Add**.
4. New connectors usually need a new conversation. If the tools are not callable now, say so and give the exact first message to paste in a fresh chat (the sentence in the Claude Code section).

## Codex

1. Check `codex plugin list` for `juicebot@aidenlab`. Reuse it if installed and enabled.
2. Otherwise run `codex plugin marketplace add aidenlab/plugins` then `codex plugin add juicebot@aidenlab`.
3. Verify: `codex plugin list` shows `installed, enabled`; `codex mcp list` shows `juicebot` with the server URL above. The plugin bundles the server; do not add it again with `codex mcp add`.
4. If the tools are not callable in this conversation, tell the user to start a new chat and give the exact first message to paste (the sentence in the Claude Code section). If they still do not appear, guide them through restarting Codex.

## ChatGPT

1. If Juicebot tools are already available here, skip to verification.
2. Otherwise guide the user: **chatgpt.com/plugins → + → Add custom MCP server**, name `Juicebot`, the server URL above, authentication **None**. Explain any confirmation ChatGPT shows in plain words. Custom MCP servers need a Pro, Team, Enterprise or Edu plan; on Free or Plus say so and stop, offering Claude Code or Codex as alternatives.
3. Then help them install the resulting plugin, start a new chat, and enable Juicebot in it (the tools menu or `@Juicebot`, whichever the app offers). If an option is missing, explain the account or workspace limitation you can verify and the next step.
4. ChatGPT gets tools and the server's built-in instructions; it does not get the plugin skill. That is fine.

## Verification and first use (every application)

1. Call `get_juicebox_url`. Open the join link yourself if you have a browser tool; always also show it as a clickable link. Ask the user to confirm the page is open.
2. Do not send map commands until a page is connected. If a tool reports "no page connected", re-send the link.
3. Load the ENCODE GM12878 in situ Hi-C map (`search_map_catalogs`, then `load_map`), go to the HOXA cluster (`goto_locus`), and add the gene track (`load_track` with no URL).
4. Tell the user what they should see: a contact map, the HOXA region in the header, gene annotations under the map. Say which of installed / server connected / viewer working you have confirmed.
5. If the viewer disconnects, help them reopen the current join link; if the room has expired, get a fresh one.
6. Finish with three requests they can try: "Zoom out a little." "Go to MYC." "Create a link I can share showing this view." Explain in one sentence that the live join link puts people in the same session, while a shareable snapshot link preserves the current view.
