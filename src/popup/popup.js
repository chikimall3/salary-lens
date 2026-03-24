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
 * Load and display remaining daily lookups.
 */
async function loadStatus() {
  const stored = await chrome.storage.local.get([STORAGE.LOOKUP_COUNT, STORAGE.LOOKUP_DATE]);
  const today = new Date().toISOString().slice(0, 10);
  const count = stored[STORAGE.LOOKUP_DATE] === today ? (stored[STORAGE.LOOKUP_COUNT] ?? 0) : 0;
  const remaining = FREE_TIER.MAX_LOOKUPS_PER_DAY - count;

  document.getElementById('lookups-remaining').textContent =
    `${remaining}/${FREE_TIER.MAX_LOOKUPS_PER_DAY}`;
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

  // Attach delete handlers
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
});
