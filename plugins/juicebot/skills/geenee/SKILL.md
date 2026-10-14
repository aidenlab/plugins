---
name: geenee
description: Drives Geenee (DEV build of the plugin), the Aiden Lab's genome workspace holding the igv genome browser and the Juicebox Hi-C contact-map viewer, through the Geenee MCP tools (igv_*, juicebox_*, open_geenee), or through the bundled geenee CLI when the MCP connector is not available. Use whenever the user mentions Geenee, IGV, Juicebox, JuiceBot, a genome browser, Hi-C or contact maps, .hic files, loops, TADs, compartments, ENCODE or 4DN data, bigWig/BED/peak tracks, or asks to open, load, navigate, compare, track, or share a genome view.
---

# Geenee: IGV and Juicebox from Claude

Geenee is one page beside the conversation, the Workspace, with two tabs: **IGV** (igv.js: a genome with signal and annotation tracks) and **Juicebox** (a Hi-C contact map). Tools never return images; they push commands to that page over a WebSocket "Room". The Workspace must be open in a browser for anything visible to happen, and it brings forward whichever viewer a tool last drove.

## Tools or CLI

Check once, at the start:

- **MCP tools present** (`open_geenee`, `igv_go_to_gene`, `juicebox_load_map`, ... are callable): use them.
- **Not present**: run the bundled CLI from a shell. Same tool names, same JSON arguments, same text results; the CLI remembers the Room and fills `room` in for you.

```bash
G="python3 ${CLAUDE_PLUGIN_ROOT}/skills/geenee/scripts/geenee.py"   # or node .../geenee.mjs
$G open                                        # Workspace link + Room id (opens a Room the first time)
$G status                                      # "Juicebox: connected" / "IGV: connected" once the page is open
$G call igv_go_to_gene '{"gene":"MYC"}'        # any tool: call NAME 'JSON'
$G call juicebox_load_map '{"url":"...hic","locus":"HOXA1"}' juicebox_load_track '{"url":"genes"}'   # several in one go
```

If `${CLAUDE_PLUGIN_ROOT}` is unset, find the script with `find ~/.claude ~/.codex -path '*geenee/scripts/geenee.py' | head -1`, or download it: `curl -fsSL https://geenee-install-dev.3dg.io/geenee.py -o geenee.py`. No dependencies. Exit code 2 means a tool reported an error (its message is printed); 1 means the server was unreachable. Details, options and troubleshooting: `references/cli.md`.

Chain calls that do not depend on each other into one `call` so the user waits for one shell command, not three. Do not retry a call that said no page or no viewer is connected; re-send the Workspace link instead.

## Session start: one Room per conversation

1. Call `open_geenee` once (or `$G open`). Its reply gives the Workspace link and the **Room id**. Keep the Room id for the whole conversation and pass it as `room` on every later tool call, igv and juicebox alike (the CLI does this itself). Never call `open_geenee` again just to get a link: call it with the same `room` to get the same Workspace back.
2. If a browser pane inside this app is available (Claude's built-in browser), open the link in it right away so Geenee sits beside the conversation. Do not drive the user's own browser with it. Always also give the user the link as a plain clickable URL, never in a code block, and ask them to open it if there is no pane.
3. Do not send viewer commands until the page is connected: the user confirms, `juicebox_get_server_status` shows `Browser Connected: Yes`, or `igv_read_session_summary` answers without error (`$G status` checks both).
4. If the user pastes a Workspace link they already have (`…?room=ID`, theirs or a colleague's), use that Room id instead of opening a new one (`$G room <link>`). Everyone in a Room sees the same Workspace, which is also how a group looks at one view together.
5. "No page is connected" / "no Viewer is in Room" means the tab is closed, still loading, or on another Room: re-send the Workspace link. If the Room has expired after a long idle, open a new one and tell the user the link changed.

## Which viewer

The server's own instructions decide: a request that names a viewer, or something only one shows (a contact map, a bigWig track), goes to that viewer; a request that fits both ("zoom in", "go to MYC", "give me a link") goes to the viewer this conversation last used; ask only when neither has been used; send to both only when the user asks for both. A tool changes its own viewer only; the page shows the one last driven until the user clicks the other tab.

## First run: make it visible

Juicebox: `juicebox_search_map_catalogs` for the map, `juicebox_load_map` with `locus` set, then `juicebox_load_track` with `"url": "genes"` (RefSeq Select for the map's genome) unless the user said otherwise. Tell them what to look for: a contact map, the locus in the header, gene annotations under the map.

IGV: `igv_go_to_gene`, then tracks found with `igv_search_catalogues` loaded in one `igv_load_tracks` call (pass each row's `url` and `name`). Every igv reply carries the Session summary (genome, loci, tracks top to bottom); use it to describe the view instead of guessing.

Report only what is verified, and keep the three states apart: *installed* (the plugin), *server connected* (tools or CLI answer), *viewer working* (a page acknowledged a command).

## IGV in short

- Navigation: `igv_go_to_gene` (gene symbol), `igv_go_to_locus` (`chr8:127,735,434-127,742,951`, a chromosome, `all`, or several loci separated by spaces for side-by-side panels), `igv_zoom_in` / `igv_zoom_out` (factor two per call; the whole-genome view does not zoom), `igv_change_genome` (igv.org genome ids: `hg38`, `hg19`, `mm39`, `hs1`; removes loaded tracks).
- Data: `igv_search_catalogues` searches the ENCODE and 4DN track catalogues for the current genome by free text and by `biosample`, `assay`, `target`, `outputType`, using the catalogues' own terms (`K562`, `ChIP-seq`, `CTCF`, `fold change over control`). `igv_load_tracks` takes a list of `{url, name}`; the user may also give any URL their browser can fetch.
- Tracks: `igv_remove_track` and `igv_set_track_height` address tracks by `name` or by `position` (1 = top, as in the Session summary); `all` for every track. The user also edits by hand, so read `igv_read_session_summary` before acting on "the second track" unless the previous reply just gave the summary.
- View: `igv_set_crosshairs`, `igv_set_centre_line` (not in the whole-genome view). `igv_get_shareable_url` is a long self-contained igv-webapp link that needs no Room and never expires; give it whole and unshortened. It is not the Workspace link.

## Juicebox in short

- Finding maps: `juicebox_search_map_catalogs` (curated ENCODE ~176 and 4DN ~600 maps; fast; use first for "find a GM12878 map" or "mouse heart Hi-C"; results carry each map's `.hic` URL, `juicebox_get_map_details` gives one hit's metadata; use these URLs, never guess an ENCODE accession). `juicebox_search_encode_hic` searches the live ENCODE portal for Hi-C experiments and their companion files (loops, domains, stripes as bedpe; subcompartments as bed; compartments as bigWig). `juicebox_search_encode` finds everything else (ChIP-seq, DNase, ATAC, RNA-seq) to overlay. `juicebox_list_data_sources`, `juicebox_get_data_source_statistics` describe what is searchable. Prefer GRCh38/hg38 unless the user names an assembly, and match a track's assembly to the loaded map.
- Loading and navigating: `juicebox_load_map(url, name?, normalization?, locus?, panel?)`, default KR, fall back to VC or SCALE if the file lacks KR (`juicebox_select_normalization` lists what is available). `juicebox_goto_locus` takes gene names, `chr1:1,000,000-2,000,000`, whole chromosomes, or two loci for off-diagonal views (`"chr1:1-2000000 chr1:3000000-5000000"`). `juicebox_zoom_in` / `juicebox_zoom_out` are one step each; use `juicebox_goto_locus` with an explicit range for big jumps.
- Tracks: `juicebox_load_track(url, ...)` for bigWig, bigBed, bedGraph, bed, bedpe, interact and annotation formats (detected by extension; `"genes"` is the built-in gene track), then `juicebox_set_track_color`, `juicebox_set_track_name`, `juicebox_set_track_data_range`, `juicebox_set_track_autoscale`, `juicebox_set_track_log_scale`, `juicebox_remove_track`; `juicebox_list_tracks` shows names and 1-based numbers.
- Appearance: `juicebox_set_color_scale` (lower the threshold to reveal weak long-range contacts, raise it when the diagonal saturates), `juicebox_set_map_foreground_color`, `juicebox_set_map_background_color`; colors are `#rrggbb`. `juicebox_load_control_map` shows a second map as observed-over-control in the same panel.
- Panels: a page can hold several maps numbered 1, 2, ... from the left; `juicebox_load_map` with `panel: "new"` opens another. With more than one panel open, every panel-scoped tool requires `panel` (a position, a unique map name, or `"all"`; not for `juicebox_load_map`, `juicebox_load_control_map`, `juicebox_list_tracks`, `juicebox_close_panel`); `juicebox_list_panels` shows what is open and an error from a missing `panel` lists them. "Show K562 next to GM12878 at MYC": load the first map, `juicebox_load_map` with `panel: "new"` for the second, then `juicebox_goto_locus` with `panel: "all"`.
- Saving and sharing: `juicebox_save_session` returns the session JSON as text (offer to save it to a file), `juicebox_load_session` restores from pasted JSON, a file or a URL, `juicebox_create_shareable_url` makes a snapshot link that reopens the current map view for anyone.

## Links, three kinds

The **Workspace link** (from `open_geenee`) is live and shared: whoever opens it joins the Room and follows along. A **shareable link** (`juicebox_create_shareable_url`, `igv_get_shareable_url`) is a snapshot of one viewer's current view. Never give one for the other.

## Conventions

- After each action, one short line on what the user will see; the tool result is a confirmation, not a picture. For a figure, point them to the viewer's own export.
- Chain searches into loads when the intent is clear ("load the GM12878 map and go to HOXA" is one task).
- Report tool errors verbatim; most are about the page not being connected, a missing `panel`, or a track name that matches nothing.
- `juicebox_help` is a user-facing quick start; use it only when the user asks how to use Juicebox. `juicebox_get_server_status` and `igv_read_session_summary` are for connectivity.
- Every tool's arguments: `references/tools.md`.
