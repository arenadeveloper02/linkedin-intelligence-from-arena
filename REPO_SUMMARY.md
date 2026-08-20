# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-20T13:38:31.189Z.

## Overview

LinkedIn engagement intelligence dashboard. This edit restores the live FetchLog.updatedAt column in prisma/schema.prisma (deploy failed with potential_dataloss because the schema file was missing it) and improves History card title/logo extraction with a deep recursive fallback so cards show the real entity name, company slug tag, and logo instead of 'History item N'. Files changed: prisma/schema.prisma (re-added updatedAt DateTime @updatedAt @default(now()) on FetchLog — required by drift recovery, live table has 31 rows with this column); lib/history-parse.ts (added deepFindString/deepFindNumber recursive fallbacks used only when the existing shallow extraction yields no title, slug, logo, headline, industry or follower count — no existing lines removed or renamed).

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 47

## Features

- History cards display entity name from profile_details.name / company_details.company with deep-nested fallback
- Company slug rendered as a tag on history cards
- Logo/avatar extracted from company_details.logo, company_profile.logo, profile_picture_url with initials placeholder fallback
- Prisma FetchLog schema restored to match live Neon database (updatedAt re-added)

## Tech Stack

- Next.js ^15.3.3 (App Router)
- React ^19.0.0
- Tailwind CSS v3
- TypeScript
- Prisma + PostgreSQL (Neon on Vercel)

## Infrastructure

- **DATABASE_URL:** set on Vercel when Neon is connected — do not commit real credentials

## Routes & Pages

- `/` — `app/page.tsx`
- `/access-denied` — `app/access-denied/page.tsx`
- `/history` — `app/history/page.tsx`

## Database Models

- `FetchLog`

## File Inventory

### App pages

- `app/access-denied/page.tsx`
- `app/arena-ds-tokens.css`
- `app/error.tsx`
- `app/globals.css`
- `app/history/page.tsx`
- `app/layout.tsx`
- `app/not-found.tsx`
- `app/page.tsx`

### API routes

- `app/api/analyze/route.ts`
- `app/api/intelligence/route.ts`
- `app/api/search/route.ts`

### Components

- `components/CompaniesTab.tsx`
- `components/CompanyDrawer.tsx`
- `components/DashboardClient.tsx`
- `components/HistoryDrawer.tsx`
- `components/HistoryPageClient.tsx`
- `components/HistoryView.tsx`
- `components/LinkedInIntelligenceDashboard.tsx`
- `components/OverviewTab.tsx`
- `components/PeopleTab.tsx`
- `components/PersonDrawer.tsx`
- `components/PostModal.tsx`
- `components/PostsTab.tsx`
- `components/SearchScreen.tsx`
- `components/Topbar.tsx`
- `components/Widgets.tsx`
- `components/arena-email-provider.tsx`

### Libraries

- `lib/actions.ts`
- `lib/arena-email-constants.ts`
- `lib/arena-email.ts`
- `lib/history-parse.ts`
- `lib/parse.ts`
- `lib/prisma.ts`
- `lib/search-parse.ts`
- `lib/types.ts`
- `lib/utils.ts`
- `prisma/schema.prisma`

### Config

- `.env.example`
- `middleware.ts`
- `next-env.d.ts`
- `next.config.ts`
- `package.json`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `tsconfig.json`

### Other

- `README.md`
- `REPO_SUMMARY.md`

## Complete File Index

- `.env.example`
- `README.md`
- `REPO_SUMMARY.md`
- `app/access-denied/page.tsx`
- `app/api/analyze/route.ts`
- `app/api/intelligence/route.ts`
- `app/api/search/route.ts`
- `app/arena-ds-tokens.css`
- `app/error.tsx`
- `app/globals.css`
- `app/history/page.tsx`
- `app/layout.tsx`
- `app/not-found.tsx`
- `app/page.tsx`
- `components/CompaniesTab.tsx`
- `components/CompanyDrawer.tsx`
- `components/DashboardClient.tsx`
- `components/HistoryDrawer.tsx`
- `components/HistoryPageClient.tsx`
- `components/HistoryView.tsx`
- `components/LinkedInIntelligenceDashboard.tsx`
- `components/OverviewTab.tsx`
- `components/PeopleTab.tsx`
- `components/PersonDrawer.tsx`
- `components/PostModal.tsx`
- `components/PostsTab.tsx`
- `components/SearchScreen.tsx`
- `components/Topbar.tsx`
- `components/Widgets.tsx`
- `components/arena-email-provider.tsx`
- `lib/actions.ts`
- `lib/arena-email-constants.ts`
- `lib/arena-email.ts`
- `lib/history-parse.ts`
- `lib/parse.ts`
- `lib/prisma.ts`
- `lib/search-parse.ts`
- `lib/types.ts`
- `lib/utils.ts`
- `middleware.ts`
- `next-env.d.ts`
- `next.config.ts`
- `package.json`
- `postcss.config.mjs`
- `prisma/schema.prisma`
- `tailwind.config.ts`
- `tsconfig.json`

## Latest Change

- **Updated at:** 2026-08-20T13:38:31.189Z
- **Request:** Implement the following functionality in the codebase. Do not modify, refactor, remove, or "clean up" any other part of the code beyond what is explicitly listed below. Preserve existing formatting, naming conventions, comments, and logic in all unrelated sections.

#### **Changes to implement:**

1. **History Card Title Formatting:**
* Fix the title rendering on History cards so it no longer displays generic text like `"History item 1"`.
* Update the card header to dynamically display the entity name from `profile_details.name` (or `company_details.company` / `company_details.name`).
* Display the `company_slug` (e.g., `position2`) as a subtitle or tag on the card.


2. **History Card Image/Logo Extraction:**
* Extract and display the entity logo or profile avatar image on the History card using the image URL available in the data payload (e.g., `company_details.logo`, `output.company_profile.logo`, or `profile_picture_url`).
* Include a clean fallback placeholder (e.g., entity name initials) if no image URL is present in the data record.



#### **Constraints:**

* Only touch the files/functions directly related to the points above.
* Do not change variable names, code style, or structure outside the scope of these changes.
* Do not add extra features, optimizations, or refactors that weren't requested.
* If a change requires touching a shared/common file, make the minimal edit needed and leave everything else untouched.
* After implementing, list exactly which files and lines were changed, and why.


error: "Command \"npm run build\" exited with 1\ncode: potential_dataloss\nInspector: https://vercel.com/arena-developer-s-projects/linkedin-intelligence-from-arena/CiFT1YoteqdeXuKzskZJAA2vb87X\nBuild log:\nError: Command \"npm run build\" exited with 1\nError: Use the --accept-data-loss flag to ignore the data loss warnings like prisma db push --accept-data-loss\n  • You are about to drop the column `updatedAt` on the `FetchLog` table, which still contains 31 non-null values.\n⚠️  There might be data loss when applying the changes:\nDatasource \"db\": PostgreSQL database \"neondb\", schema \"public\" at \"ep-tiny-dream-ayr03lna.c-5.us-east-2.aws.neon.tech\"\nPrisma schema loaded from prisma/schema.prisma\nTip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate\nStart by importing your Prisma Client (See: https://pris.ly/d/importing-client)\n✔ Generated Prisma Client (v6.19.3) to ./node_modules/@prisma/client in 61ms\nPrisma schema loaded from prisma/schema.prisma\n> prisma generate && prisma db push && next build\n> linkedin-intelligence@1.0.0 build\nRunning \"npm run build\"\nDetected Next.js version: 15.5.23\nnpm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.\nnpm warn allow-scripts\nnpm warn allow-scripts   unrs-resolver@1.12.2 (postinstall: node postinstall.js)\nnpm warn allow-scripts   sharp@0.34.5 (install: node install/check.js || npm run build)\nnpm warn allow-scripts   prisma@6.19.3 (preinstall: node scripts/preinstall-entry.js)\nnpm warn allow-scripts   @prisma/engines@6.19.3 (postinstall: node scripts/postinstall.js)\nnpm warn allow-scripts   @prisma/client@6.19.3 (postinstall: node scripts/postinstall.js)\nnpm warn allow-scripts 5 packages have install scripts not yet covered by allowScripts:\n  run `npm fund` for details\n153 packages are looking for funding\nchanged 4 packages in 1s\nInstalling dependencies...\nVercel CLI 59.1.4\nRunning \"vercel build\"\nRestored build cache from previous deployment (J54DduC1HZ3MQZdm1jd1Ke5PXrCS)\nCloning completed: 405.000ms\nCloning github.com/arenadeveloper02/linkedin-intelligence-from-arena (Branch: refs/heads/main, Commit: 490e885)\nBuild machine configuration: 2 cores, 8 GB\nRunning build in Washington, D.C., USA (East) – iad1"
