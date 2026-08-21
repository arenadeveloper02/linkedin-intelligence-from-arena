# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-21T07:43:03.554Z.

## Overview

LinkedIn engagement intelligence dashboard with profile header, real profile images in People tab, and refresh payload that reuses profile_details (profile_url + account_id) from the Analyze/History API responses.

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 49

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

- **Updated at:** 2026-08-21T07:43:03.554Z
- **Request:** Here’s a cleaner, more precise version of your prompt:

---

### UI and Refresh API Improvements

1. **Selected Profile Header**

   * Above the existing:

     ```text
     sticky top-16 z-20 border-b border-grey-200 bg-white
     ```

     section, add a new header section.
   * Display the **selected profile name** as the heading.
   * Add a short, relevant description below the profile name.

2. **People Tab – Profile Images**

   * In the **People** tab, update each person card to use the person's **LinkedIn profile image/logo** from the available profile data.
   * Use the existing profile image URL from the API response rather than using a generic/default image when the URL is available.

3. **Refresh Button – Analyze API Payload**

   * When the user clicks **Refresh**, the Analyze API payload is currently missing `profile_url` and `account_id`.

   * For example, the current payload is:

     ```json
     {
       "name": "Position²",
       "profile_url": "",
       "account_id": "",
       "slug": "position2",
       "email": "saiteja.s@position2.com",
       "is_company": "true"
     }
     ```

   * Instead, populate `profile_url` and `account_id` from the existing profile data returned by either the **History API** or **Analyze API**.

   * The API response already contains the required data, for example:

     ```json
     {
       "rows": [
         {
           "id": "11",
           "profile_details": {
             "name": "Position2",
             "slug": "position2",
             "email": "saiteja.s@position2.com",
             "account_id": "G9e-s2x1QfWtYjeh68yzrg",
             "post_limit": "3",
             "post_scope": "all",
             "profile_url": "https://www.linkedin.com/company/position2/"
           }
         }
       ]
     }
     ```

   * When **Refresh** is clicked, reuse the existing `profile_details` data to construct the Analyze API payload.

   * The resulting payload should be:

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

   * **Do not hardcode** `profile_url` or `account_id`. Always derive them from the existing History/Analyze API response.
