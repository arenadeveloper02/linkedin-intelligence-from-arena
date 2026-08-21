# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-21T06:54:44.798Z.

## Overview

Added robust profile header banner rendering above the dashboard tabs (logo with onError fallback to gradient initials, decoded entity name, tagline summary, View Profile CTA opening the LinkedIn URL in a new tab) and fixed People tab person cards so real LinkedIn profile pictures render reliably (referrerPolicy no-referrer to bypass CDN hotlink blocking) while retaining the gradient-initials fallback. Files changed: components/LinkedInIntelligenceDashboard.tsx (added logoError state + onError handler and referrerPolicy on the header banner logo <img> so broken logo URLs fall back to gradient initials; banner, heading, tagline and View Profile button preserved above the tabs), components/PeopleTab.tsx (added referrerPolicy="no-referrer" to the PersonCard avatar <img> so LinkedIn-hosted profile pictures load; existing avatarError fallback retained), prisma/schema.prisma (echoed unchanged — additive-only rule, no columns modified).

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 48

## Features

- Entity profile header banner above dashboard tabs with logo, name, tagline and View Profile CTA
- Gradient-initials fallback when the profile logo is missing or fails to load
- Person cards render real LinkedIn profile pictures with referrer-safe loading
- Existing initials fallback preserved for people avatars
- Overview, People, Companies and Posts tabs unchanged

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

- **Updated at:** 2026-08-21T06:54:44.798Z
- **Request:** Implement the following functionality in the codebase. Do not modify, refactor, remove, or "clean up" any other part of the code beyond what is explicitly listed below. Preserve existing formatting, naming conventions, comments, and logic in all unrelated sections.

#### **Changes to implement:**

1. **Entity Profile Header Banner above Dashboard Tabs:**
* Add a profile header banner directly above the main navigation tabs (**Overview**, **People**, **Companies**, **Posts**) on the details page to clearly display which profile is currently selected.
* **Logo**: Display the profile logo/avatar using the image URL from the returned dataset (`company_profile.logo`, `logo`, or `profile_picture_url`). Fallback to gradient initials if unavailable.
* **Heading**: Display the entity's full name (e.g., `"Position²"` or person name) prominently.
* **Summary**: Display the description or tagline if present in the data payload (e.g., `company_profile.tagline`, `description`, or profile headline).
* **View Profile Button**: Add a **"View Profile ↗"** CTA button that opens the selected profile's LinkedIn URL (`profile_url` or `company_profile_url`) in a new tab.


2. **Person Card Profile Pictures in People Tab:**
* Update the person cards in the **People** tab to render the individual's actual LinkedIn profile picture using the image URL already available in the profile dataset (`profile_picture_url` or `avatar_url`).
* Retain the existing fallback avatar (initials with gradient background) in case the image fails to load or the URL is missing/`null`.



#### **Constraints:**

* Only touch the files/functions directly related to the points above.
* Do not change variable names, code style, or structure outside the scope of these changes.
* Do not add extra features, optimizations, or refactors that weren't requested.
* If a change requires touching a shared/common file, make the minimal edit needed and leave everything else untouched.
* After implementing, list exactly which files and lines were changed, and why.
