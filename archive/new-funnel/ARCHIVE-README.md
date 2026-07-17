# Archived: the `_new` advisor funnel

**Parked pre-launch on 17 July 2026.** Nothing here is deleted, and nothing here is live.

These files were moved out of `app/` into `archive/new-funnel/`. Next.js only builds routes from `app/`, so **these pages no longer resolve and their old URLs now return 404 naturally** — there are no redirects, by design.

---

## What it was

A second, separate product living in the same repo as the live site: a **questionnaire leading to a paid advisor-consultation booking**, distinct from the live calculator → £49 PDF report product.

The intended journey:

```
/start_new            pick an income band
  ├─ £150k+, or £100k-149k with a £125k+ pension
  │    → /questionnaire_new   name, email, salary, pension, childcare costs
  │    → /booking_new         savings estimate, then a Calendly booking for a £60 PFA session
  ├─ £60-79k / £80-99k / £100-149k with a smaller pension
  │    → /guides_new          tax guides at £19 / £24 / £29 / £49
  └─ under £60k
       → mailto: waitlist
```

Supporting pages: `/home_new` (its own landing page), `/advisor-booking_new` (the £60 session sales page), and its own `/terms_new` and `/privacy-policy_new`.

## Why it was parked

The pre-launch health test (see `audit-report.md` at the repo root) found it was **live and publicly reachable in production, but every terminal path was a dead end**. It looked finished and finished nothing:

- **The booking went nowhere.** The Calendly URL returned 404, and it was embedded in an `<iframe>`, so users got a blank grey box rather than an error.
- **The questionnaire data was never transmitted.** It wrote to `localStorage` and nothing else. There were zero `fetch` calls anywhere in the funnel. Meanwhile `booking_new` told the user *"Your PFA will have reviewed your questionnaire in advance"*. Nobody received it.
- **The four "Get Guide" buy buttons did nothing.** They were bare `<button>` elements with no `onClick` handler, and no guide files existed in the repo.
- **It leaked into the live product.** Every page's logo linked to `/`, dropping users mid-funnel into the report product, with a different price and no way back.
- **Its savings figures were mostly hardcoded ranges** (`5028`, `6285`, `3000-8000`, `4000-12000`) rather than derived from what the user entered.
- **Duplicate legal pages.** `terms_new` and `privacy-policy_new` duplicated the live site's Terms and Privacy, and had already drifted onto a different contact domain.

Phase 4 mitigated the immediate risks (added `noindex`, closed the logo trap, consolidated the domain, fixed the Tax-Free Childcare formula and its £100k cliff bug). Archiving is the next step: rather than leave an unfinished product publicly reachable, it is parked until the **finish-or-kill decision** is made.

## State when archived

Everything Phase 4 changed is preserved here, so this is not the state the audit found:

- `noindex, nofollow` via each directory's `layout.tsx`
- The logo points at `/home_new`, not `/`
- Contact addresses consolidated on `the100kparent.com`
- Tax-Free Childcare uses the shared 20% rate and £2,000 per-child cap, labelled as unavailable above £100,000 of adjusted net income
- The adviser is described by FCA status, never as "independent"

**Still broken and never fixed** (this is what finishing it would mean):

- The Calendly URL still 404s (`booking_new/page.tsx`, marked `TODO: Calendly re-signup pending`)
- The questionnaire still transmits nothing
- The four guide buy buttons still have no handler, and no guide files exist
- `start_new` and `guides_new` still quote prices that cannot be bought
- The hardcoded savings ranges are still magic numbers

## How to bring it back

1. `git mv archive/new-funnel/<page>_new app/<page>_new` for each page you want, and `git mv archive/new-funnel/components app/components`. The relative import `'../components/...'` resolves in both locations, so it needs no edit.
2. Remove `"archive"` from `exclude` in `tsconfig.json`.
3. Remove the `robots: { index: false, follow: false }` from each `layout.tsx` when the page is genuinely ready to be found.
4. **Fix the four "still broken" items above first.** The reason this was archived is that it looked finished and was not, which is worse for a customer than a page that plainly does not exist.

## What this does not affect

The live v2 site is untouched. It is served from `public/` (`v2.html`, `v2-calculator.js`, `v2-success.html`) via a rewrite in `next.config.ts`, and never referenced `_new` at any point. `app/api/webhook/route.ts` is also unaffected.
