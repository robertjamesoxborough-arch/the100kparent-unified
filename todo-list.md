# The 100k Parent — Pre-Launch To-Do List

Prioritised checklist from the health test of **17 July 2026**. Full detail, evidence and file:line references in `audit-report.md`.

> This replaces an earlier to-do list (recoverable via `git show b3426d52:todo-list.md`). That list marked several items DONE and stated they were live. **This audit did not re-verify those claims as claims** — it re-verified the code from scratch and reports what the code actually does today. Where the two disagree, trust this list.

---

## ✅ DONE

**This audit made no changes.** Nothing was auto-fixed, nothing was deployed. The only files added or changed are the three report files (`audit-report.md`, `todo-list.md`, `WAKING-UP-CHECKLIST.md`), which do not affect the running site.

Recorded as already-good (no action needed — do not regress these):

- [x] `next build` passes clean — no errors, no warnings
- [x] Root `/` serves the v2 site with no `/v2` in the URL; `/v2` and `/v2.html` redirect correctly
- [x] Calculator input validation is genuinely solid (zero, empty, negative, no children, unselected age, blank partner income all rejected with clear messages)
- [x] The Stripe webhook is correctly written — HMAC verification, replay guard, no PII in logs
- [x] The landing page's example is honestly labelled "not a customer testimonial" — this was the right call
- [x] The report engine (`v2-success.html`) is strong, specific, genuinely useful content

---

## 🤔 NEEDS 100K PARENT TEAM DECISION

These are business calls. I have flagged them, not fixed them — each needs a human answer before anyone can act.

- [ ] **Is the site actually launching for money?** There is no Stripe checkout at all — the buy button links straight to the product. Someone must decide whether to build a real checkout or pull the buy buttons.
      → *Recommendation: nothing else on this list matters commercially until this is answered. Answer it first.*

- [ ] **Is "Sarah" a real, named, consenting customer?** The £49 report contains a case study naming Sarah with specific figures (£130k salary, £23,600 pension top-up, £30,100/yr outcome) and **no illustrative disclaimer**.
      → *Recommendation: if she is invented, either label it clearly as illustrative (as the landing page correctly does) or remove it. Invented case studies with specific savings figures inside a paid product are a real advertising / consumer-protection risk.*

- [ ] **Does an FCA-regulated adviser relationship actually exist?** The £49 product's headline feature is a 30-minute adviser call. The Calendly link is a 404. The Terms also disclose that you may earn referral fees from advisers.
      → *Recommendation: if there is no adviser, the £49 product cannot be sold as described. Fix the supply before fixing the link.*

- [ ] **What is the fate of the `_new` advisor funnel?** It is fully live and search-indexable in production, unlinked from the homepage, and every terminal path is a dead end (404 booking embed, four dead buy buttons, questionnaire data that goes nowhere).
      → *Recommendation: `noindex` + block it today as a stop-gap, then decide: finish it, or delete it. Leaving a hollow product publicly reachable is the worst of the three options.*

- [ ] **Which domain does the business own — `.co.uk` or `.com`?** The live site tells users to email `@the100kparent.co.uk`; the `_new` funnel says `@the100kparent.com`. Five addresses across two TLDs, completely disjoint.
      → *Recommendation: pick one, make every page match. The privacy contact is the legal route for a GDPR request — it must be an address someone actually reads.*

- [ ] **Should the £19 Essential tier exist?** It is unreachable (the tier is hardcoded to Complete) but still advertised in four places, including `home_new` ("From £19").
      → *Recommendation: either relaunch it or purge every remaining mention. Advertising a price nobody can buy is the problem.*

- [ ] **Who is liable for the numbers?** The business is not FCA regulated and the disclaimers say so. But the report tells users to make specific pension contributions.
      → *Recommendation: worth 30 minutes of a solicitor's time once the numbers in the next section are fixed.*

---

## 🚨 TO DO BEFORE LAUNCH

Most damaging first. A wrong core number or a dead payment button ranks above cosmetic polish.

### Launch blockers — the product does not work without these

- [ ] **1. Build a real Stripe checkout.** `v2-calculator.js:344` links the buy button straight to `v2-success.html?tier=complete`. `v2.html:1205` says outright: *"In production, Stripe checkout would appear here."* **The site cannot take a single penny.**

- [ ] **2. Gate the product.** `/v2-success.html?tier=complete` hands the complete £49 report to anyone who visits the URL. There is no gate of any kind. Live in production right now.

- [ ] **3. Stop showing over-£100k households benefits they cannot have.** `v2-calculator.js:183,188` — the TFC and funded-hours figures never check the £100k ceiling. A £130k parent is shown £22,200 of "savings" against a £15,000 childcare bill, on the same screen as a red warning telling them they do not qualify. **The claimed saving exceeds the entire spend it saves against.**

- [ ] **4. Fix the funded-hours figure.** `v2-calculator.js:183` — it is `0.55 × whatever the user typed`, uncapped and unrelated to the real entitlement. £100k/mo childcare returns £660,000 of "funded hours". Real entitlement is roughly £6,800/child.

- [ ] **5. Fix the pension relief calculation.** `v2-calculator.js:160` — flat-rates one tax rate across a contribution spanning several bands, and **has no 45% additional-rate band at all**. A £130k earner is told £12,600 when the defensible figure is £17,871. The report then contradicts itself by telling the same user their personal allowance is "worth over £5,000 in tax on its own".

- [ ] **6. Fix both Calendly 404s.** `v2-success.html:367` (the £49 product's headline feature) and `booking_new/page.tsx:12` (embedded in an iframe, so users get a dead grey box). Both verified 404 against the live URLs. *Depends on the adviser decision above.*

- [ ] **7. Send the questionnaire somewhere.** `questionnaire_new/page.tsx:110` writes to `localStorage` and nothing else — there are zero `fetch` calls in the whole `_new` funnel. Meanwhile `booking_new/page.tsx:233` promises *"Your PFA will have reviewed your questionnaire in advance."* Nobody receives it. **That is a false promise, not just a gap.**

### High — wrong or broken in ways a customer will hit

- [ ] **8. Remove the "Test Flow" button from the live nav.** `v2.html:785` (desktop) and `:818` (mobile) — a visible orange dashed "Test Flow" link on the production site.

- [ ] **9. Delete the legacy result fields, or stop falling back to them.** `v2-calculator.js:202-210` writes two contradictory sets of numbers for every user (TFC £1,920 vs £864; total £20,230 vs £7,354). `v2-success.html:251` falls back to the legacy ones — a 2.75× overstatement for any older saved result.

- [ ] **10. Fix the "Get Complete" button.** `v2.html:1097` is `href="#"`. The main pricing CTA — the natural high-intent path — is dead.

- [ ] **11. Guard the report against corrupt data.** `v2-success.html:235` — `JSON.parse` outside any try/catch. Corrupt localStorage means an **infinite spinner forever** on the page a paying customer lands on. The good no-data message at `:238` never gets to run.

- [ ] **12. Guard the report against half-written data.** Valid-but-incomplete data renders **"£NaN"** as the headline saving in the paid report.

- [ ] **13. Fix the four dead "Get Guide" buttons.** `guides_new/page.tsx:222-236` — bare `<button>`s with no `onClick`, priced £19–£49. Clicking does nothing. No guide files exist.

- [ ] **14. `noindex` the `_new` funnel** (or finish it). No `robots.txt`, no `sitemap.xml`, no `noindex` anywhere. All six `_new` pages verified 200 in production.

- [ ] **15. Stop the `_new` logo dumping users into the live report site.** Every `_new` page's logo links to `/`. Different product, different price, different promise, no way back.

- [ ] **16. Reconcile the duplicate legal pages.** `terms.html`/`privacy.html` vs `terms_new`/`privacy-policy_new` — already drifted onto two different domains.

- [ ] **17. Fix the £90k personalisation claim.** `v2-calculator.js:309` hardcodes `isComplete = true`, so the £90k boundary never fires — £89,999, £90,000 and £90,001 give identical output. But `:315` still tells every visitor *"Based on your income level, we recommend the Complete Guide."* It is not based on their income level. *Either restore the routing (`:306`) or change the copy — the copy is the urgent half.*

### Medium — do before launch, but they will not sink you

- [ ] **18. Cap the pension contribution at the annual allowance.** `v2-calculator.js:156-166` — £10m income returns a £4,164,144 headline. The success page already has this check; the calculator ignores it.
- [ ] **19. Remove or derive the flat £3,000 income-splitting figure.** `v2-calculator.js:260` — a magic number, currently dormant. Indefensible the moment it surfaces.
- [ ] **20. Pick one Tax-Free Childcare formula.** Three exist: `v2-calculator.js:188`, `:238`, and `booking_new/page.tsx:57` (flat £4,000 cap, ignores child count).
- [ ] **21. Lift the report's disclaimers.** The text at `v2-success.html:1746,1755` is genuinely well-drafted — but it is 11px low-contrast grey at the bottom of a 1,773-line report, below every action step the user has already been told to take.
- [ ] **22. Fix the dead `#testimonials` scrollspy entry.** `v2.html:1332` — the section no longer exists.
- [ ] **23. Fix the hardcoded vercel.app URLs in the webhook.** `app/api/webhook/route.ts:73-74` — will be wrong on the real domain.

### Low — cleanup

- [ ] **24. Single-source the prices and thresholds.** £49 is hardcoded in six places; £100,000 / £125,140 / £50,270 / £12,570 / £10,158 are scattered across three files. Every tax-year update is a manual sweep with nothing to catch a miss.
- [ ] **25. Delete the six orphaned `testimonial-*.jpg` files.** Referenced zero times.
- [ ] **26. Fix the self-contradicting guarantee copy.** `v2.html:1105` — "Follow our recommendations" and "no questions asked" cannot both be true.
- [ ] **27. Remove the vestigial `vercel.json` rewrites** (`/privacy`, `/refund`, `/terms-old`) — they work, but nothing links to them.
- [ ] **28. Capture the 14-day cancellation waiver at checkout** when the checkout exists. See `terms.html:28`.

### The one that prevents all of the above from coming back

- [ ] **29. Add a test framework and pin the calculator's numbers.** There is **no test framework of any kind** in this repo. Every calculator finding above (items 3, 4, 5, 9, 18, 19) would have been caught by a handful of assertions on known-good values. Without this, the next change silently re-breaks them and nobody notices — which is exactly the failure mode this whole audit exists to catch.
