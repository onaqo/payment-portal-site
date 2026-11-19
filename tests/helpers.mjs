// Shared bits for the tests: a fake fetch that records what is sent and answers from a table, and test settings.
// Nothing here reaches the network; the key below is a made-up test value.

export const ENV = {
  SALES_ENQUIRY_URL: 'https://portal.test/api/public/sales/enquiries',
  SALES_ENQUIRY_KEY: 'enq_test_only',
  RESEND_API_KEY: 're_test_only',
  CONTACT_FROM: 'AQ Pay <hello@example.test>',
  CONTACT_TO: 'team@example.test',
};

/**
 * Replaces globalThis.fetch. `answer(url, init)` returns the JSON to answer with, a Response, or a Promise of either;
 * undefined answers `{}`. Returns the list of calls ({ url, method, body }) and a function that puts fetch back.
 */
export function fakeFetch(answer = () => ({})) {
  const real = globalThis.fetch, calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const call = { url: String(url), method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : undefined, headers: init.headers || {} };
    calls.push(call);
    const out = await answer(call.url, call);
    if (out instanceof Response) return out;
    return new Response(JSON.stringify(out ?? {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  return { calls, restore: () => { globalThis.fetch = real; } };
}

export const tick = () => new Promise(r => setImmediate(r));
export async function settle(n = 10) { for (let i = 0; i < n; i++) await tick(); }
