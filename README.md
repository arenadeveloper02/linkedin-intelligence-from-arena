# linkedin-intelligence

Edited linkedin-intelligence-from-arena. Changes: (1) components/HistoryView.tsx + components/HistoryPageClient.tsx — history cards now hide person-level headlines for Company entries (headline only rendered for Personal profiles; company cards fall back to subtitle). (2) components/LinkedInIntelligenceDashboard.tsx — added an entity summary header above the tab navigation showing the logo/avatar (with gradient-initials fallback), entity name, tagline/summary, and a 'View Profile ↗' CTA opening the LinkedIn URL in a new tab via a new optional profileUrl prop; components/DashboardClient.tsx passes selected.profileUrl and components/HistoryPageClient.tsx passes the history entry's profile URL. (3) components/PeopleTab.tsx — PersonCard now renders the person's LinkedIn photo (avatarUrl) with an onError handler that falls back to a CSS gradient initials avatar. prisma/schema.prisma echoed unchanged (FetchLog model).

## Features

- Company history cards no longer show person headlines
- Entity summary header with logo, name, tagline and View Profile CTA on the dashboard
- People tab cards render real LinkedIn profile photos with gradient initials fallback

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
