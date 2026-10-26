import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLookupWarmer } from '../web/lookup-warmer.js';

const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture(fetcher) {
  let time = Date.now(), visible = true;
  let session = { token: 'h.' + btoa(JSON.stringify({ exp: Math.floor(time / 1000) + 7200 })) + '.s', accessToken: 'own-erp', role: 'sales', expiresAt: time + 7200000 };
  const timers = new Map(), calls = []; let next = 0;
  const warmer = createLookupWarmer({ getSession: () => session, enabled: () => true, isVisible: () => visible, now: () => time,
    setTimer: (fn, delay) => { const id = ++next; timers.set(id, { fn, delay }); return id; }, clearTimer: id => timers.delete(id),
    fetcher: (...args) => { calls.push(args); return fetcher(...args); } });
  return { warmer, timers, calls, session, setSession: value => { session = value; }, setVisible: value => { visible = value; },
    advance: ms => { time += ms; }, run: delay => { const [id, task] = [...timers].find(([, t]) => t.delay === delay); timers.delete(id); task.fn(); } };
}
test('preloads once without an LLM call and refreshes every twenty minutes', async () => {
  const f = fixture(async () => new Response(null, { status: 204 }));
  f.warmer.start(); f.warmer.start(); await flush();
  assert.equal(f.calls.length, 1);
  const [url, options] = f.calls[0]; assert.ok(url.endsWith('/lookups/warm')); assert.equal(options.method, 'POST');
  assert.equal(options.headers.Authorization, `Bearer ${f.session.token}`); assert.equal(options.headers['X-Acumatica-Access-Token'], 'own-erp');
  assert.equal(options.cache, 'no-store');
  f.advance(1200000); f.run(1200000); await flush(); assert.equal(f.calls.length, 2);
  f.warmer.stop(); assert.equal(f.timers.size, 0);
});
test('hidden tabs pause warming and refresh overdue metadata when visible', async () => {
  const f = fixture(async () => new Response(null, { status: 204 }));
  f.setVisible(false); f.warmer.start(); assert.equal(f.calls.length, 0);
  f.setVisible(true); f.warmer.start(); await flush();
  f.setVisible(false); f.warmer.start(); assert.equal(f.timers.size, 0);
  f.advance(1500000); f.setVisible(true); f.warmer.start(); await flush(); assert.equal(f.calls.length, 2);
  f.warmer.stop();
});
test('sign-out aborts pending warmup and a late response cannot restart its timer', async () => {
  let finish; const f = fixture(() => new Promise(resolve => { finish = resolve; }));
  f.warmer.start(); f.setSession(null); f.warmer.stop();
  assert.equal(f.calls[0][1].signal.aborted, true);
  finish(new Response(null, { status: 204 })); await flush(); assert.equal(f.timers.size, 0);
});
test('transient failures retry with backoff and authorization denial stops retries', async () => {
  let status = 503; const f = fixture(async () => new Response(null, { status }));
  f.warmer.start(); await flush(); assert.ok([...f.timers.values()].some(t => t.delay === 60000));
  f.warmer.start(); assert.equal(f.calls.length, 1);
  status = 403; f.advance(60000); f.run(60000); await flush();
  assert.equal(f.calls.length, 2); assert.equal(f.timers.size, 0);
  f.warmer.start(); assert.equal(f.calls.length, 2); f.warmer.stop();
});
test('new session warms separately and expired sessions never make requests', async () => {
  const f = fixture(async () => new Response(null, { status: 204 }));
  f.warmer.start(); await flush();
  f.setSession({ ...f.session, accessToken: 'new-session' }); f.warmer.start(); await flush();
  assert.equal(f.calls.length, 2); assert.equal(f.calls[1][1].headers['X-Acumatica-Access-Token'], 'new-session');
  f.advance(8000000); f.warmer.start(); assert.equal(f.calls.length, 2); assert.equal(f.timers.size, 0);
});
