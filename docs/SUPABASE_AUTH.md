# Supabase Auth production checklist

Before launch, verify in the production project: Site URL `https://app.niagantara.com`; allowed redirect URLs for the dashboard recovery routes; custom SMTP sender/domain with SPF, DKIM, and DMARC; reviewed confirmation/recovery templates; appropriate email and request rate limits; leaked-password protection and password policy; expected JWT/session lifetime and refresh behavior; disabled unused providers; MFA decision; CAPTCHA/abuse controls where appropriate; and security-event monitoring.

Use `app_metadata` for trusted platform roles. Never authorize from user-editable metadata. Changing these external settings requires an approved production change window.
