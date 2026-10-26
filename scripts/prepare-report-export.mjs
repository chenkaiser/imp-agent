import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';
import browserify from 'browserify';
import { Transform } from 'node:stream';
const target = new URL('../web/vendor/', import.meta.url);
await mkdir(target, { recursive: true });
const bundle = browserify(fileURLToPath(new URL('../node_modules/exceljs/lib/exceljs.bare.js', import.meta.url)), { standalone: 'ExcelJS' });
// Browserify's dependency parser predates the patched UUID package's syntax.
bundle.transform(file => {
  let text = '';
  return new Transform({ transform(chunk, encoding, callback) { text += chunk; callback(); }, flush(callback) {
    if (!/[\\/]uuid[\\/].*\.js$/.test(file)) { this.push(text); callback(); return; }
    transform(text, { target: 'es2018' }).then(result => { this.push(result.code); callback(); }, callback);
  } });
}, { global: true });
const source = await new Promise((resolve, reject) => bundle.bundle((error, buffer) => error ? reject(new Error(error.message)) : resolve(buffer.toString())));
const result = await transform(source, { minify: true, legalComments: 'eof' });
await writeFile(new URL('exceljs.min.js', target), result.code);
await copyFile(new URL('../node_modules/exceljs/LICENSE', import.meta.url), new URL('exceljs-LICENSE.txt', target));
