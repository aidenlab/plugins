#!/usr/bin/env bash
# Smoke-test both CLIs against the live server. No viewer needed: the last call
# must fail with "No page is connected" (exit 2), which proves the round trip.
set -u
cd "$(dirname "$0")/../plugins/juicebot/skills/juicebot/scripts"
export JUICEBOT_STATE="${TMPDIR:-/tmp}/juicebot-test-state.json"
fail=0
for cli in "python3 juicebot.py" "node juicebot.mjs"; do
  echo "== $cli"
  rm -f "$JUICEBOT_STATE"
  $cli url | grep -q '?room=' || { echo "FAIL: url"; fail=1; }
  $cli status | grep -q 'Browser Connected' || { echo "FAIL: status"; fail=1; }
  [ "$($cli tools | wc -l)" -ge 30 ] || { echo "FAIL: tools"; fail=1; }
  $cli call search_map_catalogs '{"query":"GM12878"}' | grep -q '^Found' || { echo "FAIL: search"; fail=1; }
  $cli call goto_locus '{"locus":"MYC"}' >/dev/null 2>&1; [ $? -eq 2 ] || { echo "FAIL: expected exit 2 without a page"; fail=1; }
  $cli --json call get_server_status | python3 -c 'import json,sys; json.load(sys.stdin)' || { echo "FAIL: --json"; fail=1; }
done
rm -f "$JUICEBOT_STATE"
[ $fail -eq 0 ] && echo "all passed" || exit 1
