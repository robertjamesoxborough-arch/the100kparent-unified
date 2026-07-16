/**
 * V2 Calculator - With Paywall Gate + PDF Report Generator
 * Updated May 2026
 */

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

        const over100k = income1 > 100000 || income2 > 100000;
        const has30Hours = this.check30HoursEligibility(income1, income2, ages);

        const annualChildcare = monthlyChildcare * 12;
        const tfc = this.calculateTFC(annualChildcare, numChildren, over100k);
        const salary = this.calculateSalarySacrifice(income1, income2, monthlyChildcare, employment, employment2);
        const splitting = this.calculateIncomeSplitting(income1, income2);
        const thirtyHours = has30Hours ? this.calculate30HoursValue(ages) : 0;

        const minSaving = tfc + salary;
        const maxSaving = tfc + salary + splitting + thirtyHours;

        // Pension tax + NI relief from contributing enough to bring adjusted net
        // income below £100,000. This is the SAME figure the PDF reports as
        // "Tax + NI saved on pension contribution" (taxSavedBySacrifice) — replicated
        // here so the results panel, paywall, success page and PDF all show one number.
        // (Zero for households already under £100k, where there is no £100k pension play.)
        const higherIncome = Math.max(income1, income2);
        const extraSacrificeYou = Math.max(0, (income1 > 100000 ? income1 - 99999 : 0) - Math.round(pension1 * 12));
        const extraSacrificePartner = Math.max(0, (income2 > 100000 ? income2 - 99999 : 0) - Math.round(pension2 * 12));
        const extraSacrificeCombined = extraSacrificeYou + extraSacrificePartner;
        // Employees save Income Tax + NI via pension salary sacrifice.
        const pensionReliefRate = (higherIncome > 100000 && higherIncome <= 125140) ? 0.62 : higherIncome > 50270 ? 0.42 : 0.32;
        // The self-employed can't salary sacrifice, but a personal pension contribution
        // still cuts Income Tax and restores the personal allowance in the £100k–£125,140
        // band — it just doesn't save National Insurance, so a lower relief rate applies.
        const selfEmployedReliefRate = (higherIncome > 100000 && higherIncome <= 125140) ? 0.60 : higherIncome > 50270 ? 0.40 : 0.20;
        const pensionRelief = Math.round(extraSacrificeCombined * pensionReliefRate);
        const selfEmployedPensionRelief = Math.round(extraSacrificeCombined * selfEmployedReliefRate);

        // Canonical headline saving — single source of truth shared by the results
        // panel, the success page and the PDF. Tax-Free Childcare and the 30 funded hours
        // are shown as ACHIEVABLE savings: households already under £100k get them now, and
        // over-£100k families unlock them once the pension action below brings adjusted net
        // income under the line. The eligibility badges/warnings (driven by has30Hours and
        // over100k) make that "you qualify now" vs "available once under £100k" distinction.
        const bothSelfEmployed = employment === 'self-employed' && employment2 === 'self-employed';

        // Working-parent income test (single parent: the one parent; couple: both).
        const minIncome = 10158; // 2025/26 min-income test — see check30HoursEligibility().
        const eligibleAgeChild = ages.some(a => a >= 0 && a <= 4);
        const meetsWorkTest = income2 === 0 ? income1 >= minIncome : (income1 >= minIncome && income2 >= minIncome);

        // 30 funded hours: an eligible-age child plus the working-parent test. Applied to
        // the bill BEFORE Tax-Free Childcare, since funded hours reduce what you actually pay.
        const displayThirtyHours = (eligibleAgeChild && meetsWorkTest) ? Math.round(0.55 * annualChildcare) : 0;

        // Tax-Free Childcare: 20% top-up (capped £2,000/child) on the childcare you still
        // pay AFTER funded hours, for any household that meets the working-parent test.
        const childcareAfterFundedHours = Math.max(0, annualChildcare - displayThirtyHours);
        const displayTfc = meetsWorkTest ? Math.round(Math.min(childcareAfterFundedHours * 0.20, 2000 * numChildren)) : 0;

        // Pension route to break the £100k threshold: salary sacrifice for employees
        // (Income Tax + NI), or personal pension contributions for the self-employed
        // (Income Tax + personal-allowance restoration only, no NI). Under £100k, only
        // employees get the generic salary-sacrifice estimate (≈30% of childcare, capped £5,000).
        const genericSalarySacrifice = Math.round(Math.min(5000, annualChildcare * 0.3) * pensionReliefRate);
        const displaySalary = over100k
            ? (bothSelfEmployed ? selfEmployedPensionRelief : pensionRelief)
            : (bothSelfEmployed ? 0 : genericSalarySacrifice);

        const displayTotal = displayTfc + displaySalary + displayThirtyHours;

        // Store results for PDF
        this.lastResults = {
            income1, income2, numChildren, monthlyChildcare, employment, employment2,
            ages, over100k, has30Hours, tfc, salary, splitting,
            thirtyHours, minSaving, maxSaving, pension1, pension2,
            displayTfc, displaySalary, displayThirtyHours, displayTotal
        };

        // Save to localStorage so success page can read them
        localStorage.setItem('100kp_results', JSON.stringify(this.lastResults));

        this.displayResults(minSaving, maxSaving, over100k, has30Hours);
    }

    check30HoursEligibility(income1, income2, ages) {
        // 2025/26 min-income test: each working parent must earn at least the equivalent
        // of 16 hrs/wk at minimum wage — NMW £12.21 × 16 × 52 ≈ £10,158/year.
        const minIncome = 10158;

        // Funded hours only apply to children aged 9 months–4 years.
        if (!ages.some(a => a >= 0 && a <= 4)) return false;

        // Single-parent household (no second income): the one working parent must
        // earn at least the minimum and no more than £100k. Single parents ARE
        // eligible — the previous logic wrongly excluded them.
        if (income2 === 0) {
            return income1 >= minIncome && income1 <= 100000;
        }

        // Couple: both parents must earn at least the minimum, neither over £100k.
        return income1 >= minIncome && income2 >= minIncome
            && income1 <= 100000 && income2 <= 100000;
    }

    calculateTFC(annualChildcare, numChildren, over100k) {
        if (over100k) return 0;
        const maxPerChild = 2000;
        const eligible = Math.min(annualChildcare, 10000 * numChildren);
        return Math.min(eligible * 0.20, maxPerChild * numChildren);
    }

    calculateSalarySacrifice(income1, income2, monthlyChildcare, employment, employment2) {
        // Both self-employed = no salary sacrifice at all
        if (employment === 'self-employed' && employment2 === 'self-employed') return 0;

        // Use the higher income earner who CAN use salary sacrifice
        let eligibleIncome = 0;
        if (employment !== 'self-employed') eligibleIncome = Math.max(eligibleIncome, income1);
        if (employment2 !== 'self-employed') eligibleIncome = Math.max(eligibleIncome, income2);

        const taxRelief = eligibleIncome > 50270 ? 0.42 : 0.32;
        const sacrificeAmount = Math.min(5000, monthlyChildcare * 12 * 0.3);
        return sacrificeAmount * taxRelief;
    }

    calculateIncomeSplitting(income1, income2) {
        if (income2 === 0) return 0;
        const threshold = 50270;
        if ((income1 > threshold && income2 < threshold) || (income2 > threshold && income1 < threshold)) {
            return 3000;
        }
        return 0;
    }

    calculate30HoursValue(ages) {
        const eligible = ages.filter(a => a >= 0 && a <= 4).length;
        return eligible * 15 * 1140;
    }

    displayResults(minSaving, maxSaving, over100k, has30Hours) {
        this.resultsPanel.style.opacity = '1';

        const estimatedSaving = this.lastResults.displayTotal;
        document.getElementById('totalSaving').textContent = `£${estimatedSaving.toLocaleString()}`;

        // Hide saving range — using simplified formula
        const rangeEl = document.getElementById('savingsRange');
        rangeEl.style.display = 'none';

        // £100k warning
        document.getElementById('over100kWarning').style.display = over100k ? 'block' : 'none';

        // 30 hours eligibility info
        document.getElementById('eligibilityWarning').style.display = (!has30Hours && !over100k) ? 'block' : 'none';

        // Show paywall gate
        const { tfc, salary, splitting, thirtyHours } = this.lastResults;
        this.showPaywall(minSaving, maxSaving, tfc, salary, splitting, thirtyHours);

        // Scroll the results panel to the top of the viewport so the "Your Estimated
        // Saving" wording is immediately visible, allowing for the sticky nav height.
        const nav = document.querySelector('.nav');
        const navHeight = nav ? nav.offsetHeight : 0;
        const top = this.resultsPanel.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
        window.scrollTo({ top, behavior: 'smooth' });
    }

    showPaywall(minSaving, maxSaving, tfc, salary, splitting, thirtyHours) {
        const existing = document.getElementById('paywallGate');
        if (existing) existing.remove();

        // Only the Complete report is live for now, so every visitor is routed to
        // it regardless of income. When the Essential report is relaunched, restore
        // the income-based routing below:
        //   const highestIncome = Math.max(income1, income2);
        //   const isComplete = highestIncome >= 90000;
        const income1 = parseFloat(this.inputs.income1.value) || 0;
        const income2 = this.secondIncomeYes.checked ? (parseFloat(this.inputs.income2.value) || 0) : 0;
        const isComplete = true;

        const tier = isComplete ? 'complete' : 'essential';
        const price = isComplete ? '£49' : '£19';
        const planName = isComplete ? 'Complete Guide' : 'Essential Report';
        const reasonText = isComplete
            ? 'Based on your income level, we recommend the Complete Guide which includes a 30-minute call with a financial advisor to maximise your saving.'
            : 'Based on your income level, we recommend the Essential Report with your full personalised savings breakdown and PDF.';

        const gate = document.createElement('div');
        gate.id = 'paywallGate';
        gate.innerHTML = `
            <div class="paywall-gate">
                <div class="paywall-content">
                    <div class="paywall-lock">🔒</div>
                    <h3 class="paywall-title">Your full breakdown is ready</h3>
                    <p class="paywall-subtitle">You could save up to <strong>£${this.lastResults.displayTotal.toLocaleString()}</strong> a year.</p>

                    <div class="paywall-recommended">
                        <div class="paywall-recommended-badge">Recommended for you</div>
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
                                ${isComplete ? '<p>✓ 30-minute financial advisor call</p>' : ''}
                                ${isComplete ? '<p>✓ Advanced income strategies</p>' : ''}
                            </div>
                            <a href="v2-success.html?tier=${tier}" class="paywall-plan-btn primary">Get My Report — ${price}</a>
                        </div>
                        ${isComplete ? '' : `<p class="paywall-upgrade">Need more? <a href="v2-success.html?tier=complete">Complete Guide with advisor call — £49</a></p>`}
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
    }
}

// ─── INIT ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    new V2Calculator();
});
