# Maintaining the aidenlab marketplace

## Layout

```
.claude-plugin/marketplace.json     Claude Code marketplace catalog
.agents/plugins/marketplace.json    OpenAI (Codex) marketplace catalog
plugins/geenee/                     the Geenee plugin
  .claude-plugin/plugin.json        Claude manifest
  .mcp.json                         Claude MCP server (type: http)
  plugin.json                       portable Agent Plugins manifest (Codex)
  mcp.json                          portable MCP server (type: streamable-http)
  skills/geenee/SKILL.md            the skill, shared by all
  skills/geenee/scripts/            geenee.py / geenee.mjs: connector-free CLI over HTTPS
  skills/geenee/references/         tools.md (generated from tools/list), cli.md
  assets/                           icon.png 512, icon-128.png (from docs/geenee-icon-source.png): for the OpenAI manifest and directory submissions
docs/install.html                   illustrated install cheat sheet
INSTALL-PROMPT.md                   what the one-line prompt fetches
install-worker/                     Cloudflare Worker serving it at geenee-install.3dg.io
scripts/gen-tools-md.py             regenerates references/tools.md from the live server
scripts/package.sh                  builds dist/geenee.plugin
scripts/test-cli.sh                 smoke-tests both CLIs against the live server
scripts/check-install-steps.sh      fails if the Claude steps in README.md and INSTALL-PROMPT.md differ
```

## Rules

- **Server URL** is `https://geenee.3dg.io/mcp`. To change it, edit both MCP files, `SERVERS` in both CLI scripts, the default in `scripts/gen-tools-md.py`, and the docs (`grep -rn geenee.3dg.io .`).
- **Bump `version`** in all four manifests on any change. Users update with `claude plugin marketplace update aidenlab` + `claude plugin update geenee@aidenlab`, or `codex plugin marketplace upgrade aidenlab`.
- **Marketplace only** ([ADR 0001](adr/0001-marketplace-only-distribution.md)). Never document adding the server URL by hand as an install route.
- **The Claude click-through steps** live between `<!-- claude-steps -->` markers in `README.md` (canonical) and `INSTALL-PROMPT.md` (sent word for word). Edit both; `scripts/check-install-steps.sh` (also run in CI) catches drift. Mirror changes in `docs/install.html` by hand.
- **Never rename the plugin `name`.** It is the install id; a rename breaks every install.

## Commands

- Validate: `claude plugin validate . && claude plugin validate ./plugins/geenee`; for Codex, `codex plugin marketplace add ./ && codex plugin add geenee@aidenlab`.
- CLI smoke test: `scripts/test-cli.sh`.
- After a tool change: `scripts/gen-tools-md.py` (new tools land under "Other" until added to `GROUPS`).
- Release: `claude plugin tag plugins/geenee --push` pushes `geenee--v<version>`; the workflow attaches `geenee.plugin` to the GitHub release.

## Where installs can and cannot be automated

| App | Can the assistant install it? | Path |
|---|---|---|
| Claude Code | Yes, runs `claude plugin install` | marketplace |
| Codex | Yes, runs `codex plugin add` | marketplace |
| claude.ai / desktop / Cowork | No: account settings, user clicks | marketplace on the plugins page |
| ChatGPT desktop (Codex) | Yes, via Codex; user clicks Approve | marketplace |
| Plain ChatGPT chat | No: sent to Codex in the ChatGPT desktop app | none |

The only true one-click on claude.ai is a listing in Anthropic's plugin directory: the chat can then show an **Install** card. Submit at [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit) (or [claude.ai admin settings](https://claude.ai/admin-settings/directory/submissions/plugins/new) for a Team/Enterprise owner); run `claude plugin validate ./plugins/geenee` first.

## Organizations

- **Connector:** an Owner may need to add the plugin's bundled connector under Organization settings → Connectors before members can connect it, and to allow user-added marketplaces (Plugins & skills → Policy → User-created skills).
- **Plugin:** Organization settings → Plugins & skills → Marketplaces → Sync from GitHub (needs a private or internal mirror with the Claude GitHub App), or upload the release's `geenee.plugin`. See [Manage plugins for your organization](https://support.claude.com/en/articles/13837433-manage-plugins-for-your-organization).

## Retired juicebot

`juicebot` is no longer updated; its last state is the git tag `juicebot-archive`. Users replace it: Claude Code `claude plugin uninstall juicebot@aidenlab` then install geenee; Codex remove `juicebot@aidenlab`, `codex plugin marketplace upgrade aidenlab`, `codex plugin add geenee@aidenlab`; claude.ai remove JuiceBot on the plugins page and any JuiceBot connector; ChatGPT remove any JuiceBot, `geenee-dev` or hand-added Geenee server, then install through Codex.
