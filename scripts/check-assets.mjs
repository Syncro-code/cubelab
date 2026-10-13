// Makes sure the service worker precaches every file the app needs offline.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', 'app');
const sw = readFileSync(join(APP, 'sw.js'), 'utf8');
const listed = new Set([...sw.matchAll(/'([^']+\.[a-z]+)'/g)].map((m) => m[1]));
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [relative(APP, p).split(sep).join('/')];
});
const needed = [...walk(join(APP, 'js')), ...walk(join(APP, 'css')), 'vendor/three.module.min.js', 'index.html', 'manifest.webmanifest'];
const missing = needed.filter((f) => !listed.has(f));
const stale = [...listed].filter((f) => f.includes('/') && !needed.includes(f) && !f.startsWith('icons/'));
if (missing.length || stale.length) {
  console.error('sw.js ASSETS out of date.', missing.length ? `Missing: ${missing.join(', ')}` : '', stale.length ? `Stale: ${stale.join(', ')}` : '');
  process.exit(1);
}
console.log(`sw.js precaches all ${needed.length} app files`);
