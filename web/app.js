import { API_BASE } from './config.js';
import { randomSecret, authorizeUrl, normalizeUser, activeSession, consumeSSE } from './lib.js';
import { getPersona, personaQuestion } from './personas.js';

const $ = id => document.getElementById(id);
const SESSION = 'imp-agent.session', OAUTH = 'imp-agent.oauth';
let session = null, config = null, controller = null, conversationId = crypto.randomUUID(), expiryTimer, personaId = null, personaStarted = false;
try { session = JSON.parse(sessionStorage.getItem(SESSION)); } catch { sessionStorage.removeItem(SESSION); }
function loginStatus(message, error = false) { $('login-status').textContent = message; $('login-status').classList.toggle('error', error); }
function signOut(message = '') {
  controller?.abort(); clearTimeout(expiryTimer); session = null; personaId = null; personaStarted = false;
  sessionStorage.removeItem(SESSION); sessionStorage.removeItem(OAUTH);
  $('messages').replaceChildren(); $('question').value = ''; $('welcome').hidden = false;
  conversationId = crypto.randomUUID(); showSession(); loginStatus(message);
}
function showSession() {
  const signedIn = activeSession(session);
  $('workspace').hidden = !signedIn || !getPersona(personaId); $('login-screen').hidden = signedIn;
  $('persona-screen').hidden = !signedIn || !!getPersona(personaId);
  history.replaceState({}, '', !signedIn ? '/login' : personaId ? '/chat' : '/personas');
  if (signedIn) {
    $('user-name').textContent = session.name; $('user-role').textContent = session.role;
    $('user-initial').textContent = session.name.slice(0, 1).toUpperCase();
    $('persona-user').textContent = session.name;
    clearTimeout(expiryTimer);
    expiryTimer = setTimeout(() => signOut('Your Acumatica session expired. Sign in again to continue.'), Math.min(session.expiresAt - Date.now(), 2147483647));
    if (personaId) $('question').focus(); else document.querySelector('[data-persona]')?.focus();
  } else if (session) { sessionStorage.removeItem(SESSION); session = null; }
}
async function readError(response, fallback) {
  try { const data = await response.json(); return data.error || data.message || fallback; } catch { return fallback; }
}
async function initialize() {
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
        sessionStorage.setItem(SESSION, JSON.stringify(session)); history.replaceState({}, '', '/');
        loginStatus('');
      } catch (error) { loginStatus(error.message || 'Sign-in failed. Please try again.', true); }
    }
  }
  showSession();
  try {
    const response = await fetch(`${API_BASE}/v1/impuser/auth/acumatica/config`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Sign-in service is temporarily unavailable. Refresh to try again.');
    config = await response.json();
    if (!config.ClientId || !config.AuthorizeUrl || !config.Scope) throw new Error('Acumatica sign-in is not configured.');
    $('sign-in').disabled = false; $('sign-in').textContent = 'Sign in with Acumatica  →';
  } catch (error) { $('sign-in').textContent = 'Sign-in unavailable'; loginStatus(error.message, true); }
}
$('sign-in').addEventListener('click', async () => {
  if (!config) return;
  $('sign-in').disabled = true;
  try {
    const verifier = randomSecret(), state = randomSecret();
    const url = await authorizeUrl(config, location.origin, verifier, state);
    sessionStorage.setItem(OAUTH, JSON.stringify({ verifier, state, createdAt: Date.now() }));
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
  personaId = null; personaStarted = false; $('messages').replaceChildren(); $('question').value = ''; $('welcome').hidden = false;
  conversationId = crypto.randomUUID(); showSession();
});
document.querySelectorAll('[data-persona]').forEach(button => button.addEventListener('click', () => {
  if (!activeSession(session)) { signOut('Please sign in with Acumatica to select a persona.'); return; }
  const persona = getPersona(button.dataset.persona); if (!persona) return;
  personaId = button.dataset.persona; personaStarted = false; conversationId = crypto.randomUUID();
  $('selected-persona').textContent = persona.label; $('header-persona').textContent = persona.label;
  $('welcome-description').textContent = persona.description;
  document.querySelectorAll('[data-question]').forEach((suggestion, index) => {
    const [label, question] = persona.suggestions[index]; suggestion.dataset.question = question;
    suggestion.querySelector('strong').textContent = label; suggestion.querySelector('small').textContent = question + ' →';
  });
  showSession();
}));
$('new-chat').addEventListener('click', () => {
  if (controller) return;
  conversationId = crypto.randomUUID(); personaStarted = false; $('messages').replaceChildren(); $('welcome').hidden = false; $('question').value = ''; $('question').focus(); $('chat-status').textContent = 'Connected to IMP and Acumatica';
});
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => { $('question').value = button.dataset.question; $('question').focus(); }));
function addMessage(role, text = '') {
  const article = document.createElement('article'); article.className = `message ${role}`;
  const label = document.createElement('div'); label.className = 'message-label'; label.textContent = role === 'user' ? 'You' : 'IMP Agent';
  const body = document.createElement('div'); body.className = 'message-body'; body.textContent = text;
  article.append(label, body); $('messages').append(article);
  return { article, body };
}
function scrollLatest() { $('transcript').scrollTop = $('transcript').scrollHeight; }
function busy(value) { $('send').hidden = value; $('stop').hidden = !value; $('new-chat').disabled = value; $('change-persona').disabled = value; $('mobile-persona').disabled = value; $('question').readOnly = value; $('chat-status').textContent = value ? 'Looking up your question…' : 'Connected to IMP and Acumatica'; }
$('stop').addEventListener('click', () => controller?.abort());
$('question').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('chat-form').requestSubmit(); } });
$('chat-form').addEventListener('submit', async event => {
  event.preventDefault(); if (controller) return;
  const question = $('question').value.trim(); if (!question || question.length > 3600) return;
  if (!activeSession(session)) { signOut('Your session expired. Sign in with Acumatica to continue.'); return; }
  if (!getPersona(personaId)) { showSession(); return; }
  $('welcome').hidden = true; addMessage('user', question); $('question').value = '';
  const answer = addMessage('assistant', 'Looking up your question…'); answer.article.classList.add('pending');
  controller = new AbortController(); busy(true); scrollLatest(); let text = '', done = false, failed = false;
  try {
    const message = personaStarted ? question : personaQuestion(personaId, question);
    const response = await fetch(`${API_BASE}/v1/Chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}`, 'X-Acumatica-Access-Token': session.accessToken }, body: JSON.stringify({ message, conversationId }), signal: controller.signal });
    if (response.status === 401) { signOut('Your session expired. Sign in again to continue.'); return; }
    if (!response.ok) throw new Error(response.status === 429 ? 'You have reached the request limit. Please wait a moment and try again.' : await readError(response, 'Unable to answer this question. Please try again.'));
    if (!response.headers.get('Content-Type')?.includes('text/event-stream') || !response.body) throw new Error('The chat service returned an unexpected response. Please try again.');
    personaStarted = true;
    const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
    const handle = item => {
      if (item.type === 'chunk' && item.text && !failed) { text += item.text; answer.body.textContent = text; answer.article.classList.remove('pending'); scrollLatest(); }
      if (item.type === 'context' && item.conversationId) conversationId = item.conversationId;
      if (item.type === 'error') { failed = true; answer.body.textContent = item.message || 'The lookup failed. Please try again.'; answer.article.classList.add('error'); }
      if (item.type === 'done') done = true;
    };
    while (true) { const result = await reader.read(); if (result.done) break; buffer = consumeSSE(buffer + decoder.decode(result.value, { stream: true }), handle); }
    consumeSSE(buffer + decoder.decode(), handle, true);
    if (!text && !failed) throw new Error('No answer was returned. Please try again.');
    if (!done && !failed) { const note = document.createElement('div'); note.className = 'message-usage'; note.textContent = 'The connection ended before the response finished.'; answer.article.append(note); }
  } catch (error) {
    if (error.name === 'AbortError') { if (!text) answer.body.textContent = 'Response stopped.'; }
    else { answer.body.textContent = error.message || 'The connection failed. Please try again.'; answer.article.classList.add('error'); }
  } finally { answer.article.classList.remove('pending'); controller = null; busy(false); if (session) { $('question').focus(); scrollLatest(); } }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && session && !activeSession(session)) signOut('Your session expired. Please sign in again.'); });
initialize();
