# Deployment

- `niagantara.com` and `www`: Cloudflare static `apps/web/dist`.
- `app`, `master`, `pos`: matching Cloudflare static app `dist` directories.
- `api`: `Dockerfile.api` on a Node 22-compatible container host, proxied through Cloudflare.
- sheet worker: `Dockerfile.worker` as a private independent Node service with no inbound public route.

The Nest/Fastify API and long-running queue worker are not Cloudflare Workers targets. They rely on Node.js and long-lived process semantics. Cloudflare can provide DNS, TLS, proxying, WAF, CDN, and edge rate controls. Promote only immutable artifacts whose CI passed. Production deployment, DNS, and OAuth publication remain manual approvals.

Set `TRUST_PROXY=true` only when exactly one controlled reverse proxy sits in front of the API. The runtime trusts one proxy hop; restrict the origin firewall to Cloudflare or the selected load balancer and do not expose the container origin directly.
