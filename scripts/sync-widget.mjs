import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../web/', import.meta.url);
const index = (await readFile(new URL('index.html', root), 'utf8')).replace(/\r\n/g, '\n');
const widget = index.replace('<title>IMP Agent</title>', '<title>Ask IMP widget</title>').replace('<link rel="stylesheet" href="/kpi.css">', '<link rel="stylesheet" href="/kpi.css">\n  <link rel="stylesheet" href="/widget.css">');
if (process.argv.includes('--check')) {
  if ((await readFile(new URL('widget.html', root), 'utf8')).replace(/\r\n/g, '\n') !== widget) throw new Error('Widget template is stale. Run node scripts/sync-widget.mjs.');
} else await writeFile(new URL('widget.html', root), widget);
