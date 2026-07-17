/**
 * The calculator's smoke alarm.
 *
 * Every number checked here was verified by hand on 17 July 2026 against the
 * real shipped calculator. The expected values live in baseline.json, not in
 * this file, so the same numbers can also be checked against
 * WAKING-UP-CHECKLIST.md (see waking-up.test.js).
 *
 * Run with:  npm test
 *
 * If something goes red, read tests/README.md before touching anything.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { runCalculator } = require('./run-calculator');
const baseline = require('./baseline.json');

const money = (n) => `£${Number(n).toLocaleString('en-GB')}`;

/** Check every field in a case's `expect` block against what the calculator did. */
function assertExpectations(kase) {
  const outcome = runCalculator(kase.inputs);

  assert.equal(outcome.crashed, null, `The calculator threw an error: ${outcome.crashed}`);
  assert.ok(
    outcome.results,
    `The calculator refused to run and said: "${outcome.alerts[0] ?? '(nothing)'}". It was expected to produce figures.`,
  );

  for (const [field, expected] of Object.entries(kase.expect)) {
    const actual = outcome.results[field];
    const detail = typeof expected === 'number' && expected > 100
      ? `expected ${money(expected)}, got ${money(actual)}`
      : `expected ${expected}, got ${actual}`;
    assert.equal(actual, expected, `${kase.label}\n  ${field}: ${detail}\n  Why this matters: ${kase.why}`);
  }

  return outcome.results;
}

// ─────────────────────────────────────────────────────────────────────────────
// The headline numbers. These are the ones quoted in WAKING-UP-CHECKLIST.md.
// ─────────────────────────────────────────────────────────────────────────────

test('known-good headline figures still hold', async (t) => {
  for (const kase of baseline.wakingUpCases) {
    await t.test(`${kase.id}) ${kase.label}`, () => {
      assertExpectations(kase);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// The £100,000 cliff edge.
//
// READ THIS BEFORE "FIXING" ANYTHING HERE.
//
// At £100,000 the headline is £8,985. At £100,001 it drops to £1,210. One extra
// pound of income wipes out roughly £7,775 of support. That looks insane, and it
// IS insane, but it is NOT a bug in this calculator: it is how the UK rules
// actually work. Tax-Free Childcare and the 30 funded hours are lost ENTIRELY
// the moment adjusted net income passes £100,000. There is no taper. It is a
// genuine cliff edge, and it is tested per parent, not on household income.
// Showing the customer a softened or averaged number here would be lying to them.
//
// What WOULD be a bug, and what these tests actually guard, is the PENSION
// RELIEF collapsing across the line. It used to: £1,210 at £100,000 and £1 at
// £100,001, because the code ran two different formulas either side. It now runs
// one model, so relief stays ~£1,210 on both sides. If the relief figures below
// diverge from each other, that old bug is back.
// ─────────────────────────────────────────────────────────────────────────────

test('the £100k cliff behaves correctly on both sides', async (t) => {
  const at = baseline.wakingUpCases.find((c) => c.id === 'c1');
  const justOver = baseline.wakingUpCases.find((c) => c.id === 'c2');

  const atCliff = runCalculator(at.inputs).results;
  const overCliff = runCalculator(justOver.inputs).results;

  await t.test('pension relief does NOT collapse for £1 of extra income', () => {
    assert.equal(
      atCliff.displaySalary,
      overCliff.displaySalary,
      'Pension relief changed across the £100k line. It should be the same on both sides '
      + `(${money(atCliff.displaySalary)} vs ${money(overCliff.displaySalary)}). `
      + 'This is the old two-formulas bug returning.',
    );
  });

  await t.test('childcare support IS lost entirely one pound over (correct, not a bug)', () => {
    assert.ok(atCliff.displayTfc > 0, 'At exactly £100,000 the family should still get Tax-Free Childcare.');
    assert.ok(atCliff.displayThirtyHours > 0, 'At exactly £100,000 the family should still get funded hours.');
    assert.equal(overCliff.displayTfc, 0, 'One pound over £100,000, Tax-Free Childcare must be £0.');
    assert.equal(overCliff.displayThirtyHours, 0, 'One pound over £100,000, funded hours must be £0.');
  });

  await t.test('the lost support is explained as an unlock, not silently dropped', () => {
    assert.ok(
      overCliff.unlockTotal > 0,
      'A family just over the cliff should be told what a pension contribution would unlock. '
      + 'Otherwise the £0 looks like a broken calculator.',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases and nonsense input.
// ─────────────────────────────────────────────────────────────────────────────

test('edge cases stay sensible', async (t) => {
  for (const kase of baseline.extraCases) {
    await t.test(kase.label, () => {
      assertExpectations(kase);
    });
  }
});

test('nonsense input is rejected with a clear message, never a crash or a wrong number', async (t) => {
  for (const kase of baseline.rejectedInputs) {
    await t.test(kase.label, () => {
      const outcome = runCalculator(kase.inputs);
      assert.equal(outcome.crashed, null, `The calculator threw instead of rejecting: ${outcome.crashed}`);
      assert.ok(
        outcome.alerts.length > 0,
        'Expected the calculator to show the user a message explaining what was wrong.',
      );
      assert.equal(
        outcome.results,
        null,
        'The calculator rejected the input but saved figures anyway. Those figures could then be '
        + 'rendered into a paid report.',
      );
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Rules that must hold for EVERY input, not just the ones we thought of.
// ─────────────────────────────────────────────────────────────────────────────

test('rules that must hold for every set of inputs', async (t) => {
  const everyCase = [...baseline.wakingUpCases, ...baseline.extraCases];

  for (const kase of everyCase) {
    const r = runCalculator(kase.inputs).results;
    if (!r) continue;
    const annualChildcare = r.monthlyChildcare * 12;

    await t.test(`${kase.label}: no figure is NaN`, () => {
      for (const field of ['displayTotal', 'displayTfc', 'displaySalary', 'displayThirtyHours']) {
        assert.ok(
          Number.isFinite(r[field]),
          `${field} came out as ${r[field]}. A customer would see "£NaN" in their paid report.`,
        );
      }
    });

    await t.test(`${kase.label}: childcare support never exceeds the childcare bill`, () => {
      assert.ok(
        r.displayTfc + r.displayThirtyHours <= annualChildcare + 1,
        `Claimed ${money(r.displayTfc + r.displayThirtyHours)} of childcare support against a `
        + `${money(annualChildcare)} bill. You cannot save more than you spend.`,
      );
    });

    await t.test(`${kase.label}: over £100k means no childcare support at all`, () => {
      if (!r.over100k) return;
      assert.equal(r.displayTfc, 0, 'Over the £100k cliff, Tax-Free Childcare must be £0.');
      assert.equal(r.displayThirtyHours, 0, 'Over the £100k cliff, funded hours must be £0.');
    });

    await t.test(`${kase.label}: Tax-Free Childcare respects the £2,000 per child cap`, () => {
      assert.ok(
        r.displayTfc <= baseline.assumptions.tfcCapPerChild * r.numChildren,
        `Tax-Free Childcare of ${money(r.displayTfc)} exceeds the cap for ${r.numChildren} child(ren).`,
      );
    });

    await t.test(`${kase.label}: pension contribution stays within the annual allowance`, () => {
      if (r.totalContribution <= 60000) return;
      assert.ok(
        r.allowanceExceeded,
        `Recommended a ${money(r.totalContribution)} pension contribution without flagging that it `
        + 'exceeds the annual allowance.',
      );
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// The assumptions the maths rests on. If someone edits a rate, this catches it.
// ─────────────────────────────────────────────────────────────────────────────

test('the calculator still uses the assumptions we signed off', async (t) => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'v2-calculator.js'), 'utf8');

  await t.test(`funded hours use the £${baseline.assumptions.fundedHourlyRate}/hour rate`, () => {
    const match = source.match(/const FUNDED_HOURLY_RATE = ([\d.]+);/);
    assert.ok(match, 'Could not find FUNDED_HOURLY_RATE in v2-calculator.js.');
    assert.equal(
      Number(match[1]),
      baseline.assumptions.fundedHourlyRate,
      'The funded-hours rate changed. If that was deliberate, update baseline.json AND the '
      + 'note shown to customers, which quotes the rate.',
    );
  });

  await t.test('the customer-facing note quotes the same rate the maths uses', () => {
    assert.ok(
      source.includes(`£${baseline.assumptions.fundedHourlyRate}/hour`),
      `The note shown to customers no longer quotes £${baseline.assumptions.fundedHourlyRate}/hour. `
      + 'The rate we tell people must match the rate we calculate with.',
    );
  });

  await t.test('the £100,000 cliff is still £100,000', () => {
    const match = source.match(/const ANI_CLIFF = (\d+);/);
    assert.ok(match, 'Could not find ANI_CLIFF in v2-calculator.js.');
    assert.equal(Number(match[1]), baseline.assumptions.aniCliff);
  });

  await t.test('the 45% additional rate band still exists', () => {
    assert.ok(
      /125140[^\n]*tax: 0\.45/.test(source),
      'The 45% additional-rate band is missing from RELIEF_BANDS. Its absence was a real bug once: '
      + 'it understated a £130k earner by about £5,271.',
    );
  });
});
