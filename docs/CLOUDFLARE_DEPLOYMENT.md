# Cloudflare frontend preparation

Create four Pages projects using Node 22 and pnpm 11.22.0. Build with `corepack pnpm --filter @niagantara/<web|dashboard|master|pos> build`; publish `apps/<app>/dist`. Configure `VITE_API_URL=https://api.niagantara.com/api/v1` and public release metadata. Web app is currently live at `https://niagantara-web.pages.dev/`.

Committed `_redirects` provides SPA fallback and `_headers` prevents HTML caching while caching hashed assets immutably. Attach custom domains only after approval. Recommended DNS is proxied CNAME records for `www`, `app`, `master`, `pos`, and `api`, plus the provider-prescribed apex record; actual targets must come from selected hosts and are intentionally not guessed.
