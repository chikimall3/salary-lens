/* SalaryLens — Glassdoor Content Script (classic script, no ES module imports) */
const MSG_FETCH_SALARY = 'FETCH_SALARY';
const MSG_SAVE_OFFER = 'SAVE_OFFER';

function extractJobTitle() {
  const selectors = [
    '[data-test="jobTitle"]',
    'h1.heading_Heading__BqX5J',
    '.JobDetails_jobTitle__Rbnae',
    '.e1tk4kwz5',
    'h1[class*="jobTitle"]',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el.textContent.trim();
  }
  return null;
}

function extractCompany() {
  const selectors = [
    '[data-test="employerName"]',
    '.EmployerProfile_employerName__rZlNt a',
    '.e1tk4kwz1',
    'div[class*="employerName"]',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el.textContent.trim().replace(/\s*\d+(\.\d+)?\s*$/, '');
  }
  return null;
}

function extractLocation() {
  const selectors = [
    '[data-test="location"]',
    '.JobDetails_location__mSg5h',
    '.e1tk4kwz4',
    'div[class*="location"]',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      let text = el.textContent.trim();
      text = text.replace(/^(Remote|Hybrid)\s*[-–—]?\s*/i, '').trim();
      if (text) return text;
    }
  }
  return null;
}

function extractListedSalary() {
  const selectors = [
    '[data-test="detailSalary"]',
    '.SalaryEstimate_salaryRange__brHFy',
    '.e1wijj240',
    'div[class*="salaryEstimate"]',
    'span[class*="SalaryEstimate"]',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const text = el.textContent;
    const match = text.match(/\$[\d,]+(?:\.\d{2})?(?:\s*[-–—]\s*\$[\d,]+(?:\.\d{2})?)?/);
    if (!match) continue;
    const numbers = match[0].match(/[\d,]+(?:\.\d{2})?/g).map(n => parseFloat(n.replace(/,/g, '')));
    const period = /hour|hr/i.test(text) ? 'hourly' : /month/i.test(text) ? 'monthly' : 'annual';
    return { min: numbers[0], max: numbers.length > 1 ? numbers[1] : numbers[0], period };
  }
  return null;
}

/* Shared widget logic — identical to linkedin.js */

function normalizeToAnnual(salary) {
  const m = salary.period === 'hourly' ? 2080 : salary.period === 'monthly' ? 12 : 1;
  return { min: Math.round(salary.min * m), max: Math.round(salary.max * m) };
}

function calcMarketPosition(salary, market) {
  const br = [
    { pct: 10, val: market.p10 }, { pct: 25, val: market.p25 },
    { pct: 50, val: market.p50 }, { pct: 75, val: market.p75 },
    { pct: 90, val: market.p90 },
  ];
  if (salary <= br[0].val) return br[0].pct;
  if (salary >= br[4].val) return br[4].pct;
  for (let i = 0; i < 4; i++) {
    if (salary >= br[i].val && salary <= br[i + 1].val) {
      const range = br[i + 1].val - br[i].val;
      if (range === 0) return br[i].pct;
      return br[i].pct + ((salary - br[i].val) / range) * (br[i + 1].pct - br[i].pct);
    }
  }
  return 50;
}

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

function getPositionLabel(p) {
  if (p < 25) return { label: 'Below Market', color: '#dc3545' };
  if (p < 40) return { label: 'Below Average', color: '#fd7e14' };
  if (p < 60) return { label: 'At Market Rate', color: '#28a745' };
  if (p < 75) return { label: 'Above Average', color: '#17a2b8' };
  return { label: 'Well Above Market', color: '#6f42c1' };
}

function injectWidget(data) {
  const existing = document.getElementById('salary-lens-widget');
  if (existing) existing.remove();
  const widget = document.createElement('div');
  widget.id = 'salary-lens-widget';
  if (data.error) {
    const msgs = { daily_limit_reached: 'Daily lookup limit reached (3/day). Upgrade for unlimited lookups.', no_data: 'No salary data found.', api_error: 'Could not fetch salary data.' };
    widget.innerHTML = `<div class="sl-header"><span class="sl-logo">SalaryLens</span><button class="sl-close" aria-label="Close">&times;</button></div><div class="sl-error">${msgs[data.error] || data.error}</div>`;
    insertWidget(widget);
    widget.querySelector('.sl-close').addEventListener('click', () => widget.remove());
    return;
  }
  const { marketData, listedSalary } = data;
  let posHTML = '';
  if (listedSalary) {
    const ann = normalizeToAnnual(listedSalary);
    const mid = Math.round((ann.min + ann.max) / 2);
    const pos = calcMarketPosition(mid, marketData);
    const { label, color } = getPositionLabel(pos);
    posHTML = `<div class="sl-position"><div class="sl-position-label" style="color:${color}">${label}</div><div class="sl-position-detail">Listed: ${formatCurrency(ann.min)}${ann.min !== ann.max ? ' - ' + formatCurrency(ann.max) : ''} <span class="sl-percentile">(${Math.round(pos)}th percentile)</span></div></div><div class="sl-bar-container"><div class="sl-bar"><div class="sl-bar-fill" style="width:${pos}%;background:${color}"></div><div class="sl-bar-marker" style="left:${pos}%"></div></div><div class="sl-bar-labels"><span>10th</span><span>25th</span><span>50th</span><span>75th</span><span>90th</span></div></div>`;
  }
  widget.innerHTML = `<div class="sl-header"><span class="sl-logo">SalaryLens</span><button class="sl-close" aria-label="Close">&times;</button></div>${posHTML}<div class="sl-market-data"><div class="sl-row"><span>10th Percentile</span><span>${formatCurrency(marketData.p10)}</span></div><div class="sl-row"><span>25th Percentile</span><span>${formatCurrency(marketData.p25)}</span></div><div class="sl-row sl-row-median"><span>Median (50th)</span><span>${formatCurrency(marketData.p50)}</span></div><div class="sl-row"><span>75th Percentile</span><span>${formatCurrency(marketData.p75)}</span></div><div class="sl-row"><span>90th Percentile</span><span>${formatCurrency(marketData.p90)}</span></div></div><div class="sl-footer"><span class="sl-source">Source: ${marketData.source === 'bls' ? 'Bureau of Labor Statistics' : 'CareerOneStop'}</span>${listedSalary ? '<button class="sl-save-btn">Save Offer</button>' : ''}</div>`;
  widget.querySelector('.sl-close').addEventListener('click', () => widget.remove());
  const saveBtn = widget.querySelector('.sl-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const ann = normalizeToAnnual(listedSalary);
      chrome.runtime.sendMessage({ type: MSG_SAVE_OFFER, offer: { jobTitle: data.jobTitle, company: data.company, location: data.location, salary: Math.round((ann.min + ann.max) / 2), marketData } }).then(() => { saveBtn.textContent = 'Saved!'; saveBtn.disabled = true; });
    });
  }
  insertWidget(widget);
}

function insertWidget(widget) {
  const targets = [
    '[data-test="jobHeader"]',
    '.JobDetails_jobDetailsHeader__qKECs',
    '.e1tk4kwz0',
    '#JDCol',
  ];
  for (const sel of targets) {
    const t = document.querySelector(sel);
    if (t) { t.appendChild(widget); return; }
  }
  const main = document.querySelector('[data-test="job-detail"]') || document.querySelector('main') || document.body;
  main.prepend(widget);
}

async function init() {
  const jobTitle = extractJobTitle();
  const location = extractLocation();
  if (!jobTitle || !location) return;
  const company = extractCompany();
  const listedSalary = extractListedSalary();
  const loadingWidget = document.createElement('div');
  loadingWidget.id = 'salary-lens-widget';
  loadingWidget.innerHTML = '<div class="sl-header"><span class="sl-logo">SalaryLens</span></div><div class="sl-loading">Loading salary data...</div>';
  insertWidget(loadingWidget);
  try {
    const response = await chrome.runtime.sendMessage({ type: MSG_FETCH_SALARY, jobTitle, location });
    if (response.error) { injectWidget({ error: response.error }); }
    else { injectWidget({ jobTitle, company, location, listedSalary, marketData: response }); }
  } catch (err) { injectWidget({ error: 'api_error' }); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) { lastUrl = window.location.href; setTimeout(init, 1500); }
});
observer.observe(document.body, { childList: true, subtree: true });
