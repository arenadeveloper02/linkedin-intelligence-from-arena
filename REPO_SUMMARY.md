# Repository Summary: linkedin-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-08-24T11:36:20.386Z.

## Overview

LinkedIn engagement intelligence dashboard: search people or companies, analyze post engagement, and browse analysis history.

**Repository:** `linkedin-intelligence-from-arena`  
**File count:** 48

## Features

- Search LinkedIn people and companies
- Analyze profile engagement via workflow API with timeout handling
- Dashboard with Overview, People, Companies and Posts tabs
- Analysis history with reloadable dashboards
- Graceful 504/500 timeout error handling on analysis

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
- `lib/profile-details.ts`
- `lib/search-parse.ts`
- `lib/types.ts`
- `lib/utils.ts`
- `prisma/schema.prisma`

### Config

- `.env.example`
- `middleware.ts`
- `next-env.d.ts`
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
- `lib/profile-details.ts`
- `lib/search-parse.ts`
- `lib/types.ts`
- `lib/utils.ts`
- `middleware.ts`
- `next-env.d.ts`
- `package.json`
- `postcss.config.mjs`
- `prisma/schema.prisma`
- `tailwind.config.ts`
- `tsconfig.json`

## Latest Change

- **Updated at:** 2026-08-24T11:36:20.386Z
- **Request:** Implement the following functionality in the codebase. Do not modify, refactor, remove, or "clean up" any other part of the code beyond what is explicitly listed below. Preserve existing formatting, naming conventions, comments, and logic in all unrelated sections.

#### **Changes to implement:**

1. **Fix Serverless Function Timeout (`FUNCTION_INVOCATION_TIMEOUT`) on `/api/analyze`:**
* Address the Vercel serverless function timeout error occurring during fresh profile analysis calls (`/api/analyze`).
* Increase the maximum execution duration config for the API route (e.g., set `export const maxDuration = 60;` or `export const config = { maxDuration: 60 };` in Next.js / Vercel API handler route) to allow sufficient time for downstream workflow execution.
* Add a request timeout mechanism with `AbortController` or custom fetch handling in the route handler to ensure fetch calls to `[https://agent.thearena.ai/api/workflows/3909ec63-faf0-4d69-abd1-499bc7b158d0/execute](https://agent.thearena.ai/api/workflows/3909ec63-faf0-4d69-abd1-499bc7b158d0/execute)` fail gracefully before Vercel terminates the function invocation.


2. **Frontend Failure & Timeout Handling for `/api/analyze`:**
* Update the frontend request caller to handle 504 Gateway Timeout and 500 error responses gracefully.
* If a timeout or server invocation failure occurs during analysis, clear the active loading spinner and display a user-friendly error notification/toast: `"Analysis is taking longer than expected. Please try refreshing in a few moments or try again."`



#### **Constraints:**

* Only touch the files/functions directly related to the points above.
* Do not change variable names, code style, or structure outside the scope of these changes.
* Do not add extra features, optimizations, or refactors that weren't requested.
* If a change requires touching a shared/common file, make the minimal edit needed and leave everything else untouched.
* After implementing, list exactly which files and lines were changed, and why.

Error:
"App validation failed after edit (3 repair round(s)):\n[e2b:typecheck] npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.\n\nadded 392 packages in 44s\nPrisma schema loaded from prisma/schema.prisma\n\n✔ Generated Prisma Client (v6.19.3) to ./node_modules/@prisma/client in 81ms\n\nStart by importing your Prisma Client (See: https://pris.ly/d/importing-client)\n\nTip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate\n\nVersion 5.9.3\ntsc: The TypeScript Compiler - Version 5.9.3\n\nCOMMON COMMANDS\n\n  tsc\n  Compiles the current project (tsconfig.json in the working directory.)\n\n  tsc app.ts util.ts\n  Ignoring tsconfig.json, compiles the specified files with default compiler options.\n\n  tsc -b\n  Build a composite project in the working directory.\n\n  tsc --init\n  Creates a tsconfig.json with the recommended settings in the working directory.\n\n  tsc -p ./path/to/tsconfig.json\n  Compiles the TypeScript project located at the specified path.\n\n  tsc --help --all\n  An expanded version of this information, showing all possible compiler options\n\n  tsc --noEmit\n  tsc --target esnext\n  Compiles the current project, with additional settings.\n\nCOMMAND LINE FLAGS\n\n--help, -h\nPrint this message.\n\n--watch, -w\nWatch input files.\n\n--all\nShow all compiler options.\n\n--version, -v\nPrint the compiler's version.\n\n--init\nInitializes a TypeScript project and creates a tsconfig.json file.\n\n--project, -p\nCompile the project given the path to its configuration file, or to a folder with a 'tsconfig.json'.\n\n--showConfig\nPrint the final configuration instead of building.\n\n--build, -b\nBuild one or more projects and their dependencies, if out of date\n\nCOMMON COMPILER OPTIONS\n\n--pretty\nEnable color and formatting in TypeScript's output to make compiler errors easier to read.\ntype: boolean\ndefault: true\n\n--declaration, -d\nGenerate .d.ts files from TypeScript and JavaScript files in your project.\ntype: boolean\ndefault: `false`, unless `composite` is set\n\n--declarationMap\nCreate sourcemaps for d.ts files.\ntype: boolean\ndefault: false\n\n--emitDeclarationOnly\nOnly output d.ts files and not JavaScript files.\ntype: boolean\ndefault: false\n\n--sourceMap\nCreate source map files for emitted JavaScript files.\ntype: boolean\ndefault: false\n\n--noEmit\nDisable emitting files from a compilation.\ntype: boolean\ndefault: false\n\n--target, -t\nSet the JavaScript language version for emitted JavaScript and include compatible library declarations.\none of: es5, es6/es2015, es2016, es2017, es2018, es2019, es2020, es2021, es2022, es2023, es2024, esnext\ndefault: es5\n\n--module, -m\nSpecify what module code is generated.\none of: none, commonjs, amd, umd, system, es6/es2015, es2020, es2022, esnext, node16, node18, node20, nodenext, preserve\ndefault: undefined\n\n--lib\nSpecify a set of bundled library declaration files that describe the target runtime environment.\none or more: es5, es6/es2015, es7/es2016, es2017, es2018, es2019, es2020, es2021, es2022, es2023, es2024, esnext, dom, dom.iterable, dom.asynciterable, webworker, webworker.importscripts, webworker.iterable, webworker.asynciterable, scripthost, es2015.core, es2015.collection, es2015.generator, es2015.iterable, es2015.promise, es2015.proxy, es2015.reflect, es2015.symbol, es2015.symbol.wellknown, es2016.array.include, es2016.intl, es2017.arraybuffer, es2017.date, es2017.object, es2017.sharedmemory, es2017.string, es2017.intl, es2017.typedarrays, es2018.asyncgenerator, es2018.asynciterable/esnext.asynciterable, es2018.intl, es2018.promise, es2018.regexp, es2019.array, es2019.object, es2019.string, es2019.symbol/esnext.symbol, es2019.intl, es2020.bigint/esnext.bigint, es2020.date, es2020.promise, es2020.sharedmemory, es2020.string, es2020.symbol.wellknown, es2020.intl, es2020.number, es2021.promise, es2021.string, es2021.weakref/esnext.weakref, es2021.intl, es2022.array, es2022.error, es2022.intl, es2022.object, es2022.string, es2022.regexp, es2023.array, es2023.collection, es2023.intl, es2024.arraybuffer, es2024.collection, es2024.object/esnext.object, es2024.promise, es2024.regexp/esnext.regexp, es2024.sharedmemory, es2024.string/esnext.string, esnext.array, esnext.collection, esnext.intl, esnext.disposable, esnext.promise, esnext.decorators, esnext.iterator, esnext.float16, esnext.error, esnext.sharedmemory, decorators, decorators.legacy\ndefault: undefined\n\n--allowJs\nAllow JavaScript files to be a part of your program. Use the 'checkJs' option to get errors from these files.\ntype: boolean\ndefault: false\n\n--checkJs\nEnable error reporting in type-checked JavaScript files.\ntype: boolean\ndefault: false\n\n--jsx\nSpecify what JSX code is generated.\none of: preserve, react, react-native, react-jsx, react-jsxdev\ndefault: undefined\n\n--outFile\nSpecify a file that bundles all outputs into one JavaScript file. If 'declaration' is true, also designates a file that bundles all .d.ts output.\n\n--outDir\nSpecify an output folder for all emitted files.\n\n--removeComments\nDisable emitting comments.\ntype: boolean\ndefault: false\n\n--strict\nEnable all strict type-checking options.\ntype: boolean\ndefault: false\n\n--types\nSpecify type package names to be included without being referenced in a source file.\n\n--esModuleInterop\nEmit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility.\ntype: boolean\ndefault: false\n\nYou can learn about all of the compiler options at https://aka.ms/tsc"
