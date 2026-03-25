/**
 * @fileoverview BLS OEWS MSA code lookup table and location resolution utilities.
 *
 * MSA codes are 5-digit CBSA codes (from US Census / OMB), padded to 7 digits
 * with leading zeros for use in BLS OEWS series IDs.
 *
 * BLS series ID format:
 *   OEUM{7-digit-area}{6-digit-industry}{6-digit-SOC}{2-digit-datatype}
 *
 * CBSA codes sourced from: US Census Bureau API
 *   https://api.census.gov/data/2020/acs/acs5/subject?get=NAME&for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:*
 *
 * State FIPS codes sourced from: US Census Bureau ANSI standard.
 */

// ---------------------------------------------------------------------------
// State FIPS codes (2-digit, padded to 7 digits → "00XX000" for BLS state series)
// ---------------------------------------------------------------------------

/**
 * Maps 2-letter state abbreviation to 2-digit FIPS code string.
 * @type {Object.<string, string>}
 */
export const STATE_FIPS = {
  AL: '01',
  AK: '02',
  AZ: '04',
  AR: '05',
  CA: '06',
  CO: '08',
  CT: '09',
  DE: '10',
  DC: '11',
  FL: '12',
  GA: '13',
  HI: '15',
  ID: '16',
  IL: '17',
  IN: '18',
  IA: '19',
  KS: '20',
  KY: '21',
  LA: '22',
  ME: '23',
  MD: '24',
  MA: '25',
  MI: '26',
  MN: '27',
  MS: '28',
  MO: '29',
  MT: '30',
  NE: '31',
  NV: '32',
  NH: '33',
  NJ: '34',
  NM: '35',
  NY: '36',
  NC: '37',
  ND: '38',
  OH: '39',
  OK: '40',
  OR: '41',
  PA: '42',
  RI: '44',
  SC: '45',
  SD: '46',
  TN: '47',
  TX: '48',
  UT: '49',
  VT: '50',
  VA: '51',
  WA: '53',
  WV: '54',
  WI: '55',
  WY: '56',
};

// ---------------------------------------------------------------------------
// MSA entries — top ~120 metro areas by population + aliases
//
// msaCode: 7-digit zero-padded CBSA code (5-digit CBSA prepended with "00")
// city:    canonical lowercase city name used for matching
// state:   primary state abbreviation shown on job boards
// msaName: official BLS/Census area name
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} MsaEntry
 * @property {string} city     - Lowercase canonical city name for matching
 * @property {string} state    - Primary state abbreviation (e.g. 'TX')
 * @property {string} msaCode  - 7-digit zero-padded CBSA code (e.g. '0035620')
 * @property {string} msaName  - Official MSA name
 */

/** @type {MsaEntry[]} */
export const MSA_ENTRIES = [
  // Rank 1 — New York
  { city: 'new york',      state: 'NY', msaCode: '0035620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA Metro Area' },
  { city: 'newark',        state: 'NJ', msaCode: '0035620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA Metro Area' },
  { city: 'jersey city',   state: 'NJ', msaCode: '0035620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA Metro Area' },
  { city: 'brooklyn',      state: 'NY', msaCode: '0035620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA Metro Area' },
  { city: 'queens',        state: 'NY', msaCode: '0035620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA Metro Area' },
  { city: 'bronx',         state: 'NY', msaCode: '0035620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA Metro Area' },
  { city: 'manhattan',     state: 'NY', msaCode: '0035620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA Metro Area' },
  { city: 'staten island', state: 'NY', msaCode: '0035620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA Metro Area' },

  // Rank 2 — Los Angeles
  { city: 'los angeles',   state: 'CA', msaCode: '0031080', msaName: 'Los Angeles-Long Beach-Anaheim, CA Metro Area' },
  { city: 'long beach',    state: 'CA', msaCode: '0031080', msaName: 'Los Angeles-Long Beach-Anaheim, CA Metro Area' },
  { city: 'anaheim',       state: 'CA', msaCode: '0031080', msaName: 'Los Angeles-Long Beach-Anaheim, CA Metro Area' },
  { city: 'santa ana',     state: 'CA', msaCode: '0031080', msaName: 'Los Angeles-Long Beach-Anaheim, CA Metro Area' },
  { city: 'irvine',        state: 'CA', msaCode: '0031080', msaName: 'Los Angeles-Long Beach-Anaheim, CA Metro Area' },
  { city: 'glendale',      state: 'CA', msaCode: '0031080', msaName: 'Los Angeles-Long Beach-Anaheim, CA Metro Area' },
  { city: 'burbank',       state: 'CA', msaCode: '0031080', msaName: 'Los Angeles-Long Beach-Anaheim, CA Metro Area' },
  { city: 'pasadena',      state: 'CA', msaCode: '0031080', msaName: 'Los Angeles-Long Beach-Anaheim, CA Metro Area' },
  { city: 'torrance',      state: 'CA', msaCode: '0031080', msaName: 'Los Angeles-Long Beach-Anaheim, CA Metro Area' },

  // Rank 3 — Chicago
  { city: 'chicago',       state: 'IL', msaCode: '0016980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI Metro Area' },
  { city: 'naperville',    state: 'IL', msaCode: '0016980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI Metro Area' },
  { city: 'elgin',         state: 'IL', msaCode: '0016980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI Metro Area' },
  { city: 'aurora',        state: 'IL', msaCode: '0016980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI Metro Area' },

  // Rank 4 — Dallas-Fort Worth
  { city: 'dallas',        state: 'TX', msaCode: '0019100', msaName: 'Dallas-Fort Worth-Arlington, TX Metro Area' },
  { city: 'fort worth',    state: 'TX', msaCode: '0019100', msaName: 'Dallas-Fort Worth-Arlington, TX Metro Area' },
  { city: 'arlington',     state: 'TX', msaCode: '0019100', msaName: 'Dallas-Fort Worth-Arlington, TX Metro Area' },
  { city: 'plano',         state: 'TX', msaCode: '0019100', msaName: 'Dallas-Fort Worth-Arlington, TX Metro Area' },
  { city: 'frisco',        state: 'TX', msaCode: '0019100', msaName: 'Dallas-Fort Worth-Arlington, TX Metro Area' },
  { city: 'garland',       state: 'TX', msaCode: '0019100', msaName: 'Dallas-Fort Worth-Arlington, TX Metro Area' },
  { city: 'irving',        state: 'TX', msaCode: '0019100', msaName: 'Dallas-Fort Worth-Arlington, TX Metro Area' },
  { city: 'mckinney',      state: 'TX', msaCode: '0019100', msaName: 'Dallas-Fort Worth-Arlington, TX Metro Area' },

  // Rank 5 — Houston
  { city: 'houston',       state: 'TX', msaCode: '0026420', msaName: 'Houston-The Woodlands-Sugar Land, TX Metro Area' },
  { city: 'the woodlands', state: 'TX', msaCode: '0026420', msaName: 'Houston-The Woodlands-Sugar Land, TX Metro Area' },
  { city: 'sugar land',    state: 'TX', msaCode: '0026420', msaName: 'Houston-The Woodlands-Sugar Land, TX Metro Area' },
  { city: 'pasadena',      state: 'TX', msaCode: '0026420', msaName: 'Houston-The Woodlands-Sugar Land, TX Metro Area' },

  // Rank 6 — Washington DC
  { city: 'washington',    state: 'DC', msaCode: '0047900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV Metro Area' },
  { city: 'arlington',     state: 'VA', msaCode: '0047900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV Metro Area' },
  { city: 'alexandria',    state: 'VA', msaCode: '0047900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV Metro Area' },
  { city: 'bethesda',      state: 'MD', msaCode: '0047900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV Metro Area' },
  { city: 'reston',        state: 'VA', msaCode: '0047900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV Metro Area' },
  { city: 'mclean',        state: 'VA', msaCode: '0047900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV Metro Area' },

  // Rank 7 — Miami
  { city: 'miami',         state: 'FL', msaCode: '0033100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL Metro Area' },
  { city: 'fort lauderdale', state: 'FL', msaCode: '0033100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL Metro Area' },
  { city: 'pompano beach', state: 'FL', msaCode: '0033100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL Metro Area' },
  { city: 'boca raton',    state: 'FL', msaCode: '0033100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL Metro Area' },
  { city: 'hialeah',       state: 'FL', msaCode: '0033100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL Metro Area' },

  // Rank 8 — Philadelphia
  { city: 'philadelphia',  state: 'PA', msaCode: '0037980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD Metro Area' },
  { city: 'camden',        state: 'NJ', msaCode: '0037980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD Metro Area' },
  { city: 'wilmington',    state: 'DE', msaCode: '0037980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD Metro Area' },

  // Rank 9 — Atlanta
  { city: 'atlanta',       state: 'GA', msaCode: '0012060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA Metro Area' },
  { city: 'sandy springs', state: 'GA', msaCode: '0012060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA Metro Area' },
  { city: 'alpharetta',    state: 'GA', msaCode: '0012060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA Metro Area' },

  // Rank 10 — Phoenix
  { city: 'phoenix',       state: 'AZ', msaCode: '0038060', msaName: 'Phoenix-Mesa-Chandler, AZ Metro Area' },
  { city: 'mesa',          state: 'AZ', msaCode: '0038060', msaName: 'Phoenix-Mesa-Chandler, AZ Metro Area' },
  { city: 'chandler',      state: 'AZ', msaCode: '0038060', msaName: 'Phoenix-Mesa-Chandler, AZ Metro Area' },
  { city: 'scottsdale',    state: 'AZ', msaCode: '0038060', msaName: 'Phoenix-Mesa-Chandler, AZ Metro Area' },
  { city: 'tempe',         state: 'AZ', msaCode: '0038060', msaName: 'Phoenix-Mesa-Chandler, AZ Metro Area' },
  { city: 'gilbert',       state: 'AZ', msaCode: '0038060', msaName: 'Phoenix-Mesa-Chandler, AZ Metro Area' },
  { city: 'glendale',      state: 'AZ', msaCode: '0038060', msaName: 'Phoenix-Mesa-Chandler, AZ Metro Area' },

  // Rank 11 — Boston
  { city: 'boston',        state: 'MA', msaCode: '0014460', msaName: 'Boston-Cambridge-Newton, MA-NH Metro Area' },
  { city: 'cambridge',     state: 'MA', msaCode: '0014460', msaName: 'Boston-Cambridge-Newton, MA-NH Metro Area' },
  { city: 'newton',        state: 'MA', msaCode: '0014460', msaName: 'Boston-Cambridge-Newton, MA-NH Metro Area' },
  { city: 'somerville',    state: 'MA', msaCode: '0014460', msaName: 'Boston-Cambridge-Newton, MA-NH Metro Area' },

  // Rank 12 — Riverside-San Bernardino
  { city: 'riverside',     state: 'CA', msaCode: '0040140', msaName: 'Riverside-San Bernardino-Ontario, CA Metro Area' },
  { city: 'san bernardino', state: 'CA', msaCode: '0040140', msaName: 'Riverside-San Bernardino-Ontario, CA Metro Area' },
  { city: 'ontario',       state: 'CA', msaCode: '0040140', msaName: 'Riverside-San Bernardino-Ontario, CA Metro Area' },

  // Rank 13 — San Francisco
  { city: 'san francisco', state: 'CA', msaCode: '0041860', msaName: 'San Francisco-Oakland-Berkeley, CA Metro Area' },
  { city: 'oakland',       state: 'CA', msaCode: '0041860', msaName: 'San Francisco-Oakland-Berkeley, CA Metro Area' },
  { city: 'berkeley',      state: 'CA', msaCode: '0041860', msaName: 'San Francisco-Oakland-Berkeley, CA Metro Area' },
  { city: 'fremont',       state: 'CA', msaCode: '0041860', msaName: 'San Francisco-Oakland-Berkeley, CA Metro Area' },

  // Rank 14 — Seattle
  { city: 'seattle',       state: 'WA', msaCode: '0042660', msaName: 'Seattle-Tacoma-Bellevue, WA Metro Area' },
  { city: 'tacoma',        state: 'WA', msaCode: '0042660', msaName: 'Seattle-Tacoma-Bellevue, WA Metro Area' },
  { city: 'bellevue',      state: 'WA', msaCode: '0042660', msaName: 'Seattle-Tacoma-Bellevue, WA Metro Area' },
  { city: 'redmond',       state: 'WA', msaCode: '0042660', msaName: 'Seattle-Tacoma-Bellevue, WA Metro Area' },
  { city: 'kirkland',      state: 'WA', msaCode: '0042660', msaName: 'Seattle-Tacoma-Bellevue, WA Metro Area' },

  // Rank 15 — Minneapolis
  { city: 'minneapolis',   state: 'MN', msaCode: '0033460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI Metro Area' },
  { city: 'st. paul',      state: 'MN', msaCode: '0033460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI Metro Area' },
  { city: 'saint paul',    state: 'MN', msaCode: '0033460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI Metro Area' },
  { city: 'bloomington',   state: 'MN', msaCode: '0033460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI Metro Area' },

  // Rank 16 — San Diego
  { city: 'san diego',     state: 'CA', msaCode: '0041740', msaName: 'San Diego-Chula Vista-Carlsbad, CA Metro Area' },
  { city: 'chula vista',   state: 'CA', msaCode: '0041740', msaName: 'San Diego-Chula Vista-Carlsbad, CA Metro Area' },
  { city: 'carlsbad',      state: 'CA', msaCode: '0041740', msaName: 'San Diego-Chula Vista-Carlsbad, CA Metro Area' },

  // Rank 17 — Tampa
  { city: 'tampa',         state: 'FL', msaCode: '0045300', msaName: 'Tampa-St. Petersburg-Clearwater, FL Metro Area' },
  { city: 'st. petersburg', state: 'FL', msaCode: '0045300', msaName: 'Tampa-St. Petersburg-Clearwater, FL Metro Area' },
  { city: 'saint petersburg', state: 'FL', msaCode: '0045300', msaName: 'Tampa-St. Petersburg-Clearwater, FL Metro Area' },
  { city: 'clearwater',    state: 'FL', msaCode: '0045300', msaName: 'Tampa-St. Petersburg-Clearwater, FL Metro Area' },

  // Rank 18 — Denver
  { city: 'denver',        state: 'CO', msaCode: '0019740', msaName: 'Denver-Aurora-Lakewood, CO Metro Area' },
  { city: 'aurora',        state: 'CO', msaCode: '0019740', msaName: 'Denver-Aurora-Lakewood, CO Metro Area' },
  { city: 'lakewood',      state: 'CO', msaCode: '0019740', msaName: 'Denver-Aurora-Lakewood, CO Metro Area' },
  { city: 'boulder',       state: 'CO', msaCode: '0014500', msaName: 'Boulder, CO Metro Area' },

  // Rank 19 — St. Louis
  { city: 'st. louis',     state: 'MO', msaCode: '0041180', msaName: 'St. Louis, MO-IL Metro Area' },
  { city: 'saint louis',   state: 'MO', msaCode: '0041180', msaName: 'St. Louis, MO-IL Metro Area' },

  // Rank 20 — Baltimore
  { city: 'baltimore',     state: 'MD', msaCode: '0012580', msaName: 'Baltimore-Columbia-Towson, MD Metro Area' },
  { city: 'columbia',      state: 'MD', msaCode: '0012580', msaName: 'Baltimore-Columbia-Towson, MD Metro Area' },
  { city: 'towson',        state: 'MD', msaCode: '0012580', msaName: 'Baltimore-Columbia-Towson, MD Metro Area' },

  // Rank 21 — Charlotte
  { city: 'charlotte',     state: 'NC', msaCode: '0016740', msaName: 'Charlotte-Concord-Gastonia, NC-SC Metro Area' },
  { city: 'concord',       state: 'NC', msaCode: '0016740', msaName: 'Charlotte-Concord-Gastonia, NC-SC Metro Area' },
  { city: 'gastonia',      state: 'NC', msaCode: '0016740', msaName: 'Charlotte-Concord-Gastonia, NC-SC Metro Area' },

  // Rank 22 — Orlando
  { city: 'orlando',       state: 'FL', msaCode: '0036740', msaName: 'Orlando-Kissimmee-Sanford, FL Metro Area' },
  { city: 'kissimmee',     state: 'FL', msaCode: '0036740', msaName: 'Orlando-Kissimmee-Sanford, FL Metro Area' },
  { city: 'sanford',       state: 'FL', msaCode: '0036740', msaName: 'Orlando-Kissimmee-Sanford, FL Metro Area' },

  // Rank 23 — San Antonio
  { city: 'san antonio',   state: 'TX', msaCode: '0041700', msaName: 'San Antonio-New Braunfels, TX Metro Area' },
  { city: 'new braunfels', state: 'TX', msaCode: '0041700', msaName: 'San Antonio-New Braunfels, TX Metro Area' },

  // Rank 24 — Portland, OR
  { city: 'portland',      state: 'OR', msaCode: '0038900', msaName: 'Portland-Vancouver-Hillsboro, OR-WA Metro Area' },
  { city: 'vancouver',     state: 'WA', msaCode: '0038900', msaName: 'Portland-Vancouver-Hillsboro, OR-WA Metro Area' },
  { city: 'hillsboro',     state: 'OR', msaCode: '0038900', msaName: 'Portland-Vancouver-Hillsboro, OR-WA Metro Area' },

  // Rank 25 — Sacramento
  { city: 'sacramento',    state: 'CA', msaCode: '0040900', msaName: 'Sacramento-Roseville-Folsom, CA Metro Area' },
  { city: 'roseville',     state: 'CA', msaCode: '0040900', msaName: 'Sacramento-Roseville-Folsom, CA Metro Area' },
  { city: 'folsom',        state: 'CA', msaCode: '0040900', msaName: 'Sacramento-Roseville-Folsom, CA Metro Area' },

  // Rank 26 — Pittsburgh
  { city: 'pittsburgh',    state: 'PA', msaCode: '0038300', msaName: 'Pittsburgh, PA Metro Area' },

  // Rank 27 — Las Vegas
  { city: 'las vegas',     state: 'NV', msaCode: '0029820', msaName: 'Las Vegas-Henderson-Paradise, NV Metro Area' },
  { city: 'henderson',     state: 'NV', msaCode: '0029820', msaName: 'Las Vegas-Henderson-Paradise, NV Metro Area' },

  // Rank 28 — Austin
  { city: 'austin',        state: 'TX', msaCode: '0012420', msaName: 'Austin-Round Rock-Georgetown, TX Metro Area' },
  { city: 'round rock',    state: 'TX', msaCode: '0012420', msaName: 'Austin-Round Rock-Georgetown, TX Metro Area' },
  { city: 'georgetown',    state: 'TX', msaCode: '0012420', msaName: 'Austin-Round Rock-Georgetown, TX Metro Area' },

  // Rank 29 — Cincinnati
  { city: 'cincinnati',    state: 'OH', msaCode: '0017140', msaName: 'Cincinnati, OH-KY-IN Metro Area' },

  // Rank 30 — Kansas City
  { city: 'kansas city',   state: 'MO', msaCode: '0028140', msaName: 'Kansas City, MO-KS Metro Area' },
  { city: 'overland park', state: 'KS', msaCode: '0028140', msaName: 'Kansas City, MO-KS Metro Area' },

  // Rank 31 — Columbus, OH
  { city: 'columbus',      state: 'OH', msaCode: '0018140', msaName: 'Columbus, OH Metro Area' },

  // Rank 32 — Indianapolis
  { city: 'indianapolis',  state: 'IN', msaCode: '0026900', msaName: 'Indianapolis-Carmel-Anderson, IN Metro Area' },
  { city: 'carmel',        state: 'IN', msaCode: '0026900', msaName: 'Indianapolis-Carmel-Anderson, IN Metro Area' },

  // Rank 33 — Cleveland
  { city: 'cleveland',     state: 'OH', msaCode: '0017460', msaName: 'Cleveland-Elyria, OH Metro Area' },
  { city: 'elyria',        state: 'OH', msaCode: '0017460', msaName: 'Cleveland-Elyria, OH Metro Area' },

  // Rank 34 — San Jose
  { city: 'san jose',      state: 'CA', msaCode: '0041940', msaName: 'San Jose-Sunnyvale-Santa Clara, CA Metro Area' },
  { city: 'sunnyvale',     state: 'CA', msaCode: '0041940', msaName: 'San Jose-Sunnyvale-Santa Clara, CA Metro Area' },
  { city: 'santa clara',   state: 'CA', msaCode: '0041940', msaName: 'San Jose-Sunnyvale-Santa Clara, CA Metro Area' },
  { city: 'cupertino',     state: 'CA', msaCode: '0041940', msaName: 'San Jose-Sunnyvale-Santa Clara, CA Metro Area' },

  // Rank 35 — Nashville
  { city: 'nashville',     state: 'TN', msaCode: '0034980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN Metro Area' },
  { city: 'murfreesboro',  state: 'TN', msaCode: '0034980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN Metro Area' },
  { city: 'franklin',      state: 'TN', msaCode: '0034980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN Metro Area' },

  // Rank 36 — Virginia Beach
  { city: 'virginia beach', state: 'VA', msaCode: '0047260', msaName: 'Virginia Beach-Norfolk-Newport News, VA-NC Metro Area' },
  { city: 'norfolk',       state: 'VA', msaCode: '0047260', msaName: 'Virginia Beach-Norfolk-Newport News, VA-NC Metro Area' },
  { city: 'newport news',  state: 'VA', msaCode: '0047260', msaName: 'Virginia Beach-Norfolk-Newport News, VA-NC Metro Area' },
  { city: 'chesapeake',    state: 'VA', msaCode: '0047260', msaName: 'Virginia Beach-Norfolk-Newport News, VA-NC Metro Area' },

  // Rank 37 — Providence
  { city: 'providence',    state: 'RI', msaCode: '0039300', msaName: 'Providence-Warwick, RI-MA Metro Area' },
  { city: 'warwick',       state: 'RI', msaCode: '0039300', msaName: 'Providence-Warwick, RI-MA Metro Area' },

  // Rank 38 — Milwaukee
  { city: 'milwaukee',     state: 'WI', msaCode: '0033340', msaName: 'Milwaukee-Waukesha, WI Metro Area' },
  { city: 'waukesha',      state: 'WI', msaCode: '0033340', msaName: 'Milwaukee-Waukesha, WI Metro Area' },

  // Rank 39 — Jacksonville, FL
  { city: 'jacksonville',  state: 'FL', msaCode: '0027260', msaName: 'Jacksonville, FL Metro Area' },

  // Rank 40 — Oklahoma City
  { city: 'oklahoma city', state: 'OK', msaCode: '0036420', msaName: 'Oklahoma City, OK Metro Area' },

  // Rank 41 — Raleigh
  { city: 'raleigh',       state: 'NC', msaCode: '0039580', msaName: 'Raleigh-Cary, NC Metro Area' },
  { city: 'cary',          state: 'NC', msaCode: '0039580', msaName: 'Raleigh-Cary, NC Metro Area' },
  { city: 'durham',        state: 'NC', msaCode: '0020500', msaName: 'Durham-Chapel Hill, NC Metro Area' },
  { city: 'chapel hill',   state: 'NC', msaCode: '0020500', msaName: 'Durham-Chapel Hill, NC Metro Area' },

  // Rank 42 — Memphis
  { city: 'memphis',       state: 'TN', msaCode: '0032820', msaName: 'Memphis, TN-MS-AR Metro Area' },

  // Rank 43 — Richmond
  { city: 'richmond',      state: 'VA', msaCode: '0040060', msaName: 'Richmond, VA Metro Area' },

  // Rank 44 — Louisville
  { city: 'louisville',    state: 'KY', msaCode: '0031140', msaName: 'Louisville/Jefferson County, KY-IN Metro Area' },

  // Rank 45 — New Orleans
  { city: 'new orleans',   state: 'LA', msaCode: '0035380', msaName: 'New Orleans-Metairie, LA Metro Area' },
  { city: 'metairie',      state: 'LA', msaCode: '0035380', msaName: 'New Orleans-Metairie, LA Metro Area' },

  // Rank 46 — Hartford
  { city: 'hartford',      state: 'CT', msaCode: '0025540', msaName: 'Hartford-East Hartford-Middletown, CT Metro Area' },

  // Rank 47 — Buffalo
  { city: 'buffalo',       state: 'NY', msaCode: '0015380', msaName: 'Buffalo-Cheektowaga, NY Metro Area' },
  { city: 'cheektowaga',   state: 'NY', msaCode: '0015380', msaName: 'Buffalo-Cheektowaga, NY Metro Area' },

  // Rank 48 — Birmingham
  { city: 'birmingham',    state: 'AL', msaCode: '0013820', msaName: 'Birmingham-Hoover, AL Metro Area' },
  { city: 'hoover',        state: 'AL', msaCode: '0013820', msaName: 'Birmingham-Hoover, AL Metro Area' },

  // Rank 49 — Salt Lake City
  { city: 'salt lake city', state: 'UT', msaCode: '0041620', msaName: 'Salt Lake City, UT Metro Area' },
  { city: 'salt lake',     state: 'UT', msaCode: '0041620', msaName: 'Salt Lake City, UT Metro Area' },
  { city: 'west valley city', state: 'UT', msaCode: '0041620', msaName: 'Salt Lake City, UT Metro Area' },

  // Rank 50 — Rochester, NY
  { city: 'rochester',     state: 'NY', msaCode: '0040380', msaName: 'Rochester, NY Metro Area' },

  // Rank 51 — Bridgeport-Stamford
  { city: 'bridgeport',    state: 'CT', msaCode: '0014860', msaName: 'Bridgeport-Stamford-Norwalk, CT Metro Area' },
  { city: 'stamford',      state: 'CT', msaCode: '0014860', msaName: 'Bridgeport-Stamford-Norwalk, CT Metro Area' },
  { city: 'norwalk',       state: 'CT', msaCode: '0014860', msaName: 'Bridgeport-Stamford-Norwalk, CT Metro Area' },

  // Rank 52 — Tucson
  { city: 'tucson',        state: 'AZ', msaCode: '0046060', msaName: 'Tucson, AZ Metro Area' },

  // Rank 53 — Urban Honolulu
  { city: 'honolulu',      state: 'HI', msaCode: '0046520', msaName: 'Urban Honolulu, HI Metro Area' },

  // Rank 54 — Tulsa
  { city: 'tulsa',         state: 'OK', msaCode: '0046140', msaName: 'Tulsa, OK Metro Area' },

  // Rank 55 — Fresno
  { city: 'fresno',        state: 'CA', msaCode: '0023420', msaName: 'Fresno, CA Metro Area' },

  // Rank 56 — Worcester
  { city: 'worcester',     state: 'MA', msaCode: '0049340', msaName: 'Worcester, MA-CT Metro Area' },

  // Rank 57 — Omaha
  { city: 'omaha',         state: 'NE', msaCode: '0036540', msaName: 'Omaha-Council Bluffs, NE-IA Metro Area' },
  { city: 'council bluffs', state: 'IA', msaCode: '0036540', msaName: 'Omaha-Council Bluffs, NE-IA Metro Area' },

  // Rank 58 — Greenville-Anderson, SC
  { city: 'greenville',    state: 'SC', msaCode: '0024860', msaName: 'Greenville-Anderson, SC Metro Area' },
  { city: 'anderson',      state: 'SC', msaCode: '0024860', msaName: 'Greenville-Anderson, SC Metro Area' },

  // Rank 59 — Albuquerque
  { city: 'albuquerque',   state: 'NM', msaCode: '0010740', msaName: 'Albuquerque, NM Metro Area' },

  // Rank 60 — Bakersfield
  { city: 'bakersfield',   state: 'CA', msaCode: '0012540', msaName: 'Bakersfield, CA Metro Area' },

  // Rank 61 — Ogden
  { city: 'ogden',         state: 'UT', msaCode: '0036260', msaName: 'Ogden-Clearfield, UT Metro Area' },
  { city: 'clearfield',    state: 'UT', msaCode: '0036260', msaName: 'Ogden-Clearfield, UT Metro Area' },

  // Rank 62 — Knoxville
  { city: 'knoxville',     state: 'TN', msaCode: '0028940', msaName: 'Knoxville, TN Metro Area' },

  // Rank 63 — El Paso
  { city: 'el paso',       state: 'TX', msaCode: '0021340', msaName: 'El Paso, TX Metro Area' },

  // Rank 64 — Baton Rouge
  { city: 'baton rouge',   state: 'LA', msaCode: '0012940', msaName: 'Baton Rouge, LA Metro Area' },

  // Rank 65 — Dayton
  { city: 'dayton',        state: 'OH', msaCode: '0019430', msaName: 'Dayton-Kettering, OH Metro Area' },

  // Rank 66 — McAllen
  { city: 'mcallen',       state: 'TX', msaCode: '0032580', msaName: 'McAllen-Edinburg-Mission, TX Metro Area' },
  { city: 'edinburg',      state: 'TX', msaCode: '0032580', msaName: 'McAllen-Edinburg-Mission, TX Metro Area' },

  // Rank 67 — Syracuse
  { city: 'syracuse',      state: 'NY', msaCode: '0045060', msaName: 'Syracuse, NY Metro Area' },

  // Rank 68 — Cape Coral
  { city: 'cape coral',    state: 'FL', msaCode: '0015980', msaName: 'Cape Coral-Fort Myers, FL Metro Area' },
  { city: 'fort myers',    state: 'FL', msaCode: '0015980', msaName: 'Cape Coral-Fort Myers, FL Metro Area' },

  // Rank 69 — Colorado Springs
  { city: 'colorado springs', state: 'CO', msaCode: '0017820', msaName: 'Colorado Springs, CO Metro Area' },

  // Rank 70 — Poughkeepsie
  { city: 'poughkeepsie',  state: 'NY', msaCode: '0039100', msaName: 'Poughkeepsie-Newburgh-Middletown, NY Metro Area' },
  { city: 'newburgh',      state: 'NY', msaCode: '0039100', msaName: 'Poughkeepsie-Newburgh-Middletown, NY Metro Area' },

  // Rank 71 — Lakeland
  { city: 'lakeland',      state: 'FL', msaCode: '0029460', msaName: 'Lakeland-Winter Haven, FL Metro Area' },
  { city: 'winter haven',  state: 'FL', msaCode: '0029460', msaName: 'Lakeland-Winter Haven, FL Metro Area' },

  // Rank 72 — North Port-Sarasota
  { city: 'sarasota',      state: 'FL', msaCode: '0035840', msaName: 'North Port-Sarasota-Bradenton, FL Metro Area' },
  { city: 'bradenton',     state: 'FL', msaCode: '0035840', msaName: 'North Port-Sarasota-Bradenton, FL Metro Area' },

  // Rank 73 — Youngstown
  { city: 'youngstown',    state: 'OH', msaCode: '0049660', msaName: 'Youngstown-Warren-Boardman, OH-PA Metro Area' },

  // Rank 74 — Springfield, MA
  { city: 'springfield',   state: 'MA', msaCode: '0044140', msaName: 'Springfield, MA Metro Area' },

  // Rank 75 — Scranton
  { city: 'scranton',      state: 'PA', msaCode: '0042540', msaName: 'Scranton--Wilkes-Barre, PA Metro Area' },
  { city: 'wilkes-barre',  state: 'PA', msaCode: '0042540', msaName: 'Scranton--Wilkes-Barre, PA Metro Area' },

  // Rank 76 — Grand Rapids
  { city: 'grand rapids',  state: 'MI', msaCode: '0024340', msaName: 'Grand Rapids-Kentwood, MI Metro Area' },
  { city: 'kentwood',      state: 'MI', msaCode: '0024340', msaName: 'Grand Rapids-Kentwood, MI Metro Area' },

  // Rank 77 — Provo
  { city: 'provo',         state: 'UT', msaCode: '0039340', msaName: 'Provo-Orem, UT Metro Area' },
  { city: 'orem',          state: 'UT', msaCode: '0039340', msaName: 'Provo-Orem, UT Metro Area' },

  // Rank 78 — Reno
  { city: 'reno',          state: 'NV', msaCode: '0039900', msaName: 'Reno, NV Metro Area' },
  { city: 'sparks',        state: 'NV', msaCode: '0039900', msaName: 'Reno, NV Metro Area' },

  // Rank 79 — Oxnard-Ventura
  { city: 'oxnard',        state: 'CA', msaCode: '0037100', msaName: 'Oxnard-Thousand Oaks-Ventura, CA Metro Area' },
  { city: 'thousand oaks', state: 'CA', msaCode: '0037100', msaName: 'Oxnard-Thousand Oaks-Ventura, CA Metro Area' },
  { city: 'ventura',       state: 'CA', msaCode: '0037100', msaName: 'Oxnard-Thousand Oaks-Ventura, CA Metro Area' },

  // Rank 80 — Allentown
  { city: 'allentown',     state: 'PA', msaCode: '0010900', msaName: 'Allentown-Bethlehem-Easton, PA-NJ Metro Area' },
  { city: 'bethlehem',     state: 'PA', msaCode: '0010900', msaName: 'Allentown-Bethlehem-Easton, PA-NJ Metro Area' },

  // Rank 81 — New Haven
  { city: 'new haven',     state: 'CT', msaCode: '0035300', msaName: 'New Haven-Milford, CT Metro Area' },
  { city: 'milford',       state: 'CT', msaCode: '0035300', msaName: 'New Haven-Milford, CT Metro Area' },

  // Rank 82 — Boise
  { city: 'boise',         state: 'ID', msaCode: '0014260', msaName: 'Boise City, ID Metro Area' },

  // Rank 83 — Deltona-Daytona Beach
  { city: 'daytona beach', state: 'FL', msaCode: '0019660', msaName: 'Deltona-Daytona Beach-Ormond Beach, FL Metro Area' },
  { city: 'deltona',       state: 'FL', msaCode: '0019660', msaName: 'Deltona-Daytona Beach-Ormond Beach, FL Metro Area' },

  // Rank 84 — Columbia, SC
  { city: 'columbia',      state: 'SC', msaCode: '0017900', msaName: 'Columbia, SC Metro Area' },

  // Rank 85 — Des Moines
  { city: 'des moines',    state: 'IA', msaCode: '0019780', msaName: 'Des Moines-West Des Moines, IA Metro Area' },
  { city: 'west des moines', state: 'IA', msaCode: '0019780', msaName: 'Des Moines-West Des Moines, IA Metro Area' },

  // Rank 86 — Akron
  { city: 'akron',         state: 'OH', msaCode: '0010420', msaName: 'Akron, OH Metro Area' },

  // Rank 87 — Little Rock
  { city: 'little rock',   state: 'AR', msaCode: '0030780', msaName: 'Little Rock-North Little Rock-Conway, AR Metro Area' },

  // Rank 88 — Palm Bay-Melbourne
  { city: 'palm bay',      state: 'FL', msaCode: '0037340', msaName: 'Palm Bay-Melbourne-Titusville, FL Metro Area' },
  { city: 'melbourne',     state: 'FL', msaCode: '0037340', msaName: 'Palm Bay-Melbourne-Titusville, FL Metro Area' },

  // Rank 89 — Stockton
  { city: 'stockton',      state: 'CA', msaCode: '0044700', msaName: 'Stockton, CA Metro Area' },

  // Rank 90 — Toledo
  { city: 'toledo',        state: 'OH', msaCode: '0045780', msaName: 'Toledo, OH Metro Area' },

  // Rank 91 — Charleston, SC
  { city: 'charleston',    state: 'SC', msaCode: '0016700', msaName: 'Charleston-North Charleston, SC Metro Area' },
  { city: 'north charleston', state: 'SC', msaCode: '0016700', msaName: 'Charleston-North Charleston, SC Metro Area' },

  // Rank 92 — Greensboro
  { city: 'greensboro',    state: 'NC', msaCode: '0024660', msaName: 'Greensboro-High Point, NC Metro Area' },
  { city: 'high point',    state: 'NC', msaCode: '0024660', msaName: 'Greensboro-High Point, NC Metro Area' },

  // Rank 93 — Madison
  { city: 'madison',       state: 'WI', msaCode: '0031540', msaName: 'Madison, WI Metro Area' },

  // Rank 94 — Fayetteville, AR
  { city: 'fayetteville',  state: 'AR', msaCode: '0022220', msaName: 'Fayetteville-Springdale-Rogers, AR Metro Area' },
  { city: 'springdale',    state: 'AR', msaCode: '0022220', msaName: 'Fayetteville-Springdale-Rogers, AR Metro Area' },

  // Rank 95 — Port St. Lucie
  { city: 'port st. lucie', state: 'FL', msaCode: '0038940', msaName: 'Port St. Lucie, FL Metro Area' },

  // Rank 96 — Lansing
  { city: 'lansing',       state: 'MI', msaCode: '0029620', msaName: 'Lansing-East Lansing, MI Metro Area' },
  { city: 'east lansing',  state: 'MI', msaCode: '0029620', msaName: 'Lansing-East Lansing, MI Metro Area' },

  // Rank 97 — Augusta, GA
  { city: 'augusta',       state: 'GA', msaCode: '0012260', msaName: 'Augusta-Richmond County, GA-SC Metro Area' },

  // Rank 98 — Modesto
  { city: 'modesto',       state: 'CA', msaCode: '0033700', msaName: 'Modesto, CA Metro Area' },

  // Rank 99 — Spokane
  { city: 'spokane',       state: 'WA', msaCode: '0044060', msaName: 'Spokane-Spokane Valley, WA Metro Area' },

  // Rank 100 — Harrisburg
  { city: 'harrisburg',    state: 'PA', msaCode: '0025420', msaName: 'Harrisburg-Carlisle, PA Metro Area' },

  // Additional large/notable metros
  { city: 'ann arbor',     state: 'MI', msaCode: '0011460', msaName: 'Ann Arbor, MI Metro Area' },
  { city: 'albany',        state: 'NY', msaCode: '0010580', msaName: 'Albany-Schenectady-Troy, NY Metro Area' },
  { city: 'schenectady',   state: 'NY', msaCode: '0010580', msaName: 'Albany-Schenectady-Troy, NY Metro Area' },
  { city: 'santa rosa',    state: 'CA', msaCode: '0042220', msaName: 'Santa Rosa-Petaluma, CA Metro Area' },
  { city: 'petaluma',      state: 'CA', msaCode: '0042220', msaName: 'Santa Rosa-Petaluma, CA Metro Area' },
  { city: 'worcester',     state: 'MA', msaCode: '0049340', msaName: 'Worcester, MA-CT Metro Area' },
  { city: 'tallahassee',   state: 'FL', msaCode: '0045220', msaName: 'Tallahassee, FL Metro Area' },
  { city: 'huntsville',    state: 'AL', msaCode: '0026620', msaName: 'Huntsville, AL Metro Area' },
  { city: 'chattanooga',   state: 'TN', msaCode: '0016860', msaName: 'Chattanooga, TN-GA Metro Area' },
  { city: 'fargo',         state: 'ND', msaCode: '0022020', msaName: 'Fargo, ND-MN Metro Area' },
  { city: 'savannah',      state: 'GA', msaCode: '0042340', msaName: 'Savannah, GA Metro Area' },
  { city: 'lexington',     state: 'KY', msaCode: '0030460', msaName: 'Lexington-Fayette, KY Metro Area' },
  { city: 'worcester',     state: 'CT', msaCode: '0049340', msaName: 'Worcester, MA-CT Metro Area' },
  { city: 'wichita',       state: 'KS', msaCode: '0048620', msaName: 'Wichita, KS Metro Area' },
  { city: 'anchorage',     state: 'AK', msaCode: '0011260', msaName: 'Anchorage, AK Metro Area' },
  { city: 'lubbock',       state: 'TX', msaCode: '0031180', msaName: 'Lubbock, TX Metro Area' },
  { city: 'madison',       state: 'AL', msaCode: '0026620', msaName: 'Huntsville, AL Metro Area' },
  { city: 'mobile',        state: 'AL', msaCode: '0033660', msaName: 'Mobile, AL Metro Area' },
  { city: 'worcester',     state: 'RI', msaCode: '0039300', msaName: 'Providence-Warwick, RI-MA Metro Area' },
  { city: 'springfield',   state: 'MO', msaCode: '0044180', msaName: 'Springfield, MO Metro Area' },
  { city: 'springfield',   state: 'IL', msaCode: '0044100', msaName: 'Springfield, IL Metro Area' },
  { city: 'peoria',        state: 'IL', msaCode: '0037900', msaName: 'Peoria, IL Metro Area' },
  { city: 'worcester',     state: 'MA', msaCode: '0049340', msaName: 'Worcester, MA-CT Metro Area' },
  { city: 'corpus christi', state: 'TX', msaCode: '0018580', msaName: 'Corpus Christi, TX Metro Area' },
  { city: 'lincoln',       state: 'NE', msaCode: '0030700', msaName: 'Lincoln, NE Metro Area' },
  { city: 'durham',        state: 'NC', msaCode: '0020500', msaName: 'Durham-Chapel Hill, NC Metro Area' },
  { city: 'worcester',     state: 'MA', msaCode: '0049340', msaName: 'Worcester, MA-CT Metro Area' },
];

// ---------------------------------------------------------------------------
// Common aliases — map to canonical city+state
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} CityAlias
 * @property {string} alias  - Lowercase alias or abbreviation
 * @property {string} city   - Canonical city name (must exist in MSA_ENTRIES)
 * @property {string} state  - State abbreviation
 */

/** @type {CityAlias[]} */
export const CITY_ALIASES = [
  { alias: 'nyc',           city: 'new york',       state: 'NY' },
  { alias: 'ny',            city: 'new york',       state: 'NY' },
  { alias: 'new york city', city: 'new york',       state: 'NY' },
  { alias: 'sf',            city: 'san francisco',  state: 'CA' },
  { alias: 'la',            city: 'los angeles',    state: 'CA' },
  { alias: 'l.a.',          city: 'los angeles',    state: 'CA' },
  { alias: 'dc',            city: 'washington',     state: 'DC' },
  { alias: 'dfw',           city: 'dallas',         state: 'TX' },
  { alias: 'dallas fort worth', city: 'dallas',     state: 'TX' },
  { alias: 'bay area',      city: 'san francisco',  state: 'CA' },
  { alias: 'silicon valley', city: 'san jose',      state: 'CA' },
  { alias: 'socal',         city: 'los angeles',    state: 'CA' },
  { alias: 'so cal',        city: 'los angeles',    state: 'CA' },
  { alias: 'south florida', city: 'miami',          state: 'FL' },
  { alias: 'so fla',        city: 'miami',          state: 'FL' },
  { alias: 'twin cities',   city: 'minneapolis',    state: 'MN' },
  { alias: 'philly',        city: 'philadelphia',   state: 'PA' },
  { alias: 'phl',           city: 'philadelphia',   state: 'PA' },
  { alias: 'chi',           city: 'chicago',        state: 'IL' },
  { alias: 'chi-town',      city: 'chicago',        state: 'IL' },
  { alias: 'pdx',           city: 'portland',       state: 'OR' },
  { alias: 'sea',           city: 'seattle',        state: 'WA' },
  { alias: 'atl',           city: 'atlanta',        state: 'GA' },
  { alias: 'bos',           city: 'boston',         state: 'MA' },
  { alias: 'hou',           city: 'houston',        state: 'TX' },
  { alias: 'mia',           city: 'miami',          state: 'FL' },
  { alias: 'den',           city: 'denver',         state: 'CO' },
  { alias: 'phl',           city: 'philadelphia',   state: 'PA' },
  { alias: 'stl',           city: 'st. louis',      state: 'MO' },
];

// ---------------------------------------------------------------------------
// Location parser
// ---------------------------------------------------------------------------

/**
 * Strips common prefixes and suffixes from Indeed location strings and returns
 * a structured city/state object.
 *
 * Handles strings such as:
 *   "Austin, TX"
 *   "Remote"
 *   "Hybrid work in Seattle, WA 98101"
 *   "On-site in New York, NY 10001-2345"
 *   "Chicago, IL (Hybrid)"
 *
 * @param {string} locationString - Raw location text from the job page
 * @returns {{ city: string, state: string, cleaned: string } | null}
 */
export function parseLocation(locationString) {
  if (!locationString || typeof locationString !== 'string') return null;

  let s = locationString.trim();

  // Strip leading work-mode prefixes (case-insensitive)
  s = s.replace(
    /^(remote\s*[-–]?\s*|hybrid\s*work\s*in\s*|hybrid\s*[-–]?\s*|on[-\s]?site\s*in\s*|on[-\s]?site\s*[-–]?\s*|in\s+person\s*in\s*)/i,
    ''
  ).trim();

  // Strip trailing parenthetical annotations like "(Hybrid)", "(Remote)", "(On-site)"
  s = s.replace(/\s*\([^)]*\)\s*$/, '').trim();

  // Strip trailing 5- or 9-digit ZIP codes (e.g., "98101" or "10001-2345")
  s = s.replace(/\s+\d{5}(-\d{4})?\s*$/, '').trim();

  // If nothing remains or it's a bare "Remote"/"Hybrid"/etc., return null
  if (!s || /^(remote|hybrid|on-?site|in person|telecommute|work from home|wfh)$/i.test(s)) {
    return null;
  }

  // Expect "City, ST" format
  const match = s.match(/^(.+?),\s*([A-Z]{2})\s*$/i);
  if (!match) {
    // Try without state — just a city name alone
    const cityOnly = s.trim();
    if (cityOnly.length > 1 && !/\d/.test(cityOnly)) {
      return { city: cityOnly.toLowerCase(), state: null, cleaned: cityOnly };
    }
    return null;
  }

  const city = match[1].trim().toLowerCase();
  const state = match[2].toUpperCase();

  return { city, state, cleaned: `${match[1].trim()}, ${state}` };
}

// ---------------------------------------------------------------------------
// MSA resolver
// ---------------------------------------------------------------------------

/**
 * Resolves a location string to a BLS MSA code, state code, or national fallback.
 *
 * Resolution order:
 *   1. Alias expansion
 *   2. Exact city + state match in MSA_ENTRIES
 *   3. City-only match (ignore state) — first hit wins
 *   4. State-level fallback using STATE_FIPS
 *   5. National fallback
 *
 * @param {string} locationString - Raw location string from a job listing
 * @returns {{ msaCode: string, msaName: string, areaType: 'metro'|'state'|'national' }}
 */
export function resolveMsa(locationString) {
  const NATIONAL = { msaCode: '0000000', msaName: 'National', areaType: /** @type {'national'} */ ('national') };

  const parsed = parseLocation(locationString);
  if (!parsed) return NATIONAL;

  let { city, state } = parsed;

  // 1. Alias expansion
  const alias = CITY_ALIASES.find(a => a.alias === city);
  if (alias) {
    city = alias.city;
    if (!state) state = alias.state;
  }

  // 2. Exact city + state match
  if (state) {
    const exact = MSA_ENTRIES.find(
      e => e.city === city && e.state === state
    );
    if (exact) {
      return { msaCode: exact.msaCode, msaName: exact.msaName, areaType: 'metro' };
    }
  }

  // 3. City-only match (first hit)
  const cityMatch = MSA_ENTRIES.find(e => e.city === city);
  if (cityMatch) {
    return { msaCode: cityMatch.msaCode, msaName: cityMatch.msaName, areaType: 'metro' };
  }

  // 4. Partial city match (substring) — helps with "Fort Worth" finding "dallas"
  //    Only use if no state mismatch
  if (city.length >= 4) {
    const partial = MSA_ENTRIES.find(e => {
      if (state && e.state !== state) return false;
      return e.city.includes(city) || city.includes(e.city);
    });
    if (partial) {
      return { msaCode: partial.msaCode, msaName: partial.msaName, areaType: 'metro' };
    }
  }

  // 5. State fallback
  if (state && STATE_FIPS[state]) {
    const fips = STATE_FIPS[state].padStart(2, '0');
    // BLS state area code is 7 chars: "00XX000" where XX is FIPS
    const stateCode = `00${fips}000`;
    return {
      msaCode: stateCode,
      msaName: `${state} (statewide)`,
      areaType: /** @type {'state'} */ ('state'),
    };
  }

  // 6. National fallback
  return NATIONAL;
}

// ---------------------------------------------------------------------------
// BLS series ID builder
// ---------------------------------------------------------------------------

/**
 * Builds a BLS OEWS series ID from an MSA resolution result and a SOC code.
 *
 * BLS series ID format reference:
 *   https://www.bls.gov/help/hlpforma.htm#OE
 *
 * Format by area type:
 *   Metro:    OEUM{7-digit-MSA}{000000}{6-digit-SOC}{2-digit-datatype}
 *   State:    OEUS{7-digit-state-area}{000000}{6-digit-SOC}{2-digit-datatype}
 *   National: OEUN{0000000}{000000}{6-digit-SOC}{2-digit-datatype}
 *
 * The 6-digit industry field is "000000" (all industries).
 *
 * Common dataType values:
 *   "03" — annual mean wage
 *   "04" — annual median wage (50th percentile)
 *   "01" — employment
 *   "13" — 10th percentile wage
 *   "14" — 25th percentile wage
 *   "15" — 75th percentile wage
 *   "16" — 90th percentile wage
 *
 * @param {{ msaCode: string, msaName: string, areaType: 'metro'|'state'|'national' }} msaResult
 *   Result from resolveMsa()
 * @param {string} socCode
 *   6-character SOC code with hyphen removed, zero-padded (e.g. '151256' for SOC 15-1256)
 * @param {string} [dataType='03']
 *   2-digit BLS data type suffix
 * @returns {string} Full BLS OEWS series ID
 *
 * @example
 *   const msa = resolveMsa('Austin, TX');
 *   buildAreaSeriesId(msa, '151256', '04'); // annual median wage, SOC 15-1256
 *   // => 'OEUM001242000000015125604'
 */
export function buildAreaSeriesId(msaResult, socCode, dataType = '03') {
  const industry = '000000';
  const soc = socCode.replace('-', '').padStart(6, '0');
  const dt = String(dataType).padStart(2, '0');

  switch (msaResult.areaType) {
    case 'metro':
      return `OEUM${msaResult.msaCode}${industry}${soc}${dt}`;

    case 'state': {
      // State area codes use 'S' prefix in BLS series: OEUS + area
      return `OEUS${msaResult.msaCode}${industry}${soc}${dt}`;
    }

    case 'national':
    default:
      return `OEUN0000000${industry}${soc}${dt}`;
  }
}
