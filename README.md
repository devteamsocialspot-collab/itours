# itours.mn

An integrated booking system for Mongolian travel agencies. Every trip plan states its own pros and
cons; after the trip, travellers rate each of those promises, and the plan's **Expectation Score** —
how closely trips matched what was promised — ranks the marketplace instead of ad spend.
Bachelor thesis project, National University of Mongolia. Two apps, one repo, no monorepo tooling:

| App | Stack | Port |
|---|---|---|
| `back-end/` | Node 24 · Express 5 · Apollo Server 5 · Sequelize 6 · Postgres 16 | 8080 |
| `front-end/` | Next.js 15 (App Router) · Apollo Client 3 · Tailwind 3 · shadcn-style UI | 3000 |

The only contract between them is the GraphQL schema (`back-end/src/graphql/schemas`).
The look is the Organic design system from the Claude Design handoff (`../project/_ds`), and the screens
follow the wireframe board in `../project/Nutag Marketplace.dc.html`.

## Run locally

```bash
# 1. Postgres (Docker) — or point .env.local at any Postgres 16+
cd back-end
cp .env.example .env.local          # edit credentials if needed; set JWT_TOKEN_SALT
docker compose --env-file .env.local up -d postgres

# 2. API
pnpm install
pnpm dev                            # http://localhost:8080/graphql  (nodemon + ts-node)

# 3. Web
cd ../front-end
cp .env.example .env.local
pnpm install
pnpm dev                            # http://localhost:3000
```

First boot seeds a `SUPER_ADMIN` from `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD` in `back-end/.env.local`
(defaults `99000000` / `admin123`). With `SEED_DEMO=true` an empty database also gets a demo marketplace:
5 agencies, 11 plans, 32 travellers, past trips with reviews (so the scores are real aggregates) and
next season's bookings — all from a fixed random seed, so every fresh database looks the same.
Demo logins use `SEED_DEMO_PASSWORD` (default `demo1234`); sign in with a phone number or an email:

| Login | Role |
|---|---|
| `elena@itours.mn` | traveller — two upcoming bookings, one finished trip still to rate, three saved plans |
| `bat@nomadica.mn` or `99112233` | agency staff — Nomadica Travel (verified) |
| `serik@altainomads.mn` or `99556677` | agency staff — Altai Nomads (awaiting verification) |
| `admin@itours.mn` | `MANAGER` — review queue, agencies, staff |

To start over: `docker compose --env-file .env.local down -v`, then up again.
The demo's bank-transfer holds are seeded 1–20 hours old and lapse 24 hours after booking, so their countdowns run from seed time: reseed shortly before a demo.
Without payment keys, QPay and card bookings are paid at once (simulated); see [Payments](#payments).

## The shape of the product

Three surfaces, one loop:

1. **Travellers** search plans ranked by Expectation Score, read each plan's honest summary, cons and
   day-by-day facts (drive hours, showers, toilets, signal) with the route drawn on a map of Mongolia,
   book a departure and pay (QPay or bank transfer from Mongolia, a card through Stripe from abroad — see
   [Payments](#payments)), and after the trip rate every
   promise the plan made.
2. **Travel agencies** write plans — the editor won't submit one without three pros, three cons, a
   drive time on every day, a price, a departure and photos — then confirm orders, assign guides and
   watch their numbers. A reworded promise starts its ratings over.
3. **Marketplace staff** verify agency licences, review submitted plans and watch agency health.

Money is held in escrow: the agency is paid the total less `COMMISSION_PERCENT` the day after the trip
ends. Prices are set in USD and shown in tögrög at `MNT_PER_USD`.

## Payments

Checkout offers two groups: **paying from Mongolia** (QPay, bank transfer) and **paying from abroad**
(a card through Stripe Checkout). QPay is preselected for a traveller whose country is Mongolia (or
empty while the site is in Mongolian), a card for everyone else.

Every booking starts `PENDING_PAYMENT` and holds its seats: 24 hours for a transfer, 30 minutes
(`ONLINE_HOLD_MINUTES`) for QPay and card. A hold that runs out shows as `EXPIRED`, frees its seats and
counts as nobody's sale or cancellation (`BookingController.live()` / `isExpired()` / `payBy()`).

| Method | With keys | Without keys |
|---|---|---|
| QPay | an invoice (amount in ₮ = `totalUsd × MNT_PER_USD`); the booking page shows the QR, the bank-app links and the short link, and asks QPay every 5 s (and on "Check payment") until paid ≥ invoiced | paid at once (simulated) |
| Card | a Stripe Checkout Session in USD; back on `/trips/<code>?session_id=…` the API retrieves the session and takes it only if `payment_status` is `paid` and its `metadata.bookingId` is this booking | paid at once (simulated) |
| Bank transfer | the agency presses "Transfer received" in its orders inbox | the same |

Nothing a browser or a callback says is believed: QPay's callback (`GET|POST /payments/qpay/callback?booking=<code>`)
only triggers a fresh `payment/check`, and Stripe's webhook (`POST /payments/stripe/webhook`,
`checkout.session.completed`) must carry a valid signature over the raw body. `BookingController.settle()`
takes a payment once, so the poll, the return page, the callback and the webhook can all report it.
Money that arrives after the hold is still taken while the seats are free; otherwise the booking stays
expired with the provider's reference stored and the API log asks for a refund by hand.

The API prints which providers are live at boot (`💳 payments: QPay … · Stripe …`). Env vars, all in
`back-end/.env.local` (see `.env.example`):

| Var | |
|---|---|
| `QPAY_USERNAME`, `QPAY_PASSWORD`, `QPAY_INVOICE_CODE` | merchant credentials from QPay; all three set = QPay is live |
| `QPAY_BASE_URL` | default `https://merchant-sandbox.qpay.mn`; production is `https://merchant.qpay.mn` |
| `QPAY_CALLBACK_URL` | public URL of `/payments/qpay/callback` (in dev QPay can't reach it; the page's polling covers it) |
| `STRIPE_SECRET_KEY` | `sk_test_…` = Stripe is live in test mode |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…`; without it the webhook answers 404 and the return page alone confirms |
| `SITE_URL` | the front-end's origin for Stripe's return pages (default `http://localhost:3000`) |

**Testing Stripe locally.** Put a test key in `.env.local`, then forward webhooks with the
[Stripe CLI](https://docs.stripe.com/stripe-cli) and copy the `whsec_…` it prints into `STRIPE_WEBHOOK_SECRET`:

```bash
stripe login
stripe listen --forward-to localhost:8080/payments/stripe/webhook
stripe trigger checkout.session.completed   # optional: a signed test event (no booking, so it is ignored)
```

Pay with card `4242 4242 4242 4242`, any future date, any CVC. **QPay** has no public test
credentials; ask QPay for sandbox ones. Checks: `npx ts-node src/controllers/payment/payment.controller.check.ts`
(providers faked) and the booking check (holds per method, idempotent settle).

Not done yet: refunds are not automatic — a cancelled paid booking, or a payment that lands after its seats
were resold, is refunded by hand (Stripe dashboard / QPay `payment/refund`).

## Routes

| Route | Who | What |
|---|---|---|
| `/` | anyone | Landing: the promise, a search, the three best-matched plans. Server-rendered. |
| `/search` | anyone | Results with the filter rail; every filter is a query parameter. Server-rendered. |
| `/plans/<slug>` | anyone | A plan: promises with how often they held, route, days, reviews, booking card. Drafts open for their agency and staff only. |
| `/operators`, `/operators/<slug>` | anyone | Verified agencies and their public profiles. |
| `/checkout/<slug>` | `USER` | Payment method, notes for the agency, "I've read the cons". |
| `/trips`, `/trips/<code>` | `USER` | My bookings (cancel, rate) and the confirmation / voucher. |
| `/compare` | `USER` | Saved plans side by side. |
| `/partner` | `OPERATOR` | Overview, `/plans` (+ editor), `/orders`, `/profile`. |
| `/admin/review` | staff | Marketplace numbers and the plan review queue; `/admin/operators` health and verification; `/admin/users` staff accounts. |
| `/login`, `/register` | anyone | Phone or email + password; register as a traveller or as an agency. |
| `GET /export/orders` | `OPERATOR` | API: the agency's orders as CSV. |
| `POST /upload` | signed in | API: image upload to S3-compatible storage; 404s while `SPACE_*` is unset (the editor also takes image links). |
| `POST /payments/stripe/webhook`, `GET\|POST /payments/qpay/callback` | the providers | API: payment confirmations, re-checked with the provider; 404 while that provider is simulated. |

## Roles

`SUPER_ADMIN` — staff, everything (passes every `@auth` check).
`MANAGER` — staff: review queue, agencies, staff accounts.
`OPERATOR` — one agency's plans, orders and profile; created by signing up with a company name.
`USER` — a traveller.

## Scripts

| back-end | front-end |
|---|---|
| `pnpm dev` — copies `.env.local` to `.env`, then nodemon + ts-node | `pnpm dev` — next dev on `PORT` from `.env` / `.env.local` |
| `pnpm typecheck` — tsc --noEmit | `pnpm typecheck` — tsc --noEmit |
| `pnpm build` — tsc → `dist/` | `pnpm build` — next build |
| `pnpm start` — node dist/index.js | `pnpm start` — next start |
| `npx ts-node src/controllers/plan/plan.controller.check.ts` — score math | `pnpm lint` — next lint |
| `npx ts-node src/controllers/booking/booking.controller.check.ts` — seat race, prices, payout, holds per method (dev DB) | |
| `npx ts-node src/controllers/payment/payment.controller.check.ts` — QPay / Stripe paths, providers faked | |

## Layout

```
back-end
├── index.ts                 boot: express → REST routes → db + apollo → seed → /graphql → listen → shutdown hooks
└── src
    ├── config/              index.ts = the only place process.env is read; database.ts = Sequelize + MIGRATIONS;
    │                        digital-ocean-space.ts = S3 client, off (404) while SPACE_* is empty
    ├── models/<domain>/     one Sequelize model per file (camelCase columns, UUID PKs); database.ts = setupModel()
    │                        user/, operator/, plan/ (plan, days, claims, departures, saved), booking/ (booking, review, claim ratings)
    ├── types/               TX / TXCreate / TXUpdate per domain; common.type.ts (context, pagination); user/role.type.ts
    ├── graphql/schemas/     `#graphql` per entity; global.schema.ts (directives, Date, roots); enum.schema.ts (all enums)
    ├── graphql/resolvers/   thin: controller call → { success, message, … } envelope; type resolvers for derived fields
    ├── controllers/<domain> `export default class`, static methods; DB access + validation, throws dictionary keys;
    │                        plan.controller.ts holds the Expectation Score and the publish checklist,
    │                        booking.controller.ts the seat lock, prices, holds, stages and payouts;
    │                        payment.controller.ts QPay (fetch) and Stripe Checkout
    ├── middleware/          auth.middleware.ts: @auth(permissions) / @authLogin schema transformers
    ├── route/               REST: /health, /upload, /export/orders, /payments/* (QPay callback, Stripe webhook)
    ├── utils/               pagination, login parsing, envelope helpers; i18n/ = t(), pickLocale(), en/mn dictionaries
    └── seeds/               admin (every boot) and the demo marketplace (empty database only)

front-end
├── app/page.tsx, search, plans/[slug], operators   public pages: server-rendered through lib/api.ts serverQuery
├── app/checkout, trips, compare                    traveller pages (Apollo, client)
├── app/(auth)/login, register                      phone or email + password → POST /api/auth/* → session cookie
├── app/(dashboard)/partner, admin                  back office, each wrapped in the dark Sidebar + RoleGuard
├── app/api/auth/                                   login / register (proxy the mutation, set the cookie) / logout
├── middleware.ts                                   guards /partner, /admin, /trips, /compare, /checkout
├── components/ui                                   shadcn-style primitives (copied in, not a dependency)
├── components/app                                  product components by feature (*-view.tsx = one screen)
└── lib                                             apollo/, i18n/ (LocaleProvider, useT, mn + en), <domain>/queries.ts, types.ts, utils.ts
```

## Conventions (short version)

- Every GraphQL field returns `{ success, message, …payload }`; the FE never reads GraphQL `errors`.
- camelCase everywhere: DB columns, models, GraphQL and FE share field names, so resolvers return rows as they are.
- All user-facing strings go through `t()` (back-end) / `useT()` (front-end); locale travels as `x-locale`
  and lives in the `itr_locale` cookie, which the server pages read too.
- Plan content is bilingual in the data (`titleEn` / `titleMn`, `summary` / `summaryMn`): Mongolian when chosen and written.
- The route map (`components/app/plan/route-map.tsx`) is an inline SVG: each day's `place` is looked up in the
  gazetteer in `lib/plan/places.ts` (approximate coordinates, plus the border from Natural Earth 1:50m). A place
  that isn't there is left off the map and flagged in the editor — add it to `PLACES`.
- Optional integrations are enabled by the presence of their env vars and degrade to no-ops.
