import { MSG, STORAGE, FREE_TIER } from '../shared/constants.js';

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

  list.innerHTML = offers.map((offer) => `
    <div class="offer-card" data-id="${offer.id}">
      <div class="offer-card-header">
        <div>
          <div class="offer-title">${escapeHtml(offer.jobTitle || 'Untitled')}</div>
          <div class="offer-company">${escapeHtml(offer.company || '')} ${escapeHtml(offer.location || '')}</div>
        </div>
        <div class="offer-salary">${offer.salary ? formatCurrency(offer.salary) : '--'}</div>
      </div>
      <div class="offer-meta">
        <span>${offer.marketData?.p50 ? 'Median: ' + formatCurrency(offer.marketData.p50) : ''}</span>
        <button class="offer-delete" data-id="${offer.id}">Remove</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.offer-delete').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const offerId = e.target.dataset.id;
      await chrome.runtime.sendMessage({ type: MSG.DELETE_OFFER, offerId });
      loadOffers();
    });
  });
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
});
