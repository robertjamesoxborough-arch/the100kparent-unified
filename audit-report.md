# The 100k Parent — Pre-Launch Audit Report

**Date:** 1 July 2026
**Scope:** Security, UX, Data safety/GDPR, Legal soundness
**Auditor:** Automated code + content review of the actual repository (`The100kParent-unified`)
**Deploy status:** Nothing deployed. All fixes are staged in the working tree for review.

---

## 0. How the live site is actually wired (read this first)

Understanding the routing is essential to reading the rest of this report.

- The app is a **Next.js 16 project** deployed to Vercel. `app/page.tsx` **redirects `/` to `/v2.html`** (`app/page.tsx:5`). So the **live funnel is the static `v2` flow**, not the React app pages.
- **Live funnel:** `public/v2.html` (landing + calculator) → results/paywall → `public/v2-success.html` (report + PDF). Data is passed via **`localStorage` key `100kp_results`**.
- The **only server-side code** is `app/api/webhook/route.ts` (a Stripe webhook that pushes the buyer's email/name to Loops).
- There is a **large legacy surface** still deployed and reachable by URL: `index.html`, `checkout.html`, `success.html`, `dashboard.html`, `module-0..8.html`, `calculator.js`, `module-tools.js`, plus `vercel.json` rewrites (`/checkout`, `/dashboard`, `/module-N`, `/success`, `/v2`, etc.). These describe a **different product at a different price** (£79 course) and contain broken links and fake testimonials. See Legal §L1 and UX §U8.
- **No database.** No Supabase, no Anthropic keys, no server-side storage of user data anywhere in the codebase (despite the brief asking us to look — confirmed absent).

### Severity summary

| Sev | Count | Headline items |
|-----|-------|----------------|
| **Critical** | 4 | No real payment path; paid report is free; "Test Mode" shown to real users; report page ungated |
| **High** | 9 | FCA/adviser positioning, fake testimonials & stats, price inconsistency, misleading savings for self-employed/over-£100k, legacy pages live, missing company/ICO details, guarantee incoherence (now fixed), privacy policy inaccurate (now fixed), no cookie policy |
| **Medium** | 8 | Dead CTAs/anchors, broken `advisor.html` links, single-parent 30-hours bug, negative-number handling, PII in logs (fixed), `.DS_Store`/`.vercel` tracked, mobile PDF reliability, Google Fonts transfer |
| **Low** | 5 | No SRI on CDN scripts, no webhook idempotency, domain/email inconsistency, meta-claim "£17,000", handwrite/JS niggles |

---

## 1. SECURITY

### S1 — [CRITICAL] The paid report has no access control; it is a public URL
**Where:** `public/v2-success.html` (whole page); linked from `public/v2-calculator.js:285` and the Stripe→Loops event `app/api/webhook/route.ts:72-73`.
**What:** `v2-success.html` reads `100kp_results` from `localStorage` and renders the **full report and PDF** for anyone who visits `…/v2-success.html`. There is no token, login, payment check, or signed parameter. The paywall "Get My Report — £49" button links **directly** to `v2-success.html?tier=complete` (`v2-calculator.js:285`) with no payment in between.
**Why it matters:** The entire paid product is free to anyone who reaches the calculator or types the URL. Search engines can index it.
**Fixed?** **No — needs human/engineering.** A real fix requires gating the report behind a successful payment (e.g., Stripe Checkout → signed session token / entitlement check before rendering). Documented as the #1 launch blocker.

### S2 — [CRITICAL] There is no real payment integration in the live funnel; it runs in "Test Mode"
**Where:** `public/v2.html:1368-1458` (Test Flow), pricing CTAs `v2.html:1414-1422`, nav "Test Flow" `v2.html:788, 824`.
**What:** The pricing buttons ("Get Essential/Complete") are wired to a **"Test Mode" modal** that says *"In production, Stripe checkout would appear here"* and offers a **"Simulate Payment →"** button which opens the full report. No money is ever collected. `checkout.html` (legacy) points to a **Stripe test link** (`checkout.html:238`, `buy.stripe.com/test_…`) and a **placeholder Memberstack ID** (`checkout.html:208`, `PASTE_YOUR_PROJECT_ID_HERE`).
**Why it matters:** The site cannot take payment and actively tells real users it is in test mode. Cannot launch as-is.
**Fixed?** **No — needs human/engineering** (wire real Stripe Checkout + entitlements; remove the Test Flow harness). Not hacked because a safe fix depends on business decisions (price IDs, keys).

### S3 — [CRITICAL] "Test Mode" UI is visible to real visitors
**Where:** `v2.html:788` (desktop nav "Test Flow"), `v2.html:824-826` (mobile), `v2.html:1189-1271` (modal with "Test Mode" badges).
**What:** A live visitor sees a "Test Flow" nav item and "Test Mode / Simulate Payment / (mock)" screens.
**Why it matters:** Destroys trust instantly; a sceptical user (Persona E) will bounce.
**Fixed?** No — tied to S2. Must be removed when real checkout is wired.

### S4 — [HIGH] Secrets exist locally and must be confirmed server-only + rotated if ever shared
**Where:** `.env.local` (not tracked — good), used in `app/api/webhook/route.ts:30-31`.
**What:** `.env.local` contains `STRIPE_WEBHOOK_SECRET`, `LOOPS_API_KEY`, `ACCESS_TOKEN_SECRET`, `VERCEL_OIDC_TOKEN`. **Good news:** `.env*` is git-ignored (`.gitignore:3,7`) and **never appears in git history** (verified). No secrets found anywhere in `public/` client code (verified by scan).
**Why it matters:** These are valid-looking live credentials. They must be set as Vercel environment variables (server-side only) and rotated if this file was ever copied/shared/screenshared.
**Fixed?** Partially — code already reads them from `process.env` server-side only. **Human action:** confirm they are in Vercel env and rotate as a precaution.

### S5 — [MEDIUM] Customer email (PII) was logged to server logs
**Where:** `app/api/webhook/route.ts:54` (before fix).
**What:** `console.log(\`Payment completed: ${email} (${firstName})\`)` wrote buyer PII to Vercel logs.
**Fixed?** **Yes.** Replaced with a non-identifying marker (`route.ts:54`).

### S6 — [MEDIUM] `.DS_Store` and `.vercel/` are tracked in git
**Where:** `git ls-files` shows `.DS_Store`, `.vercel/README.txt`, `.vercel/project.json`.
**Why it matters:** `.vercel/project.json` exposes project/org IDs (not secret, but unnecessary); `.DS_Store` leaks local file names. Housekeeping.
**Fixed?** No — **human action** (`git rm --cached` and rely on `.gitignore`). Left untouched to avoid surprising the team's git state.

### S7 — [LOW] Client-side tampering of `localStorage` results
**Where:** `v2-calculator.js:166`, consumed in `v2-success.html:235`.
**What:** A user can edit `100kp_results` to change the numbers in their own report. Since the report is free and only affects the user's own screen, this is **self-affecting only** — no server trust depends on it. Worth noting, not a real threat while there's no entitlement logic. If S1/S2 are fixed, ensure the server (not localStorage) is the source of truth for entitlement.
**Fixed?** N/A (accepted risk; revisit with S1).

### S8 — [LOW] XSS surface via `innerHTML` templating
**Where:** `v2-success.html` (many `main.innerHTML = \`…${r.field}…\``), `v2-calculator.js:261-293`.
**What:** Report fields are injected via template literals. Inputs are numeric (`parseFloat`/`parseInt`) or `<select>`-constrained, so injection is not practically reachable by a normal user; the only "attacker" is the user themselves via their own localStorage.
**Fixed?** No change needed now. If any free-text field is ever added (e.g., a name shown in the report), sanitise it.

### S9 — [LOW] Third-party scripts loaded without Subresource Integrity
**Where:** `success.html:8` (jsPDF from cdnjs), Google Fonts across pages.
**Fixed?** No — low priority; consider self-hosting or adding SRI.

---

## 2. UX — persona walkthroughs

Derived by tracing `v2.html` + `v2-calculator.js` + `v2-success.html` deterministically (no live browser). Calculator validation: rejects empty income / children / childcare and unselected ages (`v2-calculator.js:106-115`).

### Persona A — Employed, £102k, two children under 5 (single income)
- Landing → **Calculator** works. Enters £102,000, "No" secondary income, employed, 2 children (ages 2 & 3), childcare.
- **Over-£100k warning** shows. Paywall appears: because highest income ≥ £90k → **Complete £49** tier. "Get My Report — £49" → opens `v2-success.html` **for free** (S1).
- **Accuracy problem [HIGH, see U6]:** the headline/report shows a **Tax-Free Childcare** figure (`displayTfc`, `v2-calculator.js:148`) even though over-£100k households are **not eligible** for TFC (`calculateTFC` returns 0 for `over100k`, `v2-calculator.js:180`). The report presents savings the user cannot claim without first restructuring income.
- Pricing-section buttons → **Test Mode** modal (S2/S3).

### Persona B — Dual income, both under £90k, one child
- Calculator works. Eligible for TFC + 30 hours. Numbers look sane (30-hours ≈ 0.55 × annual childcare).
- Highest income < £90k → **Essential £19** tier. "Get My Report — £19" → free report (S1).
- No blocking UX dead-ends in the calculator path; the only "purchase" path is the Test Mode modal.

### Persona C — Self-employed single parent, £85k
- **Two accuracy problems:**
  1. **30-hours wrongly denied in eligibility logic** but **shown in the figure.** `check30HoursEligibility` returns `false` when `income2 === 0` (`v2-calculator.js:172`) — i.e. it treats *all* single parents as ineligible, which is incorrect (single working parents can qualify). Yet `displayThirtyHours` still adds ≈ 0.55 × childcare (`v2-calculator.js:154`). The results panel then shows the "may not qualify" info box **and** a large 30-hours saving. Contradictory. **[MEDIUM/HIGH]**
  2. **Salary-sacrifice shown to a self-employed user who can't use it.** `calculateSalarySacrifice` correctly returns 0 when both parties are self-employed (`v2-calculator.js:188`), but the **displayed** figure `displaySalary` uses a generic estimate that ignores employment type (`v2-calculator.js:152-153`), so a self-employed single parent is shown a salary-sacrifice "saving" they cannot access. **[HIGH — misleading]**

### Persona D — Company director, £150k, partner not working
- Form only offers "secondary income: Yes/No". "Partner not working" maps to **No** → single income. Fine, but there's no way to represent a non-earning partner explicitly.
- Over-£100k. The report's pension play computes sacrificing **~£50,000** into a pension to reach £99,999 (`v2-calculator.js:138`), producing a very large "£21k+" tax/NI figure at 42%. Presented as achievable; for many £150k earners a £50k sacrifice is unrealistic (cashflow, annual allowance). **Methodology should be caveated. [MEDIUM]**
- Tier → Complete £49; report free (S1).

### Persona E — Sceptical, impatient, old Android; taps fast, hits back, refreshes
- **Sees "Test Flow" / "Test Mode" / "Simulate Payment"** → immediate trust loss (S3). **Critical for this persona.**
- **Refresh mid-flow:** calculator **inputs are not persisted** (only results are saved on Calculate). Refreshing the calculator loses entries. Minor annoyance.
- **Direct hit to `/v2-success.html` without running calculator:** handled gracefully → "No calculator results found" + link back (`v2-success.html:240-248`). Good.
- **PDF on old Android:** report opens a **new tab and calls `window.print()`** (`v2-success.html` download flow). Pop-up blockers are handled with fallback UI, but `window.print()`→"Save as PDF" is unreliable on older mobile browsers. **[MEDIUM] Verify on real devices.**
- **Negative numbers:** validation only blocks `=== 0` (`v2-calculator.js:106`); a negative income is not rejected and flows into calculations, producing nonsensical negatives. **[MEDIUM]**
- **Decimals / very large numbers:** accepted; large values render fine via `toLocaleString`.

### U-links — Dead CTAs, dead anchors, broken links
- **[MEDIUM] Dead pricing CTAs:** `v2.html:1077,1095` — "Get Essential/Complete" are `href="#"`, intercepted by JS to open the Test Mode modal (so they don't purchase). **Fixed the dead anchors' sibling issue below; the buttons still need real checkout (S2).**
- **[MEDIUM] Dead nav anchor "Reviews" → `#testimonials`** which **does not exist** in `v2.html`. **Fixed:** removed the "Reviews" links from desktop nav (`v2.html:787`) and mobile menu (`v2.html:821-823`).
- **[MEDIUM] Broken `advisor.html` links:** `checkout.html:18,100,180` and `index.html` link to `advisor.html`, which **does not exist** in the repo. **Not fixed** (part of legacy-page decision, §L1).
- **[LOW] Footer legal links in `checkout.html:186-187`** are `href="#"` (dead Terms/Privacy). Legacy page (§L1).

### U8 — [HIGH] Legacy pages are live and contradict the product
See Legal §L1. `index.html` (sells £79 course, links `checkout.html`), `checkout.html` (test Stripe link, placeholder Memberstack, £79, fake testimonials), `success.html`/`dashboard.html`/`module-*.html`. All reachable. **Not fixed** — needs a keep/remove decision.

---

## 3. DATA SAFETY & GDPR

### Data inventory — what is collected and where it goes
| Data | Where collected | Where it goes | Server-stored? |
|------|-----------------|---------------|----------------|
| Income, partner income, children count & ages, childcare cost, employment, pension | Calculator (`v2.html` #calculator) | `localStorage['100kp_results']` (`v2-calculator.js:166`) | **No** — stays in the browser |
| First name, email | Checkout / purchase | `localStorage['userProfile']` (`checkout.html:233`); on real purchase → Stripe, then **Loops** via webhook (`route.ts:56-77`) | Only at processors (Stripe, Loops) |
| IP, request metadata | Automatic | Vercel server logs | At Vercel (processor) |

**Key finding:** The site stores **no personal data in its own database** (there is none). Financial calculator inputs **never leave the browser**. Personal data only reaches third parties (**Stripe, Loops, Vercel**) — and only Stripe/Loops when a real purchase occurs (currently inactive due to S2). **No Anthropic or Supabase processing exists.**

### D1 — [HIGH] Privacy Policy was inaccurate and incomplete
**Where:** `public/privacy.html`.
**What (before):** claimed an "account" system that doesn't exist; said data is stored on "UK/EU servers" (Stripe/Loops/Vercel are US); said calculator inputs are "anonymous analytics" (they're client-side localStorage); no processors named, no lawful basis, no retention, no controller identity, no ICO number.
**Fixed?** **Partially — rewritten to be accurate** (`privacy.html`): now describes localStorage-only calculator data, names Stripe/Loops/Vercel as processors, states lawful bases, retention, international transfers, UK-GDPR rights, and cookies/local-storage. **Human action still required:** fill `[TO COMPLETE]` company name/address/number and ICO number, and have a professional review it.

### D2 — [HIGH] No Cookie Policy / cookie notice
**What:** No cookie policy exists. The site uses **localStorage** (functional/essential — arguably no consent needed) and loads **Google Fonts** from Google (a third-party US transfer). No advertising/tracking cookies were found (no GA/Meta pixel in the live pages).
**Recommendation:** Add a short cookie/'local storage' notice. A full consent banner is likely **not** strictly required if you keep to essential storage only, but you should (a) publish a cookie notice and (b) consider self-hosting fonts to avoid the Google transfer. **Human action.**

### D3 — [HIGH] ICO registration and fee
**Assessment:** As a business processing personal data (buyer name/email for marketing via Loops, payment via Stripe) for commercial purposes, you are a **data controller** and are **not** exempt. You must **register with the ICO and pay the data protection fee**.
- **Tier:** Almost certainly **Tier 1** (small organisation: turnover ≤ £632,000 **or** ≤ 10 members of staff).
- **Cost:** **£40/year** (£52 if not paying by Direct Debit).
- **What determines it:** turnover and headcount (Tier 1/2/3). Charities and small occupiers get Tier 1.
**Human action — required before launch.**

### D4 — [HIGH] Data Processing Agreements with processors
**What:** DPAs are required with **Stripe, Loops, and Vercel** (all offer standard DPAs). International transfer safeguards (UK IDTA / SCCs) apply as all three are US-based.
**Human action:** Accept/sign each provider's DPA and keep records.

### D5 — [MEDIUM] PII in server logs
Covered as **S5 — fixed**.

---

## 4. LEGAL SOUNDNESS OF COPY

### L1 — [HIGH] Legacy pages contradict the live product (price, testimonials, claims, broken links)
**Where:** `public/index.html`, `public/checkout.html`, `public/success.html`, `public/dashboard.html`, `public/module-*.html`; reachable directly and via `vercel.json` rewrites.
**What:**
- Sells a **£79 "DIY guide" with modules** (`index.html:150,467,469`; `checkout.html:30,123`) — the live product is **£19/£49 reports**.
- **Fabricated testimonials**: "Sarah M., London — Saved us £8,400", "James T., Manchester", "The Patels, Birmingham" (`checkout.html:149-160`); **"Trusted by 2,847+ Parents"** (`checkout.html:145`).
- **Broken links** to non-existent `advisor.html`; dead `href="#"` legal links.
- **Test Stripe link + placeholder Memberstack ID** (`checkout.html:208,238`).
**Why it matters:** Any visitor or search engine hitting these pages sees a different price, unverifiable testimonials (CPUT 2008 / ASA breach), and broken journeys.
**Fixed?** **No — needs a business decision:** delete the legacy course surface (recommended) or bring it in line with the live product. Not deleted unilaterally because the team may still intend to ship a course.

### L2 — [HIGH] "Not FCA regulated" was missing from the live landing page; adviser wording implied in-house regulated advice
**Where:** `public/v2.html`.
**What (before):** the live landing had **no** "not FCA regulated / not advice" disclaimer, while claiming to be **"a team of Accountants, Wealth Managers, Financial Advisers"** (`v2.html:870`) and repeatedly offering **"our financial advisor"** (`v2.html:896,926,1089,1148`). This implies the company itself gives regulated financial advice — contradicting the Terms ("not regulated… we refer to FCA-regulated advisors", `terms.html:24,39`) and creating FSMA/ASA risk.
**Fixed?** **Yes (copy):**
- Added a prominent **"not a financial adviser / not FCA-regulated / general information only"** disclaimer to the `v2.html` footer.
- Reworded the team claim to "backgrounds in accountancy, tax and personal finance" (`v2.html:870`).
- Reworded "our financial advisor" → **"an independent FCA-regulated financial adviser"** throughout (`v2.html`).
**Human action still needed:** confirm you actually have a real, FCA-regulated adviser arrangement to deliver the "Complete" call; otherwise that feature is undeliverable and itself misleading.

### L3 — [HIGH] Testimonials & statistics not from real, consenting customers
**Where:** `v2.html` final testimonial (was "Claire • Surrey — cut £1,935→£916"); `refund.html:37` ("average customer saves £11,200/year"); plus legacy testimonials (L1).
**Why it matters:** Under the **Consumer Protection from Unfair Trading Regulations 2008** and the **ASA/CAP Code**, testimonials must be **genuine, verifiable, and held on file with the customer's consent**, and statistics must be substantiated. For a pre-launch product these cannot be real. Using them is a **misleading action** (CPUT reg 5) and an ASA breach.
**Fixed?**
- `v2.html`: converted the "Claire" quote into a clearly-labelled **illustrative example** ("not a customer testimonial").
- `refund.html`: **removed** "average customer saves £11,200/year" and the "£2,000–£4,000 guaranteed" claim.
- **Legacy** testimonials (`checkout.html`) **not fixed** — part of L1 decision.
**Human action:** either source real, documented, consenting testimonials or keep all social proof labelled as illustrative.

### L4 — [HIGH] Price inconsistency across the site (now partially fixed)
**Where:** £19/£49 (`v2.html`, `v2-calculator.js`, `v2-success.html`) vs **£79** (`terms.html:27`, `refund.html`, `checkout.html`, `index.html`).
**Fixed?** **Terms and Refund updated to £19/£49** and to describe the report product. **Legacy pages still say £79** (L1). Pricing must be identical everywhere at launch.

### L5 — [HIGH] Guarantee wording was contradictory
**Where:** `v2.html` ("no questions asked"), FAQ ("if you don't save money… full refund"), `refund.html` (was "if it doesn't save you £79 in the first year").
**Why it matters:** A "no questions asked" 30-day refund and a "must prove you didn't save £79 over a year" refund are legally different promises. Inconsistent terms are unenforceable/unfair.
**Fixed?** **Yes:** standardised on a single **voluntary 30-day, no-questions-asked** guarantee in `refund.html` and `terms.html`, and added the **digital-content cancellation-rights** note to `terms.html` (14-day statutory right waived on immediate access). **Human action:** legal to confirm final wording.

### L6 — [MEDIUM] Savings claims need substantiation / caveats
**Where:** meta "save up to £17,000/year" (`v2.html:7`); FAQ "salary sacrifice typically saves £2,000–£5,000", "30 hours worth up to £6,000/child" (`v2.html:1132,1134`); over-£100k TFC shown despite ineligibility (U-A/U6); self-employed salary-sacrifice shown (Persona C).
**Why it matters:** "Up to" figures are defensible only if a real household could achieve them; showing schemes a user is ineligible for is misleading.
**Fixed?** Disclaimer added (L2) helps, but **calculator display logic (U6) needs engineering** to not show ineligible schemes as savings. **Human/engineering action.**

### L7 — [MEDIUM] No company identity / trading disclosures
**Where:** entire site.
**What:** No registered company name, number, or geographic address anywhere (required by the Companies Act trading disclosures and the Consumer Contracts Regulations for distance selling). Contact email domain is also inconsistent: `hello@the100kparent.co.uk` vs `privacy@the100kparent.co.uk` vs site `the100kparent.com`.
**Fixed?** No — **human action** (add business identity + consistent domain; placeholders added in `privacy.html`).

### L8 — [LOW] "HMRC-compliant" phrasing
**Where:** `v2.html` ("all HMRC-compliant"), report copy.
**What:** "Compliant" is a strong assurance. Prefer "based on current HMRC rules" (as the report disclaimer already says). Minor.
**Fixed?** No — low priority wording.

---

## 5. What was fixed vs what needs a human

**Fixed in code (staged, not deployed):**
- S5 PII log removed (`route.ts`).
- L2 FCA disclaimer added + adviser/team wording corrected (`v2.html`).
- L3 "Claire" testimonial made illustrative (`v2.html`); unverifiable stats removed (`refund.html`).
- L4/L5 pricing + guarantee reconciled and digital-content rights added (`terms.html`, `refund.html`).
- D1 privacy policy rewritten to be accurate + processors/lawful basis/retention (`privacy.html`).
- U-links dead "Reviews" nav anchors removed (`v2.html`).

**Needs human decision / engineering / external sign-off:**
- **S1/S2/S3 (Critical):** build real Stripe checkout + gate the report + remove Test Mode. *Launch blocker.*
- **L1/U8:** delete or reconcile the legacy course pages.
- **D3:** register with ICO (£40 Tier 1).
- **D4:** sign DPAs (Stripe, Loops, Vercel).
- **D1/L7:** fill company identity + ICO number; single contact domain.
- **D2:** add cookie notice; consider self-hosting fonts.
- **L3:** source real testimonials or keep everything illustrative.
- **L6/U6:** fix calculator so ineligible schemes aren't shown as savings (over-£100k TFC; self-employed salary sacrifice; single-parent 30-hours logic).
- **S4/S6:** confirm secrets in Vercel + rotate; untrack `.DS_Store`/`.vercel`.
- Legal review of all final copy and policies.

See `todo-list.md` for the actionable checklist.
