# Production migration flow

1. Confirm the target project ref and backup.
2. Generate with `supabase migration new <name>`; never edit an applied migration.
3. Review SQL, RLS, grants, indexes, locks, and forward compatibility; run static validation and database lint/advisors.
4. Dry-run in staging, test, schedule locking changes, and apply once through an approved operator.
5. Verify history, readiness, RLS, and critical queries.

Prefer forward fixes. Destructive rollback requires explicit disaster-recovery approval.
