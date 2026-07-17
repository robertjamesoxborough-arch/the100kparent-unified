/**
 * Runs the REAL shipped public/v2-calculator.js and returns what it produced.
 *
 * Why this file exists: the calculator is browser code. It expects a page around
 * it (inputs, buttons, localStorage). Node has none of those. So we build a
 * minimal fake page, drop the real calculator into it, press the button, and
 * read the answer back out.
 *
 * The important part: we execute the ACTUAL file that ships to customers. We do
 * not copy its sums into the tests. If we re-implemented the maths here, the
 * tests would only ever prove that our copy agrees with our copy, and a bug in
 * the real calculator would sail straight through.
 *
 * You should never need to touch this file. It only changes if the calculator
 * grows a new input box.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CALCULATOR_PATH = path.join(__dirname, '..', 'public', 'v2-calculator.js');

/** The smallest thing that can pretend to be an element on a page. */
function makeElement(id) {
  return {
    id,
    value: '',
    checked: false,
    textContent: '',
    innerHTML: '',
    className: '',
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    appendChild() {},
    remove() {},
    getBoundingClientRect: () => ({ top: 0 }),
    offsetHeight: 0,
  };
}

/**
 * Fill in the calculator, press Calculate, and report what happened.
 *
 * @param {object} inputs
 *   income1      {string} required, annual salary, e.g. '60000'
 *   income2      {string} partner's salary. Only used when hasPartner is true.
 *   hasPartner   {boolean} ticks the "yes, second income" radio
 *   numChildren  {string} e.g. '1'
 *   childcare    {string} MONTHLY childcare cost, e.g. '800'
 *   ages         {Array<number|null>} one entry per child. null = not chosen yet.
 *   pension1     {string} MONTHLY existing pension contribution
 *   pension2     {string} partner's monthly pension contribution
 *   employment   {string} 'employed' | 'self-employed' | 'director'
 *   employment2  {string} same, for the partner
 *
 * @returns {object}
 *   results  the figures the calculator saved, or null if it refused to run
 *   alerts   any message it showed the user (this is how it rejects bad input)
 *   crashed  an error message if the calculator threw, otherwise null
 */
function runCalculator(inputs) {
  const elements = {};
  const element = (id) => (elements[id] ||= makeElement(id));

  element('income1').value = inputs.income1 ?? '';
  element('income2').value = inputs.income2 ?? '';
  element('numChildren').value = inputs.numChildren ?? '';
  element('childcare').value = inputs.childcare ?? '';
  element('employment').value = inputs.employment ?? 'employed';
  element('employment2').value = inputs.employment2 ?? 'employed';
  element('pension1').value = inputs.pension1 ?? '';
  element('pension2').value = inputs.pension2 ?? '';
  element('secondIncomeYes').checked = Boolean(inputs.hasPartner);
  element('secondIncomeNo').checked = !inputs.hasPartner;

  const alerts = [];
  const storage = {};

  const sandbox = {
    document: {
      getElementById: element,
      createElement: (tag) => makeElement(`created-${tag}`),
      addEventListener() {},
      querySelector: () => null,
    },
    window: { pageYOffset: 0, scrollTo() {} },
    localStorage: {
      setItem: (key, value) => { storage[key] = value; },
      getItem: (key) => storage[key] ?? null,
    },
    alert: (message) => alerts.push(message),
    console,
  };

  const source = fs.readFileSync(CALCULATOR_PATH, 'utf8');
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n; globalThis.__V2Calculator = V2Calculator;`, sandbox);

  const calculator = new sandbox.__V2Calculator();

  // The real page builds one age dropdown per child as you type. Nothing types
  // here, so we supply the dropdowns the calculator would have found.
  calculator.childAges = (inputs.ages ?? []).map((age) => ({
    value: age === null || age === undefined ? '' : String(age),
  }));

  let crashed = null;
  try {
    calculator.calculate();
  } catch (error) {
    crashed = error.message;
  }

  const saved = storage['100kp_results'];
  return {
    results: saved ? JSON.parse(saved) : null,
    alerts,
    crashed,
  };
}

module.exports = { runCalculator };
