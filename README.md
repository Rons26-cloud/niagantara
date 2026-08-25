# NIAGANTARA

Multi-tenant business platform — operational dashboards, POS, inventory, finance, reporting, and Google Sheets sync.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 7, TypeScript |
| API | NestJS 11, Fastify, Supabase JS |
| Database | Supabase PostgreSQL (RLS) |
| Auth | Supabase Auth + custom SMTP |
| Queue | Node worker (Supabase Realtime) |
| Monorepo | pnpm workspaces, Turborepo |
| Hosting | Cloudflare Pages, Railway |

## Repository layout

```
apps/
  web         Landing site & marketing pages (port 5173)
  dashboard   Company admin panel (port 5174)
  master      Platform-level admin (port 5175)
  pos         Point of sale / cashier (port 5176)
  mobile      Flutter app (WIP)

services/
  api         NestJS REST API (port 4000)
  worker      Background job processor
  notification Email/notification service

packages/
  ui          Shared components, theme, i18n
  pos-core    POS business logic
  types       Shared TypeScript types
  config      Shared config (tsconfig, etc.)
  permissions Permission definitions
  auth        Auth utilities
  database    DB helpers
  security    Security utilities
  analytics   Analytics helpers
  validation  Validation schemas
  utils       General utilities
```

## Prerequisites

- Node.js 20+
- pnpm (via Corepack)
- Supabase project

## Getting started

```bash
# Install dependencies
corepack pnpm install

# Copy environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start all services in dev mode
corepack pnpm dev
```

Or run individual apps:

```bash
corepack pnpm dev:web        # http://localhost:5173
corepack pnpm dev:dashboard  # http://localhost:5174
corepack pnpm dev:master     # http://localhost:5175
corepack pnpm dev:pos        # http://localhost:5176
corepack pnpm dev:api        # http://localhost:4000/api/v1
corepack pnpm dev:worker
```

## Build and verify

```bash
corepack pnpm build       # Build all packages and apps
corepack pnpm lint        # Type-check across workspaces
corepack pnpm typecheck   # Same as lint (tsc --noEmit)
corepack pnpm test        # Run all tests
corepack pnpm format      # Prettier
```

## Environment

The `.env` file is server-side only and must never be committed. See `.env.example` for the full template. Key variables:

- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — API and worker only
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — bundled into frontends
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Sheets integration
- `SMTP_*` — Supabase Auth custom SMTP

All `VITE_` prefixed variables are public. Everything else is server-only.

## Deployment

- **Web**: Cloudflare Pages — `apps/web/dist`
- **Dashboard, POS, Master**: Cloudflare Pages — respective `apps/*/dist`
- **API**: Docker (`Dockerfile.api`) on Node 22, Railway or similar
- **Worker**: Docker (`Dockerfile.worker`), no inbound route

Details in `docs/DEPLOYMENT.md` and `docs/CLOUDFLARE_DEPLOYMENT.md`.

## Documentation

All operational docs live in `docs/`:

- `DEPLOYMENT.md` — hosting and deployment
- `CLOUDFLARE_DEPLOYMENT.md` — Cloudflare Pages setup
- `ENVIRONMENT.md` — environment variables reference
- `SUPABASE_AUTH.md` — auth and SMTP configuration
- `GOOGLE_OAUTH_PRODUCTION.md` — Google Sheets OAuth setup
- `PRODUCTION_READINESS.md` — pre-launch checklist
- `MIGRATIONS.md` — database migration workflow
- `OBSERVABILITY.md` — logging and monitoring
- `RECOVERY.md` — incident response
- `SECURITY.md` — security policies
- `BRAND_ASSETS.md` — logo and branding

## Security

See `SECURITY.md`. Never commit secrets. The `.env` file is gitignored. Use `.env.example` as reference.
