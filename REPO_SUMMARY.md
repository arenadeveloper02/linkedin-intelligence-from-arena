# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-20T11:30:03.515Z.

## Overview

LinkedIn Intelligence dashboard. This edit: (1) History now navigates to a dedicated /history page (app/history/page.tsx + components/HistoryPageClient.tsx) rendering grid cards styled like the search result cards, sourcing title/subtitle from company_details (company, alias, company_profile_url) via lib/history-parse.ts; DashboardClient's History button now routes to /history instead of opening the drawer. (2) Personal profile analysis failures now always show the clean fallback banner and reset loading (components/DashboardClient.tsx analyze error branch) and app/api/analyze/route.ts guards upstream JSON parsing so no unhandled exception hangs the flow. (3) components/PersonDrawer.tsx: tightened padding (p-5→p-4, mt-5→mt-4, mt-6→mt-5) and removed redundant Target company / Connection degree rows. (4) Added decodeUnicodeEscapes() in lib/utils.ts and applied it where post snippets and history titles render, so labels like '✍️ Enhanced Article' display the real emoji instead of raw \u270D escapes. prisma/schema.prisma is returned unchanged (FetchLog only, no column edits).

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 46

## Features

- Search LinkedIn companies and people
- Engagement intelligence dashboard with Overview, People, Companies and Posts tabs
- Dedicated History page with grid cards that reopen past dashboards
- Graceful fallback messaging for personal profile analysis failures
- Unicode-safe label rendering for post content

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

- **Updated at:** 2026-08-20T11:30:03.515Z
- **Request:** Implement the following functionality in the codebase. Do not modify, refactor, remove, or "clean up" any other part of the code beyond what is explicitly listed below. Preserve existing formatting, naming conventions, comments, and logic in all unrelated sections.

**Changes to implement:**

1. **History View Navigation & Card UI:**
* Instead of opening in a drawer or modal, navigate to a dedicated **History Page** upon clicking the **History** button.
* On the History Page, render historical entries as visual grid cards using the data from the `company_details` object (e.g., `company`, `alias`, `company_profile_url`).
* Reuse and adapt the existing card component styling from the "Select & Analyze" search result cards, adding an action button to select and open the corresponding dashboard view for that history entry.


2. **Personal Profile Analysis Fallback & Handling:**
* Update the `/api/analyze` request handler and frontend execution flow when analyzing a **Personal Profile**.
* If the analysis endpoint returns an error (e.g., `{"success":false,"error":"Intelligence service responded with status 500."}`), catch the exception gracefully without throwing an unhandled UI crash or hanging the loading state.
* Display a clean, prominent notification banner/toast: `"Unable to process personal profile intelligence at this time. Please select a Company profile or try again later."` and cleanly reset the loading indicators.


3. **Personal Profile Details View Tweaks:**
* Adjust the layout and spacing on the Personal Profile details screen by reducing redundant metadata fields and tightening container margins/padding slightly.


4. **Unicode Escape Sequence Fix:**
* Fix the `"Enhanced Article"` label so it does not display the raw Unicode escape sequence (`\u270D`). Render the actual emoji character properly (`✍️ Enhanced Article`) or display plain text `"Enhanced Article"` ensuring correct string encoding/decoding across source templates and JSON definitions.



**Constraints:**

* Only touch the files/functions directly related to the points above.
* Do not change variable names, code style, or structure outside the scope of these changes.
* Do not add extra features, optimizations, or refactors that weren't requested.
* If a change requires touching a shared/common file, make the minimal edit needed and leave everything else untouched.
* After implementing, list exactly which files and lines were changed, and why.
