import { test } from 'node:test';
import assert from 'node:assert/strict';
import { get } from './helpers.js';

test('/install serves an HTML page built from README.md on main', async () => {
  const { res, text, requested } = await get('/install');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type'), /^text\/html/);
  assert.deepEqual(requested, ['README.md']);
  assert.match(text, /<li>Click <b>Sync<\/b><\/li>/);
});

test('/install gives the four Claude steps word for word, and the paid-plan note', async () => {
  const { text } = await get('/install');
  for (const step of [
    '<li>Go to <b>Customize → Plugins → +Add → Add marketplace → Add from a repository</b>. Enter this URL: <code>aidenlab/plugins</code></li>',
    '<li>Click <b>Sync</b></li>',
    '<li>You will be on the <b>Discover</b> tab. Click <b>Add</b> (Not <b>+Add</b>).</li>',
    '<li>Select the <b>Connectors</b> tab. <b>Connect → Continue → Add</b></li>'
  ]) assert.ok(text.includes(step), `missing step: ${step}`);
  assert.match(text, /You need a paid plan\./);
});

test('/install leaves out the juicebot cleanup note and the Claude-voiced check', async () => {
  const { text } = await get('/install');
  assert.doesNotMatch(text, /juicebot/);
  assert.doesNotMatch(text, /ask me to open/);
});

const ONE_LINE = 'Set up Geenee for me: fetch https://geenee-install.3dg.io and follow its instructions for the app you are running in.';

test('/install puts the sections in order: what Geenee is, Claude, ChatGPT desktop, Claude Code and Codex, reporting a failure', async () => {
  const { text } = await get('/install');
  const at = [
    /Geenee lets you/,
    /<h2[^>]*>Claude(?! Code)\b/,
    /<h2[^>]*>ChatGPT desktop\b/,
    /<h2[^>]*>Claude Code (and|or) Codex\b/,
    /<h2[^>]*>If a step fails\b/
  ].map(re => text.search(re));
  assert.ok(at.every(i => i >= 0), `missing a section: ${at}`);
  assert.deepEqual([...at].sort((a, b) => a - b), at);
});

test('/install says plainly that Claude needs clicks where ChatGPT takes one line', async () => {
  const { text } = await get('/install');
  const claude = text.slice(text.search(/<h2[^>]*>Claude(?! Code)\b/), text.search(/<h2[^>]*>ChatGPT desktop\b/));
  assert.match(claude, /one line/);
  assert.match(claude, /ChatGPT/);
});

test('/install gives ChatGPT desktop and Claude Code/Codex the one line, and ChatGPT says open Codex and Approve', async () => {
  const { text } = await get('/install');
  const chatgpt = text.slice(text.search(/<h2[^>]*>ChatGPT desktop\b/), text.search(/<h2[^>]*>Claude Code/));
  assert.ok(chatgpt.includes(ONE_LINE));
  assert.match(chatgpt, /<b>Codex<\/b>/);
  assert.match(chatgpt, /<b>Approve<\/b>/);
  const code = text.slice(text.search(/<h2[^>]*>Claude Code/), text.search(/<h2[^>]*>If a step fails/));
  assert.ok(code.includes(ONE_LINE));
});

test('/install sends failed steps to GitHub Issues on aidenlab/plugins', async () => {
  const { text } = await get('/install');
  const report = text.slice(text.search(/<h2[^>]*>If a step fails/));
  assert.match(report, /href="https:\/\/github\.com\/aidenlab\/plugins\/issues"/);
});

test('/install answers 502 rather than a page without the steps when README.md has lost its claude-steps block', async () => {
  const { res } = await get('/install', { files: { 'README.md': '# Aiden Lab plugins\n' } });
  assert.equal(res.status, 502);
});

test('/install works with the README.md in this repository', async () => {
  const { readFile } = await import('node:fs/promises');
  const readme = await readFile(new URL('../../README.md', import.meta.url), 'utf8');
  const { res, text } = await get('/install', { files: { 'README.md': readme } });
  assert.equal(res.status, 200);
  assert.equal((text.match(/<li>/g) || []).length >= 4, true);
  assert.match(text, /You need a paid plan\./);
});

test('/install tells Claude users to turn on Sync automatically, word for word from README.md', async () => {
  const { text } = await get('/install');
  assert.ok(text.includes("If you see <b>Sync automatically</b> next to <b>aidenlab</b>, turn it on. That's how Geenee's updates reach you."));
});
