/**
 * Cost of Living Index — Regional Price Parities (RPP)
 *
 * Based on BEA Regional Price Parities data (2022).
 * National average = 100. Higher = more expensive.
 *
 * Source: Bureau of Economic Analysis, SARPP Table
 * https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro
 *
 * @module col-index
 */

/**
 * Metro area RPP values.
 * Key: lowercase city name, Value: RPP index (national = 100)
 */
export const METRO_RPP = {
  // Very High Cost (>115)
  'san francisco': 127.5,
  'san jose': 126.8,
  'new york': 124.5,
  'honolulu': 121.3,
  'los angeles': 118.2,
  'washington': 117.8,
  'seattle': 117.2,
  'boston': 116.4,
  'san diego': 115.8,
  'bridgeport': 115.5,

  // High Cost (108-115)
  'miami': 113.2,
  'denver': 112.0,
  'portland': 111.5,
  'hartford': 110.2,
  'philadelphia': 109.8,
  'baltimore': 109.5,
  'chicago': 108.7,
  'minneapolis': 108.3,
  'sacramento': 108.1,

  // Above Average (103-108)
  'austin': 107.5,
  'nashville': 106.2,
  'charlotte': 105.0,
  'raleigh': 104.8,
  'salt lake city': 104.5,
  'richmond': 104.2,
  'dallas': 103.8,
  'atlanta': 103.5,
  'tampa': 103.2,
  'orlando': 103.0,

  // Average (97-103)
  'houston': 102.0,
  'phoenix': 101.5,
  'las vegas': 101.2,
  'columbus': 100.5,
  'detroit': 100.0,
  'kansas city': 99.5,
  'milwaukee': 99.2,
  'pittsburgh': 98.8,
  'jacksonville': 98.5,
  'san antonio': 98.2,
  'new orleans': 97.8,
  'cleveland': 97.5,

  // Below Average (<97)
  'indianapolis': 96.8,
  'cincinnati': 96.5,
  'st. louis': 96.2,
  'memphis': 95.5,
  'louisville': 95.2,
  'oklahoma city': 94.0,
  'birmingham': 93.8,
  'tulsa': 93.5,
  'el paso': 92.0,
  'little rock': 91.5,
  'jackson': 90.5,
  'mcallen': 88.0,
};

/**
 * State-level RPP values (2022).
 * Used as fallback when metro area not found.
 */
export const STATE_RPP = {
  'AL': 88.5, 'AK': 107.0, 'AZ': 101.5, 'AR': 88.3, 'CA': 115.5,
  'CO': 107.5, 'CT': 110.2, 'DE': 103.0, 'FL': 102.5, 'GA': 95.0,
  'HI': 118.0, 'ID': 97.5, 'IL': 101.0, 'IN': 92.8, 'IA': 90.5,
  'KS': 92.0, 'KY': 90.5, 'LA': 92.0, 'ME': 100.5, 'MD': 110.5,
  'MA': 112.0, 'MI': 95.5, 'MN': 100.5, 'MS': 86.8, 'MO': 91.5,
  'MT': 97.0, 'NE': 92.5, 'NV': 100.0, 'NH': 107.5, 'NJ': 115.5,
  'NM': 94.0, 'NY': 115.0, 'NC': 96.0, 'ND': 93.5, 'OH': 93.0,
  'OK': 90.5, 'OR': 105.5, 'PA': 99.0, 'RI': 101.5, 'SC': 93.0,
  'SD': 93.0, 'TN': 94.5, 'TX': 97.5, 'UT': 101.0, 'VT': 102.5,
  'VA': 103.5, 'WA': 110.0, 'WV': 87.5, 'WI': 95.0, 'WY': 95.5,
  'DC': 117.8,
};

/**
 * Get the RPP (Regional Price Parity) for a city or state.
 * @param {string} city - City name (lowercase)
 * @param {string} state - 2-letter state abbreviation
 * @returns {{ rpp: number, source: 'metro'|'state'|'national' }}
 */
export function getRPP(city, state) {
  if (city) {
    const normalized = city.toLowerCase().trim();
    if (METRO_RPP[normalized] !== undefined) {
      return { rpp: METRO_RPP[normalized], source: 'metro' };
    }
    // Try partial match (e.g., "San Francisco" in "San Francisco, CA 94102")
    for (const [key, val] of Object.entries(METRO_RPP)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return { rpp: val, source: 'metro' };
      }
    }
  }
  if (state && STATE_RPP[state.toUpperCase()]) {
    return { rpp: STATE_RPP[state.toUpperCase()], source: 'state' };
  }
  return { rpp: 100, source: 'national' };
}

/**
 * Calculate cost-of-living adjusted salary.
 * Converts a salary from one location's cost of living to another's.
 * @param {number} salary - Original salary
 * @param {number} fromRpp - RPP of the salary's location
 * @param {number} toRpp - RPP of the comparison location
 * @returns {number} Adjusted salary
 */
export function adjustSalary(salary, fromRpp, toRpp) {
  if (fromRpp === 0 || toRpp === 0) return salary;
  return Math.round(salary * (toRpp / fromRpp));
}

/**
 * Format the RPP as a human-readable cost level.
 * @param {number} rpp
 * @returns {string}
 */
export function costLevel(rpp) {
  if (rpp >= 115) return 'Very High Cost';
  if (rpp >= 108) return 'High Cost';
  if (rpp >= 103) return 'Above Average';
  if (rpp >= 97) return 'Average';
  return 'Below Average';
}
