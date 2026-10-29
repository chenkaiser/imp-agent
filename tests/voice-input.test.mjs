import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { createVoiceInput } from '../web/voice-input.js';

function setup({ supported = true, prefixed = false, text = '', enabled = () => true } = {}) {
  const dom = new JSDOM('<html lang="en"><textarea maxlength="3600"></textarea><button id="mic"></button><button id="cancel" hidden></button><p role="status"></p></html>', { url: 'https://ask.impops.work/chat' });
  const host = dom.window, input = host.document.querySelector('textarea'), button = host.document.getElementById('mic'), cancelButton = host.document.getElementById('cancel'), status = host.document.querySelector('p');
  const instances = [], timers = new Map(), active = []; let next = 0;
  host.setTimeout = (fn, delay) => { timers.set(++next, { fn, delay }); return next; };
  host.clearTimeout = id => timers.delete(id);
  class Recognition {
    constructor() { instances.push(this); }
    start() { this.started = true; this.onstart?.(); }
    stop() { this.stopped = true; }
    abort() { this.aborted = true; }
  }
  if (supported) host[prefixed ? 'webkitSpeechRecognition' : 'SpeechRecognition'] = Recognition;
  input.value = text; input.setSelectionRange(text.length, text.length);
  const voice = createVoiceInput({ input, button, cancelButton, status, host, enabled, onActive: value => active.push(value) });
  const result = (...parts) => instances.at(-1).onresult({ results: parts.map(transcript => [{ transcript }]) });
  return { host, dom, input, button, cancelButton, status, voice, instances, timers, active, result, close() { voice.dispose(); dom.window.close(); } };
}

test('recognition starts only on click and never submits the transcript', () => {
  const t = setup(); let submits = 0, edits = 0;
  t.input.addEventListener('input', () => edits++); t.host.document.addEventListener('submit', () => submits++);
  assert.equal(t.instances.length, 0); t.button.click();
  assert.equal(t.voice.active, true); assert.equal(t.input.readOnly, true); assert.match(t.status.textContent, /Listening/);
  assert.equal(t.instances[0].lang, 'en-US'); assert.equal(t.instances[0].continuous, false);
  t.result('price for Nit'); t.result('price for Nitto');
  assert.equal(t.input.value, 'price for Nitto'); assert.equal(edits, 2); assert.equal(submits, 0);
  t.button.click(); assert.equal(t.instances[0].stopped, true); t.result('price for Nitto', 'please');
  t.instances[0].onend(); assert.equal(t.input.value, 'price for Nitto please');
  assert.equal(t.voice.active, false); assert.equal(t.input.readOnly, false); assert.equal(t.button.getAttribute('aria-pressed'), 'false');
  assert.match(t.status.textContent, /Review/); assert.equal(t.timers.size, 0); t.close();
});

test('dictation preserves existing text and replaces only the selected range', () => {
  const t = setup({ text: 'price of ITEM for customer' }); t.input.setSelectionRange(9, 13);
  t.button.click(); t.result('ZEB110300PVW'); t.instances[0].onend();
  assert.equal(t.input.value, 'price of ZEB110300PVW for customer'); t.close();
});

test('cancel restores draft and rejects late callbacks from an old conversation', () => {
  const t = setup({ text: 'my original draft' }); t.button.click(); const late = t.instances[0].onresult;
  t.result('extra words'); t.cancelButton.click();
  late({ results: [[{ transcript: 'late private text' }]] });
  assert.equal(t.input.value, 'my original draft'); assert.equal(t.instances[0].aborted, true);
  t.button.click(); late({ results: [[{ transcript: 'old words' }]] }); assert.equal(t.input.value, 'my original draft'); t.close();
});

for (const error of ['not-allowed', 'service-not-allowed', 'audio-capture', 'no-speech', 'network', 'language-not-supported', 'unexpected']) {
  test(`speech ${error} leaves normal typed input usable`, () => {
    const t = setup({ text: 'typed draft' }); t.button.click(); t.instances[0].onerror({ error });
    assert.equal(t.input.value, 'typed draft'); assert.equal(t.input.readOnly, false); assert.equal(t.voice.active, false);
    assert.ok(t.status.textContent.length > 10); assert.equal(t.timers.size, 0); t.close();
  });
}

test('unsupported browsers, expired sessions and busy chat never start a microphone', () => {
  const unsupported = setup({ supported: false }); assert.equal(unsupported.button.disabled, true); assert.match(unsupported.status.textContent, /unavailable/); unsupported.close();
  const locked = setup({ enabled: () => false }); locked.button.click(); assert.equal(locked.instances.length, 0); locked.close();
  const busy = setup(); busy.input.readOnly = true; busy.button.click(); assert.equal(busy.instances.length, 0); busy.close();
});

test('prefixed Chrome API works; recognition cannot exceed input limit', () => {
  const t = setup({ prefixed: true, text: 'x'.repeat(3597) }); t.button.click(); t.result('abcdef');
  assert.equal(t.input.value.length, 3600); assert.equal(t.instances[0].stopped, true); t.close();
  const full = setup({ text: 'x'.repeat(3600) }); full.button.click(); full.result('extra'); assert.equal(full.input.value.length, 3600); full.close();
});

test('duration limit stops capture and missing end event still restores the composer', () => {
  const t = setup(); t.button.click(); t.result('hello');
  [...t.timers.values()].find(timer => timer.delay === 60000).fn(); assert.equal(t.instances[0].stopped, true);
  [...t.timers.values()].find(timer => timer.delay === 5000).fn();
  assert.equal(t.voice.active, false); assert.equal(t.instances[0].aborted, true); assert.equal(t.input.readOnly, false); t.close();
});

test('Escape, page hide and disposal cancel capture without leaving a microphone active', () => {
  for (const action of ['escape', 'pagehide', 'dispose']) {
    const t = setup(); t.button.click();
    if (action === 'escape') t.input.dispatchEvent(new t.host.KeyboardEvent('keydown', { key: 'Escape' }));
    else if (action === 'pagehide') t.host.dispatchEvent(new t.host.Event('pagehide'));
    else t.voice.dispose();
    assert.equal(t.instances[0].aborted, true); assert.equal(t.voice.active, false); t.close();
  }
});

test('web and extension delegate microphone only to their own hosted agent', async () => {
  const config = JSON.parse(await readFile(new URL('../web/staticwebapp.config.json', import.meta.url)));
  assert.equal(config.globalHeaders['Permissions-Policy'], 'camera=(), microphone=(self), geolocation=()');
  const panel = new JSDOM(await readFile(new URL('../extensions/ask-imp/sidepanel.html', import.meta.url), 'utf8'));
  assert.equal(panel.window.document.querySelector('iframe').getAttribute('allow'), 'microphone https://ask.impops.work'); panel.window.close();
});
