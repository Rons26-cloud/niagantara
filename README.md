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

Phase 0 establishes the monorepo and application foundations. Product modules are intentionally added incrementally behind authenticated, tenant-aware boundaries.
