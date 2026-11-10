/**
 * geenee-install.3dg.io — serves INSTALL-PROMPT.md from the aidenlab/plugins repository so a user can
 * paste one line into any assistant:
 *
 *   Set up Geenee for me: fetch https://geenee-install.3dg.io and follow
 *   its instructions for the app you are running in.
 *
 * It proxies rather than redirects: several assistants' fetch tools do not
 * follow cross-host redirects, and a raw.githubusercontent.com URL is both
 * long and blocked on some corporate networks.
 *
 *   GET /            the markdown (text/markdown; text/html wrapper for browsers).
 *                    Logs each request's Accept header (issue #9).
 *   GET /install     the install page for people, built from README.md's claude-steps
 *                    block (src/install-page.js). The address given out in papers and talks.
 *   GET /raw         always text/plain
 *   GET /<path>      any other file from the repo's default branch, e.g. /README.md
 *   GET /geenee.py, /geenee.mjs       the CLI scripts from the plugin's skill
 *   GET /plugin      302 to the latest geenee.plugin release asset
 *   GET /plugins     302 to the claude.ai plugins settings page (an external link opens
 *                    in a new tab on claude.ai web, keeping the chat in place)
 */

import { ONE_LINE, claudeSteps, esc, installPage } from './install-page.js';

const REPO = 'aidenlab/plugins';
const DEFAULT_BRANCH = 'main';  // overridden by the BRANCH var
const DOC = 'INSTALL-PROMPT.md';
const CACHE_SECONDS = 300;

async function fromGitHub(path, request, branch) {
  const upstream = `https://raw.githubusercontent.com/${REPO}/${branch}/${path}`;
  const res = await fetch(upstream, {
    headers: { 'User-Agent': 'geenee-install-worker' },
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
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Geenee setup</title>
<style>body{max-width:48rem;margin:2rem auto;padding:0 1rem;font:16px/1.5 system-ui,sans-serif;color:#222}pre{white-space:pre-wrap;background:#f6f6f6;padding:1rem;border-radius:6px}code{background:#f0f0f0;padding:.1em .3em;border-radius:3px}</style>
<h1>Geenee setup</h1>
<p>Paste this into Claude Code, Codex, or Codex in the ChatGPT desktop app:</p>
<pre><code>${ONE_LINE}</code></pre>
<p>The assistant reads the instructions below and does the rest. In Claude's other apps no prompt can install Geenee; follow the steps at <a href="/install">geenee-install.3dg.io/install</a>.</p>
<hr>
<pre>${esc(markdown)}</pre>`;
}

export default {
  async fetch(request, env) {
    const branch = (env && env.BRANCH) || DEFAULT_BRANCH;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed\n', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const common = {
      'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'noindex'
    };

    if (url.pathname === '/') {
      // Testing a theory (issue #9): if Claude's fetcher asks for text/html it
      // gets the wrapper above, with the prompt inside a <pre>, not the markdown.
      console.log(JSON.stringify({
        path: '/',
        accept: request.headers.get('Accept'),
        userAgent: request.headers.get('User-Agent'),
        served: wantsHtml(request) ? 'html' : 'markdown'
      }));
    }

    if (url.pathname === '/plugins') {
      return Response.redirect('https://claude.ai/customize/plugins', 302);
    }
    if (url.pathname === '/plugin') {
      return Response.redirect(`https://github.com/${REPO}/releases/latest/download/geenee.plugin`, 302);
    }

    if (url.pathname === '/install') {
      const readme = await fromGitHub('README.md', request, branch);
      if (readme instanceof Response) return readme;
      const steps = claudeSteps(readme);
      if (!steps) return new Response('README.md has no usable claude-steps block\n', { status: 502 });
      return new Response(installPage(steps), { headers: { ...common, 'Content-Type': 'text/html; charset=utf-8' } });
    }

    const SCRIPTS = 'plugins/geenee/skills/geenee/scripts/';
    const script = /^\/geenee\.(py|mjs)$/.exec(url.pathname);
    const path = url.pathname === '/' || url.pathname === '/raw' ? DOC
      : script ? `${SCRIPTS}geenee.${script[1]}`
      : url.pathname.slice(1);
    if (path.includes('..') || path.startsWith('.git/')) return new Response('Not found\n', { status: 404 });

    const body = await fromGitHub(path, request, branch);
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
