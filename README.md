# LinkedIn Intelligence

An engagement intelligence dashboard that pulls LinkedIn company activity from an Arena workflow and turns it into actionable views of people, companies and posts.

## Features

- Email query-parameter access guard (`?email=you@company.com`) with an Access Denied fallback
- Server-proxied POST to the Arena workflow endpoint with a manual Refresh button
- Robust normalization of double-encoded workflow payloads (company profile, posts, engagers, engagement records)
- **Overview** — KPI cards, reaction / seniority / location / employee-mix distributions and a clickable Top Companies leaderboard
- **People** — seniority buckets, search, chips, country/city/degree dropdowns, decision-maker and hide-internal toggles
- **Companies** — minimum-people thresholds, search and seniority segment bars
- **Posts** — seniority / reaction / company / date filters and Most Engaged sorting
- Person drawer, company drawer and post inspection modal with reaction badges
- Prisma-backed fetch logging on every workflow request

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 3 with Arena design tokens (Poppins, brand blue `#1A73E8`)
- Prisma + Neon Postgres (fetch logs)
- lucide-react icons

## Local setup

```bash
npm install
cp .env.example .env   # set DATABASE_URL
npm run dev
```

Open `http://localhost:3000/?email=saiteja.s@position2.com` — the email parameter is required.

## Deploy notes

- `npm run build` runs `prisma generate && prisma db push && next build`
- On Vercel + Neon, `DATABASE_URL` is injected when the database is connected
- The app is iframe-friendly (`Content-Security-Policy: frame-ancestors *`) and persists the email identity in the `arena_email_id` cookie
