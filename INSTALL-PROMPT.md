# Install Juicebot with one prompt

Copy the block below and paste it into **Claude Code** (terminal or desktop) or into a **Cowork** task. Claude does the rest.

```
Install the Aiden Lab "juicebot" Claude plugin for me.

Marketplace: aidenlab/claude-plugins (GitHub). Plugin name: juicebot.

If you are running inside Claude Code (you have a shell and the `claude` CLI):
  1. Run: claude plugin install juicebot --marketplace aidenlab/claude-plugins
     (if that flag is unsupported: claude plugin marketplace add aidenlab/claude-plugins, then claude plugin install juicebot@aidenlab)
  2. Run `claude plugin list` and confirm juicebot@aidenlab is enabled.
  3. Tell me to restart Claude Code (or run /mcp and reconnect) so the juicebot MCP tools load.

If you are running inside Cowork or the Claude desktop app (no persistent CLI):
  1. Fetch https://github.com/aidenlab/claude-plugins and package the plugins/juicebot directory as a zip named juicebot.plugin (the zip's root must contain .claude-plugin/plugin.json, .mcp.json and skills/).
  2. Send me juicebot.plugin so I can accept it from the chat.
  3. Also tell me the manual path in case I prefer it: Cowork tab → Customize → Plugins → Add → Add marketplace → Add from a repository → aidenlab/claude-plugins → Discover → Juicebot → Add.

Either way, finish by telling me how to try it: ask "Open Juicebox and load the ENCODE GM12878 map at HOXA", open the join link you return in a browser tab, and the map will appear there.
```
