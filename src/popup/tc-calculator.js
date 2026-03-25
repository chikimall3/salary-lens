/**
 * Total Compensation Calculator
 * Calculates annual total comp from base, bonus, equity, 401k match, and benefits.
 */

/**
 * Calculate total annual compensation.
 * @param {Object} inputs
 * @param {number} inputs.base - Annual base salary
 * @param {number} [inputs.bonus=0] - Annual bonus (cash)
 * @param {number} [inputs.equity=0] - Annual equity/RSU value
 * @param {number} [inputs.match401k=0] - Annual 401k employer match
 * @param {number} [inputs.benefits=0] - Annual benefits value (insurance, etc.)
 * @returns {{ total: number, breakdown: Object }}
 */
export function calculateTC(inputs) {
  const base = inputs.base || 0;
  const bonus = inputs.bonus || 0;
  const equity = inputs.equity || 0;
  const match401k = inputs.match401k || 0;
  const benefits = inputs.benefits || 0;
  const total = base + bonus + equity + match401k + benefits;

  return {
    total,
    breakdown: { base, bonus, equity, match401k, benefits },
  };
}

/**
 * Format a number as USD currency (no cents).
 * @param {number} value
 * @returns {string}
 */
function fmt(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Render the TC calculator HTML.
 * @returns {string}
 */
export function renderTCCalculator() {
  return `
    <div class="tc-calculator">
      <h3 class="tc-title">Total Compensation Calculator</h3>
      <div class="tc-fields">
        <label class="tc-field">
          <span>Base Salary</span>
          <input type="number" id="tc-base" placeholder="120,000" min="0" step="1000">
        </label>
        <label class="tc-field">
          <span>Annual Bonus</span>
          <input type="number" id="tc-bonus" placeholder="10,000" min="0" step="500">
        </label>
        <label class="tc-field">
          <span>Equity / RSU (per year)</span>
          <input type="number" id="tc-equity" placeholder="15,000" min="0" step="1000">
        </label>
        <label class="tc-field">
          <span>401k Match (per year)</span>
          <input type="number" id="tc-401k" placeholder="6,000" min="0" step="500">
        </label>
        <label class="tc-field">
          <span>Benefits Value</span>
          <input type="number" id="tc-benefits" placeholder="8,000" min="0" step="500">
        </label>
      </div>
      <div class="tc-result" id="tc-result">
        <span class="tc-result-label">Total Compensation</span>
        <span class="tc-result-value" id="tc-total">$0</span>
      </div>
    </div>
  `;
}

/**
 * Attach event listeners to TC calculator inputs.
 * Call this after inserting renderTCCalculator() into the DOM.
 */
export function initTCCalculator() {
  const ids = ['tc-base', 'tc-bonus', 'tc-equity', 'tc-401k', 'tc-benefits'];

  function update() {
    const values = {
      base: parseFloat(document.getElementById('tc-base').value) || 0,
      bonus: parseFloat(document.getElementById('tc-bonus').value) || 0,
      equity: parseFloat(document.getElementById('tc-equity').value) || 0,
      match401k: parseFloat(document.getElementById('tc-401k').value) || 0,
      benefits: parseFloat(document.getElementById('tc-benefits').value) || 0,
    };
    const { total } = calculateTC(values);
    document.getElementById('tc-total').textContent = fmt(total);
  }

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', update);
  });
}
