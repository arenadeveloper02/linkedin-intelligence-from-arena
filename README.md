# linkedin-intelligence

LinkedIn engagement intelligence dashboard — added an in-place Refresh flow on the dashboard/details view (including history-opened dashboards), restored the details header summary subtitle, removed the History card 'Open Dashboard' CTA (full-card click retained), and removed the Reaction type filter chips from the Posts tab.

## Features

- Refresh button on the details/dashboard toolbar re-triggers the Analyze workflow with the currently selected profile payload and shows an active loading state
- History cards no longer show an explicit 'Open Dashboard' CTA — clicking anywhere on the card opens the dashboard
- Details page header shows the summary subtitle 'Signal tracking: people, companies & post engagement'
- Posts tab filter toolbar no longer includes reaction-type chips; Seniority, Company, Date range, and Most Engaged sort remain

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
