import { MSG } from './constants.js';

/**
 * Send a message to the background service worker and return the response.
 * @param {string} type - Message type from MSG constants
 * @param {Object} payload - Message payload
 * @returns {Promise<Object>} Response from service worker
 */
export function sendMessage(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload });
}

/**
 * Build a FETCH_SALARY request payload.
 * @param {string} jobTitle - Job title extracted from page
 * @param {string} location - Location (city, state) extracted from page
 * @returns {{ type: string, jobTitle: string, location: string }}
 */
export function buildSalaryRequest(jobTitle, location) {
  return { type: MSG.FETCH_SALARY, jobTitle, location };
}

/**
 * Build a SAVE_OFFER request payload.
 * @param {Object} offer - Offer details
 * @param {string} offer.jobTitle
 * @param {string} offer.company
 * @param {string} offer.location
 * @param {number} offer.salary - Listed salary (annual)
 * @param {Object} offer.marketData - Percentile data from API
 * @returns {{ type: string, offer: Object }}
 */
export function buildSaveOfferRequest(offer) {
  return { type: MSG.SAVE_OFFER, offer };
}
