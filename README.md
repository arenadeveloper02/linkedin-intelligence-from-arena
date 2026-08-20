# linkedin-intelligence

LinkedIn engagement intelligence dashboard with an app-level Arena access gate: every route requires an emailId (search param or cookie) or renders the Access Denied screen.

## Features

- App-level access gate: any page without an emailId search param or arena_email_id cookie renders the Access Denied screen
- Middleware rewrite to /access-denied plus request-header forwarding of emailId for first-load reliability
- Polished Arena DS access-denied UI shared between the route and the root layout gate
- Persistent arena_email_id cookie (Path=/, Secure, SameSite=None) for cross-origin iframe navigation
- LinkedIn engagement intelligence dashboard with search, history, people, companies and posts views

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
