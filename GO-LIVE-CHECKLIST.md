# GO-LIVE CHECKLIST

**Nothing in this file has been actioned.** It exists so that the things which must happen before real payments and real users are not forgotten.

The site is currently in a **deliberate sandbox state**: Stripe is not wired, the payment simulation is intentionally in place, and the Calendly links are known 404s pending re-signup. That is by design for now. This list is what has to be true before that changes.

Last reviewed: 17 July 2026 (Phase 4). See `phase-4-report.md` for what was fixed, and `audit-report.md` for the findings behind it.

---

## Payments

- [ ] **Remove the payment simulation and wire live Stripe checkout** (currently sandbox by design)
- [ ] **Remove all test-only UI from production:**
  - [ ] The "Test Flow" nav button — `public/v2.html` (desktop nav) and (mobile nav), plus the `.nav-test` style block
  - [ ] The `testSimulatePayment` button
  - [ ] The "Stripe payment screen skipped in test mode" copy
  - [ ] The "In production, Stripe checkout would appear here / simulate a successful payment" copy
  - [ ] The whole `#testFlow` overlay and its `openTestFlow` bindings on the pricing CTAs
- [ ] **Capture the 14-day cancellation waiver at checkout.** `public/terms.html` section 2 states the buyer agrees delivery begins immediately and the statutory 14-day right is lost. That consent has to be actively captured at the checkout step, not just asserted in the terms.
- [ ] **Confirm VAT handling.** `public/terms.html` says prices "include any applicable VAT". Nothing currently computes, records or reports VAT.
- [ ] **Give the buyer proof of purchase.** There is no database and no order record. Once money is taken there must be a receipt, a way to re-download the report, and something to refund against for the advertised 30-day guarantee.
- [ ] **Verify the webhook end to end once checkout exists.** `app/api/webhook/route.ts` is correct but has never fired, because nothing creates a checkout session. Confirm `STRIPE_WEBHOOK_SECRET` and `LOOPS_API_KEY` are set in Vercel, and that the Loops purchase email actually sends.
- [ ] **Re-check the webhook's URLs.** They now point at `https://the100kparent.com` (Phase 4 changed these off the vercel.app domain). Confirm that is the live domain before launch.

## Adviser call

- [ ] **Swap in the real Calendly link once re-signup is complete** (replace the current 404s). Two places, both marked `TODO: Calendly re-signup pending`:
  - [ ] `public/v2-success.html` — the "Schedule Your Consultation" button in the paid report
  - [ ] `archive/new-funnel/booking_new/page.tsx` — `CALENDLY_URL`, rendered in an iframe (archived 17 July 2026; only relevant if the funnel is revived)
- [ ] **Confirm the introducer arrangement with the FCA-regulated adviser (Lasitha Wijeratna) is properly documented**, and that referral-fee terms comply with FCA rules
- [ ] **Confirm the adviser can actually meet demand** before the £49 product is sold on the strength of the call

## Legal

- [ ] **Solicitor with FCA awareness reviews the T&Cs, disclaimers and adviser-call framing.** Phase 4 added the master disclaimer, the introducer framing, and prominent disclaimers on the result screen and at the top of the report. None of it has had legal review.
- [ ] **Confirm the £6.42/hour funded-hours rate** in `public/v2-calculator.js` (`FUNDED_HOURLY_RATE`, the 2026/27 national average for 3-4 year olds) against the published rate for the year, and re-check every tax constant at the start of each tax year: `RELIEF_BANDS`, `ANI_CLIFF`, `TFC_CAP_PER_CHILD`, `MIN_INCOME_TEST`, `AA_STANDARD`.
- [ ] **Confirm the "Illustrative example" worked case** in the report is acceptable as written now that it is no longer attributed to a named person.

## Products and pricing

- [ ] **Decide finish-or-kill on the `_new` funnel.** **Archived 17 July 2026** — moved to `archive/new-funnel/`, so its URLs now 404 and it is no longer reachable. Nothing was deleted. The decision is still open, and the four things that would have to be fixed to revive it are listed in `archive/new-funnel/ARCHIVE-README.md`: the 404 booking embed, the questionnaire that transmits nothing, the four dead "Get Guide" buttons, and the hardcoded savings ranges.
- [ ] **Verify no page references a price that cannot be bought.** Phase 4 cleared the £19 references from the live site and `home_new`. The remaining ones are now archived rather than live, so they cannot mislead a customer today, but they must be fixed before the funnel is ever revived:
  - [ ] `archive/new-funnel/start_new/page.tsx` — "From £19" for the guides route
  - [ ] `archive/new-funnel/guides_new/page.tsx` — £19 / £24 / £29 / £49 guides with no purchase path and no guide files in the repo
  - [ ] `public/v2.html` — the commented-out Essential card still contains £19 (harmless while commented, must be correct if uncommented)
- [ ] **Decide whether the Essential (£19) tier returns.** If it does, restore the income-based routing in `public/v2-calculator.js` (see the comment above `isComplete`) and only then may the paywall claim a recommendation based on income.
- [ ] **Send the questionnaire somewhere** if `_new` is revived. It writes to `localStorage` and nothing else.

## Before flipping the switch

- [ ] `next build` passes clean
- [ ] `/` serves the v2 site with no `/v2` in the URL
- [ ] Buy a report end to end with a real card, on a real phone, and read the PDF
- [ ] Confirm the receipt arrives and the report can be re-downloaded
- [ ] Book the adviser call end to end and confirm it lands in a real calendar
- [ ] Re-run the checks in `WAKING-UP-CHECKLIST.md`
