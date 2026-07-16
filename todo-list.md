# The 100k Parent — Pre-Launch To-Do List

Simple, prioritised checklist. Full detail in `audit-report.md`.
**Deployed to production** (the100kparent-unified.vercel.app) as of July 2026 — the code items below marked DONE are live.

---

## ✅ DONE — fixed automatically in code (please verify, then deploy)

- [x] Removed customer email/name (PII) from server logs — `app/api/webhook/route.ts`
- [x] Added a clear **"not a financial adviser / not FCA-regulated / general information only"** disclaimer to the live landing footer — `public/v2.html`
- [x] Reworded "we are a team of … Financial Advisers" → "backgrounds in accountancy, tax and personal finance" — `public/v2.html`
- [x] Reworded every "our financial advisor" → "an independent FCA-regulated financial adviser" — `public/v2.html`
- [x] Converted the "Claire • Surrey" testimonial into a clearly-labelled **illustrative example** (not a customer testimonial) — `public/v2.html`
- [x] Removed the unverifiable "average customer saves £11,200/year" and "£2,000–£4,000 guaranteed" claims — `public/refund.html`
- [x] Reconciled the money-back guarantee to a single **30-day, no-questions-asked** promise everywhere — `public/refund.html`, `public/terms.html`
- [x] Fixed the product price in the legal pages (£79 → £19/£49) and described the report product — `public/terms.html`, `public/refund.html`
- [x] Added digital-content cancellation-rights wording (14-day right waived on immediate access) — `public/terms.html`
- [x] Rewrote the Privacy Policy to be accurate: localStorage-only calculator data, named processors (Stripe/Loops/Vercel), lawful bases, retention, international transfers, UK-GDPR rights — `public/privacy.html`
- [x] Removed the dead "Reviews" nav links pointing to a non-existent `#testimonials` section — `public/v2.html`
- [x] Added a "Refunds" link to the landing footer — `public/v2.html`

---

## 🔴 NEEDS 100K PARENT TEAM DECISION (human / legal / business)

- [ ] **Build a real payment path (LAUNCH BLOCKER).** The site currently has no working checkout and gives the paid report away free via a "Test Mode / Simulate Payment" modal. *Recommendation: implement Stripe Checkout, then gate `v2-success.html` behind a verified payment/entitlement; remove the Test Flow harness.*
- [ ] **Gate the report so it isn't a public URL (LAUNCH BLOCKER).** Anyone can open `/v2-success.html` today. *Recommendation: require a signed session/token from a completed Stripe payment before rendering.*
- [x] **Decide the fate of the legacy pages** (`index.html`, `checkout.html`, `success.html`, `dashboard.html`, `module-0..8.html`, `calculator.js`, `module-tools.js`) and their `vercel.json` rewrites. *(Done: removed — verified unused/unlinked from the live funnel; staged via `git rm` so recoverable. Legacy rewrites stripped from `vercel.json`.)*
- [ ] **Confirm you have a real, FCA-regulated adviser** to deliver the "Complete £49" 30-minute call. *Recommendation: secure a written referral arrangement or remove the feature until you do.*
- [ ] **Source real testimonials or keep all social proof illustrative.** *Recommendation: only publish genuine, consenting, documented testimonials (CPUT 2008 / ASA); otherwise label every example "illustrative".*
- [ ] **Register with the ICO and pay the data protection fee.** *Recommendation: Tier 1, £40/year (£52 if not by Direct Debit) — do before launch.*
- [ ] **Sign Data Processing Agreements** with Stripe, Loops and Vercel, and keep records. *Recommendation: accept each provider's standard DPA + confirm UK IDTA/SCC transfer terms.*
- [ ] **Get all final copy and the Privacy/Terms/Refund policies reviewed by a solicitor.** *Recommendation: quick fixed-fee consumer-law + data-protection review before going live.*
- [ ] **Rotate the API keys** in `.env.local` (Stripe webhook secret, Loops key) as a precaution and confirm they are set only as Vercel env vars. *Recommendation: rotate if the file was ever shared/screenshared.*

---

## 🟠 TO DO BEFORE LAUNCH (prioritised actions)

1. [ ] Wire real Stripe Checkout for the £19 and £49 products and remove the "Test Flow" modal + nav links from `public/v2.html`.
2. [ ] Add server-side entitlement so `public/v2-success.html` only renders after a verified purchase.
3. [x] Delete (or fully reconcile) the legacy pages listed above and remove their `vercel.json` rewrites. *(Done — removed via `git rm`; rewrites cleaned.)*
4. [x] Fix the calculator so it does **not** show schemes the user can't claim: hide/zero **Tax-Free Childcare** for over-£100k households, hide **salary sacrifice** for self-employed users, and correct the **single-parent 30-hours** eligibility logic (`public/v2-calculator.js`). *(Done: display figures now gated on real eligibility; TFC netted after funded hours; self-employed credited via personal-pension route; 30-hours min-income threshold updated to 2025/26.)*
5. [x] Reject negative and non-sensical inputs in the calculator (currently only `0` is blocked) — `public/v2-calculator.js`. *(Done: rejects negatives, requires positive income/children/childcare, validates partner income and pension-vs-income.)*
6. [ ] Fill in company identity everywhere: registered name, company number, address, and one consistent contact domain (pick `.co.uk` or `.com`) — update `privacy.html`, `terms.html` `[TO COMPLETE]` fields and footers.
7. [ ] Add your ICO registration number to the Privacy Policy.
8. [x] Publish a short **Cookie / Local-Storage notice** and link it in the footer. *(Done: new `public/cookies.html`; linked in the landing footer and from the Privacy Policy; resolved the `[TO COMPLETE]` cookie placeholder.)*
9. [x] Self-host web fonts (or document the Google Fonts transfer) to avoid an unnecessary US data transfer. *(Done: Inter/Caveat/Space Grotesk/JetBrains Mono self-hosted as woff2 in `public/fonts/` via `fonts.css`; all Google Fonts links/@import removed from `v2.html`, `v2-success.html` (incl. the PDF popup) and `styles.css`.)*
10. [x] Fix broken/placeholder links if any legacy page is kept: `advisor.html` (missing), dead `href="#"` legal links, placeholder Memberstack ID, test Stripe link (`checkout.html`). *(N/A — legacy pages removed, so nothing to fix.)*
11. [x] Substantiate or caveat all savings figures ("up to £17,000/year", "£2,000–£5,000", "up to £6,000/child"); keep evidence on file. *(Done: caveated the meta description, FAQ figures and the over-£100k warning; corrected the salary-sacrifice line (was describing closed childcare vouchers); added an estimates note + GOV.UK link in the FAQ; created `claims-substantiation.md` evidence record. Still to attach: dated nursery-fee screenshots — noted in that file.)*
12. [ ] Test the PDF download on a real old Android device (pop-up + `window.print()` reliability) — `public/v2-success.html`.
13. [ ] `git rm --cached .DS_Store .vercel/*` so they stop being tracked.
14. [ ] Confirm all secrets are set in Vercel env (Production + Preview) and none are in client code (verified none currently are).
15. [x] Final pass: make price, guarantee, and product description identical on every page. *(Done: removed stale £19/Essential from the mobile-nav & floating CTAs, the success-page default tier, and the legal pages (terms/refund) — now £49 Complete everywhere customer-facing; guarantee is a single "30-day, no-questions-asked, full refund" across all pages; no £79 left anywhere. Also fixed a script-breaking bug where the hidden Essential CTA's `querySelector(...).addEventListener` threw null.)*
