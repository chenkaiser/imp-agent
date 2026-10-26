import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { formatValue, csv, profileSummary, normalizeKeys, table, drawBars, drawWaterfall } from '../web/kpi-view.js';
const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
test('missing scores remain pending and hostile evidence stays literal', () => {
  const dom = new JSDOM(html); globalThis.document = dom.window.document;
  const card = profileSummary({ label: 'Sales', finalPoints: null, maximumPoints: 100, readyMetrics: 0, totalMetrics: 6, knownPoints: 0 });
  assert.match(card.textContent, /Provisional/); assert.doesNotMatch(card.textContent, /0 \/ 100/);
  const result = table(['Record'], [['<img src=x onerror=alert(1)>']]); assert.equal(result.querySelector('img'), null); assert.match(result.textContent, /<img/);
  assert.equal(formatValue(null, 'USD'), 'Awaiting evidence'); assert.equal(formatValue(.98, '%'), '98%'); dom.window.close();
});
test('CSV export blocks spreadsheet formula execution and preserves numeric negatives', () => {
  const result = csv([{ reference: '=HYPERLINK("evil")', amount: -20 }, { reference: ' @SUM(A1)', amount: 0 }]);
  assert.match(result, /'=HYPERLINK/); assert.match(result, /' @SUM/); assert.match(result, /"-20"/);
});
test('all chart amounts and labels remain accessible, including negative adjustments', () => {
  const dom = new JSDOM(html); globalThis.document = dom.window.document; const target = document.createElement('div'); document.body.append(target);
  drawBars(target, [{ label: 'Base', value: 725.65 }, { label: 'Deduction', value: -60 }], 'Commission', 'USD');
  assert.equal(target.querySelectorAll('rect').length, 2); assert.match(target.querySelector('svg').getAttribute('aria-label'), /Deduction: -\$60.00/);
  assert.equal(target.querySelector('rect.negative').getAttribute('width') > 0, true); dom.window.close();
});
test('commission waterfall shows the actual running total and separates missing approvals', () => {
  const dom = new JSDOM(html); globalThis.document = dom.window.document; const target = document.createElement('div'); document.body.append(target);
  drawWaterfall(target, [{ label: 'Base', value: 725.65 }, { label: 'Half-inch / training', value: 75 }, { label: 'Deduction', value: -60 }, { label: 'KPI bonus', value: 93.44 }], 'Commission');
  assert.equal(target.querySelectorAll('rect').length, 5); assert.match(target.querySelector('svg').getAttribute('aria-label'), /Total: \$834.09/);
  drawWaterfall(target, [{ label: 'Base', value: 0 }], 'Commission'); assert.equal(target.querySelector('svg'), null); assert.match(target.textContent, /No approved/); dom.window.close();
});
test('Executive dashboard uses server authorization, immutable source evidence and revision checks', async () => {
  const dom = new JSDOM(html, { url: 'https://ask.impops.work/chat' });
  for (const name of ['document', 'location', 'history']) globalThis[name] = dom.window[name];
  const token = 'h.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.s';
  const session = { token, accessToken: 'erp', expiresAt: Date.now() + 3600000 };
  const calls = []; globalThis.fetch = async (url, options) => { calls.push({ url, options });
    const data = url.endsWith('catalog') ? { Version: '2026.1', Profiles: { sales: 'Sales' }, Definitions: [] } : url.includes('dashboard?') ? { Period: { Start: '2026-01-01', End: '2026-10-22', Scope: 'All' }, CheckedAtUtc: '2026-10-22T15:00:00Z', RuleVersion: '2026.1', Warnings: ['Missing history'], Profiles: [{ Id: 'sales', Label: 'Sales', MaximumPoints: 100, KnownPoints: 0, FinalPoints: null, ReadyMetrics: 0, TotalMetrics: 6, Metrics: [] }] } : [];
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }); };
  const { createKpiWorkspace } = await import('../web/kpi.js'); const workspace = createKpiWorkspace({ getSession: () => session, onUnauthorized: () => {}, onBack: () => {} });
  await workspace.open(); assert.equal(location.pathname, '/kpi'); assert.match(document.getElementById('kpi-content').textContent, /Missing history/);
  assert.ok(calls.every(c => c.options.headers.Authorization === `Bearer ${token}`)); assert.ok(calls.every(c => c.options.headers['X-Acumatica-Access-Token'] === 'erp'));
  workspace.deactivate(); assert.equal(document.getElementById('kpi-content').childElementCount, 0); assert.equal(document.getElementById('kpi-screen').hidden, true);
  assert.deepEqual(normalizeKeys({ EvidenceId: 'id', Data: { ExpectedRevision: 2 } }), { evidenceId: 'id', data: { expectedRevision: 2 } }); dom.window.close();
});
