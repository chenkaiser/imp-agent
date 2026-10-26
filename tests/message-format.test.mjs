import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderAssistantMessage } from '../web/message-format.js';

function body(text) {
  const dom = new JSDOM('<div id="answer"></div>');
  const element = dom.window.document.getElementById('answer');
  renderAssistantMessage(element, text);
  return { dom, element };
}

test('order results render as an accessible table with all five rows', () => {
  const { dom, element } = body('Here are **5 sales orders**, newest first.\n\n| Order | Customer | Status |\n| --- | --- | --- |\n' +
    Array.from({ length: 5 }, (_, i) => `| SO000018${i} | Customer ${i} | Open |`).join('\n') + '\n\nSource: live Acumatica.');
  assert.equal(element.querySelectorAll('tbody tr').length, 5);
  assert.equal(element.querySelector('strong').textContent, '5 sales orders');
  assert.equal(element.querySelector('th').scope, 'col');
  assert.equal(element.querySelector('[role="region"]').tabIndex, 0);
  assert.equal(element.querySelectorAll('p').length, 2);
  assert.equal(element.querySelector('.answer-source').textContent, 'Source: live Acumatica.');
  dom.window.close();
});

test('HTML and script-like content remains literal text', () => {
  const unsafe = '<img src=x onerror="alert(1)">';
  const { dom, element } = body(`| Order | PO |\n| --- | --- |\n| SO1 | ${unsafe} |\n\n<script>alert(1)</script>`);
  assert.equal(element.querySelector('img,script'), null);
  assert.ok(element.textContent.includes(unsafe));
  assert.ok(element.textContent.includes('<script>'));
  dom.window.close();
});

test('escaped pipes and backslashes stay inside their cells', () => {
  const { dom, element } = body('| Order | Customer PO |\n| --- | --- |\n| SO1 | A\\|B\\\\C |');
  assert.equal(element.querySelectorAll('td').length, 2);
  assert.equal(element.querySelectorAll('td')[1].textContent, 'A|B\\C');
  dom.window.close();
});

test('ordinary answers, headings and lists remain readable and rerenders replace content', () => {
  const { dom, element } = body('### Availability\n\nAvailable Quantity: **17 ROLL** in `MAIN`.\n\n- Verified now\n- Available quantity differs from on-hand stock');
  assert.equal(element.querySelector('h5').textContent, 'Availability');
  assert.equal(element.querySelectorAll('li').length, 2);
  assert.equal(element.querySelector('code').textContent, 'MAIN');
  renderAssistantMessage(element, 'No orders matched.');
  assert.equal(element.textContent, 'No orders matched.');
  assert.equal(element.querySelector('table,ul'), null);
  dom.window.close();
});

const orderUrl = 'https://imp-ttr.acumatica.com/Main?CompanyID=International%20Media%20Products&ScreenId=SO301000&OrderType=SO&OrderNbr=SO0000181';
const productionUrl = 'https://imp-ttr.acumatica.com/Main?CompanyID=International%20Media%20Products&ScreenId=AM201500&OrderType=MO&ProdOrdID=PROD0000003';
test('verified production references render as secure links in headings and tables', () => {
  const { dom, element } = body(`**Material readiness — [PROD0000003](${productionUrl})**\n\n| Production order | Status |\n| --- | --- |\n| [PROD0000003](${productionUrl}) | Released |`);
  assert.equal(element.querySelectorAll('a').length, 2);
  for (const link of element.querySelectorAll('a')) {
    assert.equal(link.href, productionUrl); assert.equal(link.textContent, 'PROD0000003');
    assert.equal(link.target, '_blank'); assert.equal(link.rel, 'noopener noreferrer');
  }
  dom.window.close();
});
test('production links reject wrong keys, identifiers, hosts and additional parameters', () => {
  const urls = [productionUrl.replace('ProdOrdID', 'OrderNbr'), productionUrl + '&token=secret', productionUrl + '&ProdOrdID=OTHER', productionUrl.replace('imp-ttr.acumatica.com', 'evil.example'), productionUrl.replace('PROD0000003', 'OTHER')];
  const { dom, element } = body(urls.map(url => `[PROD0000003](${url})`).join('\n'));
  assert.equal(element.querySelectorAll('a').length, 0); dom.window.close();
});
test('verified order references become secure links in tables and headings', () => {
  const { dom, element } = body(`**Sales order [SO0000181](${orderUrl})**\n\n| Order | Price |\n| --- | --- |\n| [SO0000181](${orderUrl}) | 7.27 |`);
  assert.equal(element.querySelectorAll('a').length, 2);
  for (const link of element.querySelectorAll('a')) { assert.equal(link.textContent, 'SO0000181'); assert.equal(link.target, '_blank'); assert.equal(link.rel, 'noopener noreferrer'); assert.equal(link.referrerPolicy, 'no-referrer'); }
  assert.equal(element.querySelector('td a').href, orderUrl); dom.window.close();
});
test('untrusted origins, record mismatches, credentials, duplicate keys and active URLs stay text', () => {
  const links = [orderUrl.replace('imp-ttr.acumatica.com', 'evil.example'), orderUrl.replace('https://', 'https://user:password@'), orderUrl + '&OrderNbr=OTHER', orderUrl + '#fragment', orderUrl.replace('SO301000', 'SM201020'), orderUrl.replace('SO0000181', 'OTHER'), 'javascript:alert(1)', orderUrl + '&token=secret'];
  const { dom, element } = body(links.map(url => `[SO0000181](${url})`).join('\n'));
  assert.equal(element.querySelector('a,script,img'), null); dom.window.close();
});

test('verified AR invoices and credits render as safe Acumatica links', () => {
  for (const type of ['INV', 'CRM', 'DRM']) {
    const { dom, element } = body(`[INV000198](https://imp-ttr.acumatica.com/Main?CompanyID=International%20Media%20Products&ScreenId=AR301000&DocType=${type}&RefNbr=INV000198)`);
    assert.equal(element.querySelectorAll('a').length, 1);
    assert.equal(element.querySelector('a').target, '_blank');
    dom.window.close();
  }
});
test('invoice link allowlist rejects mismatched records, extra keys and unsupported types', () => {
  const base = 'https://imp-ttr.acumatica.com/Main?CompanyID=International%20Media%20Products&ScreenId=AR301000';
  for (const suffix of ['&DocType=INV&RefNbr=OTHER', '&DocType=PAY&RefNbr=INV000198', '&DocType=INV&RefNbr=INV000198&x=1', '&DocType=INV&DocType=CRM&RefNbr=INV000198']) {
    const { dom, element } = body(`[INV000198](${base}${suffix})`);
    assert.equal(element.querySelectorAll('a').length, 0); dom.window.close();
  }
});


test('sales report matches template filters, two columns, customer indentation and grand total', () => {
  const text = '# Sales By Salesperson\n\nYear: 2026\nPeriod: 10\nTerritory: (All)\n\n| Salesperson | Total Sales Amount |\n| --- | --- |\n| **Representative Alpha** | **$100.00** |\n| \u00a0\u00a0Example Customer | $100.00 |\n| **Grand Total** | **$100.00** |';
  const { dom, element } = body(text);
  assert.ok(element.classList.contains('sales-report-answer'));
  assert.deepEqual([...element.querySelectorAll('dt')].map(n => n.textContent), ['Year', 'Period', 'Territory']);
  assert.deepEqual([...element.querySelectorAll('dd')].map(n => n.textContent), ['2026', '10', '(All)']);
  assert.equal(element.querySelectorAll('.sales-report-table th').length, 2);
  assert.equal(element.querySelector('.report-customer-cell').textContent, 'Example Customer');
  assert.equal(element.querySelectorAll('tbody tr').length, 3);
  assert.match(element.querySelector('tbody tr:last-child').textContent, /Grand Total/);
  dom.window.close();
});
