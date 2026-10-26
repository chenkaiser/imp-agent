// Explicit opt-in: uses real model/ERP reads and short-lived dedicated test sessions.
// Never records tokens, upstream response bodies or customer data in CI artifacts.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

const endpoint = 'https://api-dev.impops.work/v1/Chat';
const cases = JSON.parse(await readFile(new URL('../tests/queries/normal-user-scenarios.json', import.meta.url), 'utf8'));
if (!process.argv.includes('--live')) throw new Error('Pass --live to run real integration queries.');
const roles = { sales: 'sales', service: 'customerservice', production: 'manager' };
const headers = {};
for (const persona of Object.keys(roles)) {
  const prefix = `LIVE_${persona.toUpperCase()}`;
  if (!process.env[`${prefix}_JWT`] || !process.env[`${prefix}_ACUMATICA_TOKEN`]) {
    throw new Error(`Missing dedicated ${persona} session credentials; no cases were run.`);
  }
  headers[persona] = { Authorization: `Bearer ${process.env[`${prefix}_JWT`]}`, 'X-Acumatica-Access-Token': process.env[`${prefix}_ACUMATICA_TOKEN`], 'Content-Type': 'application/json' };
  const access = await fetch(`${endpoint}/personas`, { headers: headers[persona], redirect: 'error', signal: AbortSignal.timeout(30000) });
  assert.equal(access.status, 200, `${persona}: session preflight failed`);
  const identity = await access.json();
  assert.ok(identity.personas.includes(persona), `${persona}: persona is not authorized`);
  if (persona === 'sales') assert.equal(identity.role, 'sales', 'Ownership checks require an actual Sales account.');
  if (persona === 'service') assert.equal(identity.role, 'customerservice', 'Use an actual Customer Service test account.');
}

async function ask(persona, message, conversationId) {
  const response = await fetch(endpoint, { method: 'POST', headers: headers[persona], redirect: 'error',
    body: JSON.stringify({ persona, message, conversationId }), signal: AbortSignal.timeout(130000) });
  assert.equal(response.status, 200, `${persona}: HTTP ${response.status}`);
  const body = await response.text();
  let answer = '', done = false;
  for (const line of body.split(/\r?\n/)) {
    if (!line.startsWith('data: ')) continue;
    const event = JSON.parse(line.slice(6));
    assert.notEqual(event.type, 'error', 'Chat returned an error event');
    if (event.type === 'chunk') answer += event.text ?? '';
    if (event.type === 'done') done = true;
  }
  assert.ok(done && answer.trim(), 'Incomplete or empty response');
  assert.doesNotMatch(answer, /Requested lookup: not verified|unknown resource|Lines - Record|unverified link removed|â€”|\uFFFD/i);
  return answer;
}
const results = [];
for (const c of cases) {
  const started = Date.now();
  try {
    const conversation = randomUUID();
    let answer = await ask(c.persona, c.query, conversation);
    if (c.id === 'sales-01') assert.match(answer, /which customer|customer.*(?:name|ID)/i);
    if (c.reply) answer = await ask(c.persona, c.reply, conversation);
    if (c.id === 'sales-01') assert.doesNotMatch(answer, /which customer is this price for/i);
    if (c.ownershipDenied) {
      assert.match(answer, /not assigned|not authorized|assigned to you|access.*denied/i);
      assert.doesNotMatch(answer, /\b(?:SO|ORD)\d{4,}\b|\bUSD\s+\d/);
    } else {
      assert.doesNotMatch(answer, /couldn.t verify|temporarily unavailable|lookup failed|couldn.t find a matching customer/i);
      assert.match(answer, /\[E\d+\]|which|please.*confirm/i);
    }
    if (['sales-02', 'service-04'].includes(c.id)) assert.match(answer, /IMP Price/);
    if (c.id === 'sales-02') assert.match(answer, /0\.95|5\s*%|discount/i);
    // An empty result may be correct; a displayed verified order should be linked.
    if (/\b(?:SO|ORD|PROD)\d{4,}\b/.test(answer) && /\|/.test(answer))
      assert.match(answer, /\[(?:SO|ORD|PROD)\d+\]\(https:\/\/imp-ttr\.acumatica\.com\//);
    results.push({ id: c.id, pass: true, seconds: (Date.now() - started) / 1000 });
  } catch {
    // Do not serialize assertion.actual: it could contain business data.
    results.push({ id: c.id, pass: false, seconds: (Date.now() - started) / 1000 });
  }
  console.log(`${c.id}: ${results.at(-1).pass ? 'PASS' : 'FAIL'} (${results.at(-1).seconds.toFixed(1)}s)`);
}
await mkdir('test-results/live-personas', { recursive: true });
await writeFile('test-results/live-personas/results.json', JSON.stringify({ checkedAtUtc: new Date().toISOString(), endpoint, results }, null, 2));
const failed = results.filter(r => !r.pass).length;
await writeFile('test-results/live-personas/results.xml', `<?xml version="1.0"?><testsuites><testsuite name="Live personas" tests="15" failures="${failed}">${results.map(r => `<testcase name="${r.id}" time="${r.seconds}">${r.pass ? '' : '<failure message="Live acceptance failed; inspect the application securely. No business data is retained in this report."/>'}</testcase>`).join('')}</testsuite></testsuites>`);
if (failed) process.exitCode = 1;
