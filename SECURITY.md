# Security

- Supabase PostgreSQL is the source of truth; all tenant data is protected by RLS.
- Never expose service-role keys, database passwords, OAuth client secrets, SMTP credentials, or payment secrets to browsers or APKs.
- Server requests must derive company, store, and branch access from the authenticated membership, not untrusted IDs from the client.
- Security-sensitive mutations will be validated, authorized, transactional, and audited.
- Copy `.env.example` to a local environment file; never commit actual secrets.
