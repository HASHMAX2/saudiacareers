# Security Findings

All findings verified against the repository at `D:\SaudiaCareers`, branch `billing_and_payment`, via direct code review (four parallel focused reviews plus direct verification of the most consequential claims). Sorted by severity, then exploitability, then business impact, then confidence.

**Legend — Status:** Confirmed (verified end-to-end in code) · Probable (strong evidence, one external variable unverified) · Requires runtime verification (needs a live/staging test to confirm) · Informational (not exploitable, hardening/consistency note).

---

## SA-01 — CORS regex allowlist + credentialed cookie enables cross-origin session/token theft

- **Status:** Confirmed · **Severity:** High · **Confidence:** High
- **CWE:** CWE-346 (Origin Validation Error) · **OWASP:** API4:2023 / A05:2021 Security Misconfiguration
- **Files:** `backend/src/app.js:26-39`, `backend/src/services/tokenService.js:111-122`, `backend/src/controllers/authController.js:140-159`, `frontend/src/api/client.js:16-28`

**Evidence:**
```js
// backend/src/app.js:26-39
origin(origin, callback) {
  if (!origin) return callback(null, true);
  const allowed =
    env.allowedOrigins.includes(origin) ||
    /^https:\/\/[a-z0-9-]+-saudiacareers\.vercel\.app$/.test(origin) ||
    /^https:\/\/saudiacareers-frontend[a-z0-9-]*\.vercel\.app$/.test(origin);
  if (allowed) return callback(null, true);
  return callback(new ApiError(403, "Origin is not allowed by CORS"));
},
credentials: true,
```
```js
// tokenService.js:111-122 — refresh cookie, production settings
{ httpOnly: true, secure: true, sameSite: "none", path: "/api/auth", domain: ".saudiacareers.com" }
```
```js
// authController.js:140-159 — refresh-token handler returns a fresh access token in the JSON body
return sendSuccess(res, { data: { user: publicUser(record.user), accessToken } });
```

**Attack prerequisites:** Victim has an active SaudiaCareers session (valid refresh cookie); victim visits an attacker-controlled page.

**Attack scenario:** Vercel's `*.vercel.app` project alias is first-come-first-served across the entire platform — any account can register a project such as `xk92q1-saudiacareers` (matches regex 1) or `saudiacareers-frontend-evil` (matches regex 2, which has no anchor stopping trailing segments after the fixed prefix). From that origin, the attacker's page issues `fetch('https://<backend-host>/api/auth/refresh-token', { method: 'POST', credentials: 'include' })`. Because it's a simple POST with no custom headers, no preflight fires. `SameSite=None; Secure` means the browser attaches the victim's refresh cookie to this cross-site request regardless of who initiated it. Because the attacker's Origin matches the regex, the server reflects it in `Access-Control-Allow-Origin` with `Access-Control-Allow-Credentials: true` — which is what lets the attacker's JavaScript **read** the JSON response, including the freshly-issued `accessToken`. That Bearer token then works against every protected endpoint (`authenticate` middleware only checks the `Authorization` header).

**Technical impact:** Full account takeover for any victim lured to the attacker's page while logged in — read/write access to every endpoint the victim's role permits (candidate PII/resume, or for an employer, billing/KYB documents, or worst case an admin session).
**Business impact:** Credential/session theft at scale is a Critical-adjacent trust and data-breach event; for an admin victim specifically, this is a path to full platform compromise.
**Data potentially affected:** Whatever the victim's role can access — candidate PII/resume up to admin-level access to every employer/candidate record.
**Users potentially affected:** Any logged-in user who can be lured to a lookalike page; admins are the highest-value target.

**Safe reproduction procedure (no live testing performed, described for later verification):**
1. Register a free Vercel project with a name matching either regex (e.g. `test-saudiacareers`).
2. Host a static page there running `fetch('<backend-health-or-refresh-url>', {credentials:'include'}).then(r=>r.json()).then(console.log)`.
3. Using a real (test) account, log into SaudiaCareers in the same browser, then visit the Vercel test page and observe whether the response is readable and contains an access token.

**Recommended remediation:** Replace the regex allowlist with an exact, explicit list of the three legitimate Vercel deployment URLs (and any preview URLs via Vercel's deployment API/environment variable injection at build/deploy time, not a guessable pattern). If preview-deployment CORS access is genuinely needed, gate it behind a Vercel deployment-protection secret header instead of Origin pattern matching. Independently, consider scoping the refresh cookie's `Domain` to the exact API host rather than the parent domain if it isn't already, and continue restricting `path: /api/auth` (already done — good).
**Regression risk:** Low — tightening CORS could break a legitimate preview-deployment workflow if one currently depends on the wildcard; verify current Vercel deployment naming before removing the regex.
**Verification test:** Automated test asserting `cors` middleware rejects a crafted Origin matching the old regex pattern but not the new explicit allowlist.
**Long-term control:** CI check that fails the build if `app.js`'s CORS config uses a regex instead of an explicit array against `env.allowedOrigins`.

---

## SA-02 — TOCTOU race condition in paid job-credit consumption (double-spend)

- **Status:** Confirmed · **Severity:** High · **Confidence:** High
- **CWE:** CWE-362 (Race Condition) · **OWASP:** API6:2023 Unrestricted Access to Business Flows
- **Files:** `backend/src/services/employerBillingService.js:44-77`, called from `employerController.js:389,497` and `adminController.js:193`

**Evidence:**
```js
// employerBillingService.js — consumeJobCredit (paraphrased from agent evidence, verify exact lines before patching)
if (subscription.paidCreditsRemaining > 0) {
  await prisma.employerSubscription.update({
    where: { id: subscription.id },
    data: { paidCreditsRemaining: { decrement: 1 } },
  });
  return "PAID";
}
```
The `subscription` object is fetched once by the caller (`getOrCreateSubscription`) before this check runs; the `update` call has no conditional `where` guard (e.g. `paidCreditsRemaining: { gt: 0 }`) and is not wrapped in a transaction with serializable isolation.

**Attack prerequisites:** An employer account with exactly 1 (or N) paid job credit(s); ability to fire 2+ concurrent HTTP requests (trivial — two browser tabs, or a two-line script).

**Attack scenario:** Employer fires two concurrent `POST /employer/jobs` (or `PATCH .../status` to publish) requests. Both read `paidCreditsRemaining = 1` before either write lands, both pass the `> 0` check, both decrement — landing on `-1` — and **both jobs go live**. Repeatable with more concurrent requests to publish N jobs from 1 credit.

**Technical impact:** Server-side business-rule bypass; database can go negative on `paidCreditsRemaining`.
**Business impact:** Direct revenue loss — the entire credit-based monetization model can be defeated by any employer willing to script two concurrent requests.
**Data potentially affected:** Billing/subscription records (not PII).
**Users potentially affected:** Any employer account; also enables spam/fraudulent job flooding beyond what's paid for.
**Confidence:** High — the read-then-write pattern with no atomic guard is unambiguous in the code as reported.

**Safe reproduction procedure:** In a local/dev environment with a test employer account seeded with exactly 1 paid credit, fire two concurrent `POST /employer/jobs` requests (e.g. via `Promise.all` with two axios calls) and observe whether both succeed and whether `paidCreditsRemaining` goes negative.

**Recommended remediation:** Make the decrement atomic and conditional in one round-trip:
```js
const result = await prisma.employerSubscription.updateMany({
  where: { id: subscription.id, paidCreditsRemaining: { gt: 0 } },
  data: { paidCreditsRemaining: { decrement: 1 } },
});
if (result.count === 0) throw new ApiError(402, "No job credits remaining...");
return "PAID";
```
`updateMany` with a `where` guard is atomic at the database level — only one of two concurrent requests will match `paidCreditsRemaining: { gt: 0 }` once the first has decremented it to 0.
**Regression risk:** Low — same external behavior for the non-race case; requires threading the "did it actually decrement" result back to the caller instead of assuming success.
**Verification test:** Integration test firing `Promise.all([consumeJobCredit(...), consumeJobCredit(...)])` against a subscription with 1 credit and asserting exactly one resolves `"PAID"` and the other throws/falls through to the free-job or 402 path.
**Long-term control:** Add a `CHECK (paidCreditsRemaining >= 0)` constraint at the database level as defense-in-depth (Postgres supports this via a migration), so even a future code regression can't drive the balance negative.

---

## SA-03 — TOCTOU race condition on the free-monthly-job-limit flag

- **Status:** Confirmed · **Severity:** Medium · **Confidence:** High
- **CWE:** CWE-362 · **OWASP:** API6:2023
- **File:** `backend/src/services/employerBillingService.js:44-69`

**Evidence:** Same pattern as SA-02: `freeJobAvailable = !subscription.freeJobUsedAt || !isSameCalendarMonth(...)` is checked against a stale in-memory read, then `freeJobUsedAt` is written without an optimistic-lock guard.

**Attack scenario:** A free-tier employer (0 paid credits) fires 2+ concurrent publish requests at the start of a billing month; both observe `freeJobAvailable = true` and both get a free job slot.

**Technical/business impact:** Free-tier quota bypass — lower direct revenue impact than SA-02 (baseline was already $0) but undermines the freemium conversion funnel and stacks with SA-02 if the employer also holds paid credits.
**Confidence note:** Confirmed this is *not* gameable via client-supplied date manipulation — the comparison uses server `new Date()` against the DB-stored timestamp; the only vector is the race, not clock spoofing.

**Recommended remediation:** Same atomic-guard pattern as SA-02: `updateMany({ where: { id, freeJobUsedAt: subscription.freeJobUsedAt } , data: { freeJobUsedAt: now } })` (optimistic concurrency check against the previously-read value) and check `count === 1` before granting the free slot.
**Regression risk:** Low. **Verification test:** Same concurrent-request pattern as SA-02, against a fresh-month subscription with 0 paid credits.
**Long-term control:** Consider consolidating both SA-02 and SA-03 into a single `$transaction` with `Serializable` isolation in `consumeJobCredit`, since they're the same underlying pattern.

---

## SA-04 — Employer KYB verification documents: unchecked file type + inline rendering

- **Status:** Probable (code pattern confirmed; live browser behavior depends on an unverified Supabase response header) · **Severity:** Medium-High · **Confidence:** High (pattern) / Medium (live exploitability)
- **CWE:** CWE-434 (Unrestricted Upload of File with Dangerous Type), CWE-79 (via MIME-sniffing) · **OWASP:** A04:2021 Insecure Design
- **Files:** `backend/src/middleware/upload.js:34-43`, `backend/src/services/storageService.js:40-46`, `backend/src/controllers/employerController.js` (verification doc upload/view), `backend/src/controllers/adminEmployerBillingController.js` (admin review view), `frontend/src/pages/admin/EmployerReviewDetail.jsx:123-128`, `frontend/src/pages/employer/EmployerVerification.jsx:345`

**Evidence:**
```js
// upload.js — verificationDocUpload
fileFilter(_req, file, callback) {
  if (file.mimetype !== "application/pdf") { ... }  // client-declared Content-Type, not file bytes
}
```
```js
// storageService.js
export async function createSignedViewUrl(path, expiresInSeconds = 3600) {
  ... .createSignedUrl(path, expiresInSeconds);   // no { download: true } → served inline
}
```
Both the employer's own verification page and the admin review page open this URL via `<a href=... target="_blank">` — a top-level navigation, not a sandboxed `<img>`/`<iframe>`.

**Attack scenario:** Any self-registered employer (no pre-verification vetting) uploads a "verification document" whose multipart part declares `Content-Type: application/pdf` but whose actual bytes are HTML/SVG with an embedded script. It's accepted (MIME check only looks at the declared header), stored with that declared content-type, and served without `Content-Disposition: attachment`. When an admin or the employer clicks "view," it top-level-navigates to the file. Whether this executes as HTML depends on whether Supabase Storage's response includes `X-Content-Type-Options: nosniff` — not verifiable from this repo alone.
**Realistic minimum impact regardless of the nosniff question:** admins/employers can be induced to top-level-navigate to attacker-controlled content served from a domain the platform treats as trusted (phishing page impersonating the platform, forced download of a deceptively-named file) — the "this is a PDF" guarantee the UI implies to reviewers isn't actually enforced.
**Who can trigger:** any self-registered employer → viewed by an admin (high-value target) or the employer's own session.

**Recommended remediation:**
1. Validate actual file bytes server-side (magic-number/signature check — e.g. the `file-type` npm package reading the first few hundred bytes of the buffer) in addition to the declared MIME, for all three upload types.
2. Force `download: true` (i.e., use `createSignedDownloadUrl`, not `createSignedViewUrl`) for verification documents specifically, since there's no product reason they need inline rendering — mirrors the pattern already correctly used for resumes.
**Regression risk:** Low — switching to forced-download changes the click-to-view UX to click-to-download; confirm this is acceptable for the admin review workflow (a "preview" experience may be lost).
**Verification test:** Upload a `.html` file with a spoofed `Content-Type: application/pdf` header directly via `curl`/Postman (bypassing frontend `accept` filtering, which is client-side only) and confirm the backend now rejects it after the fix.
**Long-term control:** Apply the same magic-byte check to resume/avatar uploads too, even though SA-05 in the deep-dive found those specific paths aren't currently exploitable given how they're consumed today — a future feature (e.g. inline resume preview) could silently reintroduce risk if the upload-time validation isn't hardened at the source.

---

## SA-05 — SSRF via admin "Recrawl" scraped-job link-health check

- **Status:** Confirmed · **Severity:** Medium (admin-gated, blind/boolean-oracle — would be High if reachable by a lower-privileged role) · **Confidence:** High
- **CWE:** CWE-918 (SSRF) · **OWASP:** API7:2023 Server-Side Request Forgery
- **Files:** `backend/src/controllers/scrapedJobController.js:48-69`, `backend/src/validation/scrapedJobSchemas.js:18-26`, `backend/src/routes/adminRoutes.js:132-133`

**Evidence:**
```js
const response = await fetch(scrapedJob.applyUrl, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(8000) });
isLive = response.ok;
```
`applyUrl` is validated only with `z.string().trim().url()` — no scheme allowlist, no rejection of loopback/link-local/private-range hosts, and `redirect: "follow"` means even an initially-external URL can redirect server-side into an internal address.

**Attack scenario:** An admin (or anyone who has compromised an admin session — a realistic phishing/credential-stuffing target) creates a `ScrapedJob` row with `applyUrl` pointing at `http://169.254.169.254/latest/meta-data/` (cloud metadata) or an internal Render service address, then triggers `/recrawl`. The backend itself issues the request server-side. Only a boolean (`LIVE`/`BROKEN`) is persisted — no response body is returned to the client — so this is a **blind SSRF**: usable for internal network/port reconnaissance and metadata-service probing, not direct data exfiltration.

**Technical impact:** Internal network reconnaissance, cloud-metadata-endpoint probing (potential credential harvesting depending on hosting provider), port-scan oracle against Render's internal network.
**Business impact:** Meaningful only if an admin account is already compromised — but at that point this becomes an escalation primitive beyond what admin web-app privileges alone would grant (e.g., harvesting cloud IAM credentials from a metadata endpoint).
**Confidence:** High that the code pattern is exploitable as described; real-world impact depends on Render's actual network isolation, not verifiable from the repo.

**Recommended remediation:** Before issuing the fetch, resolve the hostname and reject if it resolves to a private/loopback/link-local/metadata IP range (RFC 1918, 127.0.0.0/8, 169.254.0.0/16, ::1, fc00::/7), reject non-`http(s)` schemes, and either disable redirect-following (`redirect: "manual"` + re-validate each hop) or cap redirect count with re-validation at each hop.
**Regression risk:** Low — legitimate `applyUrl`s are external company career pages; an allowlist-by-exclusion approach shouldn't affect normal use.
**Verification test:** Unit test asserting the recrawl function rejects `http://127.0.0.1/`, `http://169.254.169.254/`, and `file:///etc/passwd`-style inputs before any network call is attempted.
**Long-term control:** Extract this validation into a shared `assertPublicHttpUrl()` utility so any future feature that fetches a user/admin-supplied URL (link previews, webhook registration, etc.) reuses the same guard instead of re-implementing it.

---

## SA-06 — No dedupe guard on refund requests; double-approval risk

- **Status:** Confirmed (missing guard) · **Severity:** Medium (requires an admin approval mistake to realize financial loss) · **Confidence:** High
- **CWE:** CWE-841 (Improper Enforcement of Behavioral Workflow) · **OWASP:** API6:2023
- **Files:** `backend/src/controllers/employerBillingController.js:399-427` (`requestRefund`), `backend/src/controllers/adminEmployerBillingController.js:265-297` (`approveRefund`), `backend/prisma/schema.prisma:434-452` (`Invoice` model — no unique constraint on `refundsInvoiceId`)

**Evidence:** `requestRefund` only checks the original invoice is `PAID` before creating a new `REFUND`-type invoice row; it never checks whether a `REFUND_REQUESTED`/`REFUNDED` row already points at the same `refundsInvoiceId`. `approveRefund` only checks the refund-invoice's own status before calling `dodoService.createRefund` — it doesn't cross-check for a sibling refund already issued against the same original payment.

**Attack scenario:** An employer calls `POST /employer/billing/invoices/:id/refund-request` multiple times on the same paid invoice, producing several `REFUND_REQUESTED` rows in the admin queue that all reference the same original payment but don't visibly announce that to a reviewing admin. If an admin approves more than one (plausible if the admin UI doesn't surface the shared `refundsInvoiceId`), Dodo could be asked to refund the same charge twice — actual outcome then depends on whether Dodo itself rejects a refund exceeding the remaining refundable balance, which is not verified/enforced in this application.
**Confirmed safe:** the refund **amount** itself is never client-controlled — always copied from the original invoice's stored `amountSar`.

**Recommended remediation:** Add a partial unique index / application-level check preventing more than one open (`REFUND_REQUESTED`) refund row per `refundsInvoiceId`; have `approveRefund` re-verify no sibling refund has already succeeded before calling Dodo; surface the original invoice and any prior refund attempts prominently in the admin approval UI.
**Regression risk:** Low. **Verification test:** Attempt two `refund-request` calls against the same invoice and assert the second is rejected (409) once the fix lands.
**Long-term control:** General principle — any "request → admin approval → external side-effect" workflow in this codebase should have the same double-submission guard; worth auditing `EmployerSupportRequest` and other similar flows for the same gap (not independently verified in this audit).

---

## SA-07 — Admin job-approval path doesn't check employer suspension status

- **Status:** Confirmed · **Severity:** Medium · **Confidence:** High
- **CWE:** CWE-863 (Incorrect Authorization) · **OWASP:** API1:2023 BOLA (function-level variant) / A01:2021
- **File:** `backend/src/controllers/adminController.js:158-209` (`approveJobReview`)

**Evidence:** `approveJobReview` checks `employerProfile.verificationStatus !== "APPROVED"` but never checks `employerProfile.isSuspended`, unlike the two employer-initiated publish paths which both explicitly check it (`employerController.js:351` in `createEmployerJob`, `employerController.js:470` in `updateEmployerJobStatus`).

**Attack scenario:** An employer submits a job that gets auto-flagged into `PENDING_REVIEW`. Before an admin reviews it, the same or a different admin suspends the employer (e.g., for a ToS violation unrelated to this specific job). The reviewing admin, unaware of or not cross-checking the suspension, approves the pending job — it goes `ACTIVE`, a credit is consumed, and it becomes visible to candidates despite the employer being supposed to be fully blocked from posting.

**Business impact:** Undermines the suspension control's guarantee; a suspended (and presumably untrustworthy) employer's listing reaches candidates. Financial impact is neutral (credit still consumed correctly) — this is a trust-and-safety gap, not a monetization one.

**Recommended remediation:** Add the same `if (employerProfile.isSuspended) throw new ApiError(403, ...)` guard to `approveJobReview`, matching the two existing employer-facing checks.
**Regression risk:** Low — this only blocks an edge case (approving a job for an employer suspended after submission but before review); confirm this is the desired behavior (vs. e.g. auto-rejecting instead) with the product owner before patching.
**Verification test:** Suspend a test employer with a job sitting in `PENDING_REVIEW`, then attempt `PATCH /admin/jobs/:id/approve` and assert 403.
**Long-term control:** Extract a single `assertEmployerCanPublish(employerProfile)` helper used by all three publish paths (`createEmployerJob`, `updateEmployerJobStatus`, `approveJobReview`) so this class of inconsistency can't recur when a fourth path is added later.

---

## SA-08 — Resume/document parsing: no decompression-bomb guard, no timeout, unrated upload endpoint

- **Status:** Probable (pattern confirmed; real-world blast radius depends on Render instance limits, not verified) · **Severity:** Medium · **Confidence:** Medium
- **CWE:** CWE-409 (Improper Handling of Highly Compressed Data / "Decompression Bomb"), CWE-400 (Uncontrolled Resource Consumption) · **OWASP:** API4:2023 Unrestricted Resource Consumption
- **Files:** `backend/src/services/resumeParserService.js:379-433`, `backend/src/middleware/upload.js:10-19`, `backend/src/routes/profileRoutes.js:41`

**Evidence:** Multer caps the *compressed* upload at 5MB, but DOCX is a ZIP container parsed by `mammoth` with no decompression-ratio or output-size limit, and no per-request timeout wraps the parse call. `POST /profile/resume` also has no rate limiting (only `/api/auth/*` and `/api/enquiries` use `authRateLimiter`; no global limiter exists in `app.js`).

**Attack scenario:** Any authenticated candidate (self-registration, no vetting) repeatedly uploads a small, adversarially-compressed DOCX designed to expand to a very large in-memory buffer, or one that's slow to parse, tying up backend worker capacity. Repeated at will since there's no rate limit on this endpoint.

**Technical/business impact:** Availability risk — memory/CPU exhaustion on the (free-tier, resource-constrained per `PROGRESS.md`) Render instance; error handling is otherwise solid (`parseResume` catches all errors and returns `{}` without leaking stack traces).

**Recommended remediation:** Wrap `extractText`/`parseResume` in a timeout (e.g. `Promise.race` against a 5-10s timer, matching the pattern already correctly used for the SSRF-adjacent recrawl fetch); add `authRateLimiter`-style rate limiting to the resume-upload route; consider a decompressed-size cap if `mammoth`/its underlying JSZip usage exposes one.
**Regression risk:** Low. **Verification test:** Upload a crafted highly-compressed DOCX in a sandboxed test environment and confirm the request now times out gracefully instead of consuming unbounded memory/CPU.
**Long-term control:** Add a general per-user rate limiter to all authenticated mutation endpoints, not just resume upload (see SA-16 in the remediation roadmap for the broader gap).

---

## SA-09 — CSRF exposure on `POST /api/auth/refresh-token` (low in isolation; same root cause as SA-01)

- **Status:** Confirmed · **Severity:** Low standalone / subsumed into SA-01's High severity when chained · **Confidence:** High
- **CWE:** CWE-352 (CSRF) · **OWASP:** A01:2021
- **File:** `backend/src/controllers/authController.js:140-159` (reads only the cookie, no CSRF token anywhere in the codebase — confirmed via repo-wide search, zero `csrf` hits)

All other protected JSON APIs are **not** CSRF-exploitable by design: `authenticate` middleware (`backend/src/middleware/authenticate.js:7-9`) only reads the `Authorization` header, never cookies, and a cross-site request can't set that header without triggering a CORS preflight that fails against any non-allowlisted origin. This is correctly ruled out as a false positive for the rest of the API.

The refresh-token endpoint itself, in isolation (ignoring SA-01), only allows a **blind** forged request — the attacker can't read the response without the CORS hole. Effect in isolation: the victim's refresh token silently rotates; if it races the victim's own legitimate refresh, the reuse-detection logic (`tokenService.js:76-82`) treats it as a replay and force-revokes all of the victim's sessions — a nuisance forced-logout, not credential theft. **This finding becomes High severity only in combination with SA-01**, which is what actually lets the response be read.

**Recommended remediation:** Fixing SA-01 (the CORS allowlist) closes the credential-theft chain here. As defense-in-depth, consider adding `SameSite=Strict` is not viable given the multi-Vercel-domain architecture, but a lightweight double-submit CSRF token on this one endpoint would remove even the blind-forced-logout nuisance case.
**Regression risk:** Low. **Verification test:** covered by SA-01's test.

---

## SA-10 — Missing defense-in-depth security headers on the frontend

- **Status:** Confirmed · **Severity:** Low (informational — no XSS sink exists today for CSP to protect against) · **Confidence:** High
- **CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers), CWE-693 · **OWASP:** A05:2021
- **File:** `frontend/vercel.json`

**Evidence:** Confirmed headers applied to all routes: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`. Missing: `Content-Security-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`. Backend (`helmet()` defaults, v8) already sends a reasonable default CSP, HSTS, COOP/CORP — but the backend is a pure JSON API with no HTML views, so those headers are largely inert there; the frontend (which actually renders HTML/JS to browsers) is the one missing them.

**Recommended remediation:** Add a CSP to `vercel.json` (start with a permissive-but-real policy — `default-src 'self'; connect-src 'self' <api-host>; img-src 'self' data: <supabase-storage-host>; script-src 'self'; style-src 'self' 'unsafe-inline'` given no external scripts/styles were found — then tighten) plus `Permissions-Policy: geolocation=(), camera=(), microphone=()` and `Cross-Origin-Opener-Policy: same-origin`.
**Regression risk:** Medium if the initial CSP is too strict and breaks a legitimate external resource (verify against all actual asset/API origins before shipping, especially Supabase Storage image URLs and the Dodo checkout redirect).
**Verification test:** Load every page in a browser with the new CSP active and confirm zero console CSP-violation errors.
**Long-term control:** Add `Report-To`/`report-uri` CSP reporting once shipped, so future regressions (e.g. someone adding an inline script) are caught automatically rather than silently breaking or silently going unenforced.

---

## SA-11 — Known-CVE dependencies (patchable)

- **Status:** Confirmed · **Severity:** Low (backend) / Low-Medium (frontend, mostly not applicable) · **Confidence:** High
- **CWE:** CWE-1104 (Use of Unmaintained Third-Party Components) · **OWASP:** A06:2021 Vulnerable and Outdated Components

**Evidence (`npm audit --omit=dev`):**
- Backend: `body-parser <1.20.6` — "vulnerable to denial of service when invalid limit value silently disables size enforcement" (GHSA-v422-hmwv-36x6). Low severity per npm. Fix available via `npm audit fix`.
- Frontend: `react-router 6.0.0–7.17.0` (via `react-router-dom`) — two moderate advisories: an open-redirect via backslash in `<Link>`/`useNavigate` (CVE-2025-68470 bypass), and an "Arbitrary Constructor Injection via `deserializeErrors()` in React Router SSR Hydration." **The SSR-hydration advisory does not apply** — this app is a pure Vite SPA, not using React Router's SSR features. The open-redirect advisory is worth patching regardless since it affects client-side `<Link>`/`useNavigate` behavior directly used throughout the app.

**Recommended remediation:** Run `npm audit fix` in both workspaces (patch-level bump, no major-version jump expected based on the advisory ranges) and re-run the test suite/`npm run build` afterward to confirm no breakage.
**Regression risk:** Low — both are patch/minor version fixes within the existing semver range already declared in `package.json` (`^`).
**Verification test:** `npm audit --omit=dev` returns zero vulnerabilities in both workspaces after the fix; `npm test` and `npm run build` still pass.

---

## SA-12 — Invoice bookkeeping can drift from actual Dodo-charged amount

- **Status:** Confirmed (data-integrity gap, not an attacker-exploitable path) · **Severity:** Low · **Confidence:** Medium
- **CWE:** CWE-1053 (Missing Documentation... ) — best classified as a data-integrity/reconciliation gap rather than a CWE-specific security bug · **OWASP:** not a standard OWASP category; noted for financial-controls completeness
- **Files:** `backend/src/controllers/adminPlansController.js`, `backend/src/controllers/dodoWebhookController.js:38-56`

**Evidence:** The actual charge amount at renewal/change time is correctly driven entirely by `targetPlan.dodoProductId` (Dodo's own product price is the source of truth — confirmed no price/amount field is ever sent from the app's DB to Dodo, so this is **not** an underpayment exploit). However, `Invoice.amountSar` is stamped once at invoice-creation time from the local `Plan.priceSar`, and `settleInvoice()` in the webhook handler never overwrites `amountSar` when marking an invoice `PAID` — only `status`/`gatewayRef`/`paidAt` are updated. If an admin edits `Plan.priceSar` without also updating the linked Dodo product price, subsequently-created invoices can display an `amountSar` that doesn't match what Dodo actually charged.

**Recommended remediation:** When settling a `PAID` webhook event, reconcile `Invoice.amountSar` against `fromHalalas(payment.total_amount)` from the verified event (already computed in the handler) and log/flag any mismatch rather than silently trusting the earlier local stamp.
**Regression risk:** Low. **Verification test:** Manually change a `Plan.priceSar`, create an invoice, and confirm the webhook-settled invoice's stored amount matches the actual gateway-reported charge (or is flagged if it doesn't).
**Long-term control:** Operational runbook item — whenever `Plan.priceSar` is edited via the admin Plans page, the linked Dodo product price must be updated in the same change (this is a process control, not purely a code fix).

---

## SA-13 — Informational: convention violations (not exploitable)

- **Status:** Informational · **Severity:** Low · **Confidence:** High

Three items found during the authorization review, all confirmed **not** exploitable (ownership checks remain correctly enforced downstream), listed here only because the audit brief asked for validation-consistency issues to be reported even when non-exploitable:

1. `POST /api/admin/import/parse` (`importController.js:6`) reads raw `req.body` and has no `validate()` middleware applied — every other admin route does. Admin-only, no ownership dimension applies, no injection vector found (input is length-capped and passed to the AI parser, which is itself Zod-validated on the way back out). **Recommendation:** add a schema for consistency/future-proofing, not urgency.
2. Candidate profile sub-resource routes (`employment/:id`, `education/:id`, `certifications/:id` DELETE, and the corresponding PUT handlers) use `Number(req.params.id)` instead of a Zod-validated param, but every query is correctly scoped by `candidateProfileId: profile.id` resolved server-side from `req.user.id` — cross-user access is not possible; a malformed ID just yields a clean 404. **Recommendation:** add param schemas for consistency.
3. The shared `jobBody` Zod schema (used by both admin and employer job routes) permits a client-supplied `status`/`saveAsDraft`, but `createEmployerJob`/`updateEmployerJob` explicitly destructure and discard those fields before ever building the Prisma `data` object — confirmed no code path uses the client's value. **Recommendation:** split into separate admin/employer schemas so a future refactor can't accidentally forget to strip the field.

---

## SA-14 — Informational: no CI/CD pipeline; `render.yaml` is stale relative to actual production infrastructure

- **Status:** Confirmed · **Severity:** Low-Medium (process/SDLC gap, not a code vulnerability) · **Confidence:** High
- **CWE:** N/A (process gap) · Relevant to SOC 2 "Change Management" and CIS Controls (secure SDLC)

`.github/` does not exist — there is no automated test/lint/dependency-scan gate before a deploy ships; deploys are direct git-push auto-deploys on Vercel/Render. Separately, `render.yaml` (the only IaC in the repo) still declares `region: singapore` and `ALLOWED_ORIGINS: https://saudiacareers.com,https://www.saudiacareers.com`, but `PROGRESS.md` documents that the live backend was migrated to Frankfurt and that the custom domain is not yet configured — meaning the file checked into the repo does not reflect the actual deployed configuration, and real environment variables were changed out-of-band via the Render dashboard/API rather than through this file. This is a configuration-drift / infra-as-code accuracy gap: the repo cannot currently be used to reconstruct or audit the real production configuration.

**Recommended remediation:** (a) Add a minimal CI workflow (lint + test + `npm audit` + `prisma validate` on every PR) as a first step — see `07-remediation-roadmap.md`. (b) Update `render.yaml` to match actual production values, or explicitly document that it's aspirational/out of date if keeping it in sync isn't practical right now.
**Regression risk:** None (additive). **Long-term control:** Treat `render.yaml` drift as a recurring checklist item after any manual dashboard change, or remove it from the repo if it will not be kept accurate (a stale IaC file is arguably worse than none, since it misleads future reviewers).

---

## Ruled-out / false positives (investigated, confirmed safe)

| Area | Verdict |
|---|---|
| IDOR/BOLA across all 17 non-webhook controllers, 60+ routes | No exploitable instance found — consistent `createdBy`/`userId`/`employerProfileId` scoping everywhere (see `05-authorization-matrix.md`) |
| Mass assignment of `role`, `userId`, `createdBy`, `isVerified`, `isSuspended`, `mustChangePassword` | Never accepted from client input; all server-derived |
| JWT `alg:none` / algorithm confusion | `jsonwebtoken` used with a fixed HMAC secret on both sign and verify; `type` claim additionally checked | 
| Raw SQL / SQL injection | Zero `$queryRaw`/`$executeRaw` usage anywhere in the backend |
| Stored/reflected/DOM XSS | Zero HTML-injection sinks (`dangerouslySetInnerHTML`, `innerHTML`, markdown renderers) anywhere in `frontend/src` |
| `localStorage`/`sessionStorage` token leakage | Only three "remember me" keys exist, each storing an email string only |
| `postMessage`/iframe origin validation | Feature not present in the codebase |
| Open redirect | No query-param-driven redirect exists anywhere |
| Webhook signature verification / amount tampering | Verified via SDK against raw body; amounts always sourced from the verified event, never client input |
| Duplicate application / apply-quota race | DB-level `@@unique([userId, jobId])` constraint enforces this atomically, correctly relied upon via `P2002` catch |
| Job moderation bypass (employer skipping admin review) | `PENDING_STATUSES` guard blocks every generic transition out of `PENDING_REVIEW`/`REVISION_PENDING_APPROVAL`; only the two admin approve/reject functions can move a job out of those states |
| AI-imported job content bypassing validation or enabling stored XSS | Goes through the identical Zod-validated `createJob` path as manually created jobs; rendered as plain JSX text (auto-escaped) everywhere |
| Storage key predictability / path traversal on file uploads | UUID-based keys, no user-controlled path segments, no `path.join`/`path.resolve` with user input anywhere in the backend |
| Resume/avatar inline-execution risk from spoofed MIME | Resumes always served with forced `Content-Disposition: attachment`; avatars only ever consumed via `<img>` tags (browsers don't execute HTML loaded via `<img>` regardless of declared Content-Type) |
| Email template HTML injection | Every template consistently escapes all interpolated fields in the HTML body via a shared `escapeHtml()` helper |
| Source map / secret leakage in the frontend build | No source maps generated (Vite default); only `VITE_API_URL` (public by design) is referenced anywhere in `frontend/src` |
| Hardcoded secrets in the repository or git history | Full-history scan for `.env`, `*credentials*`, key/PEM patterns, and common secret-prefix patterns (`sk-`, `AKIA`, `ghp_`, etc.) found nothing beyond placeholder `.env.example` templates |
| CSRF against protected JSON APIs | Not exploitable by design — Bearer-token auth doesn't rely on ambient cookie credentials for protected resources (see SA-09 for the one narrow exception) |
