import { API_BASE } from './config.js';
import { activeSession } from './lib.js';
import { element as el, normalizeKeys } from './kpi-view.js';

export function createSalesAccessWorkspace({ getSession, onUnauthorized, onBack }) {
  const root = document.getElementById('sales-access-screen');
  const content = document.getElementById('sales-access-content');
  const status = document.getElementById('sales-access-status');
  let active = false, generation = 0, catalog, pending;
  function message(text) { status.textContent = text; }
  async function api(body) {
    const session = getSession(), version = generation;
    if (!activeSession(session)) { onUnauthorized(); throw new DOMException('Session ended', 'AbortError'); }
    pending?.abort(); pending = new AbortController();
    const response = await fetch(`${API_BASE}/v1/SalesAccess`, {
      method: body ? 'PUT' : 'GET', cache: 'no-store', signal: pending.signal,
      headers: { Authorization: `Bearer ${session.token}`, 'X-Acumatica-Access-Token': session.accessToken, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (version !== generation || !active) throw new DOMException('Workspace changed', 'AbortError');
    if (response.status === 401) { onUnauthorized(); throw new DOMException('Session ended', 'AbortError'); }
    let data; try { data = normalizeKeys(await response.json()); } catch { throw new Error('The sales access service is unavailable. Please retry.'); }
    if (!response.ok) throw new Error(data.error || (response.status === 403 ? 'Your account cannot manage sales access.' : 'Unable to save. Reload and review the assignment.'));
    return data;
  }
  async function run(action) { try { await action(); } catch (error) { if (error.name !== 'AbortError') message(error.message); } }
  async function load() {
    content.replaceChildren(); message('Loading sales users and Acumatica salespeople…');
    catalog = await api(); render(); message('Select a user and review their salesperson assignment.');
  }
  function render() {
    content.replaceChildren();
    if (!catalog.users.length) { content.append(el('p', 'No active IMP Sales users are available.')); return; }
    const form = el('form', null, 'kpi-period'), userSelect = el('select'), repSelect = el('select');
    userSelect.id = 'sales-access-user'; repSelect.id = 'sales-access-rep';
    for (const user of catalog.users) { const option = el('option', `${user.login}${user.name ? ` — ${user.name}` : ''}`); option.value = user.id; userSelect.append(option); }
    const current = el('p'), review = el('div'), submit = el('button', 'Review assignment', 'kpi-button primary'); submit.type = 'submit';
    const labelUser = el('label', 'IMP Sales login'), labelRep = el('label', 'Acumatica Salesperson');
    labelUser.append(userSelect); labelRep.append(repSelect); form.append(labelUser, labelRep, submit);
    function selectedUser() { return catalog.users.find(user => user.id === userSelect.value); }
    function update() {
      review.replaceChildren(); repSelect.replaceChildren();
      const none = el('option', 'Unmapped — block customer sales access'); none.value = ''; repSelect.append(none);
      for (const rep of catalog.salespersons) { const option = el('option', `${rep.id} — ${rep.name}`); option.value = rep.id; repSelect.append(option); }
      const assignment = selectedUser().assignment;
      if (assignment?.salespersonId && !catalog.salespersons.some(rep => rep.id === assignment.salespersonId)) {
        const option = el('option', `${assignment.salespersonId} — no longer active`); option.value = assignment.salespersonId; option.disabled = true; repSelect.append(option);
      }
      repSelect.value = assignment?.salespersonId || '';
      current.textContent = assignment ? `Current assignment: ${assignment.salespersonId || 'Unmapped'}. Revision ${assignment.revision}. Updated ${new Date(assignment.createdUtc).toLocaleString()}.` : 'Current assignment: Unmapped. Customer sales access is blocked.';
    }
    userSelect.addEventListener('change', update); repSelect.addEventListener('change', () => review.replaceChildren());
    form.addEventListener('submit', event => {
      event.preventDefault(); review.replaceChildren();
      const user = selectedUser(), id = repSelect.value || null;
      if (id && !catalog.salespersons.some(rep => rep.id === id)) { message('Choose an active salesperson or remove the assignment.'); return; }
      const request = { userId: user.id, salespersonId: id, expectedRevision: user.assignment?.revision || 0 };
      review.append(el('p', id ? `${user.login} will be able to query customers assigned to salesperson ${id} in Acumatica.` : `${user.login} will lose customer sales access.`));
      const save = el('button', 'Save assignment', 'kpi-button primary'); save.type = 'button';
      save.addEventListener('click', () => run(async () => {
        save.disabled = true; submit.disabled = true; userSelect.disabled = true; repSelect.disabled = true;
        try { await api(request); await load(); message(`Assignment saved for ${user.login}. It applies to the next sales lookup.`); }
        catch (error) { review.replaceChildren(); message(error.message); }
        finally { save.disabled = false; submit.disabled = false; userSelect.disabled = false; repSelect.disabled = false; }
      }));
      review.append(save);
    });
    content.append(current, form, review); update();
  }
  document.getElementById('sales-access-back').addEventListener('click', onBack);
  document.getElementById('sales-access-reload').addEventListener('click', () => run(load));
  return {
    open() { active = true; root.hidden = false; history.replaceState({}, '', '/sales-access'); return run(load); },
    deactivate() { active = false; generation++; pending?.abort(); root.hidden = true; content.replaceChildren(); catalog = null; message(''); }
  };
}
