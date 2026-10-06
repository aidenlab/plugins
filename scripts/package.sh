#!/usr/bin/env bash
# Build dist/<plugin>.plugin (a zip of the plugin directory contents) for
# "Upload plugin" installs in Cowork / the Claude desktop app and for org-admin uploads.
# Usage: scripts/package.sh [plugin-name]   (default: juicebot)
set -euo pipefail
cd "$(dirname "$0")/.."
name="${1:-juicebot}"
src="plugins/$name"
[ -f "$src/.claude-plugin/plugin.json" ] || { echo "no plugin at $src" >&2; exit 1; }
if command -v claude >/dev/null 2>&1; then
  claude plugin validate "$src"
fi
mkdir -p dist
out="$(pwd)/dist/$name.plugin"
rm -f "$out"
(cd "$src" && zip -qr "$out" . -x "*.DS_Store" -x "setup/*")
echo "wrote $out"
unzip -l "$out"
