# Open Questions

Information this audit could not obtain from the repository alone. Answering these would sharpen or potentially change some findings' severity/confidence.

## Infrastructure / runtime (would require live/dashboard access, not performed per the audit's safety rules)

1. **Does Supabase Storage send `X-Content-Type-Options: nosniff` on signed-URL responses?** This directly determines whether SA-04 (KYB document MIME spoofing) is a live browser-executable risk or a contained one. Needs a live check (fetch a signed URL's response headers), not something derivable from this repo.
2. **What are the actual current production environment variables** (`ALLOWED_ORIGINS`, `COOKIE_DOMAIN`, etc.) on Render/Vercel right now? `render.yaml` is confirmed stale (SA-14) — the real values could make SA-01 either better or worse than assessed (e.g., if `ALLOWED_ORIGINS` in production is narrower than the regex fallback suggests, or if the regex is the *only* thing currently allowing the real frontends to work because the exact-match list was never updated after the 3-domain Vercel split).
3. **Supabase Row-Level-Security status** — confirmed not architecturally relevant (app uses Prisma with a service credential, not client-side Supabase SDK calls), but worth a quick dashboard check to confirm RLS is at least enabled-and-permissive-by-default as defense-in-depth, in case any future feature adds direct client-to-Supabase calls.
4. **Actual IAM permissions** on the Supabase service-role key and any Render/Vercel deploy tokens — least-privilege was not verifiable from the repo.
5. **Backup encryption and restoration-testing status** for the Supabase Postgres database.
6. **Network isolation details for Render** — relevant to how much real internal-network access SA-05's SSRF finding could reach in practice.
7. **Whether HSTS is actually being sent** on the custom domain once configured (Vercel typically auto-injects it for HTTPS deployments, but not independently confirmed here since the custom domain isn't live yet per `PROGRESS.md`).

## Application behavior (would require a runtime test in a safe/staging environment)

8. **Does `POST /api/auth/change-password` invalidate existing refresh tokens?** Not confirmed in this review — if an attacker has stolen a refresh token (e.g., via SA-01 before it's fixed) and the victim changes their password in response, does that actually lock the attacker out, or does the stolen refresh token remain valid until its natural 7-day expiry? This materially affects incident-response guidance.
9. **Is there any account lockout after repeated failed login attempts against a single account** (as opposed to the confirmed per-IP rate limit)? Relevant to credential-stuffing resilience.
10. **Username/email enumeration via response timing or message differences** on login/register/forgot-password — not fuzz-tested in this review.
11. **What does Resend's API actually do with a subject line containing embedded CRLF sequences?** SA-13's email-subject-injection note is rated Low/theoretical specifically because this wasn't verified against Resend's real behavior.
12. **Live behavior of `AbortSignal.timeout` and connection handling under Render's free-tier constraints** for SA-08 (resume parsing DoS) — theoretical resource-exhaustion risk, not load-tested.

## Business / product / legal (not code questions)

13. **What user geography does the platform actually target and currently serve?** Directly determines which of GDPR / Saudi PDPL / CCPA applies (see `06-compliance-gap-analysis.md`). Needs a legal/product answer, not a code answer.
14. **Is there a privacy policy, terms of service, or DPA already published on the live site** that simply isn't in this repo (e.g., hosted as a separate static page or third-party doc)? The repo search found no `PrivacyPolicy`/`Terms` component beyond `frontend/src/pages/public/Terms.jsx` (found in an earlier grep) — worth confirming its actual content covers data processing, not just usage terms.
15. **What is the intended data-retention period for candidate PII, resumes, and rejected/withdrawn employer KYB documents?** Needed before implementing the retention/deletion work in the remediation roadmap.
16. **Is there an existing incident-response contact/process outside the repo** (e.g., a runbook in a wiki, a designated security contact)? Not found in-repo; may simply live elsewhere.
17. **Product intent on SA-07** (suspended employer + pending job approval) — should the admin approval be blocked outright, or should it auto-reject the pending job when the employer is suspended? Needs a product decision before the fix ships.
18. **Product intent on the refund double-submission fix (SA-06)** — should a second refund request on the same invoice be silently rejected, merged into the existing request, or surfaced as an error to the employer?

## Scope boundaries of this audit (explicitly not performed, per the authorization rules given)

19. No live requests were sent to any production URL.
20. No penetration testing, fuzzing, or exploit execution was performed against a running instance — all findings are static-analysis/code-review-derived, several explicitly marked "requires runtime verification" for exactly this reason.
21. No review of GitHub repository settings (branch protection, required reviewers, secret-scanning enablement, collaborator access list) was possible from within the repo checkout itself.
22. No review of the actual live Vercel/Render/Supabase dashboard configuration, billing, or access-control lists.
