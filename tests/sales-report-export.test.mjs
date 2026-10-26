import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { renderAssistantMessage } from '../web/message-format.js';
import { readSalesReport, buildSalesWorkbook } from '../web/sales-report-export.js';

const sample = '# Sales By Salesperson\n\nYear: 2026\nPeriod: 10\nTerritory: (All)\n\n| Salesperson | Total Sales Amount |\n| --- | --- |\n| **Example Representative** | **$120.50** |\n| \u00a0\u00a0=Example Customer | $125.50 |\n| \u00a0\u00a0Credit Customer | -$5.00 |\n| **Grand Total** | **$120.50** |\n\nSource: live Acumatica [E1].';
function report(text = sample) {
  const dom = new JSDOM('<div id="answer"></div>'); const target = dom.window.document.getElementById('answer');
  renderAssistantMessage(target, text); return { dom, target };
}
test('download workbook retains reference cells, numeric amounts, names, indentation and source', async () => {
  const { dom, target } = report();
  assert.equal(target.querySelector('.sales-report-download').textContent, 'Download Excel (.xlsx)');
  const workbook = buildSalesWorkbook(ExcelJS, readSalesReport(target));
  const reopened = new ExcelJS.Workbook(); await reopened.xlsx.load(await workbook.xlsx.writeBuffer());
  const sheet = reopened.getWorksheet('Sales By Salesperson');
  assert.equal(sheet.getCell('B2').value, 'Sales By Salesperson');
  assert.equal(sheet.getCell('C3').value, 2026); assert.equal(sheet.getCell('C4').value, 10);
  assert.equal(sheet.getCell('B9').value, '=Example Customer'); // Literal text, never a spreadsheet formula.
  assert.equal(sheet.getCell('B9').type, ExcelJS.ValueType.String);
  assert.equal(sheet.getCell('B9').alignment.indent, 1);
  assert.equal(sheet.getCell('C9').value, 125.5); assert.equal(sheet.getCell('C10').value, -5);
  assert.equal(sheet.getCell('B11').value, 'Grand Total'); assert.equal(sheet.getCell('C11').value, 120.5);
  assert.match(sheet.getCell('B14').value, /Source: live Acumatica/);
  assert.equal(sheet.getCell('B8').font.bold, true); dom.window.close();
});
test('export rejects incomplete or invalid amounts and is absent from normal answers', () => {
  const { dom, target } = report(sample.replace('$125.50', 'Unavailable'));
  assert.throws(() => readSalesReport(target), /unavailable/);
  renderAssistantMessage(target, 'No records matched.');
  assert.equal(target.querySelector('.sales-report-download'), null);
  dom.window.close();
});
test('export separates currencies into worksheets and retains more than 25 customer rows', () => {
  const text = '# Sales By Salesperson\n\nYear: 2026\nPeriod: 10\nTerritory: (All)\n\nCurrency: USD\n\n| Salesperson | Total Sales Amount |\n| --- | --- |\n| **Representative** | **$30.00** |\n' + Array.from({length:30}, (_,i) => `| \u00a0\u00a0Customer ${i} | $1.00 |`).join('\n') + '\n| **Grand Total** | **$30.00** |\n\nCurrency: CAD\n\n| Salesperson | Total Sales Amount |\n| --- | --- |\n| **Representative** | **CAD 2.00** |\n| \u00a0\u00a0Customer | CAD 2.00 |\n| **Grand Total** | **CAD 2.00** |';
  const { dom, target } = report(text); const data = readSalesReport(target), workbook = buildSalesWorkbook(ExcelJS, data);
  assert.equal(data.sheets[0].rows.length, 32);
  assert.equal(workbook.worksheets.length, 2); assert.equal(workbook.worksheets[1].name, 'Sales By Salesperson CAD');
  assert.equal(workbook.worksheets[0].getCell('C39').value, 30); dom.window.close();
});
test('the shipped browser bundle creates a readable XLSX without server calls', async () => {
  const dom = new JSDOM('<div id="answer"></div>', { runScripts: 'outside-only' });
  dom.window.eval(await readFile(new URL('../web/vendor/exceljs.min.js', import.meta.url), 'utf8'));
  const target = dom.window.document.getElementById('answer'); renderAssistantMessage(target, sample);
  const bytes = await buildSalesWorkbook(dom.window.ExcelJS, readSalesReport(target)).xlsx.writeBuffer();
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(Buffer.from(bytes));
  assert.equal(workbook.getWorksheet(1).getCell('C11').value, 120.5); dom.window.close();
});
