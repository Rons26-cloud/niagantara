# Observability

The API emits structured request logs with request ID, method, path, status, duration, service, environment, version, and build SHA. Errors emit a provider-neutral sanitized event. The worker emits lifecycle, batch, and failure events. Secret values, request bodies, authorization headers, OTPs, and tokens are excluded.

Monitor `/api/v1/health` for liveness and `/api/v1/health/readiness` for database readiness. Alert on 5xx/rate-limit changes, security events, authentication anomalies, queue backlog age/count, retry/dead jobs, sync error codes, worker restarts, and audit write failures. These JSON streams can later feed a free or paid provider without coupling application logic to it.
