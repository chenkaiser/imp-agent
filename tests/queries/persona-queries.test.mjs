import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

// Browser contract tests. Server routing/ownership/evidence are tested by the
// backend PersonaQuery suite; these fixtures never contact live services.
const html = await readFile(new URL('../../web/index.html', import.meta.url), 'utf8');
const acceptance = JSON.parse(await readFile(new URL("./normal-user-scenarios.json", import.meta.url), "utf8"));
const personas = [
  ['sales', 'price of ITEM1 for Customer One', '**IMP Price**\n\n| Price | Unit |\n| --- | --- |\n| USD 9.25 | ROLL |'],
  ['service', 'Can we ship SO0000001?', '**Sales Order SO0000001**\n\n| Item | Open qty |\n| --- | --- |\n| ITEM1 | 10 ROLL |'],
  ['production', 'list me the production orders this week', '**Production orders**\n\n| Order | Status |\n| --- | --- |\n| PROD0000003 | Released |'],
  ['executive', 'show my executive KPI scorecards', '**Executive scorecards**\n\n| Measure | Status |\n| --- | --- |\n| Evidence | Pending |'],
  ['it', 'Show Azure AI Foundry costs this month', '**Azure AI cost**\n\n| Measure | USD |\n| --- | --- |\n| Reported cost | 1.25 |']
];
const json = data => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
const waitFor = async check => { for (let i = 0; i < 100; i++) { if (check()) return; await new Promise(r => setTimeout(r, 10)); } assert.fail('UI did not reach the expected state'); };
const sse = text => new Response(`data: ${JSON.stringify({ type: 'chunk', text })}\n\ndata: {"type":"done"}\n\n`, { headers: { 'Content-Type': 'text/event-stream' } });

const acceptanceFixtures = acceptance.map(c => [c.persona, c.query,
  '**Verified result**\n\n| Record | Result |\n| --- | --- |\n| Fixture | Available |', c.id, c.reply]);
for (const [persona, question, response, scenarioId, followUp] of [...personas, ...acceptanceFixtures]) {
  test(`${scenarioId ?? persona}: submits persona and authorization, renders a table, and keeps clarification context`, async () => {
    const dom = new JSDOM(html, { url: 'https://ask.impops.work/personas' });
    for (const name of ['document', 'location', 'history', 'sessionStorage']) globalThis[name] = dom.window[name];
    const token = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.sig';
    sessionStorage.setItem('imp-agent.session', JSON.stringify({ id: 'fixture-user', name: 'Fixture User', role: persona, token, accessToken: 'fixture-acumatica-token', expiresAt: Date.now() + 3600000 }));
    const calls = [];
    globalThis.fetch = async (url, options = {}) => {
      if (url.endsWith('/config')) return json({ ClientId: 'fixture@tenant', AuthorizeUrl: 'https://erp.example/identity/connect/authorize', Scope: 'openid api' });
      if (url.endsWith('/personas')) return json({ personas: [persona], role: persona });
      if (url.endsWith('/lookups/warm') || url.includes('/logout')) return new Response(null, { status: 204 });
      if (url.includes('/Chat/lookups?')) {
        const parsed = new URL(url); const kind = parsed.searchParams.get('kind');
        const id = parsed.searchParams.get('q').replace(/[?.]$/, '');
        return json({ items: [{ kind, id, label: id }] });
      }
      if (url.endsWith('/Chat')) {
        calls.push({ body: JSON.parse(options.body), headers: options.headers });
        return sse(calls.length === 1 ? response : calls.length === (followUp ? 3 : 2) ? 'Do you mean Acumatica Production Orders or IMPUI production logs?' : 'Confirmed Production Orders for the same week.');
      }
      throw new Error(`Unexpected fixture request: ${new URL(url).pathname}`);
    };
    try {
      await import(`../../web/app.js?persona-query=${scenarioId ?? persona}`);
      await waitFor(() => !document.getElementById('workspace').hidden);
      const submit = async text => {
        const count = document.querySelectorAll('.assistant').length;
        const input = document.getElementById('question');
        // Choose actual autocomplete suggestions through the UI, as users must.
        text = text.replace(/([#*][A-Za-z0-9_-]+)\./g, '$1 .');
        input.value = text;
        for (const match of text.matchAll(/(?:^|\s)([#*])([A-Za-z0-9_-]+)/g)) {
          const end = match.index + match[0].length;
          input.value = text; input.setSelectionRange(end, end);
          input.dispatchEvent(new dom.window.Event('input'));
          await waitFor(() => !!document.querySelector('.lookup-option'));
          document.querySelector('.lookup-option').click();
        }
        input.value = text;
        document.getElementById('chat-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
        await waitFor(() => document.querySelectorAll('.assistant').length > count && !document.querySelector('.assistant.pending'));
        return text;
      };
      const sentQuestion = await submit(question);
      assert.equal(calls[0].body.persona, persona);
      assert.ok(calls[0].body.message.endsWith(sentQuestion));
      assert.equal(calls[0].headers.Authorization, `Bearer ${token}`);
      assert.equal(calls[0].headers['X-Acumatica-Access-Token'], 'fixture-acumatica-token');
      assert.ok(document.querySelector('.assistant table'));
      assert.doesNotMatch(document.querySelector('.assistant').textContent, /Lines - Record|Requested lookup: not verified/);
      const conversation = calls[0].body.conversationId;
      if (followUp) {
        await submit(followUp);
        assert.equal(calls[1].body.message, followUp);
        assert.equal(calls[1].body.conversationId, conversation);
      }
      await submit('list me the productions this week');
      assert.match([...document.querySelectorAll('.assistant')].at(-1).textContent, /Do you mean.*Production Orders.*logs/);
      await submit('Production Orders');
      const choiceIndex = followUp ? 3 : 2;
      assert.equal(calls[choiceIndex].body.message, 'Production Orders');
      assert.equal(calls[choiceIndex].body.conversationId, conversation);
      assert.equal(calls[choiceIndex].body.persona, persona);
      const forbidden = document.querySelector(`[data-persona="${persona === 'it' ? 'sales' : 'it'}"]`);
      forbidden?.click();
      assert.equal(calls.length, choiceIndex + 1);
      await submit('show the same data');
      assert.equal(calls[choiceIndex + 1].body.persona, persona);
      assert.equal(calls[choiceIndex + 1].body.conversationId, conversation);
    } finally {
      document.getElementById('sign-out').click();
      dom.window.close();
    }
  });
}

// Fail CI if a persona or its manual checklist loses one of the agreed cases.
test('exactly 15 documented normal-user questions, five per persona', async () => {
  assert.equal(acceptance.length, 15);
  assert.equal(new Set(acceptance.map(c => c.id)).size, 15);
  for (const [persona, file] of [['sales', 'sales'], ['service', 'customer-service'], ['production', 'production']]) {
    const cases = acceptance.filter(c => c.persona === persona);
    assert.equal(cases.length, 5);
    const doc = await readFile(new URL(`../../docs/${file}-persona-manual-tests.md`, import.meta.url), 'utf8');
    for (const c of cases) {
      assert.ok(doc.includes(c.query), `${c.id}: manual question drifted`);
      if (c.reply) assert.ok(doc.includes(c.reply), `${c.id}: follow-up drifted`);
    }
  }
});
