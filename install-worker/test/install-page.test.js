import { test } from 'node:test';
import assert from 'node:assert/strict';
import { get } from './helpers.js';

test('/install serves an HTML page built from README.md on main', async () => {
  const { res, text, requested } = await get('/install');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type'), /^text\/html/);
  assert.deepEqual(requested, ['README.md']);
  assert.match(text, /click <b>Sync<\/b>\.<\/li>/);
});

test('/install gives the six Claude steps word for word, and the paid-plan note', async () => {
  const { text } = await get('/install');
  for (const step of [
    '<li>In the side panel, click <b>Plugins</b>, then <b>Add → Add marketplace → Add from a repository</b>.</li>',
    '<li>In <b>URL</b>, type <code>aidenlab/plugins</code>. Leave <b>Sync automatically</b> on and click <b>Sync</b>.</li>',
    '<li>In the <b>Search</b> box, type <code>geenee</code> and open <b>Geenee</b>. Search is the only way to reach it.</li>',
    '<li>Click <b>Add</b>.</li>',
    '<li>Under <b>Connectors</b>, click <b>Connect</b> next to Geenee, then <b>Continue</b>. The window says &quot;Add custom connector&quot;; that\'s expected.</li>',
    '<li>Leave <b>No sign-in</b> selected (marked &quot;Detected&quot;) and click <b>Add</b>.</li>'
  ]) assert.ok(text.includes(step), `missing step: ${step}`);
  assert.match(text, /You need a paid plan\./);
});

test('/install says when the Claude steps were last checked, after the steps', async () => {
  const { text } = await get('/install');
  const at = text.indexOf('Last checked in Claude desktop on 2026-11-21');
  assert.ok(at > text.indexOf('No sign-in'), 'last-checked line missing or before the steps');
  assert.ok(at < text.search(/<h2[^>]*>ChatGPT desktop\b/), 'last-checked line outside the Claude section');
});

test('/install tells Claude users how to get Geenee back if an update removes it', async () => {
  const { text } = await get('/install');
  assert.ok(text.includes('If Geenee disappears after an update: Plugins → search <code>geenee</code> → Add, then Connect again.'));
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
  assert.equal((text.match(/<li>/g) || []).length >= 6, true);
  assert.match(text, /You need a paid plan\./);
  assert.match(text, /Last checked in Claude desktop on \d{4}-\d{2}-\d{2}/);
  assert.match(text, /If Geenee disappears after an update/);
});

test('/install tells Claude users to turn on Sync automatically, word for word from README.md', async () => {
  const { text } = await get('/install');
  assert.ok(text.includes("Keep <b>Sync automatically</b> on for the marketplace. That's how Geenee's updates reach you."));
});
