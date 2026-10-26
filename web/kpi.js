import { API_BASE } from './config.js';
import { activeSession } from './lib.js';
import { element as el, normalizeKeys, formatValue as fmt, table, csv, profileSummary, drawBars, drawWaterfall } from './kpi-view.js';

export function createKpiWorkspace({ getSession, onUnauthorized, onBack }) {
  const root = document.getElementById('kpi-screen'), status = document.getElementById('kpi-status'), content = document.getElementById('kpi-content');
  const dialog = document.getElementById('kpi-evidence-dialog'), detail = document.getElementById('kpi-evidence-body');
  let active = false, catalog, dashboard, events = [], currentView = 'overview', generation = 0, loadVersion = 0;
  const pending = new Set();
  const period = () => ({ start: document.getElementById('kpi-start').value, end: document.getElementById('kpi-end').value, scope: document.getElementById('kpi-scope').value });
  const params = () => new URLSearchParams(period());
  const setStatus = (text, error = false) => { status.textContent = text; status.classList.toggle('kpi-error', error); };
  const button = (text, action, className = 'kpi-button') => { const b = el('button', text, className); b.type = 'button'; b.addEventListener('click', () => execute(action)); return b; };
  async function api(path, body, method = body === undefined ? 'GET' : 'POST', raw = false) {
    const session = getSession(), started = generation;
    if (!activeSession(session)) { onUnauthorized(); throw new Error('Sign in again to continue.'); }
    const abort = new AbortController(); pending.add(abort);
    const headers = { Authorization: `Bearer ${session.token}`, 'X-Acumatica-Access-Token': session.accessToken };
    if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    try {
      const response = await fetch(`${API_BASE}/v1/Kpi/${path}`, { method, headers, cache: 'no-store', signal: abort.signal, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
      if (response.status === 401) { onUnauthorized(); throw new Error('Your session expired. Sign in again.'); }
      let data; try { data = raw ? await response.text() : normalizeKeys(await response.json()); } catch { throw new Error('The KPI service returned an unexpected response.'); }
      if (started !== generation || !active) throw new DOMException('Workspace changed', 'AbortError');
      if (!response.ok) throw new Error(data.error || data.message || (response.status === 403 ? 'Your account needs Executive access.' : 'The KPI service is unavailable. Please try again.'));
      return data;
    } finally { pending.delete(abort); }
  }
  async function execute(action) { try { await action(); } catch (error) { if (error.name !== 'AbortError') setStatus(error.message, true); } }
  function download(name, data, type) {
    const url = URL.createObjectURL(new Blob([data], { type })), a = el('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function load() {
    const version = ++loadVersion;
    setStatus('Loading KPI evidence…');
    const [report, archive] = await Promise.all([api(`dashboard?${params()}`), api(`events?year=${period().start.slice(0, 4)}`)]);
    if (version !== loadVersion) return;
    dashboard = report; events = archive; render(); setStatus(`Updated ${new Date(report.checkedAtUtc).toLocaleString()}. Rule version ${report.ruleVersion}.`);
  }
  function latest(kind, test) { return events.filter(e => e.kind === kind && test(e)).sort((a, b) => b.revision - a.revision)[0]; }
  function samePeriod(p) { const selected = period(); return p && p.start === selected.start && p.end === selected.end && p.scope === selected.scope; }
  function heading(text, description) { content.append(el('h2', text)); if (description) content.append(el('p', description, 'kpi-muted')); }
  function render() {
    if (!active || !dashboard) return;
    content.replaceChildren(); document.querySelectorAll('[data-kpi-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kpiView === currentView)));
    if (currentView === 'overview') {
      heading('Performance overview', 'Pending results stay visible and do not count as zero performance.');
      const grid = el('div', null, 'kpi-grid'); for (const p of dashboard.profiles) grid.append(profileSummary(p)); content.append(grid);
      for (const warning of dashboard.warnings) content.append(el('p', warning, 'kpi-notice'));
      if (dashboard.salesBonus) { const b = dashboard.salesBonus; content.append(el('h3', 'Sales annual bonus'), el('p', `${b.status}: ${b.estimate === null ? 'Annual period required' : fmt(b.estimate, 'USD')}. ${b.note}`)); }
      const state = latest('period', e => samePeriod(e.data.period)); content.append(el('p', `Period: ${state?.data.status || 'Open'}. ${state?.data.reason || ''}`));
      const covered = events.filter(e => e.kind === 'coverage' && samePeriod(e.data.period));
      content.append(table(['Dataset', 'Coverage', 'Recorded', 'Proof'], covered.filter(e => !covered.some(n => n.subject === e.subject && n.revision > e.revision)).map(e => [e.data.dataset, e.data.status, new Date(e.createdUtc).toLocaleDateString(), button('View evidence', () => evidence(e.id))]), 'Data coverage for this period'));
      content.append(button('Save an immutable snapshot', async () => { const saved = await api('snapshots', period()); await load(); await evidence(saved.id); }));
      return;
    }
    const profile = dashboard.profiles.find(p => p.id === currentView);
    if (profile) {
      heading(`${profile.label} scorecard`, 'Actuals and scores apply to the selected dates and company scope.');
      content.append(table(['Metric', 'Actual', 'Target', 'Points', 'Status', 'Evidence'], profile.metrics.map(m => {
        const actions = el('div', null, 'kpi-actions'); if (m.evidenceId) actions.append(button('View', () => evidence(m.evidenceId)));
        actions.append(button('Add / revise', () => observationForm(m.definition.id)));
        const name = el('div'); name.append(el('strong', m.definition.label), el('small', m.explanation, 'kpi-muted'));
        const target = el('div', fmt(m.definition.target, m.definition.unit)); target.append(el('small', m.definition.targetBasis || 'Selected period', 'kpi-muted'));
        return [name, fmt(m.actual, m.definition.unit), target, m.earnedPoints === null ? `Pending / ${m.definition.points}` : `${fmt(m.earnedPoints)} / ${m.definition.points}`, m.status, actions];
      })));
      const chart = el('div'); content.append(chart); drawBars(chart, profile.metrics.filter(m => m.earnedPoints !== null).map(m => ({ label: m.definition.label, value: m.earnedPoints })), 'Earned points from reviewed metrics', 'Points');
      if (profile.id === 'derek') content.append(el('p', 'Derek’s annual bonus remains pending: the workbook conflicts at 90% achievement and leaves the exact 100% boundary unclear. KPI points and revenue-based bonuses are separate.', 'kpi-notice'));
      const trendEvents = events.filter(e => e.kind === 'observation' && e.data.observation?.metricId.startsWith(profile.id + '.') && e.data.observation.period.scope === period().scope);
      const histories = new Map();
      for (const e of trendEvents) { const key = `${e.subject}`; if (!histories.has(key) || histories.get(key).revision < e.revision) histories.set(key, e); }
      const trend = [...histories.values()].filter(e => e.data.status === 'Approved').sort((a, b) => a.data.observation.period.start.localeCompare(b.data.observation.period.start));
      content.append(table(['Metric', 'Period', 'Actual', 'Proof'], trend.map(e => {
        const o = e.data.observation, d = catalog.definitions.find(d => d.id === o.metricId); return [d.label, `${o.period.start} to ${o.period.end}`, fmt(o.denominator ? o.numerator / o.denominator : o.numerator, d.unit), button('View', () => evidence(e.id))];
      }), 'Reviewed period history'));
      return;
    }
    if (currentView === 'sources') return sourcesView();
    if (currentView === 'commission') return execute(commissionsView);
    if (currentView === 'setup') return setupView();
    if (currentView === 'snapshots') {
      heading('Saved snapshots', 'Each snapshot preserves the calculation rules, points and evidence references at the time it was saved.');
      content.append(table(['Saved', 'Period', 'Rule version', 'Evidence'], events.filter(e => e.kind === 'snapshot').map(e => [new Date(e.createdUtc).toLocaleString(), `${e.data.period.start} to ${e.data.period.end} (${e.data.period.scope})`, e.data.ruleVersion, button('Open snapshot', () => evidence(e.id))])));
    }
  }
  function field(form, label, name, type = 'text', value = '', required = true) {
    const wrap = el('label', label), input = el('input'); input.name = name; input.type = type; input.value = value ?? ''; input.required = required;
    if (type === 'number') { input.step = 'any'; input.min = '0'; }
    if (type === 'text') input.maxLength = 1000;
    wrap.append(input); form.append(wrap); return input;
  }
  function selectField(form, label, name, choices, value) {
    const wrap = el('label', label), s = el('select'); s.name = name;
    for (const [key, text] of choices) { const option = el('option', text); option.value = key; s.append(option); }
    if (value !== undefined) s.value = value; wrap.append(s); form.append(wrap); return s;
  }
  function check(form, label, name, checked = false) { const wrap = el('label', null, 'kpi-check'), input = el('input'); input.type = 'checkbox'; input.name = name; input.checked = checked; wrap.append(input, document.createTextNode(label)); form.append(wrap); return input; }
  function proofFields(form, existing) {
    const p = existing || {}; field(form, 'Source system or document', 'proofSource', 'text', p.source || 'IMPUI');
    field(form, 'Record ID, document hash or evidence reference', 'proofRecord', 'text', p.record || '');
    field(form, 'What this evidence proves', 'proofDetail', 'text', p.detail || '');
  }
  const proof = data => [{ source: data.get('proofSource'), record: data.get('proofRecord'), detail: data.get('proofDetail') }];
  function submit(form, label, action) {
    const b = el('button', label, 'kpi-button primary'); b.type = 'submit'; form.append(b);
    form.addEventListener('submit', event => { event.preventDefault(); if (b.disabled) return; b.disabled = true; execute(async () => { try { await action(new FormData(form)); } finally { b.disabled = false; } }); });
  }
  function observationForm(metricId) {
    content.replaceChildren(); const d = catalog.definitions.find(d => d.id === metricId);
    const previous = latest('observation', e => e.data.observation.metricId === metricId && samePeriod(e.data.observation.period));
    const o = previous?.data.observation; heading(`Evidence for ${d.label}`, `${d.formula}. Source: ${d.source}. Saving a revision returns it to draft.`);
    const form = el('form', null, 'kpi-form');
    const numerator = field(form, d.unit === '%' ? 'Numerator: qualifying count or amount' : `Actual (${d.unit})`, 'numerator', 'number', o?.numerator ?? '');
    if (['sales', 'derek'].includes(d.profile) && ['USD', '%'].includes(d.unit)) numerator.removeAttribute('min');
    if (d.unit === '%') field(form, 'Denominator: complete population or plan', 'denominator', 'number', o?.denominator ?? '');
    check(form, 'Major error, top-ten complaint or key-customer exception', 'major', o?.majorError);
    check(form, 'The complete population and required source history have been checked', 'complete', o?.completeCoverage);
    field(form, 'Method, exclusions and reconciliation notes', 'notes', 'text', o?.notes || ''); proofFields(form, o?.evidence?.[0]);
    if ((o?.evidence?.length || 0) > 1) form.append(el('p', `${o.evidence.length} existing references will be preserved; the first reference can be updated below.`));
    submit(form, 'Save draft evidence', async data => {
      const refs = proof(data); if (o?.evidence?.length > 1) refs.push(...o.evidence.slice(1));
      const saved = await api('observations', { metricId, period: period(), numerator: Number(data.get('numerator')), denominator: d.unit === '%' ? Number(data.get('denominator')) : null, majorError: data.has('major'), completeCoverage: data.has('complete'), notes: data.get('notes'), evidence: refs, expectedRevision: previous?.revision || 0 });
      await load(); await evidence(saved.id);
    }); content.append(form, button('Back to scorecard', () => { currentView = d.profile; render(); }));
  }
  async function evidence(id) {
    const record = await api(`evidence/${id}`); detail.replaceChildren(el('h2', 'Supporting evidence'));
    detail.append(el('p', `${record.kind}. Revision ${record.revision}. Recorded ${new Date(record.createdUtc).toLocaleString()}.`), el('p', `Recorded by ${record.actor}. Evidence ID ${record.id}.`, 'kpi-muted'));
    const d = record.data, o = d.observation || d.entry;
    if (o) {
      const metric = catalog.definitions.find(def => def.id === o.metricId);
      detail.append(el('h3', metric?.label || o.operatorName || 'Commission evidence'));
      if (metric) detail.append(el('p', `Actual ${fmt(o.denominator ? o.numerator / o.denominator : o.numerator, metric.unit)}. Numerator ${o.numerator}${o.denominator === null ? '' : `; denominator ${o.denominator}`}.`));
      else detail.append(el('p', `${o.category}: ${fmt(d.amount, 'USD')}. Machine ${o.machine || '—'}. Work date ${o.workDate || 'Not verified'}. Reference ${o.reference}.`));
      detail.append(el('p', `Status: ${d.status}. ${d.reviewerNote || ''}`), el('p', o.notes || ''));
      if (metric) detail.append(el('p', `Coverage: ${o.completeCoverage ? 'Submitted as complete' : 'Incomplete / partial'}. ${metric.openQuestion || ''}`));
      detail.append(table(['Source', 'Record', 'Supporting detail'], (o.evidence || []).map(p => [p.source, p.record, p.detail])));
      const review = el('form', null, 'kpi-form'); field(review, 'Review note', 'note');
      const decision = selectField(review, 'Decision', 'decision', [['Approved', 'Approve'], ['Rejected', 'Reject']]);
      submit(review, 'Record review decision', async data => { await api(`evidence/${id}/review`, { expectedRevision: record.revision, decision: decision.value, note: data.get('note') }); closeDialog(); await load(); }); detail.append(review);
    } else if (record.kind === 'snapshot') {
      detail.append(el('p', `${d.period.start} to ${d.period.end}, ${d.period.scope}. Rules ${d.ruleVersion}.`));
      for (const p of d.profiles) detail.append(el('h3', p.label), table(['Metric', 'Actual', 'Points', 'Status'], p.metrics.map(m => [m.definition.label, fmt(m.actual, m.definition.unit), m.earnedPoints === null ? 'Pending' : `${fmt(m.earnedPoints)} / ${m.definition.points}`, m.status])));
      if (d.commissions) detail.append(el('h3', 'Frozen commission ledger'), table(['Operator', 'Category', 'Amount', 'Status'], d.commissions.entries.map(e => [e.state.entry.operatorName, e.state.entry.category, fmt(e.state.amount, 'USD'), e.state.status])));
    } else if (record.kind === 'source') {
      detail.append(el('p', d.note || ''), el('p', `${d.source}: ${d.count} records. Checked ${new Date(d.checkedAtUtc).toLocaleString()}.`));
      const records = d.records || []; if (records.length) {
        const keys = Object.keys(records[0]).filter(k => !['rolls', 'packing'].includes(k));
        let offset = 0; const area = el('div'), controls = el('div', null, 'kpi-actions');
        const paint = () => { area.replaceChildren(table(keys, records.slice(offset, offset + 50).map(r => keys.map(k => typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k])))); };
        controls.append(button('Previous 50', () => { offset = Math.max(0, offset - 50); paint(); }), button('Next 50', () => { if (offset + 50 < records.length) offset += 50; paint(); }), button('Download CSV', () => download(`kpi-source-${id}.csv`, csv(records), 'text/csv')));
        detail.append(controls, area); paint();
      }
    } else {
      for (const [key, value] of Object.entries(d)) if (key !== 'contentBase64' && key !== 'evidence') detail.append(el('p', `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`));
      if (d.evidence) detail.append(table(['Source', 'Record', 'Supporting detail'], d.evidence.map(p => [p.source, p.record, p.detail])));
    }
    detail.append(button('Download complete evidence JSON', async () => download(`kpi-evidence-${id}.json`, await api(`evidence/${id}/export`, undefined, 'GET', true), 'application/json')));
    if (record.kind === 'workbook') detail.append(button('Download archived workbook', () => {
      const raw = atob(d.contentBase64), bytes = Uint8Array.from(raw, ch => ch.charCodeAt(0)); download('commission-source.xlsx', bytes, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }));
    if (!dialog.open) dialog.showModal();
  }
  function closeDialog() { if (dialog.open) dialog.close(); detail.replaceChildren(); }
  document.getElementById('kpi-evidence-close').addEventListener('click', closeDialog);
  dialog.addEventListener('close', () => detail.replaceChildren());
  function sourcesView() {
    heading('Source records', 'Collect a complete, dated extract using your existing permissions. Collection saves an immutable evidence copy.');
    const form = el('form', null, 'kpi-form'); selectField(form, 'Dataset', 'dataset', [['impui', 'IMPUI production and packing'], ['budgets', 'IMPUI budget inputs'], ['sales-history', 'IMPUI imported sales history'], ['invoices', 'Acumatica sales invoices'], ['shipments', 'Acumatica shipments'], ['receipts', 'Acumatica purchase receipts'], ['cases', 'Acumatica service cases'], ['inventory-audits', 'Acumatica inventory audits']]);
    submit(form, 'Collect source evidence', async data => { setStatus('Collecting complete source records…'); const extract = await api(`sources/${data.get('dataset')}`, period()); await load(); await evidence(extract.evidenceId); }); content.append(form);
    const extracts = events.filter(e => e.kind === 'source' && samePeriod(e.data.period));
    content.append(table(['Dataset', 'Records', 'Collected', 'Evidence'], extracts.map(e => [e.data.dataset, e.data.count, new Date(e.createdUtc).toLocaleString(), button('Inspect', () => evidence(e.id))])));
    const source = extracts.find(e => e.data.dataset === 'impui');
    if (source) { const chart = el('div'); content.append(chart); const buckets = new Map(); for (const r of source.data.trend || []) { const key = r.date.slice(0, 7); buckets.set(key, (buckets.get(key) || 0) + r.cycles); } drawBars(chart, [...buckets].map(([label, value]) => ({ label, value })), 'Recorded production cycles by month', 'Cycles'); content.append(el('p', source.data.note, 'kpi-muted')); }
  }
  async function commissionsView() {
    heading('Commission ledger', 'Production work date and payroll period are separate. Draft amounts do not count toward approved totals.');
    const requested = params().toString(); const data = await api(`commissions?${requested}`); if (currentView !== 'commission' || requested !== params().toString()) return;
    content.append(el('p', `Approved operators: ${fmt(data.approvedOperatorTotal, 'USD')}. Approved supervisor: ${fmt(data.approvedSupervisorTotal, 'USD')}.`));
    const chart = el('div'); content.append(chart); drawWaterfall(chart, data.groups.filter(g => g.category !== 'Supervisor').map(g => ({ label: g.category, value: g.approvedAmount })), 'How approved operator commission adds up');
    content.append(table(['Operator', 'Category', 'Work date', 'Amount', 'Status', 'Proof'], data.entries.map(e => [e.state.entry.operatorName, e.state.entry.category, e.state.entry.workDate || 'Not verified', fmt(e.state.amount, 'USD'), e.state.status, button('View / review', () => evidence(e.evidenceId))])));
    const importArea = el('details'), summary = el('summary', 'Import a commission workbook'); importArea.append(summary);
    const upload = el('form', null, 'kpi-form'), file = field(upload, 'Commission workbook (.xlsx, under 4 MB)', 'file', 'file'); file.accept = '.xlsx';
    submit(upload, 'Import as draft', async () => { const body = new FormData(); body.append('file', file.files[0]); const result = await api('commissions/import', body); document.getElementById('kpi-start').value = result.period.start; document.getElementById('kpi-end').value = result.period.end; document.getElementById('kpi-scope').value = result.period.scope; await load(); setStatus(result.note); }); importArea.append(upload); content.append(importArea);
    const entryArea = el('details'); entryArea.append(el('summary', 'Add a commission line or correction')); const form = el('form', null, 'kpi-form');
    field(form, 'Stable IMP operator ID', 'operatorId'); field(form, 'Operator name', 'operatorName'); field(form, 'Machine', 'machine', 'text', '', false); field(form, 'Production work date', 'workDate', 'date', period().end);
    selectField(form, 'Category', 'category', [['Base', 'Base SQM commission'], ['Supervisor', 'Supervisor SQM commission'], ['KPI bonus', 'KPI bonus'], ['Half-inch / training', 'Half-inch / training adjustment'], ['Deduction', 'Deduction'], ['Correction', 'Correction']]);
    field(form, 'SQM (base or supervisor only)', 'sqm', 'number', '', false); field(form, 'Approved USD rate per SQM (base or supervisor only)', 'rate', 'number', '', false);
    const amount = field(form, 'Adjustment amount in USD (other categories only)', 'adjustment', 'number', '', false); amount.removeAttribute('min');
    field(form, 'Unique source line reference', 'reference'); field(form, 'Original evidence ID (required for corrections)', 'corrects', 'text', '', false); field(form, 'Reason and eligibility notes', 'notes'); proofFields(form);
    submit(form, 'Save draft commission', async data => { const opt = name => data.get(name) === '' ? null : Number(data.get(name)); await api('commissions', { operatorId: data.get('operatorId'), operatorName: data.get('operatorName'), machine: data.get('machine'), workDate: data.get('workDate'), payPeriod: period(), category: data.get('category'), sqm: opt('sqm'), rate: opt('rate'), adjustment: opt('adjustment'), reference: data.get('reference'), corrects: data.get('corrects') || null, notes: data.get('notes'), evidence: proof(data) }); await load(); });
    entryArea.append(form); content.append(entryArea, el('p', data.note, 'kpi-muted'));
  }
  function setupView() {
    heading('Rules and source coverage', 'Workbook weights are fixed. Pending definitions need an explicit Executive decision with supporting evidence for this reporting period.');
    const coverageDetails = el('details'); coverageDetails.open = true; coverageDetails.append(el('summary', 'Record data coverage and reconciliation'));
    const coverage = el('form', null, 'kpi-form'); selectField(coverage, 'Dataset', 'dataset', ['Financial', 'Production', 'Service', 'Commission'].map(x => [x, x]));
    selectField(coverage, 'Coverage', 'status', [['Partial', 'Partial / missing history'], ['Reconciled', 'Complete and reconciled']]); field(coverage, 'Coverage boundaries, company mapping and reconciliation method', 'notes'); proofFields(coverage);
    submit(coverage, 'Record coverage decision', async data => {
      const previous = latest('coverage', e => e.data.dataset === data.get('dataset') && samePeriod(e.data.period));
      await api('coverage', { period: period(), dataset: data.get('dataset'), status: data.get('status'), notes: data.get('notes'), evidence: proof(data), expectedRevision: previous?.revision || 0 }); await load();
    }); coverageDetails.append(coverage); content.append(coverageDetails);
    const ruleDetails = el('details'); ruleDetails.append(el('summary', 'Approve an unresolved scoring rule'));
    const rule = el('form', null, 'kpi-form'); const metrics = catalog.definitions.filter(d => d.rule === 'Pending');
    const metric = selectField(rule, 'Metric', 'metricId', metrics.map(d => [d.id, `${catalog.profiles[d.profile] || d.profile}: ${d.label}`]));
    selectField(rule, 'Points rule', 'rule', [['Minimum', 'Full points at or above target'], ['Maximum', 'Full points at or below target'], ['Proportional', 'Proportional, capped at the allocated points'], ['MaximumMajor', 'At or below target; major error earns zero'], ['DeductTwo', 'Deduct 2 points per infraction'], ['Packaging', 'Deduct 2 per error; major error earns zero']]);
    const target = field(rule, 'Target (percent metrics use human percentages, e.g. 26.5)', 'target', 'number');
    field(rule, 'Zero-score floor, if applicable (same display unit)', 'floor', 'number', '', false); field(rule, 'Approved definition, account/population mapping and rationale', 'basis'); proofFields(rule);
    const changeMetric = () => { const d = metrics.find(d => d.id === metric.value); target.value = d.unit === '%' ? d.target * 100 : d.target; }; metric.addEventListener('change', changeMetric); changeMetric();
    submit(rule, 'Approve rule for this period', async data => { const d = metrics.find(d => d.id === data.get('metricId')), divisor = d.unit === '%' ? 100 : 1; const previous = latest('rule', e => e.data.metricId === d.id && samePeriod(e.data.period)); await api('rules', { metricId: d.id, period: period(), rule: data.get('rule'), target: Number(data.get('target')) / divisor, floor: data.get('floor') === '' ? null : Number(data.get('floor')) / divisor, basis: data.get('basis'), evidence: proof(data), expectedRevision: previous?.revision || 0 }); await load(); });
    ruleDetails.append(rule); content.append(ruleDetails);
    content.append(table(['Metric', 'Points', 'Rule or open decision'], catalog.definitions.map(d => [d.label, d.points, d.openQuestion || d.formula]), '2026 scoring definitions'));
    const periodDetails = el('details'); periodDetails.append(el('summary', 'Close or reopen this reporting period'));
    const decision = el('form', null, 'kpi-form'); selectField(decision, 'Decision', 'status', [['Closed', 'Close completed period'], ['Open', 'Reopen for corrections']]);
    field(decision, 'Reason for closing or reopening', 'reason');
    decision.append(el('p', 'Closing requires all metrics, financial coverage and commission reviews to be complete. It freezes a snapshot and blocks edits until an Executive records a reopening reason.'));
    submit(decision, 'Record period decision', async data => { await api('period', { period: period(), status: data.get('status'), reason: data.get('reason') }); await load(); });
    periodDetails.append(decision); content.append(periodDetails);
  }
  document.getElementById('kpi-period-form').addEventListener('submit', event => { event.preventDefault(); execute(load); });
  document.querySelectorAll('[data-kpi-view]').forEach(b => b.addEventListener('click', () => { currentView = b.dataset.kpiView; render(); }));
  document.getElementById('kpi-back').addEventListener('click', () => { deactivate(); onBack(); });
  function deactivate() { active = false; generation++; for (const request of pending) request.abort(); pending.clear(); catalog = null; dashboard = null; events = []; content.replaceChildren(); setStatus(''); closeDialog(); root.hidden = true; }
  async function open() {
    active = true; generation++; root.hidden = false; currentView = 'overview';
    const today = new Date(); document.getElementById('kpi-start').value = '2026-01-01'; document.getElementById('kpi-end').value = today.getFullYear() === 2026 ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}` : '2026-12-31';
    history.replaceState({}, '', '/kpi'); await execute(async () => { catalog = await api('catalog'); await load(); });
  }
  return { open, deactivate };
}
