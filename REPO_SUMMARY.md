# Repository Summary: LinkedIn Intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-19T10:58:09.038Z.

## Overview

An engagement intelligence dashboard that fetches LinkedIn company activity from an Arena workflow, normalizes engagers, posts and companies, and presents Overview, People, Companies and Posts views with drawers, modals and rich filters.

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 38

## Features

- Email query-parameter access guard with Access Denied fallback screen
- Server-proxied POST to the Arena workflow endpoint with manual Refresh
- Robust parsing of double-encoded workflow payloads (company profile, posts, engagers, engagement records)
- Overview tab with KPI cards, reaction/seniority/location/employee-mix distributions and a clickable Top Companies leaderboard
- People tab with seniority buckets, search, chips, dropdown filters, decision-maker and hide-internal toggles
- Companies tab with minimum-people thresholds, search and seniority segment bars
- Posts tab with seniority/reaction/company/date filters and Most Engaged sorting
- Person drawer, company drawer and post inspection modal with reaction badges
- Arena email gate with httpOnly-style cookie persistence and frame-ancestors CSP
- Prisma-backed fetch logging on every workflow request

## Tech Stack

- Next.js ^15.3.3 (App Router)
- React ^19.0.0
- Tailwind CSS v3
- TypeScript
- Prisma + PostgreSQL (Neon on Vercel)

## Infrastructure

- **Neon project ID:** `patient-firefly-85707512` — managed by Sim Development; do not delete or replace
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

- `app/api/intelligence/route.ts`

### Components

- `components/CompaniesTab.tsx`
- `components/CompanyDrawer.tsx`
- `components/DashboardClient.tsx`
- `components/OverviewTab.tsx`
- `components/PeopleTab.tsx`
- `components/PersonDrawer.tsx`
- `components/PostModal.tsx`
- `components/PostsTab.tsx`
- `components/Topbar.tsx`
- `components/Widgets.tsx`
- `components/arena-email-provider.tsx`

### Libraries

- `lib/actions.ts`
- `lib/arena-email-constants.ts`
- `lib/arena-email.ts`
- `lib/parse.ts`
- `lib/prisma.ts`
- `lib/types.ts`
- `lib/utils.ts`
- `prisma/schema.prisma`

### Config

- `.env.example`
- `.gitignore`
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
- `.gitignore`
- `README.md`
- `REPO_SUMMARY.md`
- `app/access-denied/page.tsx`
- `app/api/intelligence/route.ts`
- `app/arena-ds-tokens.css`
- `app/error.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/not-found.tsx`
- `app/page.tsx`
- `components/CompaniesTab.tsx`
- `components/CompanyDrawer.tsx`
- `components/DashboardClient.tsx`
- `components/OverviewTab.tsx`
- `components/PeopleTab.tsx`
- `components/PersonDrawer.tsx`
- `components/PostModal.tsx`
- `components/PostsTab.tsx`
- `components/Topbar.tsx`
- `components/Widgets.tsx`
- `components/arena-email-provider.tsx`
- `lib/actions.ts`
- `lib/arena-email-constants.ts`
- `lib/arena-email.ts`
- `lib/parse.ts`
- `lib/prisma.ts`
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

- **Updated at:** 2026-08-19T10:58:09.038Z
- **Request:** You are tasked with building the frontend client for a web application named **LinkedIn Intelligence**. Focus strictly on core functionality, routing logic, API integration, data parsing, state management, and UI component behavior.

---

**App Specification: LinkedIn Intelligence**

**1. Authentication & Query Parameter Guard**

* **URL Parameter Check**: On initial load, inspect the URL search parameters for `email` (e.g., `?email=saiteja.s@position2.com`).
* **Access Denied View**: If the `email` query parameter is missing, empty, or invalid, do not call the API. Render an **Access Denied** fallback screen with a clear warning message.
* **Header Sync**: Populate the topbar user dropdown with the name and email derived from this parameter.

**2. API Integration & Fetch Logic**

* **Trigger**: Trigger a POST request on application mount if a valid `email` parameter exists.
* **Endpoint**: `POST [https://agent.thearena.ai/api/workflows/9a27db23-9366-416b-b0c8-9c65e7eda202/execute](https://agent.thearena.ai/api/workflows/9a27db23-9366-416b-b0c8-9c65e7eda202/execute)`
* **Headers**:
* `X-API-Key`: `sk-sim-g6HxaMjNLmbQ-iqVeQnYIK3nuiyogqPs`
* `Content-Type`: `application/json`


* **Payload**:
```json
{
  "email": "<email_from_query_params>",
  "stream": false
}

```


* **State Loading & Refresh**: Display skeleton loaders or spinner overlays while fetching. Include a manual **Refresh** button in the header toolbar to re-trigger this request.

**3. Data Extraction & Normalization**
From the API JSON response path `output.rows[0].output`, parse and store:

* **Company Profile** (`company_profile`): Extract company name, logo, follower count, tagline, employee count, and industry.
* **Posts** (`recent_list_posts.items`): Array of posts containing `id`, `text`, `parsed_datetime`, `reaction_counter`, `comment_counter`, `repost_counter`, and `share_url`.
* **People / Engagers** (`users_profile_data.values`): Parse this double-encoded JSON string array. Each item represents an individual engager with fields corresponding to: `[profile_urn_id, full_name, first_name, last_name, linkedin_url, account_id, headline, title, seniority_level, is_decision_maker, company_name, company_url, company_id, ..., location, country, connection_degree, followers_count, connections_count, relationship_type, is_active, reaction_type, ..., post_url, post_urn, post_snippet, target_company, avatar_url, account_key, timestamp]`.
* **Engagement Mapping** (`get_reactions_comments_results.engagementRecords`): Map each engagement record back to specific `postId`s and `personSlug`s.

**4. Core View Tabs & UI State**
Implement 4 primary tab views:

* **Tab 1: Overview**
* **KPI Summary Cards**: Compute and display real-time counts for Total Engagements, Unique People, Decision Makers (`is_decision_maker === "Yes"`), C-Suite Reached, Companies Reached, and Comments.
* **Breakdown Widgets**: Visual bar distributions for *Reaction Mix* (LIKE, EMPATHY, PRAISE, etc.), *Seniority Mix* (C-Level, Director, Manager, IC), *Top Locations*, and *Employee vs. External*.
* **Top Companies Leaderboard**: Ranked list of companies by total engager count. Clicking any row navigates to the Companies tab and opens that company's detail drawer.


* **Tab 2: People**
* **Grouping**: Group cards into expandable/collapsible buckets by seniority level (Individual Contributors, Managers, Directors, C-Suite/Founders).
* **Person Card Components**: Render profile picture, full name, headline, title badge (IC, Manager, Director, C-Level), company badge (e.g., P² Employee vs. External), location, connection degree, follower count, and total post engagement count bar.
* **Filters Bar**: Search input (filters name, title, company), Seniority chips, Country/City dropdowns, Connection Degree, Decision-Maker toggle, and "Hide Internal Employees" toggle.


* **Tab 3: Companies**
* **Company Grid**: Cards displaying company name, logo placeholder, total engaged people count, decision-maker count, and seniority distribution segment bar.
* **Filters**: Filter by Minimum People threshold (1+, 2+, 3+, 5+) and Search query.


* **Tab 4: Posts**
* **Post Cards**: Render target post author, published date, post content snippet, and calculated pill badges for total engagers, decision-makers count, C-Suite count, and a direct "View Post ↗" link.
* **Filters**: Seniority selector, Reaction Type chips, Company dropdown, Date range pickers, and "Most Engaged" sort toggle.



**5. Drawers & Modals**

* **Person Detail Drawer**: Sliding side panel triggered by clicking a person card. Displays full avatar, name, headline, direct LinkedIn link, follower/connection counts, target company info, location, and post interaction history.
* **Company Detail Drawer**: Displays detailed breakdown of all employees/engagers associated with that company.
* **Post Inspection Modal**: Overlay triggered by clicking a post card. Shows full post text, engagement metric breakdown, and the list of engagers along with their individual reaction badges (👍 Like, 🙌 Praise, 🫂 Empathy).

here's the api you can refer:
postman request POST 'https://agent.thearena.ai/api/workflows/9a27db23-9366-416b-b0c8-9c65e7eda202/execute' \
  --header 'X-API-Key: sk-sim-g6HxaMjNLmbQ-iqVeQnYIK3nuiyogqPs' \
  --header 'Content-Type: application/json' \
  --header 'Cookie: AWSALB=XAIwL61uFnLGsF6sMiOV0LXKLiJmwwzmeDFV1z5ZCXJq2qZgcJFCmSeM1mdTbJcoL/8Kw09kNOZj28x2VGGREUNI83YFbssLsibQ8ok/sPr8G7kLtv7YPrIzezaN; AWSALBCORS=XAIwL61uFnLGsF6sMiOV0LXKLiJmwwzmeDFV1z5ZCXJq2qZgcJFCmSeM1mdTbJcoL/8Kw09kNOZj28x2VGGREUNI83YFbssLsibQ8ok/sPr8G7kLtv7YPrIzezaN' \
  --body '{
    "email": "saiteja.s@position2.com",
    "stream": false
}'
