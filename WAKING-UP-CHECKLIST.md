# Waking Up — The 100k Parent

**What this is for:** you have been away from this project for a few weeks. Things break silently while nobody is looking — a dependency updates, someone else pushes a change, an external link dies. This checklist confirms nothing has quietly broken.

**Time needed:** about 10 minutes.
**You do not need to understand any of it.** Copy the bold text, paste it into Claude Code, read the answer.

---

## Step 1 — Start the right way

Double-click the **100kParent** icon on your Desktop. Wait a few seconds. Claude Code opens by itself.

Do not open Claude Code on its own, and do not reuse a window you left open. The double-click is what pulls down the latest version of the site — including anything anyone else has changed while you were away. Skip it and you are working on an old copy.

---

## Step 2 — Ask what changed while you were away

Paste this in:

> **Since I have been away: pull the latest from GitHub and tell me if anything came down. Then show me every commit made since the last one I saw, who made it, and what it actually changed. If there are any conflicts with work already on this machine, STOP and tell me rather than continuing.**

If it says it pulled cleanly, carry on. **If it mentions a conflict or a problem, stop and ask for help — do not try to fix it yourself and do not push.** That is the one situation where work can actually be lost.

---

## Step 3 — Does it still build?

Paste this in:

> **Run the real production build (`next build`) and tell me plainly whether it passes. If it fails, show me the actual error and tell me whether it is my code or a dependency that changed underneath me.**

This is the single most important check. **If the build fails, nothing else on this list matters — the site cannot update until it is fixed.**

---

## Step 4 — Do the pages still load?

Paste this in:

> **Start the site locally and check every page and route for errors. Confirm the homepage `/` still serves the v2 site with no `/v2` in the address bar, that `/v2` and `/v2.html` still redirect to `/`, and that the legal pages still load. Give me a simple pass/fail table. Say so loudly if anything 500s.**

---

## Step 5 — Are the calculator's numbers still what they were?

Paste this in:

> **Run the real `public/v2-calculator.js` against these three cases and show me the headline number for each: (a) single parent, £60,000, one 2-year-old, £800/month childcare; (b) single parent, £130,000, one 3-year-old, £1,250/month; (c) exactly £100,000 and exactly £100,001, same other inputs. Do not re-implement the calculator — execute the real shipped file.**

**As of 17 July 2026 these gave:** (a) **£7,354** — (b) **£22,200** — (c) **£7,354** at £100,000 and **£6,145** at £100,001.

If any number has moved and nobody meant to change it, something has broken. **Note: (b) and (c) were both flagged as wrong in the audit** — if they have changed because someone fixed them, that is good news. Ask which it is.

---

## Step 6 — Are the external links still alive?

Paste this in:

> **Check every external link in the site — especially the Calendly booking links in `v2-success.html` and `booking_new/page.tsx` — and tell me which return 404 or have moved.**

**As of 17 July 2026 both Calendly links were 404.** External links rot without warning and nothing in the code will tell you. This is the check most worth repeating.

---

## Step 7 — Can the site take money yet?

Paste this in:

> **Trace exactly what happens when a user clicks the buy button. Is there a real Stripe checkout that takes money, or does it still link straight to the report? Tell me plainly which.**

**As of 17 July 2026 there was NO checkout** — the buy button linked directly to the product and the site could not take a penny. If that is still the answer, the site is still not launchable, regardless of how good everything else looks.

---

## Step 8 — Has anything gone hollow?

Paste this in:

> **Hunt for anything that looks finished but does nothing: buttons with no action, links pointing at pages or anchors that no longer exist, placeholder text, and any CTA that loops back on itself. Judge whether things WORK, not just whether they exist.**

---

## Step 9 — Re-read the audit, but do not trust it

Paste this in:

> **Read `audit-report.md` and `todo-list.md`, then re-verify the top five findings against the actual code. Tell me which are still true, which have been fixed, and which the reports get wrong now.**

**This matters.** The previous audit in this repo went stale within a fortnight — it described a file (`app/page.tsx`) that no longer exists. **This audit will go stale the same way.** The reports are a starting point, never the last word. The code is the truth.

---

## Step 10 — Leave it clean

Paste this in:

> **Show me whether everything is committed and pushed, and confirm my local branch matches origin/main. If anything is unpushed, tell me clearly rather than leaving it on this machine.**

Never end a session with work sitting only on this laptop.

---

## The short version

| # | Check | Healthy answer |
|---|---|---|
| 1 | Started via the Desktop icon | Latest pulled, no conflicts |
| 2 | What changed while away | You recognise every commit |
| 3 | **Does it build?** | **`next build` passes** |
| 4 | Pages load | No 500s; `/` serves v2 |
| 5 | Calculator numbers | Match, or changed on purpose |
| 6 | External links | Calendly resolved (was 404) |
| 7 | **Can it take money?** | **Real Stripe checkout (was none)** |
| 8 | Nothing hollow | No dead buttons |
| 9 | Audit re-verified | You know what is now stale |
| 10 | Committed and pushed | Local matches origin/main |

**If you only do two:** does it still build (Step 3), and can it take money yet (Step 7).

---

## If something looks wrong

Do not guess and do not push. Paste this in:

> **Something looks wrong and I do not want to make it worse. Do not change anything. Explain in plain English what you think has happened, what the risk is, and what my options are.**

Then ask a human. Nothing here is so urgent that it is worth breaking the site over.
