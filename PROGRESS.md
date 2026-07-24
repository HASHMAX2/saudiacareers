# SaudiaCareers Project Progress

Last updated: July 24, 2026 (suspended-employer login/post behavior change)

Future sessions must read both `CLAUDE.md` and this file before coding.

## Current Checkpoint

Current branch: `billing_and_payment` (branched from `employer-v2` tip `74badd2`).

- Pushed to GitHub, up to date with `origin/billing_and_payment`.
- Commits on this branch beyond `employer-v2`: `8e75f4b` (employer job-revision workflow, AI import improvements, admin/auth UI fixes), `7a8cebe` (employer verification banner, multi-document upload, support requests), `13b06f8` (employer verification queue, document replace, admin nav fixes), `640489b` (employer billing rebuild with real Dodo Payments integration), `399410b` (nav polish, remember-me on all logins), `db118e8` (cross-portal auth fixes + lazy loading), `d525e9f` (numbered pagination, seed test jobs), plus this session's suspended-employer login/post change — see session section at the bottom of this file.
- `main` is **behind** this branch and does not have any of the employer-v2, billing, or this-session work — `main`'s Vercel/Render deployments (if still referenced anywhere) are stale relative to what's actually live now (see Live URLs below, which are **not** the `main`-branch deployments).
- Not yet independently verified this session: the Dodo Payments integration internals (`640489b`) — inherited from a prior session, not re-audited here.

## Live URLs — READ THIS BEFORE ASSUMING ANYTHING IS STALE

Production infrastructure was migrated **today** from Oregon (Render) + Sydney (Supabase) to **Frankfurt** for both, after discovering the original combination added 2-6 seconds of latency per database query. Old resources are paused, not deleted, as a rollback buffer.

| Service | Current (live) | Old (paused, not deleted) |
|---|---|---|
| Backend (Render) | `https://saudiacareers-frankfurt.onrender.com` (Frankfurt) | `https://saudiacareers-1.onrender.com` (Oregon) — **suspended** |
| Database + Storage (Supabase) | project ref `jywlkcaovyasgkgxkdun`, region `eu-central-1` (Frankfurt) | project ref `slrqzvqwqrskbglptasj`, region `ap-southeast-2` (Sydney) — **paused** |
| Frontend — candidate (Vercel) | `https://saudiacareers-frontend.vercel.app` | — |
| Frontend — employer (Vercel) | `https://saudiacareers-employer.vercel.app` (new project this session) | — |
| Frontend — admin (Vercel) | `https://saudiacareers-admin.vercel.app` (new project this session) | — |
| Custom domain | Not yet configured (Hostinger DNS still pending — unchanged from before) | — |

All three Vercel projects share the same codebase (`frontend/`, root directory) and the same Render backend via `VITE_API_URL` — they are **not** separate frontend builds, just three deployments of one app with a client-side hostname check (`frontend/src/routes/PortalHome.jsx`) that redirects each domain's `/` to the right starting page. See this session's notes below for the full reasoning and what's still manual (DNS, full app-per-portal code split) vs. done.

**Old Supabase project org is on the free tier** — pausing was chosen over deleting specifically so the old data/schema can still be inspected if anything looks wrong with the migration; delete it once you're confident (was explicitly deferred by user request, not a technical blocker).

## Deployment Status

- Backend: Render, Frankfurt region, free tier — **not yet upgraded off free tier**, so it will still sleep after ~15 min of inactivity and cold-start 30-60s on the next request. This was explicitly flagged as a pre-launch blocker and deferred due to budget, not forgotten.
- Frontend: 3 Vercel projects (see table above), all building from `frontend/` with `vercel.json` SPA rewrite rules, all auto-deploying from `billing_and_payment` on push.
- Database: Supabase Postgres, Frankfurt, all migrations through `20260712180000_add_invoice_refund_link` applied. Local `backend/.env` also points at Frankfurt now (updated this session) — local dev and production use the same database.
- Supabase Storage bucket `SaudiaCareers` — private, migrated to the new Frankfurt project, verified working (25/25 files copied successfully, byte-identical).
- DNS (Hostinger → Vercel/Render) still not configured — using platform default URLs. See this session's "subdomain strategy" notes below for the recommended plan when this happens (candidate on root domain, `employer.` and `admin.` subdomains).
- Resend API key configured — domain `saudiacareers.com` verification still pending (unchanged from prior sessions).
- **53 job listings in the database are seeded test data**, not real postings (see this session's notes — added specifically for UI text-overflow testing, spanning all industries/statuses). Flag to the user before treating job counts as real usage data, and consider cleaning them out before a real launch.

## Completed

### Foundation and database

- npm monorepo with `backend` and `frontend` workspaces.
- Complete Prisma schema from `AGENTS.md`.
- Initial PostgreSQL migration under `backend/prisma/migrations/`.
- Manual seed for the default forced-password-change admin and two sample jobs.
- Prisma Client generation and schema validation.
- `.env.example` files for frontend and backend.
- Root README with setup, migration, seed, development, test, lint, and build commands.
- Docker PostgreSQL 16 container `saudia-postgres` is running on `localhost:5432`.
- Local database `saudiacareers` exists.
- Migration `20260619180000_init` was successfully applied with `prisma migrate deploy`.
- The manual seed completed successfully, creating/updating the default admin and adding sample jobs when needed.

### Backend security and architecture

- Express architecture with controllers, routes, middleware, services, validation, and utilities.
- Helmet, explicit-origin credentialed CORS, JSON limits, cookie parser, and centralized errors.
- Zod validation on all implemented JSON endpoints.
- Multer 2 memory uploads with backend MIME and size validation.
- bcrypt password hashing with 12 rounds.
- JWT access tokens and rotating database-backed refresh tokens.
- HTTP-only refresh cookie with secure production settings.
- Authentication, candidate/admin authorization, and forced admin password-change middleware.
- Rate limiting on all `/api/auth` routes.
- No raw SQL and no public resume/profile-photo URLs.

### Authentication

- Candidate registration with duplicate-email validation and welcome email.
- Candidate/admin login.
- Logout with refresh-token revocation.
- Refresh-token rotation.
- Forgot/reset password with hashed, one-hour, single-use tokens.
- Authenticated password change.
- Seeded admin forced password change.
- Frontend candidate/admin login, registration, forgot password, reset password, logout, and password-change forms.
- Public navbar includes clear candidate login and sign-up actions.
- Candidate login links to registration, and registration links back to candidate login.
- Zustand memory-only access-token storage.
- Axios credential handling, bearer injection, refresh queue, retry, and role-aware login redirect.

### Candidate profile and storage

- Get and update candidate profile.
- Profile completion percentage.
- Application-profile completion status.
- Private profile-photo upload, replacement, removal, and signed viewing URL.
- Private resume upload, replacement, removal, and one-hour signed download URL.
- PDF, DOC, and DOCX backend MIME validation with a 5 MB limit.
- Candidate profile UI for personal/professional fields, photo, resume, and password change.
- Candidate dashboard with completion and application totals.

### Public jobs

- Public active/non-deleted job listing.
- Search across title, company, and required skills.
- Location, industry, experience, and employment-type filters.
- Newest and deadline-soonest sorting.
- Ten-job default pagination.
- Public job detail.
- Closed-deadline calculation.
- Job cards and job listing/detail pages.
- Copy-link control.

### Applications

- Strict frontend checks for authentication, completed professional profile, uploaded resume, and duplicate application.
- Backend repeats all application checks.
- Database uniqueness prevents duplicate applications.
- Closed, inactive, deleted, and missing jobs cannot receive applications.
- Applications are created with `APPLIED` and `PENDING`.
- HR email is dispatched asynchronously with candidate details and resume attachment.
- HR email success/failure, sent time, and short error are persisted.
- Candidate “My Applications” API and UI.
- Status badges.

### Admin

- Admin dashboard metrics.
- Searchable/filterable admin job list.
- Create, retrieve, update, activate/deactivate, and soft-delete jobs.
- Application list with search and status/email filters.
- Application detail with signed resume link.
- Application status updates.
- Candidate status-update email.
- Filter-aware CSV export.
- Admin dashboard, job forms/list, application list/detail pages.
- Admin APIs are protected by authentication, admin authorization, and completed-password-change middleware.

### Email and storage services

- Resend service using environment credentials.
- Welcome, password reset, HR application, and application-status HTML templates.
- Supabase private upload, delete, download, and signed-URL service.
- No secret values are hardcoded.

### Production credentials and external services

- Supabase project `slrqzvqwqrskbglptasj` configured — `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` set in both `backend/.env` and Render environment.
- Supabase Storage bucket `SaudiaCareers` confirmed private and reachable.
- Prisma `schema.prisma` updated with `directUrl` field — `DATABASE_URL` uses transaction pooler (port 6543), `DIRECT_URL` uses direct connection (port 5432) for migrations.
- Production migration applied to Supabase via `prisma migrate deploy`.
- Production admin user seeded via `prisma db seed`.
- Resend send-only API key configured — domain `saudiacareers.com` verification pending in Resend dashboard.

### Deployment

- `render.yaml` added at repo root — Render web service, Node 20, Singapore region, build: `cd backend && npm install && npx prisma generate`, start: `cd backend && node server.js`, health check at `/api/health`.
- `frontend/vercel.json` added — SPA rewrite rule for React Router, immutable cache headers for hashed assets, security headers on all routes.
- `edit-job` branch merged into `main` — all 6 commits merged via fast-forward.
- Backend live at `https://saudiacareers-1.onrender.com` — health endpoint verified.
- Frontend live at `https://saudiacareers-frontend.vercel.app` — login verified working.
- CORS updated: regex patterns added to allow all `saudiacareers-frontend*.vercel.app` preview URLs automatically without env var changes per deploy.

### Profile save bug fixes (June 23, 2026)

- **Photo disappearing on save:** `save()` was calling `setProfile(data.data)` with the update response which does not include a fresh signed photo URL. Fixed by calling `await load()` after save to re-fetch the full profile including signed URL.
- **Spinner on save button:** Added inline animated spinner inside the Save Profile button while `saving` is true.
- **Scroll to top after save:** Added `window.scrollTo({ top: 0, behavior: "smooth" })` after successful save so the success alert is visible.

### Verification

The following pass:

```bash
npm test
npm run lint
npm run build
npm audit --omit=dev
npm run prisma:validate --workspace backend
```

Current automated test count: 7 passing tests covering auth, profile, and job validation.

### International mobile validation

- `authSchemas.js` and `profileSchemas.js`: mobile regex widened from Saudi-only `/^\+966\d{9}$/` to E.164 `/^\+\d{7,15}$/`, accepting any country code.
- `frontend/src/utils/validators.js`: `isSaudiMobile` renamed to `isValidMobile` with the matching regex.
- `Register.jsx`: import updated, empty-check fixed (`"+"` instead of `"+966"`), error message and hint text updated, default input value changed to `"+"`.
- `Profile.jsx`: import, label ("Mobile number"), and error message all updated to match.

### Profile upload UX fixes

- Photo and resume upload handlers now wrapped in `try/catch` — backend errors (e.g. Supabase not configured) are shown as a visible red alert instead of silently disappearing.
- Both upload buttons display a disabled "Uploading…" state during the request.
- File input value is reset after each attempt so the same file can be re-selected.
- Resume `<section>` moved inside the profile `<form>`, before the Save Profile button. The Save button is now a standalone row at the bottom of the form.
- Resume and photo delete buttons also have `try/catch` with visible error alerts.
- Download button has `try/catch` to surface signed-URL errors.
- `type="button"` added to all non-submit buttons inside the form to prevent accidental form submission.

### Axios 401 interceptor bug fix

- `frontend/src/api/client.js`: added a `hasSession` guard (`!!useAuthStore.getState().accessToken`) to the response interceptor.
- Previously, any 401 response — including a failed login attempt — triggered `refreshSession()`. Since no refresh cookie exists for a non-authenticated user, the refresh call failed with "Refresh token is required" and that error reached the UI instead of the original "Invalid email or password".
- The guard short-circuits the interceptor when there is no access token in Zustand memory. Authenticated users whose token expires mid-session still get the silent refresh-and-retry path because Zustand holds the old token until it is explicitly cleared.
- The existing `isRefreshRequest` guard is kept to prevent a loop when the refresh endpoint itself returns a 401.

### Backend server cold-start fix

- `server.js` now calls `await prisma.$connect()` before `app.listen()`, ensuring the Prisma connection pool is fully ready before the server accepts any requests. Previously the first request after a restart would fail with a "Network Error" because the pool was not yet established.

### Job API field stripping

- `frontend/src/api/admin.js` — added `pickJobFields()` that whitelists the 12 fields the backend `jobBody` schema accepts (`title`, `companyName`, `location`, `industry`, `employmentType`, `experienceRequired`, `salaryRange`, `description`, `requiredSkills`, `hrEmail`, `applicationDeadline`, `status`). Both `createJob` and `updateJob` pass through it, preventing extra database fields (`id`, `isDeleted`, `createdBy`, `createdAt`, `updatedAt`) from being sent in the request body.

### Frontend form validation

- `Input` component now renders a red `*` automatically when `required` prop is passed.
- `Register`: inline field errors matching backend `registerSchema` (name min 2/max 100, email format, mobile `/^\+966\d{9}$/`, password min 8 + uppercase + number).
- `ResetPassword`: inline password strength error before calling the API.
- `ChangePassword` (admin page): inline errors for both fields, "must be different" check mirroring the backend refine, and error display if the API call fails.
- `Profile > PasswordForm`: required marks, inline strength/differ validation, error and success states.
- `JobForm`: full `validateJob` function matching `jobBody` Zod schema (all required fields, description min 20, hrEmail format, max lengths), inline errors under each field including the description textarea.

### Responsive UI/UX redesign (first pass)

- Added a cohesive deep-green, white, and soft-gray visual system using Tailwind CSS.
- Improved shared typography, cards, spacing, shadows, form controls, focus states, buttons, badges, alerts, modals, toasts, spinners, and pagination.
- Added a sticky responsive navbar with a mobile menu and preserved all public/authenticated navigation.
- Expanded the footer with SaudiaCareers branding and useful candidate/admin links.
- Rebuilt the landing page with a responsive hero, search entry point, primary/secondary calls to action, candidate value cards, and profile CTA.
- Improved the jobs page with a structured filter panel, responsive job grid, loading state, empty state, result count, and mobile-friendly pagination.
- Improved job cards with clear location, experience, employment type, salary, posted date, and open/closed states.
- Rebuilt the job detail page with summary, description, skills, deadline, sticky application card, share action, and clear applied/closed states.
- Rebuilt candidate and admin authentication pages with consistent responsive auth shells, clearer hierarchy, helper text, errors, and cross-links.
- Improved the candidate dashboard, profile completion, quick actions, recent applications, and application cards.
- Split the candidate profile into photo, personal information, professional information, resume, and password sections.
- Improved admin dashboard metrics, job forms, job management, application management, and application detail views.
- Admin job/application data uses desktop tables and mobile stacked cards to avoid horizontal overflow.
- Responsive layouts target mobile (~375px), tablet (~768px), and desktop (~1366px) using Tailwind breakpoints.
- No backend logic, routes, API contracts, Zustand behavior, or Axios refresh-token behavior changed during the UI pass.

### Nexus design system pass (June 23, 2026)

Applied a full design-system overhaul based on the Nexus spec to the `app-enhancement` branch. Committed as `146ee17`, pushed to `origin/app-enhancement`. Not yet merged into `main`.

**Design tokens (`index.css`):**
- Primary accent changed from Saudi green `#006C35` to orange-red `#F2532E` (`--accent`, `--accent-hover: #D9421F`).
- Page background set to warm off-white `#F7F6F2` on both `html` and `body` (hardcoded, not via variable, to prevent override).
- `--bg-elev` tuned to `#F0EFEB` (closer to base, avoids looking too warm).
- Font stack replaced: Inter (Google Fonts) for all text including headings — Cabinet Grotesk, Satoshi, and JetBrains Mono removed.
- Border tokens switched from `rgba()` to hex: `--border-default: #E5E3DE`, `--border-strong: #D0CEC9`, `--border-pill: #E0DED8`.
- Card shadows removed — cards rely on `1px solid var(--border-default)` only per spec.
- Button height standardised to `min-height: 48px`, `border-radius: 999px`, `padding: 0 24px`.
- Added `.btn-dark-outline` variant for use on the dark CTA banner.
- `alert-success` hardcoded to emerald green (not `--accent`) since accent is now orange.

**Navbar:**
- Height 80px, `var(--bg-base)` background with `1px solid var(--border-default)` bottom border (replaces frosted glass).
- Logo: black circle (`#141414`) with "S" + "SaudiaCareers / careers" wordmark.
- NavLink active state: `var(--accent)` text + pill outline border around the label.
- "Join free" button: orange-red `btn-primary` with `Sparkles` icon prefix, compact `40px` height in navbar.

**Landing page:**
- Hero H1 at `clamp(44px, 7.5vw, 88px)` / 700 weight / `line-height: 0.95` — "Find work that / *feels* like yours." with "feels" in italic orange-red.
- Trust row: Shield / Zap / CheckCircle2 icons with "Verified employers", "1-click apply", "Free for candidates".
- Company marquee extended to full viewport width via `width: 100vw; margin-left: calc(-50vw + 50%)` breakout — font size increased to 28px bold.
- Feature section header updated to "Roles worth your attention" with "View all →" link.
- Dark CTA banner: `#141414` background with warm radial glow (`rgba(180,40,20,0.35)`), "Less scrolling. More signing." headline, primary + dark-outline button pair.

**JobCard:**
- Gradient top bar removed.
- Variant B layout: eyebrow row (industry left / experience right, 12px/600 uppercase), 22px/600 title, 16px company, location + salary row (space-between), skill chip pills, "Closed" pill state instead of red Badge.

**Jobs (Browse) page:**
- "Browse" eyebrow label above H1.
- H1 "All open roles" at `clamp(32px, 5vw, 56px)` / 700.
- Search bar: 56px height, full pill, 16px placeholder text.
- Filter row: `SlidersHorizontal` icon button + pill-shaped location/industry/experience/type selects + sort select.

**Footer:**
- Columns renamed to "For Talent" and "For Employers" per spec.
- Logo updated to black circle style.
- Background set to `var(--bg-base)`.
- Copyright line in tracked uppercase: "© YEAR SaudiaCareers · Built with care".

**Badge:**
- `green` tone hardcoded to `emerald-50 / emerald-200 / emerald-700` (no longer references `--accent` which is now orange).

**AuthShell:**
- Title at 40px / 700.
- Logo updated to black circle style.
- Candidate left panel background: `var(--accent)` (orange-red). Admin left panel: `#141414`.

UI verification completed:

```bash
npm run lint
npm run build
```

### Toast notifications and smooth redirects (June 24, 2026)

Replaced silent redirects with animated floating toasts across all post-action navigations.

**Toast component (`frontend/src/components/common/Toast.jsx`):**
- Full rewrite: slide-down + fade-in on mount (CSS `opacity`/`transform` transition with 10ms rAF trick), slide-up + fade-out on dismiss.
- Draining progress bar at the bottom — width transitions from 100% to 0% over the toast `duration` so users can see how long they have.
- Icon prefix: `AlertCircle` for error tone, `CheckCircle2` for success tone.
- Centered at top of viewport via `position: fixed; left: 0; right: 0; margin: 0 auto`.
- White card, `1px` tone-coloured border, `box-shadow` for depth.

**Pages updated with toast-before-redirect pattern:**

| Page | Tone | Message | Timer |
|---|---|---|---|
| `JobDetail` — incomplete profile | Error | "Your profile is incomplete — please add your designation, experience, and skills before applying." | 3500ms |
| `JobDetail` — no resume | Error | "You haven't uploaded a resume yet. Please upload one before applying." | 3500ms |
| `Register` | Success | "Account created! Taking you to your profile…" | 3000ms |
| `ResetPassword` | Success | "Password reset successfully! You can now sign in." | 3000ms |
| `ChangePassword` (admin) | Success | "Password updated! Taking you to the dashboard…" | 3000ms |
| `CreateJob` | Success | "Job published! Taking you to the jobs list…" | 3000ms |
| `EditJob` | Success | "Changes saved! Taking you to the jobs list…" | 3000ms |

**Bug fixed — Register premature session set:**
- Original code called `setSession(data.data)` immediately after registration, which updated Zustand and triggered `<PublicOnlyRoute>` to redirect away before the toast could render.
- Fixed by storing the session data in a local variable (`pendingSession`), showing the toast, and only calling `setSession` + `navigate` together after the toast delay completes.

**Landing page typography and background (June 24, 2026):**
- Hero H1 font changed to `'Cabinet Grotesk', 'Satoshi', ui-sans-serif, system-ui, sans-serif` — fonts loaded from Fontshare CDN (cabinet-grotesk and satoshi, weights 700/800).
- Page background token `--bg-base` and hardcoded `body` background updated from `#F7F6F2` to `#F9F9F8`.

Both commands pass. The running development servers were temporarily stopped to release Prisma's Windows query-engine file for the root build, then restarted.

Local development endpoints when the servers are started:

```text
Frontend: http://127.0.0.1:5173
Backend:  http://localhost:5000
Health:   http://localhost:5000/api/health
```

Current runtime state:

```text
PostgreSQL Docker container: running
Frontend development server: running (http://localhost:5173)
Backend development server: stopped
```

### App-enhancement session 2 (June 24, 2026)

All changes are on the `app-enhancement` branch. Not yet merged into `main`.

**Candidate sidebar navigation (`App.jsx`, `Sidebar.jsx`):**
- Sidebar now renders Lucide icons per link — `link.icon` is rendered at 16px with `shrink-0` if provided.
- `candidateLinks` reordered and expanded: Overview → Profile → Browse Jobs → Applications → Change Password.
- Browse Jobs links to `/jobs` (leaves dashboard; never shows as active).
- Change Password links to `/dashboard/change-password` (new protected route).

**Candidate Change Password page (`CandidateChangePassword.jsx`):**
- New standalone page at `/dashboard/change-password` inside `PrivateRoute` + `DashboardLayout`.
- Fields: Current Password, New Password. Validation mirrors backend (min 8 chars, 1 uppercase, 1 number, must differ). Success inline alert, no redirect.
- `PasswordForm` section removed from `Profile.jsx` — profile page no longer handles password changes.

**Apply button race condition fix (`JobDetail.jsx`):**
- `setAlreadyApplied(true)` is now called immediately after `applicationsApi.apply()` succeeds, before `showRedirectToast`.
- Previously, `finally { setApplying(false) }` ran while the toast was still showing, re-enabling the button with "Apply now" text for 3.5 seconds. The fix keeps the button locked as "Applied ✓" for the entire toast window.

**Post-apply success flow (`JobDetail.jsx`):**
- After a successful application, a success toast ("Application submitted successfully! Taking you to your dashboard…") displays for 3.5 seconds, then navigates to `/dashboard`.

**Loading states on delete/toggle buttons (`Profile.jsx`, `ManageJobs.jsx`):**
- Profile page: `photoDeleting` and `resumeDeleting` state variables — Remove buttons show "Removing…" and disable during the API call.
- ManageJobs `Actions` component: `deleting` and `toggling` local state with spinner icons. Both `handleDelete` and `handleToggle` now `await load()` before clearing their loading state, so the button stays locked until the refreshed list returns and the row is gone or updated.

**Admin ManageJobs — pagination, bulk delete, small buttons (`ManageJobs.jsx`, `Button.jsx`, `index.css`):**
- Added `size="sm"` prop to `Button` component; adds `.btn-sm` CSS class (32px height, 12px h-padding, 13px font-size).
- All three action buttons (Edit, Activate/Deactivate, Delete) now use `size="sm"` and fit on one line with `gap-1.5`.
- Edit button replaced `<Link><Button /></Link>` with `<Button onClick={() => navigate(...)}>` so `disabled` actually prevents navigation.
- Toggle button gets `min-w-[108px]` so switching between "Deactivate" and "Activate" labels doesn't change the button width.
- Pagination: `ManageJobs` passes `page` (state) and `limit: 30` to the API; backend already returned `pagination.totalPages`. `Pagination` component shown below the table when `totalPages > 1`. Filter changes reset `page` to 1 via React 18 batched state updates. A "Showing X–Y of Z jobs" count is shown above the table.
- Checkboxes: each row has a checkbox; header has a "select all on this page" checkbox. Selecting any rows reveals an accent-coloured banner with a "Delete selected" button that deletes all selected jobs in parallel, then refreshes the list.
- Global busy state: `ManageJobs` owns `deletingIds: Set<number>`. Any row starting a single delete or toggle calls `markBusy(id)`; finishing calls `markDone(id)`. `anyBusy = deletingIds.size > 0 || bulkDeleting` is passed to every `Actions` instance — all rows lock simultaneously the moment one is in-flight. Checkboxes also disable when `anyBusy`.

**Sample job seeds (`backend/prisma/seedJobs.js`, `seedJobs2.js`):**
- `seedJobs.js`: 10 diverse sample jobs (Technology, E-commerce, Energy, Fintech, Finance, Retail, Manufacturing, Technology×2).
- `seedJobs2.js`: 52 additional jobs across Technology, Finance, Healthcare, Education, Retail, Hospitality, Engineering, Construction, HR, Legal, Marketing, Logistics, Real Estate, Contract/Part-time/Remote categories. Includes 3 jobs with past deadlines (show as "Closed") and 4 with no deadline. Total in DB: 64 jobs.

**Frontend route added:**
```text
/dashboard/change-password   Candidate change password (protected)
```

### App-enhancement session 3 (June 25, 2026)

All changes are on the `app-enhancement` branch. Not yet merged into `main`. Two commits: `1eb0071` (UI polish) and `daa660e` (WhatsApp import).

**Admin password:** `Admin@5678` (changed from seeded default).

#### UI polish (commit `1eb0071`)

**Navbar (`Navbar.jsx`, `index.css`):**
- Height reduced from 80px to 64px (`.nav-header` class, `height: 64px`).
- "Join free" button label shortened to "Join".
- Accent color updated from `#F2532E` to `#F44336` across all CSS tokens (`--accent`, `--accent-hover: #D32F2F`, `--accent-subtle`).
- Hover effect on navbar bottom border: `inset 0 -1px 0 var(--accent)` + `0 4px 16px rgba(0,0,0,0.07)` lift shadow, 250ms ease transition.
- Logout: `Loader2` spinner + `loggingOut` state while API call is in flight. `Toast` shown for 1500ms then auto-dismissed via `setTimeout` before `clearSession()` + `navigate('/')`. `timerRef` cleans up on unmount. Root cause of previous toast-not-dismissing bug: `duration` prop on Toast only animates the progress bar — parent must call `setShowToast(false)`.

**Landing page (`Landing.jsx`):**
- Search bar removed entirely (was in hero section; not needed since "Browse roles" button exists).
- Company marquee `mt-20` → `mt-0` so it is visible without scrolling immediately below the hero.
- Feature cards ("Roles worth your attention") given `className="card-soft card-lift"` for hover lift animation.
- CTA glow color updated to match new accent `rgba(244,67,54,0.35)`.

**Feature card hover animation (`index.css`):**
- `.card-soft` placed before `.card-lift` in `@layer components`. Critical: `@apply transition-colors duration-200` inside `.card-soft` expands to individual transition longhands which would override a `transition` shorthand if `.card-lift` appeared earlier in the file (CSS cascade by source order). Fix: `.card-lift` is defined after `.card-soft` and explicitly lists `border-color 200ms ease` to preserve the border hover without relying on card-soft's shorthand.
- `.card-lift` transition: `transform 320ms ease-out, box-shadow 320ms ease-out, border-color 200ms ease`.
- `.card-lift:hover`: `translateY(-6px)`, `box-shadow: 0 16px 36px rgba(0,0,0,0.10)`.

**Browse Jobs — closed jobs hidden (`jobController.js`):**
- Public job listing query now includes `OR: [{ applicationDeadline: null }, { applicationDeadline: { gt: now } }]` so jobs whose deadline has passed never appear in results.
- "Closed" badge and closed-state branch removed from `JobCard.jsx` — every card the frontend receives is guaranteed open.

**Browse Jobs — uniform card height (`Jobs.jsx`, `JobCard.jsx`):**
- Layout changed from CSS masonry columns (`column-count`) to CSS grid (`div.grid.gap-5.md:grid-cols-2.xl:grid-cols-3`). Grid stretches all cards in a row to equal height via implicit `align-items: stretch`.
- `JobCard` footer: `marginTop: "20px"` inline style removed (was overriding `mt-auto` Tailwind class — inline styles have higher specificity). `mt-auto` now correctly pushes "View role" button to the bottom of every card regardless of content height.

#### WhatsApp job import (commit `daa660e`)

**Backend:**
- `@anthropic-ai/sdk` installed.
- `ANTHROPIC_API_KEY` added to `backend/.env`.
- `backend/src/services/aiParserService.js` — calls Claude Haiku (`claude-haiku-4-5-20251001`) with a structured system prompt. Handles: one object per role (multi-role messages split), one object per location (multi-city postings duplicated), location mapping to Riyadh/Jeddah/Dammam/Other, first valid email extracted (WhatsApp numbers ignored), emoji stripping, industry inference, employment type defaulting to Full-time. Strips markdown fences from response before `JSON.parse`.
- `backend/src/controllers/importController.js` — validates text present and ≤ 60,000 chars, calls parser, returns `{ jobs, count }`.
- `POST /api/admin/import/parse` added to `adminRoutes.js` — protected by `authenticate + authorizeAdmin + requirePasswordChangeComplete`.

**Frontend:**
- `adminApi.parseImport(text)` added to `frontend/src/api/admin.js`.
- `frontend/src/pages/admin/ImportJobs.jsx` — full import page:
  - Textarea with `id="whatsapp-paste"`, live character counter, multi-message hint in placeholder.
  - "Parse jobs" button (disabled when textarea empty, shows spinner while parsing).
  - After parse: summary header with job count + "Publish all (N)" button when >1 pending job.
  - Per-job `JobReviewCard` component: collapsible (expanded by default), 1/N badge, warning indicator for missing required fields, all fields editable inline (dropdowns for Location/Industry/Employment type, text inputs for everything else), per-card Publish + Discard buttons. Published cards turn green with a checkmark.
  - "Publish all" calls `adminApi.createJob()` for every pending card in parallel via `Promise.allSettled`, reports success/fail count via toast.
- `/admin/jobs/import` route added inside `AdminRoute + DashboardLayout` in `App.jsx`.
- "Import Jobs" entry added to `adminLinks` array in `App.jsx`.
- "Jobs" link in `adminLinks` given `end: true` to prevent it highlighting on `/admin/jobs/import` (React Router NavLink uses prefix matching by default).

**Known limitation:** Anthropic API key requires credits. The account balance was zero during testing — the endpoint, auth, and parser are correctly wired; the `400 credit balance too low` error comes from the Anthropic API itself, not from application code. Add credits at console.anthropic.com → Billing.

#### Playwright test results (33/33 passing)

Full suite covers: navbar height/accent/hover, no search bar, marquee visibility, card-lift on 3 feature cards, no closed jobs on browse, uniform card heights, "View role" pinned to bottom, candidate register → dashboard, logout spinner + toast + auto-dismiss + redirect, admin login, admin nav highlighting (Jobs end:true fix), Import Jobs page structure, job detail page, route guards for /dashboard and /admin/dashboard.

#### Frontend routes added

```text
/admin/jobs/import   WhatsApp job import (admin only)
```

#### Admin API endpoint added

```text
POST   /api/admin/import/parse   Parse WhatsApp messages via Claude AI
```

### Job filters feature (June 26, 2026)

All changes are on the `Job-filters` branch (branched from `app-enhancement`/`main`). Commits: `8b34110` (initial filters), `a9f57c2` (progress update), `3555ab5` (salary filter + bug fixes). **Branch pushed to GitHub and all 13 Playwright browser tests passing.**

**Database:**
- `gender` (default `"Any"`) and `nationality` (default `"Any Nationality"`) columns added to the `Job` model in `schema.prisma`.
- Migration `20260626085337_add_gender_nationality_to_jobs` applied to production Supabase database.
- `backend/prisma/seedFilterJobs.js` added — seeds 24 test jobs covering all filter combinations (all salary ranges, locations, employment types, experience levels, genders, nationalities, freshness dates).

**Backend:**
- `jobSchemas.js` — `listJobsSchema` accepts multi-value pipe-separated params: `locations`, `industries`, `employmentTypes`, `experiences`, `salaries`, `genders`, `nationalities`, and date-range params `postedAfter`/`postedBefore`.
- `jobController.js` — `listJobs` builds an AND-condition array from all active filter params; supports OR expansion for experience (contains match) and gender (specific gender also surfaces "Any" jobs); `parseList` splits on `|` pipe not `,` comma (salary ranges like "5,000 – 10,000 SAR" contain commas). New `getFilterOptions` returns distinct `industries` and `nationalities` from active non-deleted jobs.
- `jobRoutes.js` — `GET /api/jobs/filter-options` route added (before `/:id` to avoid param collision).
- `adminSchemas.js` — `gender` and `nationality` added to `jobBody` Zod schema (both optional strings, max 50/100 chars).

**Frontend:**
- `frontend/src/utils/constants.js` — `SALARY_RANGES` array added (6 SAR ranges, single source of truth shared between FilterPanel and JobForm). `EMPTY_FILTERS` object moved here (was in FilterPanel — lint rule: component files should only export components).
- `frontend/src/api/jobs.js` — `filterOptions()` method added.
- `frontend/src/api/admin.js` — `gender` and `nationality` added to `JOB_FIELDS` whitelist in `pickJobFields`.
- `frontend/src/components/admin/JobForm.jsx` — salary field changed to dropdown using `SALARY_RANGES` constants; gender (Any/Male/Female) and nationality (Any Nationality/Saudi/Non-Saudi) dropdown selects added.
- `frontend/src/components/jobs/FilterPanel.jsx` — new component. Sticky header row with active filter count badge, Clear (disabled when nothing active) and Apply (disabled when nothing changed) buttons with hover/active transitions. Toast notifications: "N filter(s) applied" on apply, "Filters cleared" on clear. Collapsible `FilterCard` sections. Sections: Sort, Location, Industry (dynamic), Employment type, Salary (SAR), Experience, Posted within, Gender, Nationality (dynamic). Industry and Nationality panels only render when `filterOptions` returns values. Staged/apply pattern — changes only fire API when Apply is clicked.
- `frontend/src/pages/public/Jobs.jsx` — fully rewritten. Sidebar layout (260px fixed sidebar on lg+, mobile drawer). Tab buttons (Recent/Older than 60 days) removed. `filtersToParams` joins all multi-value params with `|` pipe separator to match backend's split. Active filter count badge on mobile toggle button.
- `frontend/src/components/common/Toast.jsx` — `top` changed from `24px` to `80px` so toasts render below the 64px navbar.

**Bug fixes (commit `3555ab5`):**
- **Navbar logout spinner stuck:** `loggingOut` state was never reset to `false` after logout. Navbar stays mounted inside `AppLayout` across all routes — on re-login, `user` repopulated from store but `loggingOut` was still `true`, showing "Signing out…" immediately. Fixed by adding `setLoggingOut(false)` and moving `navigate("/")` before `clearSession()` in the logout timer callback to avoid `AdminRoute` racing to redirect to `/admin/login` before the imperative navigate fires.
- **Salary filter returning 0 results:** `parseList` was splitting on `,` but salary values like `"5,000 – 10,000 SAR"` contain commas. Fixed by switching separator to `|` in both `filtersToParams` (frontend join) and `parseList` (backend split).
- **Fast-refresh lint warning:** `EMPTY_FILTERS` was a non-component export in `FilterPanel.jsx`. Moved to `constants.js`; both `FilterPanel` and `Jobs` import from there.

#### Playwright browser test results (13/13 passing)

Tests run against live dev servers (`localhost:5173` / `localhost:5000`):

| Check | Result |
|---|---|
| Landing page loads | ✓ |
| Jobs page — 19 cards visible | ✓ |
| Filter sidebar visible | ✓ |
| Salary (SAR) filter section exists | ✓ |
| Salary filter `Under 5,000 SAR` → 12 jobs | ✓ |
| Toast "1 filter applied" appears | ✓ |
| Clear restores all 19 jobs | ✓ |
| Location filter works | ✓ |
| Admin login → `/admin/dashboard` | ✓ |
| Logout button shows "Log out" (not stuck spinning) | ✓ |
| After logout — user is signed out | ✓ |
| After re-login — logout button not stuck spinning | ✓ |
| Two salary ranges combined → 18 jobs | ✓ |

#### New API endpoint added
```text
GET    /api/jobs/filter-options   Returns distinct industries and nationalities from active jobs
```

#### Filter params for GET /api/jobs (all pipe-separated)
```text
locations        e.g. "Riyadh|Jeddah"
industries       e.g. "Technology|Finance"
employmentTypes  e.g. "Full-time|Contract"
experiences      e.g. "1-2 years|3-5 years"
salaries         e.g. "5,000 – 10,000 SAR|10,000 – 15,000 SAR"
genders          e.g. "Male|Female"
nationalities    e.g. "Saudi|Non-Saudi"
postedAfter      ISO date string
postedBefore     ISO date string
sort             "newest" (default) | "deadline"
```

### Saved jobs feature (June 26, 2026)

All changes are on the `Job-filters` branch. Committed as `33d4fb5`. All 9 Playwright browser tests passing.

**Database:**
- `SavedJob` model added to `schema.prisma` with compound unique key `userId_jobId`, `savedAt` default `now()`, and cascade delete on both `User` and `Job` FK.
- Migration `20260626130000_add_saved_jobs` applied to production Supabase database.

**Backend:**
- `backend/src/validation/savedJobSchemas.js` — `saveJobSchema` (body: `jobId` int positive) and `savedJobIdSchema` (params: `jobId` int positive) using the `envelope()` helper.
- `backend/src/controllers/savedJobsController.js` — four controllers:
  - `saveJob`: upsert on `userId_jobId` compound key (idempotent)
  - `unsaveJob`: `deleteMany` (safe even if already unsaved)
  - `getSavedJobs`: returns full job data + `savedAt` + `isClosed` calculated at query time
  - `getSavedIds`: lightweight, returns array of jobId numbers for store hydration
- `backend/src/routes/savedJobsRoutes.js` — all four routes protected by `authenticate + authorizeCandidate`. Router mounted at `/api/saved-jobs` in `app.js`.

**Frontend:**
- `frontend/src/api/savedJobs.js` — `savedJobsApi.getAll()`, `.getIds()`, `.save(jobId)`, `.unsave(jobId)`.
- `frontend/src/store/savedJobsStore.js` — Zustand store with `savedIds: Set<number>`, `fetchIds` (idempotent, skips if initialized), `isSaved`, `toggle` (optimistic update with revert on failure), `remove` (single ID removal), `reset` (on logout).
- `frontend/src/components/jobs/JobCard.jsx` — bookmark button added for candidates only. Uses `aria-label="Save job"` / `"Remove from saved"` that toggles on click via store `toggle()`. Bookmark icon fill reflects saved state.
- `frontend/src/pages/public/JobDetail.jsx` — Save/Saved button added to job header (candidates only). Same aria-label toggle pattern; calls store `toggle()`. Calls `fetchIds()` on mount when candidate.
- `frontend/src/pages/candidate/SavedJobs.jsx` — new page at `/dashboard/saved-jobs`. Splits saved jobs into "active" and "unavailable" (deleted/inactive/expired) sections. Status badges: red "Job removed", amber "Inactive", amber "Expired". Remove button (X) per card with spinner. Empty state with "Browse roles" link. Uses `savedJobsApi.getAll()` on mount and `savedJobsApi.unsave()` + store `remove()` on button click.
- `frontend/src/App.jsx` — "Saved Jobs" link added to `candidateLinks` array (Bookmark icon); `/dashboard/saved-jobs` route added inside `PrivateRoute + DashboardLayout`.
- `frontend/src/components/layout/Navbar.jsx` — `resetSaved()` called before `clearSession()` on logout to clear saved-jobs store state.
- `frontend/src/pages/public/Jobs.jsx` — `fetchSavedIds()` called on mount when user is a candidate.

**Bug fixed:**
- `savedJobsStore.js` was missing the `remove(jobId)` function. `SavedJobs.jsx` destructured `remove` from the store and got `undefined`; calling it threw silently after the API succeeded, so `setJobs` never ran and removed cards never disappeared. Fixed by adding `remove` as a proper store action.

#### Playwright browser test results (9/9 passing)

| Check | Result |
|---|---|
| Candidate login succeeds | ✓ |
| Bookmark buttons visible on job cards | ✓ |
| Bookmark toggles to saved state (aria-label changes) | ✓ |
| Saved Jobs link in candidate sidebar | ✓ |
| Saved Jobs page loads | ✓ |
| Saved jobs are listed on the page | ✓ |
| Removing a saved job removes it from the list | ✓ |
| Save button visible on job detail page | ✓ |
| Save button on detail page toggles aria-label | ✓ |

#### Saved jobs API endpoints added
```text
GET    /api/saved-jobs         Returns full saved job data with savedAt + isClosed
GET    /api/saved-jobs/ids     Returns array of saved jobId numbers (lightweight)
POST   /api/saved-jobs         Save a job { jobId }
DELETE /api/saved-jobs/:jobId  Unsave a job
```

### Employer features (June 26, 2026)

All changes are on the `employer` branch (branched from `Job-filters`). All 12 Playwright browser tests passing.

**Admin password:** `Admin@5678`

**Database migration:** `20260626150000_add_employer_features` — applied to production Supabase.
- `EMPLOYER` added to `Role` enum.
- `SHORTLISTED` and `ON_HOLD` added to `ApplicationStatus` enum.
- `EmployerProfile` table added (one-to-one with User): `companyName`, `industry`, `location`, `website`, `phone`, `description`, `logoPath`.
- `Enquiry` table added: `name`, `email`, `company`, `subject`, `message`.

**Backend:**
- `authorizeEmployer` middleware in `authorizeAdmin.js`.
- `backend/src/validation/employerSchemas.js` — schemas for employer register, profile update, job queries, application status updates, and enquiry submission.
- `registerEmployer` controller in `authController.js` — creates `User` with `role: EMPLOYER` + `EmployerProfile` atomically.
- `POST /api/auth/employer/register` route.
- `backend/src/controllers/employerController.js` — full CRUD:
  - `getEmployerDashboard` — metrics scoped to `createdBy: userId`
  - `getEmployerProfile`, `updateEmployerProfile`
  - `listEmployerJobs`, `createEmployerJob` (always ACTIVE), `updateEmployerJob`, `updateEmployerJobStatus`, `deleteEmployerJob`
  - `listJobApplications` — paginated with search/status filter; verifies job ownership
  - `updateApplicationStatus` — restricts to APPLIED/SHORTLISTED/ON_HOLD/REJECTED; verifies job ownership; triggers candidate email
  - `getApplicationDetail` — includes signed resume URL
- `backend/src/routes/employerRoutes.js` — all routes protected by `authenticate + authorizeEmployer`.
- `backend/src/controllers/enquiryController.js` + `backend/src/routes/enquiryRoutes.js` — `POST /api/enquiries` (rate-limited, no auth required).
- `app.js` — mounts `/api/employer` and `/api/enquiries` routers.

**Frontend:**
- `frontend/src/api/employer.js` — `employerApi` (register, profile, dashboard, job CRUD, applications) and `enquiryApi` (submit).
- `frontend/src/routes/EmployerRoute.jsx` — redirects unauthenticated → `/employer/login`, wrong role → `/unauthorized`.
- `frontend/src/routes/PublicOnlyRoute.jsx` — updated to redirect employers to `/employer/dashboard`.
- `frontend/src/pages/auth/Login.jsx` — extended with `employer` prop for employer-specific title, subtitle, footer, and redirect.
- `frontend/src/pages/employer/EmployerRegister.jsx` — fields: name, companyName, email, phone, password. Success toast → navigate to `/employer/dashboard`.
- `frontend/src/pages/employer/EmployerDashboard.jsx` — 4 metric cards: Total jobs, Active listings, Total applicants, New (last 7 days). Quick links: Post a new job, Manage listings.
- `frontend/src/pages/employer/EmployerJobs.jsx` — table with Edit, Unpublish/Publish, Delete, View applications actions. Search, pagination, loading/empty states.
- `frontend/src/pages/employer/EmployerCreateJob.jsx` — pre-populates companyName/hrEmail from employer profile. Reuses admin `JobForm` component.
- `frontend/src/pages/employer/EmployerEditJob.jsx` — fetches job via public API; reuses admin `JobForm` component. Calls `employerApi.updateJob` on submit.
- `frontend/src/pages/employer/EmployerApplications.jsx` — applicants list per job. Status filter, search, pagination. Shortlisted/On Hold/Rejected action buttons per applicant. Resume download via signed URL.
- `frontend/src/pages/public/Contact.jsx` — public enquiry form (no auth). Fields: name, email, company (optional), subject, message. Shows success state after submission.
- `frontend/src/components/layout/Navbar.jsx` — Dashboard routes employers to `/employer/dashboard`; "Employers" link added for guests.
- `frontend/src/App.jsx` — employer routes wrapped in `<EmployerRoute> + <DashboardLayout links={employerLinks}>`. `/contact` public route added. `/employer/login` and `/employer/register` inside `PublicOnlyRoute`.

**Key design decisions:**
- Employers can only view/edit/delete their own jobs (all queries scoped by `createdBy: req.user.id`).
- Employer-created jobs automatically appear in public listings (no special handling needed).
- `createEmployerJob` strips `status` from body and forces `ACTIVE`.
- Employer application status actions are restricted to APPLIED/SHORTLISTED/ON_HOLD/REJECTED (UNDER_REVIEW and SELECTED remain admin-only).
- Enquiry form rate-limited via existing `authRateLimiter`.

#### Playwright browser test results (12/12 passing)

| Check | Result |
|---|---|
| Navbar shows Employers link for guests | ✓ |
| Employer register page loads | ✓ |
| Employer registration navigates to dashboard | ✓ |
| Employer dashboard loads | ✓ |
| Post a job page loads | ✓ |
| Company name pre-populated from employer profile | ✓ |
| Job creation navigates to jobs list | ✓ |
| Created job appears in employer jobs list | ✓ |
| Employer job visible in public listings | ✓ |
| Contact page loads | ✓ |
| Contact form submits successfully | ✓ |
| Unauthenticated user redirected from employer dashboard | ✓ |

#### Employer API endpoints added
```text
POST   /api/auth/employer/register
GET    /api/employer/profile
PUT    /api/employer/profile
GET    /api/employer/dashboard
GET    /api/employer/jobs
POST   /api/employer/jobs
PUT    /api/employer/jobs/:id
PATCH  /api/employer/jobs/:id/status
DELETE /api/employer/jobs/:id
GET    /api/employer/jobs/:jobId/applications
GET    /api/employer/applications/:id
PATCH  /api/employer/applications/:id/status
POST   /api/enquiries
```

#### Employer frontend routes added
```text
/employer/login
/employer/register
/employer/dashboard
/employer/jobs
/employer/jobs/create
/employer/jobs/:id/edit
/employer/jobs/:id/applications
/contact
```

---

## Session: Candidate Profile Page (July 6, 2026)

Branch: `candidateloginpage` (branched from `employer`). Committed locally as `4a81ebe`. **Not yet pushed to GitHub.**

### What was built

#### Two-field name system
- `User.name` — the name entered at registration. Immutable after signup. Always shown in the navbar.
- `CandidateProfile.displayName` — optional display name editable via the pencil icon on the profile page header. Shown in the profile page hero only.
- `serializeProfile` returns three fields: `registeredName`, `displayName`, and `name` (resolved: `displayName || registeredName`).
- Zod schema: `displayName` uses `optionalText(100)` helper which accepts `""` (coerced to null in controller, clearing the field).

#### DB migrations
Three new migrations applied to production schema:
1. `add_profile_fields_and_entries` — added `EmploymentEntry`, `EducationEntry`, `CertificationEntry` models; added `location`, `designation`, `experience`, `skills`, `education`, `summary`, `alternateMobile`, `cvHeadline`, `linkedIn`, `website`, `github`, `desiredRole`, `desiredLocation`, `desiredSalary`, `openToWork` columns to `CandidateProfile`.
2. `add_personal_detail_fields` — added `profilePhotoPath` column.
3. `add_display_name` — added `displayName String?` to `CandidateProfile`.

#### New backend endpoints
```text
GET    /api/profile/employment
POST   /api/profile/employment
PUT    /api/profile/employment/:id
DELETE /api/profile/employment/:id

GET    /api/profile/education
POST   /api/profile/education
PUT    /api/profile/education/:id
DELETE /api/profile/education/:id

GET    /api/profile/certifications
POST   /api/profile/certifications
PUT    /api/profile/certifications/:id
DELETE /api/profile/certifications/:id

POST   /api/profile/photo
DELETE /api/profile/photo
```

#### Profile page sections
All sections on `CandidateProfile` page built and working:
- **Profile header** — profile photo (upload/delete), display name with pencil edit, profile completion percentage bar, `Open to work` toggle.
- **CV / Resume** — upload (PDF/DOC/DOCX, max 5 MB), delete, filename + upload date shown.
- **Personal Details** — name (read-only registered name), email (read-only), mobile, alternate mobile, location.
- **Professional Summary** — CV headline + free-text summary.
- **Key Skills** — tag-style input with comma-separated skills.
- **IT Skills** — separate tag entry for technical skills.
- **Employment Details** — list of work entries with add/edit/delete modals. Fields: company, role, location, start/end date, description.
- **Education Details** — list with add/edit/delete modals. Fields: institution, degree, field of study, graduation year, grade.
- **Accomplishments & Certifications** — list with add/edit/delete modals. Fields: title, issuer, issue date, URL.
- **Online Profiles** — LinkedIn, website/portfolio, GitHub.
- **Desired Job** — desired role, location, salary, open to work toggle.

#### UX improvements
- Pencil icon always visible (not hover-only).
- Save button shows "Saving…" during async operations.
- Trash icon shows "Deleting…" text during deletion.
- Cancel buttons always rendered; `disabled` (not hidden) while saving.
- Pencil/edit button `disabled` on the row being deleted (per-entry `deletingId` state pattern).
- All three modal Cancel buttons disabled during save.

#### `Input` component — `labelHint` prop
Added optional `labelHint` prop to `Input` component. Renders inline next to the field label in small lowercase text. Applied `normal-case` Tailwind class to override inherited `text-transform: uppercase` from parent `.field-label` CSS.

#### Mobile `+` enforcement
The `+` prefix is non-deletable in all mobile/phone fields:
- `Register.jsx` — candidate registration mobile field.
- `Profile.jsx` — personal section mobile + alternate mobile fields.
- `EmployerRegister.jsx` — employer phone field.
All three show `labelHint="enter number with country code"` inline.

#### Test results
- 122 API tests, all passing.
- Database wiped clean and reseeded with only the default admin account (`admin@saudiacareers.com` / `Admin@1234`, must change password on first login).

---

## Session: Dashboard & Job Search Polish (July 6, 2026)

Branch: `employer` (same branch as previous session). Local only — not yet pushed to GitHub.

### Changes made

#### ProfileCard — removed Upload/Add action buttons
- `frontend/src/components/dashboard/ProfileCard.jsx` — the "missing fields" rows no longer render inline Upload/Add `<Link>` buttons.  Candidates can update their profile from `/dashboard/profile` directly.

#### Dashboard profile completion mismatch fixed
- `backend/src/controllers/candidateDashboardController.js` — replaced the old 8-field flat formula with a 12-field weighted formula that exactly mirrors `COMPLETION_ITEMS` in `Profile.jsx`:
  - name 5%, mobile 5%, location 5%, designation 10%, experience 10%, skills 10%, cvHeadline 5%, summary 5%, profilePhoto 5%, resume 20%, employmentEntries 10%, educationEntries 10%.
- Prisma query updated: `profile: { include: { _count: { select: { employmentEntries: true, educationEntries: true } } } }` to support the entry-count fields.
- `missingFields` boost values updated to match new weights (resume 10→20, education uses entry count).

#### Dashboard profile photo now shown
- `backend/src/services/storageService.js` — new `createSignedViewUrl(path, expiresInSeconds)` function (no `download: true`, suitable for `<img src>` display).
- `candidateDashboardController.js` — imports `createSignedViewUrl`; generates `profilePhotoUrl` non-fatally and returns it in the dashboard response (replacing the old `hasPhoto: Boolean`).
- `frontend/src/components/dashboard/ProfileCard.jsx` — renders `<img src={profile.profilePhotoUrl}>` when the field is present, falls back to the initials circle.

#### 50 test jobs seeded
- `backend/prisma/addTestJobs.js` — one-off script that inserted 50 diverse jobs covering Technology, Finance, Healthcare, Oil & Gas, Construction, Hospitality, Education, Logistics, Retail, Telecom, Real Estate, Mining, Automotive, Media, Tourism, and more. All have future deadlines.  Database now has 60+ active open jobs.

#### Job search bar fixed end-to-end
- `backend/src/validation/jobSchemas.js` — `q: z.string().trim().max(200).optional()` added to `listJobsSchema` query envelope.
- `backend/src/controllers/jobController.js` — `listJobs` destructures `q` and adds a Prisma `OR` condition across `title`, `companyName`, `requiredSkills`, and `industry` (case-insensitive contains) when `q` is present.
- `frontend/src/pages/public/Jobs.jsx` — full rewrite to add search bar: `useSearchParams` syncs `?q=` to/from URL; 400ms debounce; two-fetch pattern (primary with `q` + secondary without `q` only when query active); merged combined list with `Set`-based ID deduplication so all jobs appear in one seamless list (matched first, then remaining newest-first); `Results for "…"` label + inline Clear button.

#### Industry job counts in filter panel
- `backend/src/controllers/jobController.js` — `getFilterOptions` changed from `findMany+distinct` to `groupBy+_count`, including the deadline filter in `baseWhere`. Now returns `industries` as `[{ name, count }]` objects.
- `frontend/src/components/jobs/FilterPanel.jsx` — `CheckboxList` updated to handle both string arrays and `{ name, count }` objects; renders a count pill `<span>` next to each industry name when `count` is present.

### Playwright tests — 15/15 passing

New test file: `tests/session-jul6.spec.js`. Covers:

| Test | Status |
|---|---|
| `listJobsSchema` accepts `q` param | ✓ |
| `listJobsSchema` rejects `q` > 200 chars | ✓ |
| `GET /api/jobs?q=civil` returns civil engineer jobs | ✓ |
| `GET /api/jobs?q=react` returns React developer jobs | ✓ |
| `GET /api/jobs?q=nonexistentxyzabc` returns 0 jobs | ✓ |
| `GET /api/jobs?limit=50` returns ≥ 50 total jobs | ✓ |
| `GET /api/jobs/filter-options` returns `[{name, count}]` industries | ✓ |
| Jobs page has visible search bar | ✓ |
| Searching "Civil Engineer" shows civil engineer jobs | ✓ |
| No "Browse all open roles" divider (no search) | ✓ |
| No "Browse all open roles" divider (search active) | ✓ |
| Industry filter items show count badges | ✓ |
| Dashboard ProfileCard has no Add/Upload buttons | ✓ |
| Search shows "Results for" label + Clear button | ✓ |
| Clearing search removes "Results for" label | ✓ |

`@playwright/test` installed as a dev dependency in the root workspace.

---

## Session: Applied-Job Indicator, Dashboard Tab Fix, Deterministic Sort (July 6, 2026)

Branch: `candidateloginpage`. Committed as `2629732`. **Pushed to GitHub.**

### Applied-job indicator on Browse Jobs

- `GET /api/applications/mine/ids` — new lightweight endpoint returns an array of `jobId` numbers the logged-in candidate has applied to (no joins, no full application objects).
- `frontend/src/store/appliedJobsStore.js` — new Zustand store mirroring `savedJobsStore`: `fetchIds` (idempotent, skips if already initialized), `isApplied(jobId)`, `markApplied(jobId)` (called immediately on successful apply), `reset` (called on logout).
- `frontend/src/components/jobs/JobCard.jsx` — for candidates, shows a small green circle with a white tick (`#16a34a`) to the left of the "View role" button when `isApplied(job.id)` is true. Title tooltip: "You applied for this role".
- `frontend/src/pages/public/Jobs.jsx` — calls `fetchAppliedIds()` on mount alongside `fetchSavedIds()` when user is a candidate.
- `frontend/src/components/layout/Navbar.jsx` — `resetApplied()` called on logout alongside `resetSaved()`.

### JobDetail apply button — instant applied state (no async gap)

- **Before:** `alreadyApplied` started as `false` and waited for `applicationsApi.mine()` to resolve before changing the button. Brief window where "Apply now" was clickable for an already-applied job.
- **After:** `alreadyApplied` is derived directly from `useAppliedJobsStore` — `isCandidate && isApplied(Number(id))`. If the store is already populated (user came from Browse Jobs), the button renders as "Applied" from the very first paint.
- `fetchAppliedIds()` still called on mount as fallback for users navigating directly to a job URL.
- Heavy `applicationsApi.mine()` call removed from JobDetail (replaced by the lightweight store).
- On successful apply: `markApplied(job.id)` updates the store reactively — no need to set local state.

### Post-apply redirect changed to /jobs

- After a successful application the user is now redirected to `/jobs` (Browse Jobs) instead of `/dashboard`, so they can continue applying to other roles.
- Toast message updated to: "Application submitted! Browse more open roles."

### Dashboard Applied tab was always empty — fixed

- **Root cause:** `applicationsApi.mine()` returns `{ data: [...] }` (array directly at `.data.data`). The Dashboard was reading `.data.data.applications` which is `undefined`, falling back to `[]` on every mount.
- Fixed in both places: the mount `useEffect` and the `switchTab` lazy-fetch both now use `res.data.data ?? []`.

### Deterministic job sort order

- **Problem:** All 52 seeded jobs share the exact same `createdAt` timestamp (seeded in one batch). With only `ORDER BY createdAt DESC`, Postgres returns rows in arbitrary internal order — a job can appear on a different page on each request.
- **Fix:** Added `{ id: "desc" }` as a tiebreaker to both sort variants in `jobController.js`:
  ```js
  sort === "deadline"
    ? [{ applicationDeadline: { sort: "asc", nulls: "last" } }, { id: "desc" }]
    : [{ createdAt: "desc" }, { id: "desc" }]
  ```
- Since `id` is always unique and monotonically increasing, ordering is now fully deterministic. This also handles future bulk-import scenarios where many jobs are created at the same timestamp.

### TEST_HR_EMAIL override

- `backend/.env` — `TEST_HR_EMAIL=ali.hashmi0@gmail.com` added.
- `applicationController.js` — `deliverApplication` reads `process.env.TEST_HR_EMAIL` and uses it instead of `job.hrEmail` when set. Remove this env var before production deployment to restore per-job HR routing.

---

## Session: Bug fixes — session-restore flash, phone picker, layout shift, dropdown behavior, dashboard polish (July 9, 2026)

Branch: `candidateloginpage`. Commits `042d4d1` and `8caf52b`, both pushed. Two further fixes below (`JobDetail.jsx`, `Dashboard.jsx` hidden-sections) are done but not yet committed.

### Session-restore flash fixed (`App.jsx`)
- Access token lives only in Zustand memory, so on every reload the app briefly rendered the guest UI before the silent refresh-token cookie restore completed, flashing "logged out" for returning users.
- `App.jsx` now gates route rendering on `authStore.isInitialized`; shows a centered `Spinner` until `restoreSession()` resolves (success or failure), then renders routes. `restoreSession()` always ends in `setSession()` or `clearSession()`, both of which set `isInitialized: true`, so the spinner can never hang.

### Phone country-code picker bug fixed (`PhoneInput.jsx`)
- `emit()` collapsed the whole field value to `""` whenever digits were empty — meaning picking a country code before typing any digits (the normal signup flow) silently reverted to the default `+966`.
- Fixed by always emitting `newCode + newDigits`. Also wrapped the "enter at least 6 digits" hint in a reserved-height container so the form no longer visibly shifts as the hint appears/disappears while typing.

### Employer navbar dropdown — click instead of hover (`Navbar.jsx`)
- The guest-only "Employers" dropdown opened on `onMouseEnter` and closed on `onMouseLeave`, closing the instant the mouse left the button.
- Changed to a click toggle with the same click-outside/Escape-to-close pattern already used for the candidate account menu (`empMenuRef` + a dedicated `useEffect`).

### Dashboard "Saved" tab count fixed (`Dashboard.jsx`)
- On mount, applications were fetched eagerly (correct "Applied" count immediately) but saved jobs were only fetched lazily when the Saved tab was clicked, so the count badge showed `0` until then.
- Added `savedJobsApi.getAll()` to the initial mount `Promise.all()` alongside applications, dashboard stats, and career tips.

### Dashboard — mock/placeholder sections hidden (`Dashboard.jsx`)
- Hid "Jobs by top employers," "Career tips," "Companies hiring for," "Featured employers/consultants," the profile-completeness reminder banner, "Boost your job hunt," `PollWidget` ("YOUR OPINION MATTERS"), and `FAQCard` ("Frequently asked") behind one module-level flag: `const SHOW_HIDDEN_DASHBOARD_SECTIONS = false;`. Code and hardcoded data constants (`TOP_EMPLOYERS`, `FEATURED_EMPLOYERS`, `FEATURED_CONSULTANTS`, `COMPANIES_HIRING`) are untouched, just unused while hidden.
- Full detail on what each hidden section needs before going live is documented in **`HIDDEN_FEATURES.md`** at the repo root. Two of the eight (the reminder banner and `FAQCard`) are actually fully functional today and were only swept up because they shipped in the same pass — worth re-enabling independently later.

### Job description word-wrap fixed (`JobDetail.jsx`)
- The public job description display only had `whitespace-pre-wrap`, which wraps at spaces but not inside a long unbroken run of characters (e.g. a pasted URL or run-on text) — such text overflowed the card sideways instead of wrapping, hiding the rest of the description.
- Added Tailwind's `break-words` (`overflow-wrap: break-word`) alongside it.

---

## Session: Employer Portal v2 — Billing, Credits, Verification & Refined UI (July 9, 2026)

Branch: `employer-v2` (created from `candidateloginpage` tip `474cfd4`). **Implemented and manually verified end-to-end via real HTTP requests — not yet committed.**

Built from a static HTML mockup the user supplied ("TalentDesk" — Dashboard, Jobs, Post a Job, Applicants, Company Profile, Billing). Re-skinned to SaudiaCareers' existing design tokens (no blue theme, no ₹, no Indian cities) and built as a real backend feature rather than a UI stub, per user decision. Payment gateway integration (Stripe/Moyasar/HyperPay/PayTabs/Tap) is explicitly out of scope for this pass — billing is **admin-managed**: an employer requests a plan/credit purchase, a `PENDING` invoice is created, and an admin manually marks it `PAID` (e.g. after a bank transfer), which grants the credits/plan. An `Invoice.gatewayRef` field is reserved so a real gateway can slot in later without a schema change.

Placeholder pricing (single config object, easy to change): Free — 1 job/month. Starter — 199 SAR/mo, 5 paid credits. Growth — 599 SAR/mo, 20 paid credits. Extra credits outside a plan: 49 SAR/credit.

### Database (migration `20260709150144_add_employer_billing_and_verification`)
- New enums: `VerificationStatus` (PENDING/APPROVED/REJECTED), `PlanTier` (FREE/STARTER/GROWTH), `InvoiceType` (SUBSCRIPTION/CREDIT_PACK/REFUND), `InvoiceStatus` (PENDING/PAID/REFUND_REQUESTED/REFUNDED), `ApplyMethod` (PLATFORM/EXTERNAL_URL/EMAIL).
- `JobStatus` extended with `DRAFT` and `EXPIRED` (existing `ACTIVE`/`INACTIVE` unchanged).
- `EmployerProfile` extended: `verificationStatus` (default PENDING), `verificationDocPath`, `verificationNote`, `verifiedAt`, `taxRegistrationNumber`, `billingAddress`, `billingEmail`.
- New model `EmployerSubscription` (1:1 with `EmployerProfile`): `planTier`, `paidCreditsRemaining`, `freeJobUsedAt`, `renewsAt`, `cancelAtPeriodEnd`. Created lazily on first job post or billing-page visit — not created at registration time.
- New model `Invoice`: `employerProfileId`, `type`, `amountSar`, `status`, `gatewayRef`, `note`, `issuedAt`, `paidAt`.
- `Job` extended: `department`, `workMode`, `applyMethod`, `applyContact`, `screeningQuestion`, `listingDurationDays` (default 30), `expiresAt`, `creditSource` (`"FREE"` or `"PAID"`, stamped at publish time), `featured`.

### Job-credit gating (`backend/src/controllers/employerController.js`, `backend/src/services/employerBillingService.js`)
- `createEmployerJob`: if the employer's company isn't `APPROVED`, the job always saves as `DRAFT` regardless of quota. If approved, consumes the free monthly job first (tracked via `freeJobUsedAt` compared to the current calendar month), then paid credits; throws `402` if both are exhausted.
- `updateEmployerJobStatus`: the same gating applies when an employer manually republishes a `DRAFT`/`INACTIVE`/`EXPIRED` job to `ACTIVE` (e.g. via the "Publish"/"Unpublish" toggle in `EmployerJobs.jsx`), not just on initial creation.
- Shared helpers `getOrCreateSubscription()` and `consumeJobCredit()` live in `employerBillingService.js` so both the job controller and the billing controller use identical logic.
- Admin plan-tier/credit derivation on invoice payment (`adminEmployerBillingController.js`) matches invoices back to plans by exact SAR amount rather than storing a redundant plan/credit field on `Invoice` — acceptable given the fixed, small set of prices.

### New backend endpoints
```text
GET    /api/employer/subscription
GET    /api/employer/invoices
POST   /api/employer/invoices/credit-purchase
POST   /api/employer/invoices/plan-change
POST   /api/employer/invoices/:id/refund-request
POST   /api/employer/subscription/cancel
GET    /api/employer/verification
POST   /api/employer/verification/document        (multipart, PDF/JPEG/PNG, 5MB max)

GET    /api/admin/employer-verifications
PATCH  /api/admin/employer-verifications/:id/approve
PATCH  /api/admin/employer-verifications/:id/reject
GET    /api/admin/invoices
PATCH  /api/admin/invoices/:id/mark-paid
PATCH  /api/admin/invoices/:id/mark-refunded
```

### New/changed files
- `backend/src/config/plans.js` — plan catalog + price-per-credit, single source of truth.
- `backend/src/services/employerBillingService.js` — `getOrCreateSubscription`, `consumeJobCredit`.
- `backend/src/controllers/employerBillingController.js` — employer-side billing actions.
- `backend/src/controllers/adminEmployerBillingController.js` — admin-side verification review + invoice actions.
- `backend/src/validation/employerBillingSchemas.js` — new Zod schemas.
- `backend/src/validation/adminSchemas.js` / `employerSchemas.js` — extended with the new job fields (department/workMode/applyMethod/applyContact/screeningQuestion/listingDurationDays), verification/invoice admin schemas, and widened job-status filters to include `DRAFT`/`EXPIRED`.
- `backend/src/middleware/upload.js` — added `verificationDocUpload` (mirrors the existing resume/avatar multer configs).

### Frontend
- `components/admin/JobForm.jsx` — new "Posting details" section (department, work mode, listing duration, apply method + conditional apply contact, screening question). Shared between admin and employer job create/edit.
- `frontend/src/api/admin.js` `JOB_FIELDS` whitelist and `frontend/src/api/employer.js` extended with all new billing/verification calls.
- New pages: `pages/employer/EmployerBilling.jsx` (plan cards, subscription summary, credit progress, invoices table, refund/cancel), `pages/employer/EmployerVerification.jsx` (checklist, document upload, status banner), `pages/admin/EmployerVerifications.jsx` (approve/reject queue), `pages/admin/Invoices.jsx` (mark-paid/mark-refunded queue). All built with existing tokens/components (`card-soft`, `Badge`, `Button`, `Spinner`, `Alert`) — no new design system introduced.
- `pages/employer/EmployerJobs.jsx` — status badge now covers `DRAFT`/`EXPIRED`; publish-toggle errors (e.g. `402` quota exhausted, `403` unverified) now surface via an inline `Alert` instead of failing silently.
- `App.jsx` — `employerLinks` gained "Billing" and "Company Profile"; `adminLinks` gained "Verifications" and "Invoices"; all four new routes registered (`/employer/billing`, `/employer/verification`, `/admin/verifications`, `/admin/invoices`).

### Verification performed
Manually exercised the full flow via real HTTP requests against the running dev servers (not just code review): registered a fresh test employer → posted a job while unverified (confirmed `DRAFT`) → approved verification as admin → posted a job (confirmed `ACTIVE`, `creditSource: "FREE"`, `expiresAt` set) → posted a second job (confirmed `402` block) → requested a 5-credit purchase (confirmed `PENDING` invoice, `245 SAR`) → admin marked it paid (confirmed `paidCreditsRemaining` incremented to 5) → retried the blocked job post (confirmed success, `creditSource: "PAID"`) → requested a refund on the paid invoice (confirmed `REFUND_REQUESTED`) → admin marked it refunded (confirmed `REFUNDED`). All test data and temporary admin state changes were cleaned up afterward. `npm run lint` (frontend + backend) and `npm run build --workspace frontend` both pass with zero new errors — the errors present are pre-existing and in files untouched by this session.

### Known gaps for a future session
- No real payment gateway — all billing is admin-recorded.
- `EmployerSubscription` is created lazily; there is no seed/backfill for the one pre-existing employer account (`DAVIK CAPITAL`), so its first job post or billing-page visit will create its subscription on the fly.
- No Playwright/automated test coverage was added for this feature (flagged and accepted as a scope tradeoff — this was already a large session).

---

## Session: Employer Portal Visual Rebuild (July 9, 2026)

Branch: `employer-v2`, same day as the backend billing session above. The user's reaction to the first pass: "the front end UI is completely different from what I gave you, make it like the HTML file I shared" — the billing/verification pages had been built with the app's generic shared components instead of actually porting the mockup's distinctive visual design. Confirmed scope with the user: restyle the *entire* employer portal (not just the 4 new pages), and give employer routes their own dedicated shell instead of the shared `DashboardLayout`/`Sidebar` used by candidate/admin.

### New shell, separate from the rest of the app
- `frontend/src/components/employer/EmployerShell.jsx` — full-bleed sidebar + topbar, replacing `DashboardLayout` for authenticated employer routes only. Sidebar: teal brand mark, workspace card (company name + live verification status), icon nav with real count badges (Jobs → `totalJobs`, Applicants → `totalApplications` — the latter is a plain button, not a `NavLink`, since it intentionally routes to `/employer/jobs` rather than a nonexistent aggregate applicants page, so it never double-highlights alongside the real "Jobs" nav item), a bottom CTA card linking to Billing. Topbar: mobile hamburger + slide-in drawer with dark overlay, a working search box (submits to `/employer/jobs?search=…`), an avatar dropdown with real logout (click-outside/Escape pattern copied from `Navbar.jsx`'s candidate menu).
- `App.jsx` — the authenticated employer routes (`dashboard`, `jobs`, `jobs/create`, `jobs/:id/edit`, `jobs/:id/applications`, `billing`, `verification`) were pulled **out of** the `<AppLayout>` tree (which renders the global public Navbar/Footer) into their own sibling top-level route wrapped in `EmployerRoute` + `EmployerShell`. `employer/login`, `employer/register`, and `employer/contact` were left untouched inside `AppLayout` — they're public marketing/auth pages, not part of the mockup.
- Visual language: reused the project's *existing* design tokens (`--bg-elev`, `--border-default`, `--sh-1/2/3`, `--green`/`--green-bg`, `--gold-bg`, `--purple-bg`) rather than a second CSS-variable system — what was actually ported from the mockup is its *structure*: corner-circle-decorated KPI cards, dotted pill badges, plan cards with checkmark lists, applicant cards, checklist rows, split billing layout. Accent color is the teal already established for employer branding (`const EMP = "#0F6E56"`, same constant already used in `EmployerLogin.jsx`/`EmployerRegister.jsx`/`EmployerContact.jsx`) instead of the mockup's blue.

### Every employer page rebuilt to match the mockup's structure
- `EmployerDashboard.jsx` — verification status banner, 4 corner-circle KPI cards (Active jobs, Applications, Free job used this month, Paid credits), two-column Recent jobs table + Billing summary card.
- `EmployerJobs.jsx` — notice banner when unverified, pill-styled search + status filter (location filter deliberately not added — no backend support exists for it, avoided inventing a decorative dead-end control), table gained a Credit-source column.
- `EmployerCreateJob.jsx` / `EmployerEditJob.jsx` / `components/admin/JobForm.jsx` — Post-a-Job now has two explicit actions, "Save draft" and "Publish job" (mockup's core interaction), instead of one submit button. New `allowDraft` prop on `JobForm` renders the second button; only employer's create page passes it (admin's `CreateJob.jsx`/`EditJob.jsx` and employer's edit page are unaffected).
- `EmployerApplications.jsx` — rebuilt from a flat table into the mockup's applicant-grid cards: avatar-initial circles, skill pills split from `profile.skills`, stage badges, actions.
- `EmployerBilling.jsx` / `EmployerVerification.jsx` — restyled to the mockup's specific layouts (gradient plan-highlight card with a real progress bar; two-column company-info form + document upload + sidebar checklist/notice). `EmployerVerification` also grew a real editable company-info form (name/website/industry/tax number/about) wired to `PUT /employer/profile` — the first pass only had the document upload.

### Backend: `saveAsDraft` flag (small, contained addition)
- `adminSchemas.js` — added `saveAsDraft: z.boolean().optional()` to the shared `jobBody` schema (no-op for admin, which never sends it).
- `employerController.js` `createEmployerJob` — when `saveAsDraft: true`, skips the verification/credit gate entirely and force-saves as `DRAFT`, regardless of verification status or remaining credits. `updateEmployerJob` explicitly strips the flag (edit never creates/publishes a job, so it's meaningless there).

### Verification performed
Backend re-verified via curl (job-credit gating, draft flag). Frontend verified with a disposable Playwright script driving a real browser against the running dev servers — logged in as a fresh test employer, clicked through Dashboard → Jobs → Post a Job (filled the form, clicked "Save draft", confirmed it landed in the list as `DRAFT` with a "Not consumed" credit source) → Billing → Company Profile → Applicants (confirmed the shortcut to Jobs), plus a 390px mobile viewport pass confirming the drawer opens/closes with its overlay. Screenshots confirmed close visual fidelity to the mockup at every step. One real bug was caught and fixed this way: the "Submit document" button on Company Profile was still the app's default red (`--accent`) instead of the employer teal — missed a `style` override that every other primary button in the portal already had. All test data and scratch verification scripts were deleted afterward. `npm run lint` (both workspaces) and `npm run build --workspace frontend` re-confirmed at zero new errors.

---

## Partially Completed

### End-to-end flow verification

- Registration and login confirmed working in production.
- Profile save, photo upload, and resume upload are implemented and Supabase-connected but full end-to-end browser test of the complete apply flow has not been completed.
- HR email and candidate status-update emails are implemented but cannot be fully verified until Resend domain `saudiacareers.com` is verified.

### Automated testing

- 7 validation unit tests exist and pass.
- Integration tests, endpoint tests, frontend component tests, and E2E tests are planned but not yet written (deferred — UI enhancement pass takes priority).

### DNS and custom domain

- Hostinger DNS records for `saudiacareers.com` → Vercel and `api.saudiacareers.com` → Render not yet configured.
- Resend DNS records for email sending not yet added to Hostinger.

### Deployment

- Application code and environment examples are deployment-oriented.
- Vercel, Render, Supabase, Resend, Hostinger DNS, HTTPS, and custom-domain steps require external account access.

## Not Started / Externally Blocked

- Execute database-backed auth and full API integration tests.
- Execute browser end-to-end tests of the complete application flow.
- Create/configure the private Supabase `SaudiaCareers` bucket.
- Verify old-file deletion and signed URLs against Supabase.
- Verify the `saudiacareers.com` sending domain in Resend.
- Deploy backend to Render and frontend to Vercel.
- Configure Hostinger DNS for apex, `www`, API, and Resend records.
- Verify production cookies, CORS, storage, emails, and HTTPS.

## Backend Endpoints

### Health

```text
GET    /api/health
```

### Auth

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/change-password
```

### Candidate profile

```text
GET    /api/profile
PUT    /api/profile
POST   /api/profile/resume
DELETE /api/profile/resume
GET    /api/profile/resume/download
POST   /api/profile/photo
DELETE /api/profile/photo

GET    /api/profile/employment
POST   /api/profile/employment
PUT    /api/profile/employment/:id
DELETE /api/profile/employment/:id

GET    /api/profile/education
POST   /api/profile/education
PUT    /api/profile/education/:id
DELETE /api/profile/education/:id

GET    /api/profile/certifications
POST   /api/profile/certifications
PUT    /api/profile/certifications/:id
DELETE /api/profile/certifications/:id
```

### Public jobs

```text
GET    /api/jobs
GET    /api/jobs/:id
```

### Candidate applications

```text
POST   /api/applications
GET    /api/applications/mine
GET    /api/applications/mine/ids
```

### Saved jobs

```text
GET    /api/saved-jobs
GET    /api/saved-jobs/ids
POST   /api/saved-jobs
DELETE /api/saved-jobs/:jobId
```

### Admin

```text
GET    /api/admin/dashboard
GET    /api/admin/jobs
POST   /api/admin/jobs
GET    /api/admin/jobs/:id
PUT    /api/admin/jobs/:id
DELETE /api/admin/jobs/:id
PATCH  /api/admin/jobs/:id/status
GET    /api/admin/applications
GET    /api/admin/applications/export
GET    /api/admin/applications/:id
PATCH  /api/admin/applications/:id/status
POST   /api/admin/import/parse
```

## Frontend Routes

All routes in `AGENTS.md` are registered and have functional pages:

```text
/
/jobs
/jobs/:id
/login
/register
/forgot-password
/reset-password/:token
/dashboard
/dashboard/profile
/dashboard/saved-jobs
/dashboard/applications
/dashboard/change-password
/admin/login
/admin/change-password
/admin/dashboard
/admin/jobs
/admin/jobs/create
/admin/jobs/:id/edit
/admin/applications
/admin/applications/:id
/admin/jobs/import
/unauthorized
/*
```

## Available Commands

```bash
npm install
npm run dev:backend
npm run dev:frontend
npm test
npm run lint
npm run build

npm run prisma:generate --workspace backend
npm run prisma:validate --workspace backend
npm run prisma:migrate --workspace backend
npm run prisma:deploy --workspace backend
npm run prisma:seed --workspace backend
npm run prisma:studio --workspace backend
```

## Known Risks

- Migration and seed execution are verified, but the complete API runtime path has not been exercised against PostgreSQL.
- Asynchronous HR email dispatch uses the Node process. Render restarts after application creation could leave records in `PENDING`; a durable queue/retry worker is recommended after MVP.
- Status-update email failures are logged but are not persisted because the schema tracks only HR application email delivery.
- Signed URLs are bearer URLs valid for one hour and must not be logged.
- The default admin credential exists in the manual seed as required and must be changed immediately.
- Prisma 6 warns that `package.json#prisma` seed configuration will require migration before Prisma 7.
- The repository still has no commits and all files are untracked on `codex-mvp-foundation`.
- No automated screenshot or visual-regression test suite exists; final browser/device review is still recommended at 375px, 768px, and 1366px using live data.

## Next Required Actions

1. **UI enhancement pass** — drop design reference images into `ui-refs/` folder, then redesign all pages on the `app-enhancement` branch.
2. Verify Resend domain `saudiacareers.com` in Resend dashboard and add DNS records in Hostinger.
3. Configure Hostinger DNS: apex + www → Vercel, api subdomain → Render, Resend records.
4. Update `VITE_API_URL` in Vercel to `https://api.saudiacareers.com/api` once DNS is live.
5. Complete end-to-end browser test of the full apply flow in production.
6. Write integration and E2E test suite (deferred until after UI pass).

## TODO

- (completed) Fix frontend form validation — see Completed section.

---

## Session: Job Legitimacy Flagging, Employer Billing Controls, and Admin Console Rebuild (July 9–10, 2026)

Branch: `employer-v2`. Committed as `92fde0d` and pushed to GitHub. Three new migrations applied to production Supabase: `20260709193727_add_job_flagging_and_pending_review`, `20260709205216_add_admin_console_features`, `20260709210649_add_employer_linkedin_url`.

### Real Applicants page (root-caused, not just patched)

A previous fix only patched the sidebar highlight for the "Applicants" nav item (which shared the `/employer/jobs` route with "Jobs" since no aggregate-applications endpoint existed). The user reported the underlying issue again — clicking "Applicants" still showed "Jobs" content. Root cause: there was no real Applicants page, just a shared route with a highlight workaround.

- **Backend:** `GET /employer/applications` (`listAllApplications` in `employerController.js`) — all applications across every job the employer owns, joined with job title, with pagination/search/status filter. New `employerAllApplicationsQuerySchema`.
- **Frontend:** new `frontend/src/pages/employer/EmployerApplicants.jsx` — genuine all-jobs applicant card grid (mirrors the per-job `EmployerApplications.jsx` UI), each card links back to its job.
- `EmployerShell.jsx` simplified — "Applicants" is now a real `NavLink` to `/employer/applicants`; the entire `jobsNavFocus` workaround state was deleted since there's no longer a shared route to disambiguate.

### Job legitimacy flagging (rule-based, admin-gated)

New `backend/src/services/jobLegitimacyService.js` — runs automatically inside `createEmployerJob` and the publish-transition path of `updateEmployerJobStatus`, right before a job would otherwise go `ACTIVE`. Any flagged job is forced to a new `PENDING_REVIEW` status instead, with reasons stored, and does **not** get published until an admin explicitly approves it — the employer is never blocked from posting, just queued for review.

Rules implemented:
1. **HR/apply email is free webmail** (gmail/yahoo/hotmail/outlook/icloud/live/aol/mail/protonmail/yandex) — applies regardless of whether the employer has a website on file, since a legitimate company email is mandatory either way.
2. **HR/apply email domain mismatch** vs. the employer's own verified website domain — only applies when a website is on file (nothing to compare against otherwise).
3. **External apply-URL points to an unrecognized domain** (not the employer's own site, not an allowlisted ATS like LinkedIn/Indeed/Bayt/Greenhouse/Lever/Workday/etc.).
4. **Payment/fee language** in the description or screening question (processing fee, refundable deposit, wire transfer, OTP, etc.).
5. **Off-platform contact pressure** (pushes candidates to WhatsApp/Telegram).
6. **Too-good-to-be-true compensation** claims paired with a salary range.
7. **Suspicious content inside the salary field itself** (a URL, messaging link, or long digit run).
8. **Rapid duplicate postings** — same employer, same title+description, 3+ times in 24 hours.

Schema additions: `Job.flagReasons String[]`, `Job.reviewNote String?`, `JobStatus.PENDING_REVIEW`.

New endpoints: `PATCH /admin/jobs/:id/approve` (re-runs the verification/credit gate, consumes a credit, publishes), `PATCH /admin/jobs/:id/reject` (requires a note, sets `INACTIVE`). New admin page `frontend/src/pages/admin/JobReviews.jsx` — queue of flagged jobs with human-readable reason badges and Approve/Reject actions. Employer-facing `EmployerJobs.jsx` shows a "Pending review" badge and disables the Publish toggle for those rows instead of the normal Publish/Unpublish button.

### Employer Billing page — Cancel/Resume Subscription + Download Invoices

Two new top-right buttons on `EmployerBilling.jsx`, replacing the old inline "Cancel renewal" button:
- **Cancel Subscription** — only shown for an active paid plan that isn't already scheduled to cancel. Opens a confirmation modal explaining the plan stays active until the period ends, then reverts to Free. On confirm, schedules `EmployerSubscription.cancelAtPeriodEnd = true` (no immediate downgrade) and shows: *"Subscription cancellation scheduled. Your [Plan] Plan remains active until [date]. After this date, your account will move to the Free Plan."* Button swaps to **Resume Subscription** afterward (new `POST /employer/subscription/resume` endpoint) to undo the cancellation before the period ends.
- A lazy check inside `getOrCreateSubscription` (mirrors the existing monthly free-job-reset pattern) auto-downgrades `planTier` to `FREE` once `renewsAt` actually passes for a `cancelAtPeriodEnd` subscription — there's no payment gateway/cron in this app to drive that transition otherwise.
- **Download Invoices** — modal listing invoice history (Invoice #, plan/type, amount, date, status) with a real **Download PDF** button per invoice. New `pdfkit` dependency; `GET /employer/invoices/:id/pdf` streams a generated receipt.
- Fixed a real bug caught during testing: the page blanked to a full-page spinner on every post-action refetch, which could hide the success message behind it (same class of issue as an earlier Applicants-page loading flash) — fixed with an `initialLoading` guard so only the very first load shows the full-page spinner.

### Admin console rebuild

Built using a supplied "TalentDesk" HTML mockup as a structural reference, restyled with the project's own theme (not the mockup's indigo/dark-console palette). All pre-existing admin features (`ManageJobs`, `CreateJob`, `EditJob`, `ImportJobs`, `Applications`, `ApplicationDetail`, `Invoices`, `ChangePassword`) were preserved and folded into the new nav structure — nothing deleted. Audit log and Settings tabs from the mockup were explicitly excluded per instruction.

- **`frontend/src/components/admin/AdminShell.jsx`** — new dedicated shell mirroring the `EmployerShell` pattern: grouped sidebar nav (Core / Jobs / Applications / Billing) with live badge counts, premium logout dropdown, search box wired to the Employers directory.
- **`AdminDashboard.jsx` restyled** — action-first layout: KPI row + a real employer-approval-queue widget (top 3 pending, SLA badges) + a critical-operations widget (flagged jobs, refund requests).
- **Enhanced `EmployerVerifications.jsx`** — SLA badges (24h default, computed from `verificationSubmittedAt`), a verification-signal checklist (email-domain match, website, LinkedIn, document), chip filters (Breached / Due < 4h / Missing docs / Domain issue), and a new **Request info** action (distinct from reject — keeps status `PENDING`, stores a note the employer sees on their own verification page) alongside Approve/Reject, all via proper modals instead of `window.prompt`.
- **New `EmployerReviewDetail.jsx`** — single-employer page (`/admin/verifications/:id`) with full identity/signal detail, a first-job-draft preview, and the same three decision actions.
- **New Employers directory** (`Employers.jsx`) — table of every employer with status/plan/job-count, search + status/plan filters, and a real **Suspend/Unsuspend** action. Suspension is enforced at the API level, not just cosmetic: suspended employers get a 403 on login and are blocked from publishing/creating jobs (verified: 403 while suspended, 200 immediately after unsuspend).
- **Candidate job-reporting** — new "Report" button/modal on `JobDetail.jsx` (reason enum + optional note) → `POST /jobs/:id/report` → new admin **Flagged Jobs** page (`JobsFlagged.jsx`) grouping reports per job with Remove (soft-deletes the job) / Dismiss (clears the reports) actions.
- **New Scraped Jobs tracker** (`ScrapedJobs.jsx`) — a real `ScrapedJob` model + admin CRUD, KPI row (live/broken/duplicate-suspect counts), and a genuine **Recrawl** action that performs a live `HEAD` request against the stored apply URL to detect broken links (no fake status toggle — verified against a real URL). Manual "Add scraped job" form since the mockup shows no import flow; deliberately does **not** include a live web-scraping crawler (out of scope — no target sites were specified, and building a generic scraper raises its own concerns).
- **DB-backed Plans** — pricing/credits/features migrated from a hardcoded `backend/src/config/plans.js` object into a real `Plan` table, with a new admin editor page (`AdminPlans.jsx`) to change price/credits/features per tier. Verified a live price edit round-trips correctly to the employer-facing Billing page.
- **New Billing overview** (`AdminBilling.jsx`) and **Refunds** (`Refunds.jsx`) pages — Billing overview lists every employer's subscription/plan/status/credits/renewal date; Refunds splits open refund requests + a recent-refunds table out of the existing `Invoices.jsx` (which is kept, unchanged, as the general invoice ledger). Added a missing **reject-refund** endpoint (only "mark refunded" existed before).
- **Admin login redesigned** (`AdminLogin.jsx`) — replaced the shared generic `<Login admin />` with a dedicated page matching the candidate/employer split-image auth pattern (form left, image right, 50/50, mobile-responsive, hidden below `lg`). Uses an already-verified Unsplash photo (corporate skyscrapers) reused from elsewhere in the codebase — no new external URLs were guessed.

### New database models/fields (this session)

```prisma
model JobReport { id, jobId, userId, reason, note, createdAt }        // candidate reports on a Job
model ScrapedJob { id, title, companyName, location, source, applyUrl, status, isDuplicateSuspect, lastCheckedAt }
model Plan { id, tier, name, priceSar, paidCreditsGranted, features }  // replaces hardcoded plans.js config

Job.flagReasons String[]
Job.reviewNote String?
JobStatus.PENDING_REVIEW (new enum value)
ScrapedJobStatus { LIVE, BROKEN, HIDDEN }

EmployerProfile.linkedinUrl String?
EmployerProfile.verificationSubmittedAt DateTime?
EmployerProfile.isSuspended Boolean @default(false)
EmployerProfile.suspendedReason String?
EmployerProfile.suspendedAt DateTime?
```

### New backend endpoints (this session)

```text
GET    /api/employer/applications                    All applications across every job the employer owns
GET    /api/employer/jobs/:id                         Fetch one job regardless of status (fixes the edit-page bug below)
POST   /api/employer/subscription/resume              Undo a scheduled cancellation
GET    /api/employer/invoices/:id/pdf                  Stream a generated invoice PDF
POST   /api/jobs/:id/report                            Candidate reports a job (auth required)

PATCH  /api/admin/jobs/:id/approve                     Approve a PENDING_REVIEW job (consumes a credit, publishes)
PATCH  /api/admin/jobs/:id/reject                      Reject a PENDING_REVIEW job (requires a note)
GET    /api/admin/jobs-flagged                         Jobs with open candidate reports
PATCH  /api/admin/jobs/:id/dismiss-reports              Clear reports on a job without removing it

GET    /api/admin/employers                            Employer directory (search/status/plan filters)
PATCH  /api/admin/employers/:id/suspend                Suspend (reason required)
PATCH  /api/admin/employers/:id/unsuspend              Unsuspend

GET    /api/admin/employer-verifications/:id           Single-employer verification detail (SLA + signals + first job)
PATCH  /api/admin/employer-verifications/:id/request-info   Request more info (status stays PENDING)

GET    /api/admin/scraped-jobs                          List + KPIs
POST   /api/admin/scraped-jobs                          Add one
PATCH  /api/admin/scraped-jobs/:id/recrawl              Real HTTP link-health check
PATCH  /api/admin/scraped-jobs/:id/mark-reviewed        Clear duplicate-suspect flag

GET    /api/admin/plans                                 List plans (DB-backed)
PATCH  /api/admin/plans/:id                             Edit a plan's price/credits/features

GET    /api/admin/billing-overview                       Every employer's subscription/plan/status
PATCH  /api/admin/invoices/:id/reject-refund            Reject a refund request (requires a reason)
```

### New frontend routes (this session)

```text
/employer/applicants              Real all-jobs Applicants page

/admin/login                      Redesigned split-image admin login
/admin/employers                  Employers directory
/admin/verifications/:id          Employer review detail
/admin/jobs-flagged               Flagged-by-candidates queue
/admin/scraped-jobs               Scraped jobs tracker
/admin/billing                    Billing overview across all employers
/admin/plans                      Plan editor
/admin/refunds                    Refunds workflow
```

### Two real bugs found and fixed while testing (unrelated to the features above)

- **Edit button silently failed on any non-`ACTIVE` job** (draft, unpublished, expired) — `EmployerEditJob.jsx` was fetching via the *public* candidate-facing `GET /api/jobs/:id` endpoint, which only returns `ACTIVE` jobs; the 404 was silently swallowed and the page redirected back to the jobs list with no error. Fixed by adding a real employer-scoped `GET /employer/jobs/:id` that returns the job regardless of status.
- **`JobForm.jsx` "value prop should not be null" React warning** on the edit page — any job with a `null` optional field (department, screening question, etc.) turned that input into an uncontrolled field. Fixed by merging `initialValue` over the form defaults field-by-field, skipping `null`/`undefined` instead of overwriting the default.

### Verification

All of the above was manually verified end-to-end this session via direct backend HTTP/Prisma checks and Playwright browser automation (not just code review): job legitimacy flagging (Gmail HR email → `PENDING_REVIEW` → admin approve/reject → public visibility correctly gated both ways), no-website employer still correctly flagged for free-webmail-but-not-domain-mismatch, Cancel/Resume Subscription full round trip with exact message wording, invoice PDF download (real file, correct filename), every new/enhanced admin page loads with real data, employer suspend/unsuspend enforced at login (403 → 200), Plans editor price-edit round trip, candidate job-report → Flagged Jobs queue → Dismiss (confirmed via direct DB check after a false-negative timing read in the test script), Scraped Jobs add + Recrawl against a real URL (correctly detected `example.com` as `LIVE`).

---

## Session: In-App Notification System (July 10, 2026)

Branch: `employer-v2`. Continues a `Notification` model + migration (`20260710062039_add_notifications`) that had been added in an interrupted prior session but never wired into the backend or frontend. This session builds the full in-app notification system per the user's spec: ~29 notification types across candidates, employers, and admins, delivered as an in-app bell (no email — explicit user decision). Email verification was explicitly excluded (not built anywhere yet). Job expiry had no backend mechanism at all before this session — built as a real feature (not just a notification), per user instruction.

### New backend infrastructure
- `backend/src/services/notificationService.js` — `notify()`, `notifyUsers()` (bulk), `notifyAdmins()` (fans out to every `ADMIN` user), and `notifyJobClosedForCandidates(job)` (shared helper: notifies every applicant + every user who saved the job that it closed — reused by every place a job leaves `ACTIVE`).
- `backend/src/services/jobExpiryService.js` — `expireOverdueJobs()`. New feature: lazily sweeps `ACTIVE` jobs whose `expiresAt` has passed, flips them to `EXPIRED`, notifies the employer and every applicant/saver. Mirrors the existing "check on read" pattern (same style as the monthly free-job reset and the scheduled-cancellation downgrade) since there's no cron/queue in this app. Called at the top of the three main job-list reads: public `listJobs`, `listAdminJobs`, `listEmployerJobs`.
- `backend/src/controllers/notificationController.js` + `backend/src/routes/notificationRoutes.js` — `GET /api/notifications` (paginated, includes `unreadCount`), `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`. Mounted at `/api/notifications`, protected by `authenticate` only (role-agnostic — works for candidates, employers, and admins alike).
- `backend/prisma/schema.prisma` — added `FAILED` to the `InvoiceStatus` enum (migration `20260710063844_add_invoice_failed_status`) so "Payment failed" has a real backing mechanism instead of being purely decorative, matching how billing is admin-managed (no real gateway). New `markInvoiceFailed` admin action (mirrors the existing mark-paid/mark-refunded pattern) — `PATCH /api/admin/invoices/:id/mark-failed` with a required reason, surfaced in `Invoices.jsx` via a new "Mark failed" button + reason modal (same pattern as `Refunds.jsx`'s reject-refund modal).

### Every trigger point wired (by controller)
- `applicationController.apply` — candidate gets "Application submitted"; the job's employer gets "New application received"; admins get "High number of applications on a job" the moment the running application count on that job crosses 10/25/50/100/250/500.
- `adminController` — `updateJobStatus`/`deleteJob` now fetch the job first (was a blind `updateMany`) so they can fire `notifyJobClosedForCandidates` when a job leaves `ACTIVE`; `approveJobReview` fires "Job published" to the employer and passes an `actor` into `consumeJobCredit` for the free-limit notifications.
- `employerController` — `createEmployerJob`/`updateEmployerJobStatus`: "Suspicious job detected" to admins when legitimacy-flagged, "Job published" to the employer on successful publish, "Publishing blocked" to the employer on the unverified-company 403 and the no-credits 402, "Job manually closed" to admins when an employer (not admin) closes their own job. `deleteEmployerJob` fires job-closed notifications. `submitVerificationDocument` → "New company verification request" to admins. `updateEmployerProfile` → "Company details updated after rejection" to admins, only when the prior status was `REJECTED`.
- `employerBillingService.consumeJobCredit` — now takes an `actor` (`{userId, companyName}`) and fires "Free job limit used" (employer) + "Employer hit free job limit" (admins) when the free monthly credit is consumed, and "Publishing blocked" (employer) when both free and paid credits are exhausted. `getOrCreateSubscription`'s existing lazy cancel-at-period-end downgrade now also fires "Subscription ended".
- `adminEmployerBillingController` — `approveVerification`/`rejectVerification` → "Company approved"/"Company rejected" to the employer. `markInvoicePaid` → "Payment successful" always, plus "Subscription activated" for `SUBSCRIPTION` invoices. New `markInvoiceFailed` → "Payment failed" (employer) + "Payment failed for company" (admins).
- `employerBillingController` — `requestCreditPurchase`/`requestPlanChange` → "Invoice available". `requestRefund` → "Refund/cancellation request" to admins. `cancelSubscription` → "Cancellation scheduled" (employer) + "Subscription cancelled" (admins).
- `authController` — `registerEmployer` → "New employer registered" to admins. `changePassword`/`resetPassword` → "Password/security alert" (`SECURITY_ALERT` type) to the account owner.
- `profileController` — `updateProfile` and `uploadResume` → "CV/profile updated" (candidate). Deliberately not fired from photo upload/delete or employment/education/certification sub-entry CRUD to avoid notification spam.
- `jobController.listJobs` — calls `expireOverdueJobs()` before every public job search.

Not implemented: email verification notification (explicitly deferred by the user — no email-verification flow exists in the app at all).

### Frontend
- `frontend/src/api/notifications.js`, `frontend/src/store/notificationStore.js` (Zustand, same idiom as `savedJobsStore.js`: `fetch`/`markRead`/`markAllRead`/`reset`), `frontend/src/components/common/NotificationBell.jsx` — bell icon with unread-count badge, dropdown panel (title/message/relative time per item, unread dot, empty state, "Mark all as read"), click-outside/Escape close pattern copied from the existing avatar-menu components. Polls every 30s while a user is logged in.
- `frontend/src/utils/formatDate.js` — added `formatRelativeTime()` ("Just now" / "5m ago" / "3h ago" / "2d ago" / falls back to `formatDate`).
- Wired into all three authenticated shells: `Navbar.jsx` (candidate + guest-facing shell — bell shown for any logged-in role since non-candidates can still browse public pages), `EmployerShell.jsx`, `AdminShell.jsx`. Each shell's logout handler now also calls the store's `reset()`.

### Verification performed
Extensive live end-to-end testing against the running dev servers via direct HTTP (curl) and Prisma script checks: registered a throwaway candidate + employer, drove the full chain — profile update → notification created → marked read → unread count updated correctly; employer registration → admin notified; admin approved verification → employer notified "Company approved"; employer published a job → "Job published" + "Free job limit used" (employer) + "Employer hit free job limit" (admin) all fired correctly; candidate applied → "Application submitted" (candidate) + "New application received" (employer); employer manually closed the job → "Applied job closed" (candidate) + "Job manually closed" (admin); forced a job's `expiresAt` into the past and hit the public job-listing endpoint to confirm the new `expireOverdueJobs()` sweep actually flips `ACTIVE → EXPIRED` and fires "Job listing expired" (employer) + "Applied job closed" (candidate). Also drove the bell through a real browser with Playwright — confirmed the unread badge, populated dropdown, relative timestamps, and "Mark all as read" all render correctly (one red herring during this pass: a notification appeared to never arrive in the browser, traced to the dev-environment `/api/notifications` call occasionally taking several seconds to resolve under this session's heavy concurrent test load — not a code defect; state updated correctly once the promise resolved). All test users, jobs, and notifications created during verification were deleted afterward. `npm run lint` (both workspaces) and `npm run build --workspace frontend` re-confirmed zero new errors — remaining lint errors are pre-existing and in files untouched by this session.

### New backend endpoints (this session)
```text
GET    /api/notifications                 Paginated list + unreadCount
PATCH  /api/notifications/:id/read         Mark one notification read
PATCH  /api/notifications/read-all         Mark all read

PATCH  /api/admin/invoices/:id/mark-failed Mark a pending invoice as payment-failed (requires reason)
```

---

## Session: Cross-Portal Auth Fixes, Route Lazy-Loading, and Frankfurt Infra Migration (July 23, 2026)

Branch: `billing_and_payment`. Two commits: `db118e8` (code fixes, pushed) plus a large amount of **infrastructure work done via API** (Vercel/Render/Supabase CLIs and Management APIs) that has no corresponding git diff but materially changes what "the deployed app" means — see Live URLs above.

### Bug reports investigated and fixed

- **Employer login failing with "This portal is for employers only" after switching from Admin.** Root cause was **not** the frontend leaking admin role into the login request (verified: `POST /auth/login` only ever sends `email`/`password`, and the backend ignores any `Authorization` header for login, using only body credentials). The real cause is almost certainly the browser's own password manager autofilling the wrong saved account, since all three portals lived at the same origin with generic `autoComplete` hints and no `name` attributes. Fixed by giving each portal's email/password fields distinct `name` attributes and `autoComplete="username"`, and — more importantly — making the error message name the actual matched account: *"This portal is for employers only. `x@y.com` is registered as admin — check that your browser didn't autofill the wrong account."* Applied to `AdminLogin.jsx`, `EmployerLogin.jsx`, and the (currently unrouted) admin/employer paths of `Login.jsx`.
- **A second, real bug found in the process:** `frontend/src/routes/PublicOnlyRoute.jsx` silently redirected an already-authenticated user straight to their own portal's dashboard when they landed on a *different* portal's login page, with zero explanation. Replaced with an interstitial ("You're signed in as Administrator — log out to sign in to the Employer portal instead, or continue to your current dashboard") with explicit Log out / Go to dashboard actions, instead of a silent bounce.
- **"Remember me" cross-portal contamination** — investigated and found to already be fixed by an earlier commit (`399410b`, before this session): `AdminLogin.jsx`, `EmployerLogin.jsx`, and `Login.jsx` each read/write their own separate `localStorage` key (`admin_remember_email`, `emp_remember_email`, `candidate_remember_email`). What the user was actually seeing is native browser/password-manager autofill (see above), which the app's own "remember me" was never the cause of.
- **Public "Admin login" link in the site footer** (`Footer.jsx`, "For Employers" column) — removed entirely; admins should reach `/admin/login` via a direct/bookmarked URL, not a link every anonymous visitor and bot can see. Found and fixed a second, unrelated bug in the same two lines: "Post a role" was linking to `/admin/jobs/create` (an admin-only route) instead of `/employer/register` — a prospective employer clicking it would have been bounced to the admin login page.

### Root cause of the underlying autofill issue — architectural, not a quick fix

Diagnosed that browser/password-manager autofill is scoped by **origin** (scheme+host), not by URL path. Since `/admin/login`, `/employer/login`, and `/login` all lived on the same origin, no amount of frontend `autoComplete`/`name` tuning can fully prevent a saved credential from one portal being offered on another's login form — the interstitial + "this account is registered as X" error message are the practical mitigations; genuinely fixing it requires separate subdomains per portal (see below).

### Route-level lazy loading (`App.jsx`)

Converted every page-level import from static `import` to `React.lazy()` + a single top-level `<Suspense>` boundary around the route tree. Shared/structural components (layouts, route guards) stayed static. Result: main entry bundle dropped from **640KB → 261KB** (170KB → 85KB gzipped), verified via a clean production build with no warnings. All routes across all three portals re-tested with Playwright after the change — no broken navigation, no console errors beyond the expected pre-login 401.

### `PortalHome.jsx` — host-aware landing page

New component (`frontend/src/routes/PortalHome.jsx`), wired as the `index` route in `App.jsx`. Reads `window.location.hostname` against a small allowlist (`admin.saudiacareers.com` / `saudiacareers-admin.vercel.app` → admin login/dashboard; same pattern for employer) and redirects accordingly; anything else falls through to the normal candidate `Landing` page. This only affects the root `/` path — every other route (e.g. `saudiacareers-admin.vercel.app/jobs`) is still reachable and renders exactly as it would on the candidate domain, since all three Vercel projects ship the identical bundle. This is a convenience/UX layer only — it is **not** a security boundary; actual role-based access is still enforced by `AdminRoute`/`EmployerRoute`/`PrivateRoute` client-side and by `authorizeAdmin`/`authorizeEmployer` middleware server-side, unchanged.

### Numbered pagination (`Pagination.jsx`)

Replaced the Previous/Next-only pagination (which had never actually had page numbers, in any commit, on any branch — checked full git history before building this) with real clickable page numbers, ellipsis-truncated for long lists (`1 2 … 19 20` style, verified via a standalone logic test: `page 10 of 20` → `1 2 … 9 10 11 … 19 20`). Single shared component, so this automatically applies everywhere it's used: public Jobs listing, admin Manage Jobs / Employers / Billing, and employer Jobs / Applications / Applicants — 7 call sites, no call-site changes needed since the prop interface (`page`/`totalPages`/`onPageChange`) didn't change.

### 53 test jobs seeded (`backend/seedFiftyTestJobs.mjs`, left in the repo, untracked)

Populated the (previously **empty** — there were zero real job listings before this) database with 53 jobs spanning all 14 `INDUSTRIES` categories and a mix of statuses (33 `ACTIVE`, plus `INACTIVE`/`PENDING_REVIEW`/`DRAFT`/`EXPIRED`), specifically to stress-test UI text handling: a 108-char title, a ~100-char company name containing one long unbroken string with no spaces, a full Arabic title/company/description mixed with English, and a minimal one-word title/company at the other extreme. Verified via Playwright screenshots across the public job card, public job detail, admin job table, and admin edit form — no overflow or layout breakage found anywhere; the app's existing `word-break`/`overflow-wrap` handling was already solid. Arabic text renders left-aligned (not RTL-aware), which matches `CLAUDE.md`'s explicit "Arabic/RTL out of scope for MVP," not a bug.

### Infrastructure: 3-domain Vercel split (autofill fix, in production)

Given credentials for Vercel, Render, and Supabase this session (user-provided CLI/API tokens), executed the "lighter" version of a subdomain-isolation strategy: rather than a full monorepo split into three separate app bundles (estimated 3-5 days of work, real regression risk on a codebase with live billing), deployed the **same, unmodified codebase** to three separate Vercel projects (`saudiacareers-frontend` already existed; `saudiacareers-employer` and `saudiacareers-admin` created this session), each independently connected to the same GitHub repo/branch. This gives genuine origin-level separation (fixes the autofill root cause) without the cost/risk of a full code split. One mistake made and immediately corrected: the first `vercel link --yes` auto-created an unwanted duplicate empty project (`frontend`) instead of linking the existing one — caught immediately, deleted (zero data loss, it was empty), and re-linked correctly with an explicit `--project` flag.

**Known limitation, deliberately accepted for now:** because all three Vercel projects call the same backend host, the refresh-token cookie is scoped to that host regardless of which frontend triggered the request — so a session can still silently "leak" across portals at the cookie level (though **not** a security hole, since backend role checks still gate everything; the `PublicOnlyRoute` interstitial handles the UX gracefully). Full isolation would need per-portal API hostnames pointed at the same backend with host-only cookies — noted as a future option, not done.

### Infrastructure: Frankfurt region migration (biggest piece of work this session)

**Why:** user asked why localhost felt slow loading the candidate dashboard/jobs despite the lazy-loading work. Diagnosed via direct Prisma benchmarking, not guesswork: a single `job.findMany()` query was taking **1.5–6 seconds**. Traced to Render's backend running in **Oregon** while Supabase's database was in **`ap-southeast-2` (Sydney)** — about as geographically far apart as two points on Earth can be. Checked Render's and Supabase's full region lists via their docs/APIs; found Render's 5 regions (Oregon, Ohio, Virginia, Frankfurt, Singapore) each have an exact-name match on Supabase's 16 AWS regions. Given the app's actual target market is Saudi Arabia/GCC (not the US), **Frankfurt** was chosen over Oregon deliberately — better MENA connectivity than any US region, not just "wherever Render happened to default to."

**What was done, end to end, this session:**
1. New Supabase project created in `eu-central-1` (Frankfurt) via the Management API (Personal Access Token, not a project-scoped key — those are different things, documented for future reference: project API keys ≠ account-level PAT needed for platform actions like creating projects).
2. Schema applied via `prisma migrate deploy` (all 18 migrations).
3. New Render web service created in Frankfurt, same repo/branch/build config as production.
4. **Real bug hit and fixed:** new Render service failed to boot with `FATAL: (ENOTFOUND) tenant/user ... not found`. Root cause was **not** Supabase-side flakiness (initially suspected) — it was a wrong pooler shard hostname (`aws-1-eu-central-1` assumed by copying the pattern from an earlier Oregon test, instead of re-fetching from the API; the actual shard was `aws-0-eu-central-1`). Pooler shard numbers are per-project/region assignments, not a fixed constant — always fetch via `GET /v1/projects/{ref}/config/database/pooler` rather than assuming.
5. **Data migration:** no `pg_dump`/`psql` available locally, so wrote a Node script (`backend/migrateToFrankfurt.mjs`, deleted after use) using two `PrismaClient` instances (source/dest) instead. Used `SET session_replication_role = replica` on the destination during load to sidestep FK-ordering and self-referential edge cases (`Job.revisesJobId`, `Invoice.refundsInvoiceId`) rather than hand-computing insert order. All 24 real data rows across every table migrated with **exact row-count and spot-checked content matches** (verified `Invoice` records — the most sensitive table — byte-for-byte identical including IDs and timestamps). Sequences reset to `MAX(id)` afterward, confirmed correct (ID gaps preserved on both sides).
6. **Storage migration:** 25 files (avatars, resumes, employer verification documents) copied via direct Storage REST API calls (`backend/migrateStorage.mjs`, deleted after use) — download from Sydney, upload to Frankfurt, all 25/25 succeeded, counts verified matching on both sides. Note: DB shows all *current* candidate resumePath/profilePhotoPath/employer logoPath as `null` — the resume/avatar files that exist in storage are orphaned from deleted test accounts, not live data. The 6 `employer-verification/*` files **are** live (referenced by current `EmployerProfile` records) and were the ones that actually mattered here.
7. **Cutover:** updated `VITE_API_URL` on all 3 Vercel projects to the new Frankfurt backend URL, redeployed all 3, verified via checking the actual shipped JS bundles that they reference the new backend host. Updated backend `ALLOWED_ORIGINS` on the new Frankfurt Render service (copied from the old service — origins didn't change, only the backend did). Updated local `backend/.env` to the new Frankfurt connection strings too, so local dev and production now share one database.
8. **Verified end-to-end** post-cutover: public jobs listing on the live `saudiacareers-frontend.vercel.app` correctly shows "33 roles found" (real migrated data), admin login on `saudiacareers-admin.vercel.app` succeeds and lands on `/admin/dashboard` — full auth flow confirmed working against the new stack.
9. **Measured improvement:** old Oregon→Sydney path averaged ~2.4s per request; new Frankfurt→Frankfurt averaged ~0.4s. Real side-by-side curl timing, not estimated.
10. **Old resources paused, not deleted** (explicit user request — wanted a rollback buffer before committing to deletion): old Render service (`srv-d8t4djmq1p3s738vbj7g`, Oregon) suspended via API; old Supabase project (`slrqzvqwqrskbglptasj`, Sydney) paused via API. Both can be resumed if something is later found to be missing from the migration, and deleted later once confidence is high.

**Also diagnosed but explicitly deferred (per user, low on funds):** Render's free tier sleeps the service after ~15 min idle, causing 30-60s cold-start on the next request — flagged as a real pre-launch blocker, separate from the region question, not yet addressed.

**Also diagnosed but not yet acted on:** Prisma's connection through Supabase's PgBouncer transaction-mode pooler showed roughly 1 second of overhead per query versus a direct connection on the *same* database in local testing — but this may be confounded by the local test machine's own network routing (a raw TCP-connect-only benchmark showed inconsistent, non-geography-matching latency to different pooler hostnames from this specific machine, so it isn't fully trustworthy as a proxy for what Render's own network experiences). Since Render runs a single persistent process (not serverless), it likely doesn't need transaction-mode pooling at all — session-mode or a tuned direct connection may be more appropriate. Explicitly deferred by user request ("revisit pooling strategy later") — worth a fresh look once the free-tier upgrade happens, since testing it properly needs to happen from Render itself, not from a local machine.

### Verification performed this session

Real end-to-end testing throughout, not just code review: Playwright browser automation against both local dev servers and live production URLs (login flows across all three portals with disposable test accounts created and cleaned up afterward), direct Prisma/SQL benchmarking for the latency diagnosis, curl-based CORS preflight and timing checks, and manual row-count/content verification after the data migration. All temporary test accounts (`portal_test_admin@test.com`, `portal_test_employer@test.com`, `ui_test_admin@test.com`, `cutover_test_admin@test.com`) were created and deleted within this session — none left behind.

### New/changed files this session

```text
frontend/src/routes/PublicOnlyRoute.jsx     Interstitial instead of silent cross-portal redirect
frontend/src/routes/PortalHome.jsx           New — host-aware landing redirect
frontend/src/pages/admin/AdminLogin.jsx      name/autoComplete fix, error message names matched account
frontend/src/pages/employer/EmployerLogin.jsx  Same
frontend/src/pages/auth/Login.jsx            Same (admin/employer paths, currently unrouted)
frontend/src/components/layout/Footer.jsx    Removed public Admin login link, fixed Post-a-role link
frontend/src/components/common/Pagination.jsx  Numbered pagination with ellipsis truncation
frontend/src/App.jsx                          All page imports converted to React.lazy()
backend/seedFiftyTestJobs.mjs                 Left in repo (untracked) — 53 test jobs, reusable
```

### Not done / left for a future session

- Full app-per-portal code split (3 separate bundles) — deliberately not pursued; the lighter 3-domain-same-bundle approach already fixes the actual autofill problem.
- Per-portal API hostnames for true cookie-level session isolation — noted as an option, not built.
- Hostinger DNS / custom domain setup — still entirely manual, needs the user's Hostinger login.
- Render free-tier upgrade — flagged as a real pre-launch blocker, deferred due to budget.
- Pooling strategy reassessment (session-mode vs. transaction-mode PgBouncer) — deferred per user request.
- Deleting (vs. pausing) the old Oregon Render service and Sydney Supabase project.
- The 53 seeded test jobs should probably be cleared out before a real launch.
- A second, apparently-unused Render service (`saudiacareers`, `saudiacareers.onrender.com`) was noticed but never investigated or touched — may be stale/leftover from earlier setup.

---

## Session: Suspended Employer Login/Post Behavior Change (July 24, 2026)

Branch: `billing_and_payment`. Triggered by the user reporting a confusing message — "This account has been suspended: trtyrt" — shown to an employer right after an admin suspended their account. Investigated and confirmed this was not a bug: `trtyrt` was literally the suspension reason an admin had typed into the Suspend modal's free-text "Reason" field, which was then interpolated verbatim into the **login-blocking** 403 error (`authController.js` `login()` previously threw 403 for any suspended employer before a session was ever established).

### Business rule change requested by the user
Suspended employers should still be able to log in and see their account (to understand why they were suspended and what to do about it) — only job posting/publishing should be blocked, not access to the account itself.

### Backend
- `backend/src/controllers/authController.js` — removed the `isSuspended` check entirely from `login()`. Suspended employers now authenticate normally like any other user.
- No change needed to job creation/publishing — `employerController.js` already independently blocks `createEmployerJob` (line ~351) and the ACTIVE-transition path of `updateEmployerJobStatus` (line ~470) with `isSuspended` checks scoped to those actions, not to login. This was already correct and is unchanged.

### Frontend
- `frontend/src/components/employer/EmployerShell.jsx` — added a persistent red suspension banner (shown across every employer-portal page, not just the dashboard) displaying `suspendedReason`, replacing the existing verification-pending banner when suspended (suspension takes priority).
- `frontend/src/pages/employer/EmployerDashboard.jsx` — added a suspension notice card with the reason and guidance text; the "Post a job" button is hidden entirely when `profile.isSuspended` is true.
- `frontend/src/pages/employer/EmployerCreateJob.jsx` — added a client-side guard: navigating directly to `/employer/jobs/create` while suspended now renders a message instead of the job form (defense in depth; the backend 403 was already the real enforcement).
- `frontend/src/pages/admin/Employers.jsx` — corrected the Suspend confirmation modal's copy, which previously (inaccurately) said "Suspended employers cannot log in, post, or renew" — now says they can still log in and view their dashboard, only posting/publishing is blocked.

### Not done / explicitly out of scope for this change
- No suspension check was added to billing/credit-purchase actions (`employerBillingController.js`) — only job creation/publishing is blocked, matching the user's stated intent ("they need to access the account to manage it"). If the user later wants suspended employers blocked from buying credits too, that's a separate, small addition to that controller.
- Did not touch the `Job.status` ACTIVE-transition suspension check or any other already-correct backend enforcement — only the login-time block was removed.
