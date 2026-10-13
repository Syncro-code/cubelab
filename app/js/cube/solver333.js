// Kociemba two-phase solver for the 3x3, used to make random-state scrambles
// (the same idea the official WCA scrambler uses). Move tables are derived
// from the facelet model in model.js so the two can never disagree.

import { CubeState } from './model.js';

const U = 0, R = 9, F = 18, D = 27, L = 36, B = 45;
// Corners URF UFL ULB UBR DFR DLF DBL DRB, edges UR UF UL UB DR DF DL DB FR FL BL BR.
const CORNER_FACELETS = [
  [U + 8, R + 0, F + 2], [U + 6, F + 0, L + 2], [U + 0, L + 0, B + 2], [U + 2, B + 0, R + 2],
  [D + 2, F + 8, R + 6], [D + 0, L + 8, F + 6], [D + 6, B + 8, L + 6], [D + 8, R + 8, B + 6],
];
const EDGE_FACELETS = [
  [U + 5, R + 1], [U + 7, F + 1], [U + 3, L + 1], [U + 1, B + 1],
  [D + 5, R + 7], [D + 1, F + 7], [D + 3, L + 7], [D + 7, B + 7],
  [F + 5, R + 3], [F + 3, L + 5], [B + 5, L + 3], [B + 3, R + 5],
];
const CORNER_COLORS = CORNER_FACELETS.map((c) => c.map((f) => (f / 9) | 0));
const EDGE_COLORS = EDGE_FACELETS.map((e) => e.map((f) => (f / 9) | 0));
const FACE_NAMES = 'URFDLB';

export function toCubie(stickers) {
  const cp = [], co = [], ep = [], eo = [];
  for (let i = 0; i < 8; i++) {
    let ori = 0;
    while (ori < 3 && stickers[CORNER_FACELETS[i][ori]] !== 0 && stickers[CORNER_FACELETS[i][ori]] !== 3) ori++;
    const c1 = stickers[CORNER_FACELETS[i][(ori + 1) % 3]];
    const c2 = stickers[CORNER_FACELETS[i][(ori + 2) % 3]];
    for (let j = 0; j < 8; j++) {
      if (CORNER_COLORS[j][1] === c1 && CORNER_COLORS[j][2] === c2) { cp[i] = j; co[i] = ori % 3; break; }
    }
  }
  for (let i = 0; i < 12; i++) {
    const a = stickers[EDGE_FACELETS[i][0]], b = stickers[EDGE_FACELETS[i][1]];
    for (let j = 0; j < 12; j++) {
      if (EDGE_COLORS[j][0] === a && EDGE_COLORS[j][1] === b) { ep[i] = j; eo[i] = 0; break; }
      if (EDGE_COLORS[j][0] === b && EDGE_COLORS[j][1] === a) { ep[i] = j; eo[i] = 1; break; }
    }
  }
  return { cp, co, ep, eo };
}

// Apply b after a.
export function multiply(a, b) {
  const cp = [], co = [], ep = [], eo = [];
  for (let i = 0; i < 8; i++) { cp[i] = a.cp[b.cp[i]]; co[i] = (a.co[b.cp[i]] + b.co[i]) % 3; }
  for (let i = 0; i < 12; i++) { ep[i] = a.ep[b.ep[i]]; eo[i] = (a.eo[b.ep[i]] + b.eo[i]) % 2; }
  return { cp, co, ep, eo };
}

const SOLVED = { cp: [0, 1, 2, 3, 4, 5, 6, 7], co: [0, 0, 0, 0, 0, 0, 0, 0], ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], eo: new Array(12).fill(0) };

// 18 moves: face*3 + (quarter turns - 1), faces in URFDLB order.
const MOVE_CUBES = [];
for (let f = 0; f < 6; f++) {
  const base = toCubie(new CubeState(3).apply(FACE_NAMES[f]).stickers);
  let c = SOLVED;
  for (let k = 0; k < 3; k++) { c = multiply(c, base); MOVE_CUBES.push(c); }
}
const MOVE_NAMES = [];
for (let f = 0; f < 6; f++) for (const s of ['', '2', "'"]) MOVE_NAMES.push(FACE_NAMES[f] + s);
const P2_MOVES = [0, 1, 2, 4, 7, 9, 10, 11, 13, 16]; // U U2 U' R2 F2 D D2 D' L2 B2

// --- coordinates -------------------------------------------------------
const Cnk = [];
for (let n = 0; n <= 12; n++) {
  Cnk[n] = [];
  for (let k = 0; k <= 12; k++) Cnk[n][k] = k > n ? 0 : k === 0 || k === n ? 1 : Cnk[n - 1][k - 1] + Cnk[n - 1][k];
}

const getTwist = (co) => { let t = 0; for (let i = 0; i < 7; i++) t = 3 * t + co[i]; return t; };
const getFlip = (eo) => { let t = 0; for (let i = 0; i < 11; i++) t = 2 * t + eo[i]; return t; };
function getSlice(ep) {
  let a = 0, x = 0;
  for (let j = 11; j >= 0; j--) if (ep[j] >= 8) { a += Cnk[11 - j][x + 1]; x++; }
  return a;
}
function setTwist(t) {
  const co = new Array(8); let s = 0;
  for (let i = 6; i >= 0; i--) { co[i] = t % 3; s += co[i]; t = (t / 3) | 0; }
  co[7] = (3 - (s % 3)) % 3;
  return co;
}
function setFlip(t) {
  const eo = new Array(12); let s = 0;
  for (let i = 10; i >= 0; i--) { eo[i] = t & 1; s += eo[i]; t >>= 1; }
  eo[11] = s & 1;
  return eo;
}
function setSlice(a) {
  const ep = new Array(12); let x = 4, sl = 8, other = 0;
  for (let q = 11; q >= 0; q--) {
    const j = 11 - q;
    if (x > 0 && Cnk[q][x] <= a) { ep[j] = sl++; a -= Cnk[q][x]; x--; } else ep[j] = -1;
  }
  for (let j = 0; j < 12; j++) if (ep[j] === -1) ep[j] = other++;
  return ep;
}
function permIndex(p, n, off = 0) {
  let idx = 0;
  for (let i = 0; i < n; i++) {
    let c = 0;
    for (let j = i + 1; j < n; j++) if (p[off + j] < p[off + i]) c++;
    idx = idx * (n - i) + c;
  }
  return idx;
}
function permFromIndex(idx, n) {
  const d = new Array(n);
  for (let i = n - 1; i >= 0; i--) { d[i] = idx % (n - i); idx = (idx / (n - i)) | 0; }
  const avail = []; for (let i = 0; i < n; i++) avail.push(i);
  return d.map((k) => avail.splice(k, 1)[0]);
}

// --- tables ------------------------------------------------------------
let T = null;

function buildPrune(n1, n2, mv1, mv2, nMoves) {
  const total = n1 * n2;
  const table = new Int8Array(total).fill(-1);
  const queue = new Int32Array(total);
  let head = 0, tail = 0;
  table[0] = 0; queue[tail++] = 0;
  while (head < tail) {
    const idx = queue[head++];
    const d = table[idx] + 1;
    const a = (idx / n2) | 0, b = idx - a * n2;
    for (let m = 0; m < nMoves; m++) {
      const ni = mv1[a * nMoves + m] * n2 + mv2[b * nMoves + m];
      if (table[ni] < 0) { table[ni] = d; queue[tail++] = ni; }
    }
  }
  return table;
}

export function initSolver() {
  if (T) return;
  const twistMove = new Uint16Array(2187 * 18);
  for (let t = 0; t < 2187; t++) {
    const co = setTwist(t);
    for (let m = 0; m < 18; m++) {
      const mc = MOVE_CUBES[m]; const n = [];
      for (let i = 0; i < 8; i++) n[i] = (co[mc.cp[i]] + mc.co[i]) % 3;
      twistMove[t * 18 + m] = getTwist(n);
    }
  }
  const flipMove = new Uint16Array(2048 * 18);
  for (let t = 0; t < 2048; t++) {
    const eo = setFlip(t);
    for (let m = 0; m < 18; m++) {
      const mc = MOVE_CUBES[m]; const n = [];
      for (let i = 0; i < 12; i++) n[i] = (eo[mc.ep[i]] + mc.eo[i]) % 2;
      flipMove[t * 18 + m] = getFlip(n);
    }
  }
  const sliceMove = new Uint16Array(495 * 18);
  for (let s = 0; s < 495; s++) {
    const ep = setSlice(s);
    for (let m = 0; m < 18; m++) {
      const mc = MOVE_CUBES[m]; const n = [];
      for (let i = 0; i < 12; i++) n[i] = ep[mc.ep[i]];
      sliceMove[s * 18 + m] = getSlice(n);
    }
  }
  const cpMove = new Uint16Array(40320 * 10);
  const ueMove = new Uint16Array(40320 * 10);
  for (let p = 0; p < 40320; p++) {
    const perm = permFromIndex(p, 8);
    const ep = perm.concat([8, 9, 10, 11]);
    for (let k = 0; k < 10; k++) {
      const mc = MOVE_CUBES[P2_MOVES[k]]; const nc = [], ne = [];
      for (let i = 0; i < 8; i++) nc[i] = perm[mc.cp[i]];
      for (let i = 0; i < 8; i++) ne[i] = ep[mc.ep[i]];
      cpMove[p * 10 + k] = permIndex(nc, 8);
      ueMove[p * 10 + k] = permIndex(ne, 8);
    }
  }
  const spMove = new Uint16Array(24 * 10);
  for (let p = 0; p < 24; p++) {
    const ep = [0, 1, 2, 3, 4, 5, 6, 7].concat(permFromIndex(p, 4).map((v) => v + 8));
    for (let k = 0; k < 10; k++) {
      const mc = MOVE_CUBES[P2_MOVES[k]]; const ne = [];
      for (let i = 0; i < 12; i++) ne[i] = ep[mc.ep[i]] - 8;
      spMove[p * 10 + k] = permIndex(ne, 4, 8);
    }
  }
  T = {
    twistMove, flipMove, sliceMove, cpMove, ueMove, spMove,
    pTwistSlice: buildPrune(2187, 495, twistMove, sliceMove, 18),
    pFlipSlice: buildPrune(2048, 495, flipMove, sliceMove, 18),
    pCpSp: buildPrune(40320, 24, cpMove, spMove, 10),
    pUeSp: buildPrune(40320, 24, ueMove, spMove, 10),
  };
}

// --- search ------------------------------------------------------------
const QUARTER_P1_END = new Set([3, 5, 6, 8, 12, 14, 15, 17]); // R R' F F' L L' B B'

export function solveCubie(cc, maxLength = 22, timeoutMs = 4000) {
  initSolver();
  const t0 = Date.now();
  const moves = new Int8Array(64);
  let solution = null, nodes = 0, timedOut = false;
  const {
    twistMove, flipMove, sliceMove, cpMove, ueMove, spMove, pTwistSlice, pFlipSlice, pCpSp, pUeSp,
  } = T;

  function phase2(cp, ue, sp, depth, togo, last) {
    if (togo === 0) return cp === 0 && ue === 0 && sp === 0;
    for (let k = 0; k < 10; k++) {
      const m = P2_MOVES[k]; const f = (m / 3) | 0;
      if (last >= 0 && (f === last || (f % 3 === last % 3 && f < last))) continue;
      const ncp = cpMove[cp * 10 + k], nue = ueMove[ue * 10 + k], nsp = spMove[sp * 10 + k];
      if (Math.max(pCpSp[ncp * 24 + nsp], pUeSp[nue * 24 + nsp]) >= togo) continue;
      moves[depth] = m;
      if (phase2(ncp, nue, nsp, depth + 1, togo - 1, f)) return true;
    }
    return false;
  }

  function startPhase2(depth1) {
    let c = cc;
    for (let i = 0; i < depth1; i++) c = multiply(c, MOVE_CUBES[moves[i]]);
    const cp = permIndex(c.cp, 8), ue = permIndex(c.ep, 8), sp = permIndex(c.ep.map((v) => v - 8), 4, 8);
    const h = Math.max(pCpSp[cp * 24 + sp], pUeSp[ue * 24 + sp]);
    const last = depth1 > 0 ? (moves[depth1 - 1] / 3) | 0 : -1;
    for (let d2 = h; d2 <= maxLength - depth1; d2++) {
      if (phase2(cp, ue, sp, depth1, d2, last)) { solution = Array.from(moves.subarray(0, depth1 + d2)); return true; }
    }
    return false;
  }

  function phase1(tw, fl, sl, depth, togo, last) {
    if (togo === 0) {
      if (depth > 0 && !QUARTER_P1_END.has(moves[depth - 1])) return false;
      return startPhase2(depth);
    }
    if ((++nodes & 0x3fff) === 0 && Date.now() - t0 > timeoutMs) { timedOut = true; return true; }
    for (let m = 0; m < 18; m++) {
      const f = (m / 3) | 0;
      if (last >= 0 && (f === last || (f % 3 === last % 3 && f < last))) continue;
      const ntw = twistMove[tw * 18 + m], nfl = flipMove[fl * 18 + m], nsl = sliceMove[sl * 18 + m];
      if (Math.max(pTwistSlice[ntw * 495 + nsl], pFlipSlice[nfl * 495 + nsl]) >= togo) continue;
      moves[depth] = m;
      if (phase1(ntw, nfl, nsl, depth + 1, togo - 1, f)) return true;
    }
    return false;
  }

  const tw = getTwist(cc.co), fl = getFlip(cc.eo), sl = getSlice(cc.ep);
  const h1 = Math.max(pTwistSlice[tw * 495 + sl], pFlipSlice[fl * 495 + sl]);
  for (let d1 = h1; d1 <= maxLength && !solution && !timedOut; d1++) phase1(tw, fl, sl, 0, d1, -1);
  if (!solution) return null;
  return solution.map((m) => MOVE_NAMES[m]);
}

// --- random state ------------------------------------------------------
function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function parity(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (p[j] < p[i]) s ^= 1;
  return s;
}

export function randomCubie(rnd = Math.random) {
  const cp = shuffle([0, 1, 2, 3, 4, 5, 6, 7], rnd);
  const ep = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], rnd);
  if (parity(cp) !== parity(ep)) [ep[0], ep[1]] = [ep[1], ep[0]];
  return { cp, co: setTwist(Math.floor(rnd() * 2187)), ep, eo: setFlip(Math.floor(rnd() * 2048)) };
}

export function invertMoves(moves) {
  return moves.slice().reverse().map((m) => (m.endsWith("'") ? m[0] : m.endsWith('2') ? m : m + "'"));
}

// Scramble that takes a solved cube to the given cubie state.
export function scrambleForCubie(cc, maxLength = 22) {
  for (let len = maxLength; len <= 30; len += 2) {
    const sol = solveCubie(cc, len, 1500);
    if (sol) return invertMoves(sol).join(' ');
  }
  return null;
}

export function randomStateScramble(rnd = Math.random) {
  for (;;) {
    const s = scrambleForCubie(randomCubie(rnd));
    if (s && s.split(' ').length >= 2) return s;
  }
}
