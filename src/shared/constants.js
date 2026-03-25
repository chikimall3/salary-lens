/**
 * Message types between content script and service worker
 */
export const MSG = {
  FETCH_SALARY: 'FETCH_SALARY',
  SALARY_RESULT: 'SALARY_RESULT',
  SAVE_OFFER: 'SAVE_OFFER',
  GET_OFFERS: 'GET_OFFERS',
  DELETE_OFFER: 'DELETE_OFFER',
  GET_USER_STATUS: 'GET_USER_STATUS',
  OPEN_PAYMENT_PAGE: 'OPEN_PAYMENT_PAGE',
};

/**
 * Storage keys for chrome.storage.local
 */
export const STORAGE = {
  OFFERS: 'salary_lens_offers',
  SETTINGS: 'salary_lens_settings',
  LOOKUP_COUNT: 'salary_lens_lookup_count',
  LOOKUP_DATE: 'salary_lens_lookup_date',
};

/**
 * Free tier limits
 */
export const FREE_TIER = {
  MAX_LOOKUPS_PER_DAY: 3,
};

/**
 * API endpoints
 */
export const API = {
  BLS_BASE: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
  CAREER_ONE_STOP_BASE: 'https://api.careeronestop.org/v1/occupation/',
};

/**
 * Salary percentile keys returned from API
 */
export const PERCENTILES = ['p10', 'p25', 'p50', 'p75', 'p90'];
