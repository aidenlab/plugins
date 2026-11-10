import worker from '../src/index.js';

export const README = `# Aiden Lab plugins

### Claude (desktop app, claude.ai, Cowork): click through once

<!-- claude-steps:start -->
Follow these steps to install Geenee.

1. Go to **Customize → Plugins → +Add → Add marketplace → Add from a repository**. Enter this URL: \`aidenlab/plugins\`
2. Click **Sync**
3. You will be on the **Discover** tab. Click **Add** (Not **+Add**).
4. Select the **Connectors** tab. **Connect → Continue → Add**

**Things to know:**
- You need a paid plan.
- If you see **Sync automatically** next to **aidenlab**, turn it on. That's how Geenee's updates reach you.
- If you still have the old \`juicebot\` plugin, or a connection to \`juicebot-mcp.3dg.io\` or \`geenee-dev.3dg.io\`, remove it. Otherwise you'll get duplicate tools.

**To check it worked:** start a new chat and ask me to open Geenee.
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
