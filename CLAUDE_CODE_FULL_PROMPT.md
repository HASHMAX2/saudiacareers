# Manara — Full Build Prompt for Claude Code

You have two files in front of you:
1. `manara-dashboard.html` — the visual mockup of the candidate dashboard. This is the design source of truth.
2. `CLAUDE_CODE_BUILD_PROMPT.md` — the engineering spec. Read both fully before writing a single line of code.

---

## Step 0 — Theme first (do this before anything else)

Look at every file already in this project folder — logo, brand assets, color palette, any existing pages or CSS. Extract the real brand name, colors, and fonts from those files and apply them throughout the entire build. Do NOT use the mockup's blue palette as-is if the project has its own visual identity. If you find nothing, ask me one question: "What is your brand name and color direction?" Then wait for my answer before proceeding. The mockup defines layout and components. The project's own theme defines colors, fonts, and feel.

---

## Step 1 — Read the spec fully

Read `CLAUDE_CODE_BUILD_PROMPT.md` completely. It covers:
- Stack (Next.js + TypeScript + Tailwind + Prisma + PostgreSQL + NextAuth + Dodo Payments)
- Project structure
- Data model
- Business rules (these are non-negotiable — they are legal guardrails)
- Phase order
- Quality floor

Follow the spec exactly. If you disagree with any part, say so in your plan before building.

---

## Step 2 — Plan before you build

Before writing any code, reply with a one-screen plan that includes:
- Confirmed stack
- Color tokens you extracted from the project theme (or the mockup if no theme exists)
- Prisma schema draft (all entities)
- Phase 1 file list
- Any questions you have

Wait for my approval before proceeding.

---

## Step 3 — Build the complete application

Build the full portal end to end, following the phase order in the spec. Do not skip phases. Stop after each phase and show me what runs.

### What to build

#### Frontend pages
1. **Candidate dashboard** (`/dashboard`) — full rebuild of the mockup with live data from the database. Every single module must be functional: job recommendations, tabs (Applies / Profile / Alerts), action cards with real counts, top employers grid, career tips, companies hiring, featured employers/consultants, reminder banner, boost/services section, app download section, sidebar profile card with completion percentage, visibility chart, FAQ, and the opinion poll.
2. **Job search** (`/jobs`) — keyword search + filters (location, category, experience range, salary range, featured only). Paginated results using the JobCard component. URL-driven filters so results are shareable/bookmarkable.
3. **Job detail** (`/jobs/[id]`) — full job description, company info, apply button (creates an Application record), similar jobs in a sidebar.
4. **Company page** (`/companies/[id]`) — company header with logo, name, description, location/industry/type chips, tabs for Overview and Jobs, all open roles as job cards, similar companies sidebar.
5. **Candidate registration** (`/register/candidate`) — name, email, password, country, consent checkbox (privacy policy + DPDP/PDPL compliance).
6. **Employer registration** (`/register/employer`) — company name, email, password, country, consent checkbox.
7. **Login** (`/login`) — shared for both roles, redirects to respective dashboard.
8. **Employer console** (`/employer`) — post a job (gated: only if KYC verified), manage existing listings (edit/close), view all applicants for each job with their contact info and profile link. Employers contact candidates directly — the platform never intermediates.
9. **Admin panel** (`/admin`) — basic: verify/reject employer KYC, manage featured listings, view platform stats.

#### Backend — build every API route needed to power the above UI

Build API routes / server actions for every piece of data the frontend uses. Nothing in the UI should be hardcoded or seeded-only after Phase 2. Specific backend requirements:

- **Auth:** register, login, logout, session management, role-based route protection.
- **Jobs:** CRUD (employer), search + filter + paginate (public), apply (candidate), save/unsave (candidate), get recommended jobs for a candidate based on their profile skills and experience.
- **Companies:** CRUD (employer), public company page, KYC status management (admin).
- **Applications:** create (candidate applying), list by job (employer), list by candidate (candidate's "My Applications").
- **Candidate profile:** create/update, calculate and store completion percentage, set premium/spotlight status.
- **Employer profile:** create/update, KYC status flow.
- **Messages:** send (employer to candidate or candidate to employer), inbox, read/unread status.
- **Job alerts:** create, list, delete, trigger matching on new job post.
- **Blog/Career tips:** list, single post, view count increment.
- **Poll:** get active poll, submit vote, return results with percentages.
- **Visibility stats:** search appearances and employer actions — increment when an employer views/actions a candidate profile. Return weekly trend data for the chart.
- **Payments (Dodo, test mode):** employer subscription checkout, candidate premium checkout, webhook handler for status updates. Store subscription/order status only. No live payouts yet. Abstract behind a `lib/payments/` module.
- **Notifications:** bell icon count, mark as read, list recent notifications.
- **Featured listings:** admin can mark employers/jobs as featured; these surface at the top of grids.
- **Report/Flag:** candidates and employers can flag suspicious listings. Store flags for admin review.

---

## Step 4 — Company logos (important)

Every company name that appears in the UI — in the top employers grid, companies hiring carousel, featured employers list, featured consultants list, job cards, company pages, anywhere — must have a real logo sourced from the internet.

**How to source logos:**
- Use Clearbit Logo API: `https://logo.clearbit.com/{domain}` — this returns the real company logo by domain name. Example: `https://logo.clearbit.com/apple.com`.
- For each company in the seed data and any company that registers on the platform, attempt to resolve a logo from Clearbit using the company's website domain (store the domain on the Company model).
- If a logo cannot be resolved (Clearbit returns a 404 or the domain is unknown), fall back to the initials/monogram tile already designed in the mockup (colored background + bold initials). Never show a broken image.
- In the Company model, store: `logoUrl` (the resolved Clearbit URL or null), `websiteDomain` (used to build the Clearbit URL). Render logos with `<img src={logoUrl} onError={fallbackToMonogram} />`.
- For the seed data companies (Al Noor Group, Gulf Peak, Meridian Health, Falcon Technologies, Cedar Hospitality, Blue Harbor, Zenith Financial, Oryx Digital, and the rest) — use real Gulf-based company equivalents where possible, or fictional companies with a known domain where Clearbit works. Document which ones fall back to monograms.

---

## Step 5 — Reusable components (build these first, before any page)

Extract and build these as standalone components before building any page:

- `SectionShell` — white card + section title + optional "View all" link
- `JobCard` — logo/monogram, job title, company name, experience, location, posted date, featured badge, save toggle button
- `Carousel` — horizontal scroll rail with arrow buttons that disable at scroll ends
- `LogoTile` — company logo with Clearbit source + monogram fallback
- `StatCard` — label + large monospace number
- `EmptyState` — icon + heading + one descriptive line + a CTA link (every list renders this when empty)
- `Nav` — with notification badge, user pill, mobile hamburger
- `Footer`
- `TabGroup` — accessible tabs with ARIA
- `Badge` — featured / premium / new / verified variants
- `ProgressBar` — for profile completion

---

## Step 6 — Empty states (mandatory for every list)

Every module that displays data must also render a proper EmptyState when that data is empty. Examples:
- Applies tab (0 applications) → "No applications yet. Apply to a job and track it here."
- Alerts tab (0 alerts) → "No job alerts. Create one and we'll match Gulf roles to your inbox."
- Recommendations (incomplete profile) → "Complete your profile to see roles matched to you."
- Messages (0) → "No messages yet. Employers will reach out here."
- Employer applicants (0) → "No applications yet for this role. Share the listing to get more visibility."

Never let a zero-data state look broken or empty-page. It should always tell the user what to do next.

---

## Step 7 — Business rules (non-negotiable, enforce in code)

These are legal guardrails. Build them as hard constraints, not suggestions:

1. A job goes LIVE only if the employer's `kycStatus === 'VERIFIED'`. Gate this at the API level.
2. Employers view all applicants directly. The platform never shortlists, ranks, or forwards candidates on the employer's behalf. The applicant list is a flat list with profile links and contact details.
3. No feature, copy, or charge can be tied to whether a candidate gets hired. Candidate premium = flat fee for visibility only.
4. Never collect or store passport numbers, national ID numbers, or visa document content. Store `hasPassport: boolean` at most.
5. Candidate registration must include a consent checkbox linking to a privacy policy covering DPDP (India), PDPL (Saudi Arabia), and UAE data law.
6. Provide a "Delete my account and data" option in candidate settings. It must wipe all personal data.
7. Every job listing must have a "Report this listing" option. Reports are stored and visible to admin.

---

## Step 8 — Seed data

Seed the database with enough data to make the dashboard feel real during development:
- 3 candidate accounts (varying profile completion: 40%, 64%, 90%)
- 8 employer companies across UAE, KSA, Qatar, Oman (mix of verified and pending KYC)
- 20 live job listings across Gulf cities, various categories (IT, healthcare, engineering, finance, hospitality)
- 6 blog/career-tips posts (use the titles already in the mockup)
- 1 active poll with 5 options and vote counts
- Featured employer and consultant lists

---

## Step 9 — Quality floor (every page, no exceptions)

- Fully responsive: two-column desktop → stacked on tablet → single column mobile. Carousels become horizontal scroll on mobile.
- Accessible: visible keyboard focus rings, correct ARIA on tabs/carousels/modals, meaningful alt text on all images, `prefers-reduced-motion` respected.
- Type-safe: no `any` in shared code. Prisma types flow through to components.
- All UI copy in sentence case, active voice. No "click here", no "successfully", no "please".
- Loading states on all async data (skeleton loaders, not spinners everywhere).
- Error states on all data fetches (don't silently fail).

---

## What NOT to do

- Do not redesign the visual layout — port it faithfully from the mockup.
- Do not use placeholder lorem ipsum in production seed data — use realistic Gulf job titles, real city names, real industry categories.
- Do not hardcode data in components after Phase 2 — everything comes from the database.
- Do not wire live Dodo payouts — test mode only.
- Do not build a shortlisting/forwarding feature for employers (legal rule #2).
- Do not collect passport or ID numbers (legal rule #4).
- Do not proceed past Phase 1 without showing me the plan and getting approval.

---

## First thing I want from you

A one-screen reply with:
1. Confirmed stack + any proposed changes
2. The theme/color tokens you found (or your one question if you found nothing)
3. Prisma schema draft
4. Phase 1 file list

Then wait for my go-ahead.
