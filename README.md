# LinkedIn Intelligence

Search LinkedIn people and companies, run engagement analysis, and explore the results in a rich dashboard (Overview, People, Companies, Posts). Past analyses are shown as a Recent Searches history that reloads instantly.

## Features

- Company / Personal LinkedIn search with selectable result cards
- Analyze workflow proxy with `maxDuration = 60` and graceful 504 recovery — the client automatically polls the history endpoint to load the newly generated record
- Lightweight `/api/intelligence` history endpoint (thin passthrough, no server-side payload transformations) for instant history rendering
- History re-fetches automatically when navigating back from the dashboard
- "View Profile ↗" CTA restored when opening a history card (profile_url deep-extracted from stored payloads)
- Refresh payload always includes `profile_url` and `account_id` with multi-source fallbacks

## Tech stack

- Next.js 15 App Router, React 19, TypeScript (strict)
- Tailwind CSS v3 with Arena DS tokens, Poppins via next/font
- Prisma + Neon Postgres (FetchLog)

## Local setup

```bash
npm install
cp .env.example .env   # fill DATABASE_URL and workflow env vars
npm run dev
```

## Environment

- `DATABASE_URL` — Neon Postgres connection string
- `SIM_API_KEY` — API key for workflow execution
- `SEARCH_WORKFLOW_URL`, `ANALYZE_WORKFLOW_URL`, `HISTORY_WORKFLOW_URL` — workflow execute endpoints

## Deploy

`npm run build` runs `prisma generate && prisma db push && next build`. The app is designed to run inside an Arena iframe (`?emailId=` gate via middleware).
