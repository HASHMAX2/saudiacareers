# Authorization Matrix

Built from direct code review of all 11 backend route files and their controllers. "Ownership check" = the controller scopes the query to a resource the caller actually owns/is entitled to, not just "any valid session of the right role." Unauthenticated routes are marked accordingly; role columns show which of `authorizeCandidate`/`authorizeEmployer`/`authorizeAdmin` gates the route (router-level gates noted once per section rather than repeated per row).

## Auth (`/api/auth`) — public by nature

| Resource | Action | Unauthenticated | Candidate | Employer | Admin | Ownership Check | Server Enforcement |
|---|---|---:|---:|---:|---:|---|---|
| Registration | Create account | ✅ | — | — | — | n/a | Zod schema, rate-limited |
| Session | Login | ✅ | — | — | — | n/a | Rate-limited |
| Session | Logout | ✅* | — | — | — | Own cookie only | Cookie-scoped |
| Session | Refresh | ✅* | — | — | — | Own cookie only | See **SA-01/SA-09** — CORS gap affects this endpoint |
| Password | Forgot/reset | ✅ | — | — | — | Token-scoped | Hashed, 1hr-expiry, single-use token |
| Password | Change (authenticated) | ❌ | ✅ | ✅ | ✅ | `req.user.id` | ✅ |

\* "Unauthenticated" here means no Bearer token is required — the httpOnly cookie is the actual authenticator.

## Public job browsing (`/api/jobs`)

| Resource | Action | Unauth | Candidate | Employer | Admin | Ownership | Enforcement |
|---|---|---:|---:|---:|---:|---|---|
| Job listing/detail | Read | ✅ | ✅ | ✅ | ✅ | n/a | Filtered to `ACTIVE, !isDeleted` server-side |
| Job | Report | ❌ | ✅ | ❌ | ❌ | n/a (any candidate may report any job, by design) | `authorizeCandidate` |

## Candidate-only resources (router-level `authenticate + authorizeCandidate`)

| Resource | Action | Unauth | Candidate | Employer | Admin | Ownership | Enforcement |
|---|---|---:|---:|---:|---:|---|---|
| Own profile | Read/update | ❌ | ✅ (self) | ❌ | ❌ | `req.user.id` | ✅ |
| Resume | Upload/download/delete | ❌ | ✅ (self) | ❌ | ❌ | `req.user.id` | ✅, MIME-checked (see **SA-04** caveat), signed URL |
| Photo | Upload/delete | ❌ | ✅ (self) | ❌ | ❌ | `req.user.id` | ✅ |
| Employment/Education/Certification entries | CRUD | ❌ | ✅ (self) | ❌ | ❌ | `candidateProfileId: profile.id` | ✅ |
| Saved jobs | List/save/unsave | ❌ | ✅ (self) | ❌ | ❌ | `userId: req.user.id` | ✅ |
| Applications | Apply / list mine | ❌ | ✅ (self) | ❌ | ❌ | `userId: req.user.id`; DB `@@unique([userId,jobId])` | ✅ |
| Dashboard | Read own metrics | ❌ | ✅ (self) | — | — | `req.user.id` | ✅ |
| Notifications | List/mark read | ❌ | ✅ (self, role-agnostic) | ✅ (self) | ✅ (self) | `userId: req.user.id` | ✅ |

## Employer-only resources (router-level `authenticate + authorizeEmployer`)

| Resource | Action | Unauth | Candidate | Employer | Admin | Ownership | Enforcement |
|---|---|---:|---:|---:|---:|---|---|
| Company profile | Read/update | ❌ | ❌ | ✅ (self) | ❌ | `userId: req.user.id` | ✅ |
| Jobs | Create | ❌ | ❌ | ✅ | ❌ | Creates own; `status` client field discarded (see SA-13 #3) | ✅, `isSuspended`/verification/credit checks |
| Jobs | Read/update/delete/status/revise | ❌ | ❌ | ✅ (own only) | ❌ | `createdBy: req.user.id` | ✅; `isSuspended` checked on publish paths (gap on admin-approve path — **SA-07**) |
| Applications (per-job, all-jobs, detail) | Read / status update | ❌ | ❌ | ✅ (own jobs' applications only) | ❌ | `job: { createdBy: req.user.id }` | ✅ |
| Resume unlock (via application detail) | Read | ❌ | ❌ | ✅ (own jobs' applicants only) | ❌ | `job: { createdBy: req.user.id }` — verified directly in this audit | ✅ |
| KYB verification documents | Upload/delete/submit | ❌ | ❌ | ✅ (self) | ❌ | `userId`/`employerProfileId` | MIME-checked (see **SA-04**) |
| Support requests | Create | ❌ | ❌ | ✅ (self) | ❌ | `userId: req.user.id` | ✅ |
| Billing: invoices, transactions, PDF/zip download, pay, refund-request | Read/write | ❌ | ❌ | ✅ (self) | ❌ | `employerProfileId: employerProfile.id` | ✅ (refund dedupe gap — **SA-06**) |
| Billing: credit purchase, plan preview/change, payment method, subscription cancel/resume | Write | ❌ | ❌ | ✅ (self) | ❌ | `employerProfile.id` | ✅; amounts sourced from DB `Plan`, never client input; **not** suspension-gated (accepted risk, confirmed by-design) |

## Admin-only resources (router-level `authenticate + authorizeAdmin + requirePasswordChangeComplete`, uniformly applied to all 30 routes)

| Resource | Action | Unauth | Candidate | Employer | Admin | Ownership | Enforcement |
|---|---|---:|---:|---:|---:|---|---|
| Dashboard metrics | Read | ❌ | ❌ | ❌ | ✅ | n/a (global) | ✅ |
| Jobs (all) | CRUD, status, approve/reject, dismiss-reports | ❌ | ❌ | ❌ | ✅ | n/a (admin sees/acts on all, by design) | ✅ — **except** `approve` doesn't check employer suspension (**SA-07**) |
| Flagged jobs | Read/dismiss | ❌ | ❌ | ❌ | ✅ | n/a | ✅ |
| Applications (all) | Read, status update, CSV export | ❌ | ❌ | ❌ | ✅ | n/a | ✅ |
| WhatsApp import parse | Read (no DB write) | ❌ | ❌ | ❌ | ✅ | n/a | ✅ (no `validate()` middleware — **SA-13** #1, not exploitable) |
| Employer verification queue | Read/approve/reject/request-info | ❌ | ❌ | ❌ | ✅ | n/a | ✅ |
| Employer directory | Read/suspend/unsuspend | ❌ | ❌ | ❌ | ✅ | n/a | ✅ |
| Billing overview, invoices, refund approve/reject | Read/write | ❌ | ❌ | ❌ | ✅ | n/a | ✅ (refund dedupe gap — **SA-06**) |
| Scraped jobs | CRUD, recrawl, mark-reviewed | ❌ | ❌ | ❌ | ✅ | n/a | ✅ — recrawl has SSRF gap (**SA-05**) |
| Plans | Read/edit price/credits/features | ❌ | ❌ | ❌ | ✅ | n/a | ✅ |

## Gateway-authenticated (not session-based)

| Resource | Action | Auth mechanism | Ownership | Enforcement |
|---|---|---|---|---|
| Dodo webhook (`POST /api/webhooks/dodo`) | Ingest payment events | HMAC signature via SDK `webhooks.unwrap()` against raw body | n/a — event IDs/amounts sourced from the signed payload, never client-controllable | ✅, idempotent via DB unique-constraint claim on event ID |

## Summary

- **60+ routes reviewed. Zero exploitable IDOR/BOLA or function-level privilege-escalation findings.** Every resource-owning query is consistently scoped to the authenticated caller's own ID/profile/job set.
- The two authorization-adjacent gaps found (**SA-06** refund double-submission, **SA-07** suspension check missing on one admin path) are workflow-consistency gaps, not broken access control in the classic IDOR sense — no user can act on another user's resources; the gaps are about an admin-side function not fully respecting a *different* control (suspension) that's correctly enforced everywhere else.
- No client-controlled `role`, `userId`, `createdBy`, `isVerified`, or `isSuspended` field reaches the database from any request body anywhere in the codebase.
