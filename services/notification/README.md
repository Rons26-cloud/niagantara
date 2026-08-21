# Notification service assessment

This directory is a placeholder and is not part of the production runtime. Supabase Auth currently owns authentication email delivery. Configure custom SMTP in Supabase using provider secret storage; do not deploy an empty notification service. A future worker requires a durable queue, bounded retries, idempotency, redacted structured logs, and provider timeouts before activation.
