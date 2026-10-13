// Verifies every algorithm in app/js/data/algs.js.
// Run: node scripts/verify-algs.mjs
import { CubeState, invertAlg, geometry } from '../app/js/cube/model.js';
import { toCubie } from '../app/js/cube/solver333.js';
import * as A from '../app/js/data/algs.js';

let failures = 0, checks = 0;
const fail = (set, e, msg) => { failures++; console.log(`  FAIL ${set} ${e.id} (${e.name}): ${msg}`); };
const AUF = ['', 'U', 'U2', "U'"];

// Rotate a 3x3 so its centres are home (algs may contain x/y rotations).
const ROTS = [];
for (const a of ['', 'x', 'x2', "x'", 'z', "z'"]) for (const b of ['', 'y', 'y2', "y'"]) ROTS.push(`${a} ${b}`.trim());
function normalize(s) {
  if (s.N !== 3) return s;
  for (const r of ROTS) {
    const t = r ? s.clone().apply(r) : s.clone();
    let ok = true;
    for (let f = 0; f < 6; f++) if (t.stickers[f * 9 + 4] !== f) { ok = false; break; }
    if (ok) return t;
  }
  throw new Error('cannot normalise');
}
const caseState = (e, N = 3) => normalize(new CubeState(N).apply(e.setup || invertAlg(e.alg)));
const solvesWithAuf = (S, alg) => AUF.some((a) => AUF.some((b) => S.clone().apply(`${a} ${alg} ${b}`).isSolved()));

function f2lIntact(c) {
  for (let i = 4; i < 8; i++) if (c.cp[i] !== i || c.co[i]) return false;
  for (let i = 4; i < 12; i++) if (c.ep[i] !== i || c.eo[i]) return false;
  return true;
}
// Only stickers on top-layer cubies differ from solved?
function onlyTopLayer(S) {
  const g = geometry(S.N);
  for (let i = 0; i < g.count; i++) if (S.stickers[i] !== g.face[i] && g.cubie[i][1] !== S.N - 1) return false;
  return true;
}

function checkCommon(set, e, N = 3) {
  checks++;
  const S = caseState(e, N);
  if (!solvesWithAuf(S, e.alg)) fail(set, e, 'main alg does not solve its own case');
  for (const alt of e.alts || []) {
    checks++;
    if (!solvesWithAuf(S, alt)) fail(set, e, `alt "${alt}" solves a different case`);
  }
  return S;
}

// ---- OLL ----
console.log('OLL');
const ollTable = [];
for (const e of A.OLL) {
  const S = checkCommon('OLL', e);
  const c = toCubie(S.stickers);
  if (!f2lIntact(c)) { fail('OLL', e, 'breaks F2L'); continue; }
  const E = [0, 1, 2, 3].filter((i) => !c.eo[i]).length;
  const C = [0, 1, 2, 3].filter((i) => !c.co[i]).length;
  if (E === 4 && C === 4) fail('OLL', e, 'case is already oriented');
  const want = { Dot: (E === 0), 'Cross (OCLL)': (E === 4), 'Corners oriented': (C === 4 && E === 2) }[e.group];
  if (want === false || (want === undefined && E !== 2)) fail('OLL', e, `group "${e.group}" but edges oriented=${E} corners=${C}`);
  ollTable.push(`${e.id}:E${E}C${C}`);
}
if (A.OLL.length !== 57 || new Set(A.OLL.map((e) => e.id)).size !== 57) fail('OLL', { id: '-', name: 'set' }, 'expected 57 distinct cases');
console.log('  ' + ollTable.join(' '));

// ---- PLL ----
console.log('PLL');
const EXPECT = {
  Aa: 'c3e0', Ab: 'c3e0', E: 'c4e0', H: 'c0e4opp', Z: 'c0e4adj', Ua: 'c0e3', Ub: 'c0e3',
  T: 'c2adj-e2opp', F: 'c2adj-e2opp', Ja: 'c2adj-e2adj', Jb: 'c2adj-e2adj', Ra: 'c2adj-e2adj', Rb: 'c2adj-e2adj',
  V: 'c2diag-e2adj', Y: 'c2diag-e2adj', Na: 'c2diag-e2opp', Nb: 'c2diag-e2opp',
  Ga: 'c2adj-e4', Gb: 'c2adj-e4', Gc: 'c2adj-e4', Gd: 'c2adj-e4', // = corner 3-cycle + edge 3-cycle up to AUF
};
function pllSignature(S) {
  let best = null;
  for (const a of AUF) {
    const c = toCubie(S.clone().apply(a).stickers);
    const cs = [0, 1, 2, 3].filter((i) => c.cp[i] !== i);
    const es = [0, 1, 2, 3].filter((i) => c.ep[i] !== i);
    let sig = `c${cs.length}`;
    if (cs.length === 2) sig += (Math.abs(cs[0] - cs[1]) === 2 ? 'diag' : 'adj') + '-';
    sig += `e${es.length}`;
    if (es.length === 2) sig += Math.abs(es[0] - es[1]) === 2 ? 'opp' : 'adj';
    if (es.length === 4 && cs.length === 0) sig += es.every((i) => Math.abs(c.ep[i] - i) === 2) ? 'opp' : 'adj';
    const score = cs.length + es.length;
    if (!best || score < best.score) best = { score, sig };
  }
  return best.sig;
}
for (const e of A.PLL) {
  const S = checkCommon('PLL', e);
  const c = toCubie(S.stickers);
  if (!f2lIntact(c)) { fail('PLL', e, 'breaks F2L'); continue; }
  if (c.co.slice(0, 4).some(Boolean) || c.eo.slice(0, 4).some(Boolean)) fail('PLL', e, 'changes orientation');
  const sig = pllSignature(S);
  if (sig !== EXPECT[e.id]) fail('PLL', e, `signature ${sig}, expected ${EXPECT[e.id]}`);
}
if (A.PLL.length !== 21) fail('PLL', { id: '-', name: 'set' }, 'expected 21 cases');

// ---- 2-look ----
console.log('2-look');
for (const [set, list] of [['OLL_EDGES', A.OLL_EDGES], ['OLL_CORNERS', A.OLL_CORNERS], ['PLL_CORNERS', A.PLL_CORNERS], ['PLL_EDGES', A.PLL_EDGES]]) {
  for (const e of list) {
    const S = checkCommon(set, e);
    if (!f2lIntact(toCubie(S.stickers))) fail(set, e, 'breaks F2L');
    const c = toCubie(S.stickers);
    if (set === 'OLL_CORNERS' && c.eo.slice(0, 4).some(Boolean)) fail(set, e, 'edges not oriented in case');
    if (set === 'PLL_EDGES' && c.co.slice(0, 4).some(Boolean)) fail(set, e, 'orientation not solved');
  }
}

// ---- F2L ----
console.log('F2L');
for (const e of A.F2L) {
  const S = checkCommon('F2L', e);
  const c = toCubie(S.stickers);
  const crossOk = [4, 5, 6, 7].every((i) => c.ep[i] === i && !c.eo[i]);
  const othersOk = [5, 6, 7].every((i) => c.cp[i] === i && !c.co[i]) && [9, 10, 11].every((i) => c.ep[i] === i && !c.eo[i]);
  const slotSolved = c.cp[4] === 4 && !c.co[4] && c.ep[8] === 8 && !c.eo[8];
  if (!crossOk) fail('F2L', e, 'cross not intact');
  if (!othersOk) fail('F2L', e, 'other slots disturbed');
  if (slotSolved) fail('F2L', e, 'slot already solved');
}

// ---- Beginner ----
console.log('Beginner');
for (const e of A.BEGINNER) {
  if (e.view === 'none') continue;
  const S = checkCommon('BEGINNER', e);
  const c = toCubie(S.stickers);
  const firstLayer = [4, 5, 6, 7].every((i) => c.cp[i] === i && !c.co[i] && c.ep[i] === i && !c.eo[i]);
  if (!firstLayer) fail('BEGINNER', e, 'first layer disturbed');
  if (e.id === 'edge-right' && (c.ep[8] === 8 || ![9, 10, 11].every((i) => c.ep[i] === i && !c.eo[i]))) fail('BEGINNER', e, 'should only affect FR edge');
  if (e.id === 'edge-left' && (c.ep[9] === 9 || ![8, 10, 11].every((i) => c.ep[i] === i && !c.eo[i]))) fail('BEGINNER', e, 'should only affect FL edge');
  if (['yellow-cross', 'yellow-edges', 'corner-position'].includes(e.id) && !f2lIntact(c)) fail('BEGINNER', e, 'breaks F2L');
  if (e.id === 'corner-position' && [0, 1, 2, 3].some((i) => c.ep[i] !== i || c.eo[i])) fail('BEGINNER', e, 'moves edges');
}

// ---- Big cube parity ----
console.log('Parity');
for (const e of [...A.PARITY_444, ...A.PARITY_555]) {
  checks++;
  const N = e.puzzle;
  const S = new CubeState(N).apply(e.setup || invertAlg(e.alg));
  if (!onlyTopLayer(S)) fail('PARITY', e, 'case is not confined to the top layer');
  const after = S.clone().apply(e.alg);
  if (!onlyTopLayer(after)) fail('PARITY', e, 'alg disturbs more than the top layer');
  if (e.id === 'oll-parity') {
    // after the fix the number of flipped edge pairs on top must be even
    const g = geometry(N);
    let flipped = 0;
    for (let col = 1; col < N - 1; col++) {
      // edge stickers on U: back row, front row, left col, right col
      for (const idx of [col, (N - 1) * N + col, col * N, col * N + N - 1]) if (after.stickers[idx] !== 0) flipped++;
    }
    if ((flipped / 2) % 2 !== 0) fail('PARITY', e, 'odd number of flipped edges remain');
    void g;
  }
  for (const alt of e.alts || []) {
    checks++;
    const t = S.clone().apply(alt);
    if (!onlyTopLayer(t)) fail('PARITY', e, `alt "${alt}" disturbs more than the top layer`);
  }
}

console.log(`\n${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
