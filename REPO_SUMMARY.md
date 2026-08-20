# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-20T10:16:59.619Z.

## Overview

Two-step LinkedIn intelligence app: search people or companies, select an entity, and explore a 4-tab engagement intelligence dashboard.

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 42

## Features

- Entity search with Personal/Company toggle
- Search results grid with verified/premium badges
- Select & Analyze flow triggering the intelligence workflow
- Reusable 4-tab intelligence dashboard (Overview, People, Companies, Posts)
- Person, company and post detail drawers/modals
- Back to Search navigation

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

- **Updated at:** 2026-08-20T10:16:59.619Z
- **Request:** need to update the entire ui:
Here is the architecture and prompt specification to rebuild the UI into a **Two-Step Search & Intelligence Flow**.

The prompt separates the previously built **Dashboard UI** into a standalone, reusable view component (`LinkedInIntelligenceDashboard`) and introduces a new **Search & Entity Selection Step** (`SearchScreen`).

---

### UI Architecture Prompt: LinkedIn Intelligence Search & Intelligence App

You are tasked with rebuilding the **LinkedIn Intelligence** application into a 2-step workflow:

1. **Search & Entity Selection View**
2. **Detailed Intelligence Dashboard View** (Encapsulate the previously created 4-tab dashboard UI into a reusable component)

---

### Step 1: Initial Search Screen

#### **1. Header & Access Guard**

* Extract the user `email` from the URL parameter `?email=<user_email>`.
* If `email` is missing, render an **Access Denied** message.
* Render the application topbar with the user's details and theme toggle.

#### **2. Search Form UI**

Build a search card at the top of the page with the following controls:

* **Entity Type Selector (Radio Buttons)**:
* `Personal` (`isCompany: "false"`) [Default]
* `Company` (`isCompany: "true"`)


* **Search Input & Action Button**:
* Input field with placeholder: *"Search for a person or company on LinkedIn..."*
* **Search** button (triggers API 1).
* Show a loading spinner during execution.



#### **3. Search API Call (API 1 - Entity Search)**

* **Endpoint**: `POST [https://agent.thearena.ai/api/workflows/970f3a69-e05e-4b68-b90c-4887a1e3cd2e/execute](https://agent.thearena.ai/api/workflows/970f3a69-e05e-4b68-b90c-4887a1e3cd2e/execute)`
* **Headers**:
* `X-API-Key`: `sk-sim-g6HxaMjNLmbQ-iqVeQnYIK3nuiyogqPs`
* `Content-Type`: `application/json`


* **Request Body**:
```json
{
  "searchInput": "<USER_INPUT>",
  "isCompany": "<"true" | "false">"
}

```



#### **4. Search Results Grid**

Render the returned `results` array below the search bar in a clean card grid format:

* **People Card Data Mapping**:
* **Avatar**: `profile_picture_url` (Fallback to name initials gradient if `null`).
* **Title / Name**: `name`
* **Headline**: `headline`
* **Location**: `location`
* **Badges**: Show `verified` badge if `true`, show `premium` badge if `true`.
* **Followers**: `followers_count` (if available).
* **Action**: Render a *"Select & Analyze"* button on card click.


* **Company Card Data Mapping**:
* **Logo**: `logo` (Fallback to company name initial).
* **Title / Name**: `name`
* **Industry**: `industry` (Show `N/A` if `"undefined"` or `null`).
* **Location**: `location`
* **Followers**: `followers_count`
* **Action**: Render a *"Select & Analyze"* button on card click.



---

### Step 2: Entity Selection & Dashboard Loading

#### **1. Selection API Call (API 2 - Trigger Intelligence Workflow)**

When a user clicks on any Person or Company card from the search results, transition the page into a full-screen loading state (*"Gathering LinkedIn Intelligence for [Selected Name]..."*) and execute API 2.

* **Endpoint**: `POST [https://agent.thearena.ai/api/workflows/3909ec63-faf0-4d69-abd1-499bc7b158d0/execute](https://agent.thearena.ai/api/workflows/3909ec63-faf0-4d69-abd1-499bc7b158d0/execute)`
* **Headers**:
* `X-API-Key`: `sk-sim-g6HxaMjNLmbQ-iqVeQnYIK3nuiyogqPs`
* `Content-Type`: `application/json`


* **Request Body**:
```json
{
  "name": "<SELECTED_ITEM_NAME>",
  "profile_url": "<SELECTED_ITEM_PROFILE_URL>",
  "account_id": "<SELECTED_ITEM_ACCOUNT_ID_OR_ID>",
  "slug": "<SELECTED_ITEM_COMPANY_SLUG_OR_PUBLIC_IDENTIFIER>",
  "email": "<EMAIL_FROM_SEARCH_PARAMS>"
}

```



#### **2. Transition to Dashboard**

* Upon receiving a `success: true` response from API 2, hide the Search UI and mount the reusable **`LinkedInIntelligenceDashboard`** component.
* Pass the returned intelligence payload (`output.rows[0].output`) to populate the dashboard tabs (**Overview**, **People**, **Companies**, **Posts**) and sliding detail drawers.
* Provide a **"← Back to Search"** button in the header toolbar to allow users to return to the Search Screen at any time.
