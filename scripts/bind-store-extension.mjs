import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export function extensionId(key) {
  return [...createHash('sha256').update(Buffer.from(key, 'base64')).digest().subarray(0, 16)].map(x => String.fromCharCode(97 + (x >> 4), 97 + (x & 15))).join('');
}
export function bindStoreOrigin(config, pilotId, storeId) {
  if (![pilotId, storeId].every(id => typeof id === 'string' && /^[a-p]{32}$/.test(id))) throw new Error('Expected the actual 32-letter extension ID from the Chrome Web Store dashboard.');
  const updated = structuredClone(config), ids = [...new Set([pilotId, storeId])];
  const routes = updated.routes.filter(r => r.route === '/widget' || r.route === '/widget.html');
  if (routes.length !== 2) throw new Error('Expected exactly the two existing widget routes.');
  for (const route of routes) {
    const csp = route.headers['Content-Security-Policy'];
    if (!csp || !/frame-ancestors [^;]+/.test(csp)) throw new Error('Widget framing policy missing.');
    route.headers['Content-Security-Policy'] = csp.replace(/frame-ancestors [^;]+/, 'frame-ancestors ' + ids.map(id => `chrome-extension://${id}`).join(' '));
  }
  return updated;
}
if (process.argv[1]?.replace(/\\/g, '/').endsWith('/bind-store-extension.mjs')) {
  const storeId = process.argv[2];
  const configUrl = new URL('../web/staticwebapp.config.json', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('../extensions/ask-imp/manifest.json', import.meta.url), 'utf8'));
  const config = JSON.parse(await readFile(configUrl, 'utf8'));
  const updated = bindStoreOrigin(config, extensionId(manifest.key), storeId);
  if (process.argv.includes('--write')) {
    await writeFile(configUrl, JSON.stringify(updated, null, 2) + '\n');
    const releaseUrl = new URL('../extensions/store/release.json', import.meta.url);
    const release = JSON.parse(await readFile(releaseUrl, 'utf8'));
    await writeFile(releaseUrl, JSON.stringify({ ...release, distribution: 'unlisted', storeExtensionId: storeId, submitted: false }, null, 2) + '\n');
    console.log('Bound the exact store origin locally. Run tests and deploy the hosted frontend before installing/submitting the store build.');
  } else console.log(JSON.stringify({ storeExtensionId: storeId, mode: 'preview', routes: updated.routes }, null, 2));
}
