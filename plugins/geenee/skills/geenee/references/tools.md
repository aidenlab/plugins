# Geenee tool reference

Generated from the live server's `tools/list` (56 tools) by `scripts/gen-tools-md.py`. Call them as MCP tools when the connector is present, or as `geenee.py call <name> '<json>'` otherwise; names and arguments are identical. Every tool except `open_geenee` also takes `room` (string, required): the Room id from the reply of `open_geenee`. It is left out of the argument lists below; the CLI fills it in.

## Contents

- Opening the Workspace: `open_geenee`
- IGV: navigation: `igv_go_to_gene`, `igv_go_to_locus`, `igv_zoom_in`, `igv_zoom_out`, `igv_change_genome`
- IGV: tracks and data: `igv_search_catalogues`, `igv_load_tracks`, `igv_remove_track`, `igv_set_track_height`
- IGV: view, state and sharing: `igv_set_crosshairs`, `igv_set_centre_line`, `igv_set_controls`, `igv_read_session_summary`
- Juicebox: status and help: `juicebox_get_server_status`, `juicebox_help`
- Juicebox: finding data: `juicebox_search_map_catalogs`, `juicebox_get_map_details`, `juicebox_search_encode_hic`, `juicebox_search_encode`, `juicebox_list_data_sources`, `juicebox_get_data_source_statistics`
- Juicebox: maps and navigation: `juicebox_load_map`, `juicebox_load_control_map`, `juicebox_goto_locus`, `juicebox_zoom_in`, `juicebox_zoom_out`, `juicebox_select_normalization`, `juicebox_set_color_scale`, `juicebox_set_map_foreground_color`, `juicebox_set_map_background_color`
- Juicebox: panels: `juicebox_list_panels`, `juicebox_close_panel`, `juicebox_show_panel_controls`
- Juicebox: tracks: `juicebox_load_track`, `juicebox_list_tracks`, `juicebox_remove_track`, `juicebox_set_track_color`, `juicebox_set_track_name`, `juicebox_set_track_data_range`, `juicebox_set_track_autoscale`, `juicebox_set_track_log_scale`
- Juicebox: sessions and sharing: `juicebox_save_session`, `juicebox_load_session`, `juicebox_create_shareable_url`
- Spacewalk: ensembles and state: `spacewalk_list_example_ensembles`, `spacewalk_load_ensemble`, `spacewalk_select_ensemble_group`, `spacewalk_load_session`, `spacewalk_read_viewer_state`
- Spacewalk: appearance and camera: `spacewalk_set_render_style`, `spacewalk_step_ball_radius`, `spacewalk_step_stick_radius`, `spacewalk_set_background_color`, `spacewalk_adjust_background`, `spacewalk_reset_camera`

## Opening the Workspace

### `open_geenee`

Get the link that opens geenee: one page beside the conversation holding the igv genome browser, the Juicebox contact-map viewer and the Spacewalk 3D chromatin viewer. Use this before any other geenee tool, and when the user asks to open geenee, IGV, a genome browser, Juicebox, a contact map, Spacewalk or 3D chromatin, or greets any of them ("hello geenee", "hi igv", "hello juicebox", "hello spacewalk"): call this tool straight away instead of only greeting back. One call opens all three viewers; there is no separate tool to open any one of them. If you have a browser that shows pages inside this app, beside the conversation, open the link in it right away: all three viewers connect there and later tool calls redraw them. Use only such an in-app browser; a tool that drives the user's own web browser is not one, and if there is no in-app browser do not try anything else. The user is shown a Card with an Open geenee button, for when the link is not opened beside the conversation. Do not repeat the link or the Room id in your reply. The result of this tool names the Room id: pass it as room on every later geenee tool call in this conversation.

- `room` (string, optional): reopen an existing Room instead of minting a new one

## IGV: navigation

### `igv_go_to_gene`

Move igv-bot to a gene by its name, such as "MYC" or "BRCA1", looked up in the current genome. An unknown gene is reported as an error and the view does not move. The reply is the resulting Session summary: genome, loci, and tracks in display order.

- `gene` (string, required): Gene name or symbol, such as "MYC"

### `igv_go_to_locus`

Move igv-bot to a locus given as coordinates, such as "chr8:127,735,434-127,742,951", or to a whole chromosome, such as "chr8". Use "all" for the whole-genome view. Several loci separated by spaces are shown side by side. For a gene name use igv_go_to_gene. The reply is the resulting Session summary: genome, loci, and tracks in display order.

- `locus` (string, required): Coordinates as chr:start-end (1-based, commas allowed), a chromosome name, or "all"

### `igv_zoom_in`

Zoom igv-bot in by a factor of two, keeping the centre of the view. Call it again to zoom further. The whole-genome view does not zoom: go to a locus or gene first. The reply is the resulting Session summary: genome, loci, and tracks in display order.

- no arguments besides `room`

### `igv_zoom_out`

Zoom igv-bot out by a factor of two, keeping the centre of the view where possible. Call it again to zoom further. The whole-genome view does not zoom. The reply is the resulting Session summary: genome, loci, and tracks in display order.

- no arguments besides `room`

### `igv_change_genome`

Change igv-bot to another genome assembly, such as "hg19", "mm39" or "hs1" (human T2T). The tracks now loaded are removed and the new genome opens with its own default tracks, at its default view. Only the genomes on the igv.org genome list are available; for one that is not, the reply says so, lists those that are, and igv-bot is left as it was. The reply is the resulting Session summary: genome, loci, and tracks in display order.

- `genome` (string, required): Genome id as on the igv.org genome list, such as "hg38", "hg19", "mm39" or "hs1"

## IGV: tracks and data

### `igv_search_catalogues`

Find tracks for a loose request, such as "CTCF ChIP-seq in K562", in the ENCODE and 4DN Catalogues: the tables of signal, peak and annotation files those projects publish for a genome. Use this whenever the user asks for data by what it is instead of by URL. Both Catalogues are searched at once, for the genome igv-bot is showing. Matching ignores case and punctuation, so "H3K27ac", "h3k27ac" and "H3-K27ac" find the same rows; there are no synonyms, so use the Catalogues' own terms (a cell line as "K562" or "GM12878", an assay as "ChIP-seq" or "DNase-seq"). The reply holds the count of all matching rows, in total and in each Catalogue, and at most 20 of them in full, each with the name and url to load it as a track. When more match than are shown, narrow the search with the filters or with more words. The 4DN rows are the compartments, boundaries and insulation scores of Hi-C experiments: ask for them by outputType. When a loose request matches many tracks, pick a sensible default (for ChIP-seq, a "fold change over control" signal of the replicates together, such as bioRep "1,2"), say in one line what you picked, and load it; ask the user only when the candidates differ in a way they would care about. Hi-C contact matrices and tables of gene or transcript quantifications are never offered: igv-bot cannot show them.

- `text` (string, optional): Free text, such as "CTCF K562". Every word must be somewhere in a row, in any column, so use the few words that name the data and leave out words like "tracks" or "data".
- `biosample` (string, optional): Only rows whose biosample (cell line, tissue or cell type) carries these words, such as "K562" or "liver"
- `assay` (string, optional): Only rows whose assay carries these words, such as "ChIP-seq", "DNase-seq", "RNA-seq" or "Hi-C"
- `target` (string, optional): Only rows whose target (the protein or histone mark of a ChIP-seq experiment) carries these words, such as "CTCF" or "H3K27ac". 4DN rows have no target.
- `outputType` (string, optional): Only rows whose output type carries these words, such as "fold change over control", "signal p-value" or "peaks" in ENCODE, and "compartments", "boundaries" or "insulation score" in 4DN
- `genome` (string, optional): Genome id as on the igv.org genome list, such as "hg38" or "mm10". Leave it out to search for the genome igv-bot is showing, which is nearly always what is wanted.

### `igv_load_tracks`

Load one or several tracks into igv-bot, each from the URL of its file. The URLs come from a reply of igv_search_catalogues (pass the row's url, and its name as the track's name) or from the user, who may give any URL their browser can fetch. Load every track a request asks for in one call: they are shown in the order given, and the Session summary of the reply says where igv.js put them, as a rule above the genome's own annotation track. A track given no name gets igv.js's default, the name of its file. When a loose request matches many tracks in the Catalogues, pick a sensible default, say in one line what you picked, and load it; ask the user only when the candidates differ in a way they would care about. A track that does not load is reported as an error carrying igv.js's own message, as for a file that does not exist or a host that does not permit cross-origin requests; the other tracks of the call are still loaded, and the Session summary shows which. The reply is the resulting Session summary: genome, loci, and tracks in display order.

- `tracks` (array of object, required): The tracks to load, in the order they are to be shown, top to bottom
  - `url` (string, required): The URL of the track's file, such as the url of a igv_search_catalogues row
  - `name` (string, optional): The name to show the track under, such as the name of a igv_search_catalogues row. Leave it out for the file's name.

### `igv_remove_track`

Remove one track from igv-bot, addressed by its name or by its position in the tracks of the Session summary, counted from 1 at the top: "the second track" is position 2 and "the bottom one" is the last. Give name or position, not both. The user also reorders and removes tracks by hand, so take a position from the Session summary of the reply just before, or call igv_read_session_summary first. A name or position that matches no track is reported as an error listing the tracks, and a name that several tracks share as an error giving their positions; either way nothing is removed. The sequence track cannot be removed. The reply is the resulting Session summary: genome, loci, and tracks in display order.

- `name` (string, optional): The name of the track as the Session summary gives it. Case does not matter.
- `position` (number, optional): The position of the track in the tracks of the Session summary: 1 is the top track

### `igv_set_track_height`

Set the height of one, several or all tracks of igv-bot: to a number of pixels, or "taller" (half as high again) or "shorter" (two thirds as high), so that one undoes the other. A height runs from 1 to 1000 pixels: a number outside that is an error, and taller and shorter stop there. Address the tracks by their names, by their positions in the tracks of the Session summary, counted from 1 at the top, or pass all for every track. Change every track a request means in one call. The user also reorders, resizes and removes tracks by hand, so take positions and heights from the Session summary of the reply just before, or call igv_read_session_summary first. A name or position that matches no track is reported as an error listing the tracks, and a name that several tracks share as an error giving their positions; either way no height is changed. The sequence track keeps its height: all leaves it as it is, and addressing it is an error. The Session summary gives heights in whole pixels. The reply is the resulting Session summary: genome, loci, and tracks in display order.

- `height` (number/one of `taller`, `shorter`, required): The height in pixels, from 1 to 1000, or "taller" for 1.5 times the height each track has now, or "shorter" for two thirds of it
- `names` (array of string, optional): The names of the tracks as the Session summary gives them. Case does not matter.
- `positions` (array of number, optional): The positions of the tracks in the tracks of the Session summary: 1 is the top track
- `all` (boolean, optional): True for every track, in place of names and positions

## IGV: view, state and sharing

### `igv_set_crosshairs`

Show or hide igv-bot's crosshairs: a vertical and a horizontal line that follow the pointer across the tracks. The Session summary says whether they are showing, as crosshairs; the user also turns them on and off by hand. The whole-genome view has no crosshairs: showing them there is an error, so go to a locus or gene first, and going to the whole-genome view hides them. The reply is the resulting Session summary: genome, loci, and tracks in display order.

- `show` (boolean, required): True to show the crosshairs, false to hide them

### `igv_set_centre_line`

Show or hide igv-bot's centre line: a vertical line marking the middle of the view, the point that igv_zoom_in and igv_zoom_out keep in place. Where several loci are shown side by side, each has its own. The Session summary says whether it is showing, as centreLine; the user also turns it on and off by hand. The whole-genome view has no centre line: showing it there is an error, so go to a locus or gene first, and going to the whole-genome view hides it. The reply is the resulting Session summary: genome, loci, and tracks in display order.

- `show` (boolean, required): True to show the centre line, false to hide it

### `igv_set_controls`

Show or hide igv-bot's controls: the navigation bar, and the Shareable URL where igv-bot shows one. The navigation bar is igv.js's own, with its locus box and its buttons; the Shareable URL is in a strip with a copy button. They are hidden and shown together, and start hidden; the genome browser takes the space they leave. The Session summary says whether they are showing, as controls; the user also hides and shows them by hand, with the button above the genome browser. Showing them does not change the view, and the Shareable URL is the same either way. The reply is the resulting Session summary: genome, loci, and tracks in display order.

- `show` (boolean, required): True to show the controls, false to hide them

### `igv_read_session_summary`

Read what igv-bot is showing now, without changing anything: genome, loci, tracks in display order with name, type, URL and height, and whether the crosshairs, centre line and controls are showing. The user also changes igv-bot by hand (panning, zooming, reordering, resizing or removing tracks) and you are not told when they do. Call this before describing the view or acting on a reference to it, such as "this region" or "the second track", unless a reply from another igv-bot tool has just given you the Session summary.

- no arguments besides `room`

## Juicebox: status and help

### `juicebox_get_server_status`

Get diagnostic information about the MCP server, WebSocket connections, and session status. Use this for debugging connection issues.

- no arguments besides `room`

### `juicebox_help`

Provides a quick-start guide with common phrases and examples for using Juicebox via natural language. Use this ONLY when users explicitly ask about Juicebox, such as "how to use Juicebox", "Juicebox help", "how do I use Juicebox", "what can I do with Juicebox", "get started with Juicebox", "Juicebox examples", "how does Juicebox work", or similar questions specifically about the Juicebox tool. Do NOT use this for general "how to" questions unrelated to Juicebox.

- no arguments besides `room`

## Juicebox: finding data

### `juicebox_search_map_catalogs`

Search the two curated contact-map catalogs that ship with juicebox-web (ENCODE: ~176 cell-line maps such as GM12878, HCT116, IMR-90, K562; 4DN: ~600 maps) with natural language, e.g. "human hg38 maps", "mouse cell lines", "K562". This is a static list, NOT the ENCODE or 4DN portal: it has no ENCODE tissues and no intact Hi-C. If a query finds nothing here, or the user asks for tissues, intact Hi-C or anything ENCODE-specific, use juicebox_search_encode_hic instead. Results are limited to 50 by default. For statistical questions like "what assemblies are covered" or "how many maps are there", use juicebox_get_data_source_statistics instead.

- `source` (string, optional): Data source ID ('4dn', 'encode') or 'all' to search all sources. Default: 'all'
- `query` (string, required): Natural language search query (e.g., "human hg38", "mouse cells", "K562")
- `limit` (integer, optional): Maximum number of results to return (default: 50)

### `juicebox_get_map_details`

Get detailed information about a specific Hi-C contact map. Use this when users want more information about a specific map from search results.

- `source` (string, required): Data source ID ('4dn' or 'encode')
- `index` (integer, optional): Index from search results (0-based). Required if url is not provided.
- `url` (string, optional): Direct URL to the map. Required if index is not provided.

### `juicebox_search_encode_hic`

Search the live ENCODE portal (encodeproject.org) for Hi-C experiments and list, per experiment, its contact-map files and the companion files the viewer can load as tracks (loops, contact domains and chromatin stripes as bedpe; subcompartments as bed; compartments as bigWig). Use this for any ENCODE map the catalogs do not have: tissues (heart, colon, brain ...), intact Hi-C, specific cell lines. Put organ, tissue or cell-line words in `biosample` (organs match the ontology; other words fall back to text search); ask for "intact Hi-C" with `assay`; set `classification: "tissue"` when the user means tissue rather than a cell line derived from that organ. To load a map pass `maps[].url` to juicebox_load_map (prefer the "mapping quality thresholded contact matrix", one per biosample); pass `tracks[].url` to juicebox_load_track. For non-Hi-C questions use juicebox_search_encode.

- `biosample` (string, optional): Organ, tissue or cell line words, e.g. "heart", "colon", "K562"
- `assay` (one of `intact Hi-C`, `in situ Hi-C`, `Hi-C`, `dilution Hi-C`, optional): One Hi-C flavour; default: all of intact Hi-C, in situ Hi-C, Hi-C, dilution Hi-C
- `classification` (one of `tissue`, `cell line`, `primary cell`, `in vitro differentiated cells`, optional): Biosample classification, e.g. "tissue" to exclude cell lines derived from the organ
- `assembly` (string, optional): Genome assembly, e.g. "GRCh38", "mm10"
- `query` (string, optional): Free text for the portal full-text search (lab, donor, treatment ...)
- `limit` (integer, optional): Maximum experiments to return (default: 10)

### `juicebox_search_encode`

General search of the live ENCODE portal for anything that is not a Hi-C map: other assays (TF ChIP-seq, Histone ChIP-seq, DNase-seq, ATAC-seq, RNA-seq ...), annotations, biosamples, publications. `query` is the portal full-text search; `filters` are portal facet fields passed through verbatim, e.g. {"assay_title": "TF ChIP-seq", "biosample_ontology.organ_slims": "heart", "target.label": "CTCF"}; a list value means any of them. The result lists the hits with their portal links and the facets you can narrow by. For the files of one experiment use type "File" with {"dataset": "/experiments/ENCSRxxxxxx/"}.

- `type` (string, optional): Portal object type: Experiment (default), Annotation, File, Biosample, Publication, ...
- `query` (string, optional): Free text
- `filters` (object, optional): Facet field → value or list of values, passed to the portal as query parameters
- `limit` (integer, optional): Maximum hits to return (default: 20)

### `juicebox_list_data_sources`

List available Hi-C contact map data sources (4DN, ENCODE) with their metadata columns. Use this when users ask what data sources are available, what maps can be searched, or want to understand the available metadata.

- no arguments besides `room`

### `juicebox_get_data_source_statistics`

Get statistical overview of a data source including total maps, assemblies covered, and breakdowns by metadata fields. Use this when users ask "what assemblies are available", "how many maps are there", "what cell types are covered", etc. This returns unfiltered statistics without search limits.

- `source` (string, required): Data source ID ('4dn' or 'encode')

## Juicebox: maps and navigation

### `juicebox_load_map`

Load a Hi-C contact map (.hic file) into Juicebox. With panel "new" the map opens in an additional panel beside the current one (side by side); otherwise it replaces the map in the panel named by `panel`, which is required when more than one panel is open.

- `url` (string, required): URL to the .hic file
- `name` (string, optional): Optional name for the map
- `normalization` (string, optional): Normalization method (e.g., "VC", "VC_SQRT", "KR", "NONE")
- `locus` (string, optional): Optional genomic locus (e.g., "1:1000000-2000000 1:1000000-2000000")
- `panel` (integer/string, optional): panel: "new" opens another panel beside the others and loads there (side-by-side comparisons); a position from the left (1, 2, ...) or a map name replaces that panel's map, no "all"; required when more than one panel is open

### `juicebox_load_control_map`

Load a control map (.hic file) for comparison

- `url` (string, required): URL to the control .hic file
- `name` (string, optional): Optional name for the control map
- `normalization` (string, optional): Normalization method (e.g., "VC", "VC_SQRT", "KR", "NONE")
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...) or a map name, no "all"; required when more than one panel is open

### `juicebox_goto_locus`

Navigate to a specific genomic locus in the currently loaded map. Supports natural language, gene names, standard format, and structured objects. Examples: "chr1:1000-2000", "BRCA1", "chromosome 1 from 1000 to 2000", or {chr: "chr1", start: 1000, end: 2000}. When a single chromosome is specified, it applies to both axes of the Hi-C contact map.

- `locus` (string/object, required): Locus to navigate to.
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `juicebox_zoom_in`

Zoom in on the contact map

- `centerX` (number, optional): Optional X coordinate for zoom center (pixels)
- `centerY` (number, optional): Optional Y coordinate for zoom center (pixels)
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `juicebox_zoom_out`

Zoom out on the contact map

- `centerX` (number, optional): Optional X coordinate for zoom center (pixels)
- `centerY` (number, optional): Optional Y coordinate for zoom center (pixels)
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `juicebox_select_normalization`

Change the normalization method for the currently loaded Hi-C contact map. This changes the normalization in-place without reloading the map. Available normalizations: NONE (raw counts), VC (Coverage), VC_SQRT (Coverage-Sqrt), KR (Balanced / Knight-Ruiz matrix balancing), SCALE, INTER_SCALE, GW_SCALE. The user may refer to normalizations by either their internal name or their visual/spoken name.

- `normalization` (string, required): Normalization method. Common values: NONE (raw counts), VC (Coverage), VC_SQRT (Coverage-Sqrt), KR (Balanced / Knight-Ruiz), SCALE, INTER_SCALE, GW_SCALE. The available normalizations depend on the loaded map.
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `juicebox_set_color_scale`

Adjust the color scale (threshold) of the contact map. Use "increase" to double the threshold (lighter), "decrease" to halve it (darker), or set an exact numeric value.

- `action` (one of `increase`, `decrease`, `set`, required): Action: "increase" doubles the threshold, "decrease" halves it, "set" uses the provided value
- `value` (number, optional): Exact threshold value (required when action is "set")
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `juicebox_set_map_foreground_color`

Set the foreground color scale for the contact map

- `color` (string, required): Hex color code (e.g., "#ff0000")
- `threshold` (number, optional): Optional threshold value for the color scale
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `juicebox_set_map_background_color`

Set the background color of the contact map

- `color` (string, required): Hex color code (e.g., "#ff0000")
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

## Juicebox: panels

### `juicebox_list_panels`

List the panels (contact-map viewers) open in the page, left to right: position, whether it is the current one, map name, genome, control map, track count and locus, then whether the Juicebox Panel Controls are shown. Tools that take `panel` address a panel by this position, by its map name, or "all".

- no arguments besides `room`

### `juicebox_close_panel`

Close one panel (contact-map viewer) of the page; the panels to its right move one position left. The last panel cannot be closed.

- `panel` (integer/string, optional): panel: position from the left (1, 2, ...) or a map name, no "all"; required when more than one panel is open

### `juicebox_show_panel_controls`

Hide or show the Juicebox Panel Controls (the bar above each map with its map name, locus box and menus) on every panel of the page, and on panels opened later: the same switch as the controls button in the page header. It always acts on the whole page, so it takes no panel. Repeating the current state changes nothing; juicebox_list_panels says which it is.

- `show` (boolean, required): true shows the Juicebox Panel Controls, false hides them

## Juicebox: tracks

### `juicebox_load_track`

Load a 1D or 2D track into Juicebox from a URL. Supports bigWig, bigBed, bedGraph, bed, bedpe, interact, annotation, and other standard genomic track formats. The format is auto-detected from the file extension. When the user asks for a "genes" track, use the keyword "genes" as the url — it loads the NCBI RefSeq Select gene track for the genome of the map in that panel.

- `url` (string, required): URL to the track file (e.g., bigWig, bigBed, bed, bedpe), or the keyword "genes" for the built-in gene track
- `name` (string, optional): Optional display name for the track
- `color` (string, optional): Optional track color as hex code (e.g., "#ff0000")
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `juicebox_list_tracks`

List all loaded 1D and 2D tracks in the current Juicebox session, including their names, types, colors, data ranges, and display settings.

- `panel` (integer/string, optional): panel: position from the left (1, 2, ...) or a map name, no "all"; required when more than one panel is open

### `juicebox_remove_track`

Remove a loaded track from Juicebox by name or index number (use juicebox_list_tracks to see available tracks).

- `track` (string, required): Track name or 1-based index number
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `juicebox_set_track_color`

Set or reset the color of a loaded track. Omit color to reset to default.

- `track` (string, required): Track name or 1-based index number
- `color` (string, optional): Hex color (e.g., "#ff0000"). Omit to reset to default.
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `juicebox_set_track_name`

Rename a loaded track.

- `track` (string, required): Current track name or 1-based index number
- `name` (string, required): New display name for the track
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `juicebox_set_track_data_range`

Set the min/max data range for a 1D track. This disables autoscale.

- `track` (string, required): Track name or 1-based index number
- `min` (number, required): Minimum value
- `max` (number, required): Maximum value
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `juicebox_set_track_autoscale`

Enable or disable autoscale for a 1D track.

- `track` (string, required): Track name or 1-based index number
- `enabled` (boolean, optional), default `true`: Enable (true) or disable (false) autoscale
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `juicebox_set_track_log_scale`

Enable or disable log scale for a 1D track.

- `track` (string, required): Track name or 1-based index number
- `enabled` (boolean, optional), default `true`: Enable (true) or disable (false) log scale
- `panel` (integer/string, optional): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

## Juicebox: sessions and sharing

### `juicebox_save_session`

Save the current Juicebox session. On Cloudflare Workers, returns the session JSON as text (no filesystem available). On local server, saves to a file.

- `filePath` (string, optional): Optional: Ignored on Cloudflare Workers deployment. On local server, full path to save the session file.

### `juicebox_load_session`

Load a Juicebox session from JSON data, attached file, or remote URL. Sessions restore browser configurations, loci, tracks, and visualization state. Supports three input methods: (1) direct JSON paste, (2) file attachment, (3) URL-based loading from remote sources (Dropbox, AWS, etc.).

- `sessionData` (string, optional): JSON string of session data (use when pasting JSON directly into chat)
- `sessionUrl` (string, optional): URL to fetch session JSON from remote source (e.g., Dropbox, AWS S3, GitHub raw file URL)
- `fileContent` (string, optional): Content of attached session file (use when user attaches a .json file to the chat)

### `juicebox_create_shareable_url`

Create a shareable URL for the current Juicebox session

- no arguments besides `room`

## Spacewalk: ensembles and state

### `spacewalk_list_example_ensembles`

List example ensembles to load into Spacewalk: the hosted .sw files of the full Spacewalk app's Load From List, by group, each with its name and URL. An ensemble is the collection of traces in one .sw file (the user may call this "the model"). Use this when the user asks what there is to look at, or names an example without its URL; then pass the URL to spacewalk_load_ensemble.

- no arguments besides `room`

### `spacewalk_load_ensemble`

Load an ensemble into Spacewalk from the URL of its .sw file. An ensemble is the collection of traces in one .sw file (the user may call this "the model"). It opens at its default ensemble group and trace. Use spacewalk_list_example_ensembles for URLs of ensembles to try.

- `url` (string, required): The URL of the .sw file.

### `spacewalk_select_ensemble_group`

Make one ensemble group of the loaded ensemble current, by its key. An ensemble group is a named subset of the traces in the .sw file; one is current at a time. Spacewalk shows the group at its default trace.

- `key` (string, required): The key of the ensemble group.

### `spacewalk_load_session`

Load a Spacewalk session into the Room: what it shows, from a shareable URL of the full Spacewalk app or of this viewer, or from a bare session string. Only the Spacewalk part is read; the reply says what was ignored, such as IGV tracks and the Hi-C map. A URL that merely points at a session file to fetch is refused. To load a .sw file, use spacewalk_load_ensemble.

- `session` (string, required): A shareable URL, or a session string (blob:…).

### `spacewalk_read_viewer_state`

Read what Spacewalk shows now, without changing it: the viewer state, how many Viewers are connected, and what changed since your last reply that you did not cause. An error only when the Room is unknown or expired.

- no arguments besides `room`

## Spacewalk: appearance and camera

### `spacewalk_set_render_style`

Choose how the 3D structure is drawn: ball_and_stick (a ball at each genomic extent, sticks joining them) or ribbon (a smooth tube through them). Only for an ensemble of traces: a point-cloud ensemble is always drawn as a point cloud. Once a Viewer has reported the ensemble a point cloud (kind in the viewer state), this is refused; before then, the Viewer reports the failure to draw it.

- `style` (one of `ball_and_stick`, `ribbon`, required): The render style.

### `spacewalk_step_ball_radius`

Make the balls of the ball-and-stick render style one radius step bigger (up) or smaller (down). The ball radius is a rung 0–10 on Spacewalk's radius ladder, ballRadiusIndex in the viewer state; a step past either end stays there.

- `direction` (one of `up`, `down`, required): up for one radius step bigger, down for one smaller.

### `spacewalk_step_stick_radius`

Make the sticks of the ball-and-stick render style one radius step thicker (up) or thinner (down). The stick radius is a rung 0–10 on Spacewalk's radius ladder, stickRadiusIndex in the viewer state; a step past either end stays there.

- `direction` (one of `up`, `down`, required): up for one radius step bigger, down for one smaller.

### `spacewalk_set_background_color`

Set the color behind the 3D structure, by Apple crayon name or hex (#rrggbb). The crayons: licorice, lead, tungsten, iron, steel, tin, nickel, aluminum, magnesium, silver, mercury, snow, cayenne, mocha, aspargus, fern, clover, moss, teal, ocean, midnight, eggplant, plum, maroon, maraschino, tangerine, lemon, lime, spring, seam_foam, turquoise, aqua, blueberry, grape, magenta, strawberry, salmon, cantaloupe, banana, honeydew, flora, spindrift, ice, sky, orchid, lavender, bubblegum, carnation.

- `color` (string, required): An Apple crayon name, or a hex color.

### `spacewalk_adjust_background`

Make the color behind the 3D structure one step lighter or darker, keeping its hue. A step past white or black stays there.

- `direction` (one of `lighter`, `darker`, required): lighter or darker.

### `spacewalk_reset_camera`

Put the camera back where Spacewalk frames the whole 3D structure.

- no arguments besides `room`
