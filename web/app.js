import { createVoiceInput } from './voice-input.js';
import { createChatAutocomplete } from './chat-autocomplete.js';
import { createLookupWarmer } from './lookup-warmer.js';
import { API_BASE } from './config.js';
import { randomSecret, authorizeUrl, normalizeUser, activeSession, consumeSSE } from './lib.js';
import { getPersona, personaQuestion } from './personas.js';
import { renderAssistantMessage } from './message-format.js';
import { createSalesAccessWorkspace } from './sales-access.js';
import { createKpiWorkspace } from './kpi.js';
import { createWidgetSignIn, validWidgetNonce } from './widget-auth.js';

const $ = id => document.getElementById(id);
const SESSION = 'imp-agent.session', OAUTH = 'imp-agent.oauth';
let allowedPersonaIds = new Set();
let kpiAccess = false;
let session = null, config = null, controller = null, conversationId = crypto.randomUUID(), expiryTimer, personaId = null, personaStarted = false;
const widgetMode = location.pathname === '/widget' || location.pathname === '/widget.html';
const popupNonce = new URLSearchParams(location.search).get('widgetAuth');
const widgetSignIn = widgetMode ? createWidgetSignIn({
  host: window, randomSecret, activeSession, onStatus: loginStatus,
  onSession: async value => {
    session = value; sessionStorage.setItem(SESSION, JSON.stringify(session));
    try { await loadPersonaAccess(); showSession(); loginStatus(''); }
    catch (error) { signOut(error.message); }
  }
}) : null;
const kpi = createKpiWorkspace({ getSession: () => session, onUnauthorized: () => signOut('Sign in with Acumatica to review KPI evidence.'), onForbidden: () => { kpiAccess = false; showSession(); }, onBack: () => showSession() });
const salesAccess = createSalesAccessWorkspace({ getSession: () => session, onUnauthorized: () => signOut('Sign in with Acumatica to manage sales access.'), onBack: () => showSession() });
const autocomplete = createChatAutocomplete({ input: $('question'), list: $('lookup-list'), chips: $('lookup-chips'), status: $('lookup-status'), getSession: () => session, enabled: () => activeSession(session) && !!personaId && personaId !== 'production' && allowedPersonaIds.has(personaId), onUnauthorized: () => signOut('Sign in again to use suggestions.') });
const voice = createVoiceInput({ input: $('question'), button: $('voice-input'), cancelButton: $('voice-cancel'), status: $('voice-status'), enabled: () => activeSession(session) && !!personaId && allowedPersonaIds.has(personaId) && !controller, onActive: active => { $('send').disabled = active; } });
const lookupWarmer = createLookupWarmer({ getSession: () => session, enabled: () => allowedPersonaIds.has('sales') || allowedPersonaIds.has('service') });
try { session = JSON.parse(sessionStorage.getItem(SESSION)); } catch { sessionStorage.removeItem(SESSION); }
function loginStatus(message, error = false) { $('login-status').textContent = message; $('login-status').classList.toggle('error', error); }
function signOut(message = '') {
  widgetSignIn?.cancel();
  lookupWarmer.stop();
  voice.cancel(); autocomplete.reset();
  allowedPersonaIds.clear();
  kpiAccess = false;
  kpi.deactivate(); salesAccess.deactivate();
  controller?.abort(); clearTimeout(expiryTimer); session = null; personaId = null; personaStarted = false;
  sessionStorage.removeItem(SESSION); sessionStorage.removeItem(OAUTH);
  $('messages').replaceChildren(); $('question').value = ''; $('welcome').hidden = false;
  conversationId = crypto.randomUUID(); showSession(); loginStatus(message);
}
async function loadPersonaAccess() {
  allowedPersonaIds.clear();
  kpiAccess = false;
  const response = await fetch(`${API_BASE}/v1/Chat/personas`, { headers: { Authorization: `Bearer ${session.token}`, 'X-Acumatica-Access-Token': session.accessToken }, cache: 'no-store' });
  if (response.status === 401) { signOut('Please sign in again to select a persona.'); return; }
  if (!response.ok) throw new Error('Unable to verify persona access. Refresh to try again.');
  const data = await response.json();
  if (!Array.isArray(data.personas)) throw new Error('Unable to verify persona access. Refresh to try again.');
  allowedPersonaIds = new Set(data.personas.filter(id => getPersona(id)));
  kpiAccess = data.kpiAccess === true;
  if (typeof data.role === 'string') session.role = data.role;
  $('persona-status').textContent = '';
}
function showSession() {
  voice.cancel();
  kpi.deactivate(); salesAccess.deactivate();
  const signedIn = activeSession(session);
  if (personaId && !allowedPersonaIds.has(personaId)) {
    personaId = null; personaStarted = false; $('messages').replaceChildren(); conversationId = crypto.randomUUID();
  }
  if (signedIn && !personaId && allowedPersonaIds.size === 1) selectPersona([...allowedPersonaIds][0]);
  lookupWarmer.start();
  $('change-persona').hidden = !signedIn || allowedPersonaIds.size <= 1;
  $('mobile-persona').hidden = !signedIn || allowedPersonaIds.size <= 1;
  document.querySelectorAll('[data-persona]').forEach(button => {
    button.hidden = !signedIn || !allowedPersonaIds.has(button.dataset.persona);
    button.disabled = button.hidden;
  });
  $('workspace').hidden = !signedIn || !getPersona(personaId); $('login-screen').hidden = signedIn;
  $('persona-screen').hidden = !signedIn || !!getPersona(personaId);
  voice.refresh();
  history.replaceState({}, '', widgetMode ? '/widget' : !signedIn ? '/login' : personaId ? '/chat' : '/personas');
  if (signedIn) {
    $('open-kpi').hidden = !kpiAccess;
    $('open-sales-access').hidden = personaId !== 'it';
    $('mobile-sales-access').hidden = personaId !== 'it';
    $('mobile-kpi').hidden = !kpiAccess;
    $('user-name').textContent = session.name; $('user-role').textContent = session.role;
    $('user-initial').textContent = session.name.slice(0, 1).toUpperCase();
    $('persona-user').textContent = session.name;
    clearTimeout(expiryTimer);
    expiryTimer = setTimeout(() => signOut('Your Acumatica session expired. Sign in again to continue.'), Math.min(session.expiresAt - Date.now(), 2147483647));
    if (personaId) $('question').focus(); else document.querySelector('[data-persona]:not([hidden])')?.focus();
  } else if (session) { sessionStorage.removeItem(SESSION); session = null; }
}
$('open-kpi').addEventListener('click', () => {
  if (!activeSession(session)) { signOut('Sign in with Acumatica to open the Executive dashboard.'); return; }
  if (!kpiAccess) { showSession(); return; }
  voice.cancel(); $('workspace').hidden = true; $('persona-screen').hidden = true; kpi.open();
});
$('mobile-kpi').addEventListener('click', () => $('open-kpi').click());
$('open-sales-access').addEventListener('click', () => {
  if (!activeSession(session)) { signOut('Sign in with Acumatica to manage sales access.'); return; }
  if (!allowedPersonaIds.has('it')) { showSession(); return; }
  voice.cancel(); kpi.deactivate(); $('workspace').hidden = true; $('persona-screen').hidden = true; salesAccess.open();
});
$('mobile-sales-access').addEventListener('click', () => $('open-sales-access').click());
async function readError(response, fallback) {
  try { const data = await response.json(); return data.error || data.message || fallback; } catch { return fallback; }
}
async function initialize() {
  const requestedKpi = location.pathname === '/kpi', requestedSalesAccess = location.pathname === '/sales-access';
  const query = new URLSearchParams(location.search);
  if (query.has('code') || query.has('error')) {
    history.replaceState({}, '', '/login');
    let pending;
    try { pending = JSON.parse(sessionStorage.getItem(OAUTH)); } catch { /* report invalid state below */ }
    sessionStorage.removeItem(OAUTH);
    if (!pending || typeof pending.verifier !== 'string' || !pending.verifier || !Number.isFinite(pending.createdAt) || query.get('state') !== pending.state || Date.now() - pending.createdAt < 0 || Date.now() - pending.createdAt > 10 * 60 * 1000) {
      loginStatus('This sign-in request expired or could not be verified. Please start again.', true);
    } else if (query.has('error')) {
      loginStatus('Acumatica sign-in was not completed. Please try again.', true);
    } else {
      loginStatus('Completing Acumatica sign-in…');
      try {
        const response = await fetch(`${API_BASE}/v1/impuser/auth/acumatica/code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: query.get('code'), codeVerifier: pending.verifier, redirectUri: `${location.origin}/login` }) });
        if (!response.ok) throw new Error(await readError(response, 'Unable to complete Acumatica sign-in. Please try again.'));
        session = normalizeUser(await response.json());
        if (validWidgetNonce(pending.widgetNonce) && window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'imp-widget-session', nonce: pending.widgetNonce, session }, location.origin);
          session = null;
          loginStatus('Sign-in complete. You can close this window and return to Ask IMP.');
          return;
        }
        sessionStorage.setItem(SESSION, JSON.stringify(session)); history.replaceState({}, '', '/');
        loginStatus('');
      } catch (error) { loginStatus(error.message || 'Sign-in failed. Please try again.', true); }
    }
  }
  if (activeSession(session)) {
    try { await loadPersonaAccess(); }
    catch (error) { $('persona-status').textContent = error.message; }
  }
  showSession();
  if (requestedSalesAccess && activeSession(session)) { document.querySelector('[data-persona="it"]').click(); $('open-sales-access').click(); }
  if (requestedKpi && activeSession(session) && kpiAccess) $('open-kpi').click();
  try {
    const response = await fetch(`${API_BASE}/v1/impuser/auth/acumatica/config`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Sign-in service is temporarily unavailable. Refresh to try again.');
    config = await response.json();
    if (!config.ClientId || !config.AuthorizeUrl || !config.Scope) throw new Error('Acumatica sign-in is not configured.');
    $('sign-in').disabled = false; $('sign-in').textContent = 'Sign in with Acumatica  →';
    if (validWidgetNonce(popupNonce) && window.opener && !window.opener.closed) $('sign-in').click();
  } catch (error) { $('sign-in').textContent = 'Sign-in unavailable'; loginStatus(error.message, true); }
}
$('sign-in').addEventListener('click', async () => {
  if (!config) return;
  if (widgetSignIn) { widgetSignIn.start(); return; }
  $('sign-in').disabled = true;
  try {
    const verifier = randomSecret(), state = randomSecret();
    const url = await authorizeUrl(config, location.origin, verifier, state);
    sessionStorage.setItem(OAUTH, JSON.stringify({ verifier, state, createdAt: Date.now(), ...(validWidgetNonce(popupNonce) && window.opener ? { widgetNonce: popupNonce } : {}) }));
    location.assign(url);
  } catch { $('sign-in').disabled = false; loginStatus('Unable to start secure sign-in. Please try again.', true); }
});
$('sign-out').addEventListener('click', () => signOut('Signed out of IMP Agent.'));
$('persona-sign-out').addEventListener('click', () => signOut('Signed out of IMP Agent.'));
$('mobile-sign-out').addEventListener('click', () => $('sign-out').click());
$('mobile-new').addEventListener('click', () => $('new-chat').click());
$('mobile-persona').addEventListener('click', () => $('change-persona').click());
$('change-persona').addEventListener('click', () => {
  if (controller) return;
  voice.cancel(); autocomplete.reset();
  personaId = null; personaStarted = false; $('messages').replaceChildren(); $('question').value = ''; $('welcome').hidden = false;
  conversationId = crypto.randomUUID(); showSession();
});
function selectPersona(id) {
  if (!activeSession(session)) { signOut('Please sign in with Acumatica to select a persona.'); return; }
  const persona = getPersona(id); if (!persona || !allowedPersonaIds.has(id)) return;
  voice.cancel(); autocomplete.reset();
  personaId = id; personaStarted = false; conversationId = crypto.randomUUID();
  $('selected-persona').textContent = persona.label; $('header-persona').textContent = persona.label;
  $('welcome-description').textContent = persona.description;
  $('question').placeholder = id === 'production' ? 'Ask about a production order or IMP product log…' : 'Ask about inventory, an order, or production…';
  $('lookup-hint').textContent = id === 'production' ? 'Use an Acumatica production order number (PROD…) or an IMP product log Ref No (such as M3055).' : 'Type # for an item or * for a customer. Select a suggestion to use its exact ID.';
  document.querySelectorAll('[data-question]').forEach((suggestion, index) => {
    const [label, question] = persona.suggestions[index]; suggestion.dataset.question = question;
    suggestion.querySelector('strong').textContent = label; suggestion.querySelector('small').textContent = question + ' →';
  });
}
document.querySelectorAll('[data-persona]').forEach(button => button.addEventListener('click', () => {
  selectPersona(button.dataset.persona); showSession();
}));
$('new-chat').addEventListener('click', () => {
  if (controller) return;
  voice.cancel(); autocomplete.reset();
  conversationId = crypto.randomUUID(); personaStarted = false; $('messages').replaceChildren(); $('welcome').hidden = false; $('question').value = ''; $('question').focus(); $('chat-status').textContent = 'Connected to IMP and Acumatica';
});
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => { voice.cancel(); autocomplete.reset(); $('question').value = button.dataset.question; $('question').focus(); }));
function addMessage(role, text = '') {
  const article = document.createElement('article'); article.className = `message ${role}`;
  const avatar = document.createElement('div'); avatar.className = 'message-avatar'; avatar.setAttribute('aria-hidden', 'true');
  if (role === 'user') {
    avatar.textContent = (session?.name || 'You').trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase();
  } else {
    avatar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M9 3h6"/><rect x="4" y="6" width="16" height="14" rx="5"/><path d="M1 11v4m22-4v4M9 16h6"/><circle cx="8.5" cy="11" r=".8" fill="currentColor"/><circle cx="15.5" cy="11" r=".8" fill="currentColor"/></svg>';
  }
  const label = document.createElement('div'); label.className = 'message-label'; label.textContent = role === 'user' ? 'You' : 'IMP Agent';
  const body = document.createElement('div'); body.className = 'message-body'; body.textContent = text;
  article.append(avatar, label, body); $('messages').append(article);
  return { article, body };
}
function scrollLatest() { $('transcript').scrollTop = $('transcript').scrollHeight; }
function busy(value) { voice.cancel(); voice.refresh(); autocomplete.suspend(value); $('send').hidden = value; $('stop').hidden = !value; $('new-chat').disabled = value; $('change-persona').disabled = value; $('mobile-persona').disabled = value; $('question').readOnly = value; $('chat-status').textContent = value ? 'Looking up your question…' : 'Connected to IMP and Acumatica'; }
$('stop').addEventListener('click', () => controller?.abort());
$('question').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('chat-form').requestSubmit(); } });
$('chat-form').addEventListener('submit', async event => {
  event.preventDefault(); if (controller || voice.active) return;
  const question = $('question').value.trim(); if (!question || question.length > 3600) return;
  if (!activeSession(session)) { signOut('Your session expired. Sign in with Acumatica to continue.'); return; }
  if (!getPersona(personaId) || !allowedPersonaIds.has(personaId)) { showSession(); return; }
  if (personaId !== 'production' && !autocomplete.validate()) return;
  const selections = autocomplete.snapshot(); voice.cancel(); autocomplete.reset();
  $('welcome').hidden = true; addMessage('user', question); $('question').value = '';
  const answer = addMessage('assistant', 'Looking up your question…'); answer.article.classList.add('pending'); answer.article.setAttribute('aria-busy', 'true');
  controller = new AbortController(); busy(true); scrollLatest(); let text = '', done = false, failed = false;
  try {
    const message = personaStarted ? question : personaQuestion(personaId, question);
    const response = await fetch(`${API_BASE}/v1/Chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}`, 'X-Acumatica-Access-Token': session.accessToken }, body: JSON.stringify({ message, conversationId, persona: personaId, ...(selections.length ? { selections } : {}) }), signal: controller.signal });
    if (response.status === 401) { signOut('Your session expired. Sign in again to continue.'); return; }
    if (response.status === 403) {
      const reason = await readError(response, 'Your account cannot use this persona.');
      try { await loadPersonaAccess(); } catch { allowedPersonaIds.clear(); }
      showSession(); $('persona-status').textContent = reason;
      throw new Error(reason);
    }
    if (!response.ok) throw new Error(await readError(response, response.status === 429 ? 'You have reached the request limit. Please wait a moment and try again.' : 'Unable to answer this question. Please try again.'));
    if (!response.headers.get('Content-Type')?.includes('text/event-stream') || !response.body) throw new Error('The chat service returned an unexpected response. Please try again.');
    personaStarted = true;
    const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
    const handle = item => {
      if (item.type === 'progress' && !text && !failed && typeof item.message === 'string' && item.message.length <= 160) { answer.body.textContent = item.message; $('chat-status').textContent = item.message; scrollLatest(); }
      if (item.type === 'chunk' && item.text && !failed) { text += item.text; answer.body.textContent = text; answer.article.classList.remove('pending'); answer.article.setAttribute('aria-busy', 'false'); scrollLatest(); }
      if (item.type === 'context' && item.conversationId) conversationId = item.conversationId;
      if (item.type === 'error') { failed = true; answer.body.textContent = item.message || 'The lookup failed. Please try again.'; answer.article.classList.add('error'); }
      if (item.type === 'done') { done = true; if (!failed && text) renderAssistantMessage(answer.body, text); }
    };
    while (true) { const result = await reader.read(); if (result.done) break; buffer = consumeSSE(buffer + decoder.decode(result.value, { stream: true }), handle); }
    consumeSSE(buffer + decoder.decode(), handle, true);
    if (!text && !failed) throw new Error('No answer was returned. Please try again.');
    if (!done && !failed) { const note = document.createElement('div'); note.className = 'message-usage'; note.textContent = 'The connection ended before the response finished.'; answer.article.append(note); }
  } catch (error) {
    if (error.name === 'AbortError') { if (!text) answer.body.textContent = 'Response stopped.'; }
    else { answer.body.textContent = error.message || 'The connection failed. Please try again.'; answer.article.classList.add('error'); }
  } finally { answer.article.classList.remove('pending'); answer.article.setAttribute('aria-busy', 'false'); controller = null; busy(false); if (session) { $('question').focus(); scrollLatest(); } }
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && session && !activeSession(session)) signOut('Your session expired. Please sign in again.');
  else lookupWarmer.start();
});
initialize();
