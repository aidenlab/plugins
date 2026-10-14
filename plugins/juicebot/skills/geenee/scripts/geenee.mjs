#!/usr/bin/env node
// geenee.mjs - call the Geenee MCP server without an MCP connector.
// Node 18+, no dependencies. Same commands and output as geenee.py:
//
//   geenee.mjs open | status | tools | call TOOL [JSON] [TOOL [JSON] ...] | room [ID_OR_LINK] | reset
//   options: --json  --room ID  --server URL      env: GEENEE_URL, GEENEE_STATE
//   exit codes: 0 ok; 2 the tool reported an error (usually: no viewer connected); 1 transport/usage error
//
// Geenee drives two viewers (igv and Juicebox) on one page, the Workspace, named
// by a Room id. The first command opens a Room and remembers it; later commands
// in any shell act on the same Workspace, filling `room` into every call.
//
// Sandboxed agent shells route HTTPS through a proxy given in HTTPS_PROXY. Node's
// fetch ignores that variable unless NODE_USE_ENV_PROXY=1 is set, so the script
// re-executes itself once with it set when a proxy is configured.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY && !process.env.GEENEE_NO_REEXEC) {
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, NODE_USE_ENV_PROXY: '1', NODE_NO_WARNINGS: '1', GEENEE_NO_REEXEC: '1' }
  });
  process.exit(r.status ?? 1);
}

// PROFILE names the deployment this copy belongs to ("" for production, "dev" on
// the dev branch); it keeps the state files apart so two CLIs never share a Room.
const PROFILE = '';
// Candidate endpoints, tried in order when no Room is known yet. Override with
// --server or GEENEE_URL. The one that answers is remembered with the Room.
const SERVERS = [
  'https://geenee-dev.3dg.io/mcp'
];
// A descriptive User-Agent: Cloudflare's Browser Integrity Check (error 1010) rejects some library defaults.
const USER_AGENT = 'geenee-cli/2.0 (+https://github.com/aidenlab/plugins)';
// Viewer acks take up to 15 s and catalogue searches can be slow.
const TIMEOUT_MS = 60_000;
const OPEN_TOOL = 'open_geenee';
const ROOM_ID = /^[0-9A-HJKMNP-TV-Z]{10}$/;
const STATE_PATH = process.env.GEENEE_STATE
  || join(process.env.XDG_STATE_HOME || join(homedir(), '.local', 'state'), 'geenee', `room${PROFILE ? '-' + PROFILE : ''}.json`);

class Transport extends Error {}
let nextId = 0;

// POST one JSON-RPC request; the server is stateless, so no handshake or session header.
async function rpc(url, method, params) {
  const headers = {
    'Content-Type': 'application/json',
    // The server answers 406 unless both media types are accepted.
    'Accept': 'application/json, text/event-stream',
    'User-Agent': USER_AGENT
  };
  let resp;
  try {
    resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: ++nextId, method, params }), signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    throw new Transport(`cannot reach ${url}: ${e.cause?.code || e.cause?.message || e.message}`);
  }
  if (!resp.ok) {
    const body = await resp.text();
    const hint = resp.status === 403 && body.includes('1010') ? ' (Cloudflare Browser Integrity Check rejected the request; check the User-Agent)' : '';
    throw new Transport(`HTTP ${resp.status} from ${url}${hint}`);
  }
  const data = await resp.json();
  if (data.error) throw new Transport(`MCP error ${data.error.code}: ${data.error.message}`);
  return data.result;
}

function loadState() {
  try { return JSON.parse(readFileSync(STATE_PATH, 'utf8')); } catch { return {}; }
}
function saveState(state) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state));
}

// A Room id as typed or as part of a Workspace link (…?room=ID); null if it is not one.
function parseRoom(value) {
  value = value.trim();
  if (value.includes('room=')) value = value.split('room=')[1].split('&')[0].replace(/[/ ]+$/, '');
  value = value.toUpperCase();
  return ROOM_ID.test(value) ? value : null;
}

class Session {
  constructor(server, room) {
    this.explicitServer = server || process.env.GEENEE_URL;
    this.explicitRoom = room;
    this.url = null;
    this.room = null;
    this.opened = null; // the open_geenee result when this process opened the Room
  }
  async open() {
    const state = loadState();
    this.url = this.explicitServer || (SERVERS.includes(state.url) ? state.url : null);
    if (this.explicitRoom) {
      this.room = this.explicitRoom;
      this.url = this.url || (await this.firstLive());
      return;
    }
    if (state.room && this.url && state.url === this.url) { this.room = state.room; return; }
    this.url = this.url || (await this.firstLive());
    await this.openWorkspace();
  }
  async firstLive() {
    const errors = [];
    for (const candidate of SERVERS) {
      try { await rpc(candidate, 'tools/list', {}); return candidate; }
      catch (e) { if (e instanceof Transport) errors.push(e.message); else throw e; }
    }
    throw new Transport('no Geenee server reachable:\n  ' + errors.join('\n  '));
  }
  // Call open_geenee (for the known Room, or a new one) and remember the Room.
  async openWorkspace(room) {
    const result = await rpc(this.url, 'tools/call', { name: OPEN_TOOL, arguments: room ? { room } : {} });
    const sc = result.structuredContent || {};
    if (result.isError || !sc.room) throw new Transport('open_geenee failed: ' + textOf(result));
    this.room = sc.room;
    this.opened = result;
    saveState({ url: this.url, room: this.room });
    return result;
  }
  async call(name, args) {
    if (name === OPEN_TOOL) return this.openWorkspace(args.room || this.room);
    return rpc(this.url, 'tools/call', { name, arguments: { room: this.room, ...args } });
  }
  async tools() { return (await rpc(this.url, 'tools/list', {})).tools; }
}

const textOf = (result) => (result.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');

function printResult(result, asJson) {
  if (asJson) console.log(JSON.stringify(result));
  else {
    const text = textOf(result);
    if (text) console.log(text);
    if (result.structuredContent) {
      const { qrPng, ...rest } = result.structuredContent; // a base64 PNG is noise on a terminal
      console.log('structured: ' + JSON.stringify(rest));
    }
  }
  return result.isError ? 2 : 0;
}

function printOpened(s, asJson) {
  const { room, workspaceUrl } = s.opened.structuredContent;
  if (asJson) console.log(JSON.stringify({ room, workspaceUrl }));
  else console.log(`Geenee link: ${workspaceUrl}\nRoom id: ${room}`);
}

// Connection state of both viewers, from the tools that change nothing.
async function status(s, asJson) {
  const jb = await s.call('juicebox_get_server_status', {});
  const igv = await s.call('igv_read_session_summary', {});
  const jbOk = textOf(jb).includes('Browser Connected: Yes');
  const igvOk = !igv.isError;
  if (asJson) {
    console.log(JSON.stringify({ room: s.room, server: s.url, juicebox: { connected: jbOk, result: jb }, igv: { connected: igvOk, result: igv } }));
  } else {
    console.log(`Room: ${s.room}\nServer: ${s.url}\nJuicebox: ${jbOk ? 'connected' : 'not connected'}\nIGV: ${igvOk ? 'connected' : 'not connected'}`);
    if (!(jbOk && igvOk)) console.log('(open the Workspace link from `open` in a browser; both viewers connect from that page)');
  }
  return jbOk || igvOk ? 0 : 2;
}

function parseArgs(argv) {
  const opts = { json: false, room: null, server: null };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--room' || a === '--server') {
      if (i + 1 >= argv.length) throw new Transport(`${a} needs a value`);
      opts[a.slice(2)] = argv[++i];
    } else if (a.startsWith('--')) throw new Transport(`unknown option ${a}`);
    else rest.push(a);
  }
  if (opts.room) {
    const room = parseRoom(opts.room);
    if (!room) throw new Transport(`'${opts.room}' is not a Room id (10 letters/digits) or a Workspace link`);
    opts.room = room;
  }
  return [opts, rest];
}

const HELP = `geenee.mjs - call the Geenee MCP server without an MCP connector.

  geenee.mjs open                          Workspace link for this shell's Room (opens a new Room if none)
  geenee.mjs status                        whether each viewer is connected in the Room
  geenee.mjs tools                         tool names with one-line descriptions
  geenee.mjs call TOOL [JSON] [TOOL [JSON] ...]   call one or more tools in one process, in order; room is filled in
  geenee.mjs room [ID_OR_LINK]             show the current Room id, or switch to another Room
  geenee.mjs reset                         forget the Room; the next command opens a new one
Options: --json   --room ID   --server URL      Env: GEENEE_URL, GEENEE_STATE
Exit codes: 0 ok; 2 the tool reported an error (usually: no viewer connected); 1 transport or usage error.`;

async function main(argv) {
  if (!argv.length || ['-h', '--help', 'help'].includes(argv[0])) { console.log(HELP); return 0; }
  const [opts, rest0] = parseArgs(argv);
  if (!rest0.length) throw new Transport('missing command; try --help');
  const [cmd, ...rest] = rest0;
  if (cmd === 'reset') {
    try { unlinkSync(STATE_PATH); } catch {}
    console.log('room forgotten'); return 0;
  }
  if (cmd === 'room' && rest.length) {
    const room = parseRoom(rest[0]);
    if (!room) throw new Transport(`'${rest[0]}' is not a Room id or a Workspace link`);
    const s = new Session(opts.server, room);
    await s.open();
    await s.openWorkspace(room); // confirms the server and gets the link for that Room
    printOpened(s, opts.json);
    return 0;
  }
  const s = new Session(opts.server, opts.room);
  await s.open();
  if (cmd === 'room') { console.log(s.room); return 0; }
  if (cmd === 'open') {
    if (!s.opened) await s.openWorkspace(s.room);
    printOpened(s, opts.json);
    return 0;
  }
  if (cmd === 'tools') {
    for (const t of await s.tools()) console.log(t.name.padEnd(34) + ' ' + (t.description || '').split('. ')[0].slice(0, 100));
    return 0;
  }
  if (cmd === 'status') return status(s, opts.json);
  if (cmd === 'call') {
    if (!rest.length) throw new Transport('call needs at least one tool name');
    const pairs = [];
    for (let i = 0; i < rest.length; i++) {
      const name = rest[i];
      let args = {};
      if (i + 1 < rest.length && rest[i + 1].trimStart().startsWith('{')) {
        try { args = JSON.parse(rest[++i]); } catch (e) { throw new Transport(`arguments for ${name} are not valid JSON: ${e.message}`); }
      }
      pairs.push([name, args]);
    }
    if (s.opened && !opts.json) {
      // This process opened a new Room: the user has to open its link before anything shows.
      printOpened(s, false);
      console.log('(new Room; open the link in a browser for the viewers to show anything)');
    }
    let worst = 0;
    for (let n = 0; n < pairs.length; n++) {
      const [name, args] = pairs[n];
      if (pairs.length > 1 && !opts.json) console.log('== ' + name);
      const code = printResult(await s.call(name, args), opts.json);
      worst = Math.max(worst, code);
      if (code && !opts.json) {
        if (n + 1 < pairs.length) console.log(`(stopping: ${name} reported an error; ${pairs.length - n - 1} call(s) not sent)`);
        break;
      }
    }
    return worst;
  }
  throw new Transport(`unknown command '${cmd}'; try --help`);
}

main(process.argv.slice(2)).then(code => process.exit(code), e => {
  console.error('error: ' + (e instanceof Transport ? e.message : e.stack || e));
  process.exit(1);
});
