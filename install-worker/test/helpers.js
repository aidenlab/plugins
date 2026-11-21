import worker from '../src/index.js';

export const README = `# Aiden Lab plugins

### Claude (desktop app, claude.ai, Cowork): click through once

<!-- claude-steps:start -->
Follow these steps to install Geenee.

1. In the side panel, click **Plugins**, then **Add → Add marketplace → Add from a repository**.
2. In **URL**, type \`aidenlab/plugins\`. Leave **Sync automatically** on and click **Sync**.
3. In the **Search** box, type \`geenee\` and open **Geenee**. Search is the only way to reach it.
4. Click **Add**.
5. Under **Connectors**, click **Connect** next to Geenee, then **Continue**. The window says "Add custom connector"; that's expected.
6. Leave **No sign-in** selected (marked "Detected") and click **Add**.

**Things to know:**
- You need a paid plan.
- Keep **Sync automatically** on for the marketplace. That's how Geenee's updates reach you.
- If Geenee disappears after an update: Plugins → search \`geenee\` → Add, then Connect again.
- If you still have the old \`juicebot\` plugin, or a connection to \`juicebot-mcp.3dg.io\` or \`geenee-dev.3dg.io\`, remove it. Otherwise you'll get duplicate tools.

**To check it worked:** start a new chat and ask me to open Geenee.

Last checked in Claude desktop on 2026-11-21
<!-- claude-steps:end -->
`;

/** Calls the worker with GitHub stubbed: `files` maps repo paths to their text. */
export async function get(path, { files = { 'README.md': README, 'INSTALL-PROMPT.md': '# prompt' }, accept = '*/*' } = {}) {
  const requested = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    const file = String(url).replace(/^https:\/\/raw\.githubusercontent\.com\/aidenlab\/plugins\/main\//, '');
    requested.push(file);
    return file in files ? new Response(files[file]) : new Response('nope', { status: 404 });
  };
  try {
    const res = await worker.fetch(new Request(`https://geenee-install.3dg.io${path}`, { headers: { Accept: accept } }), { BRANCH: 'main' });
    return { res, text: await res.text(), requested };
  } finally {
    globalThis.fetch = realFetch;
  }
}
