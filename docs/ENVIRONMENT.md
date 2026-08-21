# Environment architecture

Use separate secret stores and Supabase projects for `development`, `staging`, and `production`. `APP_ENV` controls runtime policy; `NODE_ENV` controls dependency/runtime behavior. `APP_VERSION` and `BUILD_SHA` identify releases.

Browser builds may receive only `VITE_API_URL`, `VITE_SUPABASE_URL`, the publishable/anon key, and public version metadata. Service-role, database, SMTP, Google client-secret, token-encryption, and CLI credentials are server/operator-only.

Production requires HTTPS origins in `CORS_ORIGINS`, `TRUST_PROXY=true` behind the controlled reverse proxy, and the production Google callback. Copy `.env.example` into an untracked local or provider secret store; never commit environment files.
