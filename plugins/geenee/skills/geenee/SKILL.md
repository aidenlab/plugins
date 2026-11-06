---
name: geenee
description: Drives Geenee, the Aiden Lab's genome workspace holding the igv genome browser, the Juicebox Hi-C contact-map viewer and the Spacewalk 3D chromatin viewer, through the Geenee MCP tools (open_geenee, igv_*, juicebox_*, spacewalk_*), or through the bundled geenee CLI when the MCP connector is not available. Use whenever the user mentions Geenee, IGV, Juicebox, Spacewalk, a genome browser, Hi-C or contact maps, .hic or .sw files, loops, TADs, compartments, 3D chromatin structure or ensembles, ENCODE or 4DN data, bigWig/BED/peak tracks, or asks to open, load, navigate, compare, track, or share a genome view.
---

# Geenee: IGV, Juicebox and Spacewalk from the conversation

Geenee is one page beside the conversation, the **Workspace**, with three tabs: **IGV** (igv.js: a genome with signal and annotation tracks), **Juicebox** (Hi-C contact maps) and **Spacewalk** (3D chromatin structure). Tools never return images; they push commands to that page through a shared **Room**. The Workspace must be open in a browser for anything visible to happen, and it brings forward whichever viewer a tool last drove.

## Tools or CLI

Check once, at the start:

- **MCP tools present** (`open_geenee`, `igv_go_to_gene`, `juicebox_load_map`, `spacewalk_load_ensemble`, ... are callable): use them.
- **Not present**: run the bundled CLI from a shell. Same tool names, same JSON arguments, same text results; the CLI remembers the Room and fills `room` in for you.

```bash
G="python3 ${CLAUDE_PLUGIN_ROOT}/skills/geenee/scripts/geenee.py"   # or node .../geenee.mjs
$G open                                        # Workspace link + Room id (opens a Room the first time)
$G status                                      # Juicebox / IGV / Spacewalk: connected, once the page is open
$G call igv_go_to_gene '{"gene":"MYC"}'        # any tool: call NAME 'JSON'
$G call juicebox_load_map '{"url":"...hic","locus":"HOXA1"}' juicebox_load_track '{"url":"genes"}'   # several in one go
```

If `${CLAUDE_PLUGIN_ROOT}` is unset, find the script with `find ~/.claude ~/.codex -path '*geenee/scripts/geenee.py' | head -1`, or download it: `curl -fsSL https://geenee-install.3dg.io/geenee.py -o geenee.py`. No dependencies. Exit code 2 means a tool reported an error (its message is printed); 1 means the server was unreachable. Details, options and troubleshooting: `references/cli.md`.

Chain calls that do not depend on each other into one `call`, so the user waits for one shell command rather than three. Do not retry a call that said no page or no viewer is connected; re-send the Workspace link instead.

## Session start: one Room per conversation

1. Call `open_geenee` once (or `$G open`). Its reply gives the Workspace link and the **Room id**. Keep the Room id for the whole conversation and pass it as `room` on every later tool call, for all three viewers (the CLI does this itself). Never call `open_geenee` again just to get a link: call it with the same `room` to get the same Workspace back.
2. If a browser pane inside this app is available (Claude's built-in browser), open the link in it right away so Geenee sits beside the conversation. Do not drive the user's own browser with it.
3. Through the MCP tools, the host shows the user a Card with an **Open geenee** button, the link and a QR code; do not repeat the link in your reply. Through the CLI there is no Card: give the user the link as a plain clickable URL, not in a code block, and ask them to open it.
4. Do not send viewer commands until the page is connected: the user confirms, or `$G status` (or `juicebox_get_server_status` showing `Browser Connected: Yes`, `igv_read_session_summary` answering without error, `spacewalk_read_viewer_state` showing `Viewers connected:` above 0) says so.
5. If the user pastes a Workspace link they already have (`…?room=ID` or `…/r/ID`, theirs or a colleague's), use that Room id instead of opening a new one (`$G room <link>`). Everyone in a Room sees the same Workspace, which is also how a group looks at one view together.
6. "No page is connected" / "no Viewer is in Room" means the tab is closed, still loading, or on another Room: re-send the Workspace link. A Room that has expired stays expired: open a new one and tell the user the link changed.

## Which viewer

The server's own instructions decide. A request that names a viewer, or something only one shows (a contact map, a bigWig track, a 3D structure), goes to that viewer. A request that fits more than one ("zoom in", "go to MYC", "load the CTCF track", "give me a link") goes to the viewer this conversation last used that can do it; ask only when none of those has been used. Spacewalk has no locus, zoom or tracks, so most such requests fit IGV and Juicebox only. Send to several viewers only when the user asks for that. A tool changes its own viewer only; the page shows the one last driven until the user clicks another tab.

## First run: make it visible

Juicebox: `juicebox_search_map_catalogs` for the map, `juicebox_load_map` with `locus` set, then `juicebox_load_track` with `"url": "genes"` (RefSeq Select for the map's genome) unless the user said otherwise. Tell them what to look for: a contact map, the locus in the header, gene annotations under the map.

IGV: `igv_go_to_gene`, then tracks found with `igv_search_catalogues`, loaded in one `igv_load_tracks` call (pass each row's `url` and `name`). Every igv reply carries the Session summary (genome, loci, tracks top to bottom); use it to describe the view instead of guessing.

Spacewalk: `spacewalk_list_example_ensembles`, then `spacewalk_load_ensemble` with one of its URLs. Tell them to look for the 3D structure on the Spacewalk tab.

Report only what is verified, and keep three states apart: *installed* (the plugin), *server connected* (tools or CLI answer), *viewer working* (a page acknowledged a command).

## IGV in short

- Navigation: `igv_go_to_gene` (gene symbol), `igv_go_to_locus` (`chr8:127,735,434-127,742,951`, a chromosome, `all`, or several loci separated by spaces for side-by-side panels), `igv_zoom_in` / `igv_zoom_out` (factor two per call; the whole-genome view does not zoom), `igv_change_genome` (igv.org genome ids: `hg38`, `hg19`, `mm39`, `hs1`; removes loaded tracks).
- Data: `igv_search_catalogues` searches the ENCODE and 4DN track catalogues for the current genome by free text and by `biosample`, `assay`, `target`, `outputType`, using the catalogues' own terms (`K562`, `ChIP-seq`, `CTCF`, `fold change over control`). `igv_load_tracks` takes a list of `{url, name}`; the user may also give any URL their browser can fetch.
- Tracks: `igv_remove_track` and `igv_set_track_height` address tracks by `name` or by `position` (1 = top, as in the Session summary), or `all`. The user also edits by hand, so read `igv_read_session_summary` before acting on "the second track" unless the previous reply just gave the summary.
- View: `igv_set_crosshairs`, `igv_set_centre_line` (not in the whole-genome view). `igv_set_controls` shows or hides igv's navigation bar together with a Shareable URL strip with a copy button: that is how the user gets a link to the current IGV view.

## Juicebox in short

- Finding maps: `juicebox_search_map_catalogs` (curated ENCODE and 4DN maps; fast; use it first for "find a GM12878 map" or "mouse heart Hi-C"; results carry each map's `.hic` URL; `juicebox_get_map_details` gives one hit's metadata). Use these URLs; never guess an ENCODE accession. `juicebox_search_encode_hic` searches the live ENCODE portal for Hi-C experiments and their companion files (loops, domains, stripes as bedpe; subcompartments as bed; compartments as bigWig). `juicebox_search_encode` finds everything else (ChIP-seq, DNase, ATAC, RNA-seq) to overlay. `juicebox_list_data_sources` and `juicebox_get_data_source_statistics` describe what is searchable. Prefer GRCh38/hg38 unless the user names an assembly, and match a track's assembly to the loaded map.
- Loading and navigating: `juicebox_load_map(url, name?, normalization?, locus?, panel?)`, default KR, falling back to VC or SCALE if the file lacks KR (`juicebox_select_normalization` lists what is available). `juicebox_goto_locus` takes gene names, `chr1:1,000,000-2,000,000`, whole chromosomes, or two loci for off-diagonal views (`"chr1:1-2000000 chr1:3000000-5000000"`). `juicebox_zoom_in` / `juicebox_zoom_out` are one step each; use `juicebox_goto_locus` with an explicit range for big jumps.
- Tracks: `juicebox_load_track(url, ...)` for bigWig, bigBed, bedGraph, bed, bedpe, interact and annotation formats (detected by extension; `"genes"` is the built-in gene track), then `juicebox_set_track_color`, `juicebox_set_track_name`, `juicebox_set_track_data_range`, `juicebox_set_track_autoscale`, `juicebox_set_track_log_scale`, `juicebox_remove_track`; `juicebox_list_tracks` shows names and 1-based numbers.
- Appearance: `juicebox_set_color_scale` (lower the threshold to reveal weak long-range contacts, raise it when the diagonal saturates), `juicebox_set_map_foreground_color`, `juicebox_set_map_background_color`; colors are `#rrggbb`. `juicebox_load_control_map` shows a second map as observed-over-control in the same panel.
- Panels: a page can hold several maps numbered 1, 2, ... from the left; `juicebox_load_map` with `panel: "new"` opens another. With more than one panel open, every panel-scoped tool requires `panel` (a position, a unique map name, or `"all"`); `juicebox_list_panels` shows what is open, and an error from a missing `panel` lists them. "Show K562 next to GM12878 at MYC": load the first map, `juicebox_load_map` with `panel: "new"` for the second, then `juicebox_goto_locus` with `panel: "all"`. `juicebox_show_panel_controls` shows or hides the bar above every map.
- Saving and sharing: `juicebox_save_session` returns the session JSON as text (offer to save it to a file), `juicebox_load_session` restores from pasted JSON, a file or a URL, and `juicebox_create_shareable_url` makes a snapshot link that reopens the current map view for anyone.

## Spacewalk in short

- Loading: `spacewalk_list_example_ensembles` lists hosted `.sw` files by group; `spacewalk_load_ensemble(url)` loads one (the user may call an ensemble "the model"). `spacewalk_select_ensemble_group(key)` switches to another named subset of its traces. `spacewalk_load_session` takes a Spacewalk shareable URL or session string; only the Spacewalk part is used.
- Appearance: `spacewalk_set_render_style` (`ball_and_stick` or `ribbon`; point-cloud ensembles are always point clouds), `spacewalk_step_ball_radius` / `spacewalk_step_stick_radius` (`up` or `down`, one rung of 0–10 per call), `spacewalk_set_background_color` (a crayon name such as `midnight`, or `#rrggbb`), `spacewalk_adjust_background` (one step lighter or darker), `spacewalk_reset_camera` (frame the whole structure).
- State: `spacewalk_read_viewer_state` shows the current state, how many viewers are connected, and anything the user changed by hand since your last reply. Read it before acting on something the user did in the viewer.

## Links

The **Workspace link** (from `open_geenee`) is live and shared: whoever opens it joins the Room and follows along. A **shareable link** (`juicebox_create_shareable_url`, or IGV's Shareable URL strip via `igv_set_controls`) is a snapshot of one viewer's current view. Never give one in place of the other.

## Conventions

- After each action, write one short line on what the user will see; the tool result is a confirmation, not a picture. For a figure, point them to the viewer's own export.
- Chain searches into loads when the intent is clear ("load the GM12878 map and go to HOXA" is one task).
- Report tool errors verbatim; most are about the page not being connected, a missing `panel`, or a track name that matches nothing.
- `juicebox_help` is a user-facing quick start; use it only when the user asks how to use Juicebox.
- Every tool's arguments: `references/tools.md`.
