// Export only the already-authorized, displayed report. No new API calls or external services.
let library;
async function excelLibrary(doc) {
  if (doc.defaultView.ExcelJS) return doc.defaultView.ExcelJS;
  library ??= new Promise((resolve, reject) => {
    const script = doc.createElement('script'); script.src = '/vendor/exceljs.min.js';
    script.onload = () => resolve(doc.defaultView.ExcelJS);
    script.onerror = () => { script.remove(); library = null; reject(new Error('Excel export could not load. Please retry.')); };
    doc.head.append(script);
  });
  return library;
}
export function readSalesReport(target) {
  if (!target.classList.contains('sales-report-answer')) throw new Error('No sales report is available to export.');
  const filters = [...target.querySelectorAll('.sales-report-filters dd')].map(x => x.textContent);
  if (!/^\d{4}$/.test(filters[0]) || !/^(?:[1-9]|1[0-2])$/.test(filters[1]) || filters[2] !== '(All)') throw new Error('Report period is unavailable.');
  const sheets = [...target.querySelectorAll('.sales-report-table')].map(table => {
    let currency;
    const rows = [...table.querySelectorAll('tbody tr')].map(row => {
      const [name, amount] = row.cells;
      const match = /^(-?)(\$|[A-Z]{3} )([\d,]+\.\d{2})$/.exec(amount.textContent.trim());
      if (!match) throw new Error('A report amount is unavailable; export was not created.');
      const code = match[2] === '$' ? 'USD' : match[2].trim();
      if (currency && code !== currency) throw new Error('Mixed currencies cannot be exported together.');
      currency = code;
      const value = Number(match[1] + match[3].replaceAll(',', ''));
      if (!Number.isFinite(value)) throw new Error('Invalid report amount.');
      return { name: name.textContent, amount: value, customer: name.classList.contains('report-customer-cell') };
    });
    if (!rows.length || rows.at(-1).name !== 'Grand Total') throw new Error('The complete report is required for export.');
    return { currency, rows };
  });
  if (!sheets.length) throw new Error('There are no report rows to export.');
  const notes = [...target.querySelectorAll(':scope > p')].map(p => p.textContent).join('\n');
  return { year: Number(filters[0]), period: Number(filters[1]), territory: filters[2], sheets, notes };
}
export function buildSalesWorkbook(ExcelJS, report) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'IMP Agent';
  for (const data of report.sheets) {
    const sheet = workbook.addWorksheet(report.sheets.length === 1 ? 'Sales By Salesperson' : `Sales By Salesperson ${data.currency}`);
    sheet.columns = [{ width: 3.285 }, { width: 61.425 }, { width: 18.285 }];
    sheet.getCell('B2').value = 'Sales By Salesperson'; sheet.getCell('B2').font = { name: 'Calibri', size: 18, bold: true };
    sheet.getCell('B3').value = 'Year'; sheet.getCell('C3').value = report.year;
    sheet.getCell('B4').value = 'Period'; sheet.getCell('C4').value = report.period;
    sheet.getCell('B5').value = 'Territory'; sheet.getCell('C5').value = report.territory;
    sheet.getCell('B7').value = 'Salesperson'; sheet.getCell('C7').value = 'Total Sales Amount';
    const format = data.currency === 'USD' ? '"$"#,##0.00;"-$"#,##0.00' : `"${data.currency} "#,##0.00;"-${data.currency} "#,##0.00`;
    data.rows.forEach((row, index) => {
      const line = index + 8;
      sheet.getCell(line, 2).value = row.name; sheet.getCell(line, 3).value = row.amount;
      for (const column of [2, 3]) sheet.getCell(line, column).font = { name: 'Calibri', size: 11, bold: !row.customer };
      sheet.getCell(line, 2).alignment = { indent: row.customer ? 1 : 0 };
      sheet.getCell(line, 3).numFmt = format;
    });
    for (const address of ['B3','C3','B4','C4','B5','C5','B7','C7']) sheet.getCell(address).font = { name: 'Calibri', size: 11, bold: address.endsWith('7') };
    sheet.views = [{ state: 'frozen', ySplit: 7 }];
    const noteRow = data.rows.length + 10;
    sheet.mergeCells(`B${noteRow}:C${noteRow}`); sheet.getCell(noteRow, 2).value = report.notes;
    sheet.getCell(noteRow, 2).alignment = { wrapText: true, vertical: 'top' };
    sheet.getRow(noteRow).height = 90;
    sheet.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:7' };
  }
  return workbook;
}
export function addSalesReportDownload(target) {
  if (!target.querySelector('.sales-report-table')) return;
  const doc = target.ownerDocument, button = doc.createElement('button');
  button.type = 'button'; button.className = 'sales-report-download'; button.textContent = 'Download Excel (.xlsx)';
  const status = doc.createElement('span'); status.className = 'sales-report-export-status'; status.setAttribute('role', 'status');
  button.addEventListener('click', async () => {
    button.disabled = true; status.textContent = 'Preparing spreadsheet…';
    try {
      const report = readSalesReport(target), ExcelJS = await excelLibrary(doc);
      const bytes = await buildSalesWorkbook(ExcelJS, report).xlsx.writeBuffer();
      const url = doc.defaultView.URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = doc.createElement('a'); link.href = url; link.download = `Sales-By-Salesperson-${report.year}-${String(report.period).padStart(2, '0')}.xlsx`;
      doc.body.append(link); link.click(); link.remove();
      doc.defaultView.setTimeout(() => doc.defaultView.URL.revokeObjectURL(url), 60000);
      status.textContent = 'Spreadsheet ready.';
    } catch (error) { status.textContent = error.message || 'Export failed. Please retry.'; }
    finally { button.disabled = false; }
  });
  const actions = doc.createElement('div'); actions.className = 'sales-report-actions'; actions.append(button, status); target.prepend(actions);
}
