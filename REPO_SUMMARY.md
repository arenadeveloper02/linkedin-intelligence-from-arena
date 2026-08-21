# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-21T07:25:49.020Z.

## Overview

LinkedIn engagement intelligence dashboard with entity profile summary header, person profile pictures with fallbacks, and refresh payload fixes sourcing profile_url/account_id from the captured profile_details.

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 48

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

- **Updated at:** 2026-08-21T07:25:49.020Z
- **Request:** Implement the following functionality in the codebase. Do not modify, refactor, remove, or "clean up" any other part of the code beyond what is explicitly listed below. Preserve existing formatting, naming conventions, comments, and logic in all unrelated sections.

#### **Changes to implement:**

1. **Entity Profile Summary Header Section:**
* Directly above the sticky container element (`sticky top-16 z-20 border-b border-grey-200 bg-white`), add a prominent profile summary section displaying the currently selected profile's details.
* **Elements to render**:
* **Logo/Avatar**: Display the entity image using `company_profile.logo`, `profile_picture_url`, or `logo` from the response data. Fallback to initials if `null`.
* **Title/Heading**: Display the entity name (e.g., `"Position²"`).
* **Description/Summary**: Display the description or tagline if present in the data (e.g., `company_profile.tagline` or `description`).
* **View Profile CTA**: Include a button/link that opens the selected profile's LinkedIn URL (`profile_url` / `company_profile_url`) in a new tab.




2. **Person Profile Pictures in People Tab Cards:**
* Update the person cards in the **People** tab to render the individual's actual LinkedIn profile picture using the image URL available in the response dataset (e.g., `profile_picture_url` or `profile_picture_url_large`).
* Retain the existing fallback (gradient background with initials) if the profile picture URL is missing, `null`, or fails to load.


3. **Fix Analyze API Request Payload on Refresh:**
* Update the **Refresh** button click handler to ensure `profile_url` and `account_id` are not sent as empty strings `""`.
* Extract and pass `profile_url` and `account_id` directly from the `profile_details` object present in the current data state (`data.profile_details.profile_url` and `data.profile_details.account_id`).
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
