// NxN cube facelet model + move notation.
//
// Facelets are stored face by face in the order U R F D L B, each face N*N
// row-major as seen on the standard net (this matches Kociemba's facelet order
// for N = 3). Coordinates: +x = R, +y = U, +z = F. Positions use doubled
// integer coordinates so every facelet sits on an integer lattice point.

export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
export const FACE_NORMALS = [
  [0, 1, 0], [1, 0, 0], [0, 0, 1], [0, -1, 0], [-1, 0, 0], [0, 0, -1],
];

// face letter -> axis (0=x,1=y,2=z), whether it is the positive side, and the
// quarter-turn count (in +90deg right-hand steps) of a clockwise turn.
const FACE_INFO = {
  R: { axis: 0, pos: true, qt: 3 },
  L: { axis: 0, pos: false, qt: 1 },
  U: { axis: 1, pos: true, qt: 3 },
  D: { axis: 1, pos: false, qt: 1 },
  F: { axis: 2, pos: true, qt: 3 },
  B: { axis: 2, pos: false, qt: 1 },
};
const SLICE_INFO = { M: { axis: 0, qt: 1 }, E: { axis: 1, qt: 1 }, S: { axis: 2, qt: 3 } };
const ROT_INFO = { x: { axis: 0, qt: 3 }, y: { axis: 1, qt: 3 }, z: { axis: 2, qt: 3 } };

const geomCache = new Map();

function rot90(axis, p) {
  const [x, y, z] = p;
  if (axis === 0) return [x, -z, y];
  if (axis === 1) return [z, y, -x];
  return [-y, x, z];
}

export function geometry(N) {
  let g = geomCache.get(N);
  if (g) return g;
  const M = N - 1;
  const count = 6 * N * N;
  const cubie = new Array(count);
  const pos = new Array(count);
  const face = new Uint8Array(count);
  let idx = 0;
  for (let f = 0; f < 6; f++) {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        let i, j, k;
        switch (f) {
          case 0: i = c; j = M; k = r; break;          // U
          case 1: i = M; j = M - r; k = M - c; break;  // R
          case 2: i = c; j = M - r; k = M; break;      // F
          case 3: i = c; j = 0; k = M - r; break;      // D
          case 4: i = 0; j = M - r; k = c; break;      // L
          default: i = M - c; j = M - r; k = 0; break; // B
        }
        const n = FACE_NORMALS[f];
        cubie[idx] = [i, j, k];
        pos[idx] = [2 * i - M + n[0], 2 * j - M + n[1], 2 * k - M + n[2]];
        face[idx] = f;
        idx++;
      }
    }
  }
  const W = 2 * N + 1;
  const key = (p) => ((p[0] + N) * W + (p[1] + N)) * W + (p[2] + N);
  const lookup = new Map();
  pos.forEach((p, i) => lookup.set(key(p), i));
  g = { N, count, cubie, pos, face, key, lookup, permCache: new Map() };
  geomCache.set(N, g);
  return g;
}

// Returns src[] such that newState[j] = state[src[j]].
export function movePerm(N, axis, lo, hi, qt) {
  const g = geometry(N);
  qt = ((qt % 4) + 4) % 4;
  const ck = `${axis}:${lo}:${hi}:${qt}`;
  let src = g.permCache.get(ck);
  if (src) return src;
  src = new Int32Array(g.count);
  for (let i = 0; i < g.count; i++) src[i] = i;
  for (let i = 0; i < g.count; i++) {
    const layer = g.cubie[i][axis];
    if (layer < lo || layer > hi) continue;
    let p = g.pos[i];
    for (let t = 0; t < qt; t++) p = rot90(axis, p);
    src[g.lookup.get(g.key(p))] = i;
  }
  g.permCache.set(ck, src);
  return src;
}

const TOKEN_RE = /^(\d*)([URFDLBurfdlbMESxyz])(w?)(\d*)('?)$/;

// Parse a single move token into {axis, lo, hi, qt, text} for an NxN cube.
export function parseMove(token, N) {
  const m = TOKEN_RE.exec(token);
  if (!m) throw new Error(`Bad move "${token}"`);
  const [, prefix, letter, wide, amountStr, prime] = m;
  const amount = amountStr ? parseInt(amountStr, 10) : 1;
  const sign = prime ? -1 : 1;
  let axis, lo, hi, base;
  if (FACE_INFO[letter.toUpperCase()]) {
    const info = FACE_INFO[letter.toUpperCase()];
    const lower = letter !== letter.toUpperCase();
    axis = info.axis;
    base = info.qt;
    let depth = prefix ? parseInt(prefix, 10) : 0;
    let from, to; // counted from the face, 1-based
    if (wide || lower) {
      // Rw / r = two layers; 3Rw / 3r = three layers.
      from = 1; to = depth || 2;
    } else if (depth) {
      // 2R = second layer only.
      from = to = depth;
    } else {
      from = to = 1;
    }
    if (to > N || from < 1) throw new Error(`Move "${token}" too deep for ${N}x${N}`);
    if (info.pos) { lo = N - to; hi = N - from; } else { lo = from - 1; hi = to - 1; }
  } else if (SLICE_INFO[letter]) {
    if (N < 3) throw new Error(`Slice move on ${N}x${N}`);
    axis = SLICE_INFO[letter].axis; base = SLICE_INFO[letter].qt;
    lo = 1; hi = N - 2;
  } else {
    axis = ROT_INFO[letter].axis; base = ROT_INFO[letter].qt;
    lo = 0; hi = N - 1;
  }
  const qt = (((base * amount * sign) % 4) + 4) % 4;
  return { axis, lo, hi, qt, text: token };
}

// Split an algorithm string into tokens (ignores brackets/commas).
export function tokenize(alg) {
  return alg
    .replace(/[()\[\],]/g, ' ')
    .replace(/’/g, "'")
    .split(/\s+/)
    .filter(Boolean);
}

export function parseAlg(alg, N) {
  return tokenize(alg).map((t) => parseMove(t, N));
}

export function invertToken(t) {
  if (t.endsWith("'")) return t.slice(0, -1); // R' -> R, R2' -> R2
  if (/[A-Za-z]w?2$/.test(t)) return t;       // R2, Rw2, x2 are self-inverse
  return t + "'";
}

export function invertAlg(alg) {
  return tokenize(alg).reverse().map(invertToken).join(' ');
}

export class CubeState {
  constructor(N = 3, stickers = null) {
    this.N = N;
    const g = geometry(N);
    this.stickers = stickers ? Uint16Array.from(stickers) : Uint16Array.from(g.face);
  }

  // Same cube but each sticker holds its own home index (for piece tracking).
  static tracking(N) {
    const s = new CubeState(N);
    for (let i = 0; i < s.stickers.length; i++) s.stickers[i] = i;
    return s;
  }

  clone() { return new CubeState(this.N, this.stickers); }

  applyMove(mv) {
    const src = movePerm(this.N, mv.axis, mv.lo, mv.hi, mv.qt);
    const old = this.stickers;
    const next = new Uint16Array(old.length);
    for (let j = 0; j < next.length; j++) next[j] = old[src[j]];
    this.stickers = next;
    return this;
  }

  apply(alg) {
    const moves = typeof alg === 'string' ? parseAlg(alg, this.N) : alg;
    for (const mv of moves) this.applyMove(mv);
    return this;
  }

  // Solved = every face a single colour (any orientation counts).
  isSolved() {
    const n2 = this.N * this.N;
    for (let f = 0; f < 6; f++) {
      const c = this.stickers[f * n2];
      for (let i = 1; i < n2; i++) if (this.stickers[f * n2 + i] !== c) return false;
    }
    return true;
  }

  face(f) {
    const n2 = this.N * this.N;
    return Array.from(this.stickers.subarray(f * n2, f * n2 + n2));
  }
}

const ROTATIONS_24 = [];
for (const a of ['', 'x', 'x2', "x'", 'z', "z'"]) for (const b of ['', 'y', 'y2', "y'"]) ROTATIONS_24.push(`${a} ${b}`.trim());

// For odd cubes: the same state re-oriented so every centre is on its home face.
// Works for face-index states and (tracking = true) home-index states.
export function withCentersHome(state, tracking = false) {
  const N = state.N;
  if (N % 2 === 0) return state;
  const c = (N * N - 1) / 2;
  const faceOf = tracking ? (v) => geometry(N).face[v] : (v) => v;
  for (const r of ROTATIONS_24) {
    const t = r ? state.clone().apply(r) : state.clone();
    let ok = true;
    for (let f = 0; f < 6 && ok; f++) ok = faceOf(t.stickers[f * N * N + c]) === f;
    if (ok) return t;
  }
  return state;
}

// Notation for a raw move {axis, lo, hi, qt} made on the virtual cube.
export function rawMoveToToken(N, mv) {
  const { axis, lo, hi, qt } = mv;
  if (lo === 0 && hi === N - 1) return ['x', 'y', 'z'][axis] + qtSuffix(qt, ROT_INFO[['x', 'y', 'z'][axis]].qt);
  const names = [['L', 'R'], ['D', 'U'], ['B', 'F']];
  const M = N - 1;
  const layer = lo;
  if (N === 3 && layer === 1) {
    const s = ['M', 'E', 'S'][axis];
    return s + qtSuffix(qt, SLICE_INFO[s].qt);
  }
  let letter, depth;
  if (layer >= M / 2) { letter = names[axis][1]; depth = M - layer + 1; }
  else { letter = names[axis][0]; depth = layer + 1; }
  return `${depth > 1 ? depth : ''}${letter}${qtSuffix(qt, FACE_INFO[letter].qt)}`;
}

function qtSuffix(qt, cwQt) {
  qt = ((qt % 4) + 4) % 4;
  if (qt === 2) return '2';
  return qt === cwQt ? '' : "'";
}
