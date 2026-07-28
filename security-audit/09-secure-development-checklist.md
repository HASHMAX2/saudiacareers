# Secure Development Checklist

Repository-specific checklist for future pull requests and releases. Builds on the conventions already documented in `CLAUDE.md` — this adds the security dimension.

## Every PR that touches a backend controller/route

- [ ] Every new resource-fetching query scoped to `req.user.id` / `employerProfileId` / `createdBy` where the resource has an owner (this codebase's existing pattern — keep it universal)
- [ ] New route wired through `authenticate` + the correct `authorizeX` middleware — never rely on frontend route guards alone
- [ ] Request body/params/query validated via a Zod schema and read from `req.validated`, not raw `req.body`/`req.params`/`req.query`
- [ ] No client-supplied `role`, `userId`, `createdBy`, `isVerified`, `isSuspended`, `status` (where status has server-enforced business rules), or `mustChangePassword` field is ever trusted directly — server derives these
- [ ] Any new query built with Prisma's typed builder, never `$queryRaw`/`$executeRaw` with interpolated input
- [ ] Any new endpoint that fetches an external URL (webhooks, link previews, imports) validates scheme + rejects private/loopback/link-local/metadata IP ranges — reuse the shared SSRF guard once built (see `07-remediation-roadmap.md`)
- [ ] Any new endpoint that grants a quota-limited resource (credits, free-tier slots, single-use tokens) uses an atomic conditional update (`updateMany` with a `where` guard, or a transaction), never a read-then-write pattern
- [ ] Any new file-upload path validates actual file bytes, not just the client-declared `Content-Type`
- [ ] Any new signed-URL-serving endpoint defaults to `download: true` unless there's a specific, reviewed product reason for inline rendering
- [ ] New mutating admin endpoints that overlap with an existing business rule (suspension, verification, moderation status) re-check that rule explicitly, rather than assuming it was already checked upstream

## Every PR that touches the frontend

- [ ] No `dangerouslySetInnerHTML`, `.innerHTML =`, or markdown-rendering library introduced without an explicit sanitization review (the codebase currently has zero such sinks — keep it that way)
- [ ] No token, password, or full user object ever written to `localStorage`/`sessionStorage` — access tokens stay in Zustand memory only
- [ ] Any new redirect target is a hardcoded path or comes from React Router's in-app `location.state`, never a raw query-string parameter
- [ ] Any new `<iframe>` or `postMessage` usage validates the origin explicitly

## Every PR that touches payments/billing

- [ ] Charge amounts and plan/credit quantities always resolved server-side from the DB `Plan`/`Invoice` record, never trusted from client input
- [ ] Any new webhook handler verifies the signature against the raw body before touching the database, and claims an idempotency key before running side effects
- [ ] Any new "request → admin approval → external side effect" workflow has a guard against duplicate/concurrent submissions

## Every PR that adds a dependency

- [ ] Run `npm audit` before merging; don't introduce a new known-CVE dependency
- [ ] Prefer packages already in use over adding a near-duplicate (e.g., don't add a second PDF/DOCX parser if one is already in `resumeParserService.js`)
- [ ] Pin to a specific version range consistent with the rest of `package.json` (this repo uses `^` ranges — stay consistent unless there's a reason not to)

## Every release / deploy

- [ ] `npm audit --omit=dev` clean (or exceptions explicitly accepted and documented) in both workspaces
- [ ] `npm run lint` and `npm test` pass
- [ ] `npx prisma validate` passes if the schema changed
- [ ] If `render.yaml` or any deploy config changed, confirm it matches what's actually configured in the Render/Vercel dashboards (this repo has had drift before — see SA-14)
- [ ] If a new environment variable is required, it's added to `.env.example` (placeholder only) and documented, never committed with a real value

## Ongoing / periodic (not per-PR)

- [ ] Re-run `npm audit` periodically even without a dependency-touching PR (new CVEs get disclosed against unchanged code)
- [ ] Periodically confirm no real secret has been accidentally committed (`git log --all --name-only` scan for `.env`, credential-shaped filenames — this audit found the repo clean as of this review, keep it that way)
- [ ] Review the CORS allowlist whenever a new frontend deployment target is added — resist the temptation to regex-match a hosting-platform's shared domain suffix (this is exactly how SA-01 happened)
- [ ] Periodically review `05-authorization-matrix.md`-style coverage when adding a new role or a new cross-role resource-sharing feature (e.g., if candidates ever get their own "team" concept, or employers get sub-accounts)
