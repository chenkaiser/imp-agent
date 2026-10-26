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

test('visible signed-in chat warms catalogs without waiting and sign-out cancels it', async () => {
  const dom = setup('https://ask.impops.work/personas');
  Object.defineProperty(document, 'hidden', { value: false });
  sessionStorage.setItem('imp-agent.session', JSON.stringify({ id: 'u', name: 'User', role: 'sales', token: jwt(), accessToken: 'erp', expiresAt: Date.now() + 3600000 }));
  let warmOptions, finishWarm;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/personas')) return json({ personas: ['sales'], role: 'sales' });
    if (url.endsWith('/config')) return json(config);
    if (url.endsWith('/lookups/warm')) { warmOptions = options; return new Promise(resolve => { finishWarm = resolve; }); }
    throw new Error('Unexpected request');
  };
  await import('../web/app.js?test=warm-login'); await tick();
  assert.equal(document.getElementById('workspace').hidden, false); assert.equal(location.pathname, '/chat');
  assert.equal(warmOptions.method, 'POST'); assert.equal(warmOptions.headers['X-Acumatica-Access-Token'], 'erp');
  document.getElementById('sign-out').click(); assert.equal(warmOptions.signal.aborted, true);
  finishWarm(new Response(null, { status: 204 })); await tick(); dom.window.close();
});

for (const [id, label] of [['sales', 'Sales Representative'], ['service', 'Customer Service Representative'], ['production', 'Production']]) {
  for (const callback of [true, false]) {
    test(`automatically opens the sole ${id} persona after ${callback ? 'OAuth login' : 'session restore'}`, async () => {
      const dom = setup(callback ? 'https://ask.impops.work/login?code=valid&state=good' : 'https://ask.impops.work/personas');
      if (callback) sessionStorage.setItem('imp-agent.oauth', JSON.stringify({ verifier: 'verifier', state: 'good', createdAt: Date.now() }));
      else sessionStorage.setItem('imp-agent.session', JSON.stringify({ id: 'u', name: 'User', role: 'executive', token: jwt(), accessToken: 'erp', expiresAt: Date.now() + 3600000 }));
      const calls = [];
      globalThis.fetch = async url => {
        calls.push(url);
        if (url.endsWith('/personas')) return json({ personas: [id, id, 'unknown'], role: id });
        if (url.endsWith('/config')) return json(config);
        if (url.endsWith('/code')) return json({ UserId: 'u', Token: jwt(), AccessToken: 'erp', ExpiresIn: 3600, FirstName: 'User', Rolename: id });
        throw new Error('No automatic chat request expected');
      };
      await import(`../web/app.js?test=auto-${id}-${callback}`); await tick();
      assert.equal(location.pathname, '/chat');
      assert.equal(document.getElementById('workspace').hidden, false);
      assert.equal(document.getElementById('persona-screen').hidden, true);
      assert.equal(document.getElementById('selected-persona').textContent, label);
      assert.equal(document.getElementById('header-persona').textContent, label);
      assert.equal(document.getElementById('change-persona').hidden, true);
      assert.equal(document.getElementById('mobile-persona').hidden, true);
      assert.equal(document.activeElement.id, 'question');
      if (id === 'production') {
        assert.match(document.getElementById('lookup-hint').textContent, /production order/);
        assert.match(document.getElementById('question').placeholder, /product log/);
      }
      assert.equal(calls.some(url => url.endsWith('/Chat')), false);
      document.getElementById('sign-out').click(); dom.window.close();
    });
  }
}

test('no recognized server personas cannot automatically open chat', async () => {
  const dom = setup('https://ask.impops.work/personas');
  sessionStorage.setItem('imp-agent.session', JSON.stringify({ id: 'u', name: 'User', role: 'sales', token: jwt(), accessToken: 'erp', expiresAt: Date.now() + 3600000 }));
  globalThis.fetch = async url => {
    if (url.endsWith('/personas')) return json({ personas: ['unknown'], role: 'sales' });
    if (url.endsWith('/config')) return json(config);
    throw new Error('Unexpected request');
  };
  await import('../web/app.js?test=auto-no-personas'); await tick();
  assert.equal(location.pathname, '/personas');
  assert.equal(document.getElementById('workspace').hidden, true);
  assert.equal(document.getElementById('persona-screen').hidden, false);
  document.getElementById('persona-sign-out').click(); dom.window.close();
});

test('live progress updates the animated pending message and stops on the final answer', async () => {
  const dom = setup('https://ask.impops.work/login?code=valid-code&state=good');
  sessionStorage.setItem('imp-agent.oauth', JSON.stringify({ verifier: 'verifier', state: 'good', createdAt: Date.now() }));
  let stream;
  globalThis.fetch = async url => {
    if (url.endsWith('/config')) return json(config);
    if (url.endsWith('/personas')) return json({ personas: ['sales', 'service'], role: 'manager' });
    if (url.endsWith('/code')) return json({ UserId: '123', Token: jwt(), AccessToken: 'erp-access', ExpiresIn: 3600, FirstName: 'Test', Rolename: 'manager' });
    if (url.endsWith('/Chat')) return new Response(new ReadableStream({ start(controller) { stream = controller; } }), { headers: { 'Content-Type': 'text/event-stream' } });
    throw new Error('Unexpected endpoint');
  };
  await import('../web/app.js?test=progress'); await tick();
  document.querySelector('[data-persona="sales"]').click();
  document.getElementById('question').value = 'price of I1 for customer C1';
  document.getElementById('chat-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true })); await tick();
  const send = event => stream.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
  send({ type: 'progress', message: 'Finding customer information…' }); await tick();
  assert.equal(document.querySelector('.assistant.pending').getAttribute('aria-busy'), 'true');
  assert.equal(document.querySelector('.assistant .message-body').textContent, 'Finding customer information…');
  send({ type: 'progress', message: 'Looking up sales history…' }); await tick();
  assert.equal(document.getElementById('chat-status').textContent, 'Looking up sales history…');
  send({ type: 'chunk', text: 'Verified price answer' }); send({ type: 'done' }); stream.close(); await tick();
  assert.equal(document.querySelector('.assistant.pending'), null);
  assert.equal(document.querySelector('.assistant').getAttribute('aria-busy'), 'false');
  assert.equal(document.querySelector('.assistant .message-body').textContent, 'Verified price answer');
  document.getElementById('mobile-sign-out').click();
  dom.window.close();
});

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
    if (url.endsWith('/personas')) return json({ personas: ['sales', 'service'], role: 'manager' });
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
  assert.equal(document.getElementById('change-persona').hidden, false);
  assert.equal(document.getElementById('mobile-persona').hidden, false);
  assert.equal(document.querySelectorAll('[data-persona]').length, 5);
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
  assert.equal(firstChat.persona, 'sales');
  assert.equal(document.querySelectorAll('#messages img').length, 0);
  assert.equal(document.querySelector('.assistant .message-body').textContent, 'Inventory answer');
  assert.ok(document.querySelector('.assistant .formatted-answer p'), 'completed streamed answers use the readable renderer');
  document.getElementById('mobile-persona').click();
  assert.equal(document.getElementById('persona-screen').hidden, false);
  assert.equal(document.getElementById('messages').childElementCount, 0);
  document.querySelector('[data-persona="service"]').click();
  assert.equal(document.getElementById('selected-persona').textContent, 'Customer Service Representative');
  assert.equal(document.getElementById('user-role').textContent, 'manager');
  document.getElementById('question').value = 'Help with configuration';
  document.getElementById('chat-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true })); await tick();
  const secondChat = calls.filter(call => call.url.endsWith('/Chat'))[1];
  assert.match(JSON.parse(secondChat.options.body).message, /Customer Service Representative/);
  assert.notEqual(JSON.parse(secondChat.options.body).conversationId, firstChat.conversationId);
  assert.equal(secondChat.options.headers.Authorization, `Bearer ${token}`);
  document.getElementById('mobile-sign-out').click();
  assert.equal(sessionStorage.getItem('imp-agent.session'), null);
  assert.equal(document.getElementById('workspace').hidden, true);
  assert.equal(document.getElementById('persona-screen').hidden, true);
  assert.equal(document.getElementById('messages').childElementCount, 0);
  dom.window.close();
});


for (const [role, extra] of [['systemadmin', 'it'], ['executive', 'executive'], ['manager', null], ['sales', null]]) {
  test(`persona selection uses server permissions for ${role}, despite forged session labels`, async () => {
    const dom = setup('https://ask.impops.work/personas');
    sessionStorage.setItem('imp-agent.session', JSON.stringify({ id: 'u', name: 'User', role: 'executive', token: jwt(), accessToken: 'erp', expiresAt: Date.now() + 3600000 }));
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/personas')) return json({ personas: ['sales', ...(role === 'sales' ? [] : ['service', 'production']), ...(extra ? [extra] : [])], role });
      if (url.endsWith('/config')) return json(config);
      throw new Error('Unexpected request: ' + url);
    };
    await import(`../web/app.js?test=persona-${role}`); await tick();
    for (const id of ['sales', 'service', 'production', 'it', 'executive']) {
      const card = document.querySelector(`[data-persona="${id}"]`);
      assert.equal(card.hidden, !['sales', ...(role === 'sales' ? [] : ['service', 'production']), extra].includes(id));
      assert.equal(card.disabled, card.hidden);
    }
    const forbidden = extra === 'it' ? 'executive' : 'it';
    const card = document.querySelector(`[data-persona="${forbidden}"]`);
    card.hidden = false; card.disabled = false; card.click();
    assert.equal(document.getElementById('workspace').hidden, role !== 'sales', 'DOM tampering cannot select a forbidden persona');
    if (role === 'sales') assert.equal(document.getElementById('selected-persona').textContent, 'Sales Representative');
    document.getElementById('mobile-kpi').click();
    if (extra !== 'executive') assert.equal(document.getElementById('kpi-screen').hidden, true);
    const access = calls.find(c => c.url.endsWith('/personas'));
    assert.equal(access.options.headers.Authorization.startsWith('Bearer '), true);
    document.getElementById('persona-sign-out').click(); dom.window.close();
  });
}

test('restricted deep links and failed capability lookups cannot open privileged workspaces', async () => {
  const dom = setup('https://ask.impops.work/sales-access');
  sessionStorage.setItem('imp-agent.session', JSON.stringify({ id: 'u', name: 'User', role: 'systemadmin', token: jwt(), accessToken: 'erp', expiresAt: Date.now() + 3600000 }));
  globalThis.fetch = async url => {
    if (url.endsWith('/personas')) return new Response('{}', { status: 503 });
    if (url.endsWith('/config')) return json(config);
    throw new Error('No privileged endpoint may be called');
  };
  await import('../web/app.js?test=persona-fail-closed'); await tick();
  assert.equal(document.getElementById('sales-access-screen').hidden, true);
  assert.equal(document.getElementById('workspace').hidden, true);
  assert.match(document.getElementById('persona-status').textContent, /Unable to verify/);
  document.getElementById('persona-sign-out').click(); dom.window.close();
});


test('a server role downgrade removes the active restricted persona after a forbidden chat response', async () => {
  const dom = setup('https://ask.impops.work/personas');
  sessionStorage.setItem('imp-agent.session', JSON.stringify({ id: 'u', name: 'User', role: 'systemadmin', token: jwt(), accessToken: 'erp', expiresAt: Date.now() + 3600000 }));
  let capabilityReads = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/personas')) {
      capabilityReads++;
      return json({ personas: capabilityReads === 1 ? ['sales', 'service', 'it'] : ['sales'], role: capabilityReads === 1 ? 'systemadmin' : 'sales' });
    }
    if (url.endsWith('/config')) return json(config);
    if (url.endsWith('/Chat')) {
      assert.equal(JSON.parse(options.body).persona, 'it');
      return new Response(JSON.stringify({ error: 'The IT Admin persona requires the SystemAdmin account role.' }), { status: 403 });
    }
    throw new Error('Unexpected endpoint');
  };
  await import('../web/app.js?test=persona-role-downgrade'); await tick();
  document.querySelector('[data-persona="it"]').click();
  document.getElementById('question').value = 'Help with configuration';
  document.getElementById('chat-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true })); await tick();
  assert.equal(capabilityReads, 2); assert.equal(document.getElementById('workspace').hidden, false);
  assert.equal(document.getElementById('selected-persona').textContent, 'Sales Representative');
  assert.equal(location.pathname, '/chat');
  assert.equal(document.querySelector('[data-persona="it"]').hidden, true);
  assert.match(document.getElementById('persona-status').textContent, /requires the SystemAdmin/);
  assert.equal(document.getElementById('messages').childElementCount, 0);
  document.getElementById('persona-sign-out').click(); dom.window.close();
});


test('per-user concurrency rejection displays the server retry guidance without starting a stream', async () => {
  const dom = setup('https://ask.impops.work/personas');
  sessionStorage.setItem('imp-agent.session', JSON.stringify({ id: 'u', name: 'User', role: 'sales', token: jwt(), accessToken: 'erp', expiresAt: Date.now() + 3600000 }));
  globalThis.fetch = async url => {
    if (url.endsWith('/personas')) return json({ personas: ['sales'], role: 'sales' });
    if (url.endsWith('/config')) return json(config);
    if (url.endsWith('/Chat')) return new Response(JSON.stringify({ error: 'Wait for one of your active queries to finish, or stop it.' }), { status: 429, headers: { 'Retry-After': '5' } });
    throw new Error('Unexpected endpoint');
  };
  await import('../web/app.js?test=concurrency-limit'); await tick();
  document.querySelector('[data-persona="sales"]').click();
  document.getElementById('question').value = 'latest 3 completed sales orders';
  document.getElementById('chat-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true })); await tick();
  assert.match(document.querySelector('.assistant .message-body').textContent, /Wait for one of your active queries/);
  assert.equal(document.querySelector('.assistant.pending'), null);
  document.getElementById('mobile-sign-out').click(); dom.window.close();
});

test('autocomplete selections are submitted as exact IDs alongside the readable question', async () => {
  const dom = setup('https://ask.impops.work/login?code=valid-code&state=good');
  sessionStorage.setItem('imp-agent.oauth', JSON.stringify({ verifier: 'verifier', state: 'good', createdAt: Date.now() }));
  let posted;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/config')) return json(config);
    if (url.endsWith('/personas')) return json({ personas: ['sales'], role: 'sales' });
    if (url.endsWith('/code')) return json({ UserId: '123', Token: jwt(), AccessToken: 'erp', ExpiresIn: 3600, FirstName: 'Test', Rolename: 'sales' });
    if (url.includes('/lookups?')) return json({ items: url.includes('kind=item') ? [{ kind: 'item', id: 'ITEM1', label: 'Ribbon' }] : [{ kind: 'customer', id: 'C1', label: 'Customer One' }] });
    if (url.endsWith('/Chat')) { posted = JSON.parse(options.body); return new Response('data: {"type":"chunk","text":"Verified"}\n\ndata: {"type":"done"}\n\n', { headers: { 'content-type': 'text/event-stream' } }); }
    throw new Error('Unexpected endpoint');
  };
  await import('../web/app.js?test=autocomplete-submit'); await tick(); document.querySelector('[data-persona="sales"]').click();
  const input = document.getElementById('question');
  const type = text => { input.value = text; input.setSelectionRange(text.length, text.length); input.dispatchEvent(new dom.window.Event('input')); };
  type('what is price of #IT'); await new Promise(r => setTimeout(r, 230)); input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
  type(input.value + 'for *Customer'); await new Promise(r => setTimeout(r, 230)); input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
  document.getElementById('chat-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true })); await tick();
  assert.deepEqual(posted.selections, [{ kind: 'item', id: 'ITEM1' }, { kind: 'customer', id: 'C1' }]);
  assert.match(posted.message, /#ITEM1 for \*C1/); assert.equal(document.getElementById('lookup-chips').hidden, true);
  document.getElementById('sign-out').click(); dom.window.close();
});
