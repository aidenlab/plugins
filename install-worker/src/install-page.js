/**
 * The install page: what a person reads in their own browser at /install.
 *
 * Built on each request from README.md's claude-steps block, so the Claude steps
 * have one copy, and no assistant sits between the steps and the person to
 * reword them. Only the numbered steps, the paid-plan note and the Sync automatically
 * note are taken from the block; its juicebot cleanup note and Claude-voiced check stay behind.
 */

export const ONE_LINE = 'Set up Geenee for me: fetch https://geenee-install.3dg.io and follow its instructions for the app you are running in.';
const ISSUES = 'https://github.com/aidenlab/plugins/issues';

export const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The few inline forms the steps use: **bold**, `code`, [text](url). */
function inline(md) {
  return esc(md)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

/**
 * The parts of README.md's claude-steps block this page shows, or null when
 * the block is missing or has no numbered steps or no paid-plan note.
 */
export function claudeSteps(readme) {
  const block = /<!-- claude-steps:start -->([\s\S]*?)<!-- claude-steps:end -->/.exec(readme)?.[1];
  if (!block) return null;
  const NUMBERED = /^\d+\. /;
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  const intro = lines[0] && !NUMBERED.test(lines[0]) ? lines[0] : null;
  const steps = lines.filter(l => NUMBERED.test(l)).map(l => l.replace(NUMBERED, ''));
  const paidPlan = lines.find(l => /^- .*paid plan/i.test(l))?.slice(2);
  const syncAutomatically = lines.find(l => /^- .*Sync automatically/.test(l))?.slice(2) ?? null;
  if (steps.length === 0 || !paidPlan) return null;
  return { intro, steps, paidPlan, syncAutomatically };
}

const copyable = text => `<div class="cmd"><pre>${esc(text)}</pre></div>`;

export function installPage({ intro, steps, paidPlan, syncAutomatically }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Install Geenee</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">
<style>
/* The tokens of docs/install.html and geenee's pages. */
:root {
  --bg: #f5f6f4; --box: #ffffff; --fg: #1b1d1c; --muted: #636966; --rule: #cdd2ce; --accent: #b8231a;
  --serif: "Source Serif 4", "Iowan Old Style", Georgia, serif;
  --sans: "IBM Plex Sans", "Helvetica Neue", Arial, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #151716; --box: #1e2120; --fg: #e5e7e4; --muted: #9aa19c; --rule: #3b403d; --accent: #ff7566; color-scheme: dark; }
}
body { margin: 0; background: var(--bg); color: var(--fg); font-family: var(--serif); font-size: 1.0625rem; line-height: 1.6; }
.page { max-width: 38rem; margin-inline: auto; padding: 3.5rem max(16px, env(safe-area-inset-right, 0px)) 5rem max(16px, env(safe-area-inset-left, 0px)); }
h1 { font-family: var(--sans); font-weight: 600; font-size: 2rem; line-height: 1.15; letter-spacing: -0.01em; margin: 0 0 0.75rem; }
.lede { font-size: 1.2rem; line-height: 1.5; color: var(--muted); margin: 0 0 2.5rem; }
h2 { font-family: var(--sans); font-weight: 600; font-size: 1.0625rem; margin: 3rem 0 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--fg); }
.for { font-family: var(--sans); font-weight: 400; color: var(--muted); }
p { margin: 0 0 1rem; }
ol { margin: 0 0 1rem; padding-left: 1.4rem; }
li { margin-bottom: 0.4rem; }
code { font-family: var(--mono); font-size: 0.84em; }
b { font-family: var(--sans); font-size: 0.92em; font-weight: 600; }
a { color: inherit; text-decoration-color: var(--rule); text-underline-offset: 0.15em; }
a:hover { text-decoration-color: currentColor; }
a:focus-visible, button:focus-visible { outline: 2px solid var(--fg); outline-offset: 2px; }
.note { font-family: var(--sans); font-size: 0.85rem; color: var(--muted); }
.cmd { position: relative; margin: 0.75rem 0 1.25rem; border-left: 2px solid var(--accent); background: var(--box); }
.cmd pre { margin: 0; padding: 0.7rem 4.5rem 0.7rem 0.9rem; font-family: var(--serif); font-size: 1rem; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
.cmd button { position: absolute; top: 0.45rem; right: 0.45rem; font-family: var(--sans); font-size: 0.72rem; color: var(--muted); background: none; border: 1px solid var(--rule); border-radius: 2px; padding: 0.15rem 0.5rem; cursor: pointer; }
.cmd button:hover { color: var(--fg); border-color: var(--fg); }
</style>
</head>
<body>
<main class="page">

<h1>Install Geenee</h1>
<p class="lede">Geenee lets you drive three genome viewers by chatting: the IGV genome browser, the Juicebox Hi-C viewer and the Spacewalk 3D chromatin viewer, side by side on one web page.</p>

<h2>Claude <span class="for">claude.ai, the desktop app, Cowork</span></h2>
<p>ChatGPT and Claude Code install Geenee from one line you paste in. Claude’s apps can’t: adding a plugin there is an account setting, so you click through these steps yourself, once. They cover every Claude app on your account.</p>
<p class="note">${inline(paidPlan)}${syncAutomatically ? `<br>${inline(syncAutomatically)}` : ''}</p>
${intro ? `<p>${inline(intro)}</p>\n` : ''}<ol>
${steps.map(s => `  <li>${inline(s)}</li>`).join('\n')}
</ol>

<h2>ChatGPT desktop</h2>
<ol>
  <li>Open the ChatGPT desktop app and click <b>Codex</b>.</li>
  <li>Paste this line:</li>
</ol>
${copyable(ONE_LINE)}
<ol start="3">
  <li>Each time Codex asks for permission, click <b>Approve</b>.</li>
</ol>
<p class="note">Plain ChatGPT chat can’t install Geenee; it has to be Codex.</p>

<h2>Claude Code or Codex</h2>
<p>Paste this line. Click <b>Approve</b> (or <b>Allow</b>) when asked.</p>
${copyable(ONE_LINE)}

<h2>If a step fails</h2>
<p>Tell us at <a href="${ISSUES}">github.com/aidenlab/plugins/issues</a>, with a screenshot of where it went wrong.</p>

</main>
<script>
for (const block of document.querySelectorAll('.cmd')) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Copy';
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(block.querySelector('pre').textContent);
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = 'Copy'; }, 1500);
  });
  block.append(button);
}
</script>
</body>
</html>
`;
}
