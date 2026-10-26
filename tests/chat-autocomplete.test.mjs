import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { lookupTrigger, retainedSelections, createChatAutocomplete } from '../web/chat-autocomplete.js';
const wait = ms => new Promise(r => setTimeout(r, ms));
function setup(fetcher) {
  const dom = new JSDOM('<form><textarea id="q"></textarea><div id="list" hidden></div><div id="chips"></div><span id="status"></span></form>'); globalThis.document = dom.window.document;
  globalThis.fetch = fetcher; let session = { token: 'own-jwt', accessToken: 'own-erp' };
  const input = document.querySelector('#q'), list = document.querySelector('#list');
  const api = createChatAutocomplete({ input, list, chips: document.querySelector('#chips'), status: document.querySelector('#status'), getSession: () => session, enabled: () => !!session, onUnauthorized: () => { session = null; } });
  const type = text => { input.value = text; input.setSelectionRange(text.length, text.length); input.dispatchEvent(new dom.window.Event('input')); };
  const key = value => input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
  return { dom, input, list, api, type, key };
}
const json = data => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
test('triggers require a word boundary and two characters, preserve dimensions and inline punctuation', () => {
  assert.equal(lookupTrigger('7.27 * 1.05'), null); assert.equal(lookupTrigger('*American*'), null); assert.equal(lookupTrigger('hello #Z'), null); assert.equal(lookupTrigger('ID#ZEB'), null); assert.equal(lookupTrigger('35.83" x 59055\' roll'), null);
  assert.deepEqual(lookupTrigger('price of #ZEB'), { kind: 'item', query: 'ZEB', start: 9, end: 13 });
  assert.equal(lookupTrigger('for *American').kind, 'customer'); assert.equal(lookupTrigger('for *American\n'), null);
});
test('keyboard selection retains exact IDs and removable chips, never sends chat on choosing', async () => {
  let calls = 0;
  const { dom, input, list, api, type, key } = setup(async (url, options) => { calls++; assert.match(url, /kind=item&q=ZEB/); assert.equal(options.headers['X-Acumatica-Access-Token'], 'own-erp'); return json({ items: [{ kind: 'item', id: 'ZEB060300R7 -Z', label: 'Ribbon <script>', unit: 'ROLL' }] }); });
  type('price of #ZEB'); await wait(230); assert.equal(list.hidden, false); assert.equal(list.querySelector('script'), null);
  let otherEnter = false; input.addEventListener('keydown', () => { otherEnter = true; }); key('Enter');
  assert.equal(otherEnter, false); assert.equal(input.value, 'price of #ZEB060300R7 -Z '); assert.deepEqual(api.snapshot(), [{ kind: 'item', id: 'ZEB060300R7 -Z' }]);
  assert.equal(document.querySelectorAll('.lookup-chip').length, 1); document.querySelector('.lookup-chip button').click(); assert.deepEqual(api.snapshot(), []); assert.equal(input.value, 'price of  ');
  assert.equal(calls, 1); api.reset(); dom.window.close();
});
test('debounce suppresses intermediate requests and stale responses cannot replace new suggestions', async () => {
  let complete;
  const { dom, type, list, api } = setup(async url => url.includes('q=ZE') ? new Promise(resolve => { complete = resolve; }) : json({ items: [{ kind: 'item', id: 'NEW', label: 'New' }] }));
  type('#ZE'); await wait(220); type('#AB'); await wait(220); assert.equal(list.textContent, 'NEWNew'); complete(json({ items: [{ kind: 'item', id: 'OLD', label: 'Old' }] })); await wait(10); assert.equal(list.textContent, 'NEWNew'); api.reset(); dom.window.close();
});
test('edited tokens invalidate selection and reset removes session data', async () => {
  const { dom, type, key, input, api } = setup(async () => json({ items: [{ kind: 'customer', id: 'LLT001', label: 'Brook + Whittle' }] }));
  type('for *Brook'); await wait(220); key('Enter'); assert.equal(api.snapshot()[0].id, 'LLT001');
  type('for *LLT002'); assert.deepEqual(api.snapshot(), []); api.reset(); assert.equal(document.querySelector('#chips').textContent, '');
  assert.deepEqual(retainedSelections('#ITEM123', [{ kind: 'item', id: 'ITEM', label: 'Wrong' }]), []); input.blur(); dom.window.close();
});
test('Escape, IME, and reset do not pick a customer or leak old-session suggestions', async () => {
  let calls = 0;
  const { dom, type, key, list, api, input } = setup(async () => { calls++; return json({ items: [{ kind: 'customer', id: 'C1', label: 'Customer' }] }); });
  input.dispatchEvent(new dom.window.Event('compositionstart')); type('*American'); await wait(220); assert.equal(calls, 0);
  input.dispatchEvent(new dom.window.Event('compositionend')); await wait(220); assert.equal(list.hidden, false); key('Escape'); assert.equal(list.hidden, true); assert.deepEqual(api.snapshot(), []);
  type('*American'); api.reset(); await wait(220); assert.equal(calls, 1); dom.window.close();
});
