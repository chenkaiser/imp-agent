import { addSalesReportDownload } from './sales-report-export.js';
// Literal text plus narrowly allowlisted Acumatica order links. Never interpret tool/model HTML.
export function safeSalesOrderLink(label, raw) {
  try {
    const url = new URL(raw);
    if (url.origin !== 'https://imp-ttr.acumatica.com' || url.username || url.password || url.pathname !== '/Main' || url.hash) return null;
    const screen = url.searchParams.get('ScreenId');
    const recordKey = screen === 'SO301000' ? 'OrderNbr' : screen === 'AM201500' ? 'ProdOrdID' : screen === 'AR301000' ? 'RefNbr' : null;
    if (!recordKey) return null;
    const typeKey = screen === 'AR301000' ? 'DocType' : 'OrderType';
    const keys = [...url.searchParams.keys()];
    if (keys.length !== 4 || new Set(keys).size !== 4 || keys.some(k => !['CompanyID', 'ScreenId', typeKey, recordKey].includes(k))) return null;
    if (url.searchParams.get('CompanyID') !== 'International Media Products' ||
      !(screen === 'AR301000' ? /^(INV|CRM|DRM)$/.test(url.searchParams.get(typeKey) || '') : /^[A-Za-z0-9]{1,4}$/.test(url.searchParams.get(typeKey) || '')) || !/^[A-Za-z0-9_-]{1,30}$/.test(label) || url.searchParams.get(recordKey) !== label) return null;
    return url.href;
  } catch { return null; }
}
function inline(parent, text) {
  const doc = parent.ownerDocument;
  const pattern = /\*\*([^*\n]+)\*\*|`([^`\n]+)`|\[([A-Za-z0-9_-]{1,30})\]\((https:\/\/[^\s)]+)\)/g;
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    parent.append(doc.createTextNode(text.slice(offset, match.index)));
    if (match[3]) {
      const href = safeSalesOrderLink(match[3], match[4]);
      if (href) { const link = doc.createElement('a'); link.href = href; link.textContent = match[3]; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer'; parent.append(link); }
      else parent.append(doc.createTextNode(match[0]));
    } else {
      const node = doc.createElement(match[1] ? 'strong' : 'code');
      if (match[1]) inline(node, match[1]); else node.textContent = match[2];
      parent.append(node);
    }
    offset = match.index + match[0].length;
  }
  parent.append(doc.createTextNode(text.slice(offset)));
}

function cells(line) {
  const values = []; let value = '', escaped = false;
  const clean = raw => /^\s*?\u00a0\u00a0/.test(raw) ? '\u00a0\u00a0' + raw.trim() : raw.trim();
  const input = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  for (const ch of input) {
    if (escaped) { value += ch; escaped = false; }
    else if (ch === '\\') escaped = true;
    else if (ch === '|') { values.push(clean(value)); value = ''; }
    else value += ch;
  }
  values.push(clean(value + (escaped ? '\\' : '')));
  return values;
}
const tableLine = line => line.trim().startsWith('|') && line.trim().endsWith('|');
const separator = line => tableLine(line) && cells(line).every(cell => /^:?-{3,}:?$/.test(cell));

export function renderAssistantMessage(target, text) {
  const doc = target.ownerDocument, fragment = doc.createDocumentFragment();
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const reportMode = lines[0] === '# Sales By Salesperson';
  target.classList.toggle('sales-report-answer', reportMode);
  for (let i = 0; i < lines.length;) {
    if (!lines[i].trim()) { i++; continue; }
    if (reportMode && /^Year: \d{4}$/.test(lines[i]) && /^Period: \d{1,2}$/.test(lines[i + 1] || '') && lines[i + 2] === 'Territory: (All)') {
      const filters = doc.createElement('dl'); filters.className = 'sales-report-filters';
      for (const line of lines.slice(i, i + 3)) { const split = line.indexOf(': '); const label = doc.createElement('dt'), value = doc.createElement('dd'); label.textContent = line.slice(0, split); value.textContent = line.slice(split + 2); filters.append(label, value); }
      fragment.append(filters); i += 3; continue;
    }
    if (tableLine(lines[i]) && separator(lines[i + 1] || '')) {
      const headers = cells(lines[i]); i += 2;
      const templateTable = reportMode && headers.length === 2 && headers[0] === 'Salesperson' && headers[1] === 'Total Sales Amount';
      const wrapper = doc.createElement('div'); wrapper.className = 'answer-table-scroll';
      wrapper.tabIndex = 0; wrapper.setAttribute('role', 'region'); wrapper.setAttribute('aria-label', 'Results table');
      const table = doc.createElement('table'), head = doc.createElement('thead'), headRow = doc.createElement('tr');
      if (templateTable) { table.className = 'sales-report-table'; wrapper.classList.add('sales-report-scroll'); }
      for (const label of headers) { const th = doc.createElement('th'); th.scope = 'col'; th.textContent = label; headRow.append(th); }
      head.append(headRow); table.append(head);
      const body = doc.createElement('tbody');
      while (i < lines.length && tableLine(lines[i]) && cells(lines[i]).length === headers.length) {
        const row = doc.createElement('tr');
        for (const [column, value] of cells(lines[i++]).entries()) { const cell = doc.createElement('td');
          const customer = templateTable && column === 0 && value.startsWith('\u00a0\u00a0');
          if (customer) cell.classList.add('report-customer-cell');
          inline(cell, customer ? value.slice(2) : value); row.append(cell);
        }
        body.append(row);
      }
      table.append(body); wrapper.append(table); fragment.append(wrapper); continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(lines[i]);
    if (heading) { const node = doc.createElement('h' + (heading[1].length + 2)); inline(node, heading[2]); fragment.append(node); i++; continue; }
    if (/^[-*]\s+/.test(lines[i])) {
      const list = doc.createElement('ul');
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        const item = doc.createElement('li'); inline(item, lines[i++].replace(/^[-*]\s+/, '')); list.append(item);
      }
      fragment.append(list); continue;
    }
    const paragraph = doc.createElement('p');
    while (i < lines.length && lines[i].trim() && !(tableLine(lines[i]) && separator(lines[i + 1] || '')) && !/^#{1,3}\s|^[-*]\s/.test(lines[i])) {
      if (paragraph.childNodes.length) paragraph.append(doc.createElement('br'));
      inline(paragraph, lines[i++]);
    }
    if (paragraph.textContent.startsWith('Source:')) paragraph.className = 'answer-source';
    fragment.append(paragraph);
  }
  target.replaceChildren(fragment); target.classList.add('formatted-answer');
  if (reportMode) addSalesReportDownload(target);
}
