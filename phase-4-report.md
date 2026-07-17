# Phase 4 — Fixes Applied

**Date:** 17 July 2026
**Scope:** Implementation of the Phase 1 to 3 audit findings, per the Phase 4 brief.
**Tax year basis:** all figures now stated as UK rules **as at 6 April 2026** (2026/27).

## Guardrail compliance

| Guardrail | Status |
|---|---|
| v2 is the real product, not deleted/gutted/rewired | **Held.** `v2.html` 1,587 ln, `v2-calculator.js` 462 ln, `v2-success.html` 1,857 ln. All intact and wired as before. |
| **DELETE NO FILES** | **Held.** `git status` shows zero deletions. Nothing removed. |
| Do NOT change payment behaviour; Stripe stays sandbox | **Held.** No checkout wired. `grep` for `checkout.sessions.create` / `new Stripe(` returns nothing. Simulation intact (5 markers in `v2.html`). Webhook logic untouched apart from the two domain strings Section 4 required. |
| Do NOT delete the `_new` funnel | **Held.** All 8 pages present, hidden from search only. |
| British English, no em dashes | Held in all new copy. |
| Pull before starting | Done. Already up to date at `09a7e576`. |

**Verification:** `next build` passes clean. All 30 calculator cases pass their invariants. The PDF generates clean (no `NaN`, no `undefined`) across 7 household shapes. All routes return their expected status.

---

## 1. Calculator maths

Rewritten core in `public/v2-calculator.js`. Verified by executing the real shipped file against 28+ input sets, not by re-implementing it.

### 1.1 False personalisation claim — FIXED
`v2-calculator.js:409`. The paywall told every visitor *"Based on your income level, we recommend the Complete Guide"* while `isComplete` was hardcoded true. Replaced with *"Our Complete Guide covers your situation…"*, which claims no personalised recommendation. The boundary was **not** re-enabled, as instructed. The `showPaywall` comment now records why the copy must not claim income-based routing.

### 1.2 Over-£100k users shown benefits they cannot have — FIXED
`v2-calculator.js:251-256`. `displayTfc` and `displayThirtyHours` now require `!over100k` as well as the work test. Over the cliff both are **£0**.

`over100k` is now tested on **adjusted net income** (`:238`), not gross, so existing pension contributions count. New `renderCliffNote()` (`:374`) explains the £0 and states what the contribution would unlock, kept out of the headline.

| Case | Before | After |
|---|---|---|
| £130k, one child aged 3, £1,250/mo | **£22,200** (vs a £15,000 bill) | **£17,871** (pension relief only; TFC £0, hours £0) |
| £110k with £1,000/mo existing pension | Excluded (gross used) | **Qualifies** — ANI £98,000 |

The second row is a bonus fix: the old code used gross income, so it wrongly denied eligibility to anyone who had already sacrificed under the cliff.

### 1.3 Magic 0.55 funded-hours ratio — FIXED
`v2-calculator.js:36-38, 244`. Replaced with an entitlement model: `30 hrs × 38 weeks × £6/hr = £6,840 per eligible child`, **capped at actual childcare spend**. The £6/hour is a documented assumption (`FUNDED_HOURLY_RATE`) flagged in `GO-LIVE-CHECKLIST.md` for annual review.

£100k/month childcare: **£660,000 → £6,840**.

### 1.4 Flat-rated pension relief — FIXED
`v2-calculator.js:16-24` (`RELIEF_BANDS`) and `:71` (`pensionReliefOn`). Relief is now integrated band by band from the top of income down, with the **45% additional rate added** (it did not exist anywhere before). Bands: 45%+2% above £125,140; 60%+2% in £100,000–£125,140 (the 60% carries the personal allowance restoration); 40%+2% in £50,270–£100,000; 20%+8% in £12,570–£50,270. The self-employed get Income Tax only, no NI.

**£130k earner contributing £30,001: £12,600 → £17,871**, which matches the band-by-band figure in the audit exactly.

Also corrected: employee NI in the basic-rate band was 12%, now **8%**.

**Consistency.** `v2-success.html:548` and `:592-640` now **read** every figure from the stored result instead of recomputing at a flat rate. The worked example (Section 3) was recomputed with the same model: **£14,570** relief on a **£23,501** top-up, and the card now shows the blended effective rate actually achieved. The report can no longer contradict itself.

### 1.5 No annual-allowance cap — FIXED
`v2-calculator.js:58` (`annualAllowanceFor`) and `:281`. The recommended contribution is capped at the annual allowance (£60,000, tapering above £260,000 to a £10,000 floor), less any existing contribution. Where the cap bites, `allowanceExceeded` is set and surfaced rather than silently recommending an unlawful contribution.

£10m income: **£4,164,144 → £4,700**, with the allowance flagged.

### 1.6 Income-splitting magic number — FIXED
`v2-calculator.js:335`. The flat `3000` is gone. Now derived from the inputs: the movable amount across the £50,270 threshold × the 20% rate differential. £70k + £40k gives **£2,054**, not £3,000. Labelled illustrative in the code, since realising it needs a lawful mechanism this calculator does not assess, and it stays out of the headline total.

### 1.7 £100,001 cliff-edge on pension relief — FIXED
`v2-calculator.js:270-274`. The cause was two different formulas either side of £100k. Now one model: the recommended contribution is `max(amount needed to clear the cliff, illustrative amount)`.

| Income | Pension relief before | After |
|---|---|---|
| £100,000 | £1,210 | **£1,210** |
| £100,001 | **£1** | **£1,210** |

The remaining step in the **total** at £100,001 is the real UK cliff edge, which Section 1.2 requires to be shown. It is now explained by `renderCliffNote()` rather than left looking broken.

---

## 2. Disclaimer pack

| Ref | Placement | Where |
|---|---|---|
| 2.1 | T&Cs "Important Information", verbatim | `public/terms.html:23-26` (section renamed from "Educational Content Only"); mirrored in `app/terms_new/page.tsx:53-61` so the two sets do not drift |
| 2.2 | Calculator result screen, directly under the headline number | `public/v2.html:1015`, styled `public/v2-styles.css:546` |
| 2.3 | Top of the PDF report | `public/v2-success.html:331`, styled `:24` |
| 2.4 | At the buy button | `public/v2-calculator.js` paywall, `.paywall-purchase-note`, styled `v2-styles.css:580` |
| 2.5 | Adviser call, introducer framing | `public/v2-success.html:427`; `public/terms.html:39-41`; `app/advisor-booking_new/page.tsx:193` |

**Prominence.** 2.2 and 2.3 are `0.9375rem` body text at `#1E293B` on an amber panel, not 11px `#94A3B8` grey, and both sit **above** the action steps rather than below them. The existing footer disclaimers were left in place.

---

## 3. "Sarah" case study — relabelled, not removed

`public/v2-success.html:852-857`.

- Heading: *"How one parent earning £130k annual salary was able to claim 30 hours childcare"* → **"Worked example: a £130k earner with one child under 5"**. The name **Sarah** is gone; every sentence is now in the third person about a hypothetical parent. Verified: the string `Sarah` no longer appears in any generated PDF across 7 test cases.
- Disclaimer added **inline, immediately beside the example** (`:853`), verbatim: *"Illustrative example only. Not a real customer. Figures are for illustration and do not represent a guaranteed or typical outcome."*
- **Figures corrected to match Section 1.4**: the top-up was £23,600 → **£23,501**; the total into the pension £30,100 → **£30,001**; and it now states the **£14,570** of relief at the **62%** effective rate, explaining that the £5,028 personal allowance restoration is *inside* that rate rather than added on top. That was the specific self-contradiction in the audit.

---

## 4. Domain and GDPR consolidation

Everything consolidated to **the100kparent.com**. No `.co.uk` or `vercel.app` remains as a contact or canonical domain (verified by grep).

| File:line | Before | After |
|---|---|---|
| `public/cookies.html:42` | `privacy@the100kparent.co.uk` | `privacy@the100kparent.com` |
| `public/privacy.html:61` | `privacy@the100kparent.co.uk` | `privacy@the100kparent.com` |
| `public/refund.html:32` | `hello@the100kparent.co.uk` | `hello@the100kparent.com` |
| `public/refund.html:40` | `hello@the100kparent.co.uk` | `hello@the100kparent.com` |
| `public/terms.html:31` | `hello@the100kparent.co.uk` | `hello@the100kparent.com` |
| `app/api/webhook/route.ts:73` | `https://the100kparent-unified.vercel.app/...` | `https://the100kparent.com/...` |
| `app/api/webhook/route.ts:74` | `https://the100kparent-unified.vercel.app/...` | `https://the100kparent.com/...` |

The `_new` pages already used `.com` and were left alone. **The GDPR contact is now a single address, `privacy@the100kparent.com`, consistent across both products** (13 references). Remaining: `hello@` (7), `support@` (4), all `.com`.

**Flag:** the webhook's two URLs now assume `the100kparent.com` is the live domain. That is on the go-live checklist to confirm.

---

## 5. Data and display bugs

### 5.1 Two contradictory number sets — FIXED
`v2-calculator.js:305-320` now writes **one** set. The legacy fields (`tfc`, `salary`, `minSaving`, `maxSaving`, `thirtyHours`) are gone, along with the superseded functions that produced them (`calculateTFC`, `calculateSalarySacrifice`, `calculate30HoursValue`, `check30HoursEligibility`).

Every legacy fallback in `v2-success.html` is removed (`:548`, `:294-296`) — verified by grep for `r.salary`, `?? Math.round`, `0.55`.

Added `schemaVersion: 2` (`v2-calculator.js:53`). `readResults()` (`v2-success.html:263`) **refuses a blob from an older version** and sends the user back to the calculator, rather than part-reading it. That is what structurally prevents a stale result rendering the old, 2.75× larger number.

### 5.2 "£NaN" headline — FIXED
`v2-success.html:263-284`. `readResults()` validates that all seven required numeric fields are finite and that `ages` is an array, before anything renders. Anything else is rejected to the error state. Verified: no `NaN` in any generated PDF across 7 cases.

### 5.3 Infinite spinner on corrupt data — FIXED
`v2-success.html:265-269`. `JSON.parse` is wrapped in try/catch. Corrupt data now shows *"Something went wrong reading your results"* with a link back, explaining we would rather show nothing than the wrong numbers. Previously the uncaught throw killed the script and left the "Preparing your report…" spinner running forever.

### 5.4 Three TFC formulas — CONSOLIDATED TO ONE
The two in `v2-calculator.js` collapsed into one (`:254`): 20% of spend after funded hours, capped £2,000 × children. `app/booking_new/page.tsx:74-81` now uses the same rate and per-child cap via shared constants (`:18-19`).

**Note on `_new`:** its questionnaire never asks how many children there are, so it assumes **one** (conservative). The old flat £4,000 cap silently assumed two. It also carried the same bug as 1.2 — both its routes are by definition over the £100k cliff, yet it showed TFC as a current saving. It is now labelled *"only once your income is below £100,000"*.

### 5.5 £19 / £49 pricing — £19 REMOVED FROM LIVE COPY
| File:line | Change |
|---|---|
| `public/v2-success.html:245-248` | Tier/price hardcoded to Complete / £49; the Essential branch that could render "£19" is gone |
| `public/v2-success.html:549` | Same in the PDF generator |
| `public/v2.html:1211-1212` | Test-flow panel: Essential/£19 → Complete/£49 |
| `public/v2.html:1379-1381` | `openTestFlow` no longer emits Essential/£19 |
| `app/home_new/page.tsx:124` | "From £19." removed |
| `app/home_new/page.tsx:305` | "Tax guides from £19 · " removed |

---

## 6. Dead links and broken nav

### 6.1 "Get Complete" CTA — FIXED, with a correction to the audit
`public/v2.html:1101`. `href="#"` → `href="#calculator"`.

**Correction:** the Phase 2 audit called this button fully dead. That was **wrong**. JS at `v2.html:1427` binds a click handler that calls `preventDefault()` and opens the payment simulation, so the button did reach the sandbox buy flow. The `href` was only the no-JS fallback, and it is that fallback which is now fixed. The JS binding is untouched, so payment behaviour is unchanged per Guardrail 3. The label was left as "Get Complete" so it does not misdescribe what the click does.

### 6.2 `#testimonials` scrollspy — FIXED
`public/v2.html`. The scrollspy entry pointing at the non-existent `#testimonials` section is removed. Remaining entries (`#how-it-works`, `#calculator`, `#pricing`) all resolve.

### 6.3 Calendly — LEFT 404, TODO ADDED (as instructed)
Not touched. `TODO: Calendly re-signup pending` at `public/v2-success.html:425` and `app/booking_new/page.tsx:11-13`, both cross-referencing `GO-LIVE-CHECKLIST.md`.

---

## 7. `_new` funnel — hidden from search, not deleted

- **`noindex` on all 8 pages.** Four are client components and cannot export `metadata`, so a `layout.tsx` was added to each of the 8 `_new` directories — uniform, and it works for client and server pages alike. **Verified at runtime:** all 8 serve `<meta name="robots" content="noindex, nofollow">`; the live site serves none.
- **`public/robots.txt` added**, disallowing all 8 `_new` paths plus `/v2-success.html` (it renders from the buyer's own browser storage and is meaningless to a crawler), with `Allow: /`.
- **Logo trap closed.** The logo on 6 `_new` pages linked to `/`, dropping users mid-funnel into the live product with a different price and no way back. All now point to `/home_new`. Verified: no `_new` page links to `/`.
- **No `_new` file deleted.**

---

## 8. Go-live checklist — CREATED, NOT ACTIONED

`GO-LIVE-CHECKLIST.md`. Contains every item from the brief, plus items surfaced during this work: VAT, proof of purchase, the 14-day waiver capture, the `£6/hour` assumption and annual tax-constant review, and confirming `the100kparent.com` is the live domain. **Nothing in it has been done.**

---

## 9. CONFIRM-DO-NOT-DELETE — flagged for the team, nothing removed

| Item | Path | Note |
|---|---|---|
| Six orphaned testimonial images | `public/testimonial-{emma,sarah,james,4,5,6}.jpg` | Referenced zero times. All 6 still present. |
| Vestigial rewrites | `vercel.json` — `/privacy`, `/refund`, `/terms-old` | All return 200 in production; nothing links to them. Rewrites block intact. |
| Every `_new` file | `app/*_new/` | All 8 pages present, now `noindex`. |

---

## Flagged rather than actioned

1. **Calendly 404s** (6.3) — left broken with TODOs, as instructed. Both links still 404.
2. **`_new` prices that cannot be bought** — `app/start_new/page.tsx:60` ("From £19") and `app/guides_new/page.tsx` (£19/£24/£29/£49 with no `onClick` and no guide files). The brief named only `home_new`'s "From £19", which is fixed. I did not strip the `_new` catalogue because that is really the finish-or-kill decision, and half-gutting it would leave it in a worse state than either outcome. On the go-live checklist.
3. **`_new` questionnaire data still goes nowhere** — `questionnaire_new/page.tsx:110` writes to `localStorage` only, while `booking_new/page.tsx` still tells the user their PFA has reviewed it in advance. Fixing it means choosing a destination, which is a business decision. On the go-live checklist.
4. **The `_new` hardcoded savings ranges** (`booking_new/page.tsx:49-61`: `5028`, `6285`, `3000–8000`, `4000–12000`) are still magic numbers, like the £3,000 fixed in 1.6. Out of the brief's scope; flagged.
5. **Meta description claim** — `public/v2.html:7` advertises "could save up to £17,000/year". Not derived from anything and not in scope; worth checking against the corrected model.
6. **The £6/hour funded-hours rate** is my documented assumption, not a verified published figure. Needs confirmation.
7. **No test framework still.** The invariants I ran live in a scratchpad, not the repo, so nothing stops these regressing. This remains the single highest-value preventative item.

## Not verified

- **Real browser rendering.** The calculator was executed against a stub DOM and the PDF generator in isolation. Logic and values are verified; visual layout, mobile rendering and real PDF print output are not. Someone should look at the result screen and the report on a phone, particularly the new disclaimer panel and cliff note.
- **Whether `the100kparent.com` is the domain the business actually uses.** Consolidated as instructed.
- **Legal adequacy** of any disclaimer wording. Supplied text used verbatim; no legal review.
