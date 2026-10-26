import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { createSalesAccessWorkspace } from '../web/sales-access.js';
const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
function setup() {
  const dom = new JSDOM(html, { url: 'https://ask.impops.work/chat' });
  for (const name of ['document', 'location', 'history']) globalThis[name] = dom.window[name];
  const session = { token: 'h.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.s', accessToken: 'erp', expiresAt: Date.now() + 3600000 };
  return { dom, session };
}
test('sales mapping requires review, uses authenticated API and revision, and never renders names as HTML', async () => {
  const { dom, session } = setup(), calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify(options.method === 'PUT' ? {} : { Users: [{ Id: 'u1', Login: 'salesagent1', Name: '<img src=x>', Assignment: { Revision: 3, SalespersonId: null, CreatedUtc: '2026-10-22T00:00:00Z' } }], Salespersons: [{ Id: 'REP1', Name: 'Salesperson One' }] }));
  };
  const workspace = createSalesAccessWorkspace({ getSession: () => session, onUnauthorized() {}, onBack() {} });
  await workspace.open(); assert.equal(location.pathname, '/sales-access');
  assert.equal(document.querySelector('#sales-access-content img'), null);
  document.getElementById('sales-access-rep').value = 'REP1';
  document.querySelector('#sales-access-content form').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  assert.equal(calls.length, 1); assert.match(document.getElementById('sales-access-content').textContent, /salesagent1 will be able to query customers assigned to salesperson REP1/);
  [...document.querySelectorAll('#sales-access-content button')].find(b => b.textContent === 'Save assignment').click(); await tick();
  assert.deepEqual(JSON.parse(calls[1].options.body), { userId: 'u1', salespersonId: 'REP1', expectedRevision: 3 });
  assert.ok(calls.every(c => c.options.headers.Authorization === `Bearer ${session.token}` && c.options.headers['X-Acumatica-Access-Token'] === 'erp'));
  workspace.deactivate(); assert.equal(document.getElementById('sales-access-content').childElementCount, 0); dom.window.close();
});
test('sales access denial shows no assignment editor', async () => {
  const { dom, session } = setup();
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Only administrators can manage sales access.' }), { status: 403 });
  const workspace = createSalesAccessWorkspace({ getSession: () => session, onUnauthorized() {}, onBack() {} });
  await workspace.open(); assert.match(document.getElementById('sales-access-status').textContent, /Only administrators/);
  assert.equal(document.querySelector('#sales-access-content form'), null); workspace.deactivate(); dom.window.close();
});
