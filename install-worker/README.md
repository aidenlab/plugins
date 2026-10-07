# install-worker

Cloudflare Worker behind **https://juicebot-install.3dg.io**. It serves `INSTALL-PROMPT.md` from this repository's `main` branch (proxied, cached 5 min) so the one-line setup prompt has a short, stable URL. `/juicebot.py` and `/juicebot.mjs` serve the skill's CLI scripts; `/plugins` redirects to Claude's plugin settings page (`claude.ai/new#settings/customize-plugins`), `/plugin` to the latest `juicebot.plugin` release asset; any other path serves that file from the repo (`/README.md`).

Deploy (once, from a machine with `wrangler login` on the account that owns `3dg.io`):

```
cd install-worker
npx wrangler deploy
```

Nothing to redeploy when the markdown changes; it is fetched from GitHub.
