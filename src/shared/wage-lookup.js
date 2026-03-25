/**
 * Local BLS OEWS wage data lookup.
 * Loads the bundled wages.json and provides fast lookup by SOC + area code.
 *
 * Data format in wages.json:
 *   Area codes: "99" (national), "01"-"56" (states), "10180" etc (5-digit MSA)
 *   SOC codes: "151252" (6-digit, no hyphen)
 *
 * MSA module uses 7-digit padded codes ("0012420"), so we strip leading zeros
 * to match the BLS data format.
 *
 * @module wage-lookup
 */

let wageData = null;
let wageIndex = null; // Map: "area|soc" → [area, soc, p10, p25, p50, p75, p90]

/**
 * Load and index the wage data from the bundled JSON file.
 * @returns {Promise<void>}
 */
async function ensureLoaded() {
  if (wageIndex) return;

  const url = chrome.runtime.getURL('src/data/wages.json');
  const response = await fetch(url);
  wageData = await response.json();

  wageIndex = new Map();
  for (const entry of wageData.wages) {
    const key = `${entry[0]}|${entry[1]}`;
    wageIndex.set(key, entry);
  }

  console.log(`[SalaryLens] Wage data loaded: ${wageIndex.size.toLocaleString()} entries`);
}

/**
 * Normalize an area code from MSA module format (7-digit padded) to BLS data format.
 * "0012420" → "12420", "0100000" → "01", "0000000" → "99"
 * @param {string} code
 * @param {string} areaType
 * @returns {string}
 */
function normalizeAreaCode(code, areaType) {
  if (areaType === 'national') return '99';
  if (areaType === 'state') {
    // State MSA codes from msa-codes.js: "00XX000" → extract XX (FIPS)
    const stripped = code.replace(/^0+/, '').replace(/0+$/, '');
    return stripped || '99';
  }
  // Metro: "0012420" → "12420"
  return code.replace(/^0+/, '') || '99';
}

/**
 * Look up wage percentile data for a SOC code and area code.
 * @param {string} socCode - 6-digit SOC code (no hyphen)
 * @param {string} areaCode - BLS area code in data format (e.g. "12420", "01", "99")
 * @returns {Promise<Object|null>}
 */
export async function lookupWage(socCode, areaCode) {
  await ensureLoaded();

  const key = `${areaCode}|${socCode}`;
  const entry = wageIndex.get(key);
  if (!entry) return null;

  return {
    source: 'local',
    occupation: wageData.occupations[socCode] || 'Unknown',
    area: wageData.areas[areaCode] || 'Unknown',
    p10: entry[2],
    p25: entry[3],
    p50: entry[4],
    p75: entry[5],
    p90: entry[6],
  };
}

/**
 * Look up wage data with fallback chain: metro → state → national.
 * Accepts MSA result from resolveMsa() and handles code format conversion.
 * @param {string} socCode - 6-digit SOC code
 * @param {{ msaCode: string, areaType: string, stateFips?: string }} msaResult - From resolveMsa()
 * @returns {Promise<Object|null>}
 */
export async function lookupWageWithFallback(socCode, msaResult) {
  const areaCode = normalizeAreaCode(msaResult.msaCode, msaResult.areaType);

  // Try the resolved area first
  const result = await lookupWage(socCode, areaCode);
  if (result) return result;

  // If metro, try state-level fallback
  if (msaResult.areaType === 'metro' && msaResult.stateFips) {
    const stateResult = await lookupWage(socCode, msaResult.stateFips);
    if (stateResult) return stateResult;
  }

  // National fallback
  const national = await lookupWage(socCode, '99');
  return national;
}
