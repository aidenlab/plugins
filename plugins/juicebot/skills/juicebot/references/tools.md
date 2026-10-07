# Juicebot tool reference

Generated from the live server's `tools/list` (32 tools). Call them as MCP tools when the connector is present, or as `juicebot.py call <name> '<json>'` otherwise; names and arguments are identical.

## Contents

- Session and viewer: `get_juicebox_url`, `join_room`, `get_server_status`, `juicebox_help`
- Finding data: `search_map_catalogs`, `get_map_details`, `search_encode_hic`, `search_encode`, `list_data_sources`, `get_data_source_statistics`
- Maps and navigation: `load_map`, `load_control_map`, `goto_locus`, `zoom_in`, `zoom_out`, `select_normalization`, `set_color_scale`, `set_map_foreground_color`, `set_map_background_color`
- Panels: `list_panels`, `close_panel`
- Tracks: `load_track`, `list_tracks`, `remove_track`, `set_track_color`, `set_track_name`, `set_track_data_range`, `set_track_autoscale`, `set_track_log_scale`
- Sessions and sharing: `save_session`, `load_session`, `create_shareable_url`

## Session and viewer

### `get_juicebox_url`

Get the join link that opens Juicebox connected to the room bound to this MCP session. Use this when users ask how to connect, how to open the Juicebox app, or say things like "Hello juicebox", "Open juicebox", "Show me juicebox", "Launch juicebox", etc. If you have a browser tool (Claude's built-in browser or Claude in Chrome), open the join link in it right away so Juicebox appears in the side panel next to the conversation: the page connects to this session's room and later tool calls redraw it there. Hosts that render MCP Apps also show a card with the link and its QR code. Always present the link to the user as a clickable link too (a plain URL or markdown link, never inside a code block).

- no arguments

### `join_room`

Bind this MCP session to an existing room, e.g. one a page started whose join link (…?room=<id>) the user pasted into chat. Later tools drive the pages in that room, and get_juicebox_url returns its join link.

- `room` (string, required): Room id: the value of the room parameter in the join link

### `get_server_status`

Get diagnostic information about the MCP server, WebSocket connections, and session status. Use this for debugging connection issues.

- no arguments

### `juicebox_help`

Provides a quick-start guide with common phrases and examples for using Juicebox via natural language. Use this ONLY when users explicitly ask about Juicebox, such as "how to use Juicebox", "Juicebox help", "how do I use Juicebox", "what can I do with Juicebox", "get started with Juicebox", "Juicebox examples", "how does Juicebox work", or similar questions specifically about the Juicebox tool. Do NOT use this for general "how to" questions unrelated to Juicebox.

- no arguments

## Finding data

### `search_map_catalogs`

Search the two curated contact-map catalogs that ship with juicebox-web (ENCODE: ~176 cell-line maps such as GM12878, HCT116, IMR-90, K562; 4DN: ~600 maps) with natural language, e.g. "human hg38 maps", "mouse cell lines", "K562". This is a static list, NOT the ENCODE or 4DN portal: it has no ENCODE tissues and no intact Hi-C. If a query finds nothing here, or the user asks for tissues, intact Hi-C or anything ENCODE-specific, use search_encode_hic instead. Results are limited to 50 by default. For statistical questions like "what assemblies are covered" or "how many maps are there", use get_data_source_statistics instead.

- `source` (string): Data source ID ('4dn', 'encode') or 'all' to search all sources. Default: 'all'
- `query` (string, required): Natural language search query (e.g., "human hg38", "mouse cells", "K562")
- `limit` (integer): Maximum number of results to return (default: 50)

### `get_map_details`

Get detailed information about a specific Hi-C contact map. Use this when users want more information about a specific map from search results.

- `source` (string, required): Data source ID ('4dn' or 'encode')
- `index` (integer): Index from search results (0-based). Required if url is not provided.
- `url` (string): Direct URL to the map. Required if index is not provided.

### `search_encode_hic`

Search the live ENCODE portal (encodeproject.org) for Hi-C experiments and list, per experiment, its contact-map files and the companion files the viewer can load as tracks (loops, contact domains and chromatin stripes as bedpe; subcompartments as bed; compartments as bigWig). Use this for any ENCODE map the catalogs do not have: tissues (heart, colon, brain ...), intact Hi-C, specific cell lines. Put organ, tissue or cell-line words in `biosample` (organs match the ontology; other words fall back to text search); ask for "intact Hi-C" with `assay`; set `classification: "tissue"` when the user means tissue rather than a cell line derived from that organ. To load a map pass `maps[].url` to load_map (prefer the "mapping quality thresholded contact matrix", one per biosample); pass `tracks[].url` to load_track. For non-Hi-C questions use search_encode.

- `biosample` (string): Organ, tissue or cell line words, e.g. "heart", "colon", "K562"
- `assay` (one of intact Hi-C, in situ Hi-C, Hi-C, dilution Hi-C): One Hi-C flavour; default: all of intact Hi-C, in situ Hi-C, Hi-C, dilution Hi-C
- `classification` (one of tissue, cell line, primary cell, in vitro differentiated cells): Biosample classification, e.g. "tissue" to exclude cell lines derived from the organ
- `assembly` (string): Genome assembly, e.g. "GRCh38", "mm10"
- `query` (string): Free text for the portal full-text search (lab, donor, treatment ...)
- `limit` (integer): Maximum experiments to return (default: 10)

### `search_encode`

General search of the live ENCODE portal for anything that is not a Hi-C map: other assays (TF ChIP-seq, Histone ChIP-seq, DNase-seq, ATAC-seq, RNA-seq ...), annotations, biosamples, publications. `query` is the portal full-text search; `filters` are portal facet fields passed through verbatim, e.g. {"assay_title": "TF ChIP-seq", "biosample_ontology.organ_slims": "heart", "target.label": "CTCF"}; a list value means any of them. The result lists the hits with their portal links and the facets you can narrow by. For the files of one experiment use type "File" with {"dataset": "/experiments/ENCSRxxxxxx/"}.

- `type` (string): Portal object type: Experiment (default), Annotation, File, Biosample, Publication, ...
- `query` (string): Free text
- `filters` (object): Facet field → value or list of values, passed to the portal as query parameters
- `limit` (integer): Maximum hits to return (default: 20)

### `list_data_sources`

List available Hi-C contact map data sources (4DN, ENCODE) with their metadata columns. Use this when users ask what data sources are available, what maps can be searched, or want to understand the available metadata.

- no arguments

### `get_data_source_statistics`

Get statistical overview of a data source including total maps, assemblies covered, and breakdowns by metadata fields. Use this when users ask "what assemblies are available", "how many maps are there", "what cell types are covered", etc. This returns unfiltered statistics without search limits.

- `source` (string, required): Data source ID ('4dn' or 'encode')

## Maps and navigation

### `load_map`

Load a Hi-C contact map (.hic file) into Juicebox. With panel "new" the map opens in an additional panel beside the current one (side by side); otherwise it replaces the map in the panel named by `panel`, which is required when more than one panel is open.

- `url` (string, required): URL to the .hic file
- `name` (string): Optional name for the map
- `normalization` (string): Normalization method (e.g., "VC", "VC_SQRT", "KR", "NONE")
- `locus` (string): Optional genomic locus (e.g., "1:1000000-2000000 1:1000000-2000000")
- `panel` (integer|string): panel: "new" opens another panel beside the others and loads there (side-by-side comparisons); a position from the left (1, 2, ...) or a map name replaces that panel's map, no "all"; required when more than one panel is open

### `load_control_map`

Load a control map (.hic file) for comparison

- `url` (string, required): URL to the control .hic file
- `name` (string): Optional name for the control map
- `normalization` (string): Normalization method (e.g., "VC", "VC_SQRT", "KR", "NONE")
- `panel` (integer|string): panel: position from the left (1, 2, ...) or a map name, no "all"; required when more than one panel is open

### `goto_locus`

Navigate to a specific genomic locus in the currently loaded map. Supports natural language, gene names, standard format, and structured objects. Examples: "chr1:1000-2000", "BRCA1", "chromosome 1 from 1000 to 2000", or {chr: "chr1", start: 1000, end: 2000}. When a single chromosome is specified, it applies to both axes of the Hi-C contact map.

- `locus` (string|object, required): Locus to navigate to.
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `zoom_in`

Zoom in on the contact map

- `centerX` (number): Optional X coordinate for zoom center (pixels)
- `centerY` (number): Optional Y coordinate for zoom center (pixels)
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `zoom_out`

Zoom out on the contact map

- `centerX` (number): Optional X coordinate for zoom center (pixels)
- `centerY` (number): Optional Y coordinate for zoom center (pixels)
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `select_normalization`

Change the normalization method for the currently loaded Hi-C contact map. This changes the normalization in-place without reloading the map. Available normalizations: NONE (raw counts), VC (Coverage), VC_SQRT (Coverage-Sqrt), KR (Balanced / Knight-Ruiz matrix balancing), SCALE, INTER_SCALE, GW_SCALE. The user may refer to normalizations by either their internal name or their visual/spoken name.

- `normalization` (string, required): Normalization method. Common values: NONE (raw counts), VC (Coverage), VC_SQRT (Coverage-Sqrt), KR (Balanced / Knight-Ruiz), SCALE, INTER_SCALE, GW_SCALE. The available normalizations depend on the loaded map.
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `set_color_scale`

Adjust the color scale (threshold) of the contact map. Use "increase" to double the threshold (lighter), "decrease" to halve it (darker), or set an exact numeric value.

- `action` (one of increase, decrease, set, required): Action: "increase" doubles the threshold, "decrease" halves it, "set" uses the provided value
- `value` (number): Exact threshold value (required when action is "set")
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `set_map_foreground_color`

Set the foreground color scale for the contact map

- `color` (string, required): Hex color code (e.g., "#ff0000")
- `threshold` (number): Optional threshold value for the color scale
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `set_map_background_color`

Set the background color of the contact map

- `color` (string, required): Hex color code (e.g., "#ff0000")
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

## Panels

### `list_panels`

List the panels (contact-map viewers) open in the page, left to right: position, whether it is the current one, map name, genome, control map, track count and locus. Tools that take `panel` address a panel by this position, by its map name, or "all".

- no arguments

### `close_panel`

Close one panel (contact-map viewer) of the page; the panels to its right move one position left. The last panel cannot be closed.

- `panel` (integer|string): panel: position from the left (1, 2, ...) or a map name, no "all"; required when more than one panel is open

## Tracks

### `load_track`

Load a 1D or 2D track into Juicebox from a URL. Supports bigWig, bigBed, bedGraph, bed, bedpe, interact, annotation, and other standard genomic track formats. The format is auto-detected from the file extension. When the user asks for a "genes" track, use the keyword "genes" as the url — it loads the NCBI RefSeq Select gene track for the genome of the map in that panel.

- `url` (string, required): URL to the track file (e.g., bigWig, bigBed, bed, bedpe), or the keyword "genes" for the built-in gene track
- `name` (string): Optional display name for the track
- `color` (string): Optional track color as hex code (e.g., "#ff0000")
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `list_tracks`

List all loaded 1D and 2D tracks in the current Juicebox session, including their names, types, colors, data ranges, and display settings.

- `panel` (integer|string): panel: position from the left (1, 2, ...) or a map name, no "all"; required when more than one panel is open

### `remove_track`

Remove a loaded track from Juicebox by name or index number (use list_tracks to see available tracks).

- `track` (string, required): Track name or 1-based index number
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `set_track_color`

Set or reset the color of a loaded track. Omit color to reset to default.

- `track` (string, required): Track name or 1-based index number
- `color` (string): Hex color (e.g., "#ff0000"). Omit to reset to default.
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `set_track_name`

Rename a loaded track.

- `track` (string, required): Current track name or 1-based index number
- `name` (string, required): New display name for the track
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `set_track_data_range`

Set the min/max data range for a 1D track. This disables autoscale.

- `track` (string, required): Track name or 1-based index number
- `min` (number, required): Minimum value
- `max` (number, required): Maximum value
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `set_track_autoscale`

Enable or disable autoscale for a 1D track.

- `track` (string, required): Track name or 1-based index number
- `enabled` (boolean): Enable (true) or disable (false) autoscale
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

### `set_track_log_scale`

Enable or disable log scale for a 1D track.

- `track` (string, required): Track name or 1-based index number
- `enabled` (boolean): Enable (true) or disable (false) log scale
- `panel` (integer|string): panel: position from the left (1, 2, ...), a map name, or "all"; required when more than one panel is open

## Sessions and sharing

### `save_session`

Save the current Juicebox session. On Cloudflare Workers, returns the session JSON as text (no filesystem available). On local server, saves to a file.

- `filePath` (string): Optional: Ignored on Cloudflare Workers deployment. On local server, full path to save the session file.

### `load_session`

Load a Juicebox session from JSON data, attached file, or remote URL. Sessions restore browser configurations, loci, tracks, and visualization state. Supports three input methods: (1) direct JSON paste, (2) file attachment, (3) URL-based loading from remote sources (Dropbox, AWS, etc.).

- `sessionData` (string): JSON string of session data (use when pasting JSON directly into chat)
- `sessionUrl` (string): URL to fetch session JSON from remote source (e.g., Dropbox, AWS S3, GitHub raw file URL)
- `fileContent` (string): Content of attached session file (use when user attaches a .json file to the chat)

### `create_shareable_url`

Create a shareable URL for the current Juicebox session

- no arguments
