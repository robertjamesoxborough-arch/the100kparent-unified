# The 100k Parent — Savings Claims: Substantiation Record

**Purpose:** Evidence held on file to substantiate the savings figures used in marketing and in the report, as required by the **CAP Code (ASA)** and the **Consumer Protection from Unfair Trading Regulations 2008**. Review and update every tax year, or whenever HMRC rates change.

**Tax year basis:** 2025/26. **Last reviewed:** July 2026.

**General position:** All figures presented to consumers are described as *estimates* and as *maximums subject to eligibility*, with a prominent site-wide disclaimer (landing footer + FAQ) stating that actual savings depend on the user's own circumstances and directing users to GOV.UK. Personalised figures shown in the calculator/report are computed from the user's own inputs using the methodology in `public/v2-calculator.js` (see §6).

---

## 1. "Tax-Free Childcare — up to £2,000 per child per year (£4,000 for a disabled child)"
- **Basis:** Statutory. TFC pays a 20% government top-up on childcare payments, capped at **£500 per quarter (£2,000/year) per child**, or **£1,000 per quarter (£4,000/year)** for a disabled child.
- **Source:** GOV.UK — *Tax-Free Childcare* (gov.uk/tax-free-childcare).
- **Eligibility conditions stated on site:** each parent earns at least the min-income threshold and neither has adjusted net income over £100,000; child under 12 (under 17 if disabled).
- **Status:** Factual cap — accurate as stated.

## 2. "Salary sacrifice — roughly £2,000–£5,000 a year for higher earners"
- **Basis:** Pension salary sacrifice reduces gross pay, saving Income Tax + NI at the marginal rate. Worked range:
  - Higher-rate taxpayer (42% combined IT+NI relief) contributing an extra ~£5,000–£12,000 gross/year → **£2,100–£5,040** saved.
  - This is the mechanism modelled as `genericSalarySacrifice` (≈30% of childcare spend, capped £5,000, × marginal rate) in the calculator.
- **Source:** GOV.UK — *Income Tax rates and Personal Allowances*; *National Insurance rates*; *Tax on your private pension contributions*.
- **Caveat stated on site:** "depending on your income and how much you contribute". Framed as pension salary sacrifice (NOT childcare vouchers, which closed to new entrants in October 2018).
- **Status:** Range substantiated as an estimate for higher-rate taxpayers; caveated.

## 3. "30 hours free childcare — up to ~£6,000 per year per eligible child"
- **Basis:** 30 funded hours/week × 38 weeks = **1,140 hours/year**. At a typical private nursery rate of roughly £5.30–£6.00/hour of otherwise-payable care, 1,140 × ~£5.26–£6.00 ≈ **£6,000/year**. Value is capped at the family's actual spend (the calculator uses 0.55 × annual childcare as a term-time-weighted estimate, never exceeding actual cost).
- **Source:** GOV.UK — *30 hours free childcare* / *Check what help you could get with childcare costs*; provider fee ranges from published nursery pricing (keep 2–3 dated screenshots of representative UK nursery fee pages on file).
- **Eligibility conditions stated on site:** working-parent income test; adjusted net income under £100,000; child aged 9 months to 4 years.
- **Status:** "Up to ~£6,000" substantiated; caveated with "depending on your provider's rates" and "if you're eligible".
- **Action:** Attach dated evidence of representative nursery hourly rates.

## 4. "Up to £17,000/year" (headline / meta description)
- **Basis:** Combined maximum for a household with two children aged under 4 and high childcare costs, reducing adjusted net income below £100,000:
  - 2 × Tax-Free Childcare ≈ up to £4,000
  - 2 × 30 funded hours ≈ up to ~£12,000 (capped at actual spend)
  - Pension tax/NI relief on the contribution needed to cross £100,000 ≈ several thousand
  - The calculator itself produces totals in and above this range for such families (documented test case: couple £110k+£95k, 2 children, £2,000/month → **£21,561**).
- **Source:** Aggregation of §1–§3 plus the pension-relief methodology in §6.
- **Caveat stated on site:** "depending on their circumstances" (meta); headline is supported by the personalised calculator, which shows each user their own figure.
- **Status:** "Up to" maximum substantiated; not presented as a typical result.

## 5. "Save thousands" (general marketing — hero, cards, FAQ)
- **Basis:** For the target audience (households with children in paid childcare, incomes near/over £100k), the combined value of §1–§3 routinely exceeds £2,000/year. Supported by the calculator output.
- **Caveat:** Covered by the site-wide estimates disclaimer (landing footer) and the FAQ estimates note.
- **Status:** Supportable for the stated audience; kept general and caveated.

## 6. Personalised calculator/report figures — methodology
- **Source of truth:** `public/v2-calculator.js` (canonical `displayTfc`, `displayThirtyHours`, `displaySalary`, `displayTotal`), rendered by `public/v2-success.html`.
- **Key rules encoded:**
  - TFC = 20% of childcare **after** funded hours, capped £2,000/child; only where the working-parent test is met.
  - 30 hours = 0.55 × annual childcare for an eligible-age child meeting the working-parent test (never exceeds actual spend).
  - Over £100k: TFC + 30 hours shown as **achievable once adjusted net income is brought under £100,000**, with an explicit on-page/in-report caveat; pension relief modelled at 62%/42% (employee) or 60%/40% (self-employed, no NI).
  - Existing pension contributions are deducted before computing the extra needed.
- **Conservative simplifications on file:** for incomes above £125,140 a flat marginal rate is applied (understates relief — never overstates).

---

## Outstanding evidence to attach
- [ ] Dated screenshots of 2–3 representative UK nursery hourly/weekly fee pages (supports §3, §4).
- [ ] Note of the GOV.UK pages and the date last checked for each statutory figure (§1–§3).
- [ ] Re-run this record at the start of each tax year and on any HMRC rate change.
