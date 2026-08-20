# Infrastructure

Deployment, reverse proxy, monitoring, and environment-specific configuration will be added after the foundation is validated.

## Supabase Auth email deployment

Before an Auth release, provision the seven `SMTP_*` variables in the server/CI secret environment, run `corepack pnpm smtp:check`, and enter the same provider settings in **Supabase Dashboard > Authentication > SMTP Settings** for the approved project. Hosted Supabase sends Auth email; NIAGANTARA services do not receive or expose the SMTP password.

Deployment approval requires a verified sender domain, documented provider quota/rate limits, TLS mode matching the selected port, and `CUSTOM_SMTP_READY = YES`. See `docs/custom-smtp.md`. Changing providers is an operational configuration change and must not require changes to Auth business logic.
