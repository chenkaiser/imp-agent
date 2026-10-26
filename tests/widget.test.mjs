import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { JSDOM } from 'jsdom';
import { acceptsWidgetSession, createWidgetSignIn } from '../web/widget-auth.js';

const origin = 'https://ask.impops.work', nonce = 'a'.repeat(43);
const read = file => readFile(new URL('../' + file, import.meta.url), 'utf8');
test('side-panel worker opens only for a top-frame message from the exact Acumatica host', async () => {
  let handler; const opened = [];
  const chrome = { runtime: { id: 'extension', onMessage: { addListener: value => { handler = value; } } }, sidePanel: { setPanelBehavior: async () => {}, open: async options => { opened.push(options.tabId); } } };
  runInNewContext(await read('extensions/ask-imp/background.js'), { chrome, console });
  const sender = { id: 'extension', frameId: 0, tab: { id: 12 }, url: 'https://imp-ttr.acumatica.com/Main' };
  for (const hostile of [{ ...sender, id: 'other-extension' }, { ...sender, frameId: 1 }, { ...sender, url: 'https://imp-ttr.acumatica.com.evil.example/Main' }, { ...sender, url: 'http://imp-ttr.acumatica.com/Main' }]) assert.equal(handler({ type: 'open-ask-imp' }, hostile, () => {}), false);
  assert.equal(handler({ type: 'other' }, sender, () => {}), false);
  assert.deepEqual(opened, []);
  let result;
  assert.equal(handler({ type: 'open-ask-imp' }, sender, value => { result = value; }), true);
  await Promise.resolve(); assert.deepEqual(opened, [12]); assert.equal(result.ok, true);
});
test('widget credentials require the exact popup, origin and one-use nonce', () => {
  const popup = {}, event = { source: popup, origin, data: { type: 'imp-widget-session', nonce } };
  assert.equal(acceptsWidgetSession(event, popup, nonce, origin), true);
  for (const hostile of [{ ...event, origin: 'https://evil.example' }, { ...event, source: {} }, { ...event, data: { ...event.data, nonce: 'b'.repeat(43) } }, { ...event, data: { type: 'other', nonce } }]) {
    assert.equal(acceptsWidgetSession(hostile, popup, nonce, origin), false);
  }
  assert.equal(acceptsWidgetSession(event, undefined, nonce, origin), false);
});
test('widget sign-in handles popup blocking, rejects invalid sessions and accepts only once', () => {
  let listener, result, accepted = 0, status = '';
  const popup = { closed: false, close() { this.closed = true; }, postMessage() {} };
  const host = { location: { origin }, addEventListener(type, handler) { listener = handler; }, open() { return result; } };
  const bridge = createWidgetSignIn({ host, randomSecret: () => nonce, activeSession: s => s?.valid === true, onSession: () => accepted++, onStatus: s => status = s });
  bridge.start(); assert.match(status, /Allow.*popup/);
  result = popup; bridge.start();
  const event = { origin, source: popup, data: { type: 'imp-widget-session', nonce, session: { valid: true } } };
  listener({ ...event, origin: 'https://evil.example' }); assert.equal(accepted, 0);
  listener(event); listener(event); assert.equal(accepted, 1); assert.equal(popup.closed, true);
  popup.closed = false; bridge.start(); listener({ ...event, data: { ...event.data, session: {} } });
  assert.equal(accepted, 1); assert.match(status, /expired/); bridge.cancel();
});
test('only the widget permits the pinned extension to frame it; packaged UI matches the full app', async () => {
  const manifest = JSON.parse(await read('extensions/ask-imp/manifest.json'));
  const id = [...createHash('sha256').update(Buffer.from(manifest.key, 'base64')).digest().subarray(0, 16)].map(x => String.fromCharCode(97 + (x >> 4), 97 + (x & 15))).join('');
  const config = JSON.parse(await read('web/staticwebapp.config.json'));
  const release = JSON.parse(await read('extensions/store/release.json'));
  const allowedIds = [...new Set([id, release.storeExtensionId].filter(Boolean))];
  assert.match(config.globalHeaders['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.deepEqual(config.routes.map(r => r.route), ['/widget', '/widget.html']);
  for (const rule of config.routes) {
    const ancestors = rule.headers['Content-Security-Policy'].match(/frame-ancestors ([^;]+)/)?.[1].split(' ');
    assert.deepEqual(ancestors, allowedIds.map(value => `chrome-extension://${value}`));
    assert.doesNotMatch(rule.headers['Content-Security-Policy'], /unsafe-inline|unsafe-eval|frame-ancestors \*/);
  }
  assert.deepEqual(manifest.permissions, ['sidePanel']);
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://imp-ttr.acumatica.com/*']);
  assert.equal(manifest.content_scripts[0].all_frames, false);
  const widget = await read('web/widget.html'), index = await read('web/index.html');
  assert.equal(widget.replace(/\r\n/g, '\n').replace('<title>Ask IMP widget</title>', '<title>IMP Agent</title>').replace('\n  <link rel="stylesheet" href="/widget.css">', ''), index.replace(/\r\n/g, '\n'));
});
test('widget uses existing persona authorization, chat endpoint and tokens while retaining compact route', async () => {
  const dom = new JSDOM(await read('web/widget.html'), { url: origin + '/widget' });
  for (const name of ['window', 'document', 'location', 'history', 'sessionStorage']) globalThis[name] = dom.window[name];
  const token = 'header.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.sig';
  sessionStorage.setItem('imp-agent.session', JSON.stringify({ id: 'u', name: 'User', token, accessToken: 'erp-fixture', expiresAt: Date.now() + 3600000 }));
  const calls = [];
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/personas')) return Response.json({ personas: ['production'] });
    if (url.endsWith('/config')) return Response.json({ ClientId: 'fixture', AuthorizeUrl: 'https://erp.example/auth', Scope: 'api' });
    if (url.endsWith('/Chat')) { calls.push(options); return new Response('data: {"type":"chunk","text":"Verified production order."}\n\ndata: {"type":"done"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } }); }
    throw new Error('Unexpected request');
  };
  try {
    await import('../web/app.js?widget-test');
    await new Promise(r => setTimeout(r, 30));
    assert.equal(location.pathname, '/widget'); assert.equal(document.getElementById('workspace').hidden, false);
    document.getElementById('question').value = 'list production orders this week';
    document.getElementById('chat-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
    await new Promise(r => setTimeout(r, 30));
    assert.equal(JSON.parse(calls[0].body).persona, 'production');
    assert.equal(calls[0].headers.Authorization, `Bearer ${token}`);
    assert.equal(calls[0].headers['X-Acumatica-Access-Token'], 'erp-fixture');
    document.querySelector('[data-persona="it"]').click(); assert.equal(document.getElementById('selected-persona').textContent, 'Production');
    document.getElementById('sign-out').click(); assert.equal(location.pathname, '/widget');
  } finally { dom.window.close(); }
});
test('popup callback sends a session only to its same-origin opener and does not retain it', async () => {
  const dom = new JSDOM(await read('web/index.html'), { url: origin + '/login?code=fixture&state=expected' });
  for (const name of ['window', 'document', 'location', 'history', 'sessionStorage']) globalThis[name] = dom.window[name];
  const messages = [];
  dom.window.opener = { closed: false, postMessage: (...args) => messages.push(args) };
  sessionStorage.setItem('imp-agent.oauth', JSON.stringify({ verifier: 'fixture', state: 'expected', widgetNonce: nonce, createdAt: Date.now() }));
  const token = 'header.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.sig';
  globalThis.fetch = async url => {
    assert.ok(url.endsWith('/code'));
    return Response.json({ UserId: 'u', Token: token, AccessToken: 'erp-fixture', ExpiresIn: 3600 });
  };
  try {
    await import('../web/app.js?widget-callback'); await new Promise(r => setTimeout(r, 30));
    assert.equal(messages.length, 1); assert.equal(messages[0][1], origin); assert.equal(messages[0][0].nonce, nonce);
    assert.equal(sessionStorage.getItem('imp-agent.session'), null); assert.equal(sessionStorage.getItem('imp-agent.oauth'), null);
    assert.equal(location.search, '');
  } finally { dom.window.close(); }
});
