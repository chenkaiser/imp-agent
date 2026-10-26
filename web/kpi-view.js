export function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined && text !== null) el.textContent = String(text);
  if (className) el.className = className;
  return el;
}
export function normalizeKeys(value) {
  if (Array.isArray(value)) return value.map(normalizeKeys);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k[0].toLowerCase() + k.slice(1), normalizeKeys(v)]));
  return value;
}
export function formatValue(value, unit = '') {
  if (value === null || value === undefined) return 'Awaiting evidence';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (unit === '%') return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(number);
  if (unit === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(number);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(number);
}
export function table(headers, rows, caption) {
  const wrap = element('div', null, 'kpi-table-scroll');
  const t = element('table'); if (caption) t.append(element('caption', caption));
  const head = element('thead'), tr = element('tr');
  for (const title of headers) { const th = element('th', title); th.scope = 'col'; tr.append(th); }
  head.append(tr); const body = element('tbody');
  for (const values of rows) {
    const row = element('tr');
    for (const value of values) { const cell = element('td'); cell.append(value?.nodeType ? value : document.createTextNode(String(value ?? '—'))); row.append(cell); }
    body.append(row);
  }
  if (!rows.length) { const row = element('tr'), cell = element('td', 'No records in this period.'); cell.colSpan = headers.length; row.append(cell); body.append(row); }
  t.append(head, body); wrap.append(t); return wrap;
}
export function csv(rows) {
  const cell = value => {
    let text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (typeof value !== 'number' && /^[\s]*[=+@\-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
  return [keys.map(cell).join(','), ...rows.map(row => keys.map(k => cell(row[k])).join(','))].join('\r\n');
}
export function profileSummary(profile) {
  const box = element('article', null, 'kpi-card');
  box.append(element('h3', profile.label), element('p', profile.finalPoints === null ? 'Provisional' : `${formatValue(profile.finalPoints)} / ${profile.maximumPoints}`, 'kpi-score'));
  box.append(element('p', `${profile.readyMetrics} of ${profile.totalMetrics} metrics scored`, 'kpi-muted'));
  if (profile.readyMetrics) box.append(element('p', `${formatValue(profile.knownPoints)} points from reviewed metrics. Pending metrics are excluded.`));
  else box.append(element('p', 'Add and review evidence to calculate points.'));
  return box;
}
export function drawBars(container, rows, title, unit) {
  container.replaceChildren(element('h3', title));
  if (!rows.length) { container.append(element('p', 'No verified observations for this chart.')); return; }
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg'); svg.classList.add('kpi-chart'); svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${title}. ${rows.map(r => `${r.label}: ${formatValue(r.value, unit)}`).join('; ')}`);
  const draw = () => {
    const width = Math.max(280, container.getBoundingClientRect().width || 700), left = width < 500 ? 100 : 160, right = 80;
    const height = rows.length * 38 + 45, max = Math.max(...rows.map(r => Math.abs(r.value)), 1);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.replaceChildren();
    const add = (tag, attrs, text) => { const el = document.createElementNS(ns, tag); for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value); if (text !== undefined) el.textContent = text; svg.append(el); return el; };
    add('text', { x: left, y: 16 }, unit || 'Count');
    rows.forEach((row, i) => {
      const y = 30 + i * 38;
      const maxChars = width < 500 ? 12 : 22;
      const label = row.label.length > maxChars ? row.label.slice(0, maxChars - 1) + '…' : row.label;
      const labelEl = add('text', { x: left - 10, y: y + 16, 'text-anchor': 'end' }, label);
      const labelTitle = document.createElementNS(ns, 'title'); labelTitle.textContent = row.label; labelEl.append(labelTitle);
      const rect = add('rect', { x: left, y, width: Math.abs(row.value) / max * Math.max(30, width - left - right), height: 23, class: row.value < 0 ? 'negative' : '' });
      const tip = document.createElementNS(ns, 'title'); tip.textContent = `${row.label}: ${formatValue(row.value, unit)}`; rect.append(tip);
      add('text', { x: width - 8, y: y + 16, 'text-anchor': 'end' }, formatValue(row.value, unit));
    });
  };
  container.append(svg); draw();
  // Resize events are scoped to the connected chart; observers stop when its view is replaced.
  if (typeof ResizeObserver !== 'undefined') { const observer = new ResizeObserver(() => { if (!svg.isConnected) observer.disconnect(); else draw(); }); observer.observe(container); }
}
export function drawWaterfall(container, rows, title) {
  container.replaceChildren(element('h3', title));
  if (!rows.length || rows.every(r => r.value === 0)) { container.append(element('p', 'No approved operator commission amounts in this period. Draft amounts appear in the ledger below.')); return; }
  let total = 0; const data = rows.map(r => { const start = total; total += r.value; return { ...r, start, end: total }; });
  data.push({ label: 'Total', value: total, start: 0, end: total });
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'); svg.classList.add('kpi-chart'); svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${title}. ${data.map(r => `${r.label}: ${formatValue(r.value, 'USD')}`).join('; ')}`);
  function draw() {
    const width = Math.max(280, container.getBoundingClientRect().width || 700), height = 300, left = 55, right = 10, top = 35, bottom = 65;
    const min = Math.min(0, ...data.map(r => r.end)), max = Math.max(1, ...data.map(r => r.end)), span = (max - min) * 1.1;
    const y = value => height - bottom - (value - min) / span * (height - top - bottom), step = (width - left - right) / data.length, bar = step * .65;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.replaceChildren();
    const add = (tag, attrs, text) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (text !== undefined) e.textContent = text; svg.append(e); return e; };
    add('text', { x: left, y: 15 }, 'USD');
    for (const tick of [min, (max + min) / 2, max]) { add('line', { x1: left, x2: width - right, y1: y(tick), y2: y(tick), stroke: '#dfe6d8' }); add('text', { x: left - 5, y: y(tick) + 4, 'text-anchor': 'end' }, Math.round(tick).toLocaleString('en-US')); }
    data.forEach((r, i) => {
      const x = left + i * step + (step - bar) / 2;
      const rect = add('rect', { x, y: y(Math.max(r.start, r.end)), width: bar, height: Math.max(1, Math.abs(y(r.start) - y(r.end))), class: r.value < 0 ? 'negative' : '' });
      const tip = document.createElementNS(ns, 'title'); tip.textContent = `${r.label}: ${formatValue(r.value, 'USD')}`; rect.append(tip);
      add('text', { x: x + bar / 2, y: y(Math.max(r.start, r.end)) - 8, 'text-anchor': 'middle' }, width < 550 ? Math.round(r.value).toLocaleString('en-US') : formatValue(r.value, 'USD'));
      const names = { 'Half-inch / training': '½-inch', 'KPI bonus': 'KPI', Deduction: 'Deduct.', Correction: 'Adjust.' };
      add('text', { x: x + bar / 2, y: height - bottom + 22, 'text-anchor': 'middle' }, names[r.label] || r.label);
    });
    add('text', { x: (width + left) / 2, y: height - 8, 'text-anchor': 'middle' }, 'Commission components');
  }
  container.append(svg); draw();
  if (typeof ResizeObserver !== 'undefined') { const observer = new ResizeObserver(() => { if (!svg.isConnected) observer.disconnect(); else draw(); }); observer.observe(container); }
}
