import { test } from 'node:test';
import assert from 'node:assert/strict';
import { get } from './helpers.js';

test('/ in a browser no longer tells people to paste the line into claude.ai, and points Claude users to /install', async () => {
  const { res, text } = await get('/', { accept: 'text/html,application/xhtml+xml,*/*' });
  assert.match(res.headers.get('Content-Type'), /^text\/html/);
  const intro = text.slice(0, text.indexOf('<hr>'));
  assert.doesNotMatch(intro, /claude\.ai/);
  assert.match(intro, /href="\/install"/);
});

test('/ logs the Accept header of each request', async t => {
  const logged = [];
  t.mock.method(console, 'log', (...args) => logged.push(args.join(' ')));
  await get('/', { accept: 'text/html' });
  await get('/', { accept: 'text/markdown' });
  assert.equal(logged.length, 2);
  assert.match(logged[0], /"accept":"text\/html"/);
  assert.match(logged[1], /"accept":"text\/markdown"/);
});

test('/ still serves the markdown to assistants', async () => {
  const { res, text } = await get('/', { accept: 'text/markdown' });
  assert.match(res.headers.get('Content-Type'), /^text\/markdown/);
  assert.equal(text, '# prompt');
});
