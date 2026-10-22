import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
function setup(url) {
  const dom = new JSDOM(html, { url });
  for (const name of ['document', 'location', 'history', 'sessionStorage']) globalThis[name] = dom.window[name];
  return dom;
}
const config = { ClientId: 'client@tenant', AuthorizeUrl: 'https://erp.example/identity/connect/authorize', Scope: 'openid api' };
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
const json = data => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
const jwt = () => 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.sig';

test('invalid OAuth state never exchanges a code or opens the workspace', async () => {
  const dom = setup('https://ask.impops.work/login?code=untrusted&state=bad');
  sessionStorage.setItem('imp-agent.oauth', JSON.stringify({ verifier: 'verifier', state: 'good', createdAt: Date.now() }));
  const calls = [];
  globalThis.fetch = async url => { calls.push(url); return json(config); };
  await import('../web/app.js?test=invalid-state'); await tick();
  assert.equal(calls.length, 1); assert.ok(calls[0].endsWith('/config'));
  assert.equal(document.getElementById('workspace').hidden, true);
  assert.match(document.getElementById('login-status').textContent, /could not be verified/);
  assert.equal(location.search, ''); assert.equal(sessionStorage.getItem('imp-agent.oauth'), null);
  dom.window.close();
});

test('Acumatica callback requires persona selection; chat carries context and both tokens; switching preserves permissions', async () => {
  const dom = setup('https://ask.impops.work/login?code=valid-code&state=good');
  sessionStorage.setItem('imp-agent.oauth', JSON.stringify({ verifier: 'verifier', state: 'good', createdAt: Date.now() }));
  const calls = [];
  const token = jwt();
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/config')) return json(config);
    if (url.endsWith('/code')) return json({ UserId: '123', Token: token, AccessToken: 'erp-access', ExpiresIn: 3600, FirstName: 'Test', Rolename: 'manager' });
    if (url.endsWith('/Chat')) {
      const chunks = ['data: {"type":"chunk","text":"Inventory ', 'answer"}\n\ndata: {"type":"done"}\n\n'];
      return new Response(new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk)); controller.close(); } }), { headers: { 'Content-Type': 'text/event-stream' } });
    }
    throw new Error('Unexpected endpoint');
  };
  await import('../web/app.js?test=valid-callback'); await tick();
  assert.equal(document.getElementById('workspace').hidden, true);
  assert.equal(document.getElementById('persona-screen').hidden, false);
  assert.equal(location.pathname, '/personas');
  assert.equal(document.querySelectorAll('[data-persona]').length, 4);
  // Even programmatic submission cannot bypass the persona selection screen.
  document.getElementById('question').value = 'Premature question';
  document.getElementById('chat-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true })); await tick();
  assert.equal(calls.filter(call => call.url.endsWith('/Chat')).length, 0);
  document.querySelector('[data-persona="sales"]').click();
  assert.equal(document.getElementById('workspace').hidden, false);
  assert.equal(document.getElementById('persona-screen').hidden, true);
  assert.equal(location.pathname, '/chat');
  assert.equal(document.getElementById('selected-persona').textContent, 'Sales Representative');
  assert.equal(document.getElementById('user-name').textContent, 'Test');
  const codeCall = calls.find(call => call.url.endsWith('/code'));
  assert.deepEqual(JSON.parse(codeCall.options.body), { code: 'valid-code', codeVerifier: 'verifier', redirectUri: 'https://ask.impops.work/login' });
  document.getElementById('question').value = '<img src=x onerror=alert(1)> stock?';
  document.getElementById('chat-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true })); await tick();
  const chat = calls.find(call => call.url.endsWith('/Chat'));
  assert.equal(chat.options.headers.Authorization, `Bearer ${token}`);
  assert.equal(chat.options.headers['X-Acumatica-Access-Token'], 'erp-access');
  const firstChat = JSON.parse(chat.options.body);
  assert.match(firstChat.message, /Sales Representative/);
  assert.equal(document.querySelectorAll('#messages img').length, 0);
  assert.equal(document.querySelector('.assistant .message-body').textContent, 'Inventory answer');
  document.getElementById('mobile-persona').click();
  assert.equal(document.getElementById('persona-screen').hidden, false);
  assert.equal(document.getElementById('messages').childElementCount, 0);
  document.querySelector('[data-persona="it"]').click();
  assert.equal(document.getElementById('selected-persona').textContent, 'IT Admin');
  assert.equal(document.getElementById('user-role').textContent, 'manager');
  document.getElementById('question').value = 'Help with configuration';
  document.getElementById('chat-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true })); await tick();
  const secondChat = calls.filter(call => call.url.endsWith('/Chat'))[1];
  assert.match(JSON.parse(secondChat.options.body).message, /IT Admin/);
  assert.notEqual(JSON.parse(secondChat.options.body).conversationId, firstChat.conversationId);
  assert.equal(secondChat.options.headers.Authorization, `Bearer ${token}`);
  document.getElementById('mobile-sign-out').click();
  assert.equal(sessionStorage.getItem('imp-agent.session'), null);
  assert.equal(document.getElementById('workspace').hidden, true);
  assert.equal(document.getElementById('persona-screen').hidden, true);
  assert.equal(document.getElementById('messages').childElementCount, 0);
  dom.window.close();
});
