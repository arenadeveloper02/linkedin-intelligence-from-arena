# linkedin-intelligence

Engagement intelligence dashboard for LinkedIn company activity. This edit adds the is_company parameter to the analyze workflow payload (matching the Company/Personal radio selection) and updates History page cards to use the profile details name field as title and remove the location element.

## Features

- LinkedIn entity search (Company / Personal)
- Engagement intelligence dashboard (Overview, People, Companies, Posts)
- Analyze workflow with is_company parameter matching selected entity type
- Analysis history page with profile-name card titles
- Arena email gating via middleware and cookie

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

1. Copy `.env.example` to `.env` for local dev
…(truncated)