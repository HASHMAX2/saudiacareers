# Build spec — Manara (Gulf job portal)

> Hand this file to Claude Code **together with** `manara-dashboard.html`.
> The HTML is the visual source of truth. This document is the engineering brief.
> Rename "Manara" to the real brand once chosen — it's a placeholder.

---

## 0. How to use the two files

- `manara-dashboard.html` is a **working static mockup of the candidate dashboard**. Treat it as the design spec: extract the palette (the CSS custom properties in `:root`), the fonts (Plus Jakarta Sans / Inter / IBM Plex Mono), the spacing, and the component markup from it. **Do not redesign it.** Port its look faithfully into the real component system.
- This document defines the stack, structure, data model, business rules, and build order. Follow it in phases; don't scaffold everything at once.
- Before writing code, confirm the stack (Section 2) with me if you'd change anything. Otherwise proceed with the defaults.

## 1. What we're building

A job portal focused on **Gulf countries** (UAE, KSA, Qatar, Oman, Bahrain, Kuwait). Two sides:

- **Candidates** register, build a profile, search/filter jobs, and apply directly. Optionally pay a flat fee for **premium visibility** (featured profile / spotlight).
- **Employers** register, pass verification, pay a **subscription** to post jobs, and see + contact applicants **themselves**.

The candidate dashboard in the mockup is the flagship logged-in screen. Everything else supports it.

## 2. Stack (default — swap only if I say so)

- **Frontend + backend:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS. Port the mockup's CSS variables into `tailwind.config` as theme tokens (colors, fontFamily, radius). Keep the exact hex values from the mockup.
- **DB + ORM:** PostgreSQL + Prisma
- **Auth:** NextAuth (email/password + session) with two roles: `CANDIDATE`, `EMPLOYER` (+ `ADMIN` later)
- **Payments:** Dodo Payments (integrate in **test mode** only for now — do not wire live payouts). Abstract it behind a `payments/` module so the provider can be swapped.
- **Deployment target:** assume Vercel + a managed Postgres; keep it env-var driven.

Rationale: full-stack in one repo, fast to build, well-supported. If you strongly prefer a different stack, propose it in one line before scaffolding.

## 3. Project structure (guide, not gospel)

```
/app
  /(marketing)        landing / about (later)
  /(auth)             login, register (candidate + employer)
  /dashboard          candidate "My Home" (the mockup)
  /jobs               search results
  /jobs/[id]          job detail
  /companies/[id]     company page
  /employer           employer console (post job, manage listings, view applicants)
  /api/...            route handlers
/components
  /ui                 primitives: SectionShell, Carousel, EmptyState, StatCard, LogoTile, Badge, Button
  /job                JobCard, JobList, JobFilters
  /company            CompanyCard, CompanyHeader
  /dashboard          ProfileCard, VisibilityChart, Poll, CareerTips, TopEmployers
  Nav.tsx  Footer.tsx
/lib                  db, auth, payments, kyc
/prisma               schema + seed
```

## 4. Build the reusable components FIRST

The mockup repeats a small set of primitives. Build these once, before any page, and compose pages from them (they recur across dashboard, search, job detail, company page):

- **SectionShell** — white card + title + optional "View all" link (wraps almost every module).
- **JobCard** — logo/monogram, title, company, experience, location, posted date, featured badge, save button. The single most reused unit; get it right.
- **Carousel** — horizontal scroll rail with left/right arrows that disable at the ends. Used by jobs, career tips, companies.
- **LogoTile / monogram** — company logo cell (fallback to initials on a tinted background, exactly like the mockup).
- **StatCard** — label + big mono number (messages, applied, search appearances, employer actions).
- **EmptyState** — icon + heading + one line + a CTA link (see Section 7).
- **Nav** and **Footer** — shared across all pages.

## 5. Pages / routes to build (in order — see Section 9 for phasing)

1. **Candidate dashboard** (`/dashboard`) — rebuild the mockup with live-ish data. Modules: profile card + completion, "jobs based on profile" (tabbed: Applies / Profile / Alerts), quick-action cards, top employers grid, career tips, companies hiring, featured employers/consultants, reminder banner, boost/services, app-download, sidebar visibility chart, FAQ, poll.
2. **Job search** (`/jobs`) — filters (keyword, location, category, experience), paginated results using `JobCard` in list layout.
3. **Job detail** (`/jobs/[id]`) — full description + **Apply** button (creates an Application). Show similar jobs.
4. **Company page** (`/companies/[id]`) — header (logo, name, description, location/industry/type chips), tabs Overview / Jobs, its open roles as `JobCard`s, a "Similar companies" sidebar.
5. **Auth** (`/login`, `/register`) — candidate and employer registration flows.
6. **Employer console** (`/employer`) — post a job (blocked until verified), manage listings, **view all applicants for each job** and their contact info.

## 6. Data model (Prisma entities)

- **User** — id, email, passwordHash, role (`CANDIDATE`|`EMPLOYER`|`ADMIN`), createdAt.
- **CandidateProfile** — userId, fullName, headline, currentCompany, location, totalExperience, keySkills[], hasPassport (boolean only — **never store passport numbers or IDs**), photoUrl?, completionPct, isPremium (visibility flag), premiumUntil?.
- **Company** — id, ownerUserId, name, description, industry, location, companyType, logoUrl?, kycStatus (`PENDING`|`VERIFIED`|`REJECTED`), isFeatured.
- **Job** — id, companyId, title, description, category, location (Gulf country/city), minExp, maxExp, salaryRange?, isFeatured, status (`DRAFT`|`LIVE`|`CLOSED`), postedAt. **A job only goes LIVE if its company is VERIFIED.**
- **Application** — id, jobId, candidateId, status, appliedAt. (Visible to the employer for that job.)
- **JobAlert** — id, candidateId, query, location, frequency.
- **Message** — id, fromUserId, toUserId, jobId?, body, readAt.
- **BlogPost** — career-tips content (title, excerpt, body, coverColor/img, views, publishedAt).
- **Poll / PollVote** — question, options[], votes.
- **Subscription / Order** — employer job-posting plan; candidate premium purchase. Provider = Dodo (test mode). Store status only; no card data.

Seed the DB (Section 8) so the dashboard looks alive in dev.

## 7. Empty states are mandatory (the day-one problem)

The mockup looks full because it assumes a mature platform. On launch there are **zero jobs, zero employers, "00" everywhere**. Every module that lists data must ship a deliberate empty/seed state, in the product's voice (sentence case, active, an invitation — not an apology). Examples already in the mockup:

- Applies tab → "No applications yet. When you apply to a job, it shows up here."
- Alerts tab → "No job alerts yet. Create one and we'll send matching Gulf roles to your inbox."
- Recommendations with an incomplete profile → "Complete your profile to see roles matched to you."
- Messages/Applied at zero → keep the `00` styling, don't hide the card.

Build every list component to render an `EmptyState` when its data is empty. Do not let a data-less dashboard look broken.

## 8. Seed data

Reuse the arrays already in the mockup's `<script>` (JOBS, EMPLOYERS, POSTS, COMPANIES, FEAT_EMP, FEAT_CON) as your Prisma seed source. Use **fictional/generic company names** and monogram logos — do not scrape or embed real brand logos. Add ~3 candidate accounts, ~6 verified employer companies, ~15 live jobs across Gulf cities, a few blog posts, and one poll.

## 9. Phased build order

1. **Phase 1 — foundation:** scaffold Next.js + Tailwind (tokens from mockup) + Prisma schema + seed. Build Nav, Footer, and the Section 4 primitives. No auth logic yet — just render.
2. **Phase 2 — candidate dashboard:** rebuild the full mockup at `/dashboard` from seeded data, with all empty states. This is the milestone that proves the design port.
3. **Phase 3 — jobs:** search, filters, job detail, apply flow (Application records).
4. **Phase 4 — company page.**
5. **Phase 5 — auth + roles:** candidate/employer register + login; gate the dashboard and employer console.
6. **Phase 6 — employer console:** post job (verification-gated), manage listings, view applicants.
7. **Phase 7 — payments (test mode):** employer subscription + candidate premium via Dodo test mode, behind the `payments/` abstraction. No live payouts.

Stop after each phase and show me what runs before continuing.

## 10. Business rules to ENFORCE in code (not optional — these keep the platform legally clean)

These come from the product's regulatory shape. Build them in; don't let features drift across these lines.

1. **Employers see and contact applicants themselves.** The platform must NOT shortlist, vet, rank, or forward candidates to a specific employer on the employer's behalf. Applicants for a job are simply listed to that job's verified employer. (This is what keeps us a job board, not a licensed recruiting agent.)
2. **No per-hire / success / placement fees anywhere.** Revenue is only: employer subscription (flat, for posting access) and candidate premium (flat, for visibility). Never tie any charge to whether someone gets hired.
3. **Candidate premium = visibility only.** Copy and features must frame it as "get seen / featured," never as "improves your chance of a job" or "guaranteed placement."
4. **Employer KYC gate.** A company's jobs cannot go LIVE until `kycStatus === VERIFIED`. Add a report/flag action on job listings.
5. **Minimal sensitive data.** Store `hasPassport` as a boolean at most. Never collect or store passport numbers, national IDs, or visa document numbers. 
6. **Consent + privacy.** Registration must capture explicit consent and link a privacy policy written to cover India's DPDP Act + Saudi PDPL + UAE data law. Provide a "delete my data" path for candidates.

## 11. Quality floor

- Responsive: two-column desktop → stacked on tablet/mobile, carousels become horizontal scroll (mirror the mockup's breakpoints).
- Accessible: visible keyboard focus, alt text, ARIA on tabs/carousels, `prefers-reduced-motion` respected.
- Type-safe: no `any` in shared code; Prisma types flow through.
- Sentence case everywhere in UI copy; active voice; no "click here."

## 12. Theme

Before writing a single line of code, look at any existing files in this project — logo, brand guide, color palette, existing pages, or any assets the user has dropped in. Extract the real brand colors, fonts, and visual style from those files and use them throughout. If nothing exists yet, ask the user one question: "What's your brand name and color direction?" Do not default to the mockup's blue palette if the project has its own identity. The mockup defines the *layout and components*; the project's own theme defines the *colors, fonts, and feel*.

## 13. What NOT to do

- Don't redesign the visual language — port it from the mockup.
- Don't use real company logos or trademarked brand assets.
- Don't wire live payment payouts yet (test mode only).
- Don't build a shortlisting/forwarding feature for employers (rule 1).
- Don't collect passport/ID numbers (rule 5).
- Don't over-scaffold — respect the phase order and check in between phases.

---

### First reply I want from Claude Code

A one-screen plan: confirmed stack, the exact Tailwind color tokens you extracted from the mockup, the Prisma schema draft, and the Phase 1 file list — before you start generating the app.
