import { API_BASE } from './config.js';
import { activeSession } from './lib.js';

// Warm only the signed-in session's metadata. Prices and access grants stay live.
export function createLookupWarmer({ getSession, enabled, isVisible = () => !document.hidden,
  fetcher = (...args) => fetch(...args), now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout }) {
  const interval = 20 * 60 * 1000, retry = 60 * 1000;
  let identity = null, controller = null, timer, lastSuccess = -Infinity, retryAt = 0, blocked = false;
  const key = session => `${session.token}:${session.accessToken}:${session.role}`;
  function stop() {
    identity = null; controller?.abort(); controller = null; clearTimer(timer); timer = undefined;
    lastSuccess = -Infinity; retryAt = 0; blocked = false;
  }
  function schedule(delay) { clearTimer(timer); timer = setTimer(start, delay); }
  async function warm(session, currentKey) {
    const request = new AbortController(); controller = request;
    const deadline = setTimer(() => request.abort(), 45000);
    try {
      const response = await fetcher(`${API_BASE}/v1/Chat/lookups/warm`, { method: 'POST',
        headers: { Authorization: `Bearer ${session.token}`, 'X-Acumatica-Access-Token': session.accessToken },
        cache: 'no-store', signal: request.signal });
      if (identity !== currentKey || request.signal.aborted) return;
      if (response.status === 401 || response.status === 403) { blocked = true; return; }
      if (!response.ok) throw new Error('Warmup unavailable');
      lastSuccess = now(); retryAt = 0;
    } catch { if (identity === currentKey) retryAt = now() + retry; }
    finally {
      clearTimer(deadline);
      if (controller === request) {
        controller = null;
        if (!blocked && identity === currentKey && isVisible() && activeSession(getSession(), now()) && enabled())
          schedule(Math.max(0, lastSuccess + interval - now(), retryAt - now()));
      }
    }
  }
  function start() {
    const session = getSession();
    if (!enabled() || !activeSession(session, now())) { stop(); return; }
    const currentKey = key(session);
    if (identity !== currentKey) { stop(); identity = currentKey; }
    clearTimer(timer); timer = undefined;
    if (!isVisible() || blocked || controller) return;
    const delay = Math.max(lastSuccess + interval, retryAt) - now();
    if (delay > 0) { schedule(delay); return; }
    void warm(session, currentKey);
  }
  return { start, stop };
}
