# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-21T06:36:24.961Z.

## Overview

Edited linkedin-intelligence-from-arena. Changes: (1) components/HistoryView.tsx + components/HistoryPageClient.tsx — history cards now hide person-level headlines for Company entries (headline only rendered for Personal profiles; company cards fall back to subtitle). (2) components/LinkedInIntelligenceDashboard.tsx — added an entity summary header above the tab navigation showing the logo/avatar (with gradient-initials fallback), entity name, tagline/summary, and a 'View Profile ↗' CTA opening the LinkedIn URL in a new tab via a new optional profileUrl prop; components/DashboardClient.tsx passes selected.profileUrl and components/HistoryPageClient.tsx passes the history entry's profile URL. (3) components/PeopleTab.tsx — PersonCard now renders the person's LinkedIn photo (avatarUrl) with an onError handler that falls back to a CSS gradient initials avatar. prisma/schema.prisma echoed unchanged (FetchLog model).

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 48

## Features

- Company history cards no longer show person headlines
- Entity summary header with logo, name, tagline and View Profile CTA on the dashboard
- People tab cards render real LinkedIn profile photos with gradient initials fallback

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

- **Updated at:** 2026-08-21T06:36:24.961Z
- **Request:** Implement the following functionality in the codebase. Do not modify, refactor, remove, or "clean up" any other part of the code beyond what is explicitly listed below. Preserve existing formatting, naming conventions, comments, and logic in all unrelated sections.

#### **Changes to implement:**

1. **Conditional Headline Display on History Cards:**
* Update History cards so that headlines (e.g., job titles/roles like *"Junior 3D Modeler..."*) are **not** displayed when the entity type is a **Company**.
* Only render person-level headlines for **Personal** profile history cards.


2. **Selected Entity Summary Header on Details Page:**
* In the main Details Page (Dashboard), add a prominent entity header section above the tab navigation that explicitly identifies which profile/company the current data belongs to.
* Render the entity logo/avatar (using `profile_picture_url`, `company_profile.logo`, or `logo` from the response data).
* Render the entity name (e.g., `"Position²"`) and its descriptive tagline or summary (e.g., from `company_profile.tagline`, `description`, or profile summary).
* Add a direct **"View Profile ↗"** CTA button/link that opens the corresponding LinkedIn URL (`profile_url` / `company_profile_url`) in a new browser tab.


3. **People Tab Avatar Images:**
* Update the person cards rendered in the **People** tab to display the individual's actual LinkedIn profile photo using the image URL already available in the response dataset (e.g., `profile_picture_url` or `avatar_url`).
* Retain a clean CSS gradient fallback (with initials) if the profile picture URL is missing or fails to load.



#### **Constraints:**

* Only touch the files/functions directly related to the points above.
* Do not change variable names, code style, or structure outside the scope of these changes.
* Do not add extra features, optimizations, or refactors that weren't requested.
* If a change requires touching a shared/common file, make the minimal edit needed and leave everything else untouched.
* After implementing, list exactly which files and lines were changed, and why.
