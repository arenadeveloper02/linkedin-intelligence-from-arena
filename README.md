# linkedin-intelligence

Edited linkedin-intelligence-from-arena. Changes: (1) prisma/schema.prisma — restored the live FetchLog.updatedAt column (DateTime @updatedAt @default(now())) that the deploy error flagged as being dropped (potential_dataloss on 38 rows); (2) middleware.ts — access guard now also reads the `email` search parameter (in addition to `emailId` and the arena_email_id cookie) and rewrites to /access-denied when missing/empty, persisting the value in the cookie; (3) components/HistoryDrawer.tsx — added the Company vs Personal type badge (🏢 Company / 👤 Personal) on each history card header, derived from entry.isCompany which lib/history-parse.ts already computes from is_company/type/company_details payload attributes. HistoryPageClient.tsx and HistoryView.tsx already render this badge, so only the drawer needed it. lib/actions.ts and lib/types.ts are echoed unchanged per schema-return policy.

## Features

- Arena email gate: access denied when email/emailId is missing from the URL and cookie
- History cards show Company vs Personal entity type badge
- LinkedIn engagement intelligence dashboard
- Analysis history with dashboard reload
- Fetch logging to Neon Postgres via Prisma

## Tech Stack

- Next.js ^15.3.3 (App Router)
- React ^19.0.0
- Tailwind CSS v3
- TypeScript
- Prisma + PostgreSQL (Neon on Vercel)

## Routes

- `/`
- `/access-denied`
- `/history`

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
