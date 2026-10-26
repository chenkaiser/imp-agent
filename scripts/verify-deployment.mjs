import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const origin = new URL(process.env.DEPLOYMENT_URL || 'https://ask.impops.work');
if (origin.protocol !== 'https:') throw new Error('Deployment verification requires HTTPS.');
const folder = new URL('../web/', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const assets = (await readdir(folder)).filter(name => /\.(html|js|css|svg)$/.test(name));
const expected = new Map(await Promise.all(assets.map(async name => [name, hash(await readFile(new URL(name, folder)))])));
const config = JSON.parse(await readFile(new URL('staticwebapp.config.json', folder), 'utf8'));

async function verify() {
  await Promise.all([...expected].map(async ([name, digest]) => {
    const url = new URL('/' + name, origin);
    url.searchParams.set('release', digest.slice(0, 16));
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    if (hash(new Uint8Array(await response.arrayBuffer())) !== digest) throw new Error(`${name}: deployed file does not match this commit`);
  }));
  for (const route of ['/login', '/personas', '/chat', '/kpi', '/sales-access']) {
    const response = await fetch(new URL(route, origin), { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    if (!response.headers.get('Content-Security-Policy')?.includes("frame-ancestors 'none'")) throw new Error(`${route}: standalone framing policy missing`);
    if (!response.ok || hash(new Uint8Array(await response.arrayBuffer())) !== expected.get('index.html')) throw new Error(`${route}: application route is not serving this release`);
  }
  for (const route of ['/widget', '/widget.html']) {
    const response = await fetch(new URL(route, origin), { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    if (!response.ok || hash(new Uint8Array(await response.arrayBuffer())) !== expected.get('widget.html')) throw new Error(`${route}: widget release mismatch`);
    const expectedAncestors = config.routes.find(rule => rule.route === route).headers['Content-Security-Policy'].match(/frame-ancestors [^;]+/)?.[0];
    const actualAncestors = response.headers.get('Content-Security-Policy')?.match(/frame-ancestors [^;]+/)?.[0];
    if (!expectedAncestors || actualAncestors !== expectedAncestors) throw new Error(`${route}: widget framing policy mismatch`);
  }
}

let verified = false;
for (let attempt = 1; attempt <= 6; attempt++) {
  try {
    await verify();
    verified = true;
    console.log(`Verified ${assets.length} release files and login/persona/chat/KPI/sales-access routes at ${origin.origin}`);
    break;
  } catch (error) {
    console.error(`Verification attempt ${attempt}/6: ${error.message}`);
    if (attempt < 6) await new Promise(resolve => setTimeout(resolve, 10000));
  }
}
if (!verified) process.exitCode = 1;
