# linkedin-intelligence

Added an access guard for the `email` search parameter in middleware (falls back to Access Denied when neither emailId nor email is present) and a Company vs Personal type badge on History cards derived from the record payload. Files changed: middleware.ts (accepts `email` query param alongside `emailId`, persists it to the arena cookie, denies access when both are missing), lib/types.ts (added `isCompany: boolean` to HistoryEntry), lib/history-parse.ts (derives entity type from is_company/type fields, company_details/company_profile sections, and person-name fallbacks), components/HistoryPageClient.tsx and components/HistoryView.tsx (render the 🏢 Company / 👤 Personal badge on each card header). prisma/schema.prisma echoed unchanged; app/not-found.tsx included per structure requirements.

## Features

- Access Denied guard honoring the `email` search parameter (in addition to emailId) via middleware rewrite
- Company vs Personal entity type badge on History cards
- History payload type derivation from is_company / type / company_details attributes
- Existing Arena email gate, cookie persistence, and iframe headers preserved

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
