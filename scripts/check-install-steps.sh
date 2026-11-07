#!/usr/bin/env bash
# The Claude click-through steps exist twice: in README.md (canonical) and in
# INSTALL-PROMPT.md (sent word for word by the assistant). Fail if they differ.
set -eu
cd "$(dirname "$0")/.."
extract() { sed -n '/<!-- claude-steps:start -->/,/<!-- claude-steps:end -->/p' "$1"; }
a="$(extract README.md)"; b="$(extract INSTALL-PROMPT.md)"
[ -n "$a" ] || { echo "FAIL: no claude-steps block in README.md"; exit 1; }
if [ "$a" != "$b" ]; then
  echo "FAIL: Claude steps differ between README.md and INSTALL-PROMPT.md:"
  diff <(echo "$a") <(echo "$b") || true
  exit 1
fi
echo "Claude steps match"
