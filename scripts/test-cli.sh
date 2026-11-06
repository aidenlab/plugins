#!/usr/bin/env bash
# Smoke-test both CLIs against the live Geenee server. No viewer needed: calls
# that need a page must fail with exit 2, which proves the round trip.
set -u
cd "$(dirname "$0")/../plugins/geenee/skills/geenee/scripts"
export GEENEE_STATE="${TMPDIR:-/tmp}/geenee-test-state.json"
fail=0
for cli in "python3 geenee.py" "node geenee.mjs"; do
  echo "== $cli"
  rm -f "$GEENEE_STATE"
  $cli open | grep -q '?room=' || { echo "FAIL: open"; fail=1; }
  room="$($cli room)"; [[ "$room" =~ ^[0-9A-HJKMNP-TV-Z]{10}$ ]] || { echo "FAIL: room id '$room'"; fail=1; }
  $cli status | grep -q '^Juicebox:' || { echo "FAIL: status"; fail=1; }
  $cli status | grep -q '^Spacewalk:' || { echo "FAIL: status (spacewalk)"; fail=1; }
  [ "$($cli tools | wc -l)" -ge 50 ] || { echo "FAIL: tools"; fail=1; }
  $cli call juicebox_search_map_catalogs '{"query":"GM12878"}' | grep -q '^Found' || { echo "FAIL: search"; fail=1; }
  $cli call juicebox_goto_locus '{"locus":"MYC"}' >/dev/null 2>&1; [ $? -eq 2 ] || { echo "FAIL: expected exit 2 without a page (juicebox)"; fail=1; }
  $cli call igv_go_to_gene '{"gene":"MYC"}' >/dev/null 2>&1; [ $? -eq 2 ] || { echo "FAIL: expected exit 2 without a page (igv)"; fail=1; }
  $cli --json call juicebox_get_server_status | python3 -c 'import json,sys; r=json.load(sys.stdin); assert "'"$room"'" in r["content"][0]["text"]' || { echo "FAIL: --json / room not passed"; fail=1; }
  # Switch to a real Room: geenee refuses ids it never issued (an expired Room stays expired).
  $cli reset >/dev/null; $cli open >/dev/null; other="$($cli room)"
  [ "$other" != "$room" ] || { echo "FAIL: reset did not open a new Room"; fail=1; }
  $cli room "$room" | grep -q "$room" || { echo "FAIL: room switch"; fail=1; }
  [ "$($cli room)" = "$room" ] || { echo "FAIL: room switch persisted"; fail=1; }
  $cli --room "$room" room | grep -q "$room" || { echo "FAIL: --room"; fail=1; }
done
rm -f "$GEENEE_STATE"
[ $fail -eq 0 ] && echo "all passed" || exit 1
