# itours.mn: UX/UI refactor spec

**Date:** 2026-11-20
**Based on:** the code in `front-end/` (Next 15, Apollo, Tailwind), the UI section of the thesis (`thesis/ch3.tex` §"Хэрэглэгчийн интерфейсийн зохиомж") and the screenshots `thesis/scr-*`. The screenshots are used for layout only: they show the old sand/copper palette, and the search pill has since moved from the header into the results column.
**Not done:** the app was not run because Docker is down. Contrast ratios below are computed from the CSS tokens, not measured in a browser.

## How to read this

- There are 23 items: **P1** = must (8), **P2** = should (13), **P3** = nice (2). The IDs are stable, so you can quote them in commits.
- Paths are relative to `itours/front-end/` unless they start with `back-end/`.
- **H1–H10** are Nielsen's ten heuristics: H1 Visibility of system status · H2 Match with the real world · H3 User control and freedom · H4 Consistency and standards · H5 Error prevention · H6 Recognition rather than recall · H7 Flexibility and efficiency · H8 Minimalist design · H9 Error recovery · H10 Help and documentation. **WCAG** means 2.2, level AA.
- Suggested order: P1-3 and P1-4 first. They are global CSS, so the visual checks for everything else depend on them. Then P1-1 together with its back-end part, then the rest of P1, then P2.

## Ground rules for every item

### Palette (unchanged). Use only existing tokens

| Meaning | Use |
|---|---|
| Brand, header, links, primary buttons | `--color-accent` #005B94, `.btn-primary` |
| Book / Pay | `.btn-cta`: gold #D4A359 with ink text, ≈6.5:1, which passes |
| Warning, cons, scores under 80 | text in `--color-cta-800`, fills in `--color-cta-700`, tints via `.tag-accent`, `.panel-clay`, `.error` |
| Good, eco, difficulty, scores of 80 and up | `--color-accent-2-500/600/800`, `.tag-accent-2`, `.panel-sage` |
| Sections and cards on the white page | `--color-surface` #F7F4EF |
| Text | `--color-text` #222831 |

Don't use the blue ramp (`--color-accent-700/800`) for warnings. It was the copper ramp before the palette change, and nine places still use it that way (see P2-1).

### Bilingual strings

- Put every new string in `lib/i18n/locales/mn.ts` **and** `en.ts` under the same key. `mn.ts` defines the shape and `en` is typed `typeof mn`. So add the key to `mn.ts` first, and `pnpm typecheck` will fail until `en.ts` has it too.
- Read strings with `useT()`. If a key is missing, `translate()` falls back to English and then to the key itself. A raw key such as `trip.payBy` showing on screen therefore means a string is missing.
- For plan content, always use `pick(locale, en, mn)` from `lib/utils.ts`, never `titleEn` alone. This is the thesis rule: show the Mongolian text if it exists, otherwise the English.
- Toasts after a mutation come from the server (`back-end/src/utils/i18n/locales/{en,mn}.ts`, chosen through `x-locale`). New server errors go there.
- In Mongolian, don't attach a case suffix straight to a `{placeholder}` that holds a number, date, amount or code. Vowel harmony depends on how the value is read aloud. Write `Хугацаа: {time}`, not `{time}-аас`. The existing `{op}-д` (a company name) and ordinal `{n}-р` are fine. All strings in this spec follow this rule.

### No new dependencies

Everything below uses what is already installed:

- **Dialogs:** `components/ui/dialog.tsx` (Radix). Follow the pattern in `components/app/admin/operator-form-dialog.tsx`.
- **Toasts and undo:** `sonner`.
- **Icons:** `lucide-react`. `Clock`, `X`, `Star`, `CircleAlert` and `Copy` all exist in the installed version.
- **Countdown:** `setInterval`.
- **Time zones:** `Intl.DateTimeFormat`.
- **Text for screen readers only:** Tailwind's built-in `sr-only`, already used in `components/ui/dialog.tsx`.

### How to check each item

- Run `pnpm typecheck && pnpm lint`.
- Walk through the screen using only the keyboard.
- Look at it in Chrome DevTools at 360×740 and at 1280×800.
- Run Lighthouse's accessibility audit, or the axe DevTools browser extension. That is a browser tool, not a package.
- Switch between МН and EN.

## Summary

| ID | Screen | Change |
|---|---|---|
| P1-1 | Checkout, trip page, My trips, orders inbox | Bank-transfer hold: deadline, countdown, expired state, bilingual copy |
| P1-2 | Checkout | Never swap the departure silently; consistent escrow wording; cons as a list |
| P1-3 | All | Visible focus on blue and dark surfaces and in the search pill; focus never hidden behind sticky bars |
| P1-4 | All | Raise secondary-text contrast to 4.5:1 (token change only) |
| P1-5 | Editor, checkout, orders, search, profile, admin | Programmatic labels and fieldsets |
| P1-6 | My trips → review form | Accessible stars, pros and cons grouped, inline "still to rate" list |
| P1-7 | My trips, orders inbox | Confirmation dialogs that state the refund or consequence |
| P1-8 | Orders inbox | Rows usable by keyboard; detail panel announced |
| P2-1 | Cards, compare, dashboard, editor, plan page | One threshold rule for scores; gold, not blue, for warnings |
| P2-2 | Plan page | "How is this scored?"; cons show their rating; breakdown placed for phones |
| P2-3 | Search | Chips for every active filter (including the hidden "days"), count announced, "Show N plans" on phones |
| P2-4 | Plan page booking card | Stepper names and limits; "Show N more dates" |
| P2-5 | Compare | Plan titles, a cons row, row headers, best/worst not by colour alone, sticky label column |
| P2-6 | Trip page | Title per stage; cancelled explained; loading and not-found states |
| P2-7 | Plan editor | Tabs flag publish blockers; checklist jumps to the tab; proper tab semantics |
| P2-8 | Plan editor | Unsaved-changes guard; undo on remove |
| P2-9 | Admin review queue | Review cons and drive times in place; say why Approve is blocked; a fix note is required |
| P2-10 | Orders inbox | One currency in the Value column; translated method; phone layout |
| P2-11 | Back office, shared | Bilingual gaps: titles, aria-labels, units |
| P2-12 | Editor, landing | 24×24 px targets (WCAG 2.5.8) |
| P2-13 | Plan page, header, checkout | Phone fixes: Save, menu, book bar, step indicator |
| P3-1 | Operator dashboard | Make "needs attention" a link; text alternative for the chart |
| P3-2 | Search, plan page | Guests can see Save and sign in to use it |

---

## P1: must

### P1-1 Bank-transfer hold: deadline, countdown, expired state

**Where:** `/checkout/[slug]` (bank option), `/trips/[code]`, `/trips`, `/partner/orders`

**Problem:**
- A bank-transfer booking (`PENDING_PAYMENT`) never shows a deadline:
  - The trip page says "within 24 hours" (`trip.heldLead`) but not until when.
  - The inbox tag says only "Transfer pending" (`orders-view.tsx:114`).
  - Neither side can see how much time is left. → H1.
- The held state looks like a finished booking:
  - It uses the success check icon (`trip-view.tsx:54–56`).
  - The bank details sit in the green `.ok-msg` success box (`:69–73`).
  - A payment still owed reads as done. → H2; H4 (in this palette gold means "warning").
- "Print voucher" is offered for a booking that hasn't been paid (`trip-view.tsx:131–134`).
- The submit button reads "Pay $X and confirm seats" even for a bank transfer, when nothing is paid at that moment (`checkout-view.tsx:158–160`). → H2.
- WCAG 2.2.1 Timing Adjustable is met through its 20-hour exception, because 24 h is more than 20 h. But that only holds if the deadline is shown up front.

**What the UI needs from the back-end** (the developer adds the expiry):
- `Booking.payBy: String`
  - An ISO 8601 instant: `createdAt` + 24 h.
  - Set while the booking is `PENDING_PAYMENT`, and kept after it expires. `null` otherwise.
  - Add it to `back-end/src/graphql/schemas/booking/booking.schema.ts`, the `BookingFields` fragment (`lib/booking/queries.ts`) and `Booking` (`lib/types.ts`).
- A way to tell an expired hold from a cancellation:
  - `stage: "EXPIRED"`: add it to `BookingStage` (`lib/types.ts`) and to `BookingController.stage()`.
  - `canCancel: false` and `cancelledBy: null`.
  - List expired holds under the `CANCELLED` inbox tab (`TAB_STAGES`, `back-end/src/controllers/booking/booking.controller.ts:30–35`).
- `markOrderPaid` on an expired hold returns a translated error. Add the new key to the back-end locales; the existing `useReport` toast shows it.

**Change:**

1. **Helpers**
   - `lib/utils.ts`: add `dateTime(iso, locale)`. It always uses `Asia/Ulaanbaatar`.
     - en: "Thu 21 Nov, 14:30" (`en-GB`, short weekday, day, short month, 24 h).
     - mn: "2026.11.21 14:30" (same order as the existing `day()`).
   - Also add `timeLeft(iso, now)`, which returns `{ h, m, over }`. Round minutes up, so "0 min" never shows while time remains.
   - New file `lib/hooks/use-now.ts`: `useNow(60_000)` returns `Date.now()`, refreshed once a minute. Minutes are enough; a per-second ticker only adds motion.
   - Show the remaining time with `common.hmLeft` / `common.mLeft`.
2. **Trip page** (`components/app/trips/trip-view.tsx`)
   - Decide the state from `booking.stage`, not `status`, as `trips-view.tsx` already does.
   - **Held:**
     - Icon: `Clock` on `var(--color-cta-700)`. Title: `trip.heldTitle` (unchanged). Lead text: `trip.heldLead` (new wording).
     - Replace the `.ok-msg` with a `.panel-clay` "pay by" panel. Its first line holds:
       - the label `trip.payBy`;
       - `dateTime(payBy)` in `.heading` at 20px;
       - then, in `.small`: "· {left}" and `trip.ubTime`.
     - Below that, a `.sum-lines` list with Bank, Account no., Recipient, Amount and Payment reference:
       - Amount: `mnt(totalUsd)`, with `usd()` muted next to it.
       - Payment reference: `booking.code`.
       - Each value gets a `btn btn-ghost btn-xs` Copy button using `navigator.clipboard.writeText`, as in `operator-form-dialog.tsx:93`. The label switches to `common.copied` for 2 s.
       - The amount copies as digits only (`8260000`); the account number copies without spaces.
     - In "What happens next", step 1 becomes `trip.nextPay` (the deadline), followed by `next2`–`next4`.
     - Hide "Print voucher".
   - **Refresh at the deadline:** when `timeLeft().over` turns true on an open page, call `refetch()` once. `app/trips/[code]/page.tsx` passes its query's `refetch` to `TripView`.
   - **Screen readers:**
     - Put the icon, title and lead text inside `role="status"`, so the switch to expired is announced once.
     - Keep the minute countdown outside that region, so it isn't read out every minute.
   - **Expired:**
     - Icon: `X` on `var(--color-neutral-500)`. Title: `trip.expiredTitle`. Lead text: `trip.expiredLead`.
     - Main action: `trip.bookAgain` as `.btn-cta`, linking to `/plans/{slug}`. Second action: a `nav.search` link.
     - No bank panel, no "What happens next", no voucher.
3. **My trips** (`components/app/trips/trips-view.tsx`)
   - `STAGE_TAG` gets `EXPIRED: "tag-neutral"`. `PENDING_PAYMENT` keeps the gold `tag-accent`.
   - For a held booking, add `trips.payBy` under the meta line, in `.small` with `color: var(--color-cta-800)`.
   - For an expired booking, add a `trip.bookAgain` link (`btn btn-secondary btn-xs`) next to "View booking". No Cancel button.
4. **Orders inbox** (`components/app/partner/orders-view.tsx`)
   - `statusTag`:
     - `PENDING_PAYMENT` → `.tag-accent` with `orders.pendingLeft` ("Transfer pending · 4 h 10 min left").
     - `EXPIRED` → `.tag-neutral` with `orders.expired`.
   - **Detail panel, held:**
     - Add a `.sum-lines` row: `orders.payBy` → `dateTime(payBy)` plus the time left, the value in `--color-cta-800`.
     - "Transfer received" stays, behind the confirmation dialog from P1-7.
   - **Detail panel, expired:** show `orders.expiredNote` as `.small muted`, and no action buttons except Email.
   - **Refresh:** use one `useNow()` in `OrdersView`. When any pending order on screen passes its `payBy`, call `refetch()` once (guard it with a ref), so the row moves to its new tab. The sidebar count already polls every 60 s.
5. **Checkout** (`components/app/checkout/checkout-view.tsx`)
   - When `method === "BANK"`, the submit label is `book.holdSeats`.
   - `book.BANKSub` gets its new wording.
   - Remove `trip.bankDetails` once its parts are split into the keys below.

**Strings** (new unless marked *changed*):

| Key | en | mn |
|---|---|---|
| common.hmLeft | {h} h {m} min left | {h} цаг {m} мин үлдсэн |
| common.mLeft | {m} min left | {m} мин үлдсэн |
| common.copy | Copy | Хуулах |
| common.copied | Copied | Хуулагдлаа |
| trip.payBy | Pay by | Төлөх эцсийн хугацаа |
| trip.ubTime | Ulaanbaatar time | Улаанбаатарын цагаар |
| trip.heldLead *changed* | Transfer {p} by {time} (Ulaanbaatar time) and use order {code} as the payment reference. If the money hasn't arrived by then, the seats go back on sale. | Суудлаа хадгалуулахын тулд {p} шилжүүлнэ үү. Эцсийн хугацаа: {time} (Улаанбаатарын цагаар). Гүйлгээний утгад {code} гэж бичнэ. Хугацаандаа мөнгө орохгүй бол суудал дахин худалдаанд гарна. |
| trip.bank · trip.bankName | Bank · Khan Bank | Банк · Хаан банк |
| trip.account · trip.bankAccount | Account no. · 5000 123 456 | Дансны дугаар · 5000 123 456 |
| trip.recipient · trip.bankRecipient | Recipient · iTours Escrow LLC | Хүлээн авагч · Ай Турс Эскроу ХХК |
| trip.amount | Amount | Дүн |
| trip.reference | Payment reference | Гүйлгээний утга |
| trip.nextPay | {time} — transfer deadline. Your seats are confirmed once the money arrives. | {time} — шилжүүлэх эцсийн хугацаа. Мөнгө орсны дараа суудал баталгаажна. |
| trip.expiredTitle | This hold has expired. | Суудлын түр хадгалалтын хугацаа дууссан. |
| trip.expiredLead | {p} hadn't arrived by {time} (Ulaanbaatar time), so the seats went back on sale. If you've already sent the money, keep the bank receipt and have order {code} ready. | Эцсийн хугацаанд ({time}, Улаанбаатарын цагаар) {p} орж ирээгүй тул суудлыг дахин худалдаанд гаргалаа. Хэрэв мөнгөө шилжүүлсэн бол банкны баримтаа хадгалж, захиалгын дугаараа ({code}) бэлэн байлгана уу. |
| trip.bookAgain | Book again | Дахин захиалах |
| trips.stage.EXPIRED | Hold expired | Хугацаа дууссан |
| trips.payBy | Pay by {time} · {left} | Төлөх хугацаа: {time} · {left} |
| orders.pendingLeft | Transfer pending · {left} | Шилжүүлэг хүлээж буй · {left} |
| orders.payBy | Pay by | Төлөх хугацаа |
| orders.expired | Hold expired · unpaid | Хугацаа дууссан · төлөгдөөгүй |
| orders.expiredNote | Not paid by {time} (Ulaanbaatar time). The seats went back on sale automatically. | {time} (Улаанбаатарын цагаар) гэхэд төлөгдөөгүй тул суудал автоматаар дахин худалдаанд гарсан. |
| book.BANKSub *changed* | We hold your seats for 24 hours. If the transfer hasn't arrived by then, they go back on sale. | Суудлыг 24 цаг хадгална. Энэ хугацаанд шилжүүлэг орохгүй бол суудал дахин худалдаанд гарна. |
| book.holdSeats | Hold my seats for 24 h | Суудлаа 24 цаг хадгалуулах |

**Open question for the product owner:** the code doesn't say what happens to a transfer that arrives after the hold expires. The copy above promises nothing. Don't add refund wording until that is decided.

**Done when:**
- [ ] **Checkout:** with Bank transfer selected, the button reads "Hold my seats for 24 h".
- [ ] **Trip page after a bank booking:**
  - [ ] `/trips/{code}` shows the gold pay-by panel with the time in Ulaanbaatar time, labelled as such.
  - [ ] The remaining time drops by one minute within 60 s.
  - [ ] Each bank line copies its value; the amount pastes as digits only.
  - [ ] There is no check icon, no green box and no "Print voucher".
- [ ] **Expiry test:** with `payBy` set 2 minutes ahead in the database, the open trip page switches to the expired state without a reload. A screen reader announces the new title once.
- [ ] **My trips:**
  - [ ] A held booking shows "Pay by … · … left" in gold-800.
  - [ ] An expired one shows the grey "Hold expired" tag and "Book again".
- [ ] **Orders inbox:**
  - [ ] A held row reads "Transfer pending · N h M min left".
  - [ ] After expiry, the order is under Cancelled as "Hold expired · unpaid", with no "Transfer received" button.
- [ ] **Both languages:** everything above works in МН and EN with no raw keys showing.
- [ ] **Time zone:** with the computer clock set to UTC+1, the deadline still shows Ulaanbaatar time and is labelled as such.

### P1-2 Checkout must not change the purchase without saying so

**Where:** `/checkout/[slug]`, in `components/app/checkout/checkout-view.tsx`

**Problem:**
- **Silent departure swap.** Suppose the chosen departure is gone, for example it sold out between the plan page and checkout. Line 32 then quietly swaps in `nextDeparture(plan)`. The traveller can pay for different dates without being told. → H1, H5; WCAG 3.3.4 Error Prevention (Legal, Financial, Data), which requires financial submissions to be checked or confirmed.
- **Contradictory escrow wording.** Three places describe when the money is released:
  - the checkout lead text says money is held "until your trip departs" (`book.payLead`);
  - the order summary says "released … the day after the trip ends" (`book.escrowNote`);
  - the plan page says "released to the operator after the trip ends" (`plan.cancelPolicy`).
  The escrow promise is the product's argument for trust, and the copy contradicts itself. → H4.
- **Unreadable trade-offs.** The cons the traveller must accept are one lowercased run-on sentence (`:141–146`). `c.text.toLowerCase()` also breaks proper nouns such as "Khongor". Knowing these downsides is the basis of the Expectation Score. → H8.
- **Pay button stays active for the wrong account type.** Operators and staff see "Bookings are made from a traveller account" (`:88`), but the pay button still works.

**Change:**
- Fall back to `nextDeparture` only when `depId` is empty.
- If `depId` is set but that departure is missing, or `left < pax`:
  - show a `.error role="alert"` at the top of the form with `book.depGone`;
  - add a `btn btn-secondary btn-sm` link, `book.chooseDate`, to `/plans/{slug}?pax={pax}#book`;
  - disable the submit button.
- `book.payLead`: use the new wording and pass `{op}` (`plan.operator.name`).
- Render the cons inside the `.panel-clay` as one line each: `consOf(plan).map((c) => <Con key={c.id}>{c.text}</Con>)` under `book.confirmRead`. `Con` is the existing component in `components/app/ui.tsx`. Keep the checkbox.
- Disable the submit button when `user && user.role !== "USER"`.

| Key | en | mn |
|---|---|---|
| book.payLead *changed* | itours holds your payment and pays {op} the day after your trip ends. Cancel free until {d} for a full refund. | Төлбөрийг itours хадгалж, аялал дууссаны маргааш {op}-д шилжүүлнэ. {d} хүртэл үнэгүй цуцалбал бүрэн буцаан олгоно. |
| book.depGone | The departure you picked no longer has {n} free seats. Choose another date before you pay. | Таны сонгосон гаралтад {n} сул суудал үлдээгүй байна. Төлөхөөсөө өмнө өөр огноо сонгоно уу. |
| book.chooseDate | Choose another date | Өөр огноо сонгох |

**Done when:**
- [ ] **Full departure:** `/checkout/{slug}?dep=<id of a full departure>&pax=2` shows:
  - [ ] the alert;
  - [ ] a disabled pay button;
  - [ ] a working "Choose another date" link;
  - [ ] no other date in the summary posing as the chosen one.
- [ ] **No departure given:** `/checkout/{slug}` without `dep` still preselects the next departure.
- [ ] **Escrow wording:** the checkout lead text, the summary note and the plan-page policy all say the operator is paid the day after the trip ends, in both languages.
- [ ] **Cons:** shown one per line, with the gold alert icon and their original capitalisation.
- [ ] **Operator account:** signed in as an operator, the pay button is disabled.

### P1-3 Focus is visible everywhere

**Where:** every screen. It's worst on the blue bars (`.site-bar`, `.topbar`), the dark back office (`.side`, `.topbar-dark`) and the search pill.

**Problem:**
- **Blue ring on blue bars.** `:focus-visible` draws a 2px `--color-accent` (#005B94) ring (`globals.css:168`).
  - On the brand-blue header that is blue on blue (1:1), so keyboard users lose track of focus on every header link and button.
  - On the #222831 sidebar the ring is ≈2:1.
  - → WCAG 2.4.7 Focus Visible; 1.4.11 Non-text Contrast, which needs 3:1.
- **No ring in the search pill.** `.search-pill input:focus-visible { outline: none }` (`:498`) removes the ring and nothing replaces it. The search on the results page has no focus indicator at all. → 2.4.7.
- **Focus can be covered.** The sticky header and the fixed `.mobile-bookbar` can cover the element that has focus; only anchor targets get `scroll-margin-top`. → WCAG 2.2 criterion 2.4.11 Focus Not Obscured (Minimum).

**Change** (`app/globals.css`, in the base layer):

```css
/* white ring on blue and dark surfaces; white boxes inside them keep the blue ring */
:is(.site-bar, .topbar, .topbar-dark, .side, footer.site, .hx-in, .hx-foot) :focus-visible { outline-color: #fff; }
:is(.hx-search, .menu-pop) :focus-visible { outline-color: var(--color-accent); }
.search-pill:focus-within { outline: 2px solid var(--color-accent); outline-offset: 2px; }
/* the sticky bar and the phone's book bar must not cover the focused element */
html { scroll-padding-top: 84px; }
@media (max-width: 900px) { html:has(.mobile-bookbar) { scroll-padding-bottom: 104px; } }
```

**Done when:**
- [ ] **Header:** tabbing through it on `/search`, `/plans/{slug}` and `/checkout/{slug}` shows a white ring on every link and button.
- [ ] **Sidebar:** tabbing through the `/partner` sidebar shows a white ring on every item, including the active blue one.
- [ ] **Search pill:** tabbing into the results-page search shows a blue ring around the pill.
- [ ] **Plan page on a phone:** at 360×740, tabbing through all days and links never leaves the focused element under the header or the book bar.
- [ ] **Hero search:** its fields still show the blue ring.

### P1-4 Contrast of secondary text

**Problem:** the ratios below are computed from the tokens. → WCAG 1.4.3 Contrast (Minimum); 1.4.11 Non-text Contrast.

| Where | Colour | Ratio | Needs |
|---|---|---|---|
| `.muted`, `--ink-55`: 92 `.muted` uses plus inline styles | ink at 55% on white / on #F7F4EF | ≈3.5:1 / ≈3.4:1 | 4.5:1 |
| `--ink-60`: `.score-label`, `.stat-label`, inline styles | ink at 60% on white | ≈4.1:1 | 4.5:1 |
| `--muted-foreground` (#777A7D), used by the shadcn components | on white | ≈4.3:1 | 4.5:1 |
| `.site-links a[aria-current]` and `:hover` (`globals.css:388`) | gold on brand blue | ≈3.1:1 | 4.5:1 |
| Header `--ink-45`, e.g. checkout step 3 | white at 55% on blue | ≈3.3:1 | 4.5:1 |
| `.side .count`, `.footer-note`, `footer.site .kicker` | cream/white at 45% on #222831 | ≈3.9:1 | 4.5:1 |
| `.x-btn` icon buttons (`--ink-45`) | ink at 45% on white | ≈2.6:1 | 3:1 |

Most of this text is 11–13px and carries real information: ₮ prices, seats left, dates, order codes.

**Change** (`app/globals.css` only). The token names stay, so the ~115 places that use them need no edits; mark the change with a `ponytail:` comment.
- `:root` tokens (`:329–336`):
  - `--ink-45: rgba(34,40,49,.6)`
  - `--ink-55: rgba(34,40,49,.72)` and `--ink-60: rgba(34,40,49,.72)`. That gives ≈5.6:1 on #F7F4EF.
- `.text-muted` and `figcaption` (55%), `.card-meta` (50%) and `.table th` (60%) → 72%.
- `--muted-foreground: 89 93 98`. This is `--color-neutral-700`, ≈6.6:1.
- Header override block (`:392–396`): `--ink-45: rgba(255,255,255,.8)`, ≈5.2:1 on the blue.
- `.site-links a:hover, .site-links a[aria-current]`: `color: #fff; text-decoration: underline 2px var(--color-cta); text-underline-offset: 6px`. Gold remains the indicator. Against blue it's ≈3.1:1, which passes 1.4.11 for a non-text indicator.
- Raise these to opacity .7:
  - `.side .count`;
  - the sidebar company sub-line (inline `rgba(247,244,239,.5)` in `components/app/sidebar/sidebar.tsx`);
  - `.footer-note`;
  - `footer.site .kicker`.

The palette is unchanged: these are only stronger opacities of the same colours.

**Done when:**
- [ ] **Audit:** Lighthouse or axe finds no `color-contrast` failures on `/`, `/search`, `/plans/{slug}`, `/checkout/{slug}`, `/trips`, `/partner`, `/partner/orders` or `/admin/review`, in both languages.
- [ ] **Header:** the active link is white with a gold underline.
- [ ] **Visual check:** secondary text still reads lighter than body text.

### P1-5 Labels and groups that assistive tech can read

**Problem:**
- **Labels not connected to their fields.** Eighteen `<label>` elements have no `htmlFor` and don't wrap a control, so the control has no accessible name and clicking the label does nothing:
  - `Field` in `plan-editor.tsx:96–101`, which covers about 25 editor fields;
  - the card fields in `checkout-view.tsx:115–128`;
  - guide and driver in `orders-view.tsx:333–338`;
  - departure and travellers in `booking-widget.tsx:49, 78`;
  - all 8 in `components/app/partner/profile-form.tsx`;
  - "Overall rating" in `trips-view.tsx:60`.
- **Inputs labelled only by a placeholder:**
  - the orders search (`orders-view.tsx:144`) and the admin fix note (`review-queue-view.tsx:70`);
  - in the editor: the day title, the claim text and detail, each departure's date and seats, and the photo URL.
- **Option groups without a group name.** Radio and checkbox groups are titled with `<div className="kicker">` (`search-view.tsx:82–176`). A screen reader hears "Any, radio button" twice (region and difficulty) with no group name.

→ WCAG 1.3.1 Info and Relationships; 4.1.2 Name, Role, Value; 3.3.2 Labels or Instructions; H6. `components/app/auth-card.tsx` already pairs `htmlFor` and `id` correctly; follow that.

**Change:**
- **`Field`** (plan-editor.tsx):
  - Add an `id` prop, rendered as `<label htmlFor={id}>`. Callers pass ids such as `ed-titleEn` or `ed-day-${i}-place`.
  - Add a `group` prop that renders `<fieldset className="field"><legend>` for fields with several controls: group size, difficulty, sleeping types, route length.
  - The two number inputs inside these get an `aria-label`: min/max, and km/%.
- **CSS:** add `fieldset.field { border: 0; padding: 0; margin: 0; min-width: 0 }`, and extend `.field > label` (`globals.css:206`) to `.field > label, .field > legend`.
- **Search filters:** turn each rail `<section>` into a `<fieldset>` with `<legend className="kicker">`, using the same reset inside `.filter-rail`.
- **Booking widget:**
  - Put the departure options in a `<fieldset>` with a `<legend>`.
  - Give the stepper `role="group"` plus `aria-labelledby` pointing at the Travellers label.
- **Review form stars:** see P1-6.
- **Checkout card fields, guide and driver, profile form:** add `id` and `htmlFor`.
- **Placeholder-only inputs:** give each an `aria-label` from an existing string:
  - `orders.search`, `editor.dayTitlePh`, `editor.detailPh`, `editor.startDate`, `editor.seats`, `editor.photoUrl`;
  - the admin fix note gets a visible label instead (P2-9);
  - claim text: ``aria-label={`${t("editor.pros")} ${n}`}``, and the same with `editor.cons` for cons.

**Done when:**
- [ ] **Audit:** axe or Lighthouse reports no label issues on:
  - [ ] `/partner/plans/{id}` (every tab);
  - [ ] `/checkout/{slug}`;
  - [ ] `/partner/orders`;
  - [ ] `/partner/profile`;
  - [ ] `/trips` (with the review form open);
  - [ ] `/search`;
  - [ ] `/admin/review`.
- [ ] **Labels:** clicking any visible field label puts focus in its field.
- [ ] **Search filters:** a screen reader reads them as e.g. "Difficulty, group. Any, radio button, 1 of 4".

### P1-6 Review form, where the Expectation Score comes from

**Where:** `/trips` → "Rate this trip". That is `ReviewForm` in `components/app/trips/trips-view.tsx:15–79`, plus `components/app/review-card.tsx:37`.

**Problem:**
- **Stars are glyphs only.**
  - The star options are only "★★★★★" glyphs (`:65`). A screen reader says "black star" again and again, and the gold glyphs reach only ≈2.3:1 on white.
  - "Overall rating" is a label that labels nothing (`:60`).
  - `ReviewCard` uses the same glyph-only stars.
  - → WCAG 1.1.1 Non-text Content, 1.3.1, 4.1.2, 1.4.11.
- **Pros and cons are mixed.**
  - They form one list, told apart only by "✓ " and "⚠ " text prefixes (`:40`).
  - For a downside it's unclear what "As described" or "Not as described" means: was it worse, or milder?
  - → H2, H6.
- **Missed lines aren't explained.**
  - A missed line is caught only by the browser's own `required` bubble on the first missing radio button.
  - Nothing shows how many lines are left.
  - → H1, H9.

**Change:**
- **Two blocks with `h4` headings:**
  - pros under `trips.promisesTitle`;
  - cons under `trips.downsidesTitle`, with the hint `trips.downsidesHint` in `.small` under the heading.
- **Icons instead of glyphs:** drop the glyph prefixes. Each block's heading row carries the `Check` or `CircleAlert` icon (`aria-hidden`), as on the plan page. Keep the 2/1/0 options and their labels.
- **Stars:**
  - Wrap them in `<fieldset><legend>{t("trips.overall")}</legend>`.
  - Each option shows its number and one icon: `{value} <Star size={12} fill="currentColor" aria-hidden style={{ color: "var(--color-cta)" }} />`, followed by `<span className="sr-only">{t("trips.starsN", { n: value })}</span>`. The `Stars` component in `ui.tsx` already pairs number and icon this way.
- **Progress:** next to the submit button, show `trips.ratedN` in `.small`.
- **Missing lines:**
  - Add `noValidate` to the form.
  - If lines are missing on submit, show a `.error role="alert"` with `trips.rateMissing` and a list of the missing claim texts. Include `trips.overall` if the stars are missing.
  - Move focus to the first missing fieldset.
- **`ReviewCard`:** wrap the glyphs in `<span role="img" aria-label={t("trips.starsN", { n })}>` and show the number as text too, as `Stars` does.

| Key | en | mn |
|---|---|---|
| trips.promisesTitle | What the plan promised | Төлөвлөгөөний амлалтууд |
| trips.downsidesTitle | Downsides the operator warned about | Компанийн урьдчилан анхааруулсан сул талууд |
| trips.downsidesHint | “As described” means it was no worse than the plan said. | «Бичсэнээрээ» гэдэг нь төлөвлөгөөнд бичсэнээс дордоогүй гэсэн үг. |
| trips.ratedN | Rated {n}/{total} | Үнэлсэн: {n}/{total} |
| trips.rateMissing | Rate these before publishing: | Нийтлэхийн өмнө эдгээрийг үнэлнэ үү: |
| trips.starsN | {n} out of 5 stars | 5 одноос {n} |

**Done when:**
- [ ] **Screen reader:**
  - [ ] The stars read as "Overall rating, group. 4 out of 5 stars, radio button".
  - [ ] Each claim group is named by its claim text.
- [ ] **Layout:** pros and cons sit under separate headings, with the hint under the cons heading.
- [ ] **Missing lines:** submitting with 2 lines unrated:
  - [ ] lists those 2 inline;
  - [ ] puts focus on the first;
  - [ ] shows no browser bubble.
- [ ] **Progress:** the counter updates as lines are rated ("Rated 4/6").
- [ ] **Phone:** at 360px the three options of each line wrap without sideways scrolling.

### P1-7 Confirm money-moving actions, and say what will happen

**Problem:**
- **Traveller cancel** (`trips-view.tsx:126–139`). The button's label simply flips to "Confirm cancel". It never says whether the refund will be full or 50%. The rule (`booking.controller.ts:80`) is half back once free cancellation has ended.
- **Operator cancel** (`orders-view.tsx:368–380`). It confirms with `common.confirmDelete` ("Confirm delete"). "Delete" is the wrong verb: the action refunds the traveller, releases the seats and counts in the operator's public cancellation rate.
- **"Transfer received"** (`:306–320`) marks the money as arrived in one click. There is no mutation to reverse it.

→ WCAG 3.3.4; H5, H2, H3.

**Change:** use the existing `Dialog`, following `operator-form-dialog.tsx`. One small local component per file, no shared abstraction.
- **Traveller cancel dialog:**
  - Title: `trips.cancelTitle`.
  - Body, depending on the booking:
    - held → `trips.refundNone`;
    - today ≤ `freeCancelUntil` → `trips.refundFull` with `usd(totalUsd)`;
    - otherwise → `trips.refundHalf` with `day(freeCancelUntil)` and `usd(totalUsd / 2)`.
  - Buttons: `trips.keepBooking` (`btn btn-secondary`, focused first) and `trips.cancelBooking` (`btn btn-primary`).
- **Operator cancel dialog:**
  - `orders.cancelTitle` and `orders.cancelText`, with the traveller's name and `usd(totalUsd)`.
  - Confirm button: `orders.cancelConfirm`. Stop using `common.confirmDelete` here.
- **"Transfer received" dialog:**
  - `orders.paidTitle` and `orders.paidText`, with `mnt(totalUsd)` and the order code.
  - Confirm: `orders.transferReceived`. Dismiss: `common.cancel`.
- **Clean-up:** remove the two-click state (`confirming`, `confirmCancel`).

| Key | en | mn |
|---|---|---|
| trips.cancelTitle | Cancel this booking? | Энэ захиалгыг цуцлах уу? |
| trips.refundFull | Free cancellation is still open: you get the full {p} back. | Үнэгүй цуцлах хугацаа дуусаагүй тул төлбөрийг бүтнээр нь буцаана: {p}. |
| trips.refundHalf | Free cancellation ended on {d}, so half is refunded: {p}. | Үнэгүй цуцлах хугацаа дууссан ({d}) тул төлбөрийн 50%-ийг буцаана: {p}. |
| trips.refundNone | Nothing has been paid yet. Your seats go back on sale. | Төлбөр хийгдээгүй байна. Суудал дахин худалдаанд гарна. |
| trips.keepBooking | Keep booking | Цуцлахгүй |
| orders.cancelTitle | Cancel order {code}? | {code} захиалгыг цуцлах уу? |
| orders.cancelText | {name} gets the full {p} back and the seats go back on sale. Cancellations by your company show in your public stats. | {name} төлбөрөө бүтнээр нь буцаан авна ({p}), суудал дахин худалдаанд гарна. Компанийн цуцлалт таны нийтэд харагдах үзүүлэлтэд тооцогдоно. |
| orders.cancelConfirm | Cancel order | Захиалга цуцлах |
| orders.paidTitle | Mark the transfer as received? | Шилжүүлэг орсныг баталгаажуулах уу? |
| orders.paidText | Check that {p} with reference {code} has arrived. This can't be undone. | {code} утгатай {p} шилжүүлэг орсныг шалгана уу. Энэ үйлдлийг буцаах боломжгүй. |

**Done when:**
- [ ] **Dialogs:** each of the three actions opens one.
  - [ ] Esc or the dismiss button changes nothing.
  - [ ] Focus goes back to the button that opened the dialog.
- [ ] **Refund wording:** the traveller's dialog shows the correct refund for:
  - [ ] a held booking;
  - [ ] a booking before `freeCancelUntil`;
  - [ ] a booking after it.
- [ ] **Wording:** "Confirm delete" no longer appears anywhere for an order.

### P1-8 Orders inbox works from the keyboard

**Problem:**
- Orders are selected with `<tr onClick>` (`orders-view.tsx:216–225`). Keyboard users can't reach or open a row, and the selected order isn't announced.
- The tab filters are plain buttons with no pressed state (`:161–174`).
- The detail panel has no heading; the traveller's name is a plain `div`.

→ WCAG 2.1.1 Keyboard, 4.1.2, 1.3.1; H1.

**Change:**
- **Row button:** the traveller name in the first cell becomes `<button type="button" className="rowlink" aria-controls="order-detail" aria-current={selected ? "true" : undefined}>`.
  - Keep the row click for mouse users.
  - Add CSS next to `.table a.rowlink` (`globals.css:625`): `.table button.rowlink { background: none; border: 0; padding: 0; font: inherit; font-weight: 700; color: inherit; text-align: left; cursor: pointer; }`.
- **Tab filters:** add `aria-pressed={key === tab}`, as `LanguageToggle` already does.
- **Detail panel:**
  - The wrapper becomes `<section id="order-detail" aria-labelledby="order-detail-name" tabIndex={-1}>`.
  - The name becomes `<h2 id="order-detail-name" className="heading" style={{ fontSize: 17, margin: 0 }}>`.
  - On phones, call `detail.current.focus()` after `scrollIntoView`.

**Done when:**
- [ ] **Keyboard only:**
  - [ ] Tab reaches each row's name.
  - [ ] Enter selects it and the panel updates.
  - [ ] At 360px, focus moves to the panel heading.
- [ ] **Screen reader:**
  - [ ] It announces the selected row as "current".
  - [ ] It announces each filter as pressed or not pressed.
- [ ] **Mouse:** clicking anywhere on a row still selects it.

---

## P2: should

### P2-1 One colour rule for scores and warnings

**Problem:**
- **Score colours drift.** The thesis UI section (`ch3.tex:314`) defines them as: 90 and up deep green, 80–89 light green, below 80 the warning tone. `scoreTone()` (`lib/utils.ts:58–63`) implements this, but other places drift:
  - the plan page's area bars warn below 90 (`plan-page-view.tsx:317`);
  - the dashboard's performance tags warn below 90 (`overview-view.tsx:224`);
  - these are always green, so a score of 62 shows green:
    - compare (`compare-view.tsx:34`);
    - the plans list (`plans-list-view.tsx:41`);
    - the editor preview (`plan-editor.tsx:663`);
    - the plan card's `.tag-score` (`plan-card.tsx`).
  - → H4. This misleads on the product's central number.
- **Warnings still use blue.** After the palette change, the blue ramp still carries the warning tone in nine places:
  - `booking-widget.tsx:63`: few seats left;
  - `compare-view.tsx:28`: worst value;
  - `plan-editor.tsx:330, 467, 472, 680, 704`: map warning, low claim score, "resets", the con in the preview, a failing check;
  - `plans-list-view.tsx:37`: reviewer's note;
  - `review-queue-view.tsx:39`: operator not verified;
  - `operator-health-view.tsx:72`.
  - "Unsaved changes" is also light blue (`plan-editor.tsx:216`).
  - Warnings therefore look like links. In several places colour is the only cue. → H4; WCAG 1.4.1 Use of Color.

**Change:**
- **Score tags:**
  - `lib/utils.ts`: add `scoreTag(score) => score == null ? "tag-neutral" : score >= 80 ? "tag-accent-2" : "tag-accent"` next to `scoreTone`.
  - Use it in compare, the dashboard's performance table, the plans list and the editor preview.
  - Plan card: set `style={{ background: scoreTone(plan.score) }}` on `.tag-score`.
  - Area bars: use `warn={a.score < 80}`.
- **Claim warnings in the editor:** keep the threshold of 85, which is the thesis's gap rule (Algorithm worstGap). But also require `ratingCount >= 3`, as the dashboard's gap card does, so one bad rating doesn't flag a line.
- **Warning text:**
  - Replace each blue warning colour with `var(--color-cta-800)`, ≈7:1 on white.
  - Wherever the text stands alone, add a `CircleAlert` icon (13–14px, `aria-hidden`).
  - On the dark editor bar, "Unsaved changes" becomes `var(--color-cta-300)`.
- **Leave blue where it means brand or highlight:** the route line, the "awaiting review" stat tile, trip step 4.

**Done when:**
- [ ] **Blue warnings gone:** `grep -rn "color-accent-[78]00" components` returns only the route map.
- [ ] **Score colours:** a plan scoring 75 shows a gold tag or badge on the card, compare, the dashboard, the plans list and the editor preview.
  - [ ] A score of 85 shows green.
  - [ ] An unrated plan shows a grey "–".
- [ ] **Not colour alone:** every warning text also has an icon or a word that marks it as a warning.

### P2-2 Plan page: explain the score and show it in full

**Where:** `/plans/[slug]`, in `components/app/plan/plan-page-view.tsx`

**Problem:**
- **The score isn't explained.** It appears as a bare number in a circle (in the operator strip, `:143`) and in the aside panel. Nothing says what 95 means or how it's calculated. `plan.scoreExplain` covers only the per-line percentages. A first-time traveller can't tell it apart from a star average. → H10, H2.
- **Cons hide their rating.** Whenever the operator wrote a detail, a con's rating disappears: `c.detail || pctOf(c.score)` (`:212`). Pros show both (`:192–193`). Yet whether a downside was as described is exactly the honesty data the score is about. → H4.
- **The breakdown is at the bottom on phones.** It sits in the aside, which lands after the reviews.

**Change:**
- **"How is this scored?":** in the aside `.panel-sage` (`:304–322`), under the bars, add a native `<details className="small">`:
  - `<summary>`: `plan.scoreHow`;
  - body: `plan.scoreHowText`, which follows the formula in ch1 (eq. claimscore).
- **Con lines:** use the same format as pros: ``{c.detail ? `${c.detail} — ` : ""}{pctOf(c.score)}``.
- **Breakdown placement:**
  - Move the panel into a local `ScoreBreakdown` component.
  - Render it in the aside with `hide-m`, and again right after the pros/cons grid with `show-m`.

| Key | en | mn |
|---|---|---|
| plan.scoreHow | How is this scored? | Оноог хэрхэн тооцдог вэ? |
| plan.scoreHowText | After the trip, verified travellers rate every promise and every stated downside: as described (100), partly (50) or not as described (0). The score is the average, so honest downsides help it. Placement can't be bought. | Аяллын дараа баталгаажсан аялагчид амлалт болон бичигдсэн сул тал бүрийг «бичсэнээрээ» (100), «хэсэгчлэн» (50), «бичсэнээс өөр» (0) гэж үнэлнэ. Оноо нь эдгээрийн дундаж тул сул талаа үнэнээр бичих нь оноог өсгөнө. Байршлыг мөнгөөр худалдаж авах боломжгүй. |

**Done when:**
- [ ] **"How is this scored?":** opens and closes with both keyboard and mouse.
- [ ] **Con lines:** a con with a detail shows "detail — Confirmed by N% of ratings".
- [ ] **Placement:**
  - [ ] At 360px the breakdown appears right under the pros and cons, and not again at the bottom.
  - [ ] At 1280px it appears only in the aside.

### P2-3 Search: show every active filter and announce the result count

**Where:** `/search`, in `components/app/search/search-view.tsx` and `app/search/page.tsx`

**Problem:**
- **The "Days" choice is hidden.** The hero's "Days" choice (`home-view.tsx:92–99`) is carried as a hidden field (`search-view.tsx:53, 66`) and does filter the results. But it appears nowhere on the results page: not in the title (`:52`), not in the pill, not in the rail.
  - A visitor who picked "1–3" sees fewer trips with no explanation.
  - "No plans match these filters. Try clearing a deal-breaker." (`search.noResults`) points at the wrong cause.
  - → H1, H3, H9.
- **The new count isn't announced.** Filters submit automatically when changed. → WCAG 4.1.3 Status Messages.
- **Phone filters push results out of view.** The open filter rail is a long column above the results (`scr-mobile.png`, third frame). After every tap the user has to scroll past it to see what changed. → H1.

**Change:**
- **Active-filter chips:** above the results title, add a `.wrap-row` of chips built from `params`: days, month, region, score, max price (when under 3000), difficulty, and each sleeping, deal-breaker and operator value.
  - Each chip is a `Link` to the same URL without that value. Reuse the URL builder from `sortHref`.
  - Style: `.tag tag-outline`, the value plus "×", and `aria-label` from `search.removeFilter`.
  - Days label: `${t("home.days")}: 1–3`; the value `10-30` shows as "10+".
- **Count announcement:** add `<p className="sr-only" role="status">{t("search.resultsTitle", { n: plans.length })}</p>` once in the results column.
- **Phone "Show N plans" button:** a `show-m` button at the bottom of `.filter-rail.open`.
  - Style: `btn btn-primary btn-block` with the label `search.showN`.
  - It closes the rail and scrolls to the results heading.
  - CSS: `.filter-rail.open .rail-done { position: sticky; bottom: 0; }` on a `--color-bg` background.
- **Optional, only if it takes ~15 lines or fewer:** while the automatic navigation is pending, set `aria-busy="true"` and `opacity: .6` on `.search-results`. One way: in `AutoForm`, wrap the navigation in `useTransition`, using `router.push("/search?" + new URLSearchParams(new FormData(form)))` instead of `requestSubmit()`.

| Key | en | mn |
|---|---|---|
| search.removeFilter | Remove: {f} | Хасах: {f} |
| search.showN | Show {n} plans | {n} төлөвлөгөө харах |

**Done when:**
- [ ] **Days chip:** coming from the hero with Days = 1–3, the results show a "Days: 1–3 ×" chip.
  - [ ] Clicking it widens the results.
  - [ ] The chip then disappears.
- [ ] **All filters:** every active rail filter has a matching chip, and "Clear" removes them all.
- [ ] **Count:** a screen reader announces "N plans" after a filter changes.
- [ ] **Phone (360px):** open the filters, tap a chip, tap "Show N plans".
  - [ ] The rail closes.
  - [ ] The results heading is in view.

### P2-4 Booking card controls

**Where:** the plan page aside, `components/app/plan/booking-widget.tsx`

**Problem:**
- **Unnamed stepper.** The buttons are named "−" and "+" (`:80, 84`). These names are hard-coded and untranslated, and the count isn't announced when it changes. → WCAG 4.1.2, 4.1.3.
- **Silent limit.** "+" does nothing once the departure's free seats or `maxGroup` is reached, with no explanation. → H1.
- **Cryptic "+ 3".** "+ 3" (`:68–72`) is an unexplained control that reveals more dates. → H2, H6.
- The few-seats text is blue; that's covered in P2-1.

**Change:**
- **Stepper:**
  - Buttons get `aria-label={t("book.fewer")}` and `aria-label={t("book.more")}`.
  - The count goes in `<output aria-live="polite">`.
- **Limits:**
  - Disable "−" at 1, and "+" at `min(left, maxGroup)`.
  - At the limit, show `plan.maxOnDate` in `.xs` under the stepper.
- **More dates:** "+ N" becomes `t("plan.moreDates", { n })`.

| Key | en | mn |
|---|---|---|
| book.fewer | Fewer travellers | Аялагч хасах |
| book.more | More travellers | Аялагч нэмэх |
| plan.maxOnDate | Max {n} on this date | Энэ гаралтад дээд тал нь {n} |
| plan.moreDates | Show {n} more dates | Өөр {n} огноо харах |

**Done when:**
- [ ] **Screen reader:** it says "More travellers, button" and announces the new count.
- [ ] **Limit:**
  - [ ] At the limit "+" is disabled and the hint shows.
  - [ ] Picking a date with more room enables it again.
- [ ] **More dates:** "Show 3 more dates" reveals the rest.

### P2-5 Compare: show the trade-offs, readable on a phone

**Where:** `/compare`, in `components/app/compare/compare-view.tsx`

**Problem:**
- **Column headers don't name the trip.** They read "Operator · N days" (`:70`), not the trip title, so two plans from the same operator look identical. → H6.
- **The cons are missing.** The table leaves out the stated cons, even though comparing on honesty is the product's whole idea and `claims` is already loaded with `PlanCardFields`. → H2.
- **Structure and colour:**
  - Row labels are `<td>` cells (`:81`).
  - Best and worst values are marked only by colour (`:22–29`), and "worst" is blue.
  - → WCAG 1.3.1, 1.4.1.
- **Arbitrary emphasis.** The first column's Book button is the gold CTA and the others are secondary (`:95`, `i === 0`). The emphasis follows save order, nothing else. → H4.
- **Labels scroll away on phones.** At 360px the table scrolls sideways and the row labels scroll out of view.

**Change:**
- **Header cells:** the plan title via `pick()`, with the operator name under it in `.xs muted`. Both link to the plan.
- **Cons row:** a new row after the score, labelled `plan.consStated`. Each cell lists `consOf(plan)` as `<Con>` lines: up to 3, then "+N".
- **Table structure:** row labels become `<th scope="row">`; column headers get `scope="col"`.
- **Best and worst:**
  - Best keeps green and bold, plus a `Check` icon (`aria-hidden`) and `<span className="sr-only">{t("compare.best")}</span>`.
  - Worst uses `--color-cta-800` plus an `sr-only` `compare.worst`.
- **Book buttons:** all use `btn btn-cta btn-xs`.
- **Sticky labels:** add `className="table compare"` and `.compare th[scope="row"] { position: sticky; left: 0; background: var(--color-bg); z-index: 1; }`.

| Key | en | mn |
|---|---|---|
| compare.best | best in this row | энэ мөрөнд хамгийн сайн |
| compare.worst | weakest in this row | энэ мөрөнд хамгийн сул |

**Done when:**
- [ ] **Headers:** they show plan titles in the current language.
- [ ] **Cons row:** it lists each plan's stated downsides.
- [ ] **Screen reader:**
  - [ ] It reads the row header when moving across cells.
  - [ ] It says "best in this row" on the best cell.
- [ ] **Phone:** at 360px the label column stays put while the table scrolls sideways.

### P2-6 Trip page: one message per state

**Where:**
- `/trips/[code]`: `components/app/trips/trip-view.tsx` and `app/trips/[code]/page.tsx`;
- the page wrapper for `/checkout/[slug]`.

**Problem:**
- **"Confirmed" too early.** Every booking that isn't held gets "Your seats are confirmed" (`:60`). That includes `PAID`, which My trips calls "Paid · awaiting operator", as well as `TRAVELLING` and `COMPLETED`. → H4, H1.
- **The guide is never shown,** although `booking.guide` is already fetched.
- **Cancelled bookings explain nothing.** They get the same check icon in grey, and no word on who cancelled or what happens to the money (`:54–60`). → H1, H9.
- **Bare loading and error states.** While loading, or when the code is wrong, the page shows only "…" or the API message, with no header and no way back. This applies to `app/trips/[code]/page.tsx:12` and `app/checkout/[slug]/page.tsx:15`. → H1, H3.

**Change** (the held and expired states are in P1-1). Choose the title and lead text by `stage`:
- **`PAID`:** `trip.paidTitle` and `trip.paidLead`.
- **`CONFIRMED` and `TRAVELLING`:** `trip.confirmedTitle` and `trip.confirmedLead`, including the guide. If `guide` is empty, use `trip.paidLead`.
- **`COMPLETED`:** `trip.completedTitle`. When `canReview`, add a `btn btn-primary` "Rate this trip" (`trips.rateTrip`) linking to `/trips`.
- **Cancelled:**
  - icon `X`;
  - lead `trip.cancelledByYou` or `trip.cancelledByOp`, depending on `cancelledBy`;
  - link `trip.findAnother` to `/search`.
- **Loading and errors:** the page wrappers render `<SiteHeader />`.
  - While loading, show `common.loading`.
  - On error, show the message plus a link to `/trips` (`nav.myTrips`) or back to the plan.

| Key | en | mn |
|---|---|---|
| trip.paidTitle | Your seats are booked, {name}. | {name}, таны суудал захиалагдлаа. |
| trip.paidLead | Payment received and held by itours. {op} will confirm and introduce your guide within {h} hours. Order {code}. | Төлбөр орж, itours-д хадгалагдаж байна. {op} {h} цагийн дотор баталгаажуулж, хөтчөө танилцуулна. Захиалга {code}. |
| trip.confirmedTitle *changed* | Your trip is confirmed, {name}. | {name}, таны аялал баталгаажлаа. |
| trip.confirmedLead *changed* | {op} has confirmed your trip. Your guide: {guide}. Order {code}. | {op} аяллыг тань баталгаажуулсан. Хөтөч: {guide}. Захиалга {code}. |
| trip.completedTitle | Welcome back, {name}. | Эргэн тавтай морил, {name}. |
| trip.cancelledByYou | You cancelled this booking. | Та энэ захиалгыг цуцалсан. |
| trip.cancelledByOp | {op} cancelled this trip and refunds you in full. | {op} энэ аяллыг цуцалсан тул төлбөрийг бүрэн буцаан олгоно. |
| trip.findAnother | Find another trip | Өөр аялал хайх |

**Done when:**
- [ ] **Card payment:** a card-paid booking (`PAID`) reads "Your seats are booked", which matches its My trips tag.
- [ ] **Confirmed:** once the operator confirms with a guide, the title reads "Your trip is confirmed" and the guide's name shows.
- [ ] **Cancelled by the operator:** X icon and the full-refund line.
- [ ] **Cancelled by the traveller:** "You cancelled this booking."
- [ ] **Bad code:** `/trips/ITR-NOPE` shows the header, the message and a link to My trips.
- [ ] **Loading:** shows the header and "Loading…".

### P2-7 Plan editor: show where the publish blockers are

**Where:** `/partner/plans/[id]`, in `components/app/partner/plan-editor.tsx`

**Problem:**
- **Blockers without a location.** The checklist (`:695–715`) says what's wrong, e.g. "2/3 cons" or "Drive time missing d4–d7". It doesn't say where. None of the six tabs (`:232–238`) shows which one holds the problem. → H1, H6, H9.
- **Checklist out of sight on phones.** It sits below the whole form.
- **Incomplete tab semantics.** The tabs have `role="tab"` but:
  - no `aria-controls`;
  - no `tabpanel`;
  - no arrow-key movement.
  - → WCAG 4.1.2; ARIA Authoring Practices tabs pattern.

**Change:**
- **Map checks to tabs.** Map the check keys (`back-end/src/controllers/plan/plan.controller.ts:269–299`) to tabs in one constant:

  | Tab | Checks |
  |---|---|
  | basics | `check.basics`, `check.titleMn` |
  | days | `check.days`, `check.driveMissing`, `check.driveAll` |
  | claims | `check.pros`, `check.cons`, `check.noCons` |
  | pricing | `check.price`, `check.departure` |
  | photos | `check.photos`, `check.noPhotos`, `check.morePhotos` |

- **Tab warning:** a tab with a failing required check shows a 12px `CircleAlert` in `--color-cta-700` after its label, plus `editor.tabIssues` in `sr-only`.
- **Clickable checklist:** each row becomes a `<button type="button">` that calls `setTab()` and moves focus to the tab panel.
- **Tab semantics:**
  - Tabs get `id="tab-{key}"` and `aria-controls="panel"`.
  - The content wrapper becomes `role="tabpanel" id="panel" aria-labelledby="tab-{tab}" tabIndex={0}`.
  - ←/→ move between tabs (roving `tabIndex`).
- **Phones:** under the tab bar, a `show-m` line `editor.issuesN` linking to the checklist (`id="checks"`), shown when any required check fails.

| Key | en | mn |
|---|---|---|
| editor.tabIssues | has things to fix | засах зүйлтэй |
| editor.issuesN | {n} things to fix before publishing | Нийтлэхээс өмнө засах зүйл: {n} |

**Done when:**
- [ ] **Tab warnings:** a plan with 2 cons and missing drive times shows the alert icon on "Pros & cons" and "Itinerary" only.
- [ ] **Checklist:** clicking "2/3 cons" opens the Pros & cons tab.
- [ ] **Keyboard:** ←/→ switch tabs.
- [ ] **Screen reader:** it says "tab, 3 of 6, has things to fix".
- [ ] **Phone:** at 360px the issue line appears under the tabs.

### P2-8 Plan editor: protect unsaved work

**Problem:**
- **Unsaved edits are dropped silently.** Edits stay in local state until "Save draft". Leaving the page drops them without warning. That covers the `← Trip plans` link (`:199`), the sidebar and closing the tab. The editor already tracks `dirty`. → H5, H3.
- **Removals have no undo.** Removing a pro or con, a day or a photo (`:476, 383, 602`) happens at once, with no feedback. Removing a claim that has ratings deletes those ratings on save (BR-09, ch3), which changes the score. → H3 (undo), H5.

**Change:**
- **`beforeunload`:** in a `useEffect`, add a `beforeunload` listener while `dirty` is true. The browser shows its own prompt.
- **Back link:** in the editor's back link, if `dirty` and `!window.confirm(t("editor.leaveUnsaved"))`, call `preventDefault()`.
  - Known limit: the sidebar links aren't intercepted, because the App Router has no API for blocking navigation.
- **Undo on remove:**
  - Keep the removed item and its index.
  - Call `toast(…, { action: { label: t("common.undo"), onClick: restore } })` from `sonner`.
  - For a claim with `ratingCount > 0`, use `editor.removedRated`.

| Key | en | mn |
|---|---|---|
| editor.leaveUnsaved | You have unsaved changes. Leave without saving? | Хадгалаагүй өөрчлөлт байна. Хадгалахгүйгээр гарах уу? |
| editor.removed | Removed | Хасагдлаа |
| editor.removedRated | Removed “{text}”. Its {n} ratings are deleted when you save. | «{text}» хасагдлаа. Хадгалахад түүний үнэлгээ ({n}) устна. |
| common.undo | Undo | Буцаах |

**Done when:**
- [ ] **Leaving with unsaved edits:**
  - [ ] Closing the tab brings up the browser's prompt.
  - [ ] "← Trip plans" asks first.
- [ ] **Undo:** removing a rated con shows a toast with the number of ratings, and Undo puts the con back in the same place.
- [ ] **After saving:** after "Save draft", no prompt appears.

### P2-9 Admin review queue: review in place, and say why Approve is missing

**Where:** `/admin/review`, in `components/app/admin/review-queue-view.tsx`

**Problem:**
- **The reviewer can't see what they're checking.** The queue's job is to check for "a real cons list, drive times and photo ownership" (`admin.queueLead`). Each item shows only check tags, so the reviewer has to open the public page in a new tab (`:58`). Yet the data is already loaded: `PlanCardFields` includes `claims`, `maxDrive`, `showerNights` and `photos`. → H6, H7.
- **Approve disappears without a reason.** It's simply absent when checks fail or the operator is unverified (`:75–87`). → H1, H9.
- **Fix requests can be empty.** "Request fixes" can be sent without a note, so the operator gets "Needs fixes" with no guidance. The note field has only a placeholder. → H5; WCAG 3.3.2.
- **Unhelpful photo alt text.** It's "—" (`:30`).

**Change:**
- **Review in place:** add a `<details>` to each item, summary `admin.checkPlan`. Inside:
  - the cons as `<Con>` lines;
  - the number of pros;
  - `compare.longestDrive` with `maxDrive` h;
  - `compare.hotShowers`;
  - the first 4 photos in `.thumbs`.
- **Approve:** always render the button. When it's blocked:
  - make it `disabled`;
  - point its `aria-describedby` at an `.xs` line `admin.approveNeeds` listing the failing check labels, plus `admin.notVerified` when the operator is unverified.
- **Fix note:**
  - Give it a visible label, `admin.noteLabel`, in a `.field`, and make it `required`.
  - Disable "Request fixes" while the note is empty.
- **Photo alt text:** the plan title via `pick()`.
- **Phone:** the note field gets `flex: 1 1 100%` at ≤900px.

| Key | en | mn |
|---|---|---|
| admin.checkPlan | Check the plan here | Төлөвлөгөөг эндээс шалгах |
| admin.approveNeeds | Can't approve yet: {list} | Одоогоор батлах боломжгүй: {list} |
| admin.noteLabel | Note to the operator | Компанид өгөх тэмдэглэл |

**Done when:**
- [ ] **Review in place:** expanding an item shows its cons, longest drive day, shower nights and photos without leaving the page.
- [ ] **Blocked item:** it shows a disabled Approve, and a screen reader reads out the reason.
- [ ] **Fix note:** "Request fixes" can't be sent empty.

### P2-10 Orders inbox: consistent values, usable on a phone

**Where:** `/partner/orders`, in `components/app/partner/orders-view.tsx`

**Problem:**
- **Mixed currencies.** The Value column shows USD for card payments and ₮ for QPay and bank (`:237`). The detail panel then shows USD for all (`:289`). → H4.
- **Raw method names.** The payment method prints the raw value ("card", "bank") at `:289`, in English in both languages.
- **Table too wide for phones.**
  - At 360px the 5-column table scrolls sideways, and Status, the column used for triage, is off-screen.
  - After picking a row, the only way back to the list is scrolling. → H3.

**Change:**
- **Value cell:** `usd(totalUsd)`, with `mnt(totalUsd)` under it in `.xs muted`.
- **Method:** ``t(`orders.method.${method}`)``.
- **Phone layout:**
  - Put `className="hide-m"` on the Pax and Value header and data cells.
  - Under the plan/date cell, add a `show-m` line in `.xs muted`: "{pax} · {usd}".
- **Back to list:** at the top of the detail panel, add a `show-m` `btn btn-ghost btn-xs` with `orders.backToList`. It scrolls to the selected row's button and focuses it.

| Key | en | mn |
|---|---|---|
| orders.method | { CARD: card, QPAY: QPay, BANK: bank transfer } | { CARD: карт, QPAY: QPay, BANK: дансаар } |
| orders.backToList | Back to orders | Захиалгын жагсаалт руу |

**Done when:**
- [ ] **Value column:** every row shows USD with ₮ under it.
- [ ] **Method in МН:** reads "карт" or "дансаар".
- [ ] **Phone (360px):**
  - [ ] Traveller, Plan and Status fit without sideways scrolling.
  - [ ] "Back to orders" returns focus to the row.

### P2-11 Bilingual gaps

**Problem:** the thesis UI section (`ch3.tex:318`) promises two things: Mongolian content wherever it exists (English otherwise), and every interface string in both dictionaries. The gaps:
- **English-only plan titles:**
  - `orders-view.tsx:233, 274`;
  - `review-queue-view.tsx:32`;
  - `plan-editor.tsx:201, 659`;
  - `plans-list-view.tsx:31`;
  - the dashboard's `planTitle` and `title`, which the API sends as `titleEn` (`back-end/src/controllers/operator/operator.controller.ts:270, 288, 301`).
- **Hard-coded English or symbol labels:**
  - `aria-label="Move up"` and `"Move down"` (`plan-editor.tsx:397, 400`);
  - "−" and "+" in the booking card (P2-4);
  - `aria-label="Language"` (`language-toggle.tsx:21`). It also sits on a `div` with no role, so it's ignored;
  - `<span className="sr-only">Close</span>` (`components/ui/dialog.tsx:23`). The new dialogs from P1-7 inherit it.
- **Hard-coded "h" unit:**
  - `${d.driveHours} h` (`plan-editor.tsx:412`);
  - `${plan.maxDrive} h` (`compare-view.tsx:36`);
  - `{d.replyHours} h` (`overview-view.tsx:97`).

→ H4; WCAG 3.1.2 Language of Parts (English words inside the Mongolian interface without a `lang` attribute).

**Change:**
- **Plan titles:** use `pick(locale, titleEn, titleMn)` at each place listed. Both `Booking.plan` and `PlanCardFields` already include `titleMn`.
- **Back-end:** the dashboard resolvers return `titleMn` when `context.lang === "mn"` and it isn't empty, the same rule as `pick()`.
- **Editor arrows:** use `editor.moveUp` and `editor.moveDown` with the day number.
- **Language toggle:**
  - The wrapper gets `role="group" aria-label={t("nav.language")}`.
  - Each button gets `lang` (`mn` or `en`) and an `aria-label` with the full language name.
- **Dialog close label:** use `t("common.close")` (the key already exists). `DialogContent` is a client component, so it can call `useT()`.
- **Units:** use `common.hours`.

| Key | en | mn |
|---|---|---|
| editor.moveUp | Move day {n} up | {n}-р өдрийг дээш зөөх |
| editor.moveDown | Move day {n} down | {n}-р өдрийг доош зөөх |
| nav.language | Language | Хэл |
| nav.langMn · nav.langEn | Mongolian · English | Монгол · Англи |
| common.hours | {n} h | {n} цаг |

**Done when:**
- [ ] **Titles in МН:** the inbox, admin queue, editor and dashboard show the Mongolian title wherever one exists.
- [ ] **No English aria-labels:** `grep -rn 'aria-label="[A-Z]' components` finds nothing, and the dialog close button reads "Хаах" in МН.
- [ ] **Units in МН:** drive hours read "6 цаг".

### P2-12 Touch targets (WCAG 2.5.8)

**Problem:** these targets are smaller than 24×24 CSS px, and their neighbours are closer than the spacing exception allows. → WCAG 2.5.8 Target Size (Minimum).
- **`.x-btn`** (`globals.css:617`):
  - the ▲/▼ day-reorder arrows use an 11px font and are stacked with no gap (≈15×17 px);
  - the × remove buttons are ≈17×25 px.
- **`.thumb-actions button`** (`:622`): ≈21 px tall, side by side.
- **Ghost buttons with inline `padding: 0`:** "+ Add a pro", "+ Add a con" and "+ N dates" are ≈16 px tall.
- **`.hx-dots button`** (`:750`) on the landing hero: 9×9 px, 6 px apart.

**Change:**
- **`.x-btn`:** add `min-width: 24px; min-height: 24px; display: inline-grid; place-items: center;`. The reorder arrows get `font-size: 13px`, in a column with `gap: 2px`.
- **Thumbnail actions:** `.thumb-actions button { min-height: 24px; padding: 3px 10px; }`.
- **Ghost buttons:** remove the inline `padding: 0` from them, and add `.btn-ghost { min-height: 24px; }`.
- **Hero dots:** keep the 9 px dot as a pseudo-element, but make the button itself 24×24.
- **Phones (≤900px):** `.chip span { padding: 6px 12px; font-size: 12px; }`. This is for comfort; AA doesn't require it.

**Done when:**
- [ ] **Sizes:** in DevTools, every listed control's box is at least 24×24.
- [ ] **Desktop unchanged:** at 1280px, the editor's claims and the hero otherwise look the same.

### P2-13 Traveller flow on a phone

**Where:** at ≤900px, on `/plans/[slug]`, in the header and on `/checkout/[slug]`

**Problem:**
- **No Save on the plan page.** Save exists only in the header and is `hide-m` (`plan-page-view.tsx:76–81`). On a phone you can't save from the plan page, and so can't build a list to compare.
- **Compare is hard to reach.** The header's "Saved" link is `hide-m` (`account-menu.tsx:46–50`), so on phones compare is reachable only through the avatar menu. → H6.
- **The book bar shows the wrong date.** It shows the first open departure, not the one picked in search (`?dep=`, `:326–334`). → H4.
- **The book bar's CTA can be covered.** It has a fixed 20px bottom padding and no safe-area inset, so on iOS the home indicator overlaps the button.
- **No progress on phone checkout.** The step indicator is `hide-m` (`checkout-view.tsx:53`). → H1.

**Change:**
- **Plan page:** add a `show-m` `SaveButton` to the action row of `.op-strip`.
- **Mobile menu** (`MobileMenu` in `site-header.tsx`): for travellers (`useSavedIds().traveller`), add `/compare` ("Saved") and `/trips` ("My trips").
- **Book bar:**
  - Use `plan.departures.find((d) => d.id === initialDep) ?? next`.
  - CSS: `.mobile-bookbar { padding-bottom: calc(12px + env(safe-area-inset-bottom)); }`.
- **Checkout:** add a `show-m` line in `.small` with `book.stepOf` to the top bar.

| Key | en | mn |
|---|---|---|
| book.stepOf | Step {n} of 3 · {step} | Алхам {n}/3 · {step} |

**Done when:**
- [ ] **Plan page and menu (360×740):**
  - [ ] Save is visible on a plan page.
  - [ ] Signed in as a traveller, the menu lists Saved and My trips.
- [ ] **Book bar date:** arriving from a search result for 14 Jun, the book bar shows 14 Jun.
- [ ] **Safe area:** in iOS Safari, or DevTools with safe-area emulation, the book bar's button clears the home indicator.
- [ ] **Checkout:** shows "Step 2 of 3 · Payment".

---

## P3: nice

### P3-1 Operator dashboard: make "needs attention" a link

**Where:** `/partner`, in `components/app/partner/overview-view.tsx`

**Problem:**
- "11 orders need your attention" (`:41`) is plain text: the most actionable line on the page isn't a link. → H7.
- The weekly chart is coloured `div`s whose values exist only in `title` attributes (`:116`), so there is no text alternative. → WCAG 1.1.1.

**Change:**
- Wrap `partner.needAttention` in `<Link href="/partner/orders">`. The inbox already opens on Needs action.
- Give the chart container `role="img"` and an `aria-label` made from `t("partner.seatsPerWeek")` followed by "{date} {n}" for each item in `d.weeks`, joined with ", ". No new key is needed.

**Done when:**
- [ ] **Link:** it opens the inbox on Needs action.
- [ ] **Chart:** a screen reader reads the 12 weekly values.

### P3-2 Let guests find Save and Compare

**Where:** search results and the plan page, `components/app/save-button.tsx`

**Problem:** `SaveButton` renders nothing unless a traveller is signed in (`:25`), and `/compare` sends guests to the login page. A guest never learns that saving and comparing exist. → H6, H10.

**Change:**
- For signed-out visitors, render ``<Link className="btn btn-secondary btn-sm" href={`/login?next=${encodeURIComponent(pathname + search)}`}>{t("plan.save")}</Link>``. `safeNext` in `auth-card.tsx` already sends the visitor back afterwards.
- Operators and staff still see nothing.

**Done when:**
- [ ] **Guest Save:** a signed-out visitor's "Save" leads to sign-in, then back to the same results or plan.
- [ ] **After signing in:** Save works.

---

## Out of scope

- **Payments:** a real gateway (card, QPay) and card-field validation. The demo notice stays.
- **Contact:** messaging between traveller and operator, and showing operator contact details.
- **Late transfers:** what happens to a bank transfer that arrives after the hold expires. This needs a product decision; see P1-1.
- **Reminders:** email or SMS before a hold expires, and any notification module.
- **Operator text:** translating text that operators type in (day titles, vehicle, sleeping, season, place names). That would need new two-language fields.
- **Visual identity:**
  - changing the palette or typography, or adding dark mode;
  - updating the thesis's colour table (`ch3.tex`, Table ds) or re-taking `scr-*`. The thesis LaTeX hasn't moved to the new palette yet; that's a separate task.
- **Scoring:** changing the score or ranking formula.
- **Other back-office changes:**
  - keeping orders-inbox filters in the URL;
  - an admin "unpublish";
  - the operator-health and staff pages, beyond the shared CSS fixes;
  - a landing-page redesign.
