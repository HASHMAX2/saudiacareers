# Executive Summary — SaudiaCareers Security Audit

**Scope:** Full source-code review of the SaudiaCareers job-portal repository (backend API, frontend, database schema, deploy configuration). No live/production systems were tested — this was a static code and architecture review, authorized by and performed on behalf of the repository owner.

## Overall risk rating: **Medium-High**

The codebase is, on the whole, **well-built for an MVP** — authentication, authorization, and data-ownership checks are unusually thorough for a project this size, and several classes of vulnerability that are common in projects like this (SQL injection, XSS, IDOR, hardcoded secrets, insecure file paths) were checked exhaustively and found **absent**. The rating is "Medium-High" rather than "Low" because of **one High-severity issue that undermines the strength of everything else**: a CORS misconfiguration that can let an attacker steal a logged-in user's session — including, in the worst case, an administrator's.

## The most important risks

1. **A configuration mistake could let an attacker take over a logged-in user's session, including an admin's.** The backend trusts any web address that looks like `something-saudiacareers.vercel.app`. Because that hosting platform (Vercel) lets anyone register a project with a matching name, an attacker could set up a lookalike page, trick a logged-in user (ideally an administrator, since it's not selective) into visiting it, and walk away with a valid login token — no password needed. Combined with the fact that admin accounts don't currently require a second login factor, this is the single biggest risk found. **[SA-01]**
2. **Employers can potentially post more job listings than they've paid for**, by sending two requests to the server at almost the same instant. This is a timing bug in the credit-counting logic, not a flaw a normal user would stumble into by accident — but it's a straightforward, repeatable way for a determined user to get free job postings. **[SA-02, SA-03]**
3. **A handful of smaller workflow gaps** — a refund request can be submitted more than once without the system noticing (relies on a human reviewer catching it), and one specific admin action (approving a previously-flagged job listing) doesn't double-check whether the employer was suspended in the meantime. Both are realistic but lower-impact than the two issues above. **[SA-06, SA-07]**
4. **An uploaded "company verification document" isn't checked to make sure it's actually the file type it claims to be.** In the worst case this could be used to serve deceptive content to an admin or the employer reviewing it. **[SA-04]**
5. **One admin-only feature (checking whether a scraped job link is still live) can be pointed at internal network addresses**, which is a known class of issue ("SSRF") that becomes relevant only if an admin account is already compromised. **[SA-05]**

## What's already working well (don't lose this in remediation)

- **Every place in the app that checks "does this belong to the person asking for it" does so correctly** — we reviewed over 60 API routes across all three user types (candidates, employers, admins) and found zero cases where one user could see or modify another user's data by guessing an ID. This is a genuinely strong result and reflects careful engineering.
- **Login sessions are built defensively** — if a stolen "remember me" token is ever reused after it's already been replaced, the system detects it and force-logs-out every session for that account, which is a more sophisticated protection than many much larger companies implement.
- **No secrets, passwords, or API keys have ever been committed to the code repository** — checked the complete history, not just the current version.
- **Payment webhooks are properly verified** — a forged "payment succeeded" message from outside cannot trick the system into granting something for free; the amount charged always comes from the verified transaction, never from anything a user could tamper with.
- **No SQL injection, no cross-site-scripting (the kind of bug that lets an attacker run code in another user's browser), and no exposed database queries** were found anywhere in the application — these are the most common ways web apps get breached, and this one has none of them.
- **Credit card numbers never touch this application at all** — they're handled entirely by the payment processor (Dodo Payments), which meaningfully reduces the regulatory burden around handling payment data.

## Immediate actions (this week)

- Fix the CORS/session-theft issue (#1 above) — this is a small, well-understood code change.
- Fix the job-credit race condition (#2) — also a small, well-understood fix.
- Both are detailed with exact code locations and suggested fixes in `04-findings.md` and `07-remediation-roadmap.md`.

## 30-day priorities

- Close the remaining workflow gaps (#3, #4, #5 above).
- Add a lightweight automated check that runs on every code change to catch known-vulnerable dependencies and basic mistakes before they ship — the project currently has no such safety net at all.

## 90-day priorities

- Add two-factor login for admin accounts — right now, a stolen admin password (via phishing, reuse from another breached site, etc.) is enough on its own to fully compromise the platform.
- Build a "download my data" / "delete my account" capability — the app currently has no way for a candidate or employer to request their data be exported or removed, which several privacy laws require.
- Decide, with legal input, exactly which privacy law(s) apply (Saudi, EU, or both) and close the resulting gaps — see `06-compliance-gap-analysis.md`.

## Major compliance concerns

- **No privacy policy, data-retention limit, or account-deletion mechanism found** in the current build — this is a gap regardless of which specific privacy law ends up applying.
- **Some candidate-profile fields collected (religion, marital status, nationality) are more sensitive than a typical job portal needs** — worth a product/legal conversation about whether all of them are necessary, independent of any security fix.
- Card payment data never enters this system, which is a real positive for regulatory scope — but this should be confirmed formally with the payment processor's own compliance documentation rather than taken as this audit's final word.

## Important limitations of this review

- This was a **code review, not a live penetration test** — nothing was actually attacked or exploited against a running system, in line with the safety boundaries you set. A few findings (particularly the file-upload one, #4) are flagged as needing a quick live test to confirm real-world impact.
- This review had **no access to your actual Vercel/Render/Supabase account settings** — some questions (exact production configuration, backup policies, access permissions on your hosting accounts) simply can't be answered from the code alone and are listed out in `10-open-questions.md`.
- This is a **technical readiness assessment for privacy/compliance topics, not a legal opinion** — anything flagged as needing "qualified legal counsel" should go to an actual lawyer before you rely on it.

## Where to go next

- **`04-findings.md`** — every finding above, with exact file/line evidence and suggested fixes.
- **`07-remediation-roadmap.md`** — the same items organized into a punch list with effort estimates.
- Nothing has been changed in your code yet. Per the audit's rules, the next step is your review and approval before any fix is applied.
