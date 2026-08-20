# Supabase Auth Custom SMTP

NIAGANTARA remains provider-agnostic: Supabase Auth owns confirmation and recovery email delivery. Application business logic must continue to call Supabase Auth and must not connect directly to an SMTP provider.

## Server-side configuration contract

Keep these values only in a local secret store, CI secret store, or deployment platform secret store:

| Environment variable | Purpose |
| --- | --- |
| `SMTP_HOST` | Provider SMTP hostname |
| `SMTP_PORT` | Provider SMTP port (1-65535) |
| `SMTP_USER` | SMTP credential username |
| `SMTP_PASSWORD` | SMTP credential secret |
| `SMTP_FROM_EMAIL` | Verified sender address; recommended `no-reply@niagantara.com` |
| `SMTP_FROM_NAME` | Sender display name; use `NIAGANTARA` |
| `SMTP_SECURE` | `true` for implicit TLS or `false` for STARTTLS/plain negotiation, according to the provider |

These variables are readiness metadata for operators. Hosted Supabase does not automatically read the NIAGANTARA deployment environment. Copy the matching values into the approved V2 project in **Supabase Dashboard > Authentication > SMTP Settings**:

- Enable Custom SMTP.
- **Sender email** <- `SMTP_FROM_EMAIL`
- **Sender name** <- `SMTP_FROM_NAME`
- **Host** <- `SMTP_HOST`
- **Port number** <- `SMTP_PORT`
- **Username** <- `SMTP_USER`
- **Password** <- `SMTP_PASSWORD`

Save the settings only in the approved project. Keep email confirmation enabled. Confirm that Auth rate limits are appropriate for the provider before one controlled register retest.

## Provider types

- Free-tier transactional SMTP: use its verified sending domain, SMTP credentials, port, and TLS mode. Review free-tier quotas and sandbox recipient restrictions.
- Google Workspace SMTP: use the Workspace SMTP relay or authenticated SMTP settings approved by the organization. Use an app password or managed relay credential where required; never a personal account password.
- Future production provider: replace only environment and Dashboard values. No Auth business-logic change should be required.

Configure SPF, DKIM, and DMARC for `niagantara.com`. Separate authentication email reputation from marketing email. Rotate credentials through the provider and secret stores, then update Supabase Dashboard.

## Email identity and templates

- Sender name: `NIAGANTARA`
- Recommended sender: `no-reply@niagantara.com`
- Planned templates: email confirmation, forgot-password OTP/recovery, password reset, and security alert.

Template links and OTP values must use Supabase template variables. Never put secrets, access tokens, passwords, or user-controlled HTML into templates. The required flow remains:

`Supabase Auth signUp -> email confirmation -> provisioning -> profile/company/store/branch -> audit`

Do not auto-confirm users, bypass Supabase Auth, or substitute a fake SMTP sender to close Phase 1.

## Safe readiness check

Set the variables in the current server shell or secret-enabled CI job, then run:

```sh
corepack pnpm smtp:check
```

The checker prints only YES/NO readiness fields. It never prints `SMTP_PASSWORD` or any other configuration value. `CUSTOM_SMTP_READY = YES` confirms local configuration shape only; also verify the same settings are saved and active in Supabase Dashboard before the single real register retest.

## Manual password-recovery OTP template

In the approved Supabase V2 project, open **Authentication > Email Templates > Reset Password**. Replace the clickable recovery URL with a manual code that uses the exact Supabase template variable `{{ .Token }}`. Do not use `{{ .ConfirmationURL }}` for this recovery flow.

```html
<h2>Kode pemulihan password NIAGANTARA</h2>
<p>Masukkan kode berikut pada halaman verifikasi NIAGANTARA:</p>
<p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">{{ .Token }}</p>
<p>Kode ini bersifat rahasia dan memiliki masa berlaku terbatas.</p>
```

The application flow is `/auth/forgot-password` -> recovery email -> `/auth/verify-recovery` -> `/auth/reset-password`. OTP verification uses Supabase Auth with recovery type. Password updates require the authenticated session returned by that verification. The application never accepts a browser-provided user ID and never uses the service-role client to bypass recovery verification.
