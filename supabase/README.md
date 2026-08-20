# Supabase Phase 1 foundation

This directory is local-only until a new, empty NIAGANTARA V2 project is explicitly approved. Never link or push these migrations to the legacy project containing `businesses`, `business_members`, or `warehouses`.

## Migration and privilege model

- Migrations `001` through `013` create the profile, tenant, RBAC, audit, and provisioning foundation in dependency order.
- `private.is_company_member()` and `private.has_company_role()` are `SECURITY DEFINER` RLS helpers in a non-exposed schema. Their `search_path` is empty, all object references are schema-qualified, PUBLIC execution is revoked, and only `authenticated` plus `service_role` can execute them.
- `public.provision_company()` remains discoverable as an RPC but is server-only. PUBLIC, `anon`, and `authenticated` execution are revoked; only `service_role` is granted execution.
- `provision_company()` accepts a user id only from the trusted API service-role client, verifies that the Auth user exists, and atomically creates or repairs the PostgreSQL registration portion: profile, company, owner membership, main store, main branch, and audit event.
- Supabase Auth user creation is outside the PostgreSQL transaction. The API performs compensating Auth-user deletion if database provisioning fails and reports when administrative recovery is required.

## Runtime status

`supabase/tests/rls_isolation.test.sql` is executable pgTAP structure for the future V2 database. It must not be reported as passing until migrations are applied to the approved empty V2 project and `supabase test db` succeeds there.

Current status: `RLS_EXECUTION=PENDING_SUPABASE_V2`.
