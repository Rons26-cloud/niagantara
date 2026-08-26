# NIAGANTARA Security Audit — 2026-08-26

## Executive summary

The repository was reviewed across the web, dashboard, master, POS, mobile, API,
worker, CI/container, dependency, secret-management, and Supabase migration
surfaces. Three actionable security defects were confirmed and fixed. No known
high-severity dependency advisory or committed secret was detected.

This is a source and local-build audit. It does not certify the live Supabase,
Cloudflare, Railway, Google OAuth, SMTP, DNS, or mobile-store configuration.

## Findings and remediation

### SEC-001 — Cross-branch permission aggregation (High, fixed)

`TenantGuard` combined permissions from every active branch membership. Because
the API's database client uses the Supabase service role, downstream operations
cannot rely on RLS as a second authorization boundary. A permission held in one
branch could consequently authorize a service-role-backed request while another
branch was selected.

Remediation:

- branch permissions now come only from the validated `x-branch-id` membership;
- an unassigned selected branch is rejected for non-owner/non-admin users;
- malformed branch identifiers are rejected before database access;
- all assigned branch IDs remain available only for explicitly scoped read
  filtering;
- a regression test proves that selecting the cashier branch does not load the
  manager role from another branch.

### SEC-002 — Missing or permissive browser CSP (Medium, fixed)

Dashboard, master, and POS deployments lacked a Content Security Policy. The
public website allowed `unsafe-eval` and `unsafe-inline` scripts. This increased
the impact of a future injection bug, particularly because browser sessions are
currently stored in `sessionStorage`.

Remediation:

- CSP added to dashboard, master, and POS entry documents;
- `script-src` is restricted to same-origin scripts;
- `unsafe-eval` and inline-script permission were removed from the website;
- `object-src 'none'`, `frame-ancestors 'none'`, and restrictive base/form rules
  were added.

Inline styles remain allowed because the current React UI uses inline style
attributes. Removing that exception requires a separate UI refactor.

### SEC-003 — Mobile 4xx responses treated as success (Medium, fixed)

The Dio client accepted every response below HTTP 500. A 401 therefore bypassed
the error handler intended to erase an expired or revoked local session. The
documented option to omit tenant headers was also ignored.

Remediation:

- only HTTP 2xx responses are now accepted as successful;
- 401 responses enter the existing secure-session cleanup path;
- `withTenantHeaders: false` now actually suppresses company and branch headers.

## Positive controls observed

- Supabase service-role and Google credentials are server/worker-only variables.
- Public-schema tables in reviewed migrations enable RLS; migration validation
  passes for all 22 migrations.
- privileged functions use constrained grants, empty `search_path`, and
  server-only execution patterns.
- API bearer tokens are validated through Supabase `getUser`; platform roles are
  read from `app_metadata`, not user-editable metadata.
- API responses use strict CORS, request/body/time limits, security headers,
  request IDs, rate limits, and redacted exception handling.
- Google refresh tokens use AES-256-GCM; OAuth state is random, hashed, expiring,
  and single-use.
- spreadsheet values and formula templates have injection defenses.
- containers run as a non-root user and CI uses a frozen lockfile.

## Verification evidence

- dependency audit: no known vulnerabilities;
- secret scan: PASS, 502 candidate files;
- migration validation: PASS, 23 files;
- lint: PASS;
- TypeScript typecheck: PASS;
- tests: PASS, 80 API and 4 worker tests plus package/app checks;
- production builds: PASS for API, worker, web, dashboard, master, POS, and shared
  packages;
- `git diff --check`: PASS.

## Residual risks and operational actions

1. Browser access/refresh tokens remain in `sessionStorage`. CSP reduces exposure,
   but a same-origin XSS could still steal them. For stronger assurance, migrate
   browser authentication to server-issued `Secure`, `HttpOnly`, `SameSite`
   cookies with CSRF protection.
2. API rate limiting is process-local. Multi-instance production deployments
   should use a shared limiter (for example Redis) and an edge/WAF limit.
3. Run Supabase Security Advisor/database lint against the deployed project and
   verify Auth redirect allowlists, JWT expiry, leaked-password protection, MFA,
   RLS/grants, backups, and point-in-time recovery in the dashboard.
4. Verify the deployed response headers rather than assuming `_headers` is active
   on every hosting platform.
5. Rotate production secrets on schedule and immediately after suspected exposure;
   keep dependency and container-image scanning in CI.

## Scope exclusions

No penetration test, authenticated live API fuzzing, cloud-account inspection,
production database mutation, SAST vendor scanner, DAST scan, or mobile binary
reverse engineering was performed. Existing unrelated dashboard/navigation work
in the working tree was preserved and excluded from these remediation changes.
