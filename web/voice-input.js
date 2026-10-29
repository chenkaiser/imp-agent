// Speech stays in the browser's recognition service. Only reviewed, submitted text
// enters the normal chat pipeline; this module never sends or stores audio.
export function createVoiceInput({ input, button, cancelButton, status, host = input.ownerDocument.defaultView, enabled = () => true, onActive = () => {} }) {
  const Recognition = host.SpeechRecognition || host.webkitSpeechRecognition;
  let run = null, disposed = false;
  const supported = typeof Recognition === 'function' && host.isSecureContext !== false;
  const message = text => { status.textContent = text; };
  function refresh() {
    button.disabled = !supported || disposed || !enabled();
    button.title = supported ? 'Dictate a message, then review before sending' : 'Voice input is unavailable in this browser. You can still type.';
    if (!supported) message('Voice input is unavailable in this browser. You can still type.');
  }
  function finish(current, text) {
    if (run !== current) return;
    run = null;
    host.clearTimeout(current.limit); host.clearTimeout(current.ending);
    current.recognition.onresult = current.recognition.onerror = current.recognition.onend = current.recognition.onstart = null;
    input.readOnly = current.readOnly;
    button.classList.remove('recording'); button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', 'Start voice input');
    cancelButton.hidden = true; onActive(false); refresh(); message(text);
    input.focus();
  }
  function cancel() {
    if (!run) return;
    const current = run;
    input.value = current.original;
    finish(current, 'Voice input canceled. Your original message is unchanged.');
    try { current.recognition.abort(); } catch { /* Already ended. */ }
    input.dispatchEvent(new host.Event('input', { bubbles: true }));
  }
  function stop() {
    if (!run || run.stopping) return;
    const current = run; current.stopping = true;
    message('Finishing voice input…');
    try { current.recognition.stop(); } catch { finish(current, 'Review your message before sending.'); return; }
    if (run === current) current.ending = host.setTimeout(() => {
      finish(current, 'Voice input stopped. Review your message before sending.');
      try { current.recognition.abort(); } catch { /* Already ended. */ }
    }, 5000);
  }
  function start() {
    if (!supported || disposed || !enabled() || input.readOnly) return;
    let recognition;
    try { recognition = new Recognition(); } catch { message('Voice input could not start. You can still type.'); return; }
    const current = { recognition, original: input.value, readOnly: input.readOnly, start: input.selectionStart ?? input.value.length, end: input.selectionEnd ?? input.value.length, heard: false };
    run = current;
    recognition.lang = input.ownerDocument.documentElement.lang === 'en' ? 'en-US' : input.ownerDocument.documentElement.lang || 'en-US';
    recognition.continuous = false; recognition.interimResults = true; recognition.maxAlternatives = 1;
    input.readOnly = true; cancelButton.hidden = false; button.setAttribute('aria-pressed', 'true');
    button.setAttribute('aria-label', 'Stop voice input'); button.classList.add('recording'); onActive(true);
    message('Starting microphone… Allow access if your browser asks.');
    recognition.onstart = () => { if (run === current) message('Listening… Click the microphone to stop, or Cancel.'); };
    recognition.onresult = event => {
      if (run !== current) return;
      const transcript = Array.from(event.results, result => result[0]?.transcript || '').join(' ').trim();
      if (!transcript) return;
      current.heard = true;
      const before = current.original.slice(0, current.start), after = current.original.slice(current.end);
      const prefix = before && !/\s$/.test(before) ? ' ' : '';
      const suffix = after && !/^\s/.test(after) ? ' ' : '';
      const limit = input.maxLength > 0 ? input.maxLength : 3600;
      const room = Math.max(0, limit - before.length - after.length - prefix.length - suffix.length);
      if (!room) { input.value = current.original; stop(); return; }
      input.value = before + prefix + transcript.slice(0, room) + suffix + after;
      input.dispatchEvent(new host.Event('input', { bubbles: true }));
      if (transcript.length > room) { message('Message length limit reached. Review the text before sending.'); stop(); }
    };
    recognition.onerror = event => {
      if (run !== current) return;
      const errors = {
        'not-allowed': 'Microphone access was blocked. Allow it in your browser’s site settings, or type your message.',
        'service-not-allowed': 'Your browser blocked speech recognition. Open the full workspace in Chrome or type your message.',
        'audio-capture': 'No working microphone was found. Check your microphone, or type your message.',
        'no-speech': 'No speech was detected. Try again or type your message.',
        'network': 'The browser’s speech service could not connect. Try again or type your message.',
        'language-not-supported': 'Speech recognition is unavailable for this language. You can still type.'
      };
      finish(current, errors[event.error] || 'Voice input stopped. Review your message or try again.');
      try { recognition.abort(); } catch { /* Already ended. */ }
    };
    recognition.onend = () => finish(current, current.heard ? 'Review the text, especially item and order IDs, then Send.' : 'No speech was detected. Try again or type your message.');
    current.limit = host.setTimeout(stop, 60000);
    try { recognition.start(); } catch { finish(current, 'Voice input could not start. Check microphone access or type your message.'); }
  }
  const toggle = () => run ? stop() : start();
  const keydown = event => { if (event.key === 'Escape' && run) { event.preventDefault(); cancel(); } };
  const hidden = () => { if (input.ownerDocument.hidden) cancel(); };
  button.addEventListener('click', toggle); cancelButton.addEventListener('click', cancel);
  input.addEventListener('keydown', keydown); input.ownerDocument.addEventListener('visibilitychange', hidden);
  host.addEventListener('pagehide', cancel);
  refresh();
  return { refresh, cancel, get active() { return run !== null; }, dispose() {
    cancel(); disposed = true; refresh();
    button.removeEventListener('click', toggle); cancelButton.removeEventListener('click', cancel);
    input.removeEventListener('keydown', keydown); input.ownerDocument.removeEventListener('visibilitychange', hidden);
    host.removeEventListener('pagehide', cancel);
  } };
}
