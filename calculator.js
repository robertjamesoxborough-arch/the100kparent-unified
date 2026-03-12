// The 100k Parent - Premium Calculator with Email Gate
class PremiumCalculator {
    constructor() {
        this.inputs = {
            income1: document.getElementById('income1'),
            income2: document.getElementById('income2'),
            children: document.getElementById('children'),
            childAge: document.getElementById('childAge'),
            childcare: document.getElementById('childcare'),
            employment: document.getElementById('employment')
        };
        this.pendingResults = null;
        this.init();
    }

    init() {
        // Show/hide second income field
        const hasSecondIncome = document.getElementById('hasSecondIncome');
        const income2Group = document.getElementById('income2Group');
        if(hasSecondIncome && income2Group) {
            income2Group.style.display = hasSecondIncome.value === 'yes' ? 'block' : 'none';
            hasSecondIncome.addEventListener('change', () => {
                income2Group.style.display = hasSecondIncome.value === 'yes' ? 'block' : 'none';
                if(hasSecondIncome.value === 'no' && this.inputs.income2) {
                    this.inputs.income2.value = '';
                }
            });
        }
    }

    calculate() {
        const income1 = parseFloat(this.inputs.income1.value) || 0;
        const income2 = parseFloat(this.inputs.income2.value) || 0;
        const children = parseInt(this.inputs.children.value) || 1;
        const childAge = parseFloat(this.inputs.childAge?.value) || 2;
        const monthlyChildcare = parseFloat(this.inputs.childcare.value) || 0;
        const employment = this.inputs.employment.value;

        if (income1 === 0) {
            alert('Please enter your annual income to calculate savings.');
            return false;
        }

        const higherIncome = Math.max(income1, income2);
        const lowerIncome = Math.min(income1, income2);
        const householdIncome = income1 + income2;
        const annualChildcare = monthlyChildcare * 12;

        const income1Over100k = income1 > 100000;
        const income2Over100k = income2 > 100000;
        const anyOver100k = income1Over100k || income2Over100k;

        const potentialTFC = Math.min(annualChildcare * 0.20, 2000 * children);
        const potential30hrs = (childAge >= 0.75 && childAge <= 4) ? 6840 : 0;
        const lockedOutValue = anyOver100k ? (potentialTFC + potential30hrs) : 0;

        let sacrificeNeeded = 0;
        let sacrificeTarget = '';
        if(income1Over100k) {
            sacrificeNeeded = income1 - 99999;
            sacrificeTarget = 'your';
        } else if(income2Over100k) {
            sacrificeNeeded = income2 - 99999;
            sacrificeTarget = "your partner's";
        }

        const taxRate = higherIncome > 125140 ? 0.45 : higherIncome > 50270 ? 0.40 : 0.20;

        const tfcSaving = anyOver100k ? 0 : potentialTFC;
        const thirtyHrsSaving = anyOver100k ? 0 : potential30hrs;

        let salarySaving = 0;
        if(employment === 'employed') {
            const maxSacrifice = Math.min(annualChildcare, 30000);
            salarySaving = maxSacrifice * (taxRate + 0.02);
        }

        let splittingSaving = 0;
        if((employment === 'director' || employment === 'self-employed') && income2 > 0) {
            const incomeDiff = Math.abs(income1 - income2);
            if(incomeDiff > 20000) {
                splittingSaving = Math.min(incomeDiff * 0.15, 5000);
            }
        }

        let childBenefitSaving = 0;
        if(higherIncome > 60000) {
            const benefitValue = children === 1 ? 1331 : 1331 + (children - 1) * 881;
            if(higherIncome >= 80000) {
                childBenefitSaving = benefitValue;
            } else {
                const excess = higherIncome - 60000;
                const chargePercent = Math.min(excess / 20000, 1);
                childBenefitSaving = benefitValue * chargePercent;
            }
        }

        const totalSaving = tfcSaving + thirtyHrsSaving + salarySaving + splittingSaving;

        this.pendingResults = {
            totalSaving, tfcSaving, thirtyHrsSaving, salarySaving, splittingSaving,
            childBenefitSaving, lockedOutValue, potential30hrs, potentialTFC,
            sacrificeNeeded, sacrificeTarget, anyOver100k, income1, income2,
            higherIncome, taxRate, employment, children
        };

        return true;
    }

    showResults() {
        if(!this.pendingResults) return;
        const d = this.pendingResults;
        const resultsDiv = document.getElementById('calculatorResults');
        if(!resultsDiv) return;

        if(d.anyOver100k) {
            resultsDiv.innerHTML = this.render100kPlusResults(d);
        } else {
            resultsDiv.innerHTML = this.renderStandardResults(d);
        }

        resultsDiv.style.display = 'block';
        resultsDiv.style.animation = 'fadeInUp 0.6s ease forwards';
        document.getElementById('resultsActions').style.display = 'block';

        // Scroll to results
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    render100kPlusResults(d) {
        const unlockSavings = d.sacrificeNeeded * (d.taxRate + 0.02);
        const netCost = d.sacrificeNeeded - unlockSavings;
        const totalUnlock = d.lockedOutValue + unlockSavings;

        return `
        <div style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: white; padding: 2rem; border-radius: 16px; margin: 2rem 0;">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">&#9888;</div>
                <div>
                    <div style="font-weight: 900; font-size: 1.5rem;">You're Locked Out</div>
                    <div style="opacity: 0.9; font-size: 0.9375rem;">Income over £100k blocks critical benefits</div>
                </div>
            </div>
            <div style="background: rgba(255,255,255,0.15); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <div style="opacity: 0.9; font-size: 0.875rem; margin-bottom: 0.5rem;">YOU'RE LOSING EVERY YEAR:</div>
                <div style="font-weight: 900; font-size: 3rem; line-height: 1;">£${Math.round(d.lockedOutValue).toLocaleString()}</div>
                <div style="opacity: 0.8; font-size: 0.875rem; margin-top: 0.75rem;">
                    ${d.potentialTFC > 0 ? `Tax-Free Childcare: £${Math.round(d.potentialTFC).toLocaleString()}` : ''}
                    ${d.potential30hrs > 0 ? ` + 30 Hours Free: £${Math.round(d.potential30hrs).toLocaleString()}` : ''}
                </div>
            </div>
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 1.5rem; border-radius: 12px;">
                <div style="font-weight: 800; font-size: 1.125rem; margin-bottom: 1rem;">THE UNLOCK STRATEGY</div>
                <div style="opacity: 0.95; line-height: 1.6; font-size: 0.9375rem;">
                    <strong>Step 1:</strong> Salary sacrifice £${Math.round(d.sacrificeNeeded).toLocaleString()} from ${d.sacrificeTarget} income into pension<br>
                    <strong>Step 2:</strong> This drops adjusted net income to £99,999<br>
                    <strong>Step 3:</strong> Unlocks £${Math.round(d.lockedOutValue).toLocaleString()}/year in benefits
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 1.25rem; border-radius: 8px; margin-top: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <span>Tax + NI saved on sacrifice:</span>
                        <strong style="font-size: 1.125rem;">£${Math.round(unlockSavings).toLocaleString()}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <span>Benefits unlocked:</span>
                        <strong style="font-size: 1.125rem;">£${Math.round(d.lockedOutValue).toLocaleString()}</strong>
                    </div>
                    <div style="border-top: 2px solid rgba(255,255,255,0.3); margin: 1rem 0; padding-top: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 800; font-size: 1.125rem;">TOTAL ANNUAL SAVING:</span>
                            <span style="font-weight: 900; font-size: 2rem;">£${Math.round(totalUnlock).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.875rem; opacity: 0.95;">
                    Net cost: Only £${Math.round(netCost).toLocaleString()}/year (goes into your pension, not lost)
                </div>
            </div>
        </div>
        ${this.renderAdditionalSavings(d)}
        `;
    }

    renderStandardResults(d) {
        return `
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 2rem; border-radius: 16px; margin: 2rem 0;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="opacity: 0.9; font-size: 0.875rem; margin-bottom: 0.5rem;">YOUR ANNUAL SAVING POTENTIAL</div>
                <div style="font-weight: 900; font-size: 4rem; line-height: 1;">£${Math.round(d.totalSaving).toLocaleString()}</div>
                <div style="opacity: 0.8; font-size: 0.875rem; margin-top: 0.5rem;">every year, completely tax-free</div>
            </div>
            <div style="background: rgba(255,255,255,0.15); padding: 1.5rem; border-radius: 12px;">
                ${d.tfcSaving > 0 ? `<div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.2);"><span>Tax-Free Childcare</span><strong>£${Math.round(d.tfcSaving).toLocaleString()}/yr</strong></div>` : ''}
                ${d.thirtyHrsSaving > 0 ? `<div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.2);"><span>30 Hours Free Childcare</span><strong>£${Math.round(d.thirtyHrsSaving).toLocaleString()}/yr</strong></div>` : ''}
                ${d.salarySaving > 0 ? `<div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.2);"><span>Salary Sacrifice</span><strong>£${Math.round(d.salarySaving).toLocaleString()}/yr</strong></div>` : ''}
                ${d.splittingSaving > 0 ? `<div style="display: flex; justify-content: space-between; padding: 0.75rem 0;"><span>Income Splitting</span><strong>£${Math.round(d.splittingSaving).toLocaleString()}/yr</strong></div>` : ''}
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.875rem;">
                18-year lifetime total: <strong>£${Math.round((d.totalSaving * 18) + 41447).toLocaleString()}</strong>
            </div>
        </div>
        ${d.childBenefitSaving > 0 ? `
        <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 1.5rem; border-radius: 0 12px 12px 0; margin: 1.5rem 0;">
            <div style="font-weight: 800; color: #92400E; margin-bottom: 0.5rem;">Child Benefit High Income Charge</div>
            <div style="color: #78350F; font-size: 0.9375rem; line-height: 1.6;">
                Income of £${Math.round(d.higherIncome).toLocaleString()} means you ${d.higherIncome >= 80000 ? 'lose ALL' : 'partially lose'} Child Benefit (£${Math.round(d.childBenefitSaving).toLocaleString()}/year).
            </div>
        </div>` : ''}
        `;
    }

    renderAdditionalSavings(d) {
        if(d.salarySaving === 0 && d.splittingSaving === 0) return '';
        return `
        <div style="background: white; padding: 2rem; border-radius: 16px; border: 2px solid #E5E7EB; margin-top: 2rem;">
            <h3 style="margin: 0 0 1.5rem; color: #0F172A;">Additional Strategies:</h3>
            ${d.salarySaving > 0 ? `<div style="padding: 1rem; background: #F9FAFB; border-radius: 8px; margin-bottom: 1rem;"><div style="font-weight: 700; color: #0F172A; margin-bottom: 0.5rem;">Ongoing Salary Sacrifice</div><div style="color: #6B7280; font-size: 0.9375rem;">Continue sacrificing childcare costs: <strong style="color: #10B981;">£${Math.round(d.salarySaving).toLocaleString()}/year saved</strong></div></div>` : ''}
            ${d.splittingSaving > 0 ? `<div style="padding: 1rem; background: #F9FAFB; border-radius: 8px;"><div style="font-weight: 700; color: #0F172A; margin-bottom: 0.5rem;">Income Splitting</div><div style="color: #6B7280; font-size: 0.9375rem;">Move profit to partner's lower tax band: <strong style="color: #10B981;">£${Math.round(d.splittingSaving).toLocaleString()}/year saved</strong></div></div>` : ''}
        </div>`;
    }

    showEmpty() {
        document.getElementById('calculatorResults').style.display = 'none';
    }
}

// Initialize
let calculator;
if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { calculator = new PremiumCalculator(); });
} else {
    calculator = new PremiumCalculator();
}

// Called when "Calculate My Savings" button is clicked
function runCalculation() {
    if(!calculator.calculate()) return;

    // Hide the calculate button area, show email gate
    document.getElementById('emailGate').style.display = 'block';
    document.getElementById('emailGate').style.animation = 'fadeInUp 0.5s ease forwards';
    document.getElementById('emailGate').scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Focus the email input
    setTimeout(() => document.getElementById('userEmail').focus(), 600);
}

// Called when they submit their email
function unlockResults() {
    const email = document.getElementById('userEmail').value.trim();
    if(!email || !email.includes('@')) {
        document.getElementById('userEmail').style.borderColor = '#DC2626';
        document.getElementById('userEmail').setAttribute('placeholder', 'Please enter a valid email');
        return;
    }

    // Store email (you can later send this to your email service)
    localStorage.setItem('userEmail', email);
    localStorage.setItem('emailCapturedAt', new Date().toISOString());

    // Hide email gate, show results
    document.getElementById('emailGate').style.display = 'none';
    calculator.showResults();
}
