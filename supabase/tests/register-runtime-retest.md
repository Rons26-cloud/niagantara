# Register runtime retest

This is the final Phase 1 gate. Run it only after the Supabase Auth email rate limit has recovered. A provisioning-only test does not replace this test.

## Preconditions

- Use only the approved NIAGANTARA V2 project `ysoctjwomlzeimuoygen`.
- Confirm the API health endpoint is passing and migrations 001-013 are applied.
- Keep `.env` local and ignored. Never paste or log database, service-role, session, or access-token values.
- Use a unique inbox that can receive the confirmation email. Do not use aliases that Supabase may normalize to an earlier address.
- Make exactly one register request. If it returns HTTP 429 or `over_email_send_rate_limit`, stop and wait for recovery; do not loop.

## Controlled register request

1. Generate a unique email and a temporary password of at least 12 characters locally.
2. Send one `POST /api/v1/auth/register` request with `email`, `password`, `companyName`, and `fullName`.
3. Require `provisioningStatus = completed`, a non-null Auth user, and non-null company, store, and branch objects.
4. Record IDs in memory only. Do not write credentials or tokens to logs or repository files.

## Database verification

Using a trusted administrative database session, verify by the returned user ID that:

- `profiles` contains exactly one matching profile.
- `companies` contains the provisioned company with `created_by` equal to the user ID.
- `company_members` contains one active membership with `role_key = 'owner'`.
- `stores` contains the provisioned main store for that company.
- `branches` contains the provisioned main branch and its store/company relationship is consistent.
- `audit_logs` contains the `auth.register` event for that user and company.

Return only PASS/FAIL and row counts. Never print connection strings, passwords, service-role keys, or tokens.

## Email confirmation verification

- Confirm the register response reports the expected `emailConfirmationRequired` state.
- If confirmation is required, use the received email link once and verify a normal login succeeds afterward.
- If the project is configured to auto-confirm, verify the register response includes a session and normal login succeeds.
- Do not disable email confirmation to make this test pass.

## Completion and cleanup

Phase 1 is complete only when the real register request and every verification above pass. After evidence is recorded, delete the test company through the trusted administrative path, then delete the Auth test user. Confirm no test rows remain.

## Separate provisioning-only strategy

For repeatable database/RLS testing, a test runner may create a confirmed ephemeral Auth user through the Admin API, call the production `provision_company()` RPC, run all data checks with that user's authenticated access token, and remove all test data afterward. This runner must execute only in an explicitly gated test environment, obtain server credentials from ignored environment variables, never expose them to clients or logs, and never be shipped or enabled in production. It validates provisioning and RLS, not the public register flow, and cannot close the final Phase 1 register gate.
