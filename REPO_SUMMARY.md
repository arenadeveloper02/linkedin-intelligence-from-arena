# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-21T12:58:55.535Z.

## Overview

LinkedIn engagement intelligence dashboard: search people/companies, analyze post engagement, and browse people, companies and posts insights inside the Arena iframe.

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 50

## Features

- Arena email-gated iframe access
- LinkedIn person/company search via workflow API
- Engagement intelligence dashboard with Overview, People, Companies and Posts tabs
- Entity profile summary header with logo, name, description and View Profile CTA
- Person avatar images in People tab cards with initials fallback
- Analysis history with refresh that resends canonical profile_url/account_id
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

- `components/AccessDeniedScreen.tsx`
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
- `lib/profile-details.ts`
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

- `CHANGES.md`
- `README.md`
- `REPO_SUMMARY.md`

## Complete File Index

- `.env.example`
- `CHANGES.md`
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
- `components/AccessDeniedScreen.tsx`
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
- `lib/profile-details.ts`
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

- **Updated at:** 2026-08-21T12:58:55.535Z
- **Request:** Implement the following functionality in the codebase. Do not modify, refactor, remove, or "clean up" any other part of the code beyond what is explicitly listed below. Preserve existing formatting, naming conventions, comments, and logic in all unrelated sections.

#### **Changes to implement:**

1. **Entity Profile Summary Header Placement:**
* Insert a profile summary section directly above the sticky container element (`sticky top-16 z-20 border-b border-grey-200 bg-white`).
* **Elements to render**:
* **Logo/Avatar**: Render the entity image using `company_profile.logo`, `profile_picture_url`, or `logo` from the response data. Fallback to initials if `null`.
* **Title/Heading**: Display the entity name (e.g., `"Position²"`).
* **Description/Summary**: Render the description or tagline if present in the data payload (e.g., `company_profile.tagline` or `description`).
* **View Profile CTA**: Render a button/link that opens the selected profile's LinkedIn URL (`profile_url` / `company_profile_url`) in a new browser tab.




2. **Person Avatar Images in People Tab Cards:**
* Update the person cards rendered inside the **People** tab to display the individual's actual LinkedIn profile picture using the image URL available in the response dataset (`profile_picture_url` or `profile_picture_url_large`).
* Retain the existing fallback (gradient background with initials) if the profile picture URL is missing, `null`, or fails to load.


3. **Fix Analyze API Request Payload on Refresh:**
* Fix the **Refresh** button click handler so `profile_url` and `account_id` are populated directly from the current data state's `profile_details` object (`data.profile_details.profile_url` and `data.profile_details.account_id`).
* Ensure `profile_url` and `account_id` are never sent as empty strings `""` when triggering the Analyze API (`POST [https://agent.thearena.ai/api/workflows/3909ec63-faf0-4d69-abd1-499bc7b158d0/execute](https://agent.thearena.ai/api/workflows/3909ec63-faf0-4d69-abd1-499bc7b158d0/execute)`).
* **Required Request Payload Structure**:
```json
{
  "name": "Position²",
  "profile_url": "https://www.linkedin.com/company/position2/",
  "account_id": "G9e-s2x1QfWtYjeh68yzrg",
  "slug": "position2",
  "email": "saiteja.s@position2.com",
  "is_company": "true"
}

```





#### **Constraints:**

* Only touch the files/functions directly related to the points above.
* Do not change variable names, code style, or structure outside the scope of these changes.
* Do not add extra features, optimizations, or refactors that weren't requested.
* If a change requires touching a shared/common file, make the minimal edit needed and leave everything else untouched.
* After implementing, list exactly which files and lines were changed, and why.
