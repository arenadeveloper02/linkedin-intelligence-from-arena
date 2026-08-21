# linkedin-intelligence

LinkedIn engagement intelligence dashboard with profile header, real profile images in People tab, and refresh payload that reuses profile_details (profile_url + account_id) from the Analyze/History API responses.

## Features

- Selected profile header with name and description above the tab bar
- People tab cards use the person's real LinkedIn profile image when a valid URL is available
- Refresh reuses profile_details (profile_url, account_id) from the intelligence response — never sends empty identifiers
- Deep extraction of profile_details from arbitrarily nested workflow responses
- Search, analyze and history flows for company and personal profiles

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
