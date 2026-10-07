/**
 * juicebot-install.3dg.io — serves INSTALL-PROMPT.md from the aidenlab/plugins
 * repository so a user can paste one line into any assistant:
 *
 *   Set up Juicebot for me: fetch https://juicebot-install.3dg.io and follow
 *   its instructions for the app you are running in.
 *
 * It proxies rather than redirects: several assistants' fetch tools do not
 * follow cross-host redirects, and a raw.githubusercontent.com URL is both
 * long and blocked on some corporate networks.
 *
 *   GET /            the markdown (text/markdown; text/html wrapper for browsers)
 *   GET /raw         always text/plain
 *   GET /<path>      any other file from the repo's default branch, e.g. /README.md
 *   GET /plugin      302 to the latest juicebot.plugin release asset
 */

const REPO = 'aidenlab/plugins';
const BRANCH = 'main';
const DOC = 'INSTALL-PROMPT.md';
const CACHE_SECONDS = 300;

async function fromGitHub(path, request) {
  const upstream = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`;
  const res = await fetch(upstream, {
    headers: { 'User-Agent': 'juicebot-install-worker' },
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
  });
  if (!res.ok) {
    return new Response(`Upstream ${res.status} for ${path}\n`, { status: res.status === 404 ? 404 : 502 });
  }
  return res.text();
}

function wantsHtml(request) {
  const accept = request.headers.get('Accept') || '';
  return accept.includes('text/html') && !accept.includes('text/markdown');
}

function htmlPage(markdown) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Juicebot setup</title>
<style>body{max-width:48rem;margin:2rem auto;padding:0 1rem;font:16px/1.5 system-ui,sans-serif;color:#222}pre{white-space:pre-wrap;background:#f6f6f6;padding:1rem;border-radius:6px}code{background:#f0f0f0;padding:.1em .3em;border-radius:3px}</style>
<h1>Juicebot setup</h1>
<p>Paste this into Claude Code, Cowork, claude.ai, Codex or ChatGPT:</p>
<pre><code>Set up Juicebot for me: fetch https://juicebot-install.3dg.io and follow its instructions for the app you are running in.</code></pre>
<p>The assistant reads the instructions below and does the rest. Manual steps: <a href="https://github.com/${REPO}#manual-install">github.com/${REPO}</a>.</p>
<hr>
<pre>${esc(markdown)}</pre>`;
}

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed\n', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const common = {
      'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'noindex'
    };

    if (url.pathname === '/plugin') {
      return Response.redirect(`https://github.com/${REPO}/releases/latest/download/juicebot.plugin`, 302);
    }

    const path = url.pathname === '/' || url.pathname === '/raw' ? DOC : url.pathname.slice(1);
    if (path.includes('..') || path.startsWith('.git/')) return new Response('Not found\n', { status: 404 });

    const body = await fromGitHub(path, request);
    if (body instanceof Response) return body;

    if (url.pathname === '/raw') {
      return new Response(body, { headers: { ...common, 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    if (url.pathname === '/' && wantsHtml(request)) {
      return new Response(htmlPage(body), { headers: { ...common, 'Content-Type': 'text/html; charset=utf-8' } });
    }
    const type = path.endsWith('.json') ? 'application/json' : path.endsWith('.md') ? 'text/markdown' : 'text/plain';
    return new Response(body, { headers: { ...common, 'Content-Type': `${type}; charset=utf-8` } });
  }
};
