/**
 * Cross-tests for src/content/indeed.js
 * Environment: jsdom (Jest)
 */

// ---------------------------------------------------------------------------
// Chrome API stub — must be set up before importing the module
// ---------------------------------------------------------------------------
globalThis.chrome = {
  runtime: {
    sendMessage: () => Promise.resolve({}),
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reset the document body and inject arbitrary HTML.
 * @param {string} html
 */
function setHTML(html) {
  document.body.innerHTML = html;
}

function clearDOM() {
  document.body.innerHTML = '';
}

// ---------------------------------------------------------------------------
// Module import (dynamic — ES module with side-effects we need to suppress)
// ---------------------------------------------------------------------------

let extractJobTitle,
  extractCompany,
  extractLocation,
  extractListedSalary,
  normalizeToAnnual,
  calcMarketPosition,
  formatCurrency,
  getPositionLabel;

beforeAll(async () => {
  // The module runs init() as a side-effect. We suppress chrome.runtime.sendMessage
  // and the MutationObserver so the import doesn't throw.
  globalThis.MutationObserver = class {
    observe() {}
    disconnect() {}
  };

  const mod = await import('../src/content/indeed.js');
  extractJobTitle = mod.extractJobTitle;
  extractCompany = mod.extractCompany;
  extractLocation = mod.extractLocation;
  extractListedSalary = mod.extractListedSalary;
  normalizeToAnnual = mod.normalizeToAnnual;
  calcMarketPosition = mod.calcMarketPosition;
  formatCurrency = mod.formatCurrency;
  getPositionLabel = mod.getPositionLabel;
});

beforeEach(() => {
  clearDOM();
});

// ===========================================================================
// 1. extractJobTitle()
// ===========================================================================
describe('extractJobTitle()', () => {
  test('returns title from h1.jobsearch-JobInfoHeader-title (selector 1)', () => {
    setHTML('<h1 class="jobsearch-JobInfoHeader-title">Senior Software Engineer</h1>');
    expect(extractJobTitle()).toBe('Senior Software Engineer');
  });

  test('returns title from [data-testid="jobsearch-JobInfoHeader-title"] (selector 2)', () => {
    setHTML('<h1 data-testid="jobsearch-JobInfoHeader-title">Product Manager</h1>');
    expect(extractJobTitle()).toBe('Product Manager');
  });

  test('returns title from h1.icl-u-xs-mb--xs (selector 3)', () => {
    setHTML('<h1 class="icl-u-xs-mb--xs">Data Analyst</h1>');
    expect(extractJobTitle()).toBe('Data Analyst');
  });

  test('returns title from .jobsearch-JobInfoHeader-title-container h1 (selector 4)', () => {
    setHTML('<div class="jobsearch-JobInfoHeader-title-container"><h1>DevOps Engineer</h1></div>');
    expect(extractJobTitle()).toBe('DevOps Engineer');
  });

  test('returns title from h1[class*="JobTitle"] (selector 5)', () => {
    setHTML('<h1 class="myJobTitle-xyz">UX Designer</h1>');
    expect(extractJobTitle()).toBe('UX Designer');
  });

  test('trims whitespace around the job title', () => {
    setHTML('<h1 class="jobsearch-JobInfoHeader-title">  Marketing Manager  </h1>');
    expect(extractJobTitle()).toBe('Marketing Manager');
  });

  test('returns null when no matching element exists', () => {
    setHTML('<div>No job title here</div>');
    expect(extractJobTitle()).toBeNull();
  });
});

// ===========================================================================
// 2. extractCompany()
// ===========================================================================
describe('extractCompany()', () => {
  test('returns company from [data-testid="inlineHeader-companyName"] (selector 1)', () => {
    setHTML('<div data-testid="inlineHeader-companyName">Acme Corp</div>');
    expect(extractCompany()).toBe('Acme Corp');
  });

  test('returns company from [data-company-name="true"] (selector 2)', () => {
    setHTML('<span data-company-name="true">TechStart Inc</span>');
    expect(extractCompany()).toBe('TechStart Inc');
  });

  test('returns company from .jobsearch-InlineCompanyRating-companyHeader a (selector 3)', () => {
    setHTML('<div class="jobsearch-InlineCompanyRating-companyHeader"><a>Big Corp</a></div>');
    expect(extractCompany()).toBe('Big Corp');
  });

  test('returns company from .icl-u-lg-mr--sm a (selector 4)', () => {
    setHTML('<div class="icl-u-lg-mr--sm"><a>Startup LLC</a></div>');
    expect(extractCompany()).toBe('Startup LLC');
  });

  test('returns company from div[class*="CompanyName"] a (selector 5)', () => {
    setHTML('<div class="someCompanyName-abc"><a>Global Industries</a></div>');
    expect(extractCompany()).toBe('Global Industries');
  });

  test('trims whitespace around company name', () => {
    setHTML('<div data-testid="inlineHeader-companyName">  Trimmed Co  </div>');
    expect(extractCompany()).toBe('Trimmed Co');
  });

  test('returns null when no matching element exists', () => {
    setHTML('<div>Nothing here</div>');
    expect(extractCompany()).toBeNull();
  });
});

// ===========================================================================
// 3. extractLocation()
// ===========================================================================
describe('extractLocation()', () => {
  test('returns location from [data-testid="inlineHeader-companyLocation"] (selector 1)', () => {
    setHTML('<div data-testid="inlineHeader-companyLocation">Austin, TX</div>');
    expect(extractLocation()).toBe('Austin, TX');
  });

  test('returns location from [data-testid="job-location"] (selector 2)', () => {
    setHTML('<span data-testid="job-location">Seattle, WA</span>');
    expect(extractLocation()).toBe('Seattle, WA');
  });

  test('strips "Remote" prefix (dash separator)', () => {
    setHTML('<div data-testid="inlineHeader-companyLocation">Remote - New York, NY</div>');
    expect(extractLocation()).toBe('New York, NY');
  });

  test('strips "Remote" prefix (em-dash separator)', () => {
    setHTML('<div data-testid="inlineHeader-companyLocation">Remote — Chicago, IL</div>');
    expect(extractLocation()).toBe('Chicago, IL');
  });

  test('strips "Remote" with no separator (standalone word)', () => {
    setHTML('<div data-testid="inlineHeader-companyLocation">Remote Denver, CO</div>');
    expect(extractLocation()).toBe('Denver, CO');
  });

  test('strips "Hybrid" prefix', () => {
    setHTML('<div data-testid="inlineHeader-companyLocation">Hybrid - Boston, MA</div>');
    expect(extractLocation()).toBe('Boston, MA');
  });

  test('strips prefix case-insensitively', () => {
    setHTML('<div data-testid="inlineHeader-companyLocation">REMOTE - Dallas, TX</div>');
    expect(extractLocation()).toBe('Dallas, TX');
  });

  test('returns plain location without any prefix unchanged', () => {
    setHTML('<div data-testid="inlineHeader-companyLocation">San Francisco, CA</div>');
    expect(extractLocation()).toBe('San Francisco, CA');
  });

  test('returns null when no matching element exists', () => {
    setHTML('<div>No location</div>');
    expect(extractLocation()).toBeNull();
  });
});

// ===========================================================================
// 4. extractListedSalary()
// ===========================================================================
describe('extractListedSalary()', () => {
  test('parses annual salary range "$80,000 - $100,000 a year"', () => {
    setHTML('<div id="salaryInfoAndJobType">$80,000 - $100,000 a year</div>');
    const result = extractListedSalary();
    expect(result).toEqual({ min: 80000, max: 100000, period: 'annual' });
  });

  test('parses hourly salary range "$25.00 - $35.00 an hour"', () => {
    setHTML('<div id="salaryInfoAndJobType">$25.00 - $35.00 an hour</div>');
    const result = extractListedSalary();
    expect(result).toEqual({ min: 25, max: 35, period: 'hourly' });
  });

  test('parses single annual salary with no range "$90,000 a year"', () => {
    setHTML('<div id="salaryInfoAndJobType">$90,000 a year</div>');
    const result = extractListedSalary();
    expect(result).toEqual({ min: 90000, max: 90000, period: 'annual' });
  });

  test('parses monthly salary "$6,000 a month"', () => {
    setHTML('<div id="salaryInfoAndJobType">$6,000 a month</div>');
    const result = extractListedSalary();
    expect(result).toEqual({ min: 6000, max: 6000, period: 'monthly' });
  });

  test('parses salary from [data-testid="attribute_snippet_testid"] selector', () => {
    setHTML('<span data-testid="attribute_snippet_testid">$50,000 - $70,000 a year</span>');
    const result = extractListedSalary();
    expect(result).toEqual({ min: 50000, max: 70000, period: 'annual' });
  });

  test('parses salary from .jobsearch-JobMetadataHeader-item selector', () => {
    setHTML('<div class="jobsearch-JobMetadataHeader-item">$120,000 - $150,000 a year</div>');
    const result = extractListedSalary();
    expect(result).toEqual({ min: 120000, max: 150000, period: 'annual' });
  });

  test('parses salary from span[class*="SalarySnippet"] selector', () => {
    setHTML('<span class="mySalarySnippet-abc">$18.00 - $22.00 an hour</span>');
    const result = extractListedSalary();
    expect(result).toEqual({ min: 18, max: 22, period: 'hourly' });
  });

  test('returns null when no salary element exists', () => {
    setHTML('<div>No salary info here</div>');
    expect(extractListedSalary()).toBeNull();
  });

  test('returns null when salary element exists but contains no dollar amount', () => {
    setHTML('<div id="salaryInfoAndJobType">Full-time, Permanent</div>');
    expect(extractListedSalary()).toBeNull();
  });
});

// ===========================================================================
// 5. normalizeToAnnual()
// ===========================================================================
describe('normalizeToAnnual()', () => {
  test('converts hourly to annual (× 2080)', () => {
    const result = normalizeToAnnual({ min: 25, max: 35, period: 'hourly' });
    expect(result).toEqual({ min: 52000, max: 72800 });
  });

  test('converts monthly to annual (× 12)', () => {
    const result = normalizeToAnnual({ min: 5000, max: 6000, period: 'monthly' });
    expect(result).toEqual({ min: 60000, max: 72000 });
  });

  test('passes annual through unchanged (multiplier = 1)', () => {
    const result = normalizeToAnnual({ min: 80000, max: 100000, period: 'annual' });
    expect(result).toEqual({ min: 80000, max: 100000 });
  });

  test('rounds fractional hourly values correctly', () => {
    // $15.50/hr × 2080 = 32,240
    const result = normalizeToAnnual({ min: 15.5, max: 15.5, period: 'hourly' });
    expect(result).toEqual({ min: 32240, max: 32240 });
  });

  test('handles single-value range (min === max) for monthly', () => {
    const result = normalizeToAnnual({ min: 7000, max: 7000, period: 'monthly' });
    expect(result).toEqual({ min: 84000, max: 84000 });
  });
});

// ===========================================================================
// 6. calcMarketPosition()
// ===========================================================================
describe('calcMarketPosition()', () => {
  const market = { p10: 40000, p25: 60000, p50: 80000, p75: 100000, p90: 120000 };

  test('returns p10 (10) when salary is below p10', () => {
    expect(calcMarketPosition(30000, market)).toBe(10);
  });

  test('returns p10 (10) when salary equals p10 exactly', () => {
    expect(calcMarketPosition(40000, market)).toBe(10);
  });

  test('returns p90 (90) when salary is above p90', () => {
    expect(calcMarketPosition(130000, market)).toBe(90);
  });

  test('returns p90 (90) when salary equals p90 exactly', () => {
    expect(calcMarketPosition(120000, market)).toBe(90);
  });

  test('returns 50 when salary equals p50 exactly (midpoint interpolation)', () => {
    expect(calcMarketPosition(80000, market)).toBe(50);
  });

  test('interpolates correctly between p10 and p25', () => {
    // midpoint between 40k and 60k → salary 50k → 50% through [10..25] = 17.5
    expect(calcMarketPosition(50000, market)).toBe(17.5);
  });

  test('interpolates correctly between p25 and p50', () => {
    // salary 70k → midpoint between 60k..80k → 50% through [25..50] = 37.5
    expect(calcMarketPosition(70000, market)).toBe(37.5);
  });

  test('interpolates correctly between p50 and p75', () => {
    // salary 90k → midpoint between 80k..100k → 50% through [50..75] = 62.5
    expect(calcMarketPosition(90000, market)).toBe(62.5);
  });

  test('interpolates correctly between p75 and p90', () => {
    // salary 110k → midpoint between 100k..120k → 50% through [75..90] = 82.5
    expect(calcMarketPosition(110000, market)).toBe(82.5);
  });
});

// ===========================================================================
// 7. formatCurrency()
// ===========================================================================
describe('formatCurrency()', () => {
  test('formats whole dollar amount with $ sign and commas', () => {
    expect(formatCurrency(80000)).toBe('$80,000');
  });

  test('formats a small amount correctly', () => {
    expect(formatCurrency(500)).toBe('$500');
  });

  test('formats a large amount correctly', () => {
    expect(formatCurrency(150000)).toBe('$150,000');
  });

  test('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  test('rounds fractional cents (maximumFractionDigits: 0)', () => {
    // 99999.99 should round to $100,000
    expect(formatCurrency(99999.99)).toBe('$100,000');
  });
});

// ===========================================================================
// 8. getPositionLabel()
// ===========================================================================
describe('getPositionLabel()', () => {
  test('returns "Below Market" with red color for position < 25', () => {
    expect(getPositionLabel(10)).toEqual({ label: 'Below Market', color: '#dc3545' });
  });

  test('returns "Below Market" at position 0', () => {
    expect(getPositionLabel(0)).toEqual({ label: 'Below Market', color: '#dc3545' });
  });

  test('returns "Below Market" at position 24.9 (boundary)', () => {
    expect(getPositionLabel(24.9)).toEqual({ label: 'Below Market', color: '#dc3545' });
  });

  test('returns "Below Average" with orange color for position in [25, 40)', () => {
    expect(getPositionLabel(30)).toEqual({ label: 'Below Average', color: '#fd7e14' });
  });

  test('returns "Below Average" at position 25 exactly (boundary)', () => {
    expect(getPositionLabel(25)).toEqual({ label: 'Below Average', color: '#fd7e14' });
  });

  test('returns "At Market Rate" with green color for position in [40, 60)', () => {
    expect(getPositionLabel(50)).toEqual({ label: 'At Market Rate', color: '#28a745' });
  });

  test('returns "At Market Rate" at position 40 exactly (boundary)', () => {
    expect(getPositionLabel(40)).toEqual({ label: 'At Market Rate', color: '#28a745' });
  });

  test('returns "Above Average" with teal color for position in [60, 75)', () => {
    expect(getPositionLabel(65)).toEqual({ label: 'Above Average', color: '#17a2b8' });
  });

  test('returns "Above Average" at position 60 exactly (boundary)', () => {
    expect(getPositionLabel(60)).toEqual({ label: 'Above Average', color: '#17a2b8' });
  });

  test('returns "Well Above Market" with purple color for position >= 75', () => {
    expect(getPositionLabel(75)).toEqual({ label: 'Well Above Market', color: '#6f42c1' });
  });

  test('returns "Well Above Market" at position 100', () => {
    expect(getPositionLabel(100)).toEqual({ label: 'Well Above Market', color: '#6f42c1' });
  });
});
