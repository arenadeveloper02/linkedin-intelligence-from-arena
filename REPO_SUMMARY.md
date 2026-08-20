# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-20T11:27:56.555Z.

## Overview

LinkedIn Intelligence — engagement intelligence dashboard with full-screen history view, graceful personal-profile error handling, and clean unicode rendering.

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 45

## Features

- Full-screen history page view with visual cards mapped from company/profile details
- History cards match Select & Analyze card design with hover behaviors
- Clicking a history card loads its dataset into the dashboard tabs
- Graceful 500 error handling for personal profile analysis with friendly banner
- Personal profile detail rendering without broken images or undefined labels
- Unicode escape sequence decoding for post text and labels (e.g. Enhanced Article ✍️)

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

- `components/CompaniesTab.tsx`
- `components/CompanyDrawer.tsx`
- `components/DashboardClient.tsx`
- `components/HistoryDrawer.tsx`
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
- `app/layout.tsx`
- `app/not-found.tsx`
- `app/page.tsx`
- `components/CompaniesTab.tsx`
- `components/CompanyDrawer.tsx`
- `components/DashboardClient.tsx`
- `components/HistoryDrawer.tsx`
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

- **Updated at:** 2026-08-20T11:27:56.555Z
- **Request:** Implement the following functionality in the codebase. Do not modify, refactor, remove, or "clean up" any other part of the code beyond what is explicitly listed below. Preserve existing formatting, naming conventions, comments, and logic in all unrelated sections.

#### **Changes to implement:**

1. **History View Page Refactor**:
* Replace the existing slide-over drawer modal for **History** with a dedicated full-screen / sub-route page view.
* Render history records returned by the History API (`POST [https://agent.thearena.ai/api/workflows/9a27db23-9366-416b-b0c8-9c65e7eda202/execute](https://agent.thearena.ai/api/workflows/9a27db23-9366-416b-b0c8-9c65e7eda202/execute)`) as visual cards.
* Map title, logo, headline/tagline, and metadata for each history card directly from the `company_details` (or profile details) object within each row.
* Match the card design, structure, and hover behaviors to the existing *"Select & Analyze"* search result cards, with slight visual adaptations suitable for historical records.
* Clicking a history card must load its underlying dataset (`output`) into the dashboard component view (Overview, People, Companies, Posts tabs).


2. **Personal Profile Analysis Error Handling & Graceful Fallback**:
* Handle the 500 error returned by `/api/analyze` when selecting a Personal profile:
```json
{"success":false,"error":"Intelligence service responded with status 500."}

```


* Intercept HTTP status 500 responses on personal profile analysis triggers gracefully without unmounting components or leaving the UI in an infinite loading state.
* Display a user-friendly error notification banner or toast message: *"Unable to process personal profile intelligence at this time. Please select a Company profile or try again later."*
* Reset loading indicators immediately upon catching this error.


3. **Personal Profile Details View Adjustments**:
* Tweaked layout rendering specifically for personal profile detail cards and drawers: adjust missing data fields (such as missing company logo, follower count, or industry) so they render gracefully without broken image placeholders or `undefined` labels. Apply minor styling adjustments strictly where necessary to accommodate personal profile schemas.


4. **Unicode Escape Sequence Fix**:
* Fix the "Enhanced Article" label so it does not display the raw Unicode escape sequence (`\u270D`). Render the actual character properly (`✍️`) or display plain text "Enhanced Article" ensuring correct encoding/decoding across source files, JSON, and template definitions.



---

#### **Constraints:**

* Only touch the files/functions directly related to the points above.
* Do not change variable names, code style, or structure outside the scope of these changes.
* Do not add extra features, optimizations, or refactors that weren't requested.
* If a change requires touching a shared/common file, make the minimal edit needed and leave everything else untouched.

---

#### **Reporting Requirement:**

After implementing, list exactly which files and lines were changed, and explain why each change was made.
