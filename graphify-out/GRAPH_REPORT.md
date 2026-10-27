# Graph Report - .  (2026-10-27)

## Corpus Check
- 155 files · ~59,238 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 861 nodes · 2478 edges · 48 communities (37 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.8)
- Token cost: 61,268 input · 0 output

## Community Hubs (Navigation)
- Front-end App Views
- GraphQL Resolvers & Utils
- Plan Saving & Validation
- Back-end Dependencies
- Booking & User Models
- Front-end Dependencies
- Plan Queries & Dashboard
- Models & Reviews
- Architecture Overview
- UI Primitives & Users Table
- Plan Editor
- Demo Seed & Saved Plans
- Front-end TS Config
- Plan & Checkout Pages
- Operator Dashboard Overview
- Booking Lifecycle
- shadcn Components Config
- Operator Profile & Stats
- Back-end TS Config
- Route Map & Gazetteer
- Dashboard Shell & Role Guard
- Home & Plans Pages
- User Management Forms
- Auth Pages
- Root Layout & Operators
- Session & Route Middleware
- Account Menu & Language Toggle
- i18n Dictionaries
- Search Page & Facets
- Apollo Client & Session
- DB Connection & Migrations
- Users & Orders Pages
- GraphQL Schema Typedefs
- Operator Public Profile
- Back-end Fallow Config
- Plan Editor Page
- Button Component
- Auth Directives & Super Admin
- Front-end Fallow Config
- Tailwind Config
- ESLint Config
- Next.js Config
- Next Env Types
- Bilingual Content & i18n
- Optional Integrations & Upload
- Marketplace Staff & Manager

## God Nodes (most connected - your core abstractions)
1. `useT()` - 67 edges
2. `PlanModel` - 63 edges
3. `UserModel` - 39 edges
4. `cn()` - 37 edges
5. `PlanController` - 35 edges
6. `BookingModel` - 35 edges
7. `OperatorModel` - 32 edges
8. `useLocale()` - 30 edges
9. `ReviewModel` - 26 edges
10. `BookingController` - 25 edges

## Surprising Connections (you probably didn't know these)
- `toEditor()` --indirect_call--> `text()`  [INFERRED]
  front-end/components/app/partner/plan-editor.tsx → back-end/src/controllers/plan/plan.controller.ts
- `Back-end pnpm allowBuilds (skip @apollo/protobufjs)` --conceptually_related_to--> `Back-end API (Express 5 + Apollo Server 5 + Sequelize 6)`  [INFERRED]
  back-end/pnpm-workspace.yaml → README.md
- `Front-end pnpm allowBuilds (skip unrs-resolver)` --conceptually_related_to--> `Front-end Web (Next.js 15 App Router + Apollo Client 3)`  [INFERRED]
  front-end/pnpm-workspace.yaml → README.md
- `Two Apps, One Repo, No Monorepo Tooling` --rationale_for--> `Back-end pnpm allowBuilds (skip @apollo/protobufjs)`  [INFERRED]
  README.md → back-end/pnpm-workspace.yaml
- `Two Apps, One Repo, No Monorepo Tooling` --rationale_for--> `Front-end pnpm allowBuilds (skip unrs-resolver)`  [INFERRED]
  README.md → front-end/pnpm-workspace.yaml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Three Surfaces, One Loop (promise, book, rate, rank)** — readme_traveller_surface, readme_agency_surface, readme_marketplace_staff_surface, readme_expectation_score, readme_plan_publish_checklist [EXTRACTED 1.00]
- **Role-Based Access Control** — readme_role_super_admin, readme_role_manager, readme_role_operator, readme_role_user, readme_auth_directive, readme_next_route_guard_middleware [EXTRACTED 1.00]
- **FE/BE Contract Conventions** — readme_graphql_schema_contract, readme_response_envelope, readme_camelcase_convention, readme_i18n_locale [INFERRED 0.85]

## Communities (48 total, 11 thin omitted)

### Community 0 - "Front-end App Views"
Cohesion: 0.05
Nodes (105): ProfilePage(), AccountMenu(), OperatorHealthView(), QueueItem(), ReviewQueueView(), Stats, Brand(), CheckoutView() (+97 more)

### Community 1 - "GraphQL Resolvers & Utils"
Cohesion: 0.06
Nodes (54): app, httpServer, schema, server, client, isSpaceEnabled, FileController, TYPES (+46 more)

### Community 2 - "Plan Saving & Validation"
Cohesion: 0.12
Nodes (27): claim(), claims, intOrNull(), lines(), LIVE, oneOf(), PLAN_FIELDS, Rated (+19 more)

### Community 3 - "Back-end Dependencies"
Cohesion: 0.05
Nodes (36): dependencies, @apollo/server, @as-integrations/express5, @aws-sdk/client-s3, bcryptjs, cors, dotenv, express (+28 more)

### Community 4 - "Booking & User Models"
Cohesion: 0.17
Nodes (21): TAB_STAGES, BookingModel, createBookingModel(), restrict(), createUserModel(), _hashPassword(), _preHash(), UserModel (+13 more)

### Community 5 - "Front-end Dependencies"
Cohesion: 0.06
Nodes (34): dependencies, class-variance-authority, clsx, graphql, lucide-react, next, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu (+26 more)

### Community 7 - "Models & Reviews"
Cohesion: 0.17
Nodes (13): ReviewController, ClaimRatingModel, createClaimRatingModel(), createReviewModel(), ReviewModel, setupModel(), createOperatorModel(), createDepartureModel() (+5 more)

### Community 8 - "Architecture Overview"
Cohesion: 0.10
Nodes (25): pgdata Volume, postgres Compose Service (postgres:16-alpine), Back-end pnpm allowBuilds (skip @apollo/protobufjs), Front-end pnpm allowBuilds (skip unrs-resolver), Travel Agency Surface, Back-end API (Express 5 + Apollo Server 5 + Sequelize 6), camelCase Everywhere Convention, Demo Marketplace Seed (SEED_DEMO) (+17 more)

### Community 9 - "UI Primitives & Users Table"
Cohesion: 0.18
Nodes (18): Props, Badge(), badgeVariants, Card(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader() (+10 more)

### Community 10 - "Plan Editor"
Cohesion: 0.11
Nodes (19): AREAS, blankDay(), CLAIM_AREAS, DIFFICULTIES, EditorClaim, EditorDay, EditorDeparture, EditorPlan (+11 more)

### Community 11 - "Demo Seed & Saved Plans"
Cohesion: 0.16
Nodes (17): createSavedPlanModel(), SavedPlanModel, ClaimSeed, D(), Day, daysAgo(), img, NOW (+9 more)

### Community 12 - "Front-end TS Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 13 - "Plan & Checkout Pages"
Cohesion: 0.13
Nodes (12): PartnerPlansPage(), APPROVE_PLAN_MUTATION, CHECK_FIELDS, CREATE_PLAN_MUTATION, PARTNER_PLANS_QUERY, PLAN_CARD_FIELDS, PLAN_FIELDS, PLAN_QUERY (+4 more)

### Community 14 - "Operator Dashboard Overview"
Cohesion: 0.13
Nodes (13): DAYS, PartnerOverviewPage(), Period, ADMIN_OPERATORS_QUERY, MARKETPLACE_STATS_QUERY, MY_OPERATOR_QUERY, OPERATOR_FIELDS, PARTNER_COUNTS_QUERY (+5 more)

### Community 15 - "Booking Lifecycle"
Cohesion: 0.27
Nodes (4): BookingController, main(), WithTrip, addDays()

### Community 16 - "shadcn Components Config"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 17 - "Operator Profile & Stats"
Cohesion: 0.24
Nodes (6): OPERATOR_FIELDS, OperatorController, OperatorModel, TOperator, TOperatorStats, TOperatorUpdate

### Community 18 - "Back-end TS Config"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, lib, module, moduleResolution, noImplicitAny, noUnusedLocals, noUnusedParameters (+8 more)

### Community 19 - "Route Map & Gazetteer"
Cohesion: 0.19
Nodes (15): Box, COS, dayRuns(), overlaps(), RouteCanvas(), RouteMap(), Stop, trim() (+7 more)

### Community 20 - "Dashboard Shell & Role Guard"
Cohesion: 0.24
Nodes (8): RoleGuard(), ADMIN_NAV, NavItem, PARTNER_NAV, daysToPeak(), Sidebar(), noop(), useCurrentUser()

### Community 21 - "Home & Plans Pages"
Cohesion: 0.20
Nodes (12): Data, HomePage(), generateMetadata(), load, PlanPage(), Props, API_BASE, serverQuery() (+4 more)

### Community 22 - "User Management Forms"
Cohesion: 0.21
Nodes (11): Form, fromUser(), Props, UserFormDialog(), Label(), CREATE_USER_MUTATION, CURRENT_USER_QUERY, DELETE_USER_MUTATION (+3 more)

### Community 23 - "Auth Pages"
Cohesion: 0.21
Nodes (8): metadata, metadata, AuthCard(), AuthForm(), DEMO, Mode, safeNext(), homeFor()

### Community 24 - "Root Layout & Operators"
Cohesion: 0.18
Nodes (11): caprasimo, figtree, metadata, nunito, RootLayout(), rubik, metadata, OperatorsPage() (+3 more)

### Community 25 - "Session & Route Middleware"
Cohesion: 0.27
Nodes (9): ACTIONS, AuthResult, POST(), decodeJwtPayload(), jwtExpiry(), config, hasLiveToken(), middleware() (+1 more)

### Community 26 - "Account Menu & Language Toggle"
Cohesion: 0.29
Nodes (7): LABEL, LanguageToggle(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuSeparator(), LOCALES, STAFF_ROLES

### Community 27 - "i18n Dictionaries"
Cohesion: 0.36
Nodes (6): dictionaries, isLocale(), lookup(), translate(), en, mn

### Community 28 - "Search Page & Facets"
Cohesion: 0.25
Nodes (7): DIFFICULTY, metadata, one(), Props, SearchPage(), SearchParams, PlanFacet

### Community 29 - "Apollo Client & Session"
Cohesion: 0.39
Nodes (6): createApolloClient(), ApolloClientProvider(), readCookie(), readSessionToken(), getActiveLocale(), @apollo/client

### Community 30 - "DB Connection & Migrations"
Cohesion: 0.32
Nodes (6): connectDatabase(), MIGRATIONS, options, runMigrations(), sequelize, sleep()

### Community 31 - "Users & Orders Pages"
Cohesion: 0.39
Nodes (5): UsersPage(), OrdersPage(), useDebounced(), OrderTab, Role

### Community 33 - "Operator Public Profile"
Cohesion: 0.47
Nodes (5): generateMetadata(), load, OperatorPage(), Props, OPERATOR_QUERY

### Community 34 - "Back-end Fallow Config"
Cohesion: 0.40
Nodes (4): entry, ignoreDependencies, $schema, usedClassMembers

### Community 36 - "Button Component"
Cohesion: 0.67
Nodes (3): Button(), ButtonProps, buttonVariants

### Community 37 - "Auth Directives & Super Admin"
Cohesion: 0.50
Nodes (4): SUPER_ADMIN Boot Seed, @auth / @authLogin Schema Directives, Next.js middleware.ts Route Guard, SUPER_ADMIN Role

## Knowledge Gaps
- **227 isolated node(s):** `$schema`, `entry`, `ignoreDependencies`, `usedClassMembers`, `app` (+222 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `toEditor()` connect `Plan Editor` to `Plan Saving & Validation`?**
  _High betweenness centrality (0.334) - this node is a cross-community bridge._
- **Why does `text()` connect `Plan Saving & Validation` to `Plan Editor`, `Demo Seed & Saved Plans`, `Plan Queries & Dashboard`?**
  _High betweenness centrality (0.334) - this node is a cross-community bridge._
- **Why does `seedDemo()` connect `Demo Seed & Saved Plans` to `GraphQL Resolvers & Utils`, `Plan Saving & Validation`, `Booking & User Models`, `Plan Queries & Dashboard`, `Models & Reviews`, `Operator Profile & Stats`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `PlanModel` (e.g. with `.include()` and `._operatorBookings()`) actually correct?**
  _`PlanModel` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `UserModel` (e.g. with `.include()` and `._operatorBookings()`) actually correct?**
  _`UserModel` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `entry`, `ignoreDependencies` to the rest of the system?**
  _232 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Front-end App Views` be split into smaller, more focused modules?**
  _Cohesion score 0.054265159301130524 - nodes in this community are weakly interconnected._