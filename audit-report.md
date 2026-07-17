# The 100k Parent — Pre-Launch Health Test

**Date:** 17 July 2026
**Scope:** Whole-product health test — calculator correctness, calculator→PDF→copy consistency, payment path, hollow/placeholder hunt, two-product coherence, journeys, UX, legal/copy risk.
**Method:** Read-mostly audit against the actual code. No previous audit, changelog or code comment was trusted. Every claim below was verified by executing the shipped code or by curl against the live production deployment.
**Changes made to the product:** **NONE.** No product code, copy, numbers, visuals, routing or payment logic was touched. Nothing was deployed by this audit.

> **Note on this file:** this replaces a previous `audit-report.md` (dated 1 July 2026, scope: security / UX / GDPR / legal). It is preserved in git history and recoverable with `git show b3426d52:audit-report.md`. It covered a different scope and is not superseded on those topics.
>
> **It is, however, already factually stale** — it states that `app/page.tsx:5` redirects `/` to `/v2.html`. That file no longer exists; the root is now served by a rewrite in `next.config.ts:19`. This is precisely why the brief said not to trust prior audits, and it is a good argument for treating this report the same way in a few weeks' time.

---

## 0. What this project actually is (established, not assumed)

This is **two products in one repo, on two different stacks**. This matters for reading everything below.

| | Live report product | `_new` advisor funnel |
|---|---|---|
| **Stack** | Plain static HTML/CSS/JS in `public/` — **not React** | Next.js App Router (`app/`) |
| **Entry** | `/` | `/home_new`, `/start_new` (unlinked from `/`) |
| **Core files** | `public/v2.html` (1,589 ln), `public/v2-calculator.js` (367 ln), `public/v2-success.html` (1,773 ln) | 8 page components |
| **Legal pages** | `public/terms.html`, `public/privacy.html`, `public/refund.html`, `public/cookies.html` | `app/terms_new/`, `app/privacy-policy_new/` |
| **Contact domain** | `the100kparent.co.uk` | `the100kparent.com` |
| **Product** | Calculator → paywall → £49 PDF report | Questionnaire → £60 PFA booking / £19–£49 guides |

**Routing.** `next.config.ts:19` rewrites `/` → `/v2.html` (a rewrite, not a redirect, so the URL stays clean). `next.config.ts:25-28` permanently redirects `/v2.html` and `/v2` → `/`. `vercel.json` adds platform-level rewrites for `/privacy`, `/refund`, `/terms-old`.

**Stack facts:** Next.js 16.2.3, React 19.2.4, Turbopack. **No test framework of any kind.** No database, no login, no AI calls.

**N/A — no DB/auth/AI.** Database/schema checks, row-level security, multi-tenant data bleed, per-user data isolation, and AI spend caps are all **Not Applicable**. This stack has none of them. There is no server-side persistence at all: all state is browser `localStorage`.

---

## PHASE 1 — SMOKE TEST

`next build` **passes clean**: compiled in 1.9s, TypeScript clean, 11 static pages, zero warnings or errors. **Zero 500s across every route.**

| Check | Result |
|---|---|
| Production build (`next build`) — the authoritative gate | **PASS** |
| `/` serves v2 site, no `/v2` in URL | **PASS** |
| `/v2.html` → `/`, `/v2` → `/` | **PASS** (308 permanent) |
| All 8 `_new` pages load | **PASS** |
| Live + `_new` legal pages load | **PASS** |
| `POST /api/webhook` unsigned → rejected 400 | **PASS** |
| 404 handling | **PASS** |

**Test artefact, not a bug:** `/privacy`, `/refund`, `/terms-old` 404 under local `next start` because `vercel.json` rewrites are platform-level. **Verified 200 on production** — these are fine. Noting only because nothing in the codebase links to those paths; they appear vestigial (Low).

---

## PHASE 2 — DEEP FUNCTIONAL SWEEP

### Method note

The calculator was tested by **executing the real `public/v2-calculator.js`** against a stub DOM (28 input sets: realistic spreads, boundaries, and edge cases). It was deliberately **not** re-implemented — a re-implementation would have hidden exactly the bugs listed below. The harness lives outside the repo and is not committed.

---

### A) CALCULATOR CORRECTNESS

#### A1 — CRITICAL — The £90k tier boundary does not exist
`public/v2-calculator.js:309` — `const isComplete = true;` is hardcoded. The income-based routing is commented out at `:306`.

**Evidence:** £89,999 / £90,000 / £90,001 produce **byte-identical output** (`displayTotal = £7,354` in all three).

**Real bug, and worse than a bug.** Hardcoding one live tier is a defensible business decision. But `:315` still tells **every** visitor: *"Based on your income level, we recommend the Complete Guide."* It is not based on their income level — it is based on nothing. This is a fabricated personalisation claim shown to 100% of users, and it is the kind of statement the CMA/ASA treat as a misleading commercial practice.

#### A2 — CRITICAL — Over-£100k households are shown benefits they are not eligible for
`public/v2-calculator.js:183,188` — `displayThirtyHours` and `displayTfc` are gated on `meetsWorkTest` only. **Neither checks the £100,000 ceiling**, even though `check30HoursEligibility()` (`:227,231`) correctly enforces it.

**Evidence — single parent, £130,000, one 3-year-old, £1,250/mo childcare:**
```
displayTotal = £22,200  (TFC £1,350 + salary £12,600 + 30hrs £8,250)
flags: over100k=true  has30Hours=false
annual childcare spend = £15,000
```
The user simultaneously sees `has30Hours=false`, the red over-£100k warning, **and** £8,250 of "funded hours" — on the same screen. The claimed saving (£22,200) **exceeds the entire childcare bill it is saving against (£15,000)**.

The code comment at `:168-173` says this is intentional — the benefits are "achievable" once a pension contribution drops income under £100k. But the headline reads *"You could save up to £22,200 a year"* with no precondition attached, and reaching it requires contributing **£30,001/year** into a pension first. **Real bug.** A regulator or an angry customer would not accept "achievable in principle" as a defence for an unconditional headline number.

#### A3 — CRITICAL — Funded hours are a magic ratio with no cap
`public/v2-calculator.js:183` — `displayThirtyHours = 0.55 × annualChildcare`.

55% of whatever the user types, unbounded and with no basis in the funded-hours entitlement.

**Evidence:** £100,000/month childcare → **£660,000** of "funded hours". Real entitlement ≈ 30 hrs × 38 weeks × ~£6/hr ≈ **£6,800/child**.

**Real bug.** Indefensible: the figure is not derived from the entitlement at all.

#### A4 — CRITICAL — Pension relief is flat-rated across tax bands; the 45% additional rate does not exist
`public/v2-calculator.js:160` — `pensionReliefRate = (higherIncome > 100000 && higherIncome <= 125140) ? 0.62 : higherIncome > 50270 ? 0.42 : 0.32`

Two defects: (1) the rate is picked from the **starting** income and applied flat across a contribution that spans several bands; (2) **there is no 45% additional-rate band anywhere in the file** — grep confirms no `0.45`, no `additionalRate`.

**Evidence — £130,000 earner contributing £30,001 to reach £99,999:**
```
Defensible relief (band-by-band): £17,871
  (£4,860 @ 47% [45% IT + 2% NI] + £25,140 @ 62% + £1 @ 42%)
Shipped calculator (flat 42%)   : £12,600
UNDERSTATED BY                  : £5,271
```
The gap is almost exactly `£12,570 × 40% = £5,028` — the personal allowance restoration, silently dropped for everyone above £125,140.

**Real bug, with a self-contradiction.** The same PDF card that prints *"Tax + NI saved on pension contribution £12,600 — 42% effective relief"* also runs the Sarah case study (`public/v2-success.html:772`) telling a £130k earner her personal allowance is *"worth over £5,000 in tax on its own"*. The report contradicts itself inside one card. Note this errs **downward** (under-promising), so it is less commercially dangerous than A2 — but it is still a wrong number in a paid report.

#### A5 — HIGH — No pension annual-allowance cap in the headline
`public/v2-calculator.js:156-166` — the required sacrifice is never capped at the £60,000 annual allowance (tapered above £260k).

**Evidence:** £10,000,000 income → `displayTotal = £4,164,144`, implying a £9.9m pension contribution.

`public/v2-success.html:596-597` **does** implement an annual-allowance check and warns the user. The calculator headline ignores it. **Real bug** (an absurdity guard, not a common path).

#### A6 — HIGH — `calculateIncomeSplitting` returns a flat £3,000 magic number
`public/v2-calculator.js:260` — returns a hardcoded `3000` whenever one partner is over £50,270 and the other under. Not derived from either income.

Currently dormant (it feeds `maxSaving`, and `displayResults` hides the savings range at `:277`), so it does not reach the user today. **Real bug, latent** — indefensible the moment it surfaces.

#### A7 — MEDIUM — £1 of relief at the threshold edge
£100,001 → `extraSacrificeYou = £2` → `pensionRelief = £1`. Headline drops £1,209 vs £100,000 (£7,354 → £6,145) for £1 more income. Arithmetically consistent, presentationally absurd.

#### A8 — LOW — A third, contradictory funded-hours formula
`public/v2-calculator.js:267` — legacy `calculate30HoursValue` returns `eligible × 15 × 1140` = **£17,100/child**, versus A3's `0.55 × annualChildcare`. Both stored. See B1.

#### A9 — **PASS** — Input validation is genuinely good
Zero income, empty income, negative income, no children, unselected age, blank partner income, and zero childcare are **all rejected** with clear, specific messages (`:109-136`). Pension contributions exceeding matching income are rejected (`:127`). Decimals handled without error. This is the strongest part of the calculator.

---

### B) CALCULATOR → PDF → COPY CONSISTENCY

#### B1 — CRITICAL — Every user carries two contradictory result sets in one localStorage blob
`public/v2-calculator.js:202-210` writes both legacy and `display*` fields.

**Evidence — single parent, £60,000, one 2-year-old, £800/mo:**

| Figure | legacy field | display field |
|---|---|---|
| Tax-Free Childcare | **£1,920** | **£864** |
| 30 funded hours | **£17,100** | **£5,280** |
| Headline total | **£20,230** (`maxSaving`) | **£7,354** (`displayTotal`) |

Same user, same click, both written. The success page prefers `display*` but **falls back to the legacy fields**: `public/v2-success.html:251` — `r.displaySalary ?? Math.round(r.salary || 0)`, and `:479-480` for TFC/hours. **Any stored result from before the `display*` fields existed renders the £20,230 number instead of £7,354** — a 2.75× overstatement in a paid report. **Real bug.**

#### B2 — HIGH — Three different Tax-Free Childcare formulas
| Location | Formula |
|---|---|
| `public/v2-calculator.js:188` | `min(childcareAfterFundedHours × 0.20, 2000 × numChildren)` |
| `public/v2-calculator.js:238` (legacy) | `min(min(annual, 10000 × n) × 0.20, 2000 × n)` |
| `app/booking_new/page.tsx:57` | `min(annual × 0.2, 4000)` — flat £4,000 cap, ignores child count |

Three implementations of one government rule. **Real bug** (drift risk realised).

#### B3 — HIGH — £49 is hardcoded in six places; £19 is unreachable but referenced in four
**£49:** `public/terms.html:27`, `public/refund.html:30`, `public/v2-success.html:231`, `public/v2.html:822`, `:1083`, `:1339`. No single source of truth.

**£19:** the Essential pricing card is commented out (`public/v2.html:1061-1077`) and `isComplete=true` makes the tier unreachable — yet £19 still appears in `public/v2-success.html:231`, `public/v2.html:1208`, `:1383`, and `app/home_new/page.tsx:124,305` ("From £19"). A price is advertised that **cannot be bought**.

#### B4 — HIGH — The PDF contradicts itself on pension relief
See A4. `public/v2-success.html:772` vs the calc table in the same card.

#### B5 — MEDIUM — Thresholds hardcoded throughout
`£100,000`, `£125,140`, `£50,270`, `£12,570`, `£10,158`, `£2,000/child` are each repeated across `v2-calculator.js`, `v2-success.html` and the `_new` pages with no shared constant. Every future tax-year update is a manual multi-file sweep with no test to catch a miss.

---

### C) PAYMENT PATH — **HARD FAIL TO LAUNCH**

#### C1 — CRITICAL — **There is no Stripe checkout. The site cannot take a single penny.**

The buy button links **directly to the product**: `public/v2-calculator.js:344` —
```html
<a href="v2-success.html?tier=${tier}" class="paywall-plan-btn primary">Get My Report — ${price}</a>
```

The site states it plainly itself at `public/v2.html:1205`: *"In production, Stripe checkout would appear here. Click below to simulate a successful payment and preview the post-payment experience."* There is a `testSimulatePayment` button (`:1211`) and a "Stripe payment screen skipped in test mode" banner (`:1210`).

**This is a hard FAIL-TO-LAUNCH.** No softening: the product is not sellable in its current state.

Full traced path: `buy → [NOTHING] → v2-success.html → client-side PDF render → advisor call (404)`. Two breaks.

#### C2 — CRITICAL — The £49 product is free to anyone
`/v2-success.html?tier=complete` delivers the complete report to any visitor, with no gate of any kind. The entire paid deliverable is public. **Verified: production returns 200.**

#### C3 — HIGH — The Stripe webhook is real code but orphaned
`app/api/webhook/route.ts` is correctly implemented (HMAC verification `:17`, timestamp replay guard `:21`, PII kept out of logs `:55`) and correctly rejects unsigned requests with 400. But **nothing ever creates a checkout session**, so `checkout.session.completed` never fires and the Loops purchase email (`:65-78`) never sends. Not a bug in itself — it is the one payment component that is genuinely ready.

**Note:** it hardcodes `the100kparent-unified.vercel.app` URLs (`:73-74`). These will be wrong on the real domain.

#### C4 — HIGH — A "Test Flow" button ships in the live production nav
`public/v2.html:785` (desktop) and `:818` (mobile) — a visible orange dashed-border link labelled **"Test Flow"**, styled at `:584-592`. This is test scaffolding shipped to production.

#### C5 — HIGH — No purchase record can exist
No database, no order table, no receipt, no email of the PDF. The report is rendered client-side from `localStorage`. Once payment is wired, **there will be no proof of purchase**, no way to honour the advertised 30-day money-back guarantee against a record, and no way for a customer to re-download.

---

### D) HOLLOW / PLACEHOLDER / BROKEN

#### D1 — CRITICAL — Both Calendly links are 404 (verified live)
| Link | Location | Status |
|---|---|---|
| `https://calendly.com/the100kparent` | `public/v2-success.html:367` | **404** |
| `https://calendly.com/the100kparent/consultation` | `app/booking_new/page.tsx:12` | **404** |

The first is the **headline feature of the £49 product** — *"30-minute call with an independent FCA-regulated financial adviser"* — and the "Schedule Your Consultation" button leads nowhere. The second is the **terminal step of the entire `_new` funnel**, and it is embedded in an `<iframe>` (`:255`), so the user gets a dead grey box rather than an honest error.

#### D2 — CRITICAL — Questionnaire data is never transmitted anywhere
`app/questionnaire_new/page.tsx:110` writes to `localStorage` and `:111` routes to `/booking_new`. **There are zero `fetch` calls in the entire `_new` funnel.** The data never leaves the browser.

**This is a false promise, not just a gap.** `app/booking_new/page.tsx:233` tells the user: *"Your PFA will have reviewed your questionnaire in advance so the full time is focused on your action plan."* Nobody receives the questionnaire. There is no PFA. The user has handed over their name, email, salary and pension details believing a professional is reading them.

#### D3 — CRITICAL — Four dead "Get Guide" buy buttons
`app/guides_new/page.tsx:222-236` — bare `<button>` elements with **no `onClick` handler**, priced £19 / £24 / £29 / £49. Clicking does literally nothing. No purchase path, no delivery mechanism, and no guide files exist in the repo.

#### D4 — HIGH — Corrupt localStorage → infinite spinner forever
`public/v2-success.html:235` — `const r = stored ? JSON.parse(stored) : null;` is **not wrapped in try/catch**.

**Verified:** corrupt JSON throws uncaught → the script dies → `#mainContent` (`:219-224`) stays on *"Preparing your report..."* with a spinner, permanently. This is the page a paying customer lands on. The no-data guard at `:238` is good and gives a clear message — but it never runs, because the parse throws first.

#### D5 — HIGH — Half-written data renders "£NaN" as the headline
**Verified** against `{"income1":150000,"over100k":true}` (valid JSON, missing fields):
```
Tax-Free Childcare : £NaN
HEADLINE TOTAL     : £NaN
```
`r` is truthy, so the no-data guard is bypassed and the report renders with `£NaN` where the saving should be. Fails the brief's test: the user gets neither a clear message nor a correct report.

#### D6 — HIGH — The primary pricing CTA is dead
`public/v2.html:1097` — `<a href="#" class="price-cta primary">Get Complete</a>`. The main buy button in the pricing section goes nowhere (jumps to top). The **only** route to the product is via the calculator paywall. A user who scrolls straight to Pricing — the natural high-intent path — hits a dead link.

#### D7 — MEDIUM — Mobile nav scrollspy targets a section that no longer exists
`public/v2.html:1332` references `id: 'testimonials'`. Only `#how-it-works`, `#calculator` and `#pricing` exist. The scrollspy entry is dead.

#### D8 — LOW — Six orphaned testimonial images
`testimonial-{emma,sarah,james,4,5,6}.jpg` in `public/` — referenced **zero** times. Dead weight, and evidence a testimonials section was removed (see H1).

#### D9 — LOW — `under-60` users get a mailto waitlist
`app/start_new/page.tsx:34` — `mailto:hello@the100kparent.com?subject=Waitlist`. Functional but thin; no capture, no list.

---

## PHASE 3 — SYSTEMIC / COHERENCE / UX / LEGAL

### E) TWO-PRODUCTS COHERENCE

#### E1 — HIGH — Separation is good in one direction, leaky in the other
**Verified:** the live site links to `_new` **zero** times — clean. But **every** `_new` page's logo links to `/` (e.g. `app/booking_new/page.tsx:126`), which is the live report product. A user mid-way through the advisor funnel who clicks the logo silently lands in a different product with a different price, a different promise and a different contact domain. There is no route back.

#### E2 — HIGH — `_new` is fully live and indexable in production
**Verified against `https://the100kparent-unified.vercel.app`:** `/home_new`, `/start_new`, `/questionnaire_new`, `/booking_new`, `/advisor-booking_new`, `/guides_new` **all return 200**.

There is **no `robots.txt`, no `sitemap.xml`, and no `noindex`** anywhere in the repo. So an unfinished funnel — with four dead buy buttons, a 404 booking embed, and a questionnaire that promises human review that does not happen — is publicly reachable and search-indexable right now. **Real risk:** a customer can find, trust and attempt to pay for a product that does not exist.

#### E3 — HIGH — Duplicate legal pages that have ALREADY drifted
This is not a hypothetical drift risk. It has happened.

| | Live product | `_new` product |
|---|---|---|
| Terms | `public/terms.html` | `app/terms_new/page.tsx` |
| Privacy | `public/privacy.html` | `app/privacy-policy_new/page.tsx` |
| General contact | `hello@the100kparent.`**`co.uk`** | `hello@the100kparent.`**`com`** |
| Privacy/GDPR contact | `privacy@the100kparent.`**`co.uk`** | `privacy@the100kparent.`**`com`** |
| Support | — | `support@the100kparent.`**`com`** |

**The two products point at completely disjoint domains — `.co.uk` and `.com` — with no overlap.** Five distinct addresses across two TLDs.

**This is a real compliance problem, not cosmetics.** The privacy policy's stated contact is the legal route for a GDPR data-subject access request. Two published policies naming two different addresses means at least one set of users is being told to write to an address that may not be monitored — or may not exist. **Verify which domain the business actually owns.** The webhook (`app/api/webhook/route.ts:73-74`) meanwhile hardcodes `the100kparent-unified.vercel.app`, a third domain.

---

### F) JOURNEYS

#### F1 — Journey (a): user buys the report
```
/ → calculator → results + paywall → "Get My Report — £49"
    → [NO PAYMENT — direct link] → v2-success.html → PDF renders client-side
    → "Schedule Your Consultation" → CALENDLY 404
```
**Two hard breaks.** No money is taken (C1); the headline feature 404s (D1). Alternate entry via Pricing → "Get Complete" is a dead `href="#"` (D6). Nothing is emailed; no record exists (C5). **The journey cannot complete as advertised.**

#### F2 — Journey (b): `_new` questionnaire → booking
```
[no entry point — unlinked from /] → /start_new → income band
    → £150k+ or £100-149k w/ £125k+ pension → /questionnaire_new
        → name, email, salary, pension → localStorage ONLY (never sent)
        → /booking_new → Calendly iframe → 404 DEAD BOX
    → £60-79k / £80-99k / £100-149k low pension → /guides_new
        → "Get Guide — £19/£24/£29/£49" → NO onClick → NOTHING HAPPENS
    → under £60k → mailto: waitlist
```
**Every terminal path is a dead end.** Data is dropped at the only step that collects it. **The `_new` funnel is a non-functional shell** — it looks complete and finishes nothing.

---

### G) UX

**The quality bar is `public/v2-success.html` — the report itself.** It is genuinely strong work: a real persona engine (`:600-645`) that adapts tone to the user's exact position, specific and actionable steps (copy-paste emails to HR, named gov.uk portals, timing warnings about term deadlines), honest per-parent eligibility explanations, and a real insight — reframing childcare spend as pension wealth (`:690`). If a customer read only this, they would feel well served. It is the reason this product could work.

**Where the rest falls short of that bar:**
- **The paywall lies about personalisation** (A1). The best screen's credibility is undercut by the screen immediately before it.
- **The calculator gives a confident, wrong, unqualified number** (A2, A3). It is the first thing a user sees and it sets the trust level for everything after.
- **`_new` looks finished but does nothing** (F2). Visually consistent and well-composed; functionally hollow. This is the most dangerous UX state — a user cannot tell.
- **"Test Flow" in the production nav** (C4) tells any visitor the site is unfinished.
- **Two products, two prices, two domains, one logo linking between them** (E1, E3) — a user who crosses over cannot know where they are.

**Does the user always know where they are and what to do next?** Within the report, yes. Across the site, no — and the specific failure is that dead ends are indistinguishable from working paths.

---

### H) LEGAL / COPY RISK (flagged, not fixed)

#### H1 — **GOOD NEWS** — No invented testimonials on the live landing page
`public/v2.html:1115-1118` presents an illustrative example and explicitly labels it: *"Illustrative figures only — not a customer testimonial. Your result will depend on your own circumstances."* This is correct, and the six orphaned `testimonial-*.jpg` files (D8) suggest invented testimonials were **deliberately removed**. That was the right call and it should be recorded as such.

#### H2 — HIGH — The "Sarah" case study in the paid report is not labelled illustrative
`public/v2-success.html:772` — headed *"How one parent earning £130k annual salary was able to claim 30 hours childcare"*, naming **Sarah**, with specific figures: £130,000 salary, £15,000 nursery fees, £6,500 existing pension, £23,600 top-up, £30,100/year outcome.

It reads as a real customer's case history. **It carries no illustrative disclaimer**, unlike the landing page's example (H1). **The team must confirm whether Sarah is a real, named, consenting customer.** If she is invented, this is the exact advertising / consumer-protection risk the landing page was cleaned up to avoid — reintroduced inside the paid product, where the customer's reliance is highest. **Flagged, not fixed — this needs a human decision.**

#### H3 — MEDIUM — Disclaimer text is strong; its prominence is not
The two disclaimers at `public/v2-success.html:1746` and `:1755` are genuinely well-drafted — they cover estimate-only status, non-reliance for scheme eligibility, user responsibility to verify, "The 100k Parent is not FCA regulated", and tax-year volatility. As text, adequate.

**But** they sit at the very bottom of a 1,773-line report, styled at `11px` in `#94A3B8` on `#F8FAFC` (`:1648`) — low-contrast grey, below every action step the user has already been told to take. FCA-disclaimer count by surface: `v2.html` **5**, `terms.html` **3**, `SiteFooter.tsx` **2**, `LegalDisclaimer.tsx` **2**, **`v2-success.html` — 1**. The surface with the most concentrated advice-like content has the thinnest coverage. Adequate wording, weak placement.

#### H4 — HIGH — Savings claims are not defensible as currently computed
Given A2, A3 and A4, the headline figure is not defensible to a regulator or an angry customer:
- It includes benefits the user is **not eligible for** and is not told are conditional (A2).
- Its largest component is often a **magic ratio** with no basis in the entitlement (A3).
- It can **exceed the user's total childcare spend** (A2 evidence).

The disclaimers (H3) say figures are estimates. **A disclaimer does not cure a number that is wrong by construction** — and "cannot be relied upon to determine eligibility" sits oddly next to a headline that presents ineligible benefits as achievable savings.

#### H5 — MEDIUM — Terms disclose a referral-fee arrangement that may not exist
`public/terms.html:27` sells *"a 30-minute call with an independent, FCA-regulated financial adviser we can refer you to"*, and states *"We may earn referral fees from FCA-regulated advisors. All advisors are independently regulated professionals."*

The booking link is a **404** (D1). **Is there an adviser?** If no adviser relationship exists, the £49 product is sold on a feature that cannot be delivered, and the referral-fee disclosure describes an arrangement that is not in place. Needs a human answer.

#### H6 — LOW — The guarantee copy contradicts itself
`public/v2.html:1105` — *"Follow our recommendations and if you don't find new savings — full refund, 30 days, no questions asked."* A condition ("follow our recommendations") and "no questions asked" cannot both hold. `public/terms.html:31` states the cleaner version (voluntary 30-day, email to request). Moot until payment exists, but it will need one wording.

#### H7 — LOW — Statutory cancellation vs instant delivery
`public/terms.html:28` and `app/terms_new/page.tsx:108-116` both reference the 14-day statutory right alongside the 30-day voluntary guarantee. For instantly-delivered digital goods the 14-day right is waived only with **express consent to immediate delivery plus acknowledgement of the loss of the right** — which must be captured at checkout. There is no checkout (C1), so there is nowhere to capture it today. Flag for whoever builds the checkout.

---

### I) GAP ANALYSIS — what a real paying customer needs that is missing or half-built

1. **A way to pay.** (C1)
2. **The adviser call they paid for.** (D1, H5)
3. **Proof of purchase** — receipt, invoice, order record. Impossible without persistence. (C5)
4. **Delivery they can keep** — the PDF is rendered client-side from `localStorage`. Clear the browser and the £49 purchase is gone forever. No email copy, no re-download. (C5)
5. **A working refund route** for the advertised 30-day guarantee — no order record to refund against. (C5, H6)
6. **VAT handling.** `public/terms.html:27` says prices *"include any applicable VAT"*. Nothing computes, records or reports VAT.
7. **Correct core numbers.** (A2, A3, A4)
8. **Guides that exist.** `_new` prices four guides; no files, no delivery, dead buttons. (D3)
9. **A destination for questionnaire data.** (D2)
10. **One canonical domain and contact address.** (E3)
11. **Any automated test.** No test framework. Every calculator finding above would have been caught by a handful of assertions on known-good values.

---

## WHAT I COULD NOT VERIFY, AND WHY

- **Whether "Sarah" (H2) is a real consenting customer.** Not knowable from code. Needs a human answer. This determines whether H2 is a Low or a Critical.
- **Whether an FCA-regulated adviser relationship exists** (H5). The 404 proves the link is broken, not that the arrangement is absent.
- **Which domain the business owns** (`.co.uk` vs `.com`, E3). Not knowable from code.
- **Whether Stripe/Loops env vars are set in Vercel.** `STRIPE_WEBHOOK_SECRET` and `LOOPS_API_KEY` are read at `app/api/webhook/route.ts:30-31`. I did not read production env (out of scope, and I made no changes). Moot until a checkout exists.
- **Real browser rendering.** The calculator was executed against a stub DOM, not a real browser. Logic and values are verified; visual layout, mobile rendering and real PDF print output are **not**. A human should eyeball the report on a phone.
- **The £19 Essential tier end-to-end.** SKIPPED — unreachable by construction (A1), genuinely could not be exercised.
- **Loops email delivery.** SKIPPED — orphaned webhook (C3); cannot fire without a checkout.
- **Actual Calendly account state.** I verified both URLs return 404. Whether an account exists under some other URL is unknown.

---

## SUMMARY

| Severity | Count | Items |
|---|---|---|
| **Critical** | 9 | A1, A2, A3, A4, B1, C1, C2, D1, D2, D3 |
| **High** | 15 | A5, A6, B2, B3, B4, C3, C4, C5, D4, D5, D6, E1, E2, E3, H2, H4 |
| **Medium** | 5 | A7, B5, D7, H3, H5 |
| **Low** | 5 | A8, D8, D9, H6, H7 |
| **PASS** | — | Build, routing, redirects, no 500s, webhook signature verification, **calculator input validation**, no-data guard, landing-page testimonial honesty (H1) |

**Two independent launch blockers:** the site **cannot take money** (C1), and the calculator's **core numbers are not defensible** (A2, A3, A4).

The report engine (`v2-success.html`) is genuinely good work. The problem is not the product's ambition or its content quality — it is that the number leading into it is wrong, the payment behind it does not exist, and the feature it promises 404s.

**Final verification (post-audit):** `next build` re-run and passes clean; `/` still serves the v2 site correctly with no `/v2` in the URL. No product code was changed by this audit.
