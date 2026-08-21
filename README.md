# linkedin-intelligence

LinkedIn engagement intelligence dashboard: search a company, analyze post engagement, and explore people, companies and posts with profile summary header, real avatars, and reliable refresh payloads.

## Features

- Entity profile summary header (logo, name, tagline, View Profile CTA) above the sticky tab bar
- Person cards in People tab render real LinkedIn profile pictures with initials fallback
- Refresh re-runs Analyze with profile_url / account_id sourced from captured profile_details — never empty strings
- Search, Overview, People, Companies and Posts tabs with drawers and modals
- Arena email gate with history of previous analyses

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
