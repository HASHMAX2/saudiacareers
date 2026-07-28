# Threat Model

## Assets (ranked by sensitivity)

| Asset | Classification | Where |
|---|---|---|
| Candidate PII (name, email, mobile, DOB, gender, marital status, religion, nationality, visa status) | Regulated personal / highly sensitive | `CandidateProfile` |
| Resumes | Highly sensitive (employment history, PII) | Supabase Storage, private |
| Employer KYB documents (registration cert, tax reg, ID, address proof, authorization letter) | Highly sensitive / identity-verification data | Supabase Storage, private |
| Passwords | Authentication data | `User.passwordHash`, bcrypt |
| Refresh tokens | Authentication data | Hashed in `RefreshToken` table |
| Access tokens | Authentication data | Never persisted server-side; in-memory client-side only |
| Billing/tax info, invoices, transactions | Financial data | `EmployerProfile`, `Invoice`, `Transaction` |
| Payment method reference (brand/last4/gateway ID — no PAN/CVV) | Financial data (tokenized, low sensitivity) | `EmployerPaymentMethod` |
| Admin session | Highest-value authentication asset | Same JWT mechanism as other roles, no MFA |
| Job/application data | Internal / business | `Job`, `Application` |
| Source code | Internal | GitHub repo |
| Cloud credentials (Supabase service key, Dodo API key, JWT secrets, Resend key, Anthropic key) | Highly sensitive | Platform env vars (Render/Vercel dashboards) — not in repo |

## Threat actors considered

| Actor | Relevance in this app |
|---|---|
| Unauthenticated internet user | Full access to `/api/jobs`, `/api/enquiries`, registration, login — primary surface for credential stuffing and account creation abuse |
| Malicious registered candidate | Can apply/report jobs, upload files, is the least-trusted authenticated role |
| Fraudulent employer | Self-registration with no pre-vetting (verification is post-hoc, admin-reviewed) — realistic threat given `EmployerProfile.verificationStatus` defaults to `PENDING` and jobs can still be created (as drafts/pending) before approval |
| Compromised candidate/employer account | Realistic via credential stuffing (no visible CAPTCHA, rate-limited to 10/min per IP but not per-account) or the SA-01 CORS/token-theft chain |
| Compromised admin account | Highest-impact actor — no MFA anywhere in the app; SA-01 makes this a realistic, not just theoretical, path if an admin is phished to a lookalike page while logged in |
| Automated bots / scrapers | Public job listing has no CAPTCHA/bot-detection; `/api/enquiries` is rate-limited but publicly reachable |
| Attacker controlling a "scraped job" URL (SA-05) | Requires an already-compromised admin account, but then gets an SSRF primitive |
| Supply-chain attacker | No CI/CD dependency-scanning gate (see SA-14); two known-CVE dependencies found via manual `npm audit` |

## STRIDE analysis (by feature area)

### Authentication
- **Spoofing:** Mitigated — bcrypt (12 rounds per `CLAUDE.md`), JWT signed with distinct access/refresh secrets, role re-fetched from DB on every request (no stale-JWT-role trust).
- **Tampering:** Refresh-token reuse detection revokes all sessions on replay — strong control.
- **Repudiation:** No structured audit log of admin actions found (see `06-compliance-gap-analysis.md`) — an admin's suspend/approve/refund actions aren't independently logged beyond the mutation itself.
- **Information Disclosure:** SA-01 is the dominant threat here — CORS/cookie chain can leak a live access token.
- **Denial of Service:** Auth routes are rate-limited (10/min/IP); no per-account lockout after repeated failed logins was found (worth a runtime check — see `10-open-questions.md`).
- **Elevation of Privilege:** No role-manipulation vector found (SA-13 confirms `role` is never client-settable).

### Job posting / employer workflow
- **Tampering:** SA-02/SA-03 (credit races) are the standout findings — an employer can tamper with the intended business-rule outcome via request timing, not by modifying any field.
- **Repudiation:** Job status transitions are logged in the DB (status field + timestamps) but no separate immutable audit trail exists.
- **Elevation of Privilege:** SA-07 — a suspended employer's job can reach `ACTIVE` via the admin-approval path specifically, a narrow but real gap.

### File uploads (resume, photo, KYB documents)
- **Spoofing:** SA-04 — declared MIME type can be spoofed; contained today by consumption pattern (forced download for resumes, `<img>`-only for photos) but not by validation itself.
- **Tampering:** Storage keys are UUID-based, not attacker-influenceable — no path-traversal or overwrite vector found.
- **Denial of Service:** SA-08 — unbounded DOCX decompression + no per-request timeout + no rate limit on the upload endpoint.

### Payments / webhooks
- **Spoofing:** Webhook signature verification is solid — forged webhook events are rejected.
- **Repudiation:** Invoice/Transaction tables provide a reasonable paper trail; SA-12 notes a minor reconciliation gap.
- **Tampering:** SA-06 — refund workflow lacks a double-submission guard.
- **Information Disclosure:** No cardholder data touches this app (tokenized reference only) — PCI DSS scope is minimized by design, a positive control.

### Admin panel
- **Elevation of Privilege / Spoofing:** No MFA on the highest-value account type in the system. Combined with SA-01, this is the single most consequential risk chain in the whole audit: phish an admin → steal their session via the CORS hole → full platform access, including employer suspension, refund approval, and viewing every candidate's PII/resume.
- **Tampering (admin-dashboard XSS):** Ruled out — no HTML-injection sink exists anywhere in the frontend, so stored content viewed by admins (job descriptions, enquiry messages, support requests) cannot execute script.

## Abuse-case walkthrough (business-logic focus, as explicitly requested)

| Abuse case | Status in this codebase |
|---|---|
| Creating unlimited accounts | No CAPTCHA on registration; rate-limited 10/min/IP only — bulk account creation via distributed IPs is not prevented at the application layer |
| Bypassing account-verification requirements | Employer jobs can be created as drafts pre-verification, but publishing (`ACTIVE`) is gated on `verificationStatus === APPROVED` on every path checked — no bypass found |
| Publishing unauthorized listings | See SA-02/SA-03 (quota bypass via race) and SA-07 (suspension-check gap on one path) |
| Editing another user's listing | Ruled out — ownership-scoped everywhere |
| Viewing another user's application / downloading another user's resume | Ruled out — `job: { createdBy: req.user.id }` scoping confirmed on every employer-facing application/resume-unlock endpoint |
| Circumventing subscription/payment limits | **Confirmed exploitable** — SA-02, SA-03 |
| Manipulating approval status | Ruled out for employer-initiated bypass; SA-07 is the one narrow admin-side gap |
| Reusing credits/coupons | No coupon system exists; credit-reuse via race is SA-02 |
| Bypassing moderation | Ruled out — `jobLegitimacyService` enforcement confirmed non-bypassable, `PENDING_STATUSES` guard confirmed comprehensive |
| Impersonating employers | Mitigated by KYB verification workflow, though SA-04's file-type gap slightly weakens the integrity of that workflow's inputs |
| Harvesting user contact details / scraping profiles | Public job listings expose no candidate data; candidate profiles are never publicly listed; no enumeration vector found in this review (not exhaustively fuzz-tested) |
| Mass messaging / spam | `/api/enquiries` is rate-limited; no email-sending endpoint is directly reachable by an unauthenticated user beyond that |
| Enumeration of registered users | Login/register error messages not specifically audited for username-enumeration timing differences in this pass — flagged in `10-open-questions.md` |
| Forging webhook events | Ruled out — signature-verified |
| Replaying sensitive requests | Refresh-token replay is specifically detected and punished (revoke-all); payment webhook replay is prevented via idempotency claim; application double-submit is prevented via DB unique constraint |

## Highest-risk attack paths (composite, cross-finding)

1. **Admin session theft → full platform compromise.** SA-01 (CORS hole) + no MFA on admin accounts + broad admin privileges (suspend, refund, view all PII) = the single highest-impact realistic path in this system. Single point of failure: one phished admin click.
2. **Job-credit race → sustained free job-posting abuse.** SA-02/SA-03 chained with the fact that job postings that later prove fraudulent still went through `jobLegitimacyService` — an attacker exploiting the race gets *more* free listings, each of which still individually passes legitimacy screening, so this isn't just a revenue leak but a potential spam-volume amplifier.
3. **Compromised admin → SSRF → cloud credential harvesting (SA-05).** Lower likelihood (requires an already-compromised admin) but high potential impact if the hosting provider's metadata endpoint yields usable credentials.
