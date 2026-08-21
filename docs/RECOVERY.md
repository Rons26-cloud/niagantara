# Disaster recovery runbook

- Database unavailable: stop writes/worker, confirm provider status, restore into isolation first, then verify migrations and RLS before cutover.
- Google revoked: keep Supabase running, reconnect through consent, retry failed jobs.
- Workbook lost: create a controlled replacement report and rebuild from Supabase.
- Worker failure: avoid duplicate unhealthy replicas, inspect backlog/dead jobs, restart one healthy worker, use Recovery Center.
- API regression: roll back the immutable image; forward-fix schema incompatibility.
- Frontend regression: restore the prior static artifact and purge only affected HTML cache.

Record incident time, release SHA, affected tenants, actions, evidence, and follow-up without secrets.
