import { MSG } from '../shared/constants.js';

/**
 * Extract job title from Indeed job detail page.
 * @returns {string|null}
 */
function extractJobTitle() {
  const selectors = [
    'h1.jobsearch-JobInfoHeader-title',
    '[data-testid="jobsearch-JobInfoHeader-title"]',
    'h1.icl-u-xs-mb--xs',
    '.jobsearch-JobInfoHeader-title-container h1',
    'h1[class*="JobTitle"]',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el.textContent.trim();
  }
  return null;
}

/**
 * Extract company name from Indeed job detail page.
 * @returns {string|null}
 */
function extractCompany() {
  const selectors = [
    '[data-testid="inlineHeader-companyName"]',
    '[data-company-name="true"]',
    '.jobsearch-InlineCompanyRating-companyHeader a',
    '.icl-u-lg-mr--sm a',
    'div[class*="CompanyName"] a',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el.textContent.trim();
  }
  return null;
}

/**
 * Extract location from Indeed job detail page.
 * @returns {string|null}
 */
function extractLocation() {
  const selectors = [
    '[data-testid="inlineHeader-companyLocation"]',
    '[data-testid="job-location"]',
    '.jobsearch-JobInfoHeader-subtitle .jobsearch-JobInfoHeader-locationText',
    'div[class*="CompanyLocation"]',
    '.icl-u-xs-mt--xs .icl-u-textColor--secondary',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      let text = el.textContent.trim();
      // Remove "Remote", "Hybrid" prefixes if present
      text = text.replace(/^(Remote|Hybrid)\s*[-–—]?\s*/i, '').trim();
      if (text) return text;
    }
  }
  return null;
}

/**
 * Extract listed salary from Indeed job detail page (if available).
 * @returns {{ min: number, max: number, period: string }|null}
 */
function extractListedSalary() {
  const selectors = [
    '#salaryInfoAndJobType',
    '[data-testid="attribute_snippet_testid"]',
    '.jobsearch-JobMetadataHeader-item',
    'span[class*="SalarySnippet"]',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const text = el.textContent;
    const match = text.match(/\$[\d,]+(?:\.\d{2})?(?:\s*[-–—]\s*\$[\d,]+(?:\.\d{2})?)?/);
    if (!match) continue;

    const numbers = match[0].match(/[\d,]+(?:\.\d{2})?/g).map(n => parseFloat(n.replace(/,/g, '')));
    const period = /hour/i.test(text) ? 'hourly'
      : /month/i.test(text) ? 'monthly'
      : 'annual';

    return {
      min: numbers[0],
      max: numbers.length > 1 ? numbers[1] : numbers[0],
      period,
    };
  }
  return null;
}

/**
 * Normalize salary to annual value.
 * @param {{ min: number, max: number, period: string }} salary
 * @returns {{ min: number, max: number }}
 */
function normalizeToAnnual(salary) {
  const multiplier = salary.period === 'hourly' ? 2080
    : salary.period === 'monthly' ? 12
    : 1;
  return {
    min: Math.round(salary.min * multiplier),
    max: Math.round(salary.max * multiplier),
  };
}

/**
 * Calculate where a salary falls in the market distribution.
 * Returns a percentage (0-100) representing position.
 * @param {number} salary - Annual salary
 * @param {Object} market - { p10, p25, p50, p75, p90 }
 * @returns {number}
 */
function calcMarketPosition(salary, market) {
  const brackets = [
    { pct: 10, val: market.p10 },
    { pct: 25, val: market.p25 },
    { pct: 50, val: market.p50 },
    { pct: 75, val: market.p75 },
    { pct: 90, val: market.p90 },
  ];
  if (salary <= brackets[0].val) return brackets[0].pct;
  if (salary >= brackets[brackets.length - 1].val) return brackets[brackets.length - 1].pct;

  for (let i = 0; i < brackets.length - 1; i++) {
    if (salary >= brackets[i].val && salary <= brackets[i + 1].val) {
      const range = brackets[i + 1].val - brackets[i].val;
      if (range === 0) return brackets[i].pct;
      const ratio = (salary - brackets[i].val) / range;
      return brackets[i].pct + ratio * (brackets[i + 1].pct - brackets[i].pct);
    }
  }
  return 50;
}

/**
 * Format a number as USD currency.
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Get a label and color for the market position.
 * @param {number} position - Percentile position (0-100)
 * @returns {{ label: string, color: string }}
 */
function getPositionLabel(position) {
  if (position < 25) return { label: 'Below Market', color: '#dc3545' };
  if (position < 40) return { label: 'Below Average', color: '#fd7e14' };
  if (position < 60) return { label: 'At Market Rate', color: '#28a745' };
  if (position < 75) return { label: 'Above Average', color: '#17a2b8' };
  return { label: 'Well Above Market', color: '#6f42c1' };
}

/**
 * Create and inject the SalaryLens widget into the page.
 * @param {Object} data - { jobTitle, company, location, listedSalary, marketData }
 */
function injectWidget(data) {
  // Remove any existing widget
  const existing = document.getElementById('salary-lens-widget');
  if (existing) existing.remove();

  const widget = document.createElement('div');
  widget.id = 'salary-lens-widget';

  if (data.error) {
    widget.innerHTML = buildErrorHTML(data.error);
    insertWidget(widget);
    return;
  }

  const { marketData, listedSalary } = data;
  let positionHTML = '';

  if (listedSalary) {
    const annual = normalizeToAnnual(listedSalary);
    const midpoint = Math.round((annual.min + annual.max) / 2);
    const position = calcMarketPosition(midpoint, marketData);
    const { label, color } = getPositionLabel(position);

    positionHTML = `
      <div class="sl-position">
        <div class="sl-position-label" style="color: ${color}">${label}</div>
        <div class="sl-position-detail">
          Listed: ${formatCurrency(annual.min)}${annual.min !== annual.max ? ' - ' + formatCurrency(annual.max) : ''}
          <span class="sl-percentile">(${Math.round(position)}th percentile)</span>
        </div>
      </div>
      <div class="sl-bar-container">
        <div class="sl-bar">
          <div class="sl-bar-fill" style="width: ${position}%; background: ${color}"></div>
          <div class="sl-bar-marker" style="left: ${position}%"></div>
        </div>
        <div class="sl-bar-labels">
          <span>10th</span><span>25th</span><span>50th</span><span>75th</span><span>90th</span>
        </div>
      </div>
    `;
  }

  widget.innerHTML = `
    <div class="sl-header">
      <span class="sl-logo">SalaryLens</span>
      <button class="sl-close" aria-label="Close">&times;</button>
    </div>
    ${positionHTML}
    <div class="sl-market-data">
      <div class="sl-row"><span>10th Percentile</span><span>${formatCurrency(marketData.p10)}</span></div>
      <div class="sl-row"><span>25th Percentile</span><span>${formatCurrency(marketData.p25)}</span></div>
      <div class="sl-row sl-row-median"><span>Median (50th)</span><span>${formatCurrency(marketData.p50)}</span></div>
      <div class="sl-row"><span>75th Percentile</span><span>${formatCurrency(marketData.p75)}</span></div>
      <div class="sl-row"><span>90th Percentile</span><span>${formatCurrency(marketData.p90)}</span></div>
    </div>
    <div class="sl-footer">
      <span class="sl-source">Source: ${marketData.source === 'bls' ? 'Bureau of Labor Statistics' : 'CareerOneStop'}</span>
      ${listedSalary ? '<button class="sl-save-btn">Save Offer</button>' : ''}
    </div>
  `;

  // Event listeners
  widget.querySelector('.sl-close').addEventListener('click', () => widget.remove());

  const saveBtn = widget.querySelector('.sl-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const annual = normalizeToAnnual(listedSalary);
      chrome.runtime.sendMessage({
        type: MSG.SAVE_OFFER,
        offer: {
          jobTitle: data.jobTitle,
          company: data.company,
          location: data.location,
          salary: Math.round((annual.min + annual.max) / 2),
          marketData: marketData,
        },
      }).then(() => {
        saveBtn.textContent = 'Saved!';
        saveBtn.disabled = true;
      });
    });
  }

  insertWidget(widget);
}

/**
 * Build error state HTML for the widget.
 * @param {string} error
 * @returns {string}
 */
function buildErrorHTML(error) {
  const messages = {
    daily_limit_reached: 'Daily lookup limit reached (3/day). Upgrade for unlimited lookups.',
    no_data: 'No salary data found for this job title and location.',
    api_error: 'Could not fetch salary data. Please try again later.',
  };
  const msg = messages[error] || error;
  return `
    <div class="sl-header">
      <span class="sl-logo">SalaryLens</span>
      <button class="sl-close" aria-label="Close">&times;</button>
    </div>
    <div class="sl-error">${msg}</div>
  `;
}

/**
 * Insert the widget into the page at a suitable location.
 * @param {HTMLElement} widget
 */
function insertWidget(widget) {
  // Try to insert near the salary or job header section
  const targets = [
    '#salaryInfoAndJobType',
    '.jobsearch-JobMetadataHeader-item',
    '.jobsearch-JobInfoHeader-subtitle',
    '#jobDetailsSection',
  ];
  for (const sel of targets) {
    const target = document.querySelector(sel);
    if (target) {
      target.parentNode.insertBefore(widget, target.nextSibling);
      return;
    }
  }
  // Fallback: insert at top of job description
  const jobDesc = document.getElementById('jobDescriptionText');
  if (jobDesc) {
    jobDesc.parentNode.insertBefore(widget, jobDesc);
    return;
  }
  // Last resort: append to body
  document.body.appendChild(widget);
}

/**
 * Main entry point: detect job details and fetch salary data.
 */
async function init() {
  const jobTitle = extractJobTitle();
  const location = extractLocation();

  if (!jobTitle || !location) return;

  const company = extractCompany();
  const listedSalary = extractListedSalary();

  // Show loading state
  const loadingWidget = document.createElement('div');
  loadingWidget.id = 'salary-lens-widget';
  loadingWidget.innerHTML = `
    <div class="sl-header">
      <span class="sl-logo">SalaryLens</span>
    </div>
    <div class="sl-loading">Loading salary data...</div>
  `;
  insertWidget(loadingWidget);

  try {
    const response = await chrome.runtime.sendMessage({
      type: MSG.FETCH_SALARY,
      jobTitle,
      location,
    });

    if (response.error) {
      injectWidget({ error: response.error });
    } else {
      injectWidget({
        jobTitle,
        company,
        location,
        listedSalary,
        marketData: response,
      });
    }
  } catch (err) {
    injectWidget({ error: 'api_error' });
  }
}

// Run when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Re-run on URL change (Indeed uses client-side navigation)
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(init, 1000);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// Export for testing
export {
  extractJobTitle,
  extractCompany,
  extractLocation,
  extractListedSalary,
  normalizeToAnnual,
  calcMarketPosition,
  formatCurrency,
  getPositionLabel,
  init,
};
