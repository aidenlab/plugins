#!/usr/bin/env bash
# Turn a checkout of main into the dev branch: everything points at the Juicebot
# dev stack (MCP juicebot-mcp-dev.3dg.io, page juicebot-dev.3dg.io, install page
# juicebot-install-dev.3dg.io) and the marketplace/plugin get "-dev" names so they
# can coexist with the production install on one account.
#
#   git checkout -B dev main && scripts/make-dev.sh && git commit -am "dev: regenerate from main"
#
# Idempotent: running it on an already-transformed tree changes nothing.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'EOF'
import json, re, pathlib

def sub(path, pairs, must=True):
    p = pathlib.Path(path); s = p.read_text(); orig = s
    for a, b in pairs:
        if b in s and b != a and a in b:
            continue  # already applied (keeps the script idempotent)
        s = s.replace(a, b)
    p.write_text(s)
    return s != orig

HOSTS = [
    ("juicebot-mcp.3dg.io", "juicebot-mcp-dev.3dg.io"),
    ("juicebot-install.3dg.io", "juicebot-install-dev.3dg.io"),
    ("juicebox-v2.3dg.io", "juicebot-dev.3dg.io"),
]
NAMES = [
    ("juicebot@aidenlab", "juicebot-dev@aidenlab-dev"),
    ("--marketplace aidenlab/plugins", "--marketplace aidenlab/plugins#dev"),
    ("/plugin marketplace add aidenlab/plugins", "/plugin marketplace add aidenlab/plugins#dev"),
    ("claude plugin marketplace add aidenlab/plugins", "claude plugin marketplace add aidenlab/plugins#dev"),
    ("codex plugin marketplace add aidenlab/plugins", "codex plugin marketplace add aidenlab/plugins --ref dev"),
    ("plugin install juicebot ", "plugin install juicebot-dev "),
    ("codex plugin add juicebot-dev@aidenlab-dev", "codex plugin add juicebot-dev@aidenlab-dev"),
    ("Add from a repository → `aidenlab/plugins`", "Add from a repository → `aidenlab/plugins` (the dev branch cannot be chosen there: upload `juicebot-dev.plugin` from the latest dev release instead)"),
    ("Add from a repository**, enter `aidenlab/plugins`", "Add from a repository** is main-only; for the dev build use **Add → Upload plugin** with `juicebot-dev.plugin` from https://github.com/aidenlab/plugins/releases"),
    ("marketplace name `aidenlab`", "marketplace name `aidenlab-dev`, git branch `dev`"),
    ("**JuiceBot** server", "**JuiceBot-dev** server"),
    ("find **JuiceBot**", "find **JuiceBot-dev**"),
    ("enable **JuiceBot**", "enable **JuiceBot-dev**"),
    ("name `JuiceBot`", "name `JuiceBot-dev`"),
    ("`JuiceBot` server", "`JuiceBot-dev` server"),
]
DOCS = ["README.md", "INSTALL-PROMPT.md", "plugins/juicebot/README.md",
        "plugins/juicebot/skills/juicebot/SKILL.md", "plugins/juicebot/skills/juicebot/references/cli.md",
        "plugins/juicebot/skills/juicebot/references/tools.md"]
for d in DOCS:
    sub(d, HOSTS + NAMES)

# Sentences that describe the production arrangement.
sub("README.md", [("a custom domain that currently fronts the frozen demo Worker and will be moved to production without changing anything here. The CLIs fall back to the demo Worker's `workers.dev` address if the hostname ever fails.",
                   "the Juicebot dev stack (Worker `juicebot-mcp-dev`, page `juicebot-dev.3dg.io`). The dev CLIs have no fallback server.")])
sub("plugins/juicebot/skills/juicebot/references/cli.md", [("The scripts try `https://juicebot-mcp-dev.3dg.io/mcp` and then the frozen demo `https://juicebox-mcp-v2.aidenlab.workers.dev/mcp`, and remember the first that answers.",
                   "This dev copy of the scripts uses `https://juicebot-mcp-dev.3dg.io/mcp` only.")])
sub("plugins/juicebot/skills/juicebot/scripts/juicebot.py", [("JUICEBOT_URL     MCP endpoint, e.g. https://juicebot-mcp.3dg.io/mcp", "JUICEBOT_URL     MCP endpoint, e.g. https://juicebot-mcp-dev.3dg.io/mcp"),
    ("# Candidate endpoints, tried in order the first time a session is created. The\n# 3dg.io name is the lab's stable hostname (the Worker behind it may change);\n# the workers.dev name is the frozen demo deployment, kept as a fallback. Override with --server or\n# JUICEBOT_URL. The one that answers is remembered in the state file.",
     "# Dev branch: the dev stack only. Override with --server or JUICEBOT_URL.")])
sub("plugins/juicebot/skills/juicebot/scripts/juicebot.mjs", [("// Candidate endpoints, tried in order the first time a session is created. The\n// 3dg.io name is the lab's stable hostname; the workers.dev name is the frozen\n// demo deployment. Override with --server or JUICEBOT_URL.",
     "// Dev branch: the dev stack only. Override with --server or JUICEBOT_URL.")])

# Banner on the two entry documents.
for d, banner in [("README.md", "> **Dev branch.** Everything here points at the Juicebot *dev* stack (`juicebot-mcp-dev.3dg.io`, page `juicebot-dev.3dg.io`). Production is on `main`.\n\n"),
                  ("INSTALL-PROMPT.md", "> Dev build: this installs **juicebot-dev** from the `dev` branch against the dev stack (`juicebot-mcp-dev.3dg.io`). Names and URLs below already say so; do not substitute the production ones.\n\n")]:
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
    if "displayName" in d: d["displayName"] = "JuiceBot (dev)"
    d["version"] = devver(d["version"])
    if not d["description"].startswith("[dev stack] "): d["description"] = "[dev stack] " + d["description"]
    ext = d.get("extensions", {}).get("com.openai")
    if ext and "displayName" in ext: ext["displayName"] = "JuiceBot (dev)"
def marketplace(d):
    d["name"] = "aidenlab-dev"
    d["metadata"]["version"] = devver(d["metadata"]["version"])
    for pl in d["plugins"]:
        if pl["name"] == "juicebot":
            pl["name"] = "juicebot-dev"; pl["version"] = devver(pl["version"])
            if "displayName" in pl: pl["displayName"] = "JuiceBot (dev)"
            if not pl["description"].startswith("[dev stack] "): pl["description"] = "[dev stack] " + pl["description"]
def mcp(d):
    key = "servers" if "servers" in d else "mcpServers"
    for old in ("JuiceBot", "juicebot"):
        if old in d[key]:
            d[key]["JuiceBot-dev"] = d[key].pop(old)
    for v in d[key].values():
        for a, b in HOSTS: v["url"] = v["url"].replace(a, b)
edit_json("plugins/juicebot/.claude-plugin/plugin.json", plugin_manifest)
edit_json("plugins/juicebot/plugin.json", plugin_manifest)
edit_json(".claude-plugin/marketplace.json", marketplace)
edit_json(".agents/plugins/marketplace.json", marketplace)
edit_json("plugins/juicebot/.mcp.json", mcp)
edit_json("plugins/juicebot/mcp.json", mcp)

# Skill frontmatter: say which stack.
sub("plugins/juicebot/skills/juicebot/SKILL.md",
    [("description: Drives the Juicebox Hi-C contact-map viewer", "description: Drives the Juicebox Hi-C contact-map viewer (Juicebot DEV stack)")])

# CLI scripts: dev profile, dev server only (no fallback to the demo worker).
sub("plugins/juicebot/skills/juicebot/scripts/juicebot.py", [
    ('PROFILE = ""', 'PROFILE = "dev"'),
    ('SERVERS = [\n    "https://juicebot-mcp.3dg.io/mcp",\n    "https://juicebox-mcp-v2.aidenlab.workers.dev/mcp",\n]',
     'SERVERS = [\n    "https://juicebot-mcp-dev.3dg.io/mcp",\n]'),
    ('USER_AGENT = "juicebot-cli/1.0', 'USER_AGENT = "juicebot-cli-dev/1.0'),
])
sub("plugins/juicebot/skills/juicebot/scripts/juicebot.mjs", [
    ("const PROFILE = '';", "const PROFILE = 'dev';"),
    ("const SERVERS = [\n  'https://juicebot-mcp.3dg.io/mcp',\n  'https://juicebox-mcp-v2.aidenlab.workers.dev/mcp'\n];",
     "const SERVERS = [\n  'https://juicebot-mcp-dev.3dg.io/mcp'\n];"),
    ("const USER_AGENT = 'juicebot-cli/1.0", "const USER_AGENT = 'juicebot-cli-dev/1.0"),
])

# Release workflow: dev tags, prerelease, dev-named asset.
sub(".github/workflows/release.yml", [
    ('tags: ["v*"]', 'tags: ["v*-dev*"]'),
    ("run: scripts/package.sh juicebot\n", "run: scripts/package.sh juicebot juicebot-dev\n"),
    ("files: dist/juicebot.plugin", "files: dist/juicebot-dev.plugin\n          prerelease: true"),
])
print("dev transform applied")
EOF
