# linkedin-intelligence

LinkedIn engagement intelligence dashboard. This edit removes person-level location UI (People tab cards + filter toolbar city selector and Person drawer location row) and optimizes the Analyze workflow response parser (single-pass ingestion, decode-once traversal with depth caps, Set-based engager deduplication, snippet capping, and null-safe field extraction). Changed files: components/PeopleTab.tsx (removed location line in PersonCard footer, removed city state/memo/select and city filter condition, dropped MapPin import), components/PersonDrawer.tsx (removed the Location dl row and MapPin import), lib/parse.ts (optimized parseWorkflowResponse traversal and row ingestion; all person fields degrade gracefully to ''/0 when missing or null), prisma/schema.prisma (echoed unchanged).

## Features

- Search LinkedIn companies and analyze engagement intelligence
- People tab with seniority, country, degree, decision-maker and internal filters
- Company aggregates, posts and engagement drill-downs
- Optimized large-payload parsing with graceful null handling
- History of previous analyses

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
