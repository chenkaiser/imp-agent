export function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function randomSecret() { return base64url(crypto.getRandomValues(new Uint8Array(32))); }
export async function challenge(verifier) {
  return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
}
export async function authorizeUrl(config, origin, verifier, state) {
  const url = new URL(config.AuthorizeUrl);
  if (url.protocol !== 'https:') throw new Error('The sign-in service requires HTTPS.');
  url.search = new URLSearchParams({ response_type: 'code', client_id: config.ClientId, redirect_uri: `${origin}/login`, scope: config.Scope, state, code_challenge: await challenge(verifier), code_challenge_method: 'S256', prompt: 'login' });
  return url.href;
}
export function normalizeUser(raw, now = Date.now()) {
  const data = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key.toLowerCase(), value]));
  if (!data.userid || !data.token || !data.accesstoken) throw new Error('Acumatica sign-in did not return an IMP session. Contact your IMP administrator.');
  const expiresIn = Number(data.expiresin);
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) throw new Error('Acumatica sign-in returned an invalid session lifetime. Please sign in again.');
  return { id: data.userid, name: [data.firstname, data.lastname].filter(Boolean).join(' ') || data.username || 'IMP user', role: data.rolename || 'IMP user', token: data.token, accessToken: data.accesstoken, expiresAt: now + expiresIn * 1000 };
}
export function activeSession(session, now = Date.now()) {
  if (!session?.token || !session?.accessToken || !Number.isFinite(session.expiresAt) || session.expiresAt <= now) return false;
  try {
    const jwt = session.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(jwt));
    return Number.isFinite(claims.exp) && claims.exp * 1000 > now;
  } catch { return false; }
}
export function consumeSSE(buffer, handle, flush = false) {
  let normalized = buffer.replace(/\r\n/g, '\n');
  let boundary;
  while ((boundary = normalized.indexOf('\n\n')) >= 0) {
    const block = normalized.slice(0, boundary);
    normalized = normalized.slice(boundary + 2);
    const payload = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    if (payload && payload !== '[DONE]') handle(JSON.parse(payload));
  }
  if (flush && normalized.trim()) return consumeSSE(normalized + '\n\n', handle);
  return normalized;
}
