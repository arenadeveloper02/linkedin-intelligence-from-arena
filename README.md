# linkedin-intelligence

Edited linkedin-intelligence-from-arena. Changes: (1) middleware.ts — added an early fast-path for /api/* requests so history/analyze API calls skip the emailId rewrite/cookie middleware work that added latency versus direct Postman requests; (2) vercel.json (new) — raised serverless maxDuration to 60s for all app/api/**/route.ts handlers so the analyze workflow no longer hits the default execution limit; (3) components/HistoryPageClient.tsx — history is now re-fetched automatically when navigating back from the dashboard to the list, openEntry deep-extracts profile_url/account_id/profile_details from the stored history payload so the 'View Profile' CTA renders, and the Refresh handler falls back across profile_details, the entry subtitle and a deep payload search so account_id and profile_url are never sent as empty strings; a 504/500 during refresh now keeps the current dashboard gracefully. prisma/schema.prisma, lib/actions.ts and lib/types.ts are returned per the database rule (schema unchanged apart from being echoed; no columns dropped or altered).

## Features

- LinkedIn entity search (company/personal)
- Engagement intelligence dashboard (Overview, People, Companies, Posts)
- Analysis history with instant reload of stored dashboards
- Timeout-tolerant analyze flow with history recovery polling
- Refresh with fully populated profile_url / account_id payload
- Arena email gate with iframe-safe middleware

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
