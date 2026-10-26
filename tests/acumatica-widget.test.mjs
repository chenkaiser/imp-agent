import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const script = await readFile(new URL('../acumatica/AskImpWidget/Files/Scripts/AskImp/launcher.js', import.meta.url), 'utf8');
test('native panel loads chat only on request, preserves its conversation and isolates navigation', async () => {
  const dom = new JSDOM('<body><form id="erp-form"><input value="unsaved ERP input"></form></body>', { url: 'https://imp-ttr.acumatica.com/(W(40))/Main?ScreenId=SO301000', runScripts: 'outside-only' });
  const { window } = dom;
  try {
    window.eval(script); window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
    const host = window.document.getElementById('ask-imp-native'), root = host.shadowRoot, launch = root.querySelector('.launcher');
    assert.equal(root.querySelector('iframe'), null); assert.equal(launch.getAttribute('aria-expanded'), 'false');
    launch.click(); const frame = root.querySelector('iframe');
    assert.equal(frame.src, 'https://ask.impops.work/widget'); assert.equal(launch.getAttribute('aria-expanded'), 'true');
    assert.equal(frame.hasAttribute('allow'), false);
    root.querySelector('header button').click(); assert.equal(root.querySelector('.panel').hidden, true);
    launch.click(); assert.equal(root.querySelector('iframe'), frame);
    root.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    assert.equal(root.querySelector('.panel').hidden, true);
    window.eval(script); assert.equal(window.document.querySelectorAll('#ask-imp-native').length, 1);
    assert.equal(window.document.querySelector('input').value, 'unsaved ERP input');
    assert.equal(root.querySelector('a').rel, 'noopener noreferrer');
  } finally { window.close(); }
});
test('native launcher does not mount on sign-in, business forms or other non-shell pages', () => {
  for (const path of ['/Frames/Login.aspx', '/Pages/SO/SO301000.aspx', '/identity/connect/authorize']) {
    const dom = new JSDOM('<body></body>', { url: 'https://imp-ttr.acumatica.com' + path, runScripts: 'outside-only' });
    dom.window.eval(script); dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    assert.equal(dom.window.document.getElementById('ask-imp-native'), null); dom.window.close();
  }
});
