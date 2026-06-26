# SaudiaCareers Project Progress

Last updated: June 26, 2026 (Job-filters session 3 — saved jobs)

Future sessions must read both `CLAUDE.md` and this file before coding.

## Current Checkpoint

The app is fully deployed and live in production. Backend is on Render, frontend is on Vercel. Supabase and Resend are configured with real credentials. The production database has migrations applied and the admin user seeded. A UI enhancement pass is next — design references will be placed in `ui-refs/` and the redesign will be done on the `app-enhancement` branch.

Current branch: `Job-filters` (branched from `app-enhancement`/`main` on June 26, 2026).

## Live URLs

| Service | URL |
|---|---|
| Frontend (Vercel) | `https://saudiacareers-frontend.vercel.app` |
| Backend (Render) | `https://saudiacareers-1.onrender.com` |
| Health check | `https://saudiacareers-1.onrender.com/api/health` |
| Custom domain (pending DNS) | `https://saudiacareers.com` |

## Deployment Status

- Backend deployed to Render (free tier, Singapore region, spins down after inactivity)
- Frontend deployed to Vercel with `vercel.json` SPA rewrite rules
- Production database: Supabase PostgreSQL — migration `20260619180000_init` applied, admin seeded
- Supabase Storage bucket `SaudiaCareers` — private, verified working
- Resend API key configured — domain `saudiacareers.com` verification still pending
- DNS (Hostinger → Vercel/Render) not yet configured — using Vercel/Render default URLs for now

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
