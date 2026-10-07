---
name: juicebot
description: Drives the Juicebox Hi-C contact-map viewer through the juicebot MCP tools. Use whenever the user mentions Juicebox, Juicebot, Hi-C maps, contact maps, .hic files, loops/TADs/compartments, ENCODE or 4DN Hi-C data, or asks to load, navigate, compare, track, or share a genome map view.
---

# Juicebot: Juicebox from Claude

The `juicebot` MCP server exposes tools that drive a Juicebox viewer running in the user's browser. Tools never return images; they push commands to the page over a WebSocket "room". The viewer must be open in a browser tab for anything visual to happen.

## Session start (always)

1. Call `get_juicebox_url` once. It returns a join link (`…?room=<id>`) and a QR code. If a browser tool is available (Claude's built-in browser or Claude in Chrome), open the join link in it right away so Juicebox sits beside the conversation; always also give the user the link as a plain clickable URL (never in a code block). Otherwise ask them to open it in a browser tab. Do not call other viewer tools until a page is connected (they confirm, or a tool stops returning "no page connected").
2. On a first session, make the result visible: after `load_map` and `goto_locus`, add the gene track (`load_track` with no URL loads RefSeq Select) unless the user said otherwise, and tell them what to look for: map tiles, the locus in the header, a gene track under the map.
3. If the user pastes a join link they already have (they clicked "Start room" in Juicebox, or a colleague shared one), call `join_room` with it instead. Every page in the same room stays in sync, so this is also how a group looks at one view together.
4. If a tool returns "no page connected" or "sent, unconfirmed", the tab is closed, not yet loaded, or on a different room. Re-send the join link rather than retrying blindly. Rooms expire after 24 h idle; a `room-expired` error means call `get_juicebox_url` again for a fresh room.

## Finding data

- `search_map_catalogs` — the curated ENCODE (~176 cell-line maps) and 4DN (~600 maps) catalogs. Fast; use first for "find a GM12878 map", "mouse heart Hi-C". Follow with `get_map_details` for the URL and metadata of one hit.
- `search_encode_hic` — live ENCODE portal search for Hi-C experiments, returning each experiment's `.hic` files plus companion track files (loops, contact domains, stripes as bedpe; subcompartments as bed; compartments as bigWig). Use for tissues, intact Hi-C, or anything the catalog lacks. Canonical GM12878 in situ Hi-C reference: ENCSR410MDC.
- `search_encode` — everything else on ENCODE (ChIP-seq, DNase, ATAC, RNA-seq, annotations). Use it to find tracks to overlay.
- `list_data_sources`, `get_data_source_statistics` — what is searchable and how it breaks down.

Prefer GRCh38/hg38 files unless the user names an assembly. Match the track's assembly to the loaded map's genome.

## Loading and navigating

- `load_map(url, name?, normalization?, locus?, panel?)` — load a `.hic`. Default normalization KR (fall back to VC or SCALE if the file lacks KR; `select_normalization` reports what is available). Pass `locus` when the user already named a region to save a round trip.
- `goto_locus` — accepts gene names (`BRCA1`), `chr1:1,000,000-2,000,000`, whole chromosomes, or two loci for off-diagonal views (`"chr1:1-2000000 chr1:3000000-5000000"`).
- `zoom_in` / `zoom_out` — one step each; prefer `goto_locus` with an explicit range for large jumps.
- `load_track(url, …)` — bigWig, bigBed, bedGraph, bed, bedpe, interact, and annotation formats, auto-detected by extension. "Add a gene track" loads NCBI RefSeq Select automatically. Then `set_track_color`, `set_track_name`, `set_track_data_range`, `set_track_autoscale`, `set_track_log_scale`, `remove_track`; `list_tracks` shows names and 1-based numbers.
- Map appearance: `set_color_scale` (threshold; lower it to reveal weak long-range contacts, raise it when the diagonal saturates), `set_map_foreground_color`, `set_map_background_color`. Colors are `#rrggbb` hex.
- `load_control_map` — second map shown as A/B observed-over-control in the same panel. Use for "compare treated vs. untreated at this locus".

## Panels (side-by-side comparison)

A page can hold several viewers, numbered 1, 2, … from the left. `load_map(panel: "new")` opens another panel beside the existing ones. With more than one panel open, every panel-scoped tool requires `panel`: a position (1, 2), a unique map name, or `"all"` (not for `load_map`, `load_control_map`, `list_tracks`, `close_panel`). Call `list_panels` when unsure which is which; an error from a missing `panel` argument lists the panels. `close_panel` shifts the ones to its right left; the last panel cannot be closed.

For "show K562 next to GM12878 at MYC": load the first map, `load_map(panel: "new")` for the second, then `goto_locus(locus: "MYC", panel: "all")`.

## Saving and sharing

- `save_session` — returns the session JSON as text (the server has no filesystem). Offer to save it to a file for the user.
- `load_session` — restore from pasted JSON, an attached file, or a URL.
- `create_shareable_url` — a snapshot link (shortened via t.3dg.io when configured) that reopens the current view for anyone. Use this for "send this view to my PI". The join link from `get_juicebox_url` is different: it is live and shared, not a snapshot.

## Conventions

- Describe what the user will see after each action in one short line; the tool result is a confirmation, not a picture. If the user wants a figure, tell them to use the viewer's own export.
- Chain searches into loads without asking again when the user's intent is clear ("load the GM12878 map and go to HOXA" is one task, not two).
- Report tool errors verbatim: most are about the page not being connected or the `panel` argument.
- `juicebox_help` is a user-facing quick-start; call it only when the user asks how to use Juicebox.
- `get_server_status` is for debugging connectivity only.
