/**
 * V2 Calculator - With Paywall Gate + PDF Report Generator
 * Updated July 2026. All figures based on UK rules as at 6 April 2026 (2026/27).
 */

const TAX_YEAR_LABEL = '2026/27';

/**
 * Marginal relief on a pension contribution, taken from the top of income
 * downwards. England/Wales/NI income tax plus employee National Insurance.
 * The 0.60 in the £100,000-£125,140 band is the EFFECTIVE rate once the
 * personal allowance taper is included (£1 of allowance lost per £2 of
 * adjusted net income over £100,000, taxed at 40%, so 40% + 20% = 60%).
 * Bands must stay ordered highest-first: pensionReliefOn walks them in order.
 */
const RELIEF_BANDS = [
    { from: 125140, to: Infinity, tax: 0.45, ni: 0.02 },
    { from: 100000, to: 125140,   tax: 0.60, ni: 0.02 },
    { from: 50270,  to: 100000,   tax: 0.40, ni: 0.02 },
    { from: 12570,  to: 50270,    tax: 0.20, ni: 0.08 },
    { from: 0,      to: 12570,    tax: 0.00, ni: 0.00 }
];

// Tax-Free Childcare and the funded hours are lost ENTIRELY once either
// parent's adjusted net income exceeds this. A cliff edge, not a taper,
// and tested per parent rather than per household.
const ANI_CLIFF = 100000;

const TFC_RATE = 0.20;
const TFC_CAP_PER_CHILD = 2000;

// Funded hours are valued as an entitlement, not as a share of the user's bill:
// 30 hours x 38 weeks x ~£6/hour. The £6 is a documented working assumption for
// the average English funded-hours rate and is the figure to revisit each year.
const FUNDED_HOURS_PER_WEEK = 30;
const FUNDED_WEEKS_PER_YEAR = 38;
const FUNDED_HOURLY_RATE = 6;
const FUNDED_VALUE_PER_CHILD = FUNDED_HOURS_PER_WEEK * FUNDED_WEEKS_PER_YEAR * FUNDED_HOURLY_RATE;

// 2026/27 minimum income test: each working parent must earn at least the
// equivalent of 16 hrs/week at the national minimum wage.
const MIN_INCOME_TEST = 10158;

const AA_STANDARD = 60000;
const AA_TAPER_START = 260000;
const AA_MINIMUM = 10000;

const HIGHER_RATE_THRESHOLD = 50270;

// Bumped whenever the shape of the stored results changes. The success page
// refuses to render a blob from an older version rather than guessing at
// missing fields, which is what previously allowed stale figures to surface.
const RESULTS_SCHEMA_VERSION = 2;

/**
 * Pension annual allowance, tapered above £260,000 of income.
 */
function annualAllowanceFor(income) {
    if (income <= AA_TAPER_START) return AA_STANDARD;
    return Math.max(AA_MINIMUM, AA_STANDARD - Math.floor((income - AA_TAPER_START) / 2));
}

/**
 * Income Tax (and, for employees, NI) saved by contributing `contribution`
 * into a pension out of `grossIncome`, calculated band by band rather than at
 * a single flat rate. A contribution spanning several bands earns a different
 * rate on each slice, so a flat rate is wrong in both directions.
 * The self-employed cannot salary sacrifice, so they save Income Tax and the
 * personal allowance restoration but not National Insurance.
 */
function pensionReliefOn(grossIncome, contribution, savesNI) {
    let remaining = Math.max(0, contribution);
    let top = Math.max(0, grossIncome);
    let relief = 0;

    for (const band of RELIEF_BANDS) {
        if (remaining <= 0) break;
        const sliceTop = Math.min(top, band.to);
        const sliceBottom = Math.max(band.from, top - remaining);
        const slice = sliceTop - sliceBottom;
        if (slice > 0) {
            relief += slice * (band.tax + (savesNI ? band.ni : 0));
            remaining -= slice;
            top -= slice;
        }
    }

    return Math.round(relief);
}

class V2Calculator {
    constructor() {
        this.inputs = {
            income1: document.getElementById('income1'),
            income2: document.getElementById('income2'),
            numChildren: document.getElementById('numChildren'),
            childcare: document.getElementById('childcare'),
            employment: document.getElementById('employment'),
            employment2: document.getElementById('employment2'),
            pension1: document.getElementById('pension1'),
            pension2: document.getElementById('pension2')
        };

        this.secondIncomeYes = document.getElementById('secondIncomeYes');
        this.secondIncomeNo = document.getElementById('secondIncomeNo');
        this.income2Group = document.getElementById('income2Group');
        this.employment2Group = document.getElementById('employment2Group');
        this.childrenAgesContainer = document.getElementById('childrenAgesContainer');
        this.calculateBtn = document.getElementById('calculateBtn');
        this.resultsPanel = document.getElementById('resultsPanel');

        this.childAges = [];
        this.lastResults = {};

        this.init();
    }

    init() {
        const pension2Group = document.getElementById('pension2Group');

        this.secondIncomeYes.addEventListener('change', () => {
            this.income2Group.style.display = 'block';
            this.employment2Group.style.display = 'block';
            if (pension2Group) pension2Group.style.display = 'block';
        });

        this.secondIncomeNo.addEventListener('change', () => {
            this.income2Group.style.display = 'none';
            this.employment2Group.style.display = 'none';
            if (pension2Group) pension2Group.style.display = 'none';
            this.inputs.income2.value = '0';
            if (this.inputs.pension2) this.inputs.pension2.value = '';
        });

        this.inputs.numChildren.addEventListener('input', () => {
            this.updateChildrenAgeSelects();
        });

        this.calculateBtn.addEventListener('click', () => {
            this.calculate();
        });

        this.updateChildrenAgeSelects();
    }

    updateChildrenAgeSelects() {
        const numChildren = parseInt(this.inputs.numChildren.value) || 0;
        this.childrenAgesContainer.innerHTML = '';
        this.childAges = [];

        for (let i = 0; i < numChildren; i++) {
            const div = document.createElement('div');
            div.className = 'input-group';

            const label = document.createElement('label');
            label.textContent = `Child ${i + 1}'s Age`;

            const select = document.createElement('select');
            select.id = `childAge${i}`;
            select.innerHTML = `
                <option value="">Select age...</option>
                <option value="0">Under 1 year</option>
                <option value="1">1 year old</option>
                <option value="2">2 years old</option>
                <option value="3">3 years old</option>
                <option value="4">4 years old</option>
                <option value="5">5 years old</option>
                <option value="6">6 years old</option>
                <option value="7">7 years old</option>
                <option value="8">8 years old</option>
                <option value="9">9 years old</option>
                <option value="10">10 years old</option>
                <option value="11">11 years old</option>
            `;

            div.appendChild(label);
            div.appendChild(select);
            this.childrenAgesContainer.appendChild(div);
            this.childAges.push(select);
        }
    }

    calculate() {
        const income1 = parseFloat(this.inputs.income1.value) || 0;
        const income2 = this.secondIncomeYes.checked ? (parseFloat(this.inputs.income2.value) || 0) : 0;
        const numChildren = parseInt(this.inputs.numChildren.value) || 0;
        const monthlyChildcare = parseFloat(this.inputs.childcare.value) || 0;
        const pension1 = parseFloat(this.inputs.pension1?.value) || 0;
        const pension2 = this.secondIncomeYes.checked ? (parseFloat(this.inputs.pension2?.value) || 0) : 0;
        const employment = this.inputs.employment.value;
        const employment2 = this.secondIncomeYes.checked ? this.inputs.employment2.value : employment;

        // Required fields must be present and positive.
        if (income1 <= 0 || numChildren <= 0 || monthlyChildcare <= 0) {
            alert('Please fill in your income, number of children and monthly childcare cost.');
            return;
        }

        // Reject negative / non-sensical amounts.
        if (income2 < 0 || pension1 < 0 || pension2 < 0) {
            alert('Please enter positive amounts only — negative values aren\'t valid.');
            return;
        }

        // If a second income is selected, it must actually be entered.
        if (this.secondIncomeYes.checked && income2 <= 0) {
            alert('Please enter your partner\'s income, or choose "No (single parent)".');
            return;
        }

        // Annual pension contributions can't exceed the matching income.
        if (pension1 * 12 > income1 || (income2 > 0 && pension2 * 12 > income2)) {
            alert('Monthly pension contributions can\'t be more than the matching income.');
            return;
        }

        const ages = this.childAges.map(s => parseInt(s.value));
        if (ages.some(a => isNaN(a))) {
            alert('Please select the age for each child.');
            return;
        }

        const annualChildcare = monthlyChildcare * 12;
        const pension1Annual = Math.round(pension1 * 12);
        const pension2Annual = Math.round(pension2 * 12);
        const hasPartner = income2 > 0;

        // Adjusted net income drives every eligibility test, so existing pension
        // contributions are taken off before anything is decided. A parent on
        // £110k already sacrificing £15k is under the cliff and qualifies.
        const ani1 = Math.max(0, income1 - pension1Annual);
        const ani2 = hasPartner ? Math.max(0, income2 - pension2Annual) : 0;

        const over100k = ani1 > ANI_CLIFF || (hasPartner && ani2 > ANI_CLIFF);

        const eligibleAgeChildren = ages.filter(a => a >= 0 && a <= 4).length;
        const meetsWorkTest = !hasPartner
            ? income1 >= MIN_INCOME_TEST
            : (income1 >= MIN_INCOME_TEST && income2 >= MIN_INCOME_TEST);

        const eligibleNow = meetsWorkTest && eligibleAgeChildren > 0 && !over100k;

        // Funded hours can never be worth more than the bill they offset.
        const fundedValueFor = (count) => Math.min(count * FUNDED_VALUE_PER_CHILD, annualChildcare);
        // Tax-Free Childcare tops up what is still paid AFTER funded hours.
        const tfcValueAfter = (fundedValue) =>
            Math.min(Math.max(0, annualChildcare - fundedValue) * TFC_RATE, TFC_CAP_PER_CHILD * numChildren);

        // Funded hours need an eligible-age child; TFC does not (up to age 11).
        // Both need the work test AND both parents under the £100k cliff.
        const displayThirtyHours = (meetsWorkTest && !over100k && eligibleAgeChildren > 0)
            ? Math.round(fundedValueFor(eligibleAgeChildren))
            : 0;
        const displayTfc = (meetsWorkTest && !over100k)
            ? Math.round(tfcValueAfter(displayThirtyHours))
            : 0;

        // One pension model either side of £100k. Previously the two sides used
        // entirely different formulas, which made a £1 pay rise collapse the
        // figure from £1,210 to £1. The recommended contribution is whichever is
        // larger: enough to clear the cliff, or the illustrative amount.
        const genericAmount = Math.min(5000, annualChildcare * 0.3);
        const primaryIsYou = income1 >= income2;

        const neededYou = ani1 > ANI_CLIFF ? ani1 - (ANI_CLIFF - 1) : 0;
        const neededPartner = (hasPartner && ani2 > ANI_CLIFF) ? ani2 - (ANI_CLIFF - 1) : 0;

        const rawContribYou = Math.max(neededYou, primaryIsYou ? genericAmount : 0);
        const rawContribPartner = hasPartner ? Math.max(neededPartner, primaryIsYou ? 0 : genericAmount) : 0;

        // Existing contributions already use up part of the annual allowance.
        const allowanceYou = Math.max(0, annualAllowanceFor(income1) - pension1Annual);
        const allowancePartner = hasPartner ? Math.max(0, annualAllowanceFor(income2) - pension2Annual) : 0;

        const contribYou = Math.round(Math.min(rawContribYou, allowanceYou));
        const contribPartner = Math.round(Math.min(rawContribPartner, allowancePartner));

        // True when the contribution needed to clear the cliff is not legally
        // available. The figure is then capped and the shortfall flagged rather
        // than silently recommending an unlawful contribution.
        const allowanceExceeded = (rawContribYou - allowanceYou > 0.5) || (rawContribPartner - allowancePartner > 0.5);

        const reliefYou = pensionReliefOn(ani1, contribYou, employment !== 'self-employed');
        const reliefPartner = hasPartner ? pensionReliefOn(ani2, contribPartner, employment2 !== 'self-employed') : 0;
        const displaySalary = reliefYou + reliefPartner;

        const totalContribution = contribYou + contribPartner;
        const effectiveReliefRate = totalContribution > 0 ? displaySalary / totalContribution : 0;

        const displayTotal = displayTfc + displaySalary + displayThirtyHours;

        // What the recommended contribution WOULD unlock for a household
        // currently over the cliff. Kept strictly separate from displayTotal:
        // these are conditional on the contribution actually being made.
        const aniAfterYou = Math.max(0, ani1 - contribYou);
        const aniAfterPartner = hasPartner ? Math.max(0, ani2 - contribPartner) : 0;
        const wouldBeUnder = aniAfterYou <= ANI_CLIFF && (!hasPartner || aniAfterPartner <= ANI_CLIFF);

        const unlockThirtyHours = (over100k && wouldBeUnder && meetsWorkTest && eligibleAgeChildren > 0)
            ? Math.round(fundedValueFor(eligibleAgeChildren))
            : 0;
        const unlockTfc = (over100k && wouldBeUnder && meetsWorkTest)
            ? Math.round(tfcValueAfter(unlockThirtyHours))
            : 0;
        const unlockTotal = unlockTfc + unlockThirtyHours;

        this.lastResults = {
            schemaVersion: RESULTS_SCHEMA_VERSION,
            taxYear: TAX_YEAR_LABEL,
            income1, income2, numChildren, monthlyChildcare, employment, employment2,
            ages, pension1, pension2, pension1Annual, pension2Annual,
            ani1, ani2, hasPartner,
            over100k, eligibleNow, meetsWorkTest, eligibleAgeChildren,
            has30Hours: eligibleNow,
            displayTfc, displaySalary, displayThirtyHours, displayTotal,
            contribYou, contribPartner, totalContribution, effectiveReliefRate,
            allowanceExceeded, allowanceYou, allowancePartner,
            unlockTfc, unlockThirtyHours, unlockTotal, wouldBeUnder,
            splitting: this.calculateIncomeSplitting(income1, income2)
        };

        localStorage.setItem('100kp_results', JSON.stringify(this.lastResults));

        this.displayResults(over100k, eligibleNow);
    }

    /**
     * Illustrative only. The tax difference from moving income across the
     * higher-rate threshold, derived from the incomes entered rather than the
     * flat £3,000 this previously returned. Realising it needs a lawful
     * mechanism (dividends, or genuine salary for work actually done) which
     * this calculator does not assess, so it is labelled as an illustration
     * wherever it is shown and is not part of the headline total.
     */
    calculateIncomeSplitting(income1, income2) {
        if (income2 <= 0) return 0;
        const higher = Math.max(income1, income2);
        const lower = Math.min(income1, income2);
        if (higher <= HIGHER_RATE_THRESHOLD || lower >= HIGHER_RATE_THRESHOLD) return 0;
        const movable = Math.min(higher - HIGHER_RATE_THRESHOLD, HIGHER_RATE_THRESHOLD - lower);
        return Math.round(movable * 0.20);
    }

    displayResults(over100k, eligibleNow) {
        this.resultsPanel.style.opacity = '1';

        const estimatedSaving = this.lastResults.displayTotal;
        document.getElementById('totalSaving').textContent = `£${estimatedSaving.toLocaleString()}`;

        const rangeEl = document.getElementById('savingsRange');
        rangeEl.style.display = 'none';

        document.getElementById('over100kWarning').style.display = over100k ? 'block' : 'none';

        document.getElementById('eligibilityWarning').style.display = (!eligibleNow && !over100k) ? 'block' : 'none';

        this.renderCliffNote();

        this.showPaywall();

        // Scroll the results panel to the top of the viewport so the "Your Estimated
        // Saving" wording is immediately visible, allowing for the sticky nav height.
        const nav = document.querySelector('.nav');
        const navHeight = nav ? nav.offsetHeight : 0;
        const top = this.resultsPanel.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
        window.scrollTo({ top, behavior: 'smooth' });
    }

    /**
     * Explains WHY a household over £100k is seeing £0 of childcare support,
     * and what the pension contribution would unlock. Without this the £0 looks
     * like a broken calculator rather than the cliff edge doing its job.
     */
    renderCliffNote() {
        const existing = document.getElementById('cliffNote');
        if (existing) existing.remove();

        const r = this.lastResults;
        if (!r.over100k) return;

        const note = document.createElement('div');
        note.id = 'cliffNote';
        note.className = 'cliff-note';

        const unlockLine = (r.unlockTotal > 0)
            ? `Contributing <strong>£${r.totalContribution.toLocaleString()}</strong> a year into your pension would bring your adjusted net income under £100,000 and unlock a further <strong>£${r.unlockTotal.toLocaleString()}</strong> a year of childcare support. That is not included in the figure above, because it depends on you making the contribution.`
            : (r.allowanceExceeded
                ? `Bringing your adjusted net income under £100,000 would need more than your pension annual allowance of £${r.allowanceYou.toLocaleString()} allows this year. Speak to an adviser about carry forward from previous years.`
                : `Your income is too far above £100,000 for a pension contribution alone to bring you under the threshold this year.`);

        note.innerHTML = `
            <p><strong>Why your childcare support shows as £0:</strong> Tax-Free Childcare and the ${FUNDED_HOURS_PER_WEEK} funded hours are lost entirely once either parent's adjusted net income goes over £100,000. It is a cliff edge, not a gradual taper, and it is tested for each parent separately rather than on your household total.</p>
            <p>${unlockLine}</p>
        `;
        this.resultsPanel.appendChild(note);
    }

    showPaywall() {
        const existing = document.getElementById('paywallGate');
        if (existing) existing.remove();

        // Only the Complete report is live, so every visitor is routed to it.
        // The copy below must NOT claim this is a recommendation based on the
        // user's income: no income-based routing runs, and saying otherwise
        // would be a personalisation claim the code cannot support.
        const tier = 'complete';
        const price = '£49';
        const planName = 'Complete Guide';
        const reasonText = 'Our Complete Guide covers your situation, with your full personalised savings breakdown, the steps to claim it, and a 30-minute call with an independent financial adviser.';

        const gate = document.createElement('div');
        gate.id = 'paywallGate';
        gate.innerHTML = `
            <div class="paywall-gate">
                <div class="paywall-content">
                    <div class="paywall-lock">🔒</div>
                    <h3 class="paywall-title">Your full breakdown is ready</h3>
                    <p class="paywall-subtitle">Your estimated saving is <strong>£${this.lastResults.displayTotal.toLocaleString()}</strong> a year.</p>

                    <div class="paywall-recommended">
                        <div class="paywall-recommended-badge">Your report</div>
                        <div class="paywall-recommended-plan">
                            <div class="paywall-recommended-top">
                                <div>
                                    <div class="paywall-plan-name">${planName}</div>
                                    <p class="paywall-reason">${reasonText}</p>
                                </div>
                                <div class="paywall-plan-price">${price}</div>
                            </div>
                            <div class="paywall-plan-features">
                                <p>✓ Full personalised savings breakdown</p>
                                <p>✓ Step-by-step action plan</p>
                                <p>✓ Instant PDF download</p>
                                <p>✓ 30-minute financial adviser call</p>
                                <p>✓ Advanced income strategies</p>
                            </div>
                            <a href="v2-success.html?tier=${tier}" class="paywall-plan-btn primary">Get My Report — ${price}</a>
                            <p class="paywall-purchase-note">You are buying a general guidance report, not regulated financial advice or a personal recommendation.</p>
                        </div>
                    </div>

                    <p class="paywall-guarantee">🛡️ 30-day money-back guarantee &nbsp;·&nbsp; No subscription</p>
                </div>
            </div>
        `;

        document.getElementById('resultsActions').style.display = 'none';
        this.resultsPanel.appendChild(gate);

        // Move the £100k warning (red box) to sit below the breakdown gate.
        const over100kWarning = document.getElementById('over100kWarning');
        if (over100kWarning) this.resultsPanel.appendChild(over100kWarning);
        const cliffNote = document.getElementById('cliffNote');
        if (cliffNote) this.resultsPanel.appendChild(cliffNote);
    }
}

// ─── INIT ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    new V2Calculator();
});
