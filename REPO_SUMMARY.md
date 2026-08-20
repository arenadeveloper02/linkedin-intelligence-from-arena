# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-20T10:50:15.087Z.

## Overview

LinkedIn Intelligence — search LinkedIn people and companies, analyze engagement, and revisit past analyses via a history drawer.

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 44

## Features

- Company/Personal LinkedIn search with Company selected by default
- Engagement intelligence dashboard with Overview, People, Companies and Posts tabs
- History button in topbar that lists past analyses and reloads them into the dashboard
- Graceful handling of personal-profile analysis failures with a friendly error banner

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

- **Updated at:** 2026-08-20T10:50:15.087Z
- **Request:** Here is the updated prompt specification reflecting your requested changes:

---

### UI Architecture Prompt: LinkedIn Intelligence (Updated Workflow)

You are tasked with updating the **LinkedIn Intelligence** web application. Maintain the reusable **Dashboard Component** (Overview, People, Companies, Posts tabs and drawers) and apply the following functional and UI updates:

---

### **1. Topbar Cleanup & History Feature**

* **Remove Elements**: Remove the theme switcher button/icon and the user email display menu from the top right section of the topbar header.
* **Add History Button**: Add a **"History"** button (with a clock/history icon) to the top right of the topbar.
* **History API Trigger**: Clicking the **History** button must trigger the following API call using the `email` value extracted from the URL search parameters (`?email=<user_email>`):
* **Endpoint**: `POST [https://agent.thearena.ai/api/workflows/9a27db23-9366-416b-b0c8-9c65e7eda202/execute](https://agent.thearena.ai/api/workflows/9a27db23-9366-416b-b0c8-9c65e7eda202/execute)`
* **Headers**:
* `X-API-Key`: `sk-sim-g6HxaMjNLmbQ-iqVeQnYIK3nuiyogqPs`
* `Content-Type`: `application/json`


* **Payload**:
```json
{
  "email": "<EMAIL_FROM_URL_SEARCH_PARAMS>"
}

```




* **History Modal / Drawer View**:
* Display the returned history items (`output.rows`) inside a modal or slide-over drawer as visual cards.
* **Card Action**: Clicking any card from the history view immediately loads its `company_details` / `output` dataset directly into the main **Dashboard Component** (rendering the Overview, People, Companies, and Posts tabs).



---

### **2. Initial Search Screen Controls & Radio Selection**

* **Default Radio Selection**: Set the **"Company"** radio button as selected by default (`isCompany: "true"`).
* **Reposition Controls**: Move the radio buttons above the search input bar.
* **Options**:
* `Company` (`isCompany: "true"`) [Selected by default]
* `Personal` (`isCompany: "false"`)



---

### **3. Personal Search & Analysis Error Handling (Service 500 Fix)**

* **Service 500 Graceful Degradation**: To prevent `/api/analyze` failures (`status 500`) when clicking a Personal profile card:
* Catch 500 HTTP errors gracefully during the analysis trigger call.
* If the downstream endpoint fails, fall back to displaying a user-friendly error notification banner: *"Unable to process personal profile intelligence at this time. Please select a Company profile or try again later."*
* Ensure loading states reset correctly without crashing the UI or blocking navigation.
