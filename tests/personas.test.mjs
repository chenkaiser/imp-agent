import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PERSONAS, getPersona, personaQuestion } from '../web/personas.js';

test('five personas provide context without changing authorization', () => {
  assert.deepEqual(Object.values(PERSONAS).map(p => p.label), ['Sales Representative', 'Customer Service Representative', 'Production', 'Executive', 'IT Admin']);
  for (const [id, persona] of Object.entries(PERSONAS)) {
    const question = personaQuestion(id, 'A'.repeat(3600));
    assert.ok(question.length <= 4000);
    assert.match(question, new RegExp(persona.label));
    assert.equal(persona.suggestions.length, 3);
    assert.equal(persona.token, undefined);
  }
  assert.equal(getPersona('__proto__'), null);
  assert.equal(getPersona('constructor'), null);
  assert.throws(() => personaQuestion('administrator', 'test'));
});
