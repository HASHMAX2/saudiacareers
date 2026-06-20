# SaudiaCareers — Job Portal (MVP)

## Current Focus
Read `progress.md` first to understand what has been built and what is pending.
Do not rebuild completed modules. Continue from where progress.md indicates.

---

## Coding Conventions
- Use async/await — no .then() chains
- All API calls go in `frontend/src/api/` — never fetch inside components directly
- All backend errors go through `ApiError` and `asyncHandler` utils
- Zod validation schemas live in `backend/src/validation/` — one file per domain
- Frontend form validation must mirror backend Zod schemas
- Required fields must have * mark in UI labels
- Show inline error messages under each field, not just toast notifications
- Tailwind CSS only — no inline styles, no separate CSS files
- No hardcoded strings — use constants from `frontend/src/utils/constants.js`

---

## Project Overview
A full-stack job portal for the Saudi Arabian market. Admins publish job openings; candidates create profiles, upload resumes, search jobs, and apply with one click. On application, the system emails the candidate's profile + resume to the HR email specified on the job listing and stores the application in the database.

---

## Canonical Domains

| Purpose | Domain |
|---|---|
| Frontend website | `https://saudiacareers.com` |
| Frontend www alias | `https://www.saudiacareers.com` |
| Backend API | `https://api.saudiacareers.com/api` |
| Admin email | `admin@saudiacareers.com` |
| System email | `noreply@saudiacareers.com` |

DNS will remain managed from Hostinger because the domain was purchased there. Hosting will be handled separately through Vercel and Render.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS |
| State Management | Zustand |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (hosted on Supabase) |
| ORM | Prisma |
| Auth | JWT (access token 15min + refresh token 7 days via httpOnly cookie) |
| File Storage | Supabase Storage |
| Email | Resend |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git + GitHub |

---

## Project Folder Structure

```
SaudiaCareers/
├── frontend/                   # React app
│   ├── public/
│   ├── src/
│   │   ├── api/                # Axios instance + all API call functions
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Button, Input, Badge, Modal, Toast, Spinner
│   │   │   ├── layout/         # Navbar, Footer, Sidebar
│   │   │   ├── jobs/           # JobCard, JobFilters, JobList
│   │   │   └── admin/          # AdminSidebar, MetricCard, ApplicationTable
│   │   ├── pages/
│   │   │   ├── public/         # Landing, Jobs, JobDetail
│   │   │   ├── auth/           # Login, Register, ForgotPassword, ResetPassword
│   │   │   ├── candidate/      # Dashboard, Profile, MyApplications
│   │   │   └── admin/          # AdminDashboard, ManageJobs, CreateJob, EditJob, Applications, ApplicationDetail
│   │   ├── routes/             # PrivateRoute, AdminRoute, PublicOnlyRoute
│   │   ├── store/              # Zustand stores (authStore, jobStore)
│   │   ├── hooks/              # useDebounce, useAuth, usePagination
│   │   ├── utils/              # formatDate, validators, constants
│   │   └── App.jsx             # Router setup
│   ├── .env
│   └── package.json
│
├── backend/                    # Express API
│   ├── prisma/
│   │   ├── schema.prisma       # Full DB schema
│   │   └── seed.js             # Seed admin user + sample jobs
│   ├── src/
│   │   ├── controllers/        # auth, profile, jobs, applications, admin
│   │   ├── middleware/         # authenticate, authorizeAdmin, rateLimiter, errorHandler, validate
│   │   ├── routes/             # auth, profile, jobs, applications, admin
│   │   ├── services/           # emailService, storageService, tokenService
│   │   ├── utils/              # asyncHandler, ApiError, ApiResponse
│   │   └── app.js              # Express app setup
│   ├── server.js               # Entry point
│   ├── .env
│   └── package.json
│
├── CLAUDE.md                   # This file — Claude Code reads it every session
└── README.md
```

---

## All Frontend Routes

```
/                            Landing page (public)
/jobs                        Job listings with search + filters (public)
/jobs/:id                    Job detail page (public)
/login                       Candidate login
/register                    Candidate registration
/forgot-password             Forgot password
/reset-password/:token       Reset password via email link
/dashboard                   Candidate dashboard (protected)
/dashboard/profile           Candidate profile + resume upload (protected)
/dashboard/applications      My applications (protected)
/admin/login                 Admin login (separate from candidate login)
/admin/change-password       Forced password change after first admin login
/admin/dashboard             Admin dashboard with metrics (admin only)
/admin/jobs                  Manage all jobs (admin only)
/admin/jobs/create           Create new job (admin only)
/admin/jobs/:id/edit         Edit existing job (admin only)
/admin/applications          View all applications (admin only)
/admin/applications/:id      Application detail view (admin only)
/unauthorized                403 page
/*                           404 page
```

### Route Guards
- `<PrivateRoute>` — requires authenticated candidate, redirects to `/login`
- `<AdminRoute>` — requires role === 'admin', redirects to `/unauthorized`
- `<PublicOnlyRoute>` — redirects already-logged-in users away from `/login` and `/register`
- Admin users with `mustChangePassword === true` must be redirected to `/admin/change-password` before they can access the admin dashboard.

---

## Auth System

### Candidate Auth
- Register: name, email, mobile, password (bcrypt hash, 12 salt rounds)
- Check for duplicate email before saving
- Login: email + password → return JWT access token (15min) + set httpOnly refresh token cookie (7 days)
- Access token stored in Zustand memory (NOT localStorage — XSS protection)
- Refresh token in httpOnly cookie — auto-renew access token silently
- Forgot password: generate reset token → email link → `/reset-password/:token` (token expires in 1 hour)
- Change password: from profile settings (requires current password)
- Logout: clears tokens, invalidates refresh token in DB

### Admin Auth
- Separate login page at `/admin/login`
- Admin accounts seeded via `prisma/seed.js` — no self-registration
- Same JWT flow, role = 'ADMIN'
- Default admin: email `admin@saudiacareers.com`, password `Admin@1234`
- Seeded admin must have `mustChangePassword = true`
- On first admin login, force password change before accessing `/admin/dashboard`
- After successful password change, set `mustChangePassword = false`
- Seed script should never run automatically in production unless explicitly triggered.

### Backend Auth Middleware
- `authenticate` — verifies JWT, attaches user to `req.user`
- `authorizeAdmin` — checks `req.user.role === 'ADMIN'`
- `requirePasswordChangeComplete` — blocks admin dashboard/admin APIs if `mustChangePassword === true`, except password-change endpoint
- Rate limiting on `/auth/login` and `/auth/register` — 10 requests per 15 minutes per IP

---

## Production Cookie, CORS, and Axios Rules

Because the frontend is hosted on Vercel and the backend is hosted on Render, production auth must be configured carefully.

### Backend Cookie Settings
Refresh token cookie must be set like this in production:

```js
cookie: {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
}
```

Optional when using subdomains:

```js
cookie.domain = ".saudiacareers.com";
```

Do not set `secure: false` in production.

### Backend CORS Settings
Backend must allow credentials and must never use wildcard `*` when cookies are involved.

```js
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(","),
  credentials: true,
}));
```

Allowed production origins:

```
https://saudiacareers.com
https://www.saudiacareers.com
```

Allowed local origin:

```
http://localhost:5173
```

### Frontend Axios Settings
Axios instance must always send credentials:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});
```

Auto-refresh logic:
- If API returns 401 because access token expired, call `/api/auth/refresh-token`
- If refresh succeeds, retry original request
- If refresh fails, clear Zustand auth state and redirect to login

---

## Candidate Module

### Registration
- Validate: email format, password min 8 chars with 1 uppercase + 1 number, Saudi mobile format (+966XXXXXXXXX)
- Check duplicate email
- Hash password with bcrypt
- Send welcome email via Resend
- Return JWT on success

### Profile
- Personal: full name, email (read-only), mobile number, location (dropdown: Riyadh, Jeddah, Dammam, Other)
- Professional: current designation, total experience (dropdown), skills (comma-separated tags), education, professional summary (optional)
- Profile completion percentage shown as a progress bar (pushes candidates to complete profile)
- Profile photo upload (optional) — stored in Supabase Storage under `avatars/`
- Store profile photo storage path in DB, not a public URL
- Generate signed URL when profile photo needs to be viewed if bucket is private

### Resume Management
- Upload: PDF, DOC, DOCX only — max 5MB
- Validate file type on BOTH frontend (file input accept) AND backend (check MIME type, not just extension)
- Store in Supabase Storage under `resumes/` folder
- Save `resumePath`, `resumeFilename`, and `resumeUploadedAt` in `candidate_profiles` table
- Do NOT store public resume URLs in the database
- Replace resume: delete old file from Supabase Storage using old `resumePath`, upload new one, save new path
- Download: generate signed URL from Supabase using `resumePath` (expires in 1 hour — never expose public URLs)
- Show filename and upload date in UI

---

## Job Module

### Public Job Listings
- Paginated: 10 jobs per page
- Search: job title, skills, company name — debounced 400ms (don't fire API on every keystroke)
- Filters: location, industry, experience level, employment type
- Sort: newest first (default), deadline soonest
- Jobs past their deadline: show "Closed" badge, disable Apply button
- Inactive jobs: never shown on public listings

### Job Card (listing page)
Shows: title, company, location, experience, employment type, posted date, salary (if provided), Apply Now button

### Job Detail Page
Shows: all fields above + full description, required skills as tags, application deadline, Apply Now button
- If already applied: button replaced with "Applied ✓" badge
- Share job: copy job URL to clipboard

### Admin Job Management
- Create job form with all fields
- Edit job: pre-filled form
- Delete job: SOFT DELETE only (`isDeleted = true`) — never hard delete, preserves application history
- Activate / Deactivate: toggle `status` field
- Job list table: searchable, filterable by status
- View applications per job directly from job list

---

## Application Module

### Candidate Apply Flow (strict order)
1. Candidate clicks "Apply Now"
2. Frontend checks: is user logged in? → if not, redirect to `/login` with message
3. Frontend checks: is profile complete (designation + experience + skills filled)? → if not, redirect to `/dashboard/profile` with message
4. Frontend checks: is resume uploaded? → if not, redirect to `/dashboard/profile` with message
5. Frontend checks: has user already applied? → if yes, show "Already applied" toast
6. All checks pass → POST `/api/applications`
7. Backend re-validates all checks (never trust frontend alone)
8. Application record created in DB with status `APPLIED`
9. Backend sets `hrEmailStatus = PENDING`
10. Backend triggers HR email asynchronously (don't block the response)
11. If HR email succeeds → set `hrEmailStatus = SENT`, set `hrEmailSentAt`
12. If HR email fails → set `hrEmailStatus = FAILED`, save short error in `hrEmailError`
13. Return success → frontend shows success toast, button changes to "Applied ✓"

### HR Email (sent on every application)
- To: `job.hrEmail`
- Subject: `Application for [Job Title] – [Candidate Full Name]`
- Body: full name, email, mobile, experience, skills, professional summary
- Attachment: candidate resume (fetched from Supabase Storage using `resumePath`)
- Sent via Resend API
- Email failure should not block the candidate application response, but must be logged in the database

### Candidate: My Applications
- List: job title, company, applied date, current status
- Status badges: Applied (blue), Under Review (amber), Selected (green), Rejected (red)
- No withdrawal in MVP (noted for v2)

### Admin: Application Management
- Table: candidate name, email, mobile, applied job, date, status, HR email status, resume download button
- Search: by candidate name or job title
- Filter: by job, by status, by HR email status
- Change application status → triggers email notification to candidate
- Export to CSV: all applications or filtered set
- Download resume: generates signed URL

---

## Email Notifications (all via Resend)

| Trigger | To | Subject |
|---|---|---|
| Candidate registers | Candidate | Welcome to SaudiaCareers |
| Candidate applies | HR email (from job) | Application for [Title] – [Name] |
| Application status changes | Candidate | Your application status has been updated |
| Forgot password | Candidate | Reset your SaudiaCareers password |

Use HTML email templates. Store templates in `backend/src/services/emailTemplates/`.

Email sender:

```
noreply@saudiacareers.com
```

Resend domain verification must be completed for `saudiacareers.com` before production emails are sent.

---

## Backend API — All Endpoints

### Auth Routes (`/api/auth`)
```
POST   /register              Create candidate account
POST   /login                 Login (candidate or admin)
POST   /logout                Clear refresh token
POST   /refresh-token         Issue new access token using refresh cookie
POST   /forgot-password       Send reset email
POST   /reset-password        Reset password using token
POST   /change-password       Change password (authenticated)
```

### Profile Routes (`/api/profile`) — candidate only
```
GET    /                      Get my profile
PUT    /                      Update my profile
POST   /resume                Upload resume (multipart/form-data)
DELETE /resume                Remove resume
GET    /resume/download        Get signed download URL
```

### Job Routes (public)
```
GET    /api/jobs              List jobs (search, filter, paginate)
GET    /api/jobs/:id          Get single job detail
```

### Application Routes — candidate only
```
POST   /api/applications             Apply for a job
GET    /api/applications/mine        My applications
```

### Admin Routes (`/api/admin`) — admin only
```
GET    /dashboard                    Metrics

GET    /jobs                         All jobs (admin view, includes inactive)
POST   /jobs                         Create job
PUT    /jobs/:id                     Update job
DELETE /jobs/:id                     Soft delete job
PATCH  /jobs/:id/status              Activate or deactivate

GET    /applications                 All applications (search, filter)
GET    /applications/:id             Application detail
PATCH  /applications/:id/status      Update application status
GET    /applications/export          Export to CSV
```

---

## Database Schema (Prisma)

```prisma
model User {
  id                  Int       @id @default(autoincrement())
  name                String
  email               String    @unique
  mobile              String?
  passwordHash        String
  role                Role      @default(CANDIDATE)
  emailVerified       Boolean   @default(false)
  mustChangePassword  Boolean   @default(false)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  profile             CandidateProfile?
  applications        Application[]
  jobs                Job[]           // jobs created by admin
  refreshTokens       RefreshToken[]
  passwordResets      PasswordResetToken[]

  @@index([role])
  @@index([createdAt])
}

enum Role {
  CANDIDATE
  ADMIN
}

model CandidateProfile {
  id                  Int       @id @default(autoincrement())
  userId              Int       @unique
  user                User      @relation(fields: [userId], references: [id])
  location            String?
  designation         String?
  experience          String?
  skills              String?
  education           String?
  summary             String?
  resumePath          String?
  resumeFilename      String?
  resumeUploadedAt    DateTime?
  profilePhotoPath    String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([location])
  @@index([experience])
}

model Job {
  id                  Int       @id @default(autoincrement())
  title               String
  companyName         String
  location            String
  industry            String
  employmentType      String
  experienceRequired  String
  salaryRange         String?
  description         String
  requiredSkills      String
  hrEmail             String
  applicationDeadline DateTime?
  status              JobStatus @default(ACTIVE)
  isDeleted           Boolean   @default(false)
  createdBy           Int
  creator             User      @relation(fields: [createdBy], references: [id])
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  applications        Application[]

  @@index([status, isDeleted])
  @@index([location])
  @@index([industry])
  @@index([employmentType])
  @@index([experienceRequired])
  @@index([applicationDeadline])
  @@index([createdAt])
}

enum JobStatus {
  ACTIVE
  INACTIVE
}

model Application {
  id              Int               @id @default(autoincrement())
  userId          Int
  user            User              @relation(fields: [userId], references: [id])
  jobId           Int
  job             Job               @relation(fields: [jobId], references: [id])
  status          ApplicationStatus @default(APPLIED)
  hrEmailStatus   EmailStatus       @default(PENDING)
  hrEmailError    String?
  hrEmailSentAt   DateTime?
  appliedAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([userId, jobId])     // prevents duplicate applications at DB level
  @@index([status])
  @@index([hrEmailStatus])
  @@index([appliedAt])
  @@index([jobId])
  @@index([userId])
}

enum ApplicationStatus {
  APPLIED
  UNDER_REVIEW
  SELECTED
  REJECTED
}

enum EmailStatus {
  PENDING
  SENT
  FAILED
}

model RefreshToken {
  id          Int       @id @default(autoincrement())
  userId      Int
  user        User      @relation(fields: [userId], references: [id])
  tokenHash   String
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())

  @@index([userId])
  @@index([expiresAt])
  @@index([revokedAt])
}

model PasswordResetToken {
  id          Int       @id @default(autoincrement())
  userId      Int
  user        User      @relation(fields: [userId], references: [id])
  tokenHash   String
  expiresAt   DateTime
  usedAt      DateTime?
  createdAt   DateTime  @default(now())

  @@index([userId])
  @@index([expiresAt])
  @@index([usedAt])
}
```

---

## Security Rules (non-negotiable)

- Passwords: bcrypt, 12 salt rounds — never stored plain
- JWT: access token in Zustand memory, refresh token in httpOnly cookie
- Refresh token cookies in production: `httpOnly: true`, `secure: true`, `sameSite: "none"`
- Frontend Axios must use `withCredentials: true`
- Backend CORS must use `credentials: true` and explicit allowed origins only
- CORS: allow only frontend domains from `ALLOWED_ORIGINS`
- Rate limiting: `express-rate-limit` on all auth routes
- Input validation: Zod schemas on every backend endpoint
- File uploads: validate MIME type on backend, not just file extension
- Resume downloads: signed Supabase URLs with 1-hour expiry (never public)
- Store Supabase file paths in DB, not public URLs
- SQL injection: Prisma parameterized queries (never raw SQL with user input)
- HTTP headers: Helmet.js
- All secrets in `.env` — never hardcoded, never committed to Git
- Default seeded admin password must be changed on first login

---

## Environment Variables

### Frontend — local (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000/api
```

### Frontend — production (Vercel env vars)
```
VITE_API_URL=https://api.saudiacareers.com/api
```

### Backend — local (`backend/.env`)
```
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SUPABASE_STORAGE_BUCKET=SaudiaCareers
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@saudiacareers.com
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
PORT=5000
NODE_ENV=development
```

### Backend — production (Render env vars)
```
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SUPABASE_STORAGE_BUCKET=SaudiaCareers
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@saudiacareers.com
FRONTEND_URL=https://saudiacareers.com
ALLOWED_ORIGINS=https://saudiacareers.com,https://www.saudiacareers.com
COOKIE_DOMAIN=.saudiacareers.com
PORT=5000
NODE_ENV=production
```

---

## Build Order (follow this sequence)

1. Set up folder structure and Git repo
2. Backend: Prisma schema + DB connection + migrations
3. Backend: seed admin user and sample jobs
4. Backend: Express app setup with middleware (cors, helmet, rate-limit, error handler)
5. Backend: Auth routes + controllers (register, login, logout, refresh, forgot/reset password, change password)
6. Backend: Force admin password change after first seeded admin login
7. Backend: Profile routes (get, update, resume upload/download/delete)
8. Backend: Job routes (public listing + detail)
9. Backend: Application routes (apply, my applications)
10. Backend: Admin routes (dashboard, job CRUD, application management, CSV export)
11. Backend: Email service (Resend) + all email templates
12. Backend: HR email status tracking (`PENDING`, `SENT`, `FAILED`)
13. Backend: Supabase Storage integration (resume upload + signed URLs)
14. Frontend: Vite + React + Tailwind setup
15. Frontend: Axios instance with interceptors (auto-refresh token on 401, `withCredentials: true`)
16. Frontend: Zustand auth store
17. Frontend: Route setup with all guards (PrivateRoute, AdminRoute, PublicOnlyRoute)
18. Frontend: Forced admin password change route/page
19. Frontend: Common components (Button, Input, Badge, Modal, Toast, Spinner, Pagination)
20. Frontend: Layout components (Navbar, Footer)
21. Frontend: Public pages (Landing, Job Listings, Job Detail)
22. Frontend: Auth pages (Login, Register, ForgotPassword, ResetPassword)
23. Frontend: Candidate pages (Dashboard, Profile, MyApplications)
24. Frontend: Admin pages (Dashboard, ManageJobs, CreateJob, EditJob, Applications, ApplicationDetail)
25. End-to-end testing of full apply flow
26. Deploy backend to Render
27. Deploy frontend to Vercel
28. Point custom domain to Vercel
29. Point `api.saudiacareers.com` to Render
30. Verify production auth, cookies, CORS, resume upload/download, and emails

---

## Key Business Rules

- Jobs past `applicationDeadline` are shown as "Closed" — apply button disabled
- Inactive jobs are hidden from public listings but visible in admin panel
- Soft delete only — never hard delete jobs or applications
- A candidate can only apply once per job (enforced at DB level via unique constraint)
- Resume is required before applying — validated on both frontend and backend
- Profile must be complete (designation + experience + skills) before applying
- HR email is per-job — each job can route applications to a different HR contact
- HR email failures must be tracked on the application record
- Application status changes trigger email to the candidate automatically
- Default seeded admin must change password before accessing admin dashboard

---

## Deployment Checklist

### Domain and DNS
- Verify `saudiacareers.com` ownership in Vercel
- Add DNS records in Hostinger:
  - `saudiacareers.com` → Vercel frontend
  - `www.saudiacareers.com` → Vercel frontend
  - `api.saudiacareers.com` → Render backend
- Enable HTTPS on Vercel and Render

### Resend
- Verify `saudiacareers.com` domain in Resend
- Add required DNS records in Hostinger for Resend
- Confirm `noreply@saudiacareers.com` works
- Send test email before production launch

### Supabase
- Create Supabase project
- Create Postgres database
- Create storage bucket `SaudiaCareers`
- Keep resume bucket private
- Confirm signed URL generation works
- Confirm old resume is deleted when candidate replaces resume

### Vercel
- Set `VITE_API_URL=https://api.saudiacareers.com/api`
- Connect GitHub repo
- Confirm frontend build passes
- Confirm frontend loads at `https://saudiacareers.com`

### Render
- Set all backend production environment variables
- Confirm build command and start command
- Run Prisma migrations
- Run seed script manually only once when needed
- Confirm backend health route works

### Production Tests
- Test candidate registration
- Test candidate login/logout
- Test refresh token after page reload
- Test forgot/reset password flow
- Test profile update
- Test resume upload/download/delete
- Test job listing search/filter/pagination
- Test apply flow end-to-end
- Test duplicate application prevention
- Test HR email with resume attachment
- Test HR email failure logging
- Test admin login
- Test forced admin password change
- Test admin job create/edit/deactivate/soft-delete
- Test admin application status update
- Test candidate status update email
- Test CSV export

---

## What's Out of Scope for MVP (do not build yet)

- Application withdrawal by candidate
- Admin inviting other admins
- Job alerts / email subscriptions
- Candidate shortlisting and internal HR notes
- Analytics charts on admin dashboard
- Arabic language / RTL support
- LinkedIn profile import
- Social login (Google, LinkedIn)
