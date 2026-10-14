#!/usr/bin/env bash
# Turn a checkout of main into the dev branch: the marketplace/plugin get "-dev"
# names so they can coexist with the production install on one account, the
# install page becomes geenee-install-dev.3dg.io, and every Geenee hostname gets
# its -dev form (a no-op while main itself points at the dev deployment).
#
#   git checkout -B dev main && scripts/make-dev.sh && git commit -am "dev: regenerate from main"
#
# Idempotent: running it on an already-transformed tree changes nothing.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'EOF'
import json, re, pathlib

def sub(path, pairs):
    p = pathlib.Path(path); s = p.read_text(); orig = s
    for a, b in pairs:
        if b in s and b != a and a in b:
            continue  # already applied (keeps the script idempotent)
        s = s.replace(a, b)
    p.write_text(s)
    return s != orig

HOSTS = [
    ("https://geenee.3dg.io", "https://geenee-dev.3dg.io"),
    ("geenee-install.3dg.io", "geenee-install-dev.3dg.io"),
    ("juicebot-install.3dg.io", "juicebot-install-dev.3dg.io"),
]
NAMES = [
    ("juicebot@aidenlab", "juicebot-dev@aidenlab-dev"),
    ("--marketplace aidenlab/plugins", "--marketplace aidenlab/plugins#dev"),
    ("/plugin marketplace add aidenlab/plugins", "/plugin marketplace add aidenlab/plugins#dev"),
    ("claude plugin marketplace add aidenlab/plugins", "claude plugin marketplace add aidenlab/plugins#dev"),
    ("codex plugin marketplace add aidenlab/plugins", "codex plugin marketplace add aidenlab/plugins --ref dev"),
    ("plugin marketplace update aidenlab", "plugin marketplace update aidenlab-dev"),
    ("codex plugin marketplace upgrade aidenlab", "codex plugin marketplace upgrade aidenlab-dev"),
    ("plugin install juicebot ", "plugin install juicebot-dev "),
    ("Add from a repository → `aidenlab/plugins`", "Add from a repository → `aidenlab/plugins` (the dev branch cannot be chosen there: upload `juicebot-dev.plugin` from the latest dev release instead)"),
    ("Add from a repository**, enter `aidenlab/plugins`", "Add from a repository** is main-only; for the dev build use **Add → Upload plugin** with `juicebot-dev.plugin` from https://github.com/aidenlab/plugins/releases"),
    ("marketplace name `aidenlab`", "marketplace name `aidenlab-dev`, git branch `dev`"),
    ("**Geenee** server", "**Geenee-dev** server"),
    ("find **Geenee**", "find **Geenee-dev**"),
    ("enable **Geenee**", "enable **Geenee-dev**"),
    ("name `Geenee`", "name `Geenee-dev`"),
    ("`Geenee` server", "`Geenee-dev` server"),
    ("shows `Geenee` with", "shows `Geenee-dev` with"),
    ("Set up Geenee for me:", "Set up Geenee (dev) for me:"),
]
DOCS = ["README.md", "INSTALL-PROMPT.md", "plugins/juicebot/README.md", "install-worker/README.md",
        "plugins/juicebot/skills/geenee/SKILL.md", "plugins/juicebot/skills/geenee/references/cli.md",
        "plugins/juicebot/skills/geenee/references/tools.md"]
for d in DOCS:
    sub(d, HOSTS + NAMES)

# Banner on the two entry documents.
for d, banner in [("README.md", "> **Dev branch.** This is the `-dev` build of the plugin (`juicebot-dev@aidenlab-dev`, server name `Geenee-dev`), installable beside the production one. Production is on `main`.\n\n"),
                  ("INSTALL-PROMPT.md", "> Dev build: this installs **juicebot-dev** (display name Geenee (dev)) from the `dev` branch. Names below already say so; do not substitute the production ones.\n\n")]:
    p = pathlib.Path(d); s = p.read_text()
    if banner not in s:
        lines = s.split("\n", 1)
        p.write_text(lines[0] + "\n\n" + banner + lines[1].lstrip("\n"))

# Manifests: names, display name, versions.
def edit_json(path, fn):
    p = pathlib.Path(path); d = json.loads(p.read_text()); fn(d)
    p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
def devver(v): return v if v.endswith("-dev") else v + "-dev"
def plugin_manifest(d):
    d["name"] = "juicebot-dev"
    if "displayName" in d: d["displayName"] = "Geenee (dev)"
    d["version"] = devver(d["version"])
    if not d["description"].startswith("[dev build] "): d["description"] = "[dev build] " + d["description"]
    ui = d.get("extensions", {}).get("com.openai", {}).get("interface")
    if ui and "displayName" in ui: ui["displayName"] = "Geenee (dev)"
def marketplace(d):
    d["name"] = "aidenlab-dev"
    d["metadata"]["version"] = devver(d["metadata"]["version"])
    for pl in d["plugins"]:
        if pl["name"] == "juicebot":
            pl["name"] = "juicebot-dev"; pl["version"] = devver(pl["version"])
            if "displayName" in pl: pl["displayName"] = "Geenee (dev)"
            if not pl["description"].startswith("[dev build] "): pl["description"] = "[dev build] " + pl["description"]
def mcp(d):
    key = "servers" if "servers" in d else "mcpServers"
    for old in ("Geenee", "JuiceBot", "juicebot"):
        if old in d[key]:
            d[key]["Geenee-dev"] = d[key].pop(old)
    for v in d[key].values():
        for a, b in HOSTS: v["url"] = v["url"].replace(a, b)
edit_json("plugins/juicebot/.claude-plugin/plugin.json", plugin_manifest)
edit_json("plugins/juicebot/plugin.json", plugin_manifest)
edit_json(".claude-plugin/marketplace.json", marketplace)
edit_json(".agents/plugins/marketplace.json", marketplace)
edit_json("plugins/juicebot/.mcp.json", mcp)
edit_json("plugins/juicebot/mcp.json", mcp)

# Skill frontmatter: say which build.
sub("plugins/juicebot/skills/geenee/SKILL.md",
    [("description: Drives Geenee, the Aiden Lab's genome workspace", "description: Drives Geenee (DEV build of the plugin), the Aiden Lab's genome workspace")])

# CLI scripts: dev profile (separate state file), dev User-Agent.
sub("plugins/juicebot/skills/geenee/scripts/geenee.py", [
    ('PROFILE = ""', 'PROFILE = "dev"'),
    ('USER_AGENT = "geenee-cli/2.0', 'USER_AGENT = "geenee-cli-dev/2.0'),
])
sub("plugins/juicebot/skills/geenee/scripts/geenee.mjs", [
    ("const PROFILE = '';", "const PROFILE = 'dev';"),
    ("const USER_AGENT = 'geenee-cli/2.0", "const USER_AGENT = 'geenee-cli-dev/2.0"),
])

# Release workflow: dev tags, prerelease, dev-named asset.
sub(".github/workflows/release.yml", [
    ('tags: ["v*"]', 'tags: ["v*-dev*"]'),
    ("run: scripts/package.sh juicebot\n", "run: scripts/package.sh juicebot juicebot-dev\n"),
    ("files: dist/juicebot.plugin", "files: dist/juicebot-dev.plugin\n          prerelease: true"),
])
print("dev transform applied")
EOF
