# From "here's an MCP URL" to a plugin: a guide for the geenee author

Written for someone who has built and shipped an MCP server (geenee) by handing people a URL to paste into their connector settings, and is now meeting this repo for the first time.

## The short version

- Your MCP server doesn't change. A **plugin** is a folder that **points at** your server URL and adds a **skill**: a Markdown playbook that teaches the assistant how to use your tools well.
- A **marketplace** is a GitHub repo (this one, `aidenlab/plugins`) holding a catalog of plugins. Users add the marketplace once, then install or update any plugin in it by name.
- **Geenee's plugin** has the id `geenee`, display name **Geenee**, version 1.0.0, and points at `https://geenee.3dg.io/mcp` (production). It replaces David's earlier `juicebot` plugin, which is retired. Its last state is kept in the git tag `juicebot-archive`.

## 1. What each piece is

| Piece | File(s) in this repo | What it does |
|---|---|---|
| Marketplace catalog | `.claude-plugin/marketplace.json` (Claude), `.agents/plugins/marketplace.json` (ChatGPT/Codex) | Lists the plugins in this repo, with their versions and where each one lives. |
| Plugin manifest | `plugins/geenee/.claude-plugin/plugin.json` (Claude), `plugins/geenee/plugin.json` (ChatGPT/Codex) | Name, version, description, icon, and a pointer to the MCP config. |
| MCP server config | `plugins/geenee/.mcp.json` (Claude, `type: http`), `plugins/geenee/mcp.json` (portable, `type: streamable-http`) | **Your URL lives here.** Installing the plugin installs the connection, so nobody pastes the URL. |
| Skill | `plugins/geenee/skills/geenee/SKILL.md` + `references/` + `scripts/` | Instructions the assistant loads when a conversation is about genomes, Hi-C, IGV and so on. |
| One-line installer | `INSTALL-PROMPT.md`, served by `install-worker/` at `geenee-install.3dg.io` | The user pastes one sentence, and the assistant reads this file and walks them through setup. |

Every piece exists twice because Claude and OpenAI each use their own manifest layout. One repo serves both.

## 2. What actually gets easier for users (and what doesn't)

Your understanding is mostly right, but how easy it gets depends on the app:

| App | Old way (URL) | Plugin way |
|---|---|---|
| **Claude Code** | `claude mcp add --transport http geenee <url>` | `claude plugin install geenee --marketplace aidenlab/plugins`: server **and** skill in one step, with updates through `/plugin update`. |
| **Codex** | `codex mcp add …` | `codex plugin marketplace add aidenlab/plugins` + `codex plugin add geenee@aidenlab` |
| **claude.ai / desktop / Cowork** | Settings → Connectors → Add custom connector → paste URL | Customize → Plugins → Add marketplace `aidenlab/plugins` → Geenee → Add, then Geenee's Connectors tab → **Connect** (claude.ai never connects a plugin's server automatically). **It's still a few clicks**, but they're done once per account and then reach every Claude surface, Claude Code included. |
| **ChatGPT** | Add custom MCP server → paste URL | **The same** for now: ChatGPT still needs the custom MCP server step. |

Two things smooth over what's left:

1. **The one-line install prompt.** Users paste *"Set up Geenee for me: fetch https://geenee-install.3dg.io and follow its instructions for the app you are running in."* In Claude Code and Codex the assistant installs everything itself. In claude.ai, the desktop app, Cowork and ChatGPT it cannot: a chat cannot change account settings, so it can only list the clicks. There, the prompt does not replace the settings page; it only explains it.
2. **A directory listing (not done yet).** Once the plugin is listed in Anthropic's community directory, it shows up in Claude's Discover tab with a one-click install card, and nobody has to add a marketplace. See "Directory listing" in `README.md`.

The other big gain is **upgrades**. With the URL approach, once someone has pasted it you can't reach them again. With a plugin you bump the version and push, and users get the new skill, a new URL or new tools through the update flow.

## 3. Skills: what they are, where they come from, who writes them

### What a skill is

A skill is a folder with a `SKILL.md`: YAML front matter (`name`, `description`) followed by Markdown instructions. The assistant loads it in stages:

1. **Always loaded:** only the `name` and `description` (a few lines). The `description` is effectively the **trigger**: it tells the model when the skill applies ("Use whenever the user mentions Geenee, IGV, Juicebox, Hi-C, .hic files, …").
2. **Loaded when triggered:** the body of `SKILL.md`, the playbook.
3. **Loaded only when needed:** files in `references/` (such as `tools.md`, the full argument reference) and scripts in `scripts/`.

That's why the skill can be long and detailed without filling every conversation's context. `claude plugin details geenee@aidenlab` shows the numbers: about 156 tokens in every session, and about 2.8k only when the skill fires.

### Who writes it and what it's based on

**It's written by hand.** Nothing generates it from your server automatically. The current `SKILL.md` was rewritten from David's earlier juicebot skill for three viewers and the production server; you're now its author. In practice people draft and revise skills with an assistant's help, but a person decides what goes in.

It's based on three sources:

1. **Your server's own instructions** (`geenee/src/instructions.ts`, sent to every client on connect). The skill's "Which viewer" section restates them.
2. **Your tool names and descriptions** (`tools/list`). The skill sums them up by task: "IGV in short", "Juicebox in short".
3. **What you learn from watching the model use the tools.** This is the part only a skill can carry: "call `open_geenee` once and reuse the Room id", "don't send viewer commands until the page is connected", "the Workspace link and a shareable link are different things, so never give one for the other", "chain independent calls". It's the know-how you'd otherwise tell a new user in person.

**The one generated part:** `references/tools.md` comes from the live `tools/list` via `scripts/gen-tools-md.py`. Rerun it whenever the tools change.

### Server instructions vs. skill: which goes where?

| Put it in the **server instructions** (geenee repo) | Put it in the **skill** (this repo) |
|---|---|
| Rules every client needs, including clients that never install the plugin (ChatGPT with only the URL, Cursor, …) | Fuller workflows, worked examples, first-run demo, troubleshooting |
| Short: hosts may read only the first 512 to 2,048 characters | Can be long, because it's loaded only when relevant |
| Changes when you deploy the server | Changes when you bump the plugin version |

geenee works with tools alone, and the skill makes the model *good* at it.

### The skill's fallback CLI

`skills/geenee/scripts/geenee.py` (and `.mjs`) calls the same server over plain HTTPS. It's there so the skill still works in Claude Code, Cowork or Codex when the MCP connection isn't set up: the model runs a shell command instead of calling an MCP tool. If you change how tools are called (the `room` argument, for example), check these scripts too and run `scripts/test-cli.sh`.

## 4. The routine for a change

1. Branch.
2. Make the change: the skill, a regenerated `tools.md` (`scripts/gen-tools-md.py`), the URL, and so on.
3. **Bump `version` in all four manifests** (`plugins/geenee/.claude-plugin/plugin.json`, `plugins/geenee/plugin.json`, and the `geenee` entry in both `marketplace.json` files). Without a bump, existing users won't get the change. **Never change `name: geenee`**: it's the install id, and renaming it breaks every existing install (which is how `juicebot` got stuck with a confusing name).
4. Validate: `claude plugin validate . && claude plugin validate ./plugins/geenee`, then `scripts/test-cli.sh`.
5. Try it without touching your own setup: `CLAUDE_CONFIG_DIR=$(mktemp -d) claude plugin marketplace add ./ && CLAUDE_CONFIG_DIR=… claude plugin install geenee@aidenlab`, or in your normal Claude Code `/plugin marketplace add ./`.
6. PR, merge, then `claude plugin tag plugins/geenee --push`. That pushes `geenee--v<version>`, and the release workflow attaches `geenee.plugin` to a GitHub release.

## 5. Going forward: what lives where

- **New or changed tools** → deploy geenee, rerun `gen-tools-md.py`, update `SKILL.md` if the workflow changed, bump the version.
- **New behavior rules every client needs** → `geenee/src/instructions.ts`.
- **New "how to use it well" know-how** → `SKILL.md`.
- **New URL** → see "Layout and maintenance" in `README.md` for every place it appears, plus a version bump.
- **A second, unrelated MCP server** → a new folder under `plugins/`, a new entry in both `marketplace.json` files. Copy `plugins/geenee` as a template.

Further reading: `README.md` ("Layout and maintenance"), `INSTALL-PROMPT.md`, and the `writing-for-agents` / `skill-creator` skills if you want help revising `SKILL.md`.
