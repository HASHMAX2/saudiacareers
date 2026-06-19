# SaudiaCareers

SaudiaCareers is a full-stack job portal for the Saudi Arabian market. The repository is organized as an npm workspace with an Express/Prisma backend and a React/Vite frontend.

`AGENTS.md` is the source of truth for product behavior, security rules, architecture, and build order. `PROGRESS.md` records the current implementation state. Read both before coding.

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL (a Supabase PostgreSQL connection is intended for production)

## Local setup

1. Copy `backend/.env.example` to `backend/.env` and provide a PostgreSQL URL and strong JWT secrets.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Install dependencies from the repository root:

   ```bash
   npm install
   ```

4. Generate Prisma Client and apply the development migration:

   ```bash
   npm run prisma:generate --workspace backend
   npm run prisma:migrate --workspace backend
   ```

5. Seed the initial admin manually:

   ```bash
   npm run prisma:seed --workspace backend
   ```

6. Run the backend and frontend in separate terminals:

   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:5000/api`.

The seed command is intentionally manual and is never part of the production start command.

## Verification

```bash
npm test
npm run lint
npm run prisma:validate --workspace backend
npm run build
npm audit --omit=dev
```

Prisma commands require `DATABASE_URL` to be configured in `backend/.env`.
