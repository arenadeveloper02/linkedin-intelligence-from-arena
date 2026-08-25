# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-25T08:16:07.175Z.

## Overview

LinkedIn engagement intelligence dashboard: search people/companies, analyze post engagement, and browse analysis history inside an Arena iframe.

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 50

## Features

- Company/person LinkedIn search with result cards
- Analyze workflow with 60s serverless timeout and graceful 504 recovery via history polling
- Fast lightweight /api/intelligence history endpoint with no extra payload transformations
- Inline Recent Searches history that re-fetches on back navigation
- View Profile CTA restored when opening history cards
- Refresh payload always populated with profile_url and account_id

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

## Database Models

- `FetchLog`

## File Inventory

### App pages

- `app/access-denied/page.tsx`
- `app/arena-ds-tokens.css`
- `app/error.tsx`
- `app/globals.css`
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
- `lib/safe-parse.ts`
- `lib/sanitize.ts`
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
- `lib/safe-parse.ts`
- `lib/sanitize.ts`
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

- **Updated at:** 2026-08-25T08:16:07.175Z
- **Request:** Implement the following functionality in the codebase. Do not modify, refactor, remove, or "clean up" any other part of the code beyond what is explicitly listed below. Preserve existing formatting, naming conventions, comments, and logic in all unrelated sections.

#### **Changes to implement:**

1. **Optimize History API Endpoint Performance (`/api/history`):**
* Resolve sluggish response times on the frontend History API call.
* Remove unnecessary backend overhead, heavy middleware, or extra payload transformations in the API route handler that cause execution delay compared to direct Postman requests.
* Add light caching or response compression if applicable to make initial history fetching instant on screen render.


2. **Handle Analyze API Timeout & Asynchronous Polling/Fallback (`/api/analyze`):**
* Address the frontend timeout error (`"Analysis is taking longer than expected..."`) caused by serverless function execution limits while the backend workflow succeeds.
* Increase the serverless handler `maxDuration` timeout limit (e.g., set `export const maxDuration = 60;` in Next.js/Vercel API routes).
* Update the frontend request handler to catch 504 timeouts gracefully and automatically attempt a lightweight check or re-fetch from the history endpoint to seamlessly load the newly generated record once complete.


3. **Re-trigger History Fetching on Dashboard Back Navigation:**
* When navigating back from the Details/Dashboard page to the main Search page, automatically trigger a fresh fetch of the History API.
* Ensure newly analyzed records are immediately visible in the inline History section without requiring a manual browser page reload.


4. **Restore "View Profile" CTA Button when Opening History Cards:**
* Fix state hydration when a user opens a dashboard from a History card click so that the **"View Profile ↗"** CTA button is rendered on the entity summary header.
* Ensure `profile_url` (or `company_profile_url`) is properly extracted from the history record payload (`company_details.profile_url` or `output.company_profile.profile_url`) and stored in active dashboard state.


5. **Fix Missing `account_id` and `profile_url` in Refresh Payload:**
* Fix the **Refresh** button click handler on the Details page so `account_id` and `profile_url` are never sent as empty strings (`""`).
* Fallback across `profile_details`, `company_details`, and root record state to ensure both fields are populated in the Analyze API request payload.
* **Required Payload Structure**:
```json
{
  "name": "<SELECTED_NAME>",
  "profile_url": "https://www.linkedin.com/company/position2/",
  "account_id": "G9e-s2x1QfWtYjeh68yzrg",
  "slug": "<SELECTED_SLUG>",
  "email": "<USER_EMAIL>",
  "is_company": "<"true" | "false">"
}

```





#### **Constraints:**

* Only touch the files/functions directly related to the points above.
* Do not change variable names, code style, or structure outside the scope of these changes.
* Do not add extra features, optimizations, or refactors that weren't requested.
* If a change requires touching a shared/common file, make the minimal edit needed and leave everything else untouched.
* After implementing, list exactly which files and lines were changed, and why.
