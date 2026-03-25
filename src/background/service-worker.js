/**
 * SalaryLens — Background Service Worker (Manifest V3)
 *
 * Responsibilities:
 *  - Handle messages from content scripts and popup
 *  - Fetch salary data from BLS OEWS API (with CareerOneStop fallback)
 *  - Enforce free-tier daily lookup limits
 *  - Manage saved offers in chrome.storage.local
 */

import { MSG, STORAGE, FREE_TIER, API } from '../shared/constants.js';
import { resolveSoc } from '../shared/soc-codes.js';
import { resolveMsa, buildAreaSeriesId } from '../shared/msa-codes.js';
import { getRPP, adjustSalary, costLevel } from '../shared/col-index.js';
import ExtPay from '../shared/ExtPay.module.js';

const extpay = ExtPay('salary-lens');
extpay.startBackground();

// ---------------------------------------------------------------------------
// BLS Series ID helpers
// ---------------------------------------------------------------------------

/**
 * BLS OEWS data type codes for wage percentiles.
 * @see https://www.bls.gov/oes/oes_ques.htm
 */
const BLS_DATA_TYPES = {
  p10: '11',
  p25: '12',
  p50: '13',
  p75: '14',
  p90: '15',
};

/**
 * Build a BLS OEWS series ID for national data.
 *
 * Format: OEUN{areaCode}{industryCode}{socCode}{dataType}
 *   N           = National area type
 *   areaCode    = 0000000  (national)
 *   industryCode= 000000   (cross-industry)
 *
 * @param {string} socCode  - 6-digit SOC code (no hyphen, e.g. "151252")
 * @param {string} dataType - 2-digit data type code (11-15 for annual percentiles)
 * @returns {string} BLS series ID
 */
function buildBlsSeriesId(socCode, dataType) {
  return `OEUN0000000000000${socCode}${dataType}`;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/**
 * Return today's date string in YYYY-MM-DD format (local time).
 * @returns {string}
 */
function todayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Convert a BLS annual-wage string to a rounded integer, or null if unparseable.
 * BLS returns "-" or "#" for suppressed/missing data.
 *
 * @param {string|number} raw
 * @returns {number|null}
 */
function parseWage(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

// ---------------------------------------------------------------------------
// BLS Response Cache
// ---------------------------------------------------------------------------

const CACHE_KEY = 'salary_lens_bls_cache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (BLS OEWS data updates annually)

/**
 * Get cached BLS response for a SOC+area combination.
 * @param {string} cacheId - Unique key (e.g. "151252|0012420|metro")
 * @returns {Promise<Object|null>} Cached data or null if miss/expired
 */
async function getCachedResult(cacheId) {
  const stored = await chrome.storage.local.get(CACHE_KEY);
  const cache = stored[CACHE_KEY] ?? {};
  const entry = cache[cacheId];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
  return entry.data;
}

/**
 * Store BLS response in cache.
 * @param {string} cacheId
 * @param {Object} data
 */
async function setCachedResult(cacheId, data) {
  const stored = await chrome.storage.local.get(CACHE_KEY);
  const cache = stored[CACHE_KEY] ?? {};
  // Limit cache size to 200 entries to avoid storage bloat
  const keys = Object.keys(cache);
  if (keys.length >= 200) {
    // Remove oldest entry
    let oldest = keys[0];
    for (const k of keys) {
      if (cache[k].timestamp < cache[oldest].timestamp) oldest = k;
    }
    delete cache[oldest];
  }
  cache[cacheId] = { data, timestamp: Date.now() };
  await chrome.storage.local.set({ [CACHE_KEY]: cache });
}

// ---------------------------------------------------------------------------
// Rate-limit helpers
// ---------------------------------------------------------------------------

/**
 * Check whether the user is within the free-tier daily lookup limit.
 * Resets the counter automatically when the date rolls over.
 *
 * @returns {Promise<{ allowed: boolean, remaining: number }>}
 */
async function checkRateLimit() {
  const today = todayString();
  const stored = await chrome.storage.local.get([
    STORAGE.LOOKUP_COUNT,
    STORAGE.LOOKUP_DATE,
  ]);

  const storedDate  = stored[STORAGE.LOOKUP_DATE]  ?? null;
  const storedCount = stored[STORAGE.LOOKUP_COUNT] ?? 0;

  // Reset on new calendar day
  const count = storedDate === today ? storedCount : 0;
  const remaining = FREE_TIER.MAX_LOOKUPS_PER_DAY - count;

  return { allowed: remaining > 0, remaining: Math.max(remaining, 0) };
}

/**
 * Increment the daily lookup counter, resetting if the date has changed.
 *
 * @returns {Promise<void>}
 */
async function incrementLookupCount() {
  const today = todayString();
  const stored = await chrome.storage.local.get([
    STORAGE.LOOKUP_COUNT,
    STORAGE.LOOKUP_DATE,
  ]);

  const storedDate  = stored[STORAGE.LOOKUP_DATE]  ?? null;
  const storedCount = stored[STORAGE.LOOKUP_COUNT] ?? 0;
  const newCount    = storedDate === today ? storedCount + 1 : 1;

  await chrome.storage.local.set({
    [STORAGE.LOOKUP_COUNT]: newCount,
    [STORAGE.LOOKUP_DATE]:  today,
  });
}

// ---------------------------------------------------------------------------
// BLS API
// ---------------------------------------------------------------------------

/**
 * Fetch wage percentile data for a SOC code from the BLS Public API v2.
 *
 * Makes parallel requests for all five percentile series IDs and assembles
 * the result into a normalized percentile object.
 *
 * @param {string} socCode    - 6-digit SOC code
 * @param {string} occupation - Human-readable occupation label (for result)
 * @returns {Promise<{ p10: number|null, p25: number|null, p50: number|null, p75: number|null, p90: number|null, source: 'bls', occupation: string, area: string }|null>}
 *          Returns null on network/parse failure.
 */
async function fetchFromBls(socCode, occupation, msaResult) {
  // Build series IDs using area-aware builder if available, else national fallback
  const buildId = msaResult
    ? (dt) => buildAreaSeriesId(msaResult, socCode, dt)
    : (dt) => buildBlsSeriesId(socCode, dt);

  const seriesIds = Object.entries(BLS_DATA_TYPES).map(([, dataType]) =>
    buildId(dataType)
  );

  // Load BLS API key from settings if available (increases daily limit from 25 to 500)
  const stored = await chrome.storage.local.get(STORAGE.SETTINGS);
  const blsApiKey = stored[STORAGE.SETTINGS]?.blsApiKey;

  const bodyObj = { seriesid: seriesIds, latest: true };
  if (blsApiKey) bodyObj.registrationkey = blsApiKey;

  const body = JSON.stringify(bodyObj);

  let response;
  try {
    response = await fetch(API.BLS_BASE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch (networkErr) {
    console.warn('[SalaryLens] BLS network error:', networkErr.message);
    return null;
  }

  if (!response.ok) {
    console.warn('[SalaryLens] BLS HTTP error:', response.status);
    return null;
  }

  let json;
  try {
    json = await response.json();
  } catch (parseErr) {
    console.warn('[SalaryLens] BLS JSON parse error:', parseErr.message);
    return null;
  }

  if (json.status !== 'REQUEST_SUCCEEDED' || !Array.isArray(json.Results?.series)) {
    console.warn('[SalaryLens] BLS API error:', json.message ?? json.status);
    return null;
  }

  // Build a map: seriesId → latest annual wage value
  /** @type {Map<string, number|null>} */
  const valueBySeriesId = new Map();
  for (const series of json.Results.series) {
    const latest = series.data?.[0];
    valueBySeriesId.set(series.seriesID, parseWage(latest?.value));
  }

  const result = {
    source:     'bls',
    occupation,
    area:       msaResult?.msaName ?? 'National (US)',
    areaType:   msaResult?.areaType ?? 'national',
    p10: valueBySeriesId.get(buildId(BLS_DATA_TYPES.p10)) ?? null,
    p25: valueBySeriesId.get(buildId(BLS_DATA_TYPES.p25)) ?? null,
    p50: valueBySeriesId.get(buildId(BLS_DATA_TYPES.p50)) ?? null,
    p75: valueBySeriesId.get(buildId(BLS_DATA_TYPES.p75)) ?? null,
    p90: valueBySeriesId.get(buildId(BLS_DATA_TYPES.p90)) ?? null,
  };

  // Require at least the median to consider the response valid
  if (result.p50 === null) {
    console.warn('[SalaryLens] BLS returned no median wage for SOC', socCode);
    return null;
  }

  return result;
}

// ---------------------------------------------------------------------------
// CareerOneStop API (fallback)
// ---------------------------------------------------------------------------

/**
 * Fetch wage percentile data from CareerOneStop as a fallback.
 *
 * Uses the /occupation/{keyword}/{location} endpoint.  The API token must be
 * stored in chrome.storage.local under the SETTINGS key as
 * `{ careerOneStopToken: string, careerOneStopUserId: string }`.
 *
 * @param {string} socCode    - 6-digit SOC code (formatted as "XX-XXXX")
 * @param {string} occupation - Human-readable occupation label
 * @param {string} location   - Location string from the job page (e.g. "Austin, TX")
 * @returns {Promise<{ p10: number|null, p25: number|null, p50: number|null, p75: number|null, p90: number|null, source: 'careeronestop', occupation: string, area: string }|null>}
 */
async function fetchFromCareerOneStop(socCode, occupation, location) {
  // Load API credentials from settings
  const stored = await chrome.storage.local.get(STORAGE.SETTINGS);
  const settings = stored[STORAGE.SETTINGS] ?? {};
  const { careerOneStopToken, careerOneStopUserId } = settings;

  if (!careerOneStopToken || !careerOneStopUserId) {
    console.warn('[SalaryLens] CareerOneStop credentials not configured.');
    return null;
  }

  // Format SOC code as "XX-XXXX" for the API
  const formattedSoc = socCode.length === 6
    ? `${socCode.slice(0, 2)}-${socCode.slice(2)}`
    : socCode;

  // Use the state abbreviation extracted from location, or default to "US"
  const stateMatch = location?.match(/,\s*([A-Z]{2})\s*$/);
  const stateCode  = stateMatch ? stateMatch[1] : 'US';

  const url = `${API.CAREER_ONE_STOP_BASE}${encodeURIComponent(careerOneStopUserId)}/${encodeURIComponent(formattedSoc)}/${encodeURIComponent(stateCode)}?training=0&videos=0&tasks=0&dwas=0&wages=1&alternateOccupationTitles=0&outlook=0&skills=0&knowledge=0&ability=0&interests=0&tools_technology=0&keyword=${encodeURIComponent(occupation)}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${careerOneStopToken}`,
        'Content-Type':  'application/json',
      },
    });
  } catch (networkErr) {
    console.warn('[SalaryLens] CareerOneStop network error:', networkErr.message);
    return null;
  }

  if (!response.ok) {
    console.warn('[SalaryLens] CareerOneStop HTTP error:', response.status);
    return null;
  }

  let json;
  try {
    json = await response.json();
  } catch (parseErr) {
    console.warn('[SalaryLens] CareerOneStop JSON parse error:', parseErr.message);
    return null;
  }

  // CareerOneStop returns wages inside OccupationDetail[0].Wages.StateArea[0].Wages
  const wages = json?.OccupationDetail?.[0]?.Wages?.StateArea?.[0]?.Wages;
  if (!Array.isArray(wages) || wages.length === 0) {
    console.warn('[SalaryLens] CareerOneStop returned no wage data.');
    return null;
  }

  /**
   * Helper: find annual wage for a given percentile label in the wages array.
   * CareerOneStop uses labels like "Pct10", "Pct25", "Median", "Pct75", "Pct90".
   * @param {string} label
   * @returns {number|null}
   */
  const findWage = (label) => {
    const entry = wages.find((w) => w.WageLevel === label);
    if (!entry) return null;
    // Prefer Annual; fall back to Hourly * 2080
    const annual = parseWage(entry.Annual);
    if (annual !== null) return annual;
    const hourly = parseWage(entry.Hourly);
    return hourly !== null ? Math.round(hourly * 2080) : null;
  };

  const result = {
    source:     'careeronestop',
    occupation,
    area:       stateCode === 'US' ? 'National (US)' : stateCode,
    p10: findWage('Pct10'),
    p25: findWage('Pct25'),
    p50: findWage('Median'),
    p75: findWage('Pct75'),
    p90: findWage('Pct90'),
  };

  if (result.p50 === null) {
    console.warn('[SalaryLens] CareerOneStop returned no median wage.');
    return null;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Cost of Living enrichment
// ---------------------------------------------------------------------------

/**
 * Enrich salary data with cost-of-living information.
 * @param {Object} data - Salary percentile data
 * @param {string} location - Location string from job listing
 * @returns {Object} Enriched data with col field
 */
function enrichWithCOL(data, location) {
  // Parse city/state from location string
  const match = location?.match(/([^,]+),\s*([A-Z]{2})/i);
  const city = match?.[1]?.trim() ?? '';
  const state = match?.[2]?.trim() ?? '';

  const { rpp, source: colSource } = getRPP(city, state);
  data.col = {
    rpp,
    source: colSource,
    level: costLevel(rpp),
    nationalEquivalent: data.p50 ? adjustSalary(data.p50, rpp, 100) : null,
  };
  return data;
}

// ---------------------------------------------------------------------------
// Main salary fetch orchestrator
// ---------------------------------------------------------------------------

/**
 * Fetch salary percentile data for a job title and location.
 *
 * Strategy:
 *  1. Resolve job title → SOC code
 *  2. Try BLS OEWS (national data, always available without auth)
 *  3. On BLS failure, try CareerOneStop (requires stored credentials)
 *  4. On both failures, return a structured error object
 *
 * @param {string} jobTitle  - Job title extracted from the job listing page
 * @param {string} location  - Location string extracted from the job listing page
 * @returns {Promise<{
 *   p10: number|null,
 *   p25: number|null,
 *   p50: number|null,
 *   p75: number|null,
 *   p90: number|null,
 *   source: 'bls'|'careeronestop',
 *   occupation: string,
 *   area: string
 * }|{ error: string }>}
 */
async function fetchSalaryData(jobTitle, location) {
  if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim() === '') {
    return { error: 'Job title is required to look up salary data.' };
  }

  const { socCode, occupation } = resolveSoc(jobTitle);
  const msaResult = resolveMsa(location);

  // --- Check cache first ---
  const cacheId = `${socCode}|${msaResult.msaCode}|${msaResult.areaType}`;
  const cached = await getCachedResult(cacheId);
  if (cached) {
    console.log('[SalaryLens] Cache hit:', cacheId);
    return enrichWithCOL(cached, location);
  }

  // --- Attempt 1: BLS metro area data ---
  const blsMetro = msaResult.areaType !== 'national'
    ? await fetchFromBls(socCode, occupation, msaResult)
    : null;
  if (blsMetro) {
    await setCachedResult(cacheId, blsMetro);
    return enrichWithCOL(blsMetro, location);
  }

  // --- Attempt 2: BLS national fallback ---
  const nationalCacheId = `${socCode}|0000000|national`;
  const nationalCached = await getCachedResult(nationalCacheId);
  if (nationalCached) {
    console.log('[SalaryLens] National cache hit:', nationalCacheId);
    return enrichWithCOL(nationalCached, location);
  }

  const blsNational = await fetchFromBls(socCode, occupation, null);
  if (blsNational) {
    await setCachedResult(nationalCacheId, blsNational);
    return enrichWithCOL(blsNational, location);
  }

  // --- Attempt 3: CareerOneStop ---
  const cosResult = await fetchFromCareerOneStop(socCode, occupation, location);
  if (cosResult) {
    await setCachedResult(cacheId, cosResult);
    return enrichWithCOL(cosResult, location);
  }

  // --- Both failed ---
  return {
    error:
      'Unable to retrieve salary data at this time. ' +
      'The BLS API may be temporarily unavailable. Please try again later.',
  };
}

// ---------------------------------------------------------------------------
// Offer storage helpers
// ---------------------------------------------------------------------------

/**
 * Retrieve all saved offers from chrome.storage.local.
 *
 * @returns {Promise<Object[]>} Array of saved offer objects (may be empty).
 */
async function getSavedOffers() {
  const stored = await chrome.storage.local.get(STORAGE.OFFERS);
  return stored[STORAGE.OFFERS] ?? [];
}

/**
 * Save a new offer to chrome.storage.local.
 * Assigns a unique timestamp-based ID and a `savedAt` ISO timestamp.
 *
 * @param {Object} offer - Offer details from the content script / popup.
 * @returns {Promise<Object>} The saved offer with its assigned `id` and `savedAt`.
 */
async function saveOffer(offer) {
  if (!offer || typeof offer !== 'object') {
    throw new Error('Invalid offer payload.');
  }

  const offers = await getSavedOffers();
  const now = Date.now();

  const newOffer = {
    ...offer,
    id:      `offer_${now}_${Math.random().toString(36).slice(2, 7)}`,
    savedAt: new Date(now).toISOString(),
  };

  offers.push(newOffer);
  await chrome.storage.local.set({ [STORAGE.OFFERS]: offers });
  return newOffer;
}

/**
 * Delete a saved offer by its ID.
 *
 * @param {string} offerId - The `id` field of the offer to delete.
 * @returns {Promise<{ success: boolean }>}
 */
async function deleteOffer(offerId) {
  if (!offerId) throw new Error('offerId is required.');

  const offers  = await getSavedOffers();
  const filtered = offers.filter((o) => o.id !== offerId);

  if (filtered.length === offers.length) {
    // Nothing was removed — ID not found; treat as a no-op success
    console.warn('[SalaryLens] deleteOffer: no offer found with id', offerId);
  }

  await chrome.storage.local.set({ [STORAGE.OFFERS]: filtered });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

/**
 * Central message dispatcher.  Returns `true` from the listener to signal
 * that the response will be sent asynchronously.
 *
 * @param {{ type: string, [key: string]: any }} message
 * @param {chrome.runtime.MessageSender}          _sender  - Unused but kept for clarity
 * @param {function(any): void}                   sendResponse
 * @returns {boolean} true — keeps the message channel open for async response
 */
function handleMessage(message, _sender, sendResponse) {
  const { type } = message ?? {};

  switch (type) {
    // ------------------------------------------------------------------
    case MSG.FETCH_SALARY: {
      const { jobTitle, location } = message;

      (async () => {
        // Check if user is Pro (paid) — Pro users skip rate limiting
        let isPro = false;
        try {
          const user = await extpay.getUser();
          isPro = user.paid === true;
        } catch (_) { /* ExtPay unavailable — treat as free */ }

        if (!isPro) {
          const { allowed, remaining } = await checkRateLimit();
          if (!allowed) {
            sendResponse({
              error:     'daily_limit_reached',
              message:   `You've used all ${FREE_TIER.MAX_LOOKUPS_PER_DAY} free lookups for today. Upgrade SalaryLens for unlimited lookups.`,
              remaining: 0,
            });
            return;
          }
          await incrementLookupCount();
          const data = await fetchSalaryData(jobTitle, location);
          sendResponse({ ...data, remaining: remaining - 1 });
        } else {
          const data = await fetchSalaryData(jobTitle, location);
          sendResponse({ ...data, remaining: -1 }); // -1 = unlimited
        }
      })().catch((err) => {
        console.error('[SalaryLens] FETCH_SALARY error:', err);
        sendResponse({ error: 'An unexpected error occurred. Please try again.' });
      });

      return true; // async response
    }

    // ------------------------------------------------------------------
    case MSG.SAVE_OFFER: {
      const { offer } = message;

      saveOffer(offer)
        .then((saved) => sendResponse({ success: true, offer: saved }))
        .catch((err) => {
          console.error('[SalaryLens] SAVE_OFFER error:', err);
          sendResponse({ success: false, error: err.message });
        });

      return true;
    }

    // ------------------------------------------------------------------
    case MSG.GET_OFFERS: {
      getSavedOffers()
        .then((offers) => sendResponse({ offers }))
        .catch((err) => {
          console.error('[SalaryLens] GET_OFFERS error:', err);
          sendResponse({ offers: [], error: err.message });
        });

      return true;
    }

    // ------------------------------------------------------------------
    case MSG.DELETE_OFFER: {
      const { offerId } = message;

      deleteOffer(offerId)
        .then((result) => sendResponse(result))
        .catch((err) => {
          console.error('[SalaryLens] DELETE_OFFER error:', err);
          sendResponse({ success: false, error: err.message });
        });

      return true;
    }

    // ------------------------------------------------------------------
    case MSG.GET_USER_STATUS: {
      extpay.getUser()
        .then((user) => sendResponse({
          paid: user.paid,
          paidAt: user.paidAt,
          subscriptionStatus: user.subscriptionStatus,
        }))
        .catch((err) => {
          console.error('[SalaryLens] GET_USER_STATUS error:', err);
          sendResponse({ paid: false, error: err.message });
        });

      return true;
    }

    // ------------------------------------------------------------------
    case MSG.OPEN_PAYMENT_PAGE: {
      extpay.openPaymentPage();
      sendResponse({ success: true });
      return false;
    }

    // ------------------------------------------------------------------
    default:
      console.warn('[SalaryLens] Unknown message type received:', type);
      sendResponse({ error: `Unknown message type: ${type}` });
      return false;
  }
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(handleMessage);

console.log('[SalaryLens] Service worker initialised.');
