# install-worker

Cloudflare Worker behind **https://geenee-install.3dg.io**. It serves `INSTALL-PROMPT.md` from this repository's `main` branch (proxied, cached 5 min) so the one-line setup prompt has a short, stable URL. `/install` is the page for people: built on each request from the `claude-steps` block in the root `README.md`, it shows the Claude steps word for word, then the one line for ChatGPT desktop, Claude Code and Codex. `/geenee.py` and `/geenee.mjs` serve the skill's CLI scripts; `/plugins` redirects to Claude's plugin settings page (`claude.ai/customize/plugins`), `/plugin` to the latest `geenee.plugin` release asset; any other path serves that file from the repo (`/README.md`).

Deploy (from a machine with `wrangler login` on the account that owns `3dg.io`; needed again whenever `wrangler.toml` or `src/` changes):

```
cd install-worker
npx wrangler deploy
```

Wrangler attaches the custom domain and creates its DNS record. Nothing to redeploy when the markdown changes; it is fetched from GitHub.

Tests: `npm test` (Node 20+, no dependencies).

Requests to `/` log their `Accept` and `User-Agent` headers; read them in the Cloudflare dashboard under the worker's **Logs**, or live with `npx wrangler tail`.
