# Security Test Plan

Reusable test cases, organized by area. Where practical, these are written as automatable integration tests (the backend already has a test setup per `CLAUDE.md`'s "npm test" convention). Tests referencing specific findings are marked so they double as regression tests once fixes ship.

## Authentication

| # | Test | Expected result |
|---|---|---|
| A1 | Register with a weak password (< 8 chars, no uppercase/number) | 422, matches `authSchemas.js` rules |
| A2 | Register with an already-registered email | Duplicate-email error, no account created, no user-existence leak beyond the standard error |
| A3 | Login with wrong password 11 times in 1 minute from one IP | 11th+ request rate-limited (429) |
| A4 | Present an expired access token | 401 "Access token is invalid or expired" |
| A5 | Present an access token signed with a different/wrong secret | 401 (signature verification fails) |
| A6 | Use a refresh token twice (replay) | Second use → all sessions for that user revoked, 401 "Session compromised" |
| A7 | Refresh token after `change-password` | Confirm whether old refresh tokens are invalidated on password change — **verify actual behavior; not confirmed safe or unsafe in this audit, see `10-open-questions.md`** |
| A8 | Delete a user, then present their still-valid (unexpired) access token | 401 "User no longer exists" (re-fetch-on-every-request behavior) |
| A9 | Seeded admin logs in without changing password, then tries any admin endpoint other than change-password | 403 `PASSWORD_CHANGE_REQUIRED` |

## Authorization / IDOR (regression suite — codifies the clean result from this audit)

| # | Test | Expected result |
|---|---|---|
| Z1 | Employer A requests `GET /employer/jobs/:id` for Employer B's job ID | 404 |
| Z2 | Employer A requests `GET /employer/applications/:id` for an application to Employer B's job | 404 |
| Z3 | Employer A requests `GET /employer/billing/invoices/:id/pdf` for Employer B's invoice ID | 404 |
| Z4 | Candidate A requests `DELETE /profile/employment/:id` for Candidate B's entry ID | 404 |
| Z5 | Candidate A requests `PATCH /notifications/:id/read` for Candidate B's notification ID | 404 / no-op (count 0) |
| Z6 | Non-admin user requests any `/api/admin/*` route with a valid Bearer token | 403 |
| Z7 | Employer submits `POST /employer/jobs` with `status: "ACTIVE"` and `isSuspended: true` in the body while genuinely suspended | 403 (suspension check), and separately confirm `status` field is ignored/server-derived even for non-suspended employers |

## File access

| # | Test | Expected result |
|---|---|---|
| F1 | Upload an `.html` file with `Content-Type: application/pdf` spoofed via direct API call (not through the frontend file picker) to the verification-document endpoint | **Currently passes (SA-04) — should be rejected after remediation** |
| F2 | Fetch a candidate's resume signed URL directly (without auth) after it's been generated once | URL should expire after 1 hour; direct bucket access without a valid signed URL should fail |
| F3 | Attempt to guess/enumerate another user's storage path (e.g., increment a UUID segment) | Not computationally feasible (UUID keyspace) — confirm no shorter/sequential ID is used anywhere in storage paths |
| F4 | Upload a resume exceeding 5MB | 422, rejected before reaching storage |
| F5 | Upload a maliciously-crafted small DOCX designed to decompress large | **Currently no guard (SA-08) — after remediation, should time out / be rejected gracefully, not hang or OOM the process** |

## Input validation

| # | Test | Expected result |
|---|---|---|
| V1 | Submit a job title containing embedded `\r\n` sequences | Currently accepted (SA-13 note on email subject); confirm no header-injection effect in the resulting Resend API call |
| V2 | Submit every Zod-validated endpoint with an extra, unexpected field (e.g. `role`, `isAdmin`) in the body | Field silently ignored (schemas don't use `.passthrough()` for security-relevant fields) — confirm for `registerSchema`, `employerRegisterSchema`, `jobBody` |
| V3 | Submit `applyUrl` to the admin scraped-job endpoint as `http://127.0.0.1/`, `http://169.254.169.254/`, `file:///etc/passwd` | **Currently succeeds in reaching `fetch()` (SA-05) — after remediation, should be rejected before any network call** |

## Payments

| # | Test | Expected result |
|---|---|---|
| P1 | Fire 2 concurrent `POST /employer/jobs` (publish) requests against an employer with exactly 1 paid credit | **Currently both may succeed (SA-02) — after remediation, exactly one should succeed, the other should 402** |
| P2 | Fire 2 concurrent publish requests against a free-tier employer with 0 paid credits at the start of a new billing month | **Currently both may succeed (SA-03) — after remediation, exactly one should succeed as "FREE"** |
| P3 | Request a refund on the same paid invoice twice | **Currently both succeed in creating separate REFUND_REQUESTED rows (SA-06) — after remediation, second should be rejected** |
| P4 | Attempt to pass a custom `amountSar`/`priceSar` field in any billing request body | Ignored — amount always server-derived from the `Plan`/`Invoice` record |
| P5 | Send a webhook POST to `/api/webhooks/dodo` with a tampered signature header | 400 "Invalid webhook signature" |
| P6 | Send the same (valid, real) webhook event twice | Second delivery processed idempotently — no duplicate `Invoice`/`Transaction`/credit-grant |

## Webhooks

| # | Test | Expected result |
|---|---|---|
| W1 | Send a webhook with no signature headers at all | 400, no side effects |
| W2 | Send a webhook with a valid signature but an unrecognized `event.type` | 200 (no-op — unhandled types are silently accepted, by design) |
| W3 | Send a webhook whose `metadata.employerProfileId` references a nonexistent employer profile | Should fail gracefully, not throw an unhandled exception (verify) |

## Admin actions

| # | Test | Expected result |
|---|---|---|
| M1 | Approve a `PENDING_REVIEW` job belonging to a now-suspended employer | **Currently succeeds (SA-07) — after remediation, should be blocked** |
| M2 | Attempt to move a `PENDING_REVIEW` job to `ACTIVE` via the generic `PATCH /admin/jobs/:id/status` (not the dedicated approve endpoint) | 409 (blocked by `PENDING_STATUSES` guard) |
| M3 | Attempt to republish a `REJECTED` job via any status-update endpoint | 403 "Rejected jobs can't be republished directly" |
| M4 | Non-suspended-checking admin action: verify `isSuspended` is checked consistently after SA-07 fix, across create/update-status/approve | All three paths reject a suspended employer's publish attempt identically |

## Rate limiting

| # | Test | Expected result |
|---|---|---|
| R1 | 11 requests/min to `/api/auth/login` from one IP | 11th+ rate-limited |
| R2 | 11 requests/min to `/api/auth/register` from one IP | 11th+ rate-limited |
| R3 | Repeated resume uploads (no current limiter) | **Currently unlimited (SA-08) — after remediation, should be rate-limited** |
| R4 | Repeated `/api/enquiries` submissions | Rate-limited (confirm current limiter still applies) |

## Session management

| # | Test | Expected result |
|---|---|---|
| S1 | Log in, then log out — attempt to use the old refresh token | Rejected (revoked) |
| S2 | Log in from two different browsers/devices simultaneously | Both should work independently (no single-session enforcement — confirm this is the intended design, not a bug) |
| S3 | Cross-origin `fetch` to `/api/auth/refresh-token` with credentials from a non-allowlisted origin | **Currently may succeed if origin matches the regex (SA-01) — after remediation, should be rejected by CORS for any origin outside the explicit allowlist** |

## Privacy controls

| # | Test | Expected result |
|---|---|---|
| C1 | Request "export my data" | **Not implemented — track as a gap, not a test failure, until built** |
| C2 | Request account deletion | **Not implemented — same** |
| C3 | Confirm resume/photo/KYB document is actually removed from storage (not just the DB pointer) on the existing delete endpoints | Verify `removePrivateFile` is actually called and succeeds, not just the DB record cleared |
