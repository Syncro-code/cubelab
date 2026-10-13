// Copies the package.json version into the web app (version.js and the
// service worker cache name). Runs automatically on `npm version <x>`.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const edit = (rel, re, rep) => {
  const p = join(ROOT, rel);
  const s = readFileSync(p, 'utf8');
  if (!re.test(s)) throw new Error(`pattern not found in ${rel}`);
  writeFileSync(p, s.replace(re, rep));
};
edit('app/js/version.js', /VERSION = '[^']*'/, `VERSION = '${version}'`);
edit('app/sw.js', /VERSION = 'cubelab-v[^']*'/, `VERSION = 'cubelab-v${version}'`);
console.log(`web app version set to ${version}`);
