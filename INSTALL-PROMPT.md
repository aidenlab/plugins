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
- A Claude desktop app task (Cowork): a shell and a file-sending tool but no `claude` CLI → **Cowork / Claude desktop app**.
- claude.ai chat: no shell → **claude.ai chat**.
- A shell with the `codex` CLI → **Codex**.
- ChatGPT → **ChatGPT**.

## Claude Code

1. Check `claude plugin list` for `juicebot@aidenlab`. If present and enabled, skip to verification.
2. Run `claude plugin install juicebot --marketplace aidenlab/plugins`. If that flag is unsupported, run `claude plugin marketplace add aidenlab/plugins` then `claude plugin install juicebot@aidenlab`.
3. Confirm with `claude plugin list`. The plugin bundles the server, so no separate connection is needed.
4. If the Juicebot tools are not callable in this conversation yet, tell the user to run `/reload-plugins` (or start a new session), then end as described under "How to end your reply".
5. If the user also has a claude.ai Juicebot connector, the tools appear twice; harmless. They can turn one off with `/mcp`.

## Cowork / Claude desktop app

You have a shell and a tool that sends files into the chat. Use them; do not hand the user a list of manual steps unless a step below fails.

1. If Juicebot tools are already callable here, skip to verification.
2. If you have a plugin-catalog search tool, search it for `juicebot`. If it is listed (organization marketplace or Anthropic's directory), render the install card and tell the user to click **Install**; then continue at step 4. If it is not listed, go on.
3. Build the plugin file yourself and send it. In your shell: `git clone --depth 1 https://github.com/aidenlab/plugins`, then zip the *contents* of `plugins/juicebot` into a file named `juicebot.plugin` so that `.claude-plugin/plugin.json`, `.mcp.json` and `skills/` sit at the zip root (`cd plugins/plugins/juicebot && zip -r ../../../juicebot.plugin .`). If `git` is unavailable, download the ready-made release asset instead: `curl -L -o juicebot.plugin https://github.com/aidenlab/plugins/releases/latest/download/juicebot.plugin` (do not use GitHub's `archive/…zip` URL; some sessions block it). Send `juicebot.plugin` to the user with your file-sending tool and tell them to press **Add** on the card that appears. That installs the skill and registers the plugin's `juicebot` MCP server.
4. Connect the server. After they add the plugin, tell them to look in **Customize → Connectors** (or the connectors list in the chat's tools menu) for **juicebot** and enable it; a new conversation then has the tools. If no such entry appears, have them add it as a custom connector: **Settings → Connectors → Add custom connector**, name `Juicebot`, the server URL above, no authentication. On a Team or Enterprise plan an admin can add that connector once for the whole organization, and it also shows up in Claude Code automatically.
5. Fallback if the file card cannot be accepted: **Cowork tab → Customize → Plugins → Add → Add marketplace → Add from a repository → `aidenlab/plugins` → Discover → Juicebot → Add**.
6. Tools usually appear only in a new conversation. If they are not callable now, end as described under "How to end your reply".

## claude.ai chat

No shell and no plugins here; the tools come from a connector and the server's built-in instructions. Walk the user through **Settings → Connectors → Add custom connector**, name `Juicebot`, the server URL above, no authentication, one step at a time; then a new chat. On Team or Enterprise, an admin can add it as an organization connector once.

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
