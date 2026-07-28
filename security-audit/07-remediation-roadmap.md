# Remediation Roadmap

Engineering complexity uses relative sizing: **Small** (a few lines, one file, low risk), **Medium** (one feature area, a few files, needs a test), **Large** (cross-cutting change, needs careful rollout), **Architectural** (structural/infrastructure change).

No code has been changed as part of this audit. Everything below is proposed, pending your approval, per the audit's remediation rules.

## Immediate: 0–7 days

Items with realistic, low-effort exploitation and outsized impact.

| Item | Findings | Owner type | Complexity | Dependencies | Suggested validation | Risk if delayed |
|---|---|---|---|---|---|---|
| Replace CORS regex allowlist with an explicit origin list | SA-01, SA-09 | Backend | Small | Confirm current legitimate Vercel URLs before removing the wildcard | Automated test asserting old regex-matching origins are now rejected; manual verification the 3 real portals still work | **Full account/admin takeover remains live** — highest-priority item in this entire audit |
| Fix TOCTOU race on paid job-credit consumption | SA-02 | Backend | Small | None | Concurrent-request integration test | Ongoing, repeatable revenue loss |
| Fix TOCTOU race on free-job-monthly-limit | SA-03 | Backend | Small | Same fix pattern as SA-02, can ship together | Concurrent-request integration test | Free-tier quota bypass |
| `npm audit fix` in both workspaces | SA-11 | Backend + Frontend | Small | Run full test suite + `npm run build` after | `npm audit --omit=dev` clean; existing tests pass | Low urgency but trivial to close now |

## Near term: 8–30 days

High-risk fixes and foundational controls.

| Item | Findings | Owner type | Complexity | Dependencies | Suggested validation | Risk if delayed |
|---|---|---|---|---|---|---|
| Force `download: true` + add magic-byte validation for KYB verification documents | SA-04 | Backend | Medium | Decide on a magic-byte library (e.g. `file-type`); confirm admin-review UX still works with forced download | Upload a mislabeled file via direct API call (bypassing frontend `accept` filter) and confirm rejection | Admin/employer phishing or content-spoofing via "verified" document viewer |
| Add SSRF guard to the scraped-job recrawl fetch | SA-05 | Backend | Medium | Choose an IP-range/hostname validation utility (or hand-roll one) | Unit tests for loopback/link-local/metadata-range rejection | SSRF primitive available to any compromised admin account |
| Add refund double-submission guard | SA-06 | Backend | Medium | Decide product behavior (reject vs. merge duplicate requests) | Test: two refund-requests on the same invoice → second rejected | Admin-approval-error-triggered financial loss |
| Add `isSuspended` check to `approveJobReview` | SA-07 | Backend | Small | Confirm desired behavior (block vs. auto-reject) with product owner | Test: suspend employer with a pending job, attempt approve, expect 403 | Suspended employer's listing reaches candidates |
| Add timeout + rate limiting to resume-parsing endpoint | SA-08 | Backend | Medium | Decide on rate-limit thresholds consistent with other authenticated endpoints | Load test with a crafted large/complex DOCX in a sandboxed environment | Availability risk on resource-constrained (free-tier) infrastructure |
| Add CSP + Permissions-Policy + COOP to `vercel.json` | SA-10 | Frontend | Medium | Enumerate every actual external asset/API origin first to avoid breakage | Manual browser test across every page for CSP console errors | Low urgency (no current XSS sink) but closes a defense-in-depth gap |
| Reconcile `Invoice.amountSar` against verified webhook amount | SA-12 | Backend | Small | None | Manual test: edit a Plan price, create+settle an invoice, confirm reconciliation/flagging | Accounting drift, harder to trace later |
| Stand up a minimal CI workflow (lint + test + `npm audit` + `prisma validate` per PR) | SA-14 | DevOps/Backend | Medium | GitHub Actions setup, branch protection decision | CI passes/fails visibly on a test PR | No safety net for any future regression, including re-introducing any fix above |
| Update or explicitly deprecate `render.yaml` to match live production config | SA-14 | DevOps | Small | Access to actual live Render env vars | Diff reviewed against Render dashboard | Misleads future engineers/auditors about actual production config |

## Medium term: 31–90 days

Architecture, process, compliance, and defense-in-depth improvements.

| Item | Findings | Owner type | Complexity | Dependencies | Suggested validation | Risk if delayed |
|---|---|---|---|---|---|---|
| Add MFA for admin accounts | Threat model (admin compromise is the highest-impact path) | Backend + Frontend | Large | Choose TOTP vs. other mechanism; UX for recovery codes | Manual QA of enrollment/login/recovery flow | Single-factor compromise (e.g. phishing) remains full-platform-impact for the highest-value account type |
| Per-account (not just per-IP) login rate limiting / lockout | Threat model (credential stuffing) | Backend | Medium | Decide lockout policy (duration, CAPTCHA fallback) | Test repeated failed logins against one account from varying IPs | Credential-stuffing resilience gap |
| Data retention policy + implementation (candidate/employer account & document deletion) | `06-compliance-gap-analysis.md` | Backend + Product + Legal | Architectural | Legal sign-off on retention periods per applicable law | Test account-deletion flow removes/anonymizes PII and storage files | Compliance exposure, unbounded data accumulation |
| Data export / "download my data" self-service endpoint | `06-compliance-gap-analysis.md` | Backend | Medium | Define export format/scope | Test export contains expected fields, excludes other users' data | Data-subject-rights gap under applicable privacy law |
| Structured admin audit log (who did what, when, to which resource) | `06-compliance-gap-analysis.md`, SOC2 readiness | Backend | Large | Schema design for an `AuditLog` model; decide retention | Test that suspend/approve/refund/plan-edit actions all produce a log entry | No forensic trail if an admin account is compromised or acts maliciously |
| Formal incident-response runbook | `06-compliance-gap-analysis.md` | Security/Ops | Medium (documentation) | None | Tabletop exercise | Slower, less coordinated response to a real incident |
| Extract shared `assertPublicHttpUrl()` / `assertEmployerCanPublish()` helpers | SA-05, SA-07 | Backend | Small | Do alongside their respective fixes | Unit tests on the shared helper | Same class of bug recurring at a future new call site |
| Re-evaluate necessity of sensitive candidate-profile fields (religion, marital status, etc.) | `06-compliance-gap-analysis.md` | Product + Legal | Small (decision) / Medium (migration if fields removed) | Legal input on what's actually required for the target market | Product sign-off | Unnecessary sensitive-data collection increases breach impact and compliance burden |
| Dependency/SAST scanning in CI (beyond `npm audit`) | SA-14 | DevOps | Medium | Choose tooling (Semgrep/CodeQL/Snyk) | CI gate demonstrably catches a seeded test vulnerability | Slower detection of newly-disclosed CVEs or newly-introduced code-level bugs |

## Explicitly not recommended to rush

- **MFA and audit-logging are Large/Architectural** — don't bolt these on hastily; they deserve proper design given they touch every admin session and every mutating admin action respectively.
- **Data retention/deletion is Architectural and legally-gated** — implementing before legal sign-off on retention periods risks building the wrong thing twice.
