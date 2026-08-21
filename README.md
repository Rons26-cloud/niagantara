# NIAGANTARA V2

NIAGANTARA is a secure, multi-tenant business control platform for operational dashboards, POS, inventory, finance, reporting, and integrations.

## Development

Requirements: Node.js 20+ and Corepack-enabled pnpm.

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm build
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
```

Production preparation is documented in `docs/DEPLOYMENT.md`. Supabase remains the source of truth; Google Sheets is a tenant-scoped reporting layer. Static web applications can run at the edge, while the Nest API and queue worker require Node-compatible process hosting.
