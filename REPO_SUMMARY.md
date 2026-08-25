# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-25T09:35:05.739Z.

## Overview

LinkedIn engagement intelligence dashboard: search people/companies, run Arena analyze workflows, browse history, and explore engagement analytics (people, companies, posts) inside an Arena iframe.

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 50

## Features

- Company/person LinkedIn search with card selection
- Analyze workflow proxy with 60s serverless duration and timeout fallback polling
- Inline history via optimized /api/intelligence proxy that forwards { email } directly
- History auto-refresh on back navigation from details view
- View Profile CTA restored from deep-extracted profile_url
- Refresh payload always populates account_id and profile_url via layered fallbacks

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
- `vercel.json`

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
- `vercel.json`

## Latest Change

- **Updated at:** 2026-08-25T09:35:05.739Z
- **Request:** Implement the following functionality in the codebase. Do not modify, refactor, remove, or "clean up" any other part of the code beyond what is explicitly listed below. Preserve existing formatting, naming conventions, comments, and logic in all unrelated sections.

#### **Changes to implement:**

1. **Optimize History API Fetching (`/api/history`):**
* Resolve response delays on the frontend History API endpoint compared to Postman requests.
* Ensure the proxy route handler for `POST [https://agent.thearena.ai/api/workflows/9a27db23-9366-416b-b0c8-9c65e7eda202/execute](https://agent.thearena.ai/api/workflows/9a27db23-9366-416b-b0c8-9c65e7eda202/execute)` passes the `email` search parameter directly without unnecessary server-side payload transformations or unoptimized blocking logic.
* **Payload Structure**:
```json
{
  "email": "<USER_EMAIL_FROM_SEARCH_PARAMS>"
}

```




2. **Handle Serverless Timeout & Fallback Polling on Analyze API (`/api/analyze`):**
* Fix the frontend timeout error (`"Analysis is taking longer than expected..."`) caused by Vercel serverless execution limits while the backend workflow execution succeeds.
* Increase the maximum execution duration in the route handler configuration (`export const maxDuration = 60;`).
* Update the frontend caller to catch 504 / timeout responses gracefully and auto-trigger a background re-fetch from the History API to seamlessly load the newly created dataset without blocking the user.


3. **Auto-Refresh History on Back Navigation:**
* Add a side effect / handler to automatically call the History API whenever navigating back from the Details page to the main Search screen.
* Ensure recently processed items immediately appear in the inline History section without requiring a manual browser refresh.


4. **Restore "View Profile" CTA Button when Loading History Cards:**
* Ensure `profile_url` (or `company_profile_url`) is properly extracted from history records (`company_details.profile_url` or `output.company_profile.profile_url`) and stored in active dashboard state.
* Display the **"View Profile ↗"** CTA button on the profile summary header above the dashboard tabs when navigating from a History card click.


5. **Fix Missing `account_id` and `profile_url` in Refresh Payload:**
* Fix the **Refresh** button click handler on the Details page to ensure `account_id` and `profile_url` are never sent as empty strings (`""`).
* Fall back across `profile_details`, `company_details`, and root active profile state to reliably pass both parameters into the Analyze API (`POST [https://agent.thearena.ai/api/workflows/3909ec63-faf0-4d69-abd1-499bc7b158d0/execute](https://agent.thearena.ai/api/workflows/3909ec63-faf0-4d69-abd1-499bc7b158d0/execute)`).
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
