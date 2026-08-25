# linkedin-intelligence

Fixed the failed typecheck gate: the repo was missing tsconfig.json, so `tsc --noEmit` had no project to compile and printed its help text (exiting non-zero). Restored a standard strict Next.js 15 App Router tsconfig.json with the '@/*' path alias mapped to the project root so every existing @/components and @/lib import resolves. Also re-included the canonical zero-import app/not-found.tsx. No database code was touched: prisma generate already succeeds against the existing prisma/schema.prisma in the repo, and since that schema file was not provided in this edit context, it is intentionally left untouched (regenerating it from memory is forbidden and could drop live columns). lib/actions.ts, lib/types.ts, middleware.ts, and all components remain unchanged.

## Features

- LinkedIn company intelligence dashboard (overview, people, companies, posts tabs)
- Search screen with history drawer and person/company detail drawers
- Arena email gate via middleware with access-denied screen
- Fetch logging persisted to Postgres via Prisma
- Strict TypeScript project configuration restored (fixes tsc --noEmit gate)

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
