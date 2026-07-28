# Attack Surface

Full route inventory across all 11 backend route files, derived from direct code review (not inferred). "Ownership check" means the controller scopes the query to a resource the authenticated caller actually owns, beyond just requiring *a* valid session of the right role.

## Public (unauthenticated) endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | Liveness check, no data |
| POST | `/api/auth/register` | Candidate self-registration, rate-limited (10/min) |
| POST | `/api/auth/employer/register` | Employer self-registration, rate-limited (10/min) |
| POST | `/api/auth/login` | Rate-limited (10/min) |
| POST | `/api/auth/logout` | Cookie-based, no auth required to call (clears whatever cookie is presented) |
| POST | `/api/auth/refresh-token` | Cookie-based; the one endpoint where "auth" comes entirely from the httpOnly cookie, not a Bearer token |
| POST | `/api/auth/forgot-password` | Rate-limited (10/min) |
| POST | `/api/auth/reset-password` | Rate-limited (10/min), token-based |
| GET | `/api/jobs/filter-options` | Public listing metadata |
| GET | `/api/jobs` | Public job search/listing, filtered to ACTIVE + !isDeleted |
| GET | `/api/jobs/:id` | Public job detail, same filter |
| GET | `/api/candidate/career-tips` | Static content |
| POST | `/api/enquiries` | Public contact form, rate-limited |
| POST | `/api/webhooks/dodo` | Not session-authenticated — HMAC-signature-verified instead (see `04-findings.md`) |

## Authenticated — any role

| Method | Path | Role gate |
|---|---|---|
| POST | `/api/auth/change-password` | any authenticated |
| GET / PATCH | `/api/notifications*` | any authenticated, self-scoped |
| GET | `/api/candidate/dashboard` | any authenticated, self-scoped |

## Candidate-only (`authorizeCandidate`)

`/api/applications/*`, `/api/profile/*` (personal info, resume, photo, employment/education/certification sub-entries), `/api/saved-jobs/*`, `POST /api/jobs/:id/report`. All 20+ routes confirmed self-scoped to `req.user.id` (see `05-authorization-matrix.md` for the full table).

## Employer-only (`authorizeEmployer`)

`/api/employer/*` — profile, dashboard, job CRUD + status/revision, applications (incl. resume unlock via `getApplicationDetail`), KYB verification document upload/delete/submit, support requests, and the full billing surface (invoices, payments, credit purchase, plan change/preview, payment method, subscription cancel/resume). All confirmed scoped to the caller's own `employerProfile.id` or jobs' `createdBy`.

## Admin-only (`authorizeAdmin` + `requirePasswordChangeComplete`)

`/api/admin/*` — job moderation (approve/reject/dismiss-reports), all-applications view + CSV export, WhatsApp job-text import, employer KYB verification review, billing overview + refund approve/reject, employer directory + suspend/unsuspend, scraped-job tracker, plan editor. Router-level middleware (`adminRoutes.js:78`) gates all 30 routes uniformly — no per-route gap found.

## Webhook (gateway-to-server, not user-facing)

`POST /api/webhooks/dodo` — signature-verified via Dodo SDK's `webhooks.unwrap()` against the raw request body (`app.js` explicitly preserves `req.rawBody` for this purpose). Idempotent via a DB unique-constraint claim on the gateway event ID.

## Upload surfaces

| Endpoint | Accepted types (client-declared MIME, not magic-byte verified — see finding) | Size limit |
|---|---|---|
| `POST /api/profile/resume` | PDF, DOC, DOCX | 5 MB |
| `POST /api/profile/photo` | JPEG, PNG, WebP | 2 MB |
| `POST /api/employer/verification/documents` | PDF only | 5 MB |

## Background/scheduled work

There is no queue, worker process, or cron job in this repository. "Scheduled" behaviors (monthly free-job-credit reset, job-expiry sweep, cancel-at-period-end downgrade) are all implemented as **lazy checks evaluated on the next relevant read**, not real background jobs — noted here because it changes the failure mode (a job that should have expired stays "ACTIVE" until the next listing read touches it) but is not itself a vulnerability.

## Outbound external requests (attacker-influenceable input reaching an external call)

| Feature | Outbound target | Trust boundary crossed |
|---|---|---|
| Admin "Recrawl" link-health check (`scraped-jobs/:id/recrawl`) | Arbitrary `applyUrl` stored on a `ScrapedJob` record | Reviewed for SSRF — see `04-findings.md` |
| WhatsApp job-text import | Anthropic API | User-pasted text sent as a prompt; output is Zod-validated as a normal job payload before persistence — see `04-findings.md` |
| HR application email | Resend, `To: job.hrEmail` | `hrEmail` is employer-supplied at job-creation time, not attacker-controlled at apply-time |
| Dodo checkout/refund calls | Dodo Payments API | Outbound only, amounts sourced from DB `Plan`/`Invoice` records |

## Trust-boundary crossings worth naming explicitly

1. Candidate resume/photo bytes → Multer (memory) → Supabase Storage (private) — MIME validated by client-declared `Content-Type` only (see `04-findings.md`).
2. Employer-declared `hrEmail` on a job → embedded in an outbound email's `To` header at apply-time — not attacker-controlled per-application, but worth noting as employer-controlled email routing.
3. Browser → CORS-gated backend — origin allowlist includes two regex patterns matching Vercel preview-style subdomains, evaluated alongside `credentials: true` (see `04-findings.md` for the full verdict).
4. Dodo → webhook — the only endpoint where trust is established by cryptographic signature rather than session state.
