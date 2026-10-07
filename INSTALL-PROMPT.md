# Install Juicebot with one prompt

Copy the block below and paste it into **Claude Code** (terminal or desktop) or into a **Cowork** task. Claude does the rest.

```
Install the Aiden Lab "juicebot" Claude plugin for me and get its MCP server connected.

Marketplace: aidenlab/plugins (GitHub). Plugin name: juicebot.
MCP server: https://juicebox-mcp-v2.aidenlab.workers.dev/mcp (Streamable HTTP, no auth).

If you are running inside Claude Code (you have a shell and the `claude` CLI):
  1. Run: claude plugin install juicebot --marketplace aidenlab/plugins
     (if that flag is unsupported: claude plugin marketplace add aidenlab/plugins, then claude plugin install juicebot@aidenlab)
  2. Run `claude plugin list` and confirm juicebot@aidenlab is enabled.
  3. Tell me to run /reload-plugins in this session (or start a new one) so the juicebot tools attach. The plugin bundles the server, so nothing else is needed here.

If you are running inside Cowork or the Claude desktop app (no persistent CLI):
  1. Fetch https://github.com/aidenlab/plugins and package the plugins/juicebot directory as a zip named juicebot.plugin (the zip's root must contain .claude-plugin/plugin.json, .mcp.json and skills/).
  2. Send me juicebot.plugin so I can accept it from the chat. That gives me the skill.
  3. Cowork does not start plugin MCP servers, so the tools come from a claude.ai connector. Tell me to add one: Settings → Connectors → Add custom connector, name "Juicebot", URL https://juicebox-mcp-v2.aidenlab.workers.dev/mcp, no auth. If I am on a Team/Enterprise plan, say that an admin can add it once as an organization connector instead. Mention that this connector also shows up in Claude Code automatically.
  4. Also give me the manual plugin path in case I prefer it: Cowork tab → Customize → Plugins → Add → Add marketplace → Add from a repository → aidenlab/plugins → Discover → Juicebot → Add.

Either way, finish by telling me how to try it: ask "Open Juicebox, load the ENCODE GM12878 in situ Hi-C map, go to the HOXA cluster and add the gene track", open the join link you return in a browser tab, and watch the map load, jump to HOXA and show a gene track under it.
```
