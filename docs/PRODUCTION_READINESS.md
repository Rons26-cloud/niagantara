# Phase 6 production readiness

Phase 6 prepares deployment but does not deploy or publish NIAGANTARA.

## Verified scope

- environment, release, domain, CORS, proxy, Supabase, Google, worker, SMTP and logging configuration contracts
- Node API health/readiness, safe errors, structured logs, request IDs, limits, security headers, rate limits and graceful signals
- independent durable Sheets worker with leases, idempotency, retry/backoff, pagination, quota handling and graceful signals
- Cloudflare-ready static outputs with SPA fallbacks and cache/security policies
- non-root API/worker containers, CI, secret scanning and migration safety checks
- tenant/master guard tests, migration parity, database lint, dependency audit and read-only API/data smoke tests

Notification and mobile remain intentional placeholders. Their production contracts are documented; no notification runtime or APK is claimed as built.

## Human go-live actions

1. Provision Node-compatible API and separate always-on worker hosts.
2. Configure production secrets in provider secret stores; never upload `.env`.
3. Configure Cloudflare projects, DNS, TLS, WAF/rate limits and an origin firewall.
4. Configure Supabase Auth production URLs, SMTP, templates and security controls.
5. Add the production Google callback, publish legal URLs and complete any required Google verification.
6. Verify a backup, review migrations, run CI, stage, smoke test, approve and promote.

See the other runbooks in this directory for exact commands and checklists.
