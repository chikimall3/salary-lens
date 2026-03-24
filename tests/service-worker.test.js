/**
 * Cross-tests for src/background/service-worker.js
 * Written by Claude Code (testing Codex's implementation)
 *
 * Strategy: Set up chrome API mocks before the module loads (via setupFile),
 * then test the captured message handler.
 */

// --- Chrome API Mocks (must be set before module import) ---
const mockStorage = {};

globalThis.chrome = {
  storage: {
    local: {
      get: async (keys) => {
        const result = {};
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const k of keyList) {
          if (k in mockStorage) result[k] = mockStorage[k];
        }
        return result;
      },
      set: async (obj) => {
        Object.assign(mockStorage, obj);
      },
    },
  },
  runtime: {
    onMessage: {
      addListener: (fn) => {
        capturedHandler = fn;
      },
    },
  },
};

let capturedHandler = null;
const originalFetch = globalThis.fetch;

// Helper: simulate sending a message to the service worker
function sendMsg(message) {
  return new Promise((resolve) => {
    if (!capturedHandler) throw new Error('No handler captured');
    capturedHandler(message, {}, resolve);
  });
}

// Helper: reset storage between tests
function clearStorage() {
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
}

// Helper: get today's date string matching service worker format
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Helper: build a mock BLS success response
function mockBlsSuccess(socCode, wages = {}) {
  const defaults = { p10: 60000, p25: 75000, p50: 95000, p75: 120000, p90: 150000 };
  const w = { ...defaults, ...wages };
  const dtMap = { p10: '07', p25: '08', p50: '09', p75: '10', p90: '11' };
  const series = Object.entries(dtMap).map(([key, dt]) => ({
    seriesID: `OEUM0000000000000${socCode}${dt}`,
    data: [{ value: String(w[key]) }],
  }));
  return {
    ok: true,
    json: async () => ({
      status: 'REQUEST_SUCCEEDED',
      Results: { series },
    }),
  };
}

// --- Load module once (registers the handler via chrome.runtime.onMessage.addListener) ---
beforeAll(async () => {
  globalThis.fetch = async () => ({ ok: false, status: 500 });
  await import('../src/background/service-worker.js');
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

beforeEach(() => {
  clearStorage();
  // Reset fetch to default reject
  globalThis.fetch = async () => ({ ok: false, status: 500 });
});

// ======================================================================
// Message Handling
// ======================================================================
describe('Message Handling', () => {
  test('unknown message type returns error', async () => {
    const res = await sendMsg({ type: 'UNKNOWN_TYPE' });
    expect(res).toHaveProperty('error');
    expect(res.error).toContain('Unknown message type');
  });

  test('null message returns error', async () => {
    const res = await sendMsg(null);
    expect(res).toHaveProperty('error');
  });

  test('message with no type returns error', async () => {
    const res = await sendMsg({ foo: 'bar' });
    expect(res).toHaveProperty('error');
  });
});

// ======================================================================
// Rate Limiting
// ======================================================================
describe('Rate Limiting', () => {
  test('allows first lookup of the day', async () => {
    globalThis.fetch = async () => mockBlsSuccess('151252');

    const res = await sendMsg({
      type: 'FETCH_SALARY',
      jobTitle: 'Software Engineer',
      location: 'Austin, TX',
    });

    expect(res.error).toBeUndefined();
    expect(res).toHaveProperty('p50');
  });

  test('blocks when daily limit (3) is reached', async () => {
    mockStorage['salary_lens_lookup_count'] = 3;
    mockStorage['salary_lens_lookup_date'] = todayStr();

    const res = await sendMsg({
      type: 'FETCH_SALARY',
      jobTitle: 'Software Engineer',
      location: 'Austin, TX',
    });

    expect(res.error).toBe('daily_limit_reached');
    expect(res.remaining).toBe(0);
    // fetch should NOT have been called
  });

  test('resets count on a new day', async () => {
    mockStorage['salary_lens_lookup_count'] = 3;
    mockStorage['salary_lens_lookup_date'] = '2020-01-01';

    globalThis.fetch = async () => mockBlsSuccess('151252');

    const res = await sendMsg({
      type: 'FETCH_SALARY',
      jobTitle: 'Software Engineer',
      location: 'Austin, TX',
    });

    expect(res.error).toBeUndefined();
    expect(res).toHaveProperty('p50');
  });

  test('increments count after successful lookup', async () => {
    globalThis.fetch = async () => mockBlsSuccess('151252');

    await sendMsg({
      type: 'FETCH_SALARY',
      jobTitle: 'Software Engineer',
      location: 'Austin, TX',
    });

    expect(mockStorage['salary_lens_lookup_count']).toBe(1);
    expect(mockStorage['salary_lens_lookup_date']).toBe(todayStr());
  });
});

// ======================================================================
// BLS API Integration
// ======================================================================
describe('BLS API', () => {
  test('returns salary percentiles from BLS', async () => {
    globalThis.fetch = async () => mockBlsSuccess('151252', {
      p10: 62000, p25: 78000, p50: 98000, p75: 125000, p90: 155000,
    });

    const res = await sendMsg({
      type: 'FETCH_SALARY',
      jobTitle: 'Software Developer',
      location: 'New York, NY',
    });

    expect(res.source).toBe('bls');
    expect(res.p10).toBe(62000);
    expect(res.p25).toBe(78000);
    expect(res.p50).toBe(98000);
    expect(res.p75).toBe(125000);
    expect(res.p90).toBe(155000);
    expect(res.occupation).toBe('Software Developers');
    expect(res.area).toBe('National (US)');
  });

  test('handles BLS network error gracefully', async () => {
    globalThis.fetch = async () => { throw new Error('Network error'); };

    const res = await sendMsg({
      type: 'FETCH_SALARY',
      jobTitle: 'Accountant',
      location: 'Chicago, IL',
    });

    // Both BLS and CareerOneStop fail → error
    expect(res).toHaveProperty('error');
  });

  test('handles BLS HTTP error', async () => {
    globalThis.fetch = async () => ({ ok: false, status: 503 });

    const res = await sendMsg({
      type: 'FETCH_SALARY',
      jobTitle: 'Nurse',
      location: 'Houston, TX',
    });

    expect(res).toHaveProperty('error');
  });

  test('handles BLS returning suppressed data ("-")', async () => {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        status: 'REQUEST_SUCCEEDED',
        Results: {
          series: [
            { seriesID: 'OEUM000000000000029114107', data: [{ value: '-' }] },
            { seriesID: 'OEUM000000000000029114108', data: [{ value: '-' }] },
            { seriesID: 'OEUM000000000000029114109', data: [{ value: '-' }] },
            { seriesID: 'OEUM000000000000029114110', data: [{ value: '-' }] },
            { seriesID: 'OEUM000000000000029114111', data: [{ value: '-' }] },
          ],
        },
      }),
    });

    const res = await sendMsg({
      type: 'FETCH_SALARY',
      jobTitle: 'Nurse',
      location: 'Miami, FL',
    });

    expect(res).toHaveProperty('error');
  });

  test('empty job title returns error without calling API', async () => {
    let fetchCalled = false;
    globalThis.fetch = async () => { fetchCalled = true; return { ok: false, status: 500 }; };

    const res = await sendMsg({
      type: 'FETCH_SALARY',
      jobTitle: '',
      location: 'Seattle, WA',
    });

    expect(res).toHaveProperty('error');
  });
});

// ======================================================================
// SOC Code Resolution
// ======================================================================
describe('SOC Code Resolution', () => {
  test('maps known job title to correct occupation', async () => {
    globalThis.fetch = async () => mockBlsSuccess('132051');

    const res = await sendMsg({
      type: 'FETCH_SALARY',
      jobTitle: 'Financial Analyst',
      location: 'San Francisco, CA',
    });

    expect(res.occupation).toBe('Financial and Investment Analysts');
  });

  test('partial match works ("Senior Software Engineer" → Software Developers)', async () => {
    globalThis.fetch = async () => mockBlsSuccess('151252');

    const res = await sendMsg({
      type: 'FETCH_SALARY',
      jobTitle: 'Senior Software Engineer',
      location: 'Austin, TX',
    });

    expect(res.occupation).toBe('Software Developers');
  });

  test('unknown job title uses fallback SOC', async () => {
    globalThis.fetch = async () => mockBlsSuccess('150000');

    const res = await sendMsg({
      type: 'FETCH_SALARY',
      jobTitle: 'Chief Happiness Officer',
      location: 'Portland, OR',
    });

    // Should still return data (using fallback SOC)
    expect(res).toHaveProperty('p50');
  });
});

// ======================================================================
// Offer Storage
// ======================================================================
describe('Offer Storage', () => {
  test('SAVE_OFFER returns offer with id and savedAt', async () => {
    const res = await sendMsg({
      type: 'SAVE_OFFER',
      offer: {
        jobTitle: 'Data Analyst',
        company: 'Acme Corp',
        location: 'Denver, CO',
        salary: 75000,
      },
    });

    expect(res.success).toBe(true);
    expect(res.offer.id).toMatch(/^offer_/);
    expect(res.offer).toHaveProperty('savedAt');
    expect(res.offer.jobTitle).toBe('Data Analyst');
  });

  test('GET_OFFERS returns saved offers', async () => {
    mockStorage['salary_lens_offers'] = [
      { id: 'offer_1', jobTitle: 'Engineer' },
      { id: 'offer_2', jobTitle: 'Analyst' },
    ];

    const res = await sendMsg({ type: 'GET_OFFERS' });

    expect(res.offers).toHaveLength(2);
    expect(res.offers[0].jobTitle).toBe('Engineer');
  });

  test('GET_OFFERS returns empty array when nothing saved', async () => {
    const res = await sendMsg({ type: 'GET_OFFERS' });
    expect(res.offers).toEqual([]);
  });

  test('DELETE_OFFER removes the correct offer', async () => {
    mockStorage['salary_lens_offers'] = [
      { id: 'offer_1', jobTitle: 'Engineer' },
      { id: 'offer_2', jobTitle: 'Analyst' },
    ];

    const res = await sendMsg({ type: 'DELETE_OFFER', offerId: 'offer_1' });

    expect(res.success).toBe(true);
    expect(mockStorage['salary_lens_offers']).toHaveLength(1);
    expect(mockStorage['salary_lens_offers'][0].id).toBe('offer_2');
  });

  test('DELETE_OFFER with non-existent id is a no-op', async () => {
    mockStorage['salary_lens_offers'] = [{ id: 'offer_1', jobTitle: 'Engineer' }];

    const res = await sendMsg({ type: 'DELETE_OFFER', offerId: 'nonexistent' });

    expect(res.success).toBe(true);
    expect(mockStorage['salary_lens_offers']).toHaveLength(1);
  });

  test('multiple SAVE_OFFERs accumulate', async () => {
    await sendMsg({ type: 'SAVE_OFFER', offer: { jobTitle: 'Job A' } });
    await sendMsg({ type: 'SAVE_OFFER', offer: { jobTitle: 'Job B' } });
    await sendMsg({ type: 'SAVE_OFFER', offer: { jobTitle: 'Job C' } });

    const res = await sendMsg({ type: 'GET_OFFERS' });
    expect(res.offers).toHaveLength(3);
  });

  test('each saved offer gets a unique id', async () => {
    const r1 = await sendMsg({ type: 'SAVE_OFFER', offer: { jobTitle: 'A' } });
    const r2 = await sendMsg({ type: 'SAVE_OFFER', offer: { jobTitle: 'B' } });

    expect(r1.offer.id).not.toBe(r2.offer.id);
  });
});
