import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
// Portable, dependency-free ZIP (stored entries). Package only extension assets.
const root = new URL('../extensions/ask-imp/', import.meta.url);
const store = process.argv.includes('--store');
const crc32 = bytes => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
};
const locals = [], directories = []; let offset = 0;
for (const file of (await readdir(root)).filter(name => /\.(html|css|js|json|md|png)$/.test(name) && name !== 'identity.json' && !(store && name.endsWith('.md'))).sort()) {
  const name = Buffer.from(file);
  let data = await readFile(new URL(file, root));
  if (store && file === 'manifest.json') {
    const manifest = JSON.parse(data.toString('utf8'));
    delete manifest.key; // The first Web Store upload assigns the published identity.
    data = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  }
  const crc = crc32(data);
  const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6); header.writeUInt16LE(33, 12);
  header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(name.length, 26);
  const directory = Buffer.alloc(46); directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6); directory.writeUInt16LE(0x800, 8); directory.writeUInt16LE(33, 14);
  directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(data.length, 20); directory.writeUInt32LE(data.length, 24); directory.writeUInt16LE(name.length, 28); directory.writeUInt32LE(offset, 42);
  locals.push(header, name, data); directories.push(directory, name); offset += header.length + name.length + data.length;
}
const central = Buffer.concat(directories), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(directories.length / 2, 8); end.writeUInt16LE(directories.length / 2, 10); end.writeUInt32LE(central.length, 12); end.writeUInt32LE(offset, 16);
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
const file = store ? 'ask-imp-webstore.zip' : 'ask-imp-widget.zip';
await writeFile(new URL('../dist/' + file, import.meta.url), Buffer.concat([...locals, central, end]));
console.log(`Created dist/${file}${store ? ' (upload as a Web Store draft; bind the assigned ID before publishing)' : ' (load unpacked after extracting)'}.`);
