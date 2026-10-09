---
name: juicebot
description: Drives the Juicebox Hi-C contact-map viewer (Juicebot DEV stack) through the JuiceBot MCP tools, or through the bundled juicebot CLI when the MCP connector is not available. Use whenever the user mentions Juicebox, JuiceBot, Hi-C maps, contact maps, .hic files, loops, TADs, compartments, ENCODE or 4DN Hi-C data, or asks to load, navigate, compare, track, or share a genome map view.
---

# JuiceBot: Juicebox from Claude

JuiceBot drives a Juicebox viewer running in the user's browser. Tools never return images; they push commands to a page over a WebSocket "room". A viewer tab must be open for anything visible to happen.

## Tools or CLI

Check once, at the start:

- **MCP tools present** (`get_juicebox_url`, `load_map`, ... are callable): use them.
- **Not present**: run the bundled CLI from a shell. Same tool names, same JSON arguments, same text results.

```bash
J="python3 ${CLAUDE_PLUGIN_ROOT}/skills/juicebot/scripts/juicebot.py"   # or node .../juicebot.mjs
$J url                                   # join link (starts a session = a room)
$J status                                # "Browser Connected: Yes" once the page is open
$J call goto_locus '{"locus":"MYC"}'     # any tool: call NAME 'JSON'
$J call load_map '{"url":"...hic","locus":"HOXA1"}' load_track '{"url":"genes"}'   # several in one go
```

If `${CLAUDE_PLUGIN_ROOT}` is unset, find the script with `find ~/.claude ~/.codex -path '*juicebot/scripts/juicebot.py' | head -1`, or download it: `curl -fsSL https://juicebot-install-dev.3dg.io/juicebot.py -o juicebot.py`. No dependencies. Exit code 2 means the tool reported an error (its message is printed); 1 means the server was unreachable. Details, options and troubleshooting: see `references/cli.md`.

Chain calls that do not depend on each other into one `call` so the user waits for one shell command, not three. Do not retry a call that said "No page is connected"; re-send the join link instead.

## Session start

1. Get the join link (`get_juicebox_url` or `$J url`). If a browser tool is available (Claude's built-in browser or Claude in Chrome), open the link in it right away so Juicebox sits beside the conversation; always also give the user the link as a plain clickable URL, never in a code block. Otherwise ask them to open it in a tab.
2. Do not send map commands until a page is connected: the user confirms, or `get_server_status` / `$J status` shows `Browser Connected: Yes`.
3. If the user pastes a join link they already have (a page's "Start room" link, or a colleague's), use `join_room` / `$J join <link>` instead. Everyone in a room sees the same view, which is also how a group looks at one map together.
4. "No page is connected" or "sent, unconfirmed" means the tab is closed, still loading, or on another room: re-send the join link. A `room-expired` error (24 h idle) means get a fresh link.

## First run: make it visible

After the first `load_map` and `goto_locus`, add the gene track (`load_track` with `"url": "genes"`, which loads RefSeq Select for the map's genome) unless the user said otherwise, and tell them what to look for: a contact map, the locus in the header, gene annotations under the map. Report only what is verified, and keep the three states apart: *installed* (the plugin), *server connected* (tools or CLI answer), *viewer working* (a page acknowledged a command).

## Finding data

- `search_map_catalogs`: the curated ENCODE (~176 cell-line maps) and 4DN (~600 maps) catalogs; fast; use first for "find a GM12878 map" or "mouse heart Hi-C". The result lists each map's `.hic` URL; `get_map_details` gives the full metadata of one hit. Use these URLs; never guess an ENCODE file accession.
- `search_encode_hic`: the live ENCODE portal for Hi-C experiments, with each experiment's contact-map files and the companion files the viewer can load as tracks (loops, domains, stripes as bedpe; subcompartments as bed; compartments as bigWig). Use for tissues, intact Hi-C, or anything the catalog lacks.
- `search_encode`: everything else on ENCODE (ChIP-seq, DNase, ATAC, RNA-seq, annotations), to find tracks to overlay.
- `list_data_sources`, `get_data_source_statistics`: what is searchable and how it breaks down.

Prefer GRCh38/hg38 unless the user names an assembly, and match a track's assembly to the loaded map.

## Loading and navigating

- `load_map(url, name?, normalization?, locus?, panel?)`: default KR; fall back to VC or SCALE if the file lacks KR (`select_normalization` lists what is available). Pass `locus` when the user already named a region.
- `goto_locus`: gene names (`BRCA1`), `chr1:1,000,000-2,000,000`, whole chromosomes, or two loci for off-diagonal views (`"chr1:1-2000000 chr1:3000000-5000000"`).
- `zoom_in` / `zoom_out`: one step each; use `goto_locus` with an explicit range for big jumps.
- `load_track(url, ...)`: bigWig, bigBed, bedGraph, bed, bedpe, interact and annotation formats, detected by extension; `"genes"` is the built-in gene track. Then `set_track_color`, `set_track_name`, `set_track_data_range`, `set_track_autoscale`, `set_track_log_scale`, `remove_track`; `list_tracks` shows names and 1-based numbers.
- Appearance: `set_color_scale` (lower the threshold to reveal weak long-range contacts, raise it when the diagonal saturates), `set_map_foreground_color`, `set_map_background_color`; colors are `#rrggbb`.
- `load_control_map`: a second map shown as observed-over-control in the same panel, for "treated vs. untreated at this locus".

## Panels

A page can hold several viewers numbered 1, 2, ... from the left. `load_map` with `panel: "new"` opens another beside the others. With more than one panel open, every panel-scoped tool requires `panel`: a position, a unique map name, or `"all"` (not for `load_map`, `load_control_map`, `list_tracks`, `close_panel`). `list_panels` shows what is open; an error from a missing `panel` lists them. `close_panel` shifts the ones to its right left; the last panel cannot be closed.

"Show K562 next to GM12878 at MYC": load the first map, `load_map` with `panel: "new"` for the second, then `goto_locus` with `panel: "all"`.

## Saving and sharing

- `save_session` returns the session JSON as text (the server has no filesystem); offer to save it to a file.
- `load_session` restores from pasted JSON, an attached file, or a URL.
- `create_shareable_url` makes a snapshot link that reopens the current view for anyone. The join link is different: live and shared, not a snapshot.

## Conventions

- After each action, one short line on what the user will see; the tool result is a confirmation, not a picture. For a figure, point them to the viewer's own export.
- Chain searches into loads when the intent is clear ("load the GM12878 map and go to HOXA" is one task).
- Report tool errors verbatim; most are about the page not being connected or a missing `panel`.
- `juicebox_help` is a user-facing quick start; use it only when the user asks how to use Juicebox. `get_server_status` is for connectivity.
- Every tool's arguments: `references/tools.md`.
