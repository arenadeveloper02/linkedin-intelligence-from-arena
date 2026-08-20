# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-20T13:50:06.907Z.

## Overview

Added an access guard for the `email` search parameter in middleware (falls back to Access Denied when neither emailId nor email is present) and a Company vs Personal type badge on History cards derived from the record payload. Files changed: middleware.ts (accepts `email` query param alongside `emailId`, persists it to the arena cookie, denies access when both are missing), lib/types.ts (added `isCompany: boolean` to HistoryEntry), lib/history-parse.ts (derives entity type from is_company/type fields, company_details/company_profile sections, and person-name fallbacks), components/HistoryPageClient.tsx and components/HistoryView.tsx (render the 🏢 Company / 👤 Personal badge on each card header). prisma/schema.prisma echoed unchanged; app/not-found.tsx included per structure requirements.

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 47

## Features

- Access Denied guard honoring the `email` search parameter (in addition to emailId) via middleware rewrite
- Company vs Personal entity type badge on History cards
- History payload type derivation from is_company / type / company_details attributes
- Existing Arena email gate, cookie persistence, and iframe headers preserved

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

- **Updated at:** 2026-08-20T13:50:06.907Z
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
