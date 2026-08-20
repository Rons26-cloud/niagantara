# Security

## Supabase Auth SMTP secrets

Custom SMTP credentials are server/operator secrets. Store `SMTP_PASSWORD` and related SMTP configuration in local, CI, or deployment secret stores and in the approved Supabase project's Authentication SMTP settings. Never use a `VITE_`, frontend, mobile, log, error response, screenshot, or committed file for these values.

Use a verified sender domain with SPF, DKIM, and DMARC. Rotate compromised credentials at the provider, deployment secret store, and Supabase Dashboard. Preserve Supabase email confirmation and recovery controls; SMTP availability must never be replaced with Auth bypasses.

- Supabase PostgreSQL is the source of truth; all tenant data is protected by RLS.
- Never expose service-role keys, database passwords, OAuth client secrets, SMTP credentials, or payment secrets to browsers or APKs.
- Server requests must derive company, store, and branch access from the authenticated membership, not untrusted IDs from the client.
- Security-sensitive mutations will be validated, authorized, transactional, and audited.
- Copy `.env.example` to a local environment file; never commit actual secrets.
