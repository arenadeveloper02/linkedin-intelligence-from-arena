# linkedin-intelligence

Fix for failed typecheck: the repository was missing tsconfig.json, so `tsc` printed its help text instead of compiling (prisma generate succeeded, proving prisma/schema.prisma exists on disk even though it was not provided in the selected files — it is intentionally left untouched to avoid regenerating a live schema from memory and risking column/model drops). This edit restores a standard strict Next.js 15 tsconfig.json with the '@/*' path alias, adds next-env.d.ts so tsc --noEmit resolves Next.js ambient types before build, and includes the canonical zero-import app/not-found.tsx required for /404 prerendering. No database columns, actions, or component contracts are modified.

## Features

- Restored strict TypeScript configuration (tsconfig.json) so tsc --noEmit and next build run correctly
- Path alias '@/*' → './*' matching all existing @/lib and @/components imports
- next-env.d.ts ambient Next.js type references for pre-build typechecking
- Canonical zero-import app/not-found.tsx for safe /404 prerendering
- Existing Arena email gate, middleware, Prisma client, actions, and dashboard components left untouched

## Tech Stack

- Next.js ^15.3.3 (App Router)
- React ^19.0.0
- Tailwind CSS v3
- TypeScript
- Prisma + PostgreSQL (Neon on Vercel)

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

1. Copy `.env.example` to `.env` for local development
2. Set `DATABASE_URL` to your Postgres connection string
3. Run `npx prisma db push` before `npm run dev` if tables are missing

On Vercel, `DATABASE_URL` is injected when Neon is connected to the project.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — production build (runs Prisma generate/push when configured)
- `npm run start` — run the production server locally

## Deploy

This project is intended for deployment on [Vercel](https://vercel.com). Connect the GitHub repository and deploy the `main` branch.
