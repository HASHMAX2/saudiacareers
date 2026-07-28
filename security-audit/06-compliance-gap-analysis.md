# Compliance & Privacy Gap Analysis

**Scope note:** This is a technical readiness/gap assessment based on repository evidence only. It is **not** a legal compliance opinion. Items requiring qualified legal counsel are explicitly marked. No formal certification is claimed or implied for any framework below.

## Applicability

- **GDPR:** Potentially applicable if any EU/EEA candidates or employers use the platform, or given the database now lives in Frankfurt (EU) — data residency alone doesn't trigger GDPR, but processing EU residents' data does. **Legal question: confirm target user base's geography with counsel** — `CLAUDE.md` states the target market is Saudi Arabia, which would primarily implicate Saudi PDPL, not GDPR, unless EU users are in scope.
- **Saudi Personal Data Protection Law (PDPL):** Likely the primary applicable framework given the stated target market. Not deeply assessed here — flagged as a **legal question requiring qualified counsel familiar with Saudi PDPL**, since this audit's frameworks knowledge is strongest for GDPR/CCPA/SOC2/PCI.
- **CCPA/CPRA:** Applicable only if California residents are processed at qualifying volume — no evidence in the repo of a California-specific user base; flagged as unlikely but not confirmed.
- **PCI DSS:** Card data never enters, is stored by, or is proxied through this application — Dodo Payments (a PCI-compliant gateway) handles all cardholder data; `EmployerPaymentMethod` stores only a gateway reference ID, card brand, and last-4 (all non-sensitive per PCI DSS scoping rules). **This significantly minimizes PCI scope by design — a genuine positive control**, likely qualifying for SAQ-A-level scope (no cardholder data environment) but this should be confirmed with Dodo's own compliance documentation, not assumed.
- **SOC 2 / ISO 27001:** Not currently pursued (no evidence of either in the repo); assessed here as a technical-readiness baseline only, useful if the business later pursues either.

## Privacy readiness

| Area | Status | Evidence |
|---|---|---|
| Privacy notice | **Missing / not found in repo** | No `PrivacyPolicy` page found in `frontend/src/pages` during this review; not independently confirmed absent from the live site (repo may not be the source of truth for static legal pages) |
| Legal basis for processing | **Not documented** | No consent-capture mechanism found (e.g., no explicit checkbox/consent field on registration schemas) |
| Consent withdrawal | **Not applicable / not built** | No marketing-consent or cookie-consent mechanism found |
| Data minimization | **Partially observed, worth revisiting** | `CandidateProfile` collects religion, marital status, visa status, nationality, date of birth — these are unusually broad fields for a job portal MVP and several (religion, marital status) are categories many jurisdictions treat as sensitive/special-category data. **Recommend product review of whether all of these are actually necessary**, independent of any code fix. |
| Purpose limitation | Not assessed — requires the (unavailable) privacy notice to compare against actual data use |
| Retention schedule | **Not implemented** | No TTL/expiry/automatic-deletion logic found for candidate PII, resumes, or KYB documents. Soft-delete (`isDeleted`) exists for jobs but there's no equivalent for user accounts or documents once no longer needed. |
| User data-access/export request | **Not implemented** | No "export my data" endpoint found |
| Data correction | **Partially implemented** | Candidates can edit their own profile via `PUT /api/profile`; no equivalent self-service correction for employer KYB documents (would require a new upload, which does exist) |
| Account deletion | **Not implemented** | No account-deletion endpoint found for candidates or employers — data lives indefinitely once created |
| Data portability | **Not implemented** | No structured export mechanism |
| Marketing consent | N/A — no marketing emails found beyond transactional (welcome, password reset, application/status) |
| Cookie consent | **Likely not applicable** — the only cookie set is the functional httpOnly refresh-token cookie (strictly necessary for authentication), which under most frameworks (GDPR ePrivacy included) does not require consent banners since it's essential, not tracking/marketing |
| Cross-border transfers | Data now resides in Frankfurt (Supabase) per `PROGRESS.md`; Resend/Anthropic/Dodo are third-party processors whose own data-residency needs to be confirmed against their DPAs — **not verifiable from this repo** |
| Subprocessor inventory | Identifiable from code: Supabase (DB + storage), Resend (email), Dodo Payments (billing), Anthropic (AI parsing), Vercel/Render (hosting) — **no formal subprocessor list/DPA tracking found in the repo**, which is expected (this would live in a legal/ops system, not code) |
| Children's data / age restrictions | **No age-gate found** on candidate registration — job portals implicitly assume working-age users but nothing enforces this |
| Breach-notification readiness | **Not assessed** — no incident-response documentation found in the repo (see `10-open-questions.md`) |
| Automated decision-making / profiling | `jobLegitimacyService` auto-flags jobs for review — this is automated decision-making about *employer* content, not directly about a data subject's rights in the GDPR Article 22 sense, but worth flagging if the business later adds candidate-scoring/ranking features |
| Sensitive employment data handling | Resumes/KYB documents are private-bucket, signed-URL-only, server-mediated — a solid technical control, but the retention gap above still applies |

## GDPR readiness (if applicable — legal confirmation needed)

| Requirement | Status |
|---|---|
| Controller/processor roles defined | Not documented in repo (legal/contractual artifact) |
| Records of Processing Activities (ROPA) | Not found |
| Data Subject Rights (access, rectification, erasure, portability, objection) | Partially technically supportable (access/rectification exist for candidates via profile edit) but no dedicated endpoints; erasure/portability entirely missing |
| DPIA (Data Protection Impact Assessment) | Not found — recommend one given the sensitive-category fields noted above (religion, marital status) |
| International transfer safeguards (SCCs etc.) | Legal/contractual, not assessed here |
| Security of processing (Art. 32) | Technical controls are generally strong (encryption in transit via TLS, private storage, hashed passwords/tokens) — encryption *at rest* for the database itself depends on Supabase's platform-level guarantee, not app-level, and wasn't independently verified |
| Breach notification (72hr) | No documented process found |

## Saudi PDPL readiness

Not deeply assessed — **flag for qualified Saudi-law counsel.** Notable technical facts relevant to whoever performs that assessment: primary database now resides in the EU (Frankfurt), not Saudi Arabia, which may have specific PDPL data-localization implications depending on current regulations and any exemptions/approvals — this is a legal question, not a code finding, but is directly relevant given `PROGRESS.md`'s region-migration history.

## SOC 2 / ISO 27001 technical readiness (informational baseline, not a certification assessment)

| Control area | Status | Type |
|---|---|---|
| Access control | Role-based, consistently enforced server-side (see `05-authorization-matrix.md`) | Technical — good |
| User provisioning/deprovisioning | Candidate/employer self-service signup; admin accounts are seeded manually (no self-registration) — but no account-deactivation/offboarding flow found for any role | Technical + Operational gap |
| Privileged access management | No MFA on admin accounts; no distinct "break-glass"/emergency-access procedure found | Technical gap |
| Change management | No CI/CD, no required PR review enforced in-repo, no branch protection visible from the repo alone | Technical + Governance gap |
| Vulnerability management | No automated dependency/SAST scanning; this audit found two patchable CVEs via manual `npm audit` | Technical gap |
| Secure development | Good conventions documented in `CLAUDE.md` (Zod validation, `ApiError`/`asyncHandler`, no raw SQL) and largely followed in practice | Technical — good, but not automatically enforced |
| Incident response | No IR plan/runbook found in repo | Documentation gap |
| Logging and monitoring | No structured audit log for admin actions; no centralized log aggregation/alerting visible from the repo (may exist at the platform level — not verifiable here) | Technical + Evidence gap |
| Backup and recovery | Not assessed — platform-level (Supabase), not verifiable from repo; `PROGRESS.md` mentions old Sydney project paused (not deleted) as an ad hoc rollback buffer, which is not a formal backup/DR policy | Operational gap |
| Vendor risk management | Third-party list is identifiable (Supabase, Resend, Dodo, Anthropic, Vercel, Render) but no formal vendor-risk-assessment record found | Governance gap |
| Risk assessments | This audit is effectively the first formal one on record in the repo | Governance — now partially addressed by this document |
| Security awareness / policy management | No security policy documents found in the repo | Documentation gap |
| Asset management | Implicit via the codebase/schema; no formal asset inventory doc | Documentation gap |
| Encryption / key management | TLS in transit (platform-level); secrets managed via platform env vars, not in repo (good); no evidence of key-rotation procedure for JWT secrets or the Supabase service key | Technical + Operational gap |

## PCI DSS scope determination

Cardholder data (PAN, CVV, full track data) is never received, transmitted, processed, or stored by this application's own code or database — confirmed via schema review (`EmployerPaymentMethod` stores only `gatewayPaymentMethodId`, `cardBrand`, `cardLast4`, expiry month/year) and via the billing-controller review (no raw card fields ever appear in any request/response payload traced during this audit). Dodo Payments' hosted checkout/payment-method-update flows are the only place card data is entered, and they redirect/host that collection themselves. **This architecture likely keeps the application out of full PCI DSS scope (SAQ-A-eligible pattern)** — confirm the exact SAQ type with Dodo's compliance documentation and, ideally, a PCI QSA, since this audit is a code review, not a formal PCI assessment.
