import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { JSDOM } from 'jsdom';
import { renderAssistantMessage } from '../web/message-format.js';
import { readSalesWorkbook, buildSalesReportWorkbook } from '../web/sales-workbook-export.js';
import { reportLayouts } from '../web/sales-workbook-layout.js';

function sample(month = 1, missing = false) {
  const growth = ['Customer','2027 January','2027 YTD','2026 January','2026 YTD','January Growth %','YTD Growth %','2026 Total'];
  const growthValues = ['$50.00','$50.00','$100.00','$100.00','-50.00%','-50.00%','$1,200.00'];
  const headers = [growth, growth, ['Customer','2027 January','2027 YTD',...Array.from({length:month},(_,i)=>String(i+1)),'YTD Budget Total','YTD Budget %','Budget Total','Budget %'], [...growth,'January Budget Total','January Budget %','YTD Budget Total','YTD Budget %','Budget Total','Budget %'], ['Salesperson','Total Sales Amount']];
  const values = [growthValues,growthValues,['$50.00','$50.00',...Array.from({length:month},()=> '~$110.00'),'~$110.00','45.45%','~$1,320.00','3.79%'],[...growthValues,'~$110.00','45.45%','~$110.00','45.45%','~$1,320.00','3.79%'],['$50.00']];
  let text = `# Sales Reporting Workbook\n\nYear: 2027\nPeriod: ${month}\nTerritory: (All)\nDefault increase: 10%\nAs of: 2027-01-28\n\n`;
  reportLayouts.forEach((layout,index) => {
    text += `## ${layout.name}\n\nCurrency: USD\n\n| ${headers[index].join(' | ')} |\n| ${headers[index].map(()=> '---').join(' | ')} |\n`;
    const names = index === 4 ? ['\u00a0\u00a0**Representative One**','\u00a0\u00a0\u00a0\u00a0=Customer One','**Grand Total**'] : index === 0 ? ['**Territory A**','\u00a0\u00a0\u00a0\u00a0=Customer One','**Grand Total**'] : ['**Territory A**','\u00a0\u00a0**Representative One**','\u00a0\u00a0\u00a0\u00a0=Customer One','**Grand Total**'];
    for (const name of names) text += `| ${name} | ${values[index].map((value,i)=>missing&&i===0?'—':value).join(' | ')} |\n`;
    text += '\n';
  });
  return text + 'Source: Acumatica live [E1].\n\nHistory may be incomplete. Estimates are marked ~. No records changed.';
}
function render(text = sample()) { const dom = new JSDOM('<div id="answer"></div>'); const target = dom.window.document.getElementById('answer'); renderAssistantMessage(target,text); return { dom,target }; }

test('all five report views are selectable and exported together from the authorized response', async () => {
  const {dom,target} = render();
  assert.equal(target.querySelectorAll('.sales-workbook-tabs button').length,5);
  assert.equal(target.querySelectorAll('.sales-workbook-section:not([hidden])').length,1);
  target.querySelectorAll('.sales-workbook-tabs button')[3].click();
  assert.equal(target.querySelectorAll('.sales-workbook-section:not([hidden]) h4')[0].textContent,'Sales Growth and Budget');
  const report = readSalesWorkbook(target), workbook = buildSalesReportWorkbook(ExcelJS,report);
  const reopened = new ExcelJS.Workbook(); await reopened.xlsx.load(await workbook.xlsx.writeBuffer());
  assert.deepEqual(reopened.worksheets.map(sheet=>sheet.name),reportLayouts.map(layout=>layout.name));
  const growth = reopened.getWorksheet('Sales Growth');
  assert.equal(growth.getCell('C5').value,2027); assert.equal(growth.getCell('E5').value,2026);
  assert.equal(growth.getCell('C6').value,'January'); assert.equal(growth.getCell('B3').value,'January 2027');
  assert.equal(growth.getCell('C7').value,50); assert.equal(growth.getCell('E7').value,100);
  assert.equal(growth.getCell('G7').value.result,-0.5); assert.match(growth.getCell('G7').value.formula,/SIGN\(C7\)/);
  assert.equal(growth.getCell('B8').value,'=Customer One'); assert.equal(growth.getCell('B8').type,ExcelJS.ValueType.String);
  assert.equal(growth.getColumn(2).width,reportLayouts[0].widths[2]);
  const budget = reopened.getWorksheet('Sales Budget By Salesperson');
  assert.equal(budget.getCell('E6').value,1); assert.equal(budget.getCell('F6').value,'YTD Budget Total');
  assert.equal(budget.getCell('E7').value,110); assert.match(budget.getCell('E7').note,/Estimated/);
  assert.equal(budget.getCell('G7').numFmt,'0.00%'); assert.equal(budget.getCell('G7').value.result,0.4545);
  assert.equal(budget.getCell('I7').value.result,0.0379);
  assert.match(growth.getCell('B12').value,/History may be incomplete/);
  const simple = reopened.getWorksheet('Sales By Salesperson'); assert.equal(simple.getCell('C3').value,2027); assert.equal(simple.getCell('C4').value,1);
  dom.window.close();
});
test('September retains reference header positions, dynamic month budgets and merged groups', () => {
  const {dom,target} = render(sample(9)); const workbook = buildSalesReportWorkbook(ExcelJS,readSalesWorkbook(target));
  const sheet = workbook.getWorksheet('Sales Budget By Salesperson');
  assert.equal(sheet.getCell('M6').value,9); assert.equal(sheet.getCell('N6').value,'YTD Budget Total'); assert.equal(sheet.getCell('Q6').value,'Budget %');
  assert.equal(sheet.getCell('E5').value,'Budget 2027'); assert.equal(sheet.getCell('N5').value,'2027 YTD Budget');
  assert.equal(sheet.getCell('O7').numFmt,'0.00%'); assert.equal(sheet.getCell('Q7').numFmt,'0.00%');
  assert.equal(sheet.getCell('O7').value.formula,'IF(N7=0,SIGN(D7),D7/N7)');
  dom.window.close();
});
test('missing data stays unavailable and export rejects an absent tab or mixed currency', () => {
  const {dom,target} = render(sample(1,true)); const workbook = buildSalesReportWorkbook(ExcelJS,readSalesWorkbook(target));
  assert.equal(workbook.getWorksheet('Sales Growth').getCell('C7').value,'—');
  target.querySelector('table').dataset.currency='CAD'; assert.throws(()=>readSalesWorkbook(target),/Currency mismatch/);
  target.querySelector('table').remove(); assert.throws(()=>readSalesWorkbook(target),/five report tabs/);
  dom.window.close();
});
test('rendering ordinary answers clears workbook controls and scope', () => {
  const {dom,target} = render();renderAssistantMessage(target,'No records matched.');
  assert.equal(target.querySelector('.sales-report-download'),null); assert.equal(target.classList.contains('sales-workbook-answer'),false);assert.equal(target.dataset.reportYear,undefined);dom.window.close();
});
