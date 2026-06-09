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
            employment2: document.getElementById('employment2')
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
        this.secondIncomeYes.addEventListener('change', () => {
            this.income2Group.style.display = 'block';
            this.employment2Group.style.display = 'block';
        });

        this.secondIncomeNo.addEventListener('change', () => {
            this.income2Group.style.display = 'none';
            this.employment2Group.style.display = 'none';
            this.inputs.income2.value = '0';
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
        const employment = this.inputs.employment.value;
        const employment2 = this.secondIncomeYes.checked ? this.inputs.employment2.value : employment;

        if (income1 === 0 || numChildren === 0 || monthlyChildcare === 0) {
            alert('Please fill in your income, number of children and monthly childcare cost.');
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

        // Store results for PDF
        this.lastResults = {
            income1, income2, numChildren, monthlyChildcare, employment, employment2,
            ages, over100k, has30Hours, tfc, salary, splitting,
            thirtyHours, minSaving, maxSaving
        };

        // Save to localStorage so success page can read them
        localStorage.setItem('100kp_results', JSON.stringify(this.lastResults));

        this.displayResults(minSaving, maxSaving, over100k, has30Hours);
    }

    check30HoursEligibility(income1, income2, ages) {
        if (income2 === 0) return false;
        const minIncome = 2379;
        if (income1 < minIncome || income2 < minIncome) return false;
        if (income1 > 100000 || income2 > 100000) return false;
        return ages.some(a => a >= 0 && a <= 4);
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

        const avg = Math.round((minSaving + maxSaving) / 2);
        document.getElementById('totalSaving').textContent = `£${avg.toLocaleString()}`;

        // Saving range
        const rangeEl = document.getElementById('savingsRange');
        if (maxSaving > minSaving) {
            rangeEl.style.display = 'block';
            document.getElementById('rangeMin').textContent = `£${Math.round(minSaving).toLocaleString()}`;
            document.getElementById('rangeMax').textContent = `£${Math.round(maxSaving).toLocaleString()}`;
        } else {
            rangeEl.style.display = 'none';
        }

        // £100k warning
        document.getElementById('over100kWarning').style.display = over100k ? 'block' : 'none';

        // 30 hours eligibility info
        document.getElementById('eligibilityWarning').style.display = (!has30Hours && !over100k) ? 'block' : 'none';

        // Show paywall gate
        this.showPaywall(minSaving, maxSaving, tfc, salary, splitting, thirtyHours);

        this.resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showPaywall(minSaving, maxSaving, tfc, salary, splitting, thirtyHours) {
        const existing = document.getElementById('paywallGate');
        if (existing) existing.remove();

        // Determine plan based on income — over £90k gets Complete
        const income1 = parseFloat(this.inputs.income1.value) || 0;
        const income2 = this.secondIncomeYes.checked ? (parseFloat(this.inputs.income2.value) || 0) : 0;
        const highestIncome = Math.max(income1, income2);
        const isComplete = highestIncome >= 90000;

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
                <div class="paywall-blur-preview">
                    <div class="paywall-blur-row"><span>Tax-Free Childcare saving</span><span class="blur-amount">£${Math.round(tfc).toLocaleString()}</span></div>
                    <div class="paywall-blur-row"><span>Salary sacrifice saving</span><span class="blur-amount">£${Math.round(salary).toLocaleString()}</span></div>
                    <div class="paywall-blur-row"><span>Income splitting saving</span><span class="blur-amount">£${Math.round(splitting).toLocaleString()}</span></div>
                    <div class="paywall-blur-row"><span>30 hours childcare value</span><span class="blur-amount">£${Math.round(thirtyHours).toLocaleString()}</span></div>
                </div>
                <div class="paywall-content">
                    <div class="paywall-lock">🔒</div>
                    <h3 class="paywall-title">Your full breakdown is ready</h3>
                    <p class="paywall-subtitle">You could save between <strong>£${Math.round(minSaving).toLocaleString()}</strong> and <strong>£${Math.round(maxSaving).toLocaleString()}</strong> per year.</p>

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
    }
}

// ─── PDF REPORT GENERATOR ───────────────────────────────────────────────────

class PDFReportGenerator {
    constructor(results) {
        this.r = results;
    }

    generate(tier) {
        // Build the HTML content of the report
        const html = this.buildReportHTML(tier);

        // Open in new tab and trigger print/save as PDF
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 500);
    }

    buildReportHTML(tier) {
        const r = this.r;
        const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const avg = Math.round((r.minSaving + r.maxSaving) / 2);

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Your Childcare Savings Report - The 100k Parent</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', sans-serif;
    color: #2D3748;
    background: #FFFFFF;
    font-size: 14px;
    line-height: 1.6;
  }

  /* COVER */
  .cover {
    background: linear-gradient(135deg, #E8F4F8 0%, #F0EDFF 100%);
    padding: 60px 50px;
    min-height: 297mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
  }

  .cover-logo {
    font-size: 22px;
    font-weight: 800;
    color: #2E5C8A;
  }

  .cover-badge {
    display: inline-block;
    background: #4A90E2;
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 24px;
  }

  .cover-title {
    font-size: 40px;
    font-weight: 800;
    color: #2D3748;
    line-height: 1.1;
    margin-bottom: 16px;
  }

  .cover-subtitle {
    font-size: 18px;
    color: #718096;
    margin-bottom: 40px;
  }

  .cover-saving-box {
    background: white;
    border-radius: 20px;
    padding: 32px 40px;
    display: inline-block;
    box-shadow: 0 4px 24px rgba(74,144,226,0.15);
    margin-bottom: 40px;
  }

  .cover-saving-label {
    font-size: 13px;
    font-weight: 600;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }

  .cover-saving-amount {
    font-size: 56px;
    font-weight: 800;
    color: #10B981;
    line-height: 1;
  }

  .cover-saving-sub {
    font-size: 14px;
    color: #718096;
    margin-top: 8px;
  }

  .cover-range {
    background: #E8F4F8;
    border-radius: 12px;
    padding: 16px 24px;
    margin-top: 16px;
    display: inline-block;
  }

  .cover-range p {
    font-size: 13px;
    color: #2E5C8A;
  }

  .cover-range strong {
    font-size: 16px;
  }

  .cover-meta {
    font-size: 13px;
    color: #A0AEC0;
  }

  /* CONTENT PAGES */
  .page {
    padding: 50px;
    page-break-after: always;
  }

  .page:last-child { page-break-after: avoid; }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
    border-bottom: 2px solid #E8F4F8;
    margin-bottom: 32px;
  }

  .page-logo { font-size: 16px; font-weight: 800; color: #2E5C8A; }
  .page-number { font-size: 12px; color: #A0AEC0; }

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #2D3748;
    margin-bottom: 8px;
  }

  h3 {
    font-size: 16px;
    font-weight: 700;
    color: #2D3748;
    margin-bottom: 8px;
  }

  .section-intro {
    color: #718096;
    margin-bottom: 28px;
    font-size: 14px;
  }

  /* PROFILE BOX */
  .profile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 32px;
  }

  .profile-item {
    background: #F7FAFC;
    border-radius: 12px;
    padding: 16px 20px;
  }

  .profile-label {
    font-size: 11px;
    font-weight: 600;
    color: #A0AEC0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }

  .profile-value {
    font-size: 16px;
    font-weight: 700;
    color: #2D3748;
  }

  /* SAVINGS BREAKDOWN */
  .saving-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-radius: 12px;
    margin-bottom: 12px;
    background: #F7FAFC;
  }

  .saving-row.highlight {
    background: #E8F4F8;
    border: 2px solid #4A90E2;
  }

  .saving-row-left h3 { margin-bottom: 4px; }
  .saving-row-left p { font-size: 12px; color: #718096; }

  .saving-amount {
    font-size: 24px;
    font-weight: 800;
    color: #10B981;
    white-space: nowrap;
  }

  .saving-amount.zero { color: #A0AEC0; }

  /* TOTAL BOX */
  .total-box {
    background: linear-gradient(135deg, #4A90E2 0%, #2E5C8A 100%);
    border-radius: 16px;
    padding: 28px 32px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 24px 0;
  }

  .total-box-label { font-size: 14px; font-weight: 600; opacity: 0.85; }
  .total-box-amount { font-size: 40px; font-weight: 800; }

  /* HOW IT'S CALCULATED */
  .calc-box {
    background: #F0EDFF;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 16px;
  }

  .calc-box h3 { color: #7B68EE; margin-bottom: 8px; }
  .calc-box p { font-size: 13px; color: #4A5568; line-height: 1.6; }

  /* ELIGIBILITY */
  .eligibility-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 20px 0;
  }

  .eligibility-item {
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .eligibility-item.yes { background: #D1FAE5; }
  .eligibility-item.no { background: #FEE2E2; }

  .eligibility-icon { font-size: 20px; }
  .eligibility-text { font-size: 13px; font-weight: 600; color: #2D3748; }

  /* NEXT STEPS */
  .step-item {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    align-items: flex-start;
  }

  .step-num {
    width: 36px;
    height: 36px;
    background: #4A90E2;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 16px;
    flex-shrink: 0;
  }

  .step-text h3 { margin-bottom: 4px; }
  .step-text p { font-size: 13px; color: #718096; }

  /* DISCLAIMER */
  .disclaimer {
    background: #FFF9F0;
    border-left: 4px solid #F59E0B;
    padding: 16px 20px;
    border-radius: 0 8px 8px 0;
    margin-top: 24px;
    font-size: 12px;
    color: #718096;
    line-height: 1.6;
  }

  /* FOOTER */
  .report-footer {
    text-align: center;
    padding: 40px 50px;
    background: #F7FAFC;
    border-top: 2px solid #E8F4F8;
  }

  .report-footer-logo { font-size: 20px; font-weight: 800; color: #2E5C8A; margin-bottom: 8px; }
  .report-footer p { font-size: 12px; color: #A0AEC0; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover { min-height: auto; }
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div>
    <div class="cover-logo">The 100k Parent</div>
  </div>

  <div>
    <div class="cover-badge">${tier === 'essential' ? 'Essential Report' : 'Complete Guide'}</div>
    <h1 class="cover-title">Your Childcare<br>Savings Report</h1>
    <p class="cover-subtitle">Personalised for your family's situation</p>

    <div class="cover-saving-box">
      <div class="cover-saving-label">Your estimated annual saving</div>
      <div class="cover-saving-amount">£${avg.toLocaleString()}</div>
      <div class="cover-saving-sub">across all HMRC-compliant strategies</div>
    </div>

    <div class="cover-range">
      <p>Potential saving range: <strong>£${Math.round(r.minSaving).toLocaleString()}</strong> — <strong>£${Math.round(r.maxSaving).toLocaleString()}</strong> per year</p>
    </div>
  </div>

  <div class="cover-meta">
    <p>Prepared for your family • ${date}</p>
    <p>The 100k Parent | the100kparent.com</p>
  </div>
</div>

<!-- PAGE 2: YOUR PROFILE -->
<div class="page">
  <div class="page-header">
    <div class="page-logo">The 100k Parent</div>
    <div class="page-number">Page 2</div>
  </div>

  <h2>Your Family Profile</h2>
  <p class="section-intro">Based on the information you provided, here is your household summary.</p>

  <div class="profile-grid">
    <div class="profile-item">
      <div class="profile-label">Your Annual Income</div>
      <div class="profile-value">£${r.income1.toLocaleString()}</div>
    </div>
    <div class="profile-item">
      <div class="profile-label">Partner's Annual Income</div>
      <div class="profile-value">${r.income2 > 0 ? '£' + r.income2.toLocaleString() : 'Single income household'}</div>
    </div>
    <div class="profile-item">
      <div class="profile-label">Number of Children</div>
      <div class="profile-value">${r.numChildren} ${r.numChildren === 1 ? 'child' : 'children'}</div>
    </div>
    <div class="profile-item">
      <div class="profile-label">Monthly Childcare Cost</div>
      <div class="profile-value">£${r.monthlyChildcare.toLocaleString()}/month</div>
    </div>
    <div class="profile-item">
      <div class="profile-label">Annual Childcare Spend</div>
      <div class="profile-value">£${(r.monthlyChildcare * 12).toLocaleString()}/year</div>
    </div>
    <div class="profile-item">
      <div class="profile-label">Employment Type</div>
      <div class="profile-value" style="text-transform: capitalize;">${r.employment.replace('-', ' ')}</div>
    </div>
  </div>

  <h2>Eligibility Summary</h2>
  <p class="section-intro">Which government schemes your family qualifies for.</p>

  <div class="eligibility-grid">
    <div class="eligibility-item ${!r.over100k ? 'yes' : 'no'}">
      <div class="eligibility-icon">${!r.over100k ? '✅' : '❌'}</div>
      <div class="eligibility-text">Tax-Free Childcare</div>
    </div>
    <div class="eligibility-item ${r.has30Hours ? 'yes' : 'no'}">
      <div class="eligibility-icon">${r.has30Hours ? '✅' : '❌'}</div>
      <div class="eligibility-text">30 Hours Free Childcare</div>
    </div>
    <div class="eligibility-item ${r.employment !== 'self-employed' ? 'yes' : 'no'}">
      <div class="eligibility-icon">${r.employment !== 'self-employed' ? '✅' : '❌'}</div>
      <div class="eligibility-text">Salary Sacrifice</div>
    </div>
    <div class="eligibility-item ${r.income2 > 0 ? 'yes' : 'no'}">
      <div class="eligibility-icon">${r.income2 > 0 ? '✅' : '❌'}</div>
      <div class="eligibility-text">Income Splitting</div>
    </div>
  </div>
</div>

<!-- PAGE 3: SAVINGS BREAKDOWN -->
<div class="page">
  <div class="page-header">
    <div class="page-logo">The 100k Parent</div>
    <div class="page-number">Page 3</div>
  </div>

  <h2>Your Savings Breakdown</h2>
  <p class="section-intro">Here is how your estimated saving of £${avg.toLocaleString()} per year is made up.</p>

  <div class="saving-row highlight">
    <div class="saving-row-left">
      <h3>Tax-Free Childcare</h3>
      <p>20% government top-up on eligible childcare costs (max £2,000 per child)</p>
    </div>
    <div class="saving-amount ${r.tfc === 0 ? 'zero' : ''}">£${Math.round(r.tfc).toLocaleString()}</div>
  </div>

  <div class="saving-row">
    <div class="saving-row-left">
      <h3>Salary Sacrifice</h3>
      <p>Income tax and National Insurance savings via pension contributions</p>
    </div>
    <div class="saving-amount ${r.salary === 0 ? 'zero' : ''}">£${Math.round(r.salary).toLocaleString()}</div>
  </div>

  <div class="saving-row">
    <div class="saving-row-left">
      <h3>Income Splitting</h3>
      <p>Optimising how income is distributed between partners across tax bands</p>
    </div>
    <div class="saving-amount ${r.splitting === 0 ? 'zero' : ''}">£${Math.round(r.splitting).toLocaleString()}</div>
  </div>

  <div class="saving-row">
    <div class="saving-row-left">
      <h3>30 Hours Free Childcare</h3>
      <p>Value of government-funded hours for eligible children aged 9 months to 4 years</p>
    </div>
    <div class="saving-amount ${r.thirtyHours === 0 ? 'zero' : ''}">£${Math.round(r.thirtyHours).toLocaleString()}</div>
  </div>

  <div class="total-box">
    <div>
      <div class="total-box-label">Your estimated total annual saving</div>
      <div style="font-size: 13px; opacity: 0.7; margin-top: 4px;">Range: £${Math.round(r.minSaving).toLocaleString()} — £${Math.round(r.maxSaving).toLocaleString()}</div>
    </div>
    <div class="total-box-amount">£${avg.toLocaleString()}</div>
  </div>

  <div class="disclaimer">
    <strong>Important:</strong> These figures are estimates based on the information you provided and standard HMRC rules as of 2026. Your actual savings may differ depending on your full financial circumstances. We recommend speaking with a qualified financial adviser before making changes to your arrangements.
  </div>
</div>

<!-- PAGE 4: HOW IT'S CALCULATED -->
<div class="page">
  <div class="page-header">
    <div class="page-logo">The 100k Parent</div>
    <div class="page-number">Page 4</div>
  </div>

  <h2>How Your Saving Is Calculated</h2>
  <p class="section-intro">A transparent explanation of the methodology behind each figure.</p>

  <div class="calc-box">
    <h3>Tax-Free Childcare (TFC)</h3>
    <p>The government adds 20p for every 80p you pay into a Tax-Free Childcare account, up to £2,000 per child per year (£4,000 if your child is disabled). This is equivalent to the basic rate of tax. Both you and your partner (if applicable) must each earn at least £2,379 per year and neither can earn over £100,000. We calculate this as: <strong>annual childcare spend × 20% = TFC saving</strong>, capped at £2,000 per child.</p>
  </div>

  <div class="calc-box">
    <h3>Salary Sacrifice</h3>
    <p>By paying into your pension via salary sacrifice, you reduce your gross salary, saving Income Tax and National Insurance on the sacrificed amount. For higher-rate taxpayers (income over £50,270), the combined saving is approximately 42p per £1 sacrificed. We estimate a conservative sacrifice amount of 30% of annual childcare costs, capped at £5,000 per year, and apply the appropriate tax relief rate for your income band.</p>
  </div>

  <div class="calc-box">
    <h3>Income Splitting</h3>
    <p>Where one partner earns above the higher-rate threshold (£50,270) and the other earns below it, there may be opportunities to redistribute income to reduce the overall household tax bill. This includes dividend payments, pension contributions, or restructuring employment arrangements. We apply a conservative estimate of £3,000 per year where this applies to your household.</p>
  </div>

  <div class="calc-box">
    <h3>30 Hours Free Childcare</h3>
    <p>Eligible working parents of children aged 9 months to 4 years can claim up to 30 hours of free childcare per week for 38 weeks per year. To qualify, both partners must work at least 16 hours per week at the national minimum wage and neither can earn over £100,000. We calculate the value at the average UK nursery rate of £15/hour × 1,140 hours per eligible child per year.</p>
  </div>
</div>

<!-- PAGE 5: NEXT STEPS -->
<div class="page">
  <div class="page-header">
    <div class="page-logo">The 100k Parent</div>
    <div class="page-number">Page 5</div>
  </div>

  <h2>Your Next Steps</h2>
  <p class="section-intro">Here is what to do to start saving as soon as possible.</p>

  <div class="step-item">
    <div class="step-num">1</div>
    <div class="step-text">
      <h3>Apply for Tax-Free Childcare</h3>
      <p>Visit Childcare Choices (childcarechoices.gov.uk) and apply through the Government Gateway. You will need your National Insurance number and details of your childcare provider. Applications take around 20 minutes and you can start using your account immediately once approved.</p>
    </div>
  </div>

  <div class="step-item">
    <div class="step-num">2</div>
    <div class="step-text">
      <h3>Set Up Salary Sacrifice via Your Employer</h3>
      <p>Contact your HR or payroll department and ask about salary sacrifice pension arrangements. Explain that you would like to increase pension contributions via salary sacrifice. Most employers already offer this — it just needs to be activated. Check your payslip the following month to confirm the saving.</p>
    </div>
  </div>

  <div class="step-item">
    <div class="step-num">3</div>
    <div class="step-text">
      <h3>Apply for 30 Hours Free Childcare (if eligible)</h3>
      <p>Apply via the Childcare Choices website or GOV.UK at least 3 months before your child's eligibility date. You will receive an 11-digit code to give to your childcare provider. Reconfirm your eligibility every 3 months via your Government Gateway account.</p>
    </div>
  </div>

  <div class="step-item">
    <div class="step-num">4</div>
    <div class="step-text">
      <h3>Review Your Income Structure</h3>
      <p>If one partner earns above £100,000, consider making additional pension contributions to reduce your adjusted net income below the threshold. This alone could unlock Tax-Free Childcare and 30 hours worth up to £17,000+ per year for some families. Speak to a financial adviser to understand the best approach for your situation.</p>
    </div>
  </div>

  ${tier === 'complete' ? `
  <div class="step-item">
    <div class="step-num">5</div>
    <div class="step-text">
      <h3>Book Your Advisor Call</h3>
      <p>As a Complete Guide customer, you have a free 30-minute call with our recommended financial adviser included. They will review your specific situation, confirm your eligibility, and provide personalised recommendations. Check your email for your booking link.</p>
    </div>
  </div>
  ` : ''}

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is for informational purposes only and does not constitute financial advice. The 100k Parent is not FCA regulated. Always consult a qualified financial adviser before making changes to your financial arrangements. Figures are based on 2025/26 tax year rules and may change in future tax years.
  </div>
</div>

<!-- FOOTER -->
<div class="report-footer">
  <div class="report-footer-logo">The 100k Parent</div>
  <p>Helping UK families earning over £100k save on childcare</p>
  <p style="margin-top: 8px;">© 2026 The 100k Parent | the100kparent.com</p>
</div>

</body>
</html>`;
    }
}

// ─── INIT ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const calc = new V2Calculator();

    // PDF download buttons (added after purchase confirmation)
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-pdf]')) {
            const tier = e.target.dataset.pdf;
            if (Object.keys(calc.lastResults).length === 0) {
                alert('Please run the calculator first.');
                return;
            }
            const gen = new PDFReportGenerator(calc.lastResults);
            gen.generate(tier);
        }
    });
});
