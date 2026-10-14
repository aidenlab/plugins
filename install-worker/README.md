# install-worker

Cloudflare Worker behind **https://geenee-install-dev.3dg.io** (and the older **juicebot-install-dev.3dg.io**, same Worker). It serves `INSTALL-PROMPT.md` from this repository's `main` branch (proxied, cached 5 min) so the one-line setup prompt has a short, stable URL. `/geenee.py` and `/geenee.mjs` serve the skill's CLI scripts (`/juicebot.py` and `/juicebot.mjs` serve the same files for links handed out before the rebrand); `/plugins` redirects to Claude's plugin settings page (`claude.ai/new#settings/customize-plugins`), `/plugin` to the latest `juicebot.plugin` release asset; any other path serves that file from the repo (`/README.md`).

Deploy (from a machine with `wrangler login` on the account that owns `3dg.io`; needed again whenever `wrangler.toml` or `src/` changes, such as when a hostname is added):

```
cd install-worker
npx wrangler deploy              # geenee-install-dev.3dg.io + juicebot-install-dev.3dg.io, main branch
npx wrangler deploy --env dev    # geenee-install-dev.3dg.io + juicebot-install-dev.3dg.io, dev branch
```

Wrangler attaches the custom domains and creates their DNS records. Nothing to redeploy when the markdown changes; it is fetched from GitHub.
