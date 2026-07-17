# The calculator's smoke alarm

**Plain English. You do not need to be a developer to use this.**

---

## What this is

The calculator gives the right numbers today. Nothing else guards them.

If anyone changes the code later, a number could quietly go wrong. Nobody would notice, because a wrong number does not look broken. It looks like a number. A customer would find it, or a regulator would, and by then it has been wrong for weeks.

This is a smoke alarm for the maths. It re-checks a set of known-good answers every time it runs, in about a tenth of a second, and shouts if one of them moves.

It does not test how the site looks. It tests whether the sums are still right.

---

## How to run it

```
npm test
```

That is the whole thing. It takes about a second.

You will see a list of green ticks. At the bottom you want to see:

```
ℹ pass 100
ℹ fail 0
```

**It also runs by itself before every deploy.** You do not have to remember. If a number is broken, the build stops and the site does not update. That is deliberate: a site that fails to deploy is a bad afternoon, but a site that quietly tells parents the wrong number is a much worse problem.

---

## What if a test goes red?

**A red test means a recent change broke a number. It is the alarm working, not the alarm malfunctioning.**

Do not delete the test. Do not edit `baseline.json` to make the number match. That is the equivalent of taking the battery out of a smoke alarm because it is beeping. The test is the only thing standing between a wrong figure and a paying customer.

Do this instead:

1. **Read the failure message.** They are written in English and say which number moved, from what, to what, and why it matters.
2. **Ask: did someone change the maths on purpose?**
   - **No, nobody touched it** → something is genuinely broken. Do not deploy. Get it fixed.
   - **Yes, deliberately** → then the new number needs checking by a human who is sure it is right. Only once someone has confirmed the new answer is correct do you update `tests/baseline.json`, and then also update the figures in `WAKING-UP-CHECKLIST.md` so the two agree.
3. **If you are not sure, stop and ask.** A failing test is cheap. A wrong number in a paid report is not.

If you want a hand, paste this into Claude Code:

> **`npm test` is failing. Do not change any test or baseline to make it pass. Show me which number moved, what changed in the code to move it, and tell me whether the old number or the new one is correct.**

---

## What each file does

| File | What it is |
|---|---|
| `baseline.json` | **The known-good numbers.** The single source of truth. This is the only file with figures in it. |
| `run-calculator.js` | The plumbing. Builds a fake web page so the real calculator can run outside a browser. You should never need to open this. |
| `calculator.test.js` | The maths checks. |
| `waking-up.test.js` | Checks the calculator against `WAKING-UP-CHECKLIST.md`, and checks that the checklist's printed numbers still agree with the tests. |

**These tests run the REAL `public/v2-calculator.js`** — the exact file customers use. They do not contain a copy of the sums. If they did, they would only prove that our copy agrees with our copy, and a real bug would sail straight through.

---

## What it actually checks

**The headline numbers** (the same four quoted in `WAKING-UP-CHECKLIST.md`):

| Case | Expected |
|---|---|
| £60,000, one 2-year-old, £800/month | **£8,985** |
| £130,000, one 3-year-old, £1,250/month | **£17,871**, all of it pension relief |
| Exactly £100,000 | **£8,985** |
| Exactly £100,001 | **£1,210** |

**The £100,000 cliff.** This one has a trap in it, so it is worth understanding.

At £100,000 the saving is £8,985. At £100,001 it drops to £1,210. One extra pound wipes out about £7,775.

**That is not a bug.** That is how the UK rules genuinely work. Tax-Free Childcare and the 30 funded hours are lost *entirely* the moment income passes £100,000. There is no gradual taper. It is a real cliff edge, and it is tested per parent, not on household income. Softening that number would be lying to the customer about their own position.

What the test actually guards is the **pension relief**, which must stay at about £1,210 on *both* sides. It used to collapse to £1, because the code ran two different formulas either side of the line. That was a real bug. If those two figures ever drift apart again, the test goes red.

There is a long comment saying all this in `calculator.test.js`, so that nobody comes along later and "fixes" behaviour that is already correct.

**Nonsense input.** Zero income, blank income, negative income, no children, no childcare cost, an unselected child's age, a partner ticked but left blank, a negative pension, a pension bigger than the salary. Every one must be turned away with a clear message. None may crash, and none may produce a number.

The worst outcome here is not a crash. It is `£NaN` appearing where a saving should be, or a confident figure built from half-filled input. There is a specific test that no figure can ever come out as `NaN`.

**Rules that must hold for every input**, not just the ones we thought of:

- Childcare support can never exceed the childcare bill. You cannot save more than you spend.
- Over £100,000, Tax-Free Childcare and funded hours are always £0.
- Tax-Free Childcare never exceeds £2,000 per child.
- A recommended pension contribution above the annual allowance must be flagged, never quietly suggested.

**The assumptions underneath.** If someone edits the funded-hours rate, the £100,000 cliff, or removes the 45% tax band, the tests notice. The 45% band is specifically checked because its absence was a real bug: it understated a £130,000 earner by about £5,271.

There is also a test that the rate **shown** to customers matches the rate the maths **uses**. Those drifting apart is exactly the kind of thing nobody spots by eye.

---

## Why `baseline.json` and `WAKING-UP-CHECKLIST.md` are tied together

`WAKING-UP-CHECKLIST.md` quotes the expected numbers so you can check for drift by hand after time away.

That checklist has already gone stale once. Its numbers were written before the maths was fixed, so every one of them was wrong. A checklist with stale numbers is worse than no checklist at all: it cries wolf on every check, and you learn to ignore it.

So `waking-up.test.js` now **reads the checklist** and compares the numbers printed in it against `baseline.json`. If either drifts, `npm test` goes red and tells you which one disagrees. They cannot silently fall out of step.

---

## Adding a new test

Add a case to `baseline.json`. You do not need to write any code — the tests read that file and pick it up.

```json
{
  "id": "short-name",
  "label": "What this case is, in English",
  "why": "Why it matters if this breaks",
  "inputs": { "income1": "75000", "numChildren": "2", "childcare": "900", "ages": [3, 6] },
  "expect": { "displayTotal": 12345 }
}
```

Put it in `extraCases` for an ordinary case, or `rejectedInputs` for input that should be turned away.

**Get the expected number from the real calculator, not from your head.** Run the case, check the answer is genuinely correct, and only then write it down. A baseline copied from a guess is worse than no baseline.
