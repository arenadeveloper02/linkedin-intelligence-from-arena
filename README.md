# linkedin-intelligence

LinkedIn engagement intelligence dashboard with entity profile summary header, person profile pictures with fallbacks, and refresh payload fixes sourcing profile_url/account_id from the captured profile_details.

## Features

- Entity profile summary header above the tabs with logo/avatar fallback, name, tagline and View Profile CTA sourced from company_profile or profile_details
- Person cards in the People tab render actual LinkedIn profile pictures with gradient initials fallback on missing or failed images
- Refresh action re-sends profile_url and account_id extracted from the current data state's profile_details instead of empty strings
- Search, analyze and history flows for LinkedIn company activity
- Arena email gate with access-denied screen

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
