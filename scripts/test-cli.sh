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
  out="$($cli open)"
  echo "$out" | grep -q '?room=' || { echo "FAIL: open"; fail=1; }
  room="$($cli room)"; [[ "$room" =~ ^[0-9A-HJKMNP-TV-Z]{10}$ ]] || { echo "FAIL: room id '$room'"; fail=1; }
  echo "$out" | grep -q "^Room link: https://.*/r/$room\$" && echo "$out" | grep -q "^QR code: https://.*/r/$room/qr.png\$" \
    && echo "$out" | grep -q "^Room id: $room\$" || { echo "FAIL: open (Room link, QR code, Room id)"; fail=1; }
  $cli --json open | python3 -c 'import json,sys; r=json.load(sys.stdin); assert set(r)=={"room","workspaceUrl","roomUrl","qrUrl"} and r["room"]=="'"$room"'" and r["qrUrl"]==r["roomUrl"]+"/qr.png"' || { echo "FAIL: open --json"; fail=1; }
  qr="$(echo "$out" | sed -n 's/^QR code: //p')"
  [ "$(curl -fsS -A geenee-cli-test "$qr" | head -c 8 | od -An -tx1 | tr -d ' \n')" = "89504e470d0a1a0a" ] || { echo "FAIL: QR code address is not a PNG"; fail=1; }
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
  out="$($cli share)"; code=$?
  [ $code -eq 0 ] && echo "$out" | grep -q "^Room link: https://.*/r/$room\$" && echo "$out" | grep -q "^QR code: https://.*/r/$room/qr.png\$" \
    && echo "$out" | grep -q "^Room id: $room\$" || { echo "FAIL: share"; fail=1; }
  echo "$out" | grep -qi "card" && { echo "FAIL: share printed the Card text"; fail=1; }
  [ "$($cli room)" = "$room" ] || { echo "FAIL: share changed the Room"; fail=1; }
  $cli --json share | python3 -c 'import json,sys; r=json.load(sys.stdin); assert set(r)=={"room","roomUrl","qrUrl"} and r["room"]=="'"$room"'" and r["qrUrl"]==r["roomUrl"]+"/qr.png"' || { echo "FAIL: share --json"; fail=1; }
  $cli --room 0000000000 share 2>&1 | grep -q "expired"; [ "${PIPESTATUS[0]}" -eq 2 ] || { echo "FAIL: share on an expired Room"; fail=1; }
  [ "$($cli room)" = "$room" ] || { echo "FAIL: share on an expired Room changed the saved Room"; fail=1; }
done
rm -f "$GEENEE_STATE"
[ $fail -eq 0 ] && echo "all passed" || exit 1
