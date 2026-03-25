import { MSG, STORAGE, FREE_TIER } from '../shared/constants.js';
import { renderTCCalculator, initTCCalculator } from './tc-calculator.js';

/**
 * Format number as USD currency.
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
 * Load and display user plan status and remaining lookups.
 */
async function loadStatus() {
  const upgradeBtn = document.getElementById('upgrade-btn');
  const planLabel = document.getElementById('plan-label');
  const lookupsRow = document.getElementById('lookups-row');
  const lookupsRemaining = document.getElementById('lookups-remaining');

  // Check Pro status
  let isPro = false;
  try {
    const user = await chrome.runtime.sendMessage({ type: MSG.GET_USER_STATUS });
    isPro = user.paid === true;
  } catch (_) { /* ExtPay unavailable */ }

  if (isPro) {
    planLabel.textContent = 'Pro';
    planLabel.style.color = '#28a745';
    lookupsRemaining.textContent = 'Unlimited';
    upgradeBtn.style.display = 'none';
  } else {
    planLabel.textContent = 'Free';
    const stored = await chrome.storage.local.get([STORAGE.LOOKUP_COUNT, STORAGE.LOOKUP_DATE]);
    const today = new Date().toISOString().slice(0, 10);
    const count = stored[STORAGE.LOOKUP_DATE] === today ? (stored[STORAGE.LOOKUP_COUNT] ?? 0) : 0;
    const remaining = FREE_TIER.MAX_LOOKUPS_PER_DAY - count;
    lookupsRemaining.textContent = `${remaining}/${FREE_TIER.MAX_LOOKUPS_PER_DAY}`;
    upgradeBtn.style.display = 'block';
  }
}

/**
 * Load and display saved offers.
 */
async function loadOffers() {
  const response = await chrome.runtime.sendMessage({ type: MSG.GET_OFFERS });
  const offers = response?.offers ?? [];

  document.getElementById('offer-count').textContent = offers.length;
  const list = document.getElementById('offers-list');

  if (offers.length === 0) {
    list.innerHTML = '<p class="empty-state">No saved offers yet. Visit an Indeed job page to start.</p>';
    return;
  }

  function positionLabel(salary, md) {
    if (!md?.p50 || !salary) return '';
    const pct = salary < md.p10 ? 10 : salary > md.p90 ? 90 :
      [{ p: 10, v: md.p10 }, { p: 25, v: md.p25 }, { p: 50, v: md.p50 }, { p: 75, v: md.p75 }, { p: 90, v: md.p90 }]
        .reduce((a, b) => Math.abs(b.v - salary) < Math.abs(a.v - salary) ? b : a).p;
    const colors = { 10: '#dc3545', 25: '#fd7e14', 50: '#28a745', 75: '#17a2b8', 90: '#6f42c1' };
    return `<span class="offer-position" style="color:${colors[pct] || '#6f6f6f'}">${pct}th pctl</span>`;
  }

  list.innerHTML = offers.map((offer) => `
    <div class="offer-card" data-id="${offer.id}">
      <div class="offer-card-header">
        <div>
          <div class="offer-title">${escapeHtml(offer.jobTitle || 'Untitled')}</div>
          <div class="offer-company">${escapeHtml(offer.company || '')} ${escapeHtml(offer.location || '')}</div>
        </div>
        <div>
          <div class="offer-salary">${offer.salary ? formatCurrency(offer.salary) : '--'}</div>
          ${positionLabel(offer.salary, offer.marketData)}
        </div>
      </div>
      <div class="offer-meta">
        <span>${offer.marketData?.p50 ? 'Median: ' + formatCurrency(offer.marketData.p50) : ''}${offer.marketData?.area ? ' (' + escapeHtml(offer.marketData.area) + ')' : ''}</span>
        <button class="offer-delete" data-id="${offer.id}">Remove</button>
      </div>
    </div>
  `).join('');

  // Export button (only show when there are offers)
  if (!document.getElementById('export-btn')) {
    const exportBtn = document.createElement('button');
    exportBtn.id = 'export-btn';
    exportBtn.className = 'export-btn';
    exportBtn.textContent = 'Export CSV';
    exportBtn.addEventListener('click', () => exportCSV(offers));
    list.parentNode.querySelector('h2').appendChild(exportBtn);
  }

  list.querySelectorAll('.offer-delete').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const offerId = e.target.dataset.id;
      await chrome.runtime.sendMessage({ type: MSG.DELETE_OFFER, offerId });
      loadOffers();
    });
  });
}

/**
 * Export saved offers as CSV.
 * @param {Object[]} offers
 */
function exportCSV(offers) {
  const headers = ['Job Title', 'Company', 'Location', 'Salary', 'Median', '10th Pctl', '25th Pctl', '75th Pctl', '90th Pctl', 'Area', 'Saved At'];
  const rows = offers.map(o => [
    o.jobTitle || '', o.company || '', o.location || '',
    o.salary || '', o.marketData?.p50 || '',
    o.marketData?.p10 || '', o.marketData?.p25 || '',
    o.marketData?.p75 || '', o.marketData?.p90 || '',
    o.marketData?.area || '', o.savedAt || '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `salarylens-offers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Escape HTML to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadStatus();
  loadOffers();

  document.getElementById('options-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('upgrade-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: MSG.OPEN_PAYMENT_PAGE });
  });

  // TC Calculator
  document.getElementById('tc-section').innerHTML = renderTCCalculator();
  initTCCalculator();
});
