/**
 * Keeps WAKING-UP-CHECKLIST.md honest.
 *
 * That checklist quotes the calculator's expected numbers so you can spot drift
 * after being away for a few weeks. A checklist with stale numbers is worse than
 * no checklist: it cries wolf on every check, and you learn to ignore it. That
 * already happened once, when the numbers written there were from before the
 * maths was fixed.
 *
 * These tests do two things:
 *   1. Run the real calculator and confirm it still produces the baseline
 *      numbers, so the manual Step 5 check is now automatic.
 *   2. Read WAKING-UP-CHECKLIST.md and confirm the numbers PRINTED there match
 *      the same baseline. So the doc and the tests can never drift apart.
 *
 * baseline.json is the single source of truth for both.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { runCalculator } = require('./run-calculator');
const baseline = require('./baseline.json');

const CHECKLIST_PATH = path.join(__dirname, '..', 'WAKING-UP-CHECKLIST.md');
const checklist = fs.readFileSync(CHECKLIST_PATH, 'utf8');

const money = (n) => `£${Number(n).toLocaleString('en-GB')}`;
const parseMoney = (s) => Number(s.replace(/,/g, ''));

const expected = (id) => baseline.wakingUpCases.find((c) => c.id === id).expect.displayTotal;

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 of the checklist, run automatically instead of by hand.
// ─────────────────────────────────────────────────────────────────────────────

test('WAKING-UP Step 5: the calculator still produces the baseline figures', async (t) => {
  for (const kase of baseline.wakingUpCases) {
    await t.test(`${kase.id}) ${kase.label} = ${money(kase.expect.displayTotal)}`, () => {
      const results = runCalculator(kase.inputs).results;
      assert.ok(results, 'The calculator produced no figures at all.');
      assert.equal(
        results.displayTotal,
        kase.expect.displayTotal,
        `Headline saving moved from ${money(kase.expect.displayTotal)} to ${money(results.displayTotal)}.\n`
        + `  ${kase.why}\n`
        + '  If someone changed the maths on purpose, update tests/baseline.json AND the figures in '
        + 'WAKING-UP-CHECKLIST.md. If nobody did, something has broken.',
      );
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// The checklist's printed numbers must match the baseline.
// ─────────────────────────────────────────────────────────────────────────────

test('WAKING-UP-CHECKLIST.md quotes the same numbers the tests enforce', async (t) => {
  // Matches the Step 5 line, which reads:
  //   ... (a) **£8,985** · (b) **£17,871** · (c) **£8,985** at £100,000 and **£1,210** at £100,001.
  const printed = {
    a: checklist.match(/\(a\)\s*\*\*£([\d,]+)\*\*/),
    b: checklist.match(/\(b\)\s*\*\*£([\d,]+)\*\*/),
    c: checklist.match(/\(c\)\s*\*\*£([\d,]+)\*\*\s*at £100,000 and \*\*£([\d,]+)\*\*\s*at £100,001/),
  };

  await t.test('the Step 5 figures can still be found in the checklist', () => {
    assert.ok(printed.a, 'Could not find the "(a) **£...**" figure in WAKING-UP-CHECKLIST.md.');
    assert.ok(printed.b, 'Could not find the "(b) **£...**" figure in WAKING-UP-CHECKLIST.md.');
    assert.ok(
      printed.c,
      'Could not find the "(c) **£...** at £100,000 and **£...** at £100,001" figures in '
      + 'WAKING-UP-CHECKLIST.md. If you reworded Step 5, keep the figures in that shape so this '
      + 'test can still read them.',
    );
  });

  const cases = [
    ['a', parseMoney(printed.a[1]), expected('a')],
    ['b', parseMoney(printed.b[1]), expected('b')],
    ['c at £100,000', parseMoney(printed.c[1]), expected('c1')],
    ['c at £100,001', parseMoney(printed.c[2]), expected('c2')],
  ];

  for (const [label, inDoc, inBaseline] of cases) {
    await t.test(`${label}: checklist says ${money(inDoc)}, baseline says ${money(inBaseline)}`, () => {
      assert.equal(
        inDoc,
        inBaseline,
        `WAKING-UP-CHECKLIST.md and tests/baseline.json disagree about case (${label}).\n`
        + `  The checklist tells you to expect ${money(inDoc)}.\n`
        + `  The tests enforce ${money(inBaseline)}.\n`
        + '  Whichever is right, make them match, or the checklist will mislead whoever reads it next.',
      );
    });
  }
});

test('WAKING-UP-CHECKLIST.md still warns that the £100k drop is real', () => {
  assert.ok(
    /real/i.test(checklist) && /cliff/i.test(checklist),
    'The checklist no longer explains that the drop at £100,001 is the genuine UK cliff edge and not '
    + 'a bug. Without that note, someone will eventually "fix" correct behaviour.',
  );
});
