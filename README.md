# linkedin-intelligence

Added a strict global Access Denied guard on all page routes (Search '/', History '/history') that renders the standalone AccessDeniedScreen when the email/emailId URL search parameter is missing or empty (cookie fallback removed from page-level email resolution), and updated the History button handler in DashboardClient to read the email strictly from the live URL search params at runtime instead of the closure prop. Files changed: app/page.tsx (removed getArenaEmailId cookie fallback, added AccessDeniedScreen render when no email param), app/history/page.tsx (same guard), components/DashboardClient.tsx (openHistory now reads window.location.search at runtime, no closure/stored fallback), prisma/schema.prisma (echoed, unchanged).

## Features

- LinkedIn company/person search
- Engagement intelligence dashboard (Overview, People, Companies, Posts)
- Analysis history reload
- Strict URL email query parameter access gate on every view
- Arena iframe email gating via middleware

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
