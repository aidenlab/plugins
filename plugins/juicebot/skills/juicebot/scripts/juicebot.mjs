#!/usr/bin/env node
// juicebot.mjs - call the Juicebot MCP server without an MCP connector.
// Node 18+, no dependencies. Same commands and output as juicebot.py:
//
//   juicebot.mjs url | status | tools | call TOOL [JSON] [TOOL [JSON] ...] | join ROOM_OR_LINK | reset
//   options: --json  --room ID  --server URL      env: JUICEBOT_URL, JUICEBOT_STATE
//   exit codes: 0 ok; 2 the tool reported an error (usually: no page connected); 1 transport/usage error
//
// Sandboxed agent shells route HTTPS through a proxy given in HTTPS_PROXY. Node's
// fetch ignores that variable unless NODE_USE_ENV_PROXY=1 is set, so the script
// re-executes itself once with it set when a proxy is configured.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY && !process.env.JUICEBOT_NO_REEXEC) {
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, NODE_USE_ENV_PROXY: '1', NODE_NO_WARNINGS: '1', JUICEBOT_NO_REEXEC: '1' }
  });
  process.exit(r.status ?? 1);
}

// Candidate endpoints, tried in order the first time a session is created. The
// 3dg.io name is the lab's stable hostname; the workers.dev name is the frozen
// demo deployment. Override with --server or JUICEBOT_URL.
const SERVERS = [
  'https://juicebot-mcp.3dg.io/mcp',
  'https://juicebox-mcp-v2.aidenlab.workers.dev/mcp'
];
// Cloudflare's Browser Integrity Check (error 1010) rejects some library User-Agents.
const USER_AGENT = 'juicebot-cli/1.0 (+https://github.com/aidenlab/plugins)';
// Tool calls wait up to 10 s for the page's ack; ENCODE portal searches can be slow.
const TIMEOUT_MS = 60_000;
const PROTOCOL_VERSION = '2025-06-18';
const STATE_PATH = process.env.JUICEBOT_STATE
  || join(process.env.XDG_STATE_HOME || join(homedir(), '.local', 'state'), 'juicebot', 'session.json');

class Transport extends Error {}
class SessionGone extends Error {}
let nextId = 0;

async function post(url, message, sessionId) {
  const headers = {
    'Content-Type': 'application/json',
    // The server answers 406 unless both media types are accepted.
    'Accept': 'application/json, text/event-stream',
    'User-Agent': USER_AGENT
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;
  let resp;
  try {
    resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(message), signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    throw new Transport(`cannot reach ${url}: ${e.cause?.code || e.cause?.message || e.message}`);
  }
  if (resp.status === 404) throw new SessionGone();
  if (!resp.ok) {
    const body = await resp.text();
    const hint = resp.status === 403 && body.includes('1010') ? ' (Cloudflare Browser Integrity Check rejected the request; check the User-Agent)' : '';
    throw new Transport(`HTTP ${resp.status} from ${url}${hint}`);
  }
  const sid = resp.headers.get('mcp-session-id');
  const raw = await resp.text();
  if (!raw || !('id' in message)) return [null, sid];
  const data = JSON.parse(raw);
  if (data.error) throw new Transport(`MCP error ${data.error.code}: ${data.error.message}`);
  return [data.result, sid];
}

const rpc = (url, method, params, sid) => post(url, { jsonrpc: '2.0', id: ++nextId, method, ...(params !== undefined && { params }) }, sid);
const notify = (url, method, sid) => post(url, { jsonrpc: '2.0', method }, sid);

function loadState() {
  try { return JSON.parse(readFileSync(STATE_PATH, 'utf8')); } catch { return {}; }
}
function saveState(state) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state));
}

async function initialize(url) {
  const [, sid] = await rpc(url, 'initialize', {
    protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: 'juicebot-cli', version: '1.0' }
  });
  if (!sid) throw new Transport(`${url} answered initialize without an mcp-session-id`);
  await notify(url, 'notifications/initialized', sid);
  return sid;
}

class Session {
  constructor(server, room) {
    this.explicitServer = server || process.env.JUICEBOT_URL;
    this.room = room;
    this.url = null;
    this.sid = null;
  }
  async open(fresh = false) {
    const state = loadState();
    if (this.explicitServer) this.url = this.explicitServer;
    if (this.room) {
      this.url = this.url || state.url || (await this.firstLive()).url;
      this.sid = this.room;
      return;
    }
    if (!fresh && state.sid && (!this.url || state.url === this.url)) {
      this.url = state.url; this.sid = state.sid;
      return;
    }
    if (this.url) this.sid = await initialize(this.url);
    else ({ url: this.url, sid: this.sid } = await this.firstLive());
    saveState({ url: this.url, sid: this.sid });
  }
  async firstLive() {
    const errors = [];
    for (const candidate of SERVERS) {
      try { return { url: candidate, sid: await initialize(candidate) }; }
      catch (e) { if (e instanceof Transport) errors.push(e.message); else throw e; }
    }
    throw new Transport('no Juicebot server reachable:\n  ' + errors.join('\n  '));
  }
  async call(name, args) {
    try {
      return (await rpc(this.url, 'tools/call', { name, arguments: args }, this.sid))[0];
    } catch (e) {
      if (!(e instanceof SessionGone)) throw e;
      if (this.room) throw new Transport(`room ${this.room} is unknown to the server (expired?)`);
      await this.open(true); // the server forgot us (idle > 24 h, redeploy): start a new room once
      return (await rpc(this.url, 'tools/call', { name, arguments: args }, this.sid))[0];
    }
  }
  async tools() { return (await rpc(this.url, 'tools/list', undefined, this.sid))[0].tools; }
}

function printResult(result, asJson) {
  if (asJson) console.log(JSON.stringify(result));
  else {
    for (const c of result.content || []) if (c.type === 'text') console.log(c.text);
    if (result.structuredContent) {
      const { qrPng, ...rest } = result.structuredContent; // a base64 PNG is noise on a terminal
      console.log('structured: ' + JSON.stringify(rest));
    }
  }
  return result.isError ? 2 : 0;
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
  return [opts, rest];
}

const HELP = `juicebot.mjs - call the Juicebot MCP server without an MCP connector.

  juicebot.mjs url                         join link for this session's room (starts a session if needed)
  juicebot.mjs status                      server status; "Browser Connected: Yes" means a page is live
  juicebot.mjs tools                       tool names with one-line descriptions
  juicebot.mjs call TOOL [JSON] [TOOL [JSON] ...]   call one or more tools in one process, in order
  juicebot.mjs join ROOM_OR_JOIN_LINK      bind this session to an existing room
  juicebot.mjs reset                       forget the session; the next command starts a new room
Options: --json   --room ID   --server URL      Env: JUICEBOT_URL, JUICEBOT_STATE
Exit codes: 0 ok; 2 the tool reported an error (usually: no page connected); 1 transport or usage error.`;

async function main(argv) {
  if (!argv.length || ['-h', '--help', 'help'].includes(argv[0])) { console.log(HELP); return 0; }
  const [opts, rest0] = parseArgs(argv);
  const [cmd, ...rest] = rest0;
  if (cmd === 'reset') {
    try { unlinkSync(STATE_PATH); } catch {}
    console.log('session cleared'); return 0;
  }
  const s = new Session(opts.server, opts.room);
  await s.open();
  if (cmd === 'tools') {
    for (const t of await s.tools()) console.log(t.name.padEnd(28) + ' ' + (t.description || '').split('. ')[0].slice(0, 100));
    return 0;
  }
  if (cmd === 'url') return printResult(await s.call('get_juicebox_url', {}), opts.json);
  if (cmd === 'status') return printResult(await s.call('get_server_status', {}), opts.json);
  if (cmd === 'join') {
    if (!rest.length) throw new Transport('join needs a room id or a join link');
    const room = rest[0].split('room=').pop().split('&')[0].replace(/\/+$/, '');
    return printResult(await s.call('join_room', { room }), opts.json);
  }
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
    let worst = 0;
    for (const [name, args] of pairs) {
      if (pairs.length > 1 && !opts.json) console.log('== ' + name);
      const code = printResult(await s.call(name, args), opts.json);
      worst = Math.max(worst, code);
      if (code && !opts.json) { console.log(`(stopping: ${name} reported an error)`); break; }
    }
    return worst;
  }
  throw new Transport(`unknown command '${cmd}'; try --help`);
}

main(process.argv.slice(2)).then(code => process.exit(code), e => {
  console.error('error: ' + (e instanceof Transport ? e.message : e.stack || e));
  process.exit(1);
});
