import { reportLayouts } from './sales-workbook-layout.js';
import { excelLibrary } from './sales-report-export.js';

const names = reportLayouts.map(layout => layout.name);
const column = index => { let result = ''; for (; index > 0; index = Math.floor((index - 1) / 26)) result = String.fromCharCode(65 + (index - 1) % 26) + result; return result; };
function numeric(text, percentage) {
  const estimated = text.startsWith('~'); text = text.replace(/^~/, '').trim();
  if (text === '—') return { value: null, estimated };
  const pattern = percentage ? /^(-?\d+(?:\.\d+)?)%$/ : /^(-?)(\$|[A-Z]{3} )([\d,]+\.\d{2})$/;
  const match = pattern.exec(text);
  if (!match) throw new Error('A report value is invalid; the workbook was not exported.');
  const value = percentage ? Number(match[1]) / 100 : Number(match[1] + match[3].replaceAll(',', ''));
  if (!Number.isFinite(value)) throw new Error('Invalid report amount.');
  return { value, estimated, currency: percentage ? null : match[2] === '$' ? 'USD' : match[2].trim() };
}
export function readSalesWorkbook(target) {
  const year = Number(target.dataset.reportYear), month = Number(target.dataset.reportMonth);
  if (!target.classList.contains('sales-workbook-answer') || !Number.isInteger(year) || year < 2001 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) throw new Error('Report year and month are unavailable.');
  const tables = [...target.querySelectorAll('table[data-report-sheet]')].map(table => {
    const index = names.indexOf(table.dataset.reportSheet), currency = table.dataset.currency;
    if (index < 0 || !/^[A-Z]{3}$/.test(currency)) throw new Error('Report scope is unavailable.');
    const headers = [...table.querySelectorAll('thead th')].map(cell => cell.textContent);
    const expected = index === 4 ? 2 : index === 2 ? month + 7 : index === 3 ? 14 : 8;
    if (headers.length !== expected) throw new Error('The report columns are incomplete.');
    const rows = [...table.querySelectorAll('tbody tr')].map(row => {
      if (row.cells.length !== expected) throw new Error('Incomplete report row.');
      const raw = row.cells[0].textContent, indent = Number(row.cells[0].dataset.reportIndent || 0);
      const name = raw.trim(), kind = name === 'Grand Total' ? 'total' : index === 4 ? indent > 1 ? 'customer' : 'salesperson' : indent > 1 ? 'customer' : indent ? 'salesperson' : 'territory';
      const values = [...row.cells].slice(1).map((cell, offset) => numeric(cell.textContent.trim(), headers[offset + 1].endsWith('%')));
      if (values.some(value => value.currency && value.currency !== currency)) throw new Error('Currency mismatch.');
      return { name, kind, values };
    });
    if (!rows.length || rows.at(-1).kind !== 'total') throw new Error('The complete report is required for export.');
    return { index, currency, rows };
  });
  const currencies = [...new Set(tables.map(table => table.currency))];
  if (!currencies.length || currencies.some(currency => names.some((_, index) => tables.filter(table => table.currency === currency && table.index === index).length !== 1))) throw new Error('All five report tabs are required for export.');
  return { year, month, tables, notes: target.dataset.reportNotes || [...target.querySelectorAll(':scope > p')].map(p => p.textContent).join('\n') };
}
export function buildSalesReportWorkbook(ExcelJS, report) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'IMP Agent';
  const currencies = [...new Set(report.tables.map(table => table.currency))];
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(report.year, report.month - 1, 1)));
  for (const data of report.tables) {
    const layout = reportLayouts[data.index], index = data.index, count = data.rows[0].values.length + 1;
    const name = currencies.length === 1 ? layout.name : `${layout.name.slice(0, 27)} ${data.currency}`;
    const sheet = workbook.addWorksheet(name);
    const sourceColumn = number => index === 2 && number >= 5 ? number < 5 + report.month ? Math.min(number, 13) : number - report.month + 9 : number;
    for (let number = 1; number <= count + 1; number++) sheet.getColumn(number).width = layout.widths[sourceColumn(number)] || 15;
    const apply = (row, col, type) => {
      const cell = sheet.getCell(row, col), source = layout.styles[type]?.[column(sourceColumn(col))];
      if (source) cell.style = structuredClone(source);
      return cell;
    };
    sheet.getCell('B2').value = index === 1 ? 'Sales Growth By Salesperson' : index === 3 ? 'Sales Growth and Budget By Salesperson' : layout.name;
    sheet.getCell('B2').style = structuredClone(layout.styles.title.B || { font: { name: 'Calibri', size: 18, bold: true } });
    const headerRow = index === 4 ? 7 : 6;
    if (index === 4) {
      sheet.getCell('B3').value = 'Year'; sheet.getCell('C3').value = report.year;
      sheet.getCell('B4').value = 'Period'; sheet.getCell('C4').value = report.month;
      sheet.getCell('B5').value = 'Territory'; sheet.getCell('C5').value = '(All)';
      sheet.getCell('B7').value = 'Salesperson'; sheet.getCell('C7').value = 'Total Sales Amount';
    } else {
      sheet.getCell('B3').value = `${monthName} ${report.year}`;
      for (let col = 2; col <= count + 1; col++) { apply(5, col, 'group'); apply(6, col, 'header'); }
      const merge = (start, end, value) => { if (start !== end) sheet.mergeCells(5, start, 5, end); sheet.getCell(5, start).value = value; };
      merge(3, 4, report.year);
      sheet.getCell('B6').value = 'Customer'; sheet.getCell('C6').value = monthName; sheet.getCell('D6').value = `${monthName} YTD`;
      if (index === 2) {
        merge(5, 4 + report.month, `Budget ${report.year}`);
        for (let m = 1; m <= report.month; m++) sheet.getCell(6, m + 4).value = m;
        const first = 5 + report.month;
        merge(first, first + 1, `${report.year} YTD Budget`); merge(first + 2, first + 3, `${report.year} Budget`);
        ['YTD Budget Total', 'YTD Budget %', 'Budget Total', 'Budget %'].forEach((label, offset) => { sheet.getCell(6, first + offset).value = label; });
      } else {
        merge(5, 6, report.year - 1); merge(7, 8, `${report.year}/${report.year - 1}`);
        sheet.mergeCells('I5:I6'); sheet.getCell('I5').value = `${report.year - 1} Total`;
        ['E6','F6','G6','H6'].forEach((address, i) => { sheet.getCell(address).value = [monthName, `${monthName} YTD`, `${monthName} Growth %`, 'YTD Growth %'][i]; });
        if (index === 3) {
          merge(10, 11, `${monthName} Budget`); merge(12, 13, `${report.year} YTD Budget`); merge(14, 15, `${report.year} Budget`);
          [`${monthName} Budget Total`, `${monthName} Budget %`, 'YTD Budget Total', 'YTD Budget %', 'Budget Total', 'Budget %'].forEach((value, i) => { sheet.getCell(6, i + 10).value = value; });
        }
      }
    }
    for (let col = 2; col <= count + 1; col++) apply(headerRow, col, 'header');
    const currencyFormat = data.currency === 'USD' ? '"$"#,##0.00;"-$"#,##0.00' : `"${data.currency} "#,##0.00;"-${data.currency} "#,##0.00`;
    data.rows.forEach((row, offset) => {
      const line = headerRow + offset + 1;
      apply(line, 2, row.kind).value = row.name;
      row.values.forEach((value, i) => {
        const cell = apply(line, i + 3, row.kind);
        cell.value = value.value === null ? '—' : value.value;
        const percent = index === 2 ? [report.month + 6, report.month + 8].includes(i + 3) : index === 3 ? [7,8,11,13,15].includes(i + 3) : index !== 4 && [7,8].includes(i + 3);
        cell.numFmt = percent ? '0.00%' : currencyFormat;
        if (value.estimated) { cell.note = 'Estimated budget baseline. See the report coverage note.'; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }; }
      });
      const ratio = (target, numerator, denominator, growth) => {
        const cell = sheet.getCell(`${target}${line}`), result = cell.value;
        if (typeof result === 'number') cell.value = { formula: `IF(${denominator}${line}=0,SIGN(${numerator}${line}),${numerator}${line}/${denominator}${line}${growth ? '-1' : ''})`, result };
      };
      if ([0,1,3].includes(index)) { ratio('G','C','E',true); ratio('H','D','F',true); }
      if (index === 3) { ratio('K','C','J',false); ratio('M','D','L',false); ratio('O','D','N',false); }
      if (index === 2) { ratio(column(report.month + 6),'D',column(report.month + 5),false); ratio(column(report.month + 8),'D',column(report.month + 7),false); }
    });
    const noteRow = headerRow + data.rows.length + 3;
    sheet.mergeCells(noteRow, 2, noteRow, count + 1); sheet.getCell(noteRow, 2).value = report.notes;
    sheet.getCell(noteRow, 2).alignment = { wrapText: true, vertical: 'top' }; sheet.getRow(noteRow).height = 110;
    sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: headerRow }];
    sheet.pageSetup = { orientation: index === 4 ? 'portrait' : 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: `1:${headerRow}` };
  }
  return workbook;
}
export function addSalesWorkbookDownload(target) {
  if (!target.querySelector('table[data-report-sheet]')) return;
  target.dataset.reportNotes = [...target.querySelectorAll(':scope > p')].filter(p => !p.textContent.startsWith('Currency:')).map(p => p.textContent).join('\n');
  const doc = target.ownerDocument, tabs = doc.createElement('div'); tabs.className = 'sales-workbook-tabs'; tabs.setAttribute('role','group'); tabs.setAttribute('aria-label','Sales report tabs');
  const headings = [...target.querySelectorAll(':scope > h4')].filter(heading => names.includes(heading.textContent));
  const sections = headings.map(heading => {
    const section = doc.createElement('section'); section.className = 'sales-workbook-section'; heading.before(section);
    let node = heading;
    while (node && (node === heading || node.classList?.contains('answer-table-scroll') || node.nodeType === 3 || node.tagName === 'P' && node.textContent.startsWith('Currency:'))) { const next = node.nextSibling; section.append(node); node = next; }
    return section;
  });
  sections.forEach((section, index) => {
    const button = doc.createElement('button'); button.type = 'button'; button.textContent = names[index];
    button.addEventListener('click', () => { sections.forEach((part, i) => { part.hidden = i !== index; }); [...tabs.children].forEach((part, i) => part.setAttribute('aria-pressed', String(i === index))); });
    button.setAttribute('aria-pressed', String(index === 0)); tabs.append(button); section.hidden = index !== 0;
  });
  const actions = doc.createElement('div'); actions.className = 'sales-report-actions';
  const button = doc.createElement('button'); button.type = 'button'; button.className = 'sales-report-download'; button.textContent = 'Download all five tabs (.xlsx)';
  const status = doc.createElement('span'); status.setAttribute('role','status');
  button.addEventListener('click', async () => {
    button.disabled = true; status.textContent = 'Preparing workbook…';
    try {
      const report = readSalesWorkbook(target), ExcelJS = await excelLibrary(doc);
      const buffer = await buildSalesReportWorkbook(ExcelJS, report).xlsx.writeBuffer();
      const url = doc.defaultView.URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = doc.createElement('a'); link.href = url; link.download = `Sales-Report-${report.year}-${String(report.month).padStart(2,'0')}.xlsx`; doc.body.append(link); link.click(); link.remove();
      doc.defaultView.setTimeout(() => doc.defaultView.URL.revokeObjectURL(url), 60000); status.textContent = 'Workbook ready.';
    } catch (error) { status.textContent = error.message || 'Export failed. Please retry.'; }
    finally { button.disabled = false; }
  });
  actions.append(button,status); target.prepend(actions,tabs);
}
