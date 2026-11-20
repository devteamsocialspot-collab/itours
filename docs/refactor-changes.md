# itours.mn: what the UX refactor changed

**Date:** 2026-11-20
**Input:** `docs/ux-refactor.md` (23 items: P1-1…P1-8, P2-1…P2-13, P3-1, P3-2).
**Status:** all 23 items are implemented, plus the back-end rule BR-04 (the 24-hour bank-transfer hold). Nothing is committed: the changes are working-tree changes on `main`.
**For:** the thesis writer updating the LaTeX. Paths are relative to `itours/`. Strings are quoted exactly as they appear in the two dictionaries.

---

## 1. Back-end: the bank-transfer hold (BR-04)

### The rules

| Rule | What the code does |
|---|---|
| Hold length | `HOLD_HOURS = 24`, a constant in `back-end/src/config/index.ts`. It is deliberately not an environment variable: the interface copy says "24 hours", and WCAG 2.2.1's 20-hour exception needs it to stay above 20. |
| When a hold lapses | A booking with stored status `PENDING_PAYMENT` whose `createdAt` is more than 24 hours ago counts as **expired**. |
| How it lapses | **Lazily.** There is no timer, cron job or migration. The stored status stays `PENDING_PAYMENT`; every read decides "expired or not" from `createdAt` and the current time. |
| Stage | `BookingController.stage()` returns the new stage `EXPIRED` for such a booking. `EXPIRED` is added to the `BOOKING_STAGE` enum (back-end type, GraphQL enum, front-end `BookingStage`). It is never stored. |
| Deadline | New GraphQL field `Booking.payBy: String`: an ISO 8601 instant, `createdAt + 24 h`, while the stored status is `PENDING_PAYMENT` (also after it has lapsed); `null` once paid, confirmed or cancelled. |
| Cancelling | `canCancel` is `false` for an expired hold, so neither the traveller nor the agency can cancel it (it already gave its seats back). `cancelledBy` stays `null`. |
| Inbox tabs | `TAB_STAGES[CANCELLED] = [CANCELLED, EXPIRED]`: an expired hold leaves "Needs action" and is listed under "Cancelled". |
| Marking the transfer received | `markPaid` (GraphQL `markOrderPaid`) refuses an expired hold with the new error `error.holdExpired`. A booking that is not `PENDING_PAYMENT` at all still gets `error.orderNotPending`. |
| Late transfers | Not handled, on purpose: what happens to money that arrives after the hold lapsed is an open product decision. No copy promises a refund. |

`error.holdExpired`, in `back-end/src/utils/i18n/locales/{en,mn}.ts`:
- en: "The 24-hour hold has expired, so this order can no longer be marked as paid"
- mn: "24 цагийн хадгалалтын хугацаа дууссан тул энэ захиалгыг төлөгдсөн гэж тэмдэглэх боломжгүй"

### What counts as a "live" booking

One where-clause, `BookingController.live()` in `back-end/src/controllers/booking/booking.controller.ts`, defines a booking that holds seats and counts as a sale:

> status is neither `CANCELLED` nor `PENDING_PAYMENT`, **or** status is `PENDING_PAYMENT` and `createdAt` ≥ now − 24 h.

Every place that used to count live bookings as `status != CANCELLED` now goes through it:

| Where | What it feeds |
|---|---|
| `BookingController.createBooking` | The seat check inside the locked transaction (BR-03). A lapsed hold's seats can be sold to the next buyer. |
| `PlanController.include` (was the constant `LIVE`) | Seats left per departure: the plan page and booking card, search (month filter with enough seats), the editor's "Sold" column and the floor for lowering seats, the dashboard's fill rate, seats sold, "Full" / "Needs N more" and per-plan conversion. |
| `OperatorController.getStats` | `tripsSold` and the **cancel rate**. A lapsed hold is left out of both the numerator and the denominator: it was neither a sale nor anyone's cancellation. |
| `OperatorController.getDashboard` | Bookings and revenue for the period, the "seats sold per week" chart, and the guide state of the next departures. |
| `OperatorController.getMarketplaceStats` | Admin GMV. (The admin "Bookings, last 30 days" tile counted every booking made, cancelled ones included, before this change and still does.) |

The in-memory twin of the same rule is `BookingController.isExpired(booking)` (used by `stage`, `canCancel` and `markPaid`); both read the same cutoff (`_holdCutoff()` = now − `HOLD_HOURS`).

### Demo data and checks

- `back-end/src/seeds/demo.seed.ts`: seeded `PENDING_PAYMENT` bookings are now created 1–20 hours before seed time (they were up to 84 days old, so all would have lapsed). The random sequence is unchanged, so the rest of the demo looks the same. `README.md` says the countdowns run from seed time, so reseed shortly before a demo.
- `back-end/src/controllers/booking/booking.controller.check.ts` now also checks, on a 1-seat departure: a hold older than 24 h frees its seat for a new buyer; that buyer's fresh hold keeps the seat (the next buyer is refused); the old hold's stage is `EXPIRED`, `canCancel` is false and `payBy` is kept; `markPaid` refuses it with `holdExpired`; `markPaid` on the fresh hold works; `tripsSold` does not count the lapsed hold. The original 6-buyers/3-seats race still passes.

### Files

`back-end/src/config/index.ts`, `back-end/src/types/booking/booking.type.ts`, `back-end/src/controllers/booking/booking.controller.ts`, `back-end/src/controllers/plan/plan.controller.ts`, `back-end/src/controllers/operator/operator.controller.ts`, `back-end/src/graphql/schemas/booking/booking.schema.ts`, `back-end/src/graphql/resolvers/booking/booking.resolver.ts`, `back-end/src/utils/i18n/locales/{en,mn}.ts`, `back-end/src/seeds/demo.seed.ts`, `back-end/src/controllers/booking/booking.controller.check.ts`, `README.md`.

---

## 2. The escrow wording (final)

All places now say the agency is paid **the day after the trip ends**.

| Key | Where | en | mn |
|---|---|---|---|
| `book.payLead` *(changed)* | Checkout, under "How would you like to pay?" | itours holds your payment and pays {op} the day after your trip ends. Cancel free until {d} for a full refund. | Төлбөрийг itours хадгалж, аялал дууссаны маргааш {op}-д шилжүүлнэ. {d} хүртэл үнэгүй цуцалбал бүрэн буцаан олгоно. |
| `book.escrowNote` (unchanged) | Checkout order summary | Held in escrow, released to {op} the day after the trip ends. | Эскроу дансанд хадгалагдаж, аялал дууссаны маргааш {op}-д шилжинэ. |
| `plan.cancelPolicy` *(changed)* | Plan page booking card | Free cancellation until {d}, then 50%. Paid to itours escrow, released to the operator the day after the trip ends. | {d} хүртэл үнэгүй цуцална, дараа нь 50%. Төлбөр itours-ийн эскроу дансанд хадгалагдаж, аялал дууссаны маргааш компанид шилжинэ. |
| `partner.escrowFoot` (unchanged) | Agency dashboard footer | Payments are held in escrow and released to you the day after each trip ends, minus the {p}% marketplace fee. | Төлбөр эскроу дансанд хадгалагдаж, аялал дууссаны маргааш {p}%-ийн шимтгэлийг хасаад танд шилжинэ. |
| `home.escrowText` (unchanged) | Landing, "How it works" | We hold your payment and pay the agency the day after your trip ends, so promises are kept before anyone is paid. | Бид төлбөрийг хадгалж, аялал дууссаны маргааш компанид шилжүүлдэг. Амлалт биелсний дараа л хэн нэгэн мөнгөө авна. |

The old checkout text said money was held "until your trip departs"; that contradiction is gone. The payout date itself is computed as before (`BookingController.payout`: last day + 1).

---

## 3. Per item

Each entry lists what a user now sees, then the files. "en / mn" strings are given where the wording is new.

### P1-1 Bank-transfer hold: deadline, countdown, expired state

- **Checkout:** with "Bank transfer" selected the submit button reads "Hold my seats for 24 h" / "Суудлаа 24 цаг хадгалуулах" (card and QPay still read "Pay $X and confirm seats"). The bank option's sub-line: "We hold your seats for 24 hours. If the transfer hasn't arrived by then, they go back on sale."
- **Trip page, held:** a gold clock icon (no check mark), title "Your seats are held, {name}.", and the lead "Transfer {p} by {time} (Ulaanbaatar time) and use order {code} as the payment reference. If the money hasn't arrived by then, the seats go back on sale." Below it a gold "Pay by" panel: the deadline in large type (en "Thu 21 Nov, 14:30", mn "2026.11.21 14:30"), the time left ("23 h 59 min left"), "Ulaanbaatar time", then Bank (Khan Bank), Account no. (5000 123 456), Recipient (iTours Escrow LLC), Amount (₮ with $ beside it) and Payment reference (the order code), each with a Copy button that reads "Copied" for 2 s. The amount copies as digits only, the account number without spaces. "What happens next" starts with the deadline. There is no green success box and no "Print voucher" until it is paid.
- **Deadline handling:** the deadline is always formatted in `Asia/Ulaanbaatar`, whatever the visitor's clock. The time left refreshes once a minute; minutes round up, so "0 min" never shows while time remains. When the deadline passes on an open page, the page asks the server once and turns into the expired state without a reload. The icon, title and lead sit in a `role="status"` region, so a screen reader announces the change once; the minute countdown is outside it.
- **Trip page, expired:** grey X, "This hold has expired.", the lead "{p} hadn't arrived by {time} (Ulaanbaatar time), so the seats went back on sale. If you've already sent the money, keep the bank receipt and have order {code} ready.", a gold "Book again" button to the plan and a "Search" link. No bank panel, no "What happens next", no voucher.
- **My trips:** a held booking shows "Pay by {time} · {left}" in dark gold under its dates; an expired one shows a grey "Hold expired" tag and a "Book again" link, and no Cancel button.
- **Orders inbox:** a held row's tag reads "Transfer pending · 4 h 10 min left"; its detail panel adds a "Pay by" line with the deadline and time left. When a hold on screen lapses the inbox refreshes once and the order moves to the Cancelled tab, tagged "Hold expired · unpaid", with the note "Not paid by {time} (Ulaanbaatar time). The seats went back on sale automatically." and no action button except Email.
- **Files:** `front-end/components/app/trips/trip-view.tsx`, `front-end/app/trips/[code]/page.tsx`, `front-end/components/app/trips/trips-view.tsx`, `front-end/components/app/partner/orders-view.tsx`, `front-end/components/app/checkout/checkout-view.tsx`, `front-end/lib/utils.ts` (`dateTime`, `timeLeft`, `leftText`), `front-end/lib/hooks/use-now.ts` (new: `useNow`, `useRefetchWhenPast`), `front-end/lib/types.ts`, `front-end/lib/booking/queries.ts`, both front-end dictionaries (the single `trip.bankDetails` string is replaced by separate bank keys).

### P1-2 Checkout must not change the purchase without saying so

- If the departure picked on the plan page no longer exists or has fewer free seats than the group, checkout no longer swaps in another date. It shows an alert, "The departure you picked no longer has {n} free seats. Choose another date before you pay.", a "Choose another date" button back to the plan's booking card, and a disabled pay button; the summary shows that departure (or "–"), never another one. Without a departure in the URL it still preselects the next one with seats.
- The escrow lead text now matches the summary and the plan page (section 2).
- The cons to accept are listed one per line with the gold alert icon and their own capitalisation (they were one lowercased sentence).
- Signed in as an agency or staff account, the pay button is disabled (the "Bookings are made from a traveller account" note was already there).
- **Files:** `front-end/components/app/checkout/checkout-view.tsx`, dictionaries.

### P1-3 Focus is visible everywhere

- The keyboard focus ring is white on the blue header and checkout bar, the dark back-office sidebar and top bars, the footer and the landing hero; white boxes inside them (the hero search, the account menu) keep the blue ring. The results-page search pill shows a blue ring around the whole pill. The page scrolls so that a focused element is never hidden under the sticky header (84 px), nor under the phone's book bar on the plan page (104 px).
- Implementation note: the white-ring rule uses `:where(…)` (no added specificity) rather than the spec's `:is(…)`; with `:is()` the hero search fields would also have turned white.
- **Files:** `front-end/app/globals.css`.

### P1-4 Contrast of secondary text

- Same colours, stronger opacities (token names unchanged): ink 45% → 60%, ink 55% and 60% → 72%; `.text-muted`, captions, card meta and table headers → 72%; the shadcn muted grey → neutral-700; in the blue header the faint white → 80%; sidebar counts, the sidebar company line, footer headings and the footer note → 70%. The active/hovered header link is now white with a 2 px gold underline (gold text on blue was 3.1:1).
- **Files:** `front-end/app/globals.css`, `front-end/components/app/sidebar/sidebar.tsx`.

### P1-5 Labels and groups that assistive tech can read

- Every visible field label is now tied to its field (clicking it focuses the field): the plan editor's fields, checkout's card fields, the inbox's guide and driver, the eight company-profile fields. Multi-control fields (group size, difficulty, sleeping types, route length) are a `fieldset` with a `legend`; their number inputs are named ("Smallest group" / "Largest group", "Route length, km" / "Unpaved, %").
- Inputs that had only a placeholder are named: orders search, the day title, claim text ("Pros 1", "Cons you state yourself 2"…), claim detail, the claim's area select ("Rated under"), each departure's date and seats, the photo link.
- The search filter rail's sections are `fieldset`s named by their headings, so a screen reader says e.g. "Difficulty, group". The booking card's departures are a named group; the traveller stepper is a group named "Travellers".
- New strings (not in the spec, needed for the names above): `editor.groupMin` "Smallest group" / "Хамгийн бага бүлэг", `editor.groupMax` "Largest group" / "Хамгийн их бүлэг", `editor.km` "Route length, km" / "Маршрутын урт, км", `editor.unpavedPct` "Unpaved, %" / "Шороон зам, %", `editor.claimAreaLabel` "Rated under" / "Үнэлэх ангилал".
- **Files:** `front-end/components/app/partner/plan-editor.tsx`, `checkout/checkout-view.tsx`, `partner/orders-view.tsx`, `partner/profile-form.tsx`, `plan/booking-widget.tsx`, `search/search-view.tsx`, `trips/trips-view.tsx`, `front-end/app/globals.css`.

### P1-6 Review form

- Promises and stated downsides are two blocks: "What the plan promised" (green check) and "Downsides the operator warned about" (gold alert), the latter with the hint "“As described” means it was no worse than the plan said." The "✓ "/"⚠ " text prefixes are gone; each line's three options are unchanged (As described / Partly / Not as described = 2 / 1 / 0).
- "Overall rating" is a named group of five options, each shown as a number and a star icon and read as "4 out of 5 stars".
- A counter next to the button shows "Rated 4/6". Publishing with lines missing no longer triggers the browser's bubble: an alert lists "Rate these before publishing:" and the missing lines (and "Overall rating" if no stars), and focus moves to the first missing group. The list shrinks as lines are rated.
- Review cards elsewhere show the star count as a number too and are read as "{n} out of 5 stars".
- **Files:** `front-end/components/app/trips/trips-view.tsx`, `front-end/components/app/review-card.tsx`.

### P1-7 Confirm money-moving actions

- **Traveller cancel** (My trips) opens a dialog "Cancel this booking?" that states the refund: held → "Nothing has been paid yet. Your seats go back on sale."; before the free-cancellation date → "Free cancellation is still open: you get the full {p} back."; after it → "Free cancellation ended on {d}, so half is refunded: {p}." Buttons: "Keep booking" (focused first) and "Cancel booking".
- **Agency cancel** (inbox) opens "Cancel order {code}?": "{name} gets the full {p} back and the seats go back on sale. Cancellations by your company show in your public stats." Confirm: "Cancel order"; dismiss: "Back". "Confirm delete" no longer appears for orders.
- **"Transfer received"** opens "Mark the transfer as received?": "Check that {p} with reference {code} has arrived. This can't be undone." (amount in ₮). Confirm: "Transfer received"; dismiss: "Cancel".
- Esc or the dismiss button changes nothing, and focus returns to the button that opened the dialog. The old two-click buttons are removed.
- **Files:** `front-end/components/app/trips/trips-view.tsx`, `front-end/components/app/partner/orders-view.tsx`, `front-end/components/ui/dialog.tsx` (exports `DialogTrigger`).

### P1-8 Orders inbox works from the keyboard

- Each row's traveller name is a button: Tab reaches it, Enter selects the order; a screen reader hears the selected row as "current". Clicking anywhere on a row still works. The status filters announce pressed / not pressed. The detail panel is a section named by an `h2` with the traveller's name; on a phone, selecting a row moves focus to it.
- **Files:** `front-end/components/app/partner/orders-view.tsx`, `front-end/app/globals.css`.

### P2-1 One colour rule for scores and warnings

- Scores everywhere follow the thesis rule (ch3, UI section): 80 and up green, below 80 gold, unrated grey "–". New helper `scoreTag()` next to `scoreTone()`; used on compare, the dashboard's plan-performance table, the agency's plans list, the editor preview, and (as `scoreTone`) the plan card's badge. The plan page's area bars warn below 80 (was 90); the dashboard table warned below 90.
- The editor flags a promise's score only when it is under 85 **and** has at least 3 ratings (the dashboard's gap rule).
- Warnings that were blue are now dark gold (`--color-cta-800`) with an alert icon or a warning word: few seats left, the worst value on compare, the editor's map warning, low claim score, "resets", the preview's con, failing checklist lines, the reviewer's note on the plans list, "operator not verified", an unhealthy agency. "Unsaved changes" on the dark editor bar is light gold. Blue stays for the route line, the "awaiting review" tile and trip step 4 (these now use `--color-accent`).
- **Files:** `front-end/lib/utils.ts`, `components/app/compare/compare-view.tsx`, `partner/overview-view.tsx`, `partner/plans-list-view.tsx`, `partner/plan-editor.tsx`, `plan-card.tsx`, `plan/plan-page-view.tsx`, `plan/booking-widget.tsx`, `admin/review-queue-view.tsx`, `admin/operator-health-view.tsx`, `trips/trip-view.tsx`, `front-end/app/globals.css`.

### P2-2 Plan page: explain the score

- Under the area bars a "How is this scored?" disclosure: "After the trip, verified travellers rate every promise and every stated downside: as described (100), partly (50) or not as described (0). The score is the average, so honest downsides help it. Placement can't be bought."
- Cons now show their rating like pros: "detail — Confirmed by N% of ratings".
- On a phone the score breakdown appears right under the pros and cons (not at the bottom of the page); on a desktop only in the side column.
- **Files:** `front-end/components/app/plan/plan-page-view.tsx`.

### P2-3 Search: every active filter, announced count

- Above the results title a chip for each filter in force, including the hero's "Days" choice ("Days: 1–3 ×", "10-30" shows as "10+"), month, region, score, max price (under $3,000), difficulty, each sleeping type, deal-breaker and operator. Each chip is a link to the same search without that value ("Remove: …" for screen readers).
- The result count is announced to screen readers after every filter change; while the new results load, the list is dimmed and marked busy.
- On a phone the open filter rail ends in a sticky "Show N plans" button that closes the rail and scrolls to the results heading.
- **Files:** `front-end/components/app/search/search-view.tsx`, `front-end/app/globals.css`.

### P2-4 Booking card controls

- The stepper buttons are "Fewer travellers" / "More travellers"; the count is announced when it changes. "−" is disabled at 1 and "+" at the departure's free seats or the plan's maximum group, whichever is smaller, with the hint "Max {n} on this date". "+ 3" now reads "Show 3 more dates".
- **Files:** `front-end/components/app/plan/booking-widget.tsx`.

### P2-5 Compare

- Column headers show the plan title (in the current language) with the operator under it, both linking to the plan. A new "Cons — stated by the operator" row lists up to three cons per plan, then "+N". Row labels are row headers and stay in place while the table scrolls sideways on a phone. The best value per row is green, bold and ticked; the worst is dark gold; both are also named ("best in this row", "weakest in this row") for screen readers. Every column's Book button is the gold CTA (previously only the first).
- **Files:** `front-end/components/app/compare/compare-view.tsx`, `front-end/app/globals.css`.

### P2-6 Trip page: one message per state

- Title and lead by stage: paid by card/QPay → "Your seats are booked, {name}." / "Payment received and held by itours. {op} will confirm and introduce your guide within {h} hours. Order {code}." (this matches My trips' "Paid · awaiting operator"); confirmed or travelling → "Your trip is confirmed, {name}." / "{op} has confirmed your trip. Your guide: {guide}. Order {code}."; completed → "Welcome back, {name}." with a "Rate this trip" button while it can still be rated; cancelled → grey X, "You cancelled this booking." or "{op} cancelled this trip and refunds you in full.", and "Find another trip".
- A wrong order code (`/trips/ITR-NOPE`) or a failed checkout load shows the normal header, the message and a way back (My trips / back to the plan); loading shows "Loading…" under the header.
- **Files:** `front-end/components/app/trips/trip-view.tsx`, `front-end/app/trips/[code]/page.tsx`, `front-end/app/checkout/[slug]/page.tsx`.

### P2-7 Plan editor: where the publish blockers are

- A tab that holds a failing required check shows a small gold alert icon (and "has things to fix" for screen readers). Each checklist line is a button that opens the tab that fixes it. The tabs follow the ARIA tabs pattern (←/→ move between them; the content is a labelled tab panel). On a phone a line under the tabs, "{n} things to fix before publishing", jumps to the checklist.
- Mapping: Basics ← title/region/season, Mongolian title; Itinerary ← days, drive times; Pros & cons ← pros, cons; Pricing ← price, departure; Photos ← photos.
- **Files:** `front-end/components/app/partner/plan-editor.tsx`.

### P2-8 Plan editor: protect unsaved work

- With unsaved edits, closing or reloading the tab brings up the browser's own prompt, and the "← Trip plans" link asks "You have unsaved changes. Leave without saving?". Known limit: the sidebar links are not guarded (the App Router has no API to block a navigation).
- Removing a pro or con, a day or a photo shows a toast with Undo, which puts the item back in the same place; for a rated line: "Removed “{text}”. Its {n} ratings are deleted when you save."
- **Files:** `front-end/components/app/partner/plan-editor.tsx`.

### P2-9 Admin review queue

- Each item has "Check the plan here", which expands its cons, the number of pros, the longest drive day, hot-shower nights and the first four photos, without leaving the page. "Approve" is always shown; when it can't be used it is disabled and the line under it says why ("Can't approve yet: …", including "operator not verified"). The fix note has a visible label "Note to the operator" and "Request fixes" stays disabled while it is empty. Photo alt text is the plan title. On a phone the note field takes the full width.
- **Files:** `front-end/components/app/admin/review-queue-view.tsx`, `front-end/app/globals.css`.

### P2-10 Orders inbox: values and phone layout

- The Value column shows USD with ₮ under it for every order (it mixed currencies). The payment method is translated ("card", "QPay", "bank transfer" / "карт", "QPay", "дансаар"). On a phone the Pax and Value columns fold into a line under the plan, so Traveller, Plan and Status fit; the detail panel has "Back to orders", which returns focus to the selected row.
- **Files:** `front-end/components/app/partner/orders-view.tsx`.

### P2-11 Bilingual gaps

- Mongolian plan titles (when written) in the inbox, admin queue, editor header and preview, the plans list and the dashboard. The dashboard's titles come from the API, which now picks `titleMn` when the request is in Mongolian (same rule as the front-end's `pick`). The inbox search also matches Mongolian titles.
- No English-only accessible names remain: the day reorder arrows ("Move day {n} up"), the booking stepper, the language switch (a named group; each button carries `lang` and the language's own name, "Монгол" / "English"), and the dialogs' close button ("Хаах" in МН).
- Hours use "{n} h" / "{n} цаг" (editor drive times, compare, dashboard reply time, agency health table).
- **Files:** `front-end/components/app/partner/orders-view.tsx`, `admin/review-queue-view.tsx`, `partner/plan-editor.tsx`, `partner/plans-list-view.tsx`, `partner/overview-view.tsx`, `compare/compare-view.tsx`, `admin/operator-health-view.tsx`, `language-toggle.tsx`, `front-end/components/ui/dialog.tsx`, `back-end/src/controllers/operator/operator.controller.ts`, `back-end/src/graphql/resolvers/operator/operator.resolver.ts`, `back-end/src/controllers/booking/booking.controller.ts`.

### P2-12 Touch targets (WCAG 2.5.8)

- Icon buttons (×, ▲/▼) are at least 24×24 px; the reorder arrows are larger and spaced; photo actions are 24 px tall; ghost text buttons ("Add a pro", "Show 3 more dates") are at least 24 px tall; the landing hero's dots are 24×24 buttons around the same 9 px dot. On phones the filter chips are larger.
- **Files:** `front-end/app/globals.css`, `front-end/components/app/partner/plan-editor.tsx`, `front-end/components/app/plan/booking-widget.tsx`.

### P2-13 Traveller flow on a phone

- The plan page has a Save button on phones; the phone menu lists "Saved" and "My trips" for a signed-in traveller; the bottom book bar shows the date picked in search; the book bar pads itself clear of the iPhone home indicator; checkout's bar shows "Step 2 of 3 · Payment" / "Алхам 2/3 · Төлбөр".
- Note: for the safe-area padding to work on iPhones the page now declares `viewport-fit=cover`.
- **Files:** `front-end/components/app/plan/plan-page-view.tsx`, `front-end/components/app/site-header.tsx`, `front-end/components/app/checkout/checkout-view.tsx`, `front-end/app/globals.css`, `front-end/app/layout.tsx`.

### P3-1 Operator dashboard

- "{n} orders need your attention" is a link to the orders inbox (which opens on Needs action). The weekly chart has a text alternative listing the twelve weeks' dates and seats.
- **Files:** `front-end/components/app/partner/overview-view.tsx`.

### P3-2 Guests can find Save

- A signed-out visitor sees "Save" on results and plan pages; it leads to sign-in and back to the same page. Agency and staff accounts still see nothing.
- **Files:** `front-end/components/app/save-button.tsx`.

---

## 4. Strings removed

- `trip.bankDetails` (split into `trip.bank`, `trip.bankName`, `trip.account`, `trip.bankAccount`, `trip.recipient`, `trip.bankRecipient`, `trip.amount`, `trip.reference`).
- `trips.confirmCancel` (the two-click cancel is replaced by the dialog).

## 5. Screenshots

In `docs/screenshots/`, taken on 2026-11-20 against a freshly seeded database, with headless system Chrome. Desktop shots are the 1440×900 viewport in English; the phone sheet is in Mongolian, like the old set. They replace the old sand/copper `thesis/scr-*` images; the old ones were crops, so the framing is wider.

| File | Shows |
|---|---|
| `scr-home.jpg` | Landing page, hero and search (guest). |
| `scr-search.jpg` | `/search?q=Gobi`: filter rail, results, the guest "Save" button. |
| `scr-plan.jpg` | Plan page at "Route": the route map, the booking card ("Show 3 more dates", stepper) and the score panel with "How is this scored?". |
| `scr-checkout.jpg` | Checkout, card selected, the new escrow lead text. |
| `scr-confirm.jpg` | `/trips/ITR-7F2K41`, the card-paid booking: "Your seats are booked, Elena." (it used to say "confirmed"). |
| `scr-held.jpg` | **New, extra.** A bank-transfer booking right after checkout: the clock icon, "Your seats are held", the gold "Pay by" panel with Ulaanbaatar time, the bank lines with Copy buttons. |
| `scr-review.jpg` | My trips, the review form: "What the plan promised" and "Downsides the operator warned about". |
| `scr-dashboard.jpg` | Agency overview (Nomadica, `bat@nomadica.mn`). |
| `scr-orders.jpg` | Orders inbox, Needs action: "Transfer pending · N h M min left" tags; USD with ₮ under it. |
| `scr-editor.jpg` | Plan editor, Pros & cons tab. |
| `scr-admin.jpg` | Admin review queue: Approve disabled with its reason, labelled fix note, "Check the plan here". |
| `scr-mobile.png` | Three 390×844 phone frames, Mongolian: landing; plan page at "Маршрут" with the book bar; search with the filter rail open. |

## 6. Verification

Run on 2026-11-20. Postgres 16 in Docker on port 5433, API on 8080, Next dev server on 3000; all stopped afterwards (the Postgres container is stopped with its data kept).

| Check | Result |
|---|---|
| `pnpm typecheck` (back-end) | pass |
| `pnpm typecheck` (front-end) | pass |
| `pnpm lint` (front-end) | pass, "No ESLint warnings or errors" |
| `booking.controller.check.ts` (seat race, prices, payout, the new hold checks) | pass |
| `plan.controller.check.ts` (score maths) | pass |
| `grep -rn "color-accent-[78]00" components` | only `plan/route-map.tsx` |
| `grep -rn 'aria-label="[A-Z]' components` | no matches |

**Browser walk** (playwright-core with system Chrome; `scratchpad/pw/walk.js`), 66 checks on the "Done when" lists. 64 passed on the first run. The 2 failures:
- The phone "Show N plans" button scrolled to the results heading before the rail had closed, so the heading ended up above the viewport. This was a real bug: the rail now closes first (`flushSync`), and the check passes.
- "Review in place shows cons and photos" ran on a queue item that has no cons and no photos (the plan is incomplete, which its tags say). On a complete plan the check passes.

What was walked: the bank button label; the held trip page (pay-by panel, Ulaanbaatar time, Copy giving digits only for the amount and no spaces for the account no., no voucher, no green box, clock icon); the same deadline with the browser clock set to Europe/Paris (UTC+1); the countdown dropping a minute within 60 s and the open page turning into the expired state without a reload (deadline moved to 100 s ahead in the database); My trips held line in gold-800, the expired tag and "Book again"; the inbox held tag, the expired order under Cancelled with "Hold expired · unpaid" and no "Transfer received"; the full-departure alert, disabled pay button and link; the operator's disabled pay button; the white header focus ring and the search pill ring; the review form's headings, counter, inline missing list and focus; the three dialogs (refund wording, Esc, focus return); keyboard selection in the inbox; the days chip and its removal; the phone book bar date, Save, menu and checkout step; the editor's arrow keys and checklist; the admin queue's Approve and fix note; the dashboard link and chart label; Mongolian dashboard titles from the API; and no raw dictionary keys on 16 pages (guest, traveller, agency, staff) in both МН and EN.

**Not verified:** screen-reader announcements by an actual screen reader (only the markup: `role="status"`, `aria-live`, names); Lighthouse/axe audits; iOS Safari's safe area; computed contrast in the browser (ratios are from the tokens, as in the spec).
