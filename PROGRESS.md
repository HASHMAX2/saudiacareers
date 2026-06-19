# SaudiaCareers Project Progress

Last updated: June 19, 2026

Future sessions must read both `AGENTS.md` and this file before coding.

## Current Checkpoint

The repository-side MVP and responsive frontend redesign are implemented. Static validation, production builds, dependency audit, and seven backend validation tests pass.

Local PostgreSQL is running in Docker and the initial migration and seed have been applied successfully. The frontend and backend development servers are currently stopped. Supabase and Resend still require valid external credentials and configuration.

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

### Responsive UI/UX redesign

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

UI verification completed:

```bash
npm run lint
npm run build
```

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
Frontend development server: stopped
Backend development server: stopped
```

## Partially Completed

### Live database verification

- Schema and migration files exist.
- Local `backend/.env` and `frontend/.env` files now exist.
- PostgreSQL 16 is reachable through Docker on `localhost:5432`.
- The initial migration has been applied successfully.
- The seed command completed successfully.
- The backend has started successfully and its health endpoint was verified previously.
- Full database-backed API behavior has not yet been exercised through integration or browser end-to-end tests.

### Automated testing

- Validation unit tests exist and pass.
- Database integration tests, HTTP endpoint tests, frontend component tests, and end-to-end application-flow tests still require a test database and additional test harness setup.

### Live Resend and Supabase verification

- Real integration code is implemented.
- No credentials or private bucket are configured, so actual upload/download/email behavior has not been verified.
- Resend domain verification and production test emails remain external tasks.

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
/dashboard/applications
/admin/login
/admin/change-password
/admin/dashboard
/admin/jobs
/admin/jobs/create
/admin/jobs/:id/edit
/admin/applications
/admin/applications/:id
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

1. Configure valid Supabase and Resend credentials in `backend/.env`.
2. Create and verify the private Supabase storage bucket.
3. Start the backend and frontend development servers when testing.
4. Run database-backed HTTP integration and browser end-to-end tests.
5. Perform manual responsive browser review at 375px, 768px, and 1366px with live data.
6. Fix any runtime or visual defects found by those tests.
7. Commit the repository.
8. Deploy Render and Vercel.
9. Configure DNS and complete the production checklist in `AGENTS.md`.
