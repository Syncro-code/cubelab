// Sanity tests for the cube model and the 3x3 two-phase scrambler.
// Run: node scripts/test-engine.mjs
import assert from 'node:assert/strict';
import { CubeState, invertAlg, parseAlg } from '../app/js/cube/model.js';
import { toCubie, multiply, initSolver, randomCubie, scrambleForCubie } from '../app/js/cube/solver333.js';

let passed = 0;
const ok = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
function randomAlg(N, len) {
  const toks = [];
  for (let i = 0; i < len; i++) {
    const f = FACES[Math.floor(Math.random() * 6)];
    const w = N > 3 && Math.random() < 0.4 ? 'w' : '';
    const pre = N > 4 && w && Math.random() < 0.3 ? '3' : '';
    toks.push(pre + f + w + ['', "'", '2'][Math.floor(Math.random() * 3)]);
  }
  return toks.join(' ');
}

console.log('model');
ok('sexy move x6 = identity', () => assert(new CubeState(3).apply("R U R' U' ".repeat(6)).isSolved()));
ok('R4 identity on 3/4/5', () => [3, 4, 5].forEach((n) => assert(new CubeState(n).apply('R R R R').isSolved())));
ok('alg + inverse = solved (3,4,5)', () => {
  for (const n of [3, 4, 5]) for (let k = 0; k < 50; k++) {
    const a = randomAlg(n, 40);
    assert(new CubeState(n).apply(a).apply(invertAlg(a)).isSolved(), a);
  }
});
ok('rotations keep solved', () => assert(new CubeState(4).apply("x y2 z' x'").isSolved()));
ok('M = L\' R x  (3x3)', () => {
  const a = new CubeState(3).apply("M U");
  const b = new CubeState(3).apply("L' R x' U");
  // M moves like L; R L' x == M' ... compare M U with  (R L' x') U
  assert.deepEqual(Array.from(a.stickers), Array.from(b.stickers));
});
ok('Rw = R + 2R on 4x4', () => {
  const a = new CubeState(4).apply('Rw U');
  const b = new CubeState(4).apply('R 2R U');
  assert.deepEqual(Array.from(a.stickers), Array.from(b.stickers));
});
ok('r == Rw on 3x3 and 3Rw on 5x5 = R 2R 3R', () => {
  assert.deepEqual(Array.from(new CubeState(3).apply("r U").stickers), Array.from(new CubeState(3).apply("Rw U").stickers));
  assert.deepEqual(Array.from(new CubeState(5).apply("3Rw F").stickers), Array.from(new CubeState(5).apply("R 2R 3R F").stickers));
});
ok('U moves F stickers to L', () => {
  const s = new CubeState(3).apply('U');
  // L face (index 4) top row should now be F colour (2)
  assert.deepEqual(s.face(4).slice(0, 3), [2, 2, 2]);
});
ok('R moves F stickers to U', () => {
  const s = new CubeState(3).apply('R');
  const u = s.face(0);
  assert.deepEqual([u[2], u[5], u[8]], [2, 2, 2]);
});
ok('parse counts', () => assert.equal(parseAlg("(R U R' U') x2 3Rw2' M'", 5).length, 7));

console.log('cubie');
ok('facelet->cubie matches cubie multiplication', () => {
  const MOVES = {};
  for (const f of FACES) MOVES[f] = toCubie(new CubeState(3).apply(f).stickers);
  for (let k = 0; k < 30; k++) {
    const alg = randomAlg(3, 25).replace(/w/g, '');
    let c = toCubie(new CubeState(3).stickers);
    for (const t of alg.split(' ')) {
      const n = t.includes('2') ? 2 : t.includes("'") ? 3 : 1;
      for (let i = 0; i < n; i++) c = multiply(c, MOVES[t[0]]);
    }
    assert.deepEqual(c, toCubie(new CubeState(3).apply(alg).stickers), alg);
  }
});

console.log('solver');
let t = Date.now();
initSolver();
console.log(`  tables built in ${Date.now() - t} ms`);
t = Date.now();
const lens = [];
const RUNS = 40;
for (let k = 0; k < RUNS; k++) {
  const target = randomCubie();
  const scr = scrambleForCubie(target);
  assert(scr, 'no scramble found');
  lens.push(scr.split(' ').length);
  const got = toCubie(new CubeState(3).apply(scr).stickers);
  assert.deepEqual(got, target, 'scramble does not reach target state');
}
console.log(`  ${RUNS} random-state scrambles in ${Date.now() - t} ms, lengths ${Math.min(...lens)}-${Math.max(...lens)} (avg ${(lens.reduce((a, b) => a + b) / RUNS).toFixed(1)})`);
passed++;

console.log(`\n${passed} checks passed`);
