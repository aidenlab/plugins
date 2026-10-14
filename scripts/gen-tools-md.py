#!/usr/bin/env python3
"""Regenerate plugins/juicebot/skills/geenee/references/tools.md from the live
server's tools/list, so the reference never drifts from what the server serves.

  scripts/gen-tools-md.py [MCP_URL]      default: https://geenee-dev.3dg.io/mcp
"""
import json
import os
import sys
import urllib.request

URL = sys.argv[1] if len(sys.argv) > 1 else "https://geenee-dev.3dg.io/mcp"
OUT = os.path.join(os.path.dirname(__file__), "..", "plugins", "juicebot", "skills", "geenee", "references", "tools.md")

GROUPS = [
    ("Opening the Workspace", ["open_geenee"]),
    ("IGV: navigation", ["igv_go_to_gene", "igv_go_to_locus", "igv_zoom_in", "igv_zoom_out", "igv_change_genome"]),
    ("IGV: tracks and data", ["igv_search_catalogues", "igv_load_tracks", "igv_remove_track", "igv_set_track_height"]),
    ("IGV: view, state and sharing", ["igv_set_crosshairs", "igv_set_centre_line", "igv_read_session_summary", "igv_get_shareable_url"]),
    ("Juicebox: status and help", ["juicebox_get_server_status", "juicebox_help"]),
    ("Juicebox: finding data", ["juicebox_search_map_catalogs", "juicebox_get_map_details", "juicebox_search_encode_hic",
                                "juicebox_search_encode", "juicebox_list_data_sources", "juicebox_get_data_source_statistics"]),
    ("Juicebox: maps and navigation", ["juicebox_load_map", "juicebox_load_control_map", "juicebox_goto_locus", "juicebox_zoom_in",
                                       "juicebox_zoom_out", "juicebox_select_normalization", "juicebox_set_color_scale",
                                       "juicebox_set_map_foreground_color", "juicebox_set_map_background_color"]),
    ("Juicebox: panels", ["juicebox_list_panels", "juicebox_close_panel"]),
    ("Juicebox: tracks", ["juicebox_load_track", "juicebox_list_tracks", "juicebox_remove_track", "juicebox_set_track_color",
                          "juicebox_set_track_name", "juicebox_set_track_data_range", "juicebox_set_track_autoscale",
                          "juicebox_set_track_log_scale"]),
    ("Juicebox: sessions and sharing", ["juicebox_save_session", "juicebox_load_session", "juicebox_create_shareable_url"]),
]


def fetch_tools(url):
    msg = {"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
    req = urllib.request.Request(url, data=json.dumps(msg).encode(), method="POST", headers={
        "Content-Type": "application/json", "Accept": "application/json, text/event-stream",
        "User-Agent": "geenee-cli/2.0 (+https://github.com/aidenlab/plugins)"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())["result"]["tools"]


def typename(schema):
    t = schema.get("type")
    if isinstance(t, list):
        return "/".join(t)
    if t == "array":
        items = schema.get("items") or {}
        return "array of " + (typename(items) if isinstance(items, dict) and items.get("type") else "values")
    if "enum" in schema:
        return "one of " + ", ".join("`%s`" % e for e in schema["enum"])
    if "anyOf" in schema:
        return "/".join(typename(s) for s in schema["anyOf"])
    return t or "value"


def arg_lines(schema, indent=""):
    props = schema.get("properties") or {}
    required = set(schema.get("required") or [])
    lines = []
    for name, s in props.items():
        if name == "room":
            continue
        desc = (s.get("description") or "").strip().replace("\n", " ")
        flag = "required" if name in required else "optional"
        line = "%s- `%s` (%s, %s)" % (indent, name, typename(s), flag)
        if "default" in s:
            line += ", default `%s`" % json.dumps(s["default"])
        lines.append(line + (": " + desc if desc else ""))
        items = s.get("items")
        if isinstance(items, dict) and items.get("properties"):
            lines.extend(arg_lines(items, indent + "  "))
    return lines


def main():
    tools = {t["name"]: t for t in fetch_tools(URL)}
    grouped = {n for _, names in GROUPS for n in names}
    missing = [n for n in tools if n not in grouped]
    out = ["# Geenee tool reference", "",
           "Generated from the live server's `tools/list` (%d tools) by `scripts/gen-tools-md.py`. Call them as MCP tools when the "
           "connector is present, or as `geenee.py call <name> '<json>'` otherwise; names and arguments are identical. Every tool "
           "except `open_geenee` also takes `room` (string, required): the Room id from the reply of `open_geenee`. It is left "
           "out of the argument lists below; the CLI fills it in." % len(tools), "", "## Contents", ""]
    for title, names in GROUPS:
        present = [n for n in names if n in tools]
        if present:
            out.append("- %s: %s" % (title, ", ".join("`%s`" % n for n in present)))
    if missing:
        out.append("- Other: %s" % ", ".join("`%s`" % n for n in missing))
    out.append("")
    for title, names in GROUPS + ([("Other", missing)] if missing else []):
        present = [n for n in names if n in tools]
        if not present:
            continue
        out += ["## " + title, ""]
        for n in present:
            t = tools[n]
            out += ["### `%s`" % n, "", (t.get("description") or "").strip(), ""]
            args = arg_lines(t.get("inputSchema") or {})
            out += args if args else ["- no arguments besides `room`" if n != "open_geenee" else "- `room` (string, optional): reopen an existing Room instead of minting a new one"]
            out.append("")
    with open(OUT, "w") as f:
        f.write("\n".join(out).rstrip() + "\n")
    print("wrote %s (%d tools%s)" % (os.path.normpath(OUT), len(tools), ", %d ungrouped" % len(missing) if missing else ""))


if __name__ == "__main__":
    main()
