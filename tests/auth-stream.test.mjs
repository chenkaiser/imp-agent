import { test } from 'node:test';
import assert from 'node:assert/strict';
import { challenge, authorizeUrl, normalizeUser, activeSession, consumeSSE } from '../web/lib.js';

test('PKCE S256 matches RFC 7636 example', async () => {
  assert.equal(await challenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});
test('Acumatica sign-in carries the exact callback and PKCE parameters', async () => {
  const url = new URL(await authorizeUrl({ ClientId: 'id@company', AuthorizeUrl: 'https://erp.example/identity/connect/authorize', Scope: 'openid api' }, 'https://ask.impops.work', 'verifier', 'nonce'));
  assert.equal(url.searchParams.get('redirect_uri'), 'https://ask.impops.work/login');
  assert.equal(url.searchParams.get('client_id'), 'id@company');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('prompt'), 'login');
  assert.equal(url.searchParams.get('state'), 'nonce');
  assert.equal(url.searchParams.get('client_secret'), null);
  await assert.rejects(authorizeUrl({ AuthorizeUrl: 'http://erp.example' }, 'https://ask.impops.work', 'verifier', 'nonce'));
});
test('auth response accepts backend PascalCase and lowercase, rejects partial sessions', () => {
  const user = normalizeUser({ UserId: '123', Token: 'jwt', AccessToken: 'erp', FirstName: 'Kai', LastName: 'Chen', ExpiresIn: 3600 }, 1000);
  assert.equal(user.name, 'Kai Chen'); assert.equal(user.expiresAt, 3601000);
  assert.equal(normalizeUser({ userid: '123', token: 'jwt', accesstoken: 'erp', expiresin: 10 }, 1000).accessToken, 'erp');
  assert.throws(() => normalizeUser({ UserId: '123', Token: 'jwt' }));
});
test('both IMP and Acumatica token lifetimes bound the session', () => {
  const token = 'a.' + btoa(JSON.stringify({ exp: 10 })) + '.c';
  assert.equal(activeSession({ token, accessToken: 'erp', expiresAt: 12000 }, 1000), true);
  assert.equal(activeSession({ token, accessToken: 'erp', expiresAt: 12000 }, 10000), false);
  assert.equal(activeSession({ token, accessToken: 'erp', expiresAt: 1000 }, 1000), false);
  assert.equal(activeSession({ token: 'bad', accessToken: 'erp', expiresAt: 12000 }, 1000), false);
});
test('SSE preserves fragmented events and handles CRLF and final unterminated frames', () => {
  const events = [];
  let buffer = consumeSSE('data: {"type":"chunk","text":"Hel', item => events.push(item));
  assert.equal(events.length, 0);
  buffer = consumeSSE(buffer + 'lo"}\r\n\r\ndata: {"type":"done"}', item => events.push(item));
  consumeSSE(buffer, item => events.push(item), true);
  assert.deepEqual(events, [{ type: 'chunk', text: 'Hello' }, { type: 'done' }]);
});
