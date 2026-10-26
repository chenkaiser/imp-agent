import { API_BASE } from './config.js';

export function lookupTrigger(text, caret = text.length) {
  const before = text.slice(0, caret), match = /(?:^|\s)([#*])([^\s#*\n\r][^#*\n\r]{0,59})$/.exec(before);
  if (!match) return null;
  const query = match[2].trim();
  if (query.length < 2) return null;
  return { kind: match[1] === '#' ? 'item' : 'customer', query, start: caret - match[2].length - 1, end: caret };
}
const marker = kind => kind === 'item' ? '#' : '*';
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tokenPattern = s => new RegExp(`(^|\\s)${escape(marker(s.kind) + s.id)}(?=$|\\s|[?,;!])`, 'g');
export function retainedSelections(text, selections) {
  return selections.filter(s => tokenPattern(s).test(text)).map(({ kind, id, label, unit }) => ({ kind, id, label, unit }));
}
export function createChatAutocomplete({ input, list, chips, status, getSession, enabled, onUnauthorized }) {
  let selections = [], results = [], active = 0, trigger = null, timer, request, generation = 0, composing = false, suspended = false;
  input.setAttribute('role', 'combobox'); input.setAttribute('aria-haspopup', 'listbox'); input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', list.id); input.setAttribute('aria-expanded', 'false');
  const close = () => { results = []; trigger = null; list.hidden = true; list.replaceChildren(); input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
  const cancel = () => { clearTimeout(timer); generation++; request?.abort(); request = null; close(); };
  function renderChips() {
    chips.replaceChildren();
    for (const selection of selections) {
      const chip = document.createElement('span'); chip.className = `lookup-chip ${selection.kind}`;
      const label = document.createElement('span'); label.textContent = `${selection.kind === 'item' ? 'Item' : 'Customer'}: ${selection.id} · ${selection.label}`;
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove ${selection.label}`);
      remove.disabled = suspended;
      remove.addEventListener('click', () => { input.value = input.value.replace(tokenPattern(selection), '$1'); selections = selections.filter(s => s !== selection); cancel(); renderChips(); input.focus(); });
      chip.append(label, remove); chips.append(chip);
    }
    chips.hidden = !selections.length;
  }
  function highlight(index) {
    active = (index + results.length) % results.length;
    [...list.children].forEach((row, i) => row.setAttribute('aria-selected', String(i === active)));
    input.setAttribute('aria-activedescendant', `${list.id}-${active}`);
    list.children[active]?.scrollIntoView?.({ block: 'nearest' });
  }
  function choose(index) {
    const selected = results[index], range = trigger;
    if (!selected || !range || suspended) return;
    const existing = selections.find(s => s.kind === selected.kind && s.id !== selected.id);
    if (existing) { status.textContent = `Remove the selected ${selected.kind} first. This release supports one item and one customer per question.`; return; }
    const token = marker(selected.kind) + selected.id;
    input.value = input.value.slice(0, range.start) + token + ' ' + input.value.slice(range.end);
    selections = selections.filter(s => s.kind !== selected.kind); selections.push(selected);
    const caret = range.start + token.length + 1; cancel(); renderChips(); input.focus(); input.setSelectionRange(caret, caret);
    status.textContent = `${selected.label} selected.`;
  }
  function render(rows, range) {
    results = rows; trigger = range; list.replaceChildren();
    for (const [index, row] of rows.entries()) {
      const option = document.createElement('div'); option.id = `${list.id}-${index}`; option.setAttribute('role', 'option'); option.className = 'lookup-option';
      const title = document.createElement('strong'); title.textContent = row.kind === 'item' ? row.id : row.label;
      const detail = document.createElement('small'); detail.textContent = row.kind === 'item' ? `${row.label}${row.unit ? ' · ' + row.unit : ''}` : row.id;
      option.append(title, detail); option.addEventListener('mousedown', e => e.preventDefault()); option.addEventListener('click', () => choose(index)); list.append(option);
    }
    list.hidden = !rows.length; input.setAttribute('aria-expanded', String(!!rows.length));
    if (rows.length) highlight(0);
  }
  async function search(range, version) {
    const session = getSession(); if (!session || version !== generation || suspended || !enabled()) return;
    request = new AbortController(); status.textContent = `Finding ${range.kind === 'item' ? 'items' : 'your customers'}…`;
    try {
      const response = await fetch(`${API_BASE}/v1/Chat/lookups?kind=${range.kind}&q=${encodeURIComponent(range.query)}`, {
        headers: { Authorization: `Bearer ${session.token}`, 'X-Acumatica-Access-Token': session.accessToken }, cache: 'no-store', signal: request.signal
      });
      if (version !== generation) return;
      if (response.status === 401) { onUnauthorized(); return; }
      if (!response.ok) throw new Error(response.status === 429 ? 'Suggestion limit reached. Wait a minute or type an ID.' : response.status === 403 ? 'Suggestions are unavailable for your account.' : 'Suggestions are temporarily unavailable. You can still type an ID.');
      const data = await response.json(); if (version !== generation || getSession() !== session || !enabled()) return;
      const rows = Array.isArray(data.items) ? data.items.filter(r => r.kind === range.kind && typeof r.id === 'string' && r.id.length <= 60 && typeof r.label === 'string' && r.label.length <= 300).slice(0, 8) : [];
      render(rows, range); status.textContent = rows.length ? `${rows.length} suggestions. Use arrow keys and Enter to select.${data.moreMatches ? ' Keep typing to narrow the list.' : ''}` : 'No matching records in your accessible catalog. Try another name or ID.';
    } catch (error) { if (version === generation && error.name !== 'AbortError') { close(); status.textContent = error.message; } }
  }
  function update() {
    cancel(); selections = retainedSelections(input.value, selections); renderChips();
    if (composing || suspended || !enabled()) return;
    const range = lookupTrigger(input.value, input.selectionStart);
    if (!range || selections.some(s => range.kind === s.kind && range.query.startsWith(s.id) && (range.query.length === s.id.length || /[\s?,;!]/.test(range.query[s.id.length])))) return;
    const version = generation; timer = setTimeout(() => search(range, version), 200);
  }
  input.addEventListener('input', update); input.addEventListener('click', update);
  input.addEventListener('compositionstart', () => { composing = true; cancel(); }); input.addEventListener('compositionend', () => { composing = false; update(); });
  input.addEventListener('keydown', event => {
    if (event.isComposing || composing) return;
    if (event.key === 'Escape') { cancel(); return; }
    if (!results.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); highlight(active + (event.key === 'ArrowDown' ? 1 : -1)); }
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopImmediatePropagation(); choose(active); }
  });
  input.addEventListener('blur', () => { clearTimeout(timer); setTimeout(close, 150); });
  return {
    reset() { cancel(); selections = []; suspended = false; renderChips(); status.textContent = ''; },
    suspend(value) { suspended = value; if (value) cancel(); renderChips(); },
    validate() {
      const kept = retainedSelections(input.value, selections);
      const markers = [...input.value.matchAll(/(^|\s)([#*])(?=[^\s#*])/g)];
      for (const match of markers) {
        const start = match.index + match[1].length;
        if (match[2] === '*' && /^\*[^\s*]+\*/.test(input.value.slice(start))) continue;
        if (!kept.some(s => match[2] === marker(s.kind) && input.value.slice(start).startsWith(marker(s.kind) + s.id) && tokenPattern(s).test(input.value.slice(start)))) {
          status.textContent = 'Select a matching suggestion, or remove # / * to type a name or ID normally.';
          input.focus(); return false;
        }
      }
      return true;
    },
    snapshot() { selections = retainedSelections(input.value, selections); return selections.map(({ kind, id }) => ({ kind, id })); },
    dismiss: cancel
  };
}
