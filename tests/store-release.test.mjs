import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { bindStoreOrigin, extensionId } from '../scripts/bind-store-extension.mjs';
const read = file => readFile(new URL('../' + file, import.meta.url));
test('Web Store draft ZIP includes usable icons, minimum permissions and no pilot signing identity', async () => {
  execFileSync(process.execPath, ['scripts/package-widget.mjs', '--store'], { cwd: new URL('../', import.meta.url), stdio: 'pipe' });
  const zip = await read('dist/ask-imp-webstore.zip'), entries = new Map();
  let at = 0;
  while (zip.readUInt32LE(at) === 0x04034b50) {
    const size = zip.readUInt32LE(at + 18), length = zip.readUInt16LE(at + 26), extra = zip.readUInt16LE(at + 28), start = at + 30 + length + extra;
    entries.set(zip.subarray(at + 30, at + 30 + length).toString(), zip.subarray(start, start + size));
    at = start + size;
  }
  const manifest = JSON.parse(entries.get('manifest.json'));
  assert.equal(manifest.key, undefined); assert.deepEqual(manifest.permissions, ['sidePanel']);
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://imp-ttr.acumatica.com/*']);
  for (const size of [16, 32, 48, 128]) {
    const png = entries.get(manifest.icons[size]);
    assert.equal(png.subarray(1, 4).toString(), 'PNG'); assert.equal(png.readUInt32BE(16), size); assert.equal(png.readUInt32BE(20), size);
  }
  assert.equal([...entries.keys()].some(name => /privacy|reviewer|release|\.md$|\.pem$/.test(name)), false);
});
test('store identity binding permits only exact IDs on widget routes and leaves standalone security unchanged', async () => {
  const config = JSON.parse(await read('web/staticwebapp.config.json'));
  const manifest = JSON.parse(await read('extensions/ask-imp/manifest.json'));
  const pilotId = extensionId(manifest.key), storeId = 'abcdefghijklmnopabcdefghijklmnop';
  const before = JSON.stringify(config), updated = bindStoreOrigin(config, pilotId, storeId);
  assert.equal(JSON.stringify(config), before);
  assert.deepEqual(updated.globalHeaders, config.globalHeaders);
  for (const route of updated.routes) {
    const original = config.routes.find(r => r.route === route.route);
    assert.equal(route.headers['Content-Security-Policy'].replace(/frame-ancestors [^;]+/, ''), original.headers['Content-Security-Policy'].replace(/frame-ancestors [^;]+/, ''));
    assert.ok(route.headers['Content-Security-Policy'].includes(`frame-ancestors chrome-extension://${pilotId} chrome-extension://${storeId};`));
  }
  for (const id of ['*', 'https://example.com', storeId + '; frame-ancestors *', 'a'.repeat(31), 'z'.repeat(32), null]) assert.throws(() => bindStoreOrigin(config, pilotId, id));
});
