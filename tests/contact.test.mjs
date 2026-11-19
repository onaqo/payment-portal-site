// lib/contact.mjs: likely spam is passed to the sales portal with a short spamReason (no visitor text), clean enquiries
// without one, and hard spam stays dropped.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { handleContact, issueFormToken } from '../lib/contact.mjs';
import { ENV, fakeFetch } from './helpers.mjs';

let net, ipN = 0, warn;
const portalCalls = () => net.calls.filter(c => c.url === ENV.SALES_ENQUIRY_URL);
const emails = () => net.calls.filter(c => c.url.startsWith('https://api.resend.com/'));
// Each submission comes from its own address, so the per-address limit does not get in the way.
const meta = () => ({ ip: `192.0.2.${++ipN}`, pageUrl: 'https://aqpay.test/book-a-demo', userAgent: 'test', formToken: issueFormToken(ENV, Date.now() - 5000) });
const ENQUIRY = { form: 'book-a-demo', name: 'Pat Example', email: 'pat@example.test', company: 'Example Ltd', message: 'We would like a demo of the gateway.', consent: true };
const SPAM_MESSAGE = 'We offer SEO services and backlinks to get you on the first page of Google. Reply now.';

beforeEach(() => {
  warn = console.warn; console.warn = () => {};
  net = fakeFetch(url => (url.startsWith('https://api.resend.com/') ? { id: 'email_1' } : { ok: true }));
});
afterEach(() => { net.restore(); console.warn = warn; });

test('a clean enquiry goes to the portal without spamReason', async () => {
  const out = await handleContact(ENQUIRY, ENV, meta());
  assert.equal(out.status, 200);
  const [sent] = portalCalls();
  assert.equal(sent.body.name, 'Pat Example');
  assert.equal('spamReason' in sent.body, false);
  assert.equal(emails().length, 2, 'notification and confirmation');
});

test('likely spam is passed to the portal with the short reason and none of the visitor’s words', async () => {
  const out = await handleContact({ ...ENQUIRY, message: SPAM_MESSAGE }, ENV, meta());
  assert.equal(out.status, 200);
  const sent = portalCalls();
  assert.equal(sent.length, 1);
  const reason = sent[0].body.spamReason;
  assert.equal(reason, 'marketing phrases');
  assert.ok(reason.length <= 200);
  for (const word of SPAM_MESSAGE.split(/\W+/).filter(w => w.length > 3)) assert.ok(!reason.toLowerCase().includes(word.toLowerCase()), `no "${word}" in the reason`);
  // Still emailed, marked, with no confirmation to the sender.
  assert.equal(emails().length, 1);
  assert.match(emails()[0].body.subject, /^\[Likely spam\] /);
});

test('the other likely-spam reason is passed on too', async () => {
  await handleContact({ ...ENQUIRY, message: 'Здравствуйте, предлагаем услуги' }, ENV, meta());
  assert.equal(portalCalls()[0].body.spamReason, 'unexpected script');
});

test('an application judged likely spam keeps its reason when it falls back to a general enquiry', async () => {
  net.restore();
  net = fakeFetch((url, call) => {
    if (url.startsWith('https://api.resend.com/')) return { id: 'email_1' };
    return call.body.form === 'merchant-application' ? new Response('{}', { status: 400 }) : { ok: true };
  });
  const errors = console.error; console.error = () => {};
  try {
    const out = await handleContact({ form: 'merchant-application', name: 'Pat Example', email: 'pat@example.test', phone: '+44 20 7946 0000', company: 'Example Ltd', country: 'United Kingdom', message: SPAM_MESSAGE }, ENV, meta());
    assert.equal(out.status, 200);
  } finally { console.error = errors; }
  const sent = portalCalls();
  assert.deepEqual(sent.map(c => c.body.form), ['merchant-application', 'contact']);
  assert.ok(sent.every(c => c.body.spamReason === 'marketing phrases'));
});

test('hard spam, the honeypot and the per-address limit still drop the enquiry before the portal', async () => {
  const many = 'See http://a.test http://b.test http://c.test http://d.test';
  assert.deepEqual(await handleContact({ ...ENQUIRY, message: many }, ENV, meta()), { status: 200, body: { ok: true } });
  assert.deepEqual(await handleContact({ ...ENQUIRY, hp: 'filled' }, ENV, meta()), { status: 200, body: { ok: true } });
  const same = { ...meta() };
  for (let i = 0; i < 5; i++) await handleContact(ENQUIRY, ENV, same);
  const before = portalCalls().length;
  await handleContact({ ...ENQUIRY, message: SPAM_MESSAGE }, ENV, same);
  assert.equal(before, 5);
  assert.equal(portalCalls().length, 5, 'the sixth from one address is dropped, spam or not');
  assert.ok(portalCalls().every(c => !('spamReason' in c.body)));
});
