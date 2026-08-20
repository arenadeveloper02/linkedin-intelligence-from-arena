# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-20T13:54:43.541Z.

## Overview

Edited linkedin-intelligence-from-arena. Changes: (1) prisma/schema.prisma — restored the live FetchLog.updatedAt column (DateTime @updatedAt @default(now())) that the deploy error flagged as being dropped (potential_dataloss on 38 rows); (2) middleware.ts — access guard now also reads the `email` search parameter (in addition to `emailId` and the arena_email_id cookie) and rewrites to /access-denied when missing/empty, persisting the value in the cookie; (3) components/HistoryDrawer.tsx — added the Company vs Personal type badge (🏢 Company / 👤 Personal) on each history card header, derived from entry.isCompany which lib/history-parse.ts already computes from is_company/type/company_details payload attributes. HistoryPageClient.tsx and HistoryView.tsx already render this badge, so only the drawer needed it. lib/actions.ts and lib/types.ts are echoed unchanged per schema-return policy.

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 47

## Features

- Arena email gate: access denied when email/emailId is missing from the URL and cookie
- History cards show Company vs Personal entity type badge
- LinkedIn engagement intelligence dashboard
- Analysis history with dashboard reload
- Fetch logging to Neon Postgres via Prisma

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

- **Updated at:** 2026-08-20T13:54:43.541Z
- **Request:** Implement the following functionality in the codebase. Do not modify, refactor, remove, or "clean up" any other part of the code beyond what is explicitly listed below. Preserve existing formatting, naming conventions, comments, and logic in all unrelated sections.

#### **Changes to implement:**

1. **Access Denied Page Guard (`email` Search Parameter Check):**
* Inspect the URL search parameters for the `email` parameter on application initialization (e.g., `?email=saiteja.s@position2.com`).
* If the `email` parameter is missing, empty, or undefined, restrict application access and immediately render a dedicated **Access Denied** fallback screen preventing further API executions or navigation.


2. **History Card Entity Type Indicator (Company vs. Personal):**
* Add a visual type indicator/badge on each History card to distinguish whether the entry represents a **Company** profile or a **Personal** profile.
* Derive the type from the historical record payload (e.g., using `is_company`, `type`, or `company_details` attributes) and display a badge (e.g., `"🏢 Company"` vs. `"👤 Personal"`) on the card header.



#### **Constraints:**

* Only touch the files/functions directly related to the points above.
* Do not change variable names, code style, or structure outside the scope of these changes.
* Do not add extra features, optimizations, or refactors that weren't requested.
* If a change requires touching a shared/common file, make the minimal edit needed and leave everything else untouched.
* After implementing, list exactly which files and lines were changed, and why.


error: 
"Command \"npm run build\" exited with 1\ncode: potential_dataloss\nInspector: https://vercel.com/arena-developer-s-projects/linkedin-intelligence-from-arena/6ctPYELRvXa9A3DCFHjtJqqaYPG6\nBuild log:\nError: Command \"npm run build\" exited with 1\nError: Use the --accept-data-loss flag to ignore the data loss warnings like prisma db push --accept-data-loss\n  • You are about to drop the column `updatedAt` on the `FetchLog` table, which still contains 38 non-null values.\n⚠️  There might be data loss when applying the changes:\nDatasource \"db\": PostgreSQL database \"neondb\", schema \"public\" at \"ep-tiny-dream-ayr03lna.c-5.us-east-2.aws.neon.tech\"\nPrisma schema loaded from prisma/schema.prisma\nTip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints\nStart by importing your Prisma Client (See: https://pris.ly/d/importing-client)\n✔ Generated Prisma Client (v6.19.3) to ./node_modules/@prisma/client in 65ms\nPrisma schema loaded from prisma/schema.prisma\n> prisma generate && prisma db push && next build\n> linkedin-intelligence@1.0.0 build\nRunning \"npm run build\"\nDetected Next.js version: 15.5.23\nnpm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.\nnpm warn allow-scripts\nnpm warn allow-scripts   unrs-resolver@1.12.2 (postinstall: node postinstall.js)\nnpm warn allow-scripts   sharp@0.34.5 (install: node install/check.js || npm run build)\nnpm warn allow-scripts   prisma@6.19.3 (preinstall: node scripts/preinstall-entry.js)\nnpm warn allow-scripts   @prisma/engines@6.19.3 (postinstall: node scripts/postinstall.js)\nnpm warn allow-scripts   @prisma/client@6.19.3 (postinstall: node scripts/postinstall.js)\nnpm warn allow-scripts 5 packages have install scripts not yet covered by allowScripts:\n  run `npm fund` for details\n153 packages are looking for funding\nchanged 4 packages in 996ms\nInstalling dependencies...\nVercel CLI 59.1.4\nRunning \"vercel build\"\nRestored build cache from previous deployment (9vMvroggZtYSDZnPVyvmZKiM4VAh)\nCloning completed: 288.000ms\nCloning github.com/arenadeveloper02/linkedin-intelligence-from-arena (Branch: refs/heads/main, Commit: 4e6eb4e)\nBuild machine configuration: 2 cores, 8 GB\nRunning build in Washington, D.C., USA (East) – iad1"
