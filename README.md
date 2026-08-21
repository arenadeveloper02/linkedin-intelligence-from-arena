# linkedin-intelligence

Added robust profile header banner rendering above the dashboard tabs (logo with onError fallback to gradient initials, decoded entity name, tagline summary, View Profile CTA opening the LinkedIn URL in a new tab) and fixed People tab person cards so real LinkedIn profile pictures render reliably (referrerPolicy no-referrer to bypass CDN hotlink blocking) while retaining the gradient-initials fallback. Files changed: components/LinkedInIntelligenceDashboard.tsx (added logoError state + onError handler and referrerPolicy on the header banner logo <img> so broken logo URLs fall back to gradient initials; banner, heading, tagline and View Profile button preserved above the tabs), components/PeopleTab.tsx (added referrerPolicy="no-referrer" to the PersonCard avatar <img> so LinkedIn-hosted profile pictures load; existing avatarError fallback retained), prisma/schema.prisma (echoed unchanged — additive-only rule, no columns modified).

## Features

- Entity profile header banner above dashboard tabs with logo, name, tagline and View Profile CTA
- Gradient-initials fallback when the profile logo is missing or fails to load
- Person cards render real LinkedIn profile pictures with referrer-safe loading
- Existing initials fallback preserved for people avatars
- Overview, People, Companies and Posts tabs unchanged

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
