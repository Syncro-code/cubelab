// 2D canvas diagrams: last-layer top views (with PLL arrows), isometric views
// for F2L cases, and the unfolded scramble net.
import { geometry } from '../cube/model.js';
import { SCHEMES, MASK_COLOR } from '../cube/colors.js';

const BG = '#0a0c11';

export function sizeCanvas(canvas, w, hgt = w) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(hgt * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${hgt}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, hgt);
  return ctx;
}

function roundRect(ctx, x, y, w, hgt, r) {
  r = Math.min(r, w / 2, hgt / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + hgt, r);
  ctx.arcTo(x + w, y + hgt, x, y + hgt, r);
  ctx.arcTo(x, y + hgt, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Top view of the U layer. `state` is a tracking CubeState (stickers hold home indices).
export function drawTopView(canvas, state, { size = 120, mode = 'pll', scheme = 'yellow', arrows = mode === 'pll', maskCorners = false } = {}) {
  const ctx = sizeCanvas(canvas, size);
  const N = state.N, g = geometry(N), n2 = N * N;
  const colors = SCHEMES[scheme];
  const strip = 0.32, gap = 0.1;
  const units = N + 2 * (strip + gap);
  const cell = size / units;
  const ox = (strip + gap) * cell, oy = ox;
  const pad = Math.max(1, cell * 0.06);
  const cornerHome = (v) => { const [i, , k] = g.cubie[v]; return (i === 0 || i === N - 1) && (k === 0 || k === N - 1); };
  const col = (v) => {
    const hf = g.face[v];
    if (maskCorners && cornerHome(v)) return MASK_COLOR;
    if (mode === 'oll') return hf === 0 ? colors[0] : MASK_COLOR;
    return colors[hf];
  };
  const st = state.stickers;

  ctx.fillStyle = BG;
  roundRect(ctx, ox - pad, oy - pad, N * cell + 2 * pad, N * cell + 2 * pad, cell * 0.12);
  ctx.fill();
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    ctx.fillStyle = col(st[r * N + c]);
    roundRect(ctx, ox + c * cell + pad, oy + r * cell + pad, cell - 2 * pad, cell - 2 * pad, cell * 0.12);
    ctx.fill();
  }
  // side strips: top row of B (above), F (below), L (left), R (right)
  const sw = strip * cell;
  for (let k = 0; k < N; k++) {
    const items = [
      [st[5 * n2 + k], ox + (N - 1 - k) * cell, oy - gap * cell - sw, cell, sw],
      [st[2 * n2 + k], ox + k * cell, oy + N * cell + gap * cell, cell, sw],
      [st[4 * n2 + k], ox - gap * cell - sw, oy + k * cell, sw, cell],
      [st[1 * n2 + k], ox + N * cell + gap * cell, oy + (N - 1 - k) * cell, sw, cell],
    ];
    for (const [v, x, y, w, hh] of items) {
      ctx.fillStyle = col(v);
      if (w > hh) roundRect(ctx, x + pad, y + pad * 0.5, w - 2 * pad, hh - pad, cell * 0.08);
      else roundRect(ctx, x + pad * 0.5, y + pad, w - pad, hh - 2 * pad, cell * 0.08);
      ctx.fill();
    }
  }
  if (arrows) drawArrows(ctx, state, ox, oy, cell, maskCorners);
}

// Arrows from where each top-layer piece is to where it belongs (piece based,
// so twisted pieces still get arrows).
function drawArrows(ctx, state, ox, oy, cell, skipCorners) {
  const N = state.N, n2 = N * N, st = state.stickers, g = geometry(N);
  const M = N - 1, mid = M / 2;
  const isCorner = (i, k) => (i === 0 || i === M) && (k === 0 || k === M);
  // Big-cube edge pieces are grouped into one slot per side so a swapped
  // edge pair gets a single arrow.
  const slotOf = (i, k) => {
    if (isCorner(i, k)) return [`c${i},${k}`, i, k];
    if (k === 0) return ['B', mid, 0];
    if (k === M) return ['F', mid, M];
    if (i === 0) return ['L', 0, mid];
    if (i === M) return ['R', M, mid];
    return null;
  };
  const pos = new Map();
  const target = new Map();
  for (let p = 0; p < n2; p++) {
    const [i, , k] = g.cubie[p];
    const [hi, hj, hk] = g.cubie[st[p]];
    if (hj !== M || (hi === i && hk === k)) continue;
    if (skipCorners && isCorner(i, k)) continue;
    const a = slotOf(i, k), b = slotOf(hi, hk);
    if (!a || !b || a[0] === b[0]) continue;
    pos.set(a[0], a); pos.set(b[0], b);
    target.set(a[0], b[0]);
  }
  const center = ([, x, y]) => [ox + (x + 0.5) * cell, oy + (y + 0.5) * cell];
  const done = new Set();
  for (const [from, to] of target) {
    if (done.has(from)) continue;
    const both = target.get(to) === from;
    if (both) done.add(to);
    arrow(ctx, center(pos.get(from)), center(pos.get(to)), cell, both);
  }
}

function arrow(ctx, [x1, y1], [x2, y2], cell, both) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const inset = cell * 0.18;
  const ax = x1 + ux * inset, ay = y1 + uy * inset, bx = x2 - ux * inset, by = y2 - uy * inset;
  const head = Math.max(5, cell * 0.28);
  const lw = Math.max(1.6, cell * 0.075);
  for (const [stroke, width] of [['rgba(255,255,255,0.85)', lw + 2.2], ['#11141b', lw]]) {
    ctx.strokeStyle = stroke; ctx.fillStyle = stroke; ctx.lineWidth = width; ctx.lineCap = 'round';
    const sx = both ? ax + ux * head * 0.7 : ax, sy = both ? ay + uy * head * 0.7 : ay;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(bx - ux * head * 0.7, by - uy * head * 0.7); ctx.stroke();
    const tri = (tx, ty, dirx, diry) => {
      const extra = stroke === '#11141b' ? 0 : 1.6;
      ctx.beginPath();
      ctx.moveTo(tx + dirx * extra, ty + diry * extra);
      ctx.lineTo(tx - dirx * (head + extra) - diry * (head * 0.55 + extra), ty - diry * (head + extra) + dirx * (head * 0.55 + extra));
      ctx.lineTo(tx - dirx * (head + extra) + diry * (head * 0.55 + extra), ty - diry * (head + extra) - dirx * (head * 0.55 + extra));
      ctx.closePath(); ctx.fill();
    };
    tri(bx, by, ux, uy);
    if (both) tri(ax, ay, -ux, -uy);
  }
}

// Isometric view of U, F and R. mask(homeIndex) decides which stickers are coloured.
export function drawIso(canvas, state, { size = 120, scheme = 'yellow', mask = null, tracking = true } = {}) {
  const ctx = sizeCanvas(canvas, size);
  const N = state.N, g = geometry(N), colors = SCHEMES[scheme];
  const s = size / (N * 2.05);
  const cx = size / 2, cy = size / 2;
  const proj = ([x, y, z]) => [cx + (x - z) * 0.866 * s, cy + ((x + z) * 0.5 - y) * s];
  const half = N / 2;
  // body silhouette
  ctx.fillStyle = BG;
  const outline = [[-half, half, -half], [half, half, -half], [half, -half, -half], [half, -half, half], [-half, -half, half], [-half, half, half]].map(proj);
  const grow = 1.03;
  ctx.beginPath();
  outline.forEach(([x, y], i) => { const px = cx + (x - cx) * grow, py = cy + (y - cy) * grow; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  ctx.closePath(); ctx.fill();
  const faces = { 0: [[1, 0, 0], [0, 0, 1]], 2: [[1, 0, 0], [0, 1, 0]], 1: [[0, 1, 0], [0, 0, 1]] };
  for (let f = 0; f < g.count; f++) {
    const face = g.face[f];
    if (!(face in faces)) continue;
    const c = g.pos[f].map((v) => v / 2);
    const [t1, t2] = faces[face];
    const k = 0.44;
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => proj([0, 1, 2].map((i) => c[i] + (t1[i] * a + t2[i] * b) * k)));
    const v = state.stickers[f];
    const home = tracking ? v : null;
    const faceIdx = tracking ? g.face[v] : v;
    ctx.fillStyle = mask && !mask(home, f) ? MASK_COLOR : colors[faceIdx];
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath(); ctx.fill();
  }
}

// Unfolded net (state holds face indices).
export function drawNet(canvas, state, { width = 240, scheme = 'wca' } = {}) {
  const N = state.N;
  const cell = width / (4 * N + 3 * 0.35);
  const gap = cell * 0.35;
  const height = 3 * N * cell + 2 * gap;
  const ctx = sizeCanvas(canvas, width, height);
  const colors = SCHEMES[scheme];
  const place = { 0: [1, 0], 4: [0, 1], 2: [1, 1], 1: [2, 1], 5: [3, 1], 3: [1, 2] };
  const pad = Math.max(0.6, cell * 0.07);
  for (let f = 0; f < 6; f++) {
    const [fx, fy] = place[f];
    const x0 = fx * (N * cell + gap), y0 = fy * (N * cell + gap);
    ctx.fillStyle = BG;
    roundRect(ctx, x0 - pad, y0 - pad, N * cell + 2 * pad, N * cell + 2 * pad, cell * 0.15);
    ctx.fill();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      ctx.fillStyle = colors[state.stickers[f * N * N + r * N + c]];
      roundRect(ctx, x0 + c * cell + pad, y0 + r * cell + pad, cell - 2 * pad, cell - 2 * pad, cell * 0.14);
      ctx.fill();
    }
  }
}

// Masks for tracking states --------------------------------------------------
export function f2lMask(N = 3) {
  const g = geometry(N);
  // centres, D-layer edges (cross), the DFR corner and FR edge
  return (home) => {
    const [i, j, k] = g.cubie[home];
    const isCenter = [i, j, k].filter((v) => v === 1).length === 2;
    if (isCenter) return true;
    if (j === 0 && [i, k].filter((v) => v === 1).length === 1) return true; // cross edges
    if (i === 2 && k === 2 && j <= 1) return true; // DFR corner + FR edge
    return false;
  };
}

export function firstTwoLayersMask(N = 3) {
  const g = geometry(N);
  return (home) => g.cubie[home][1] < N - 1;
}
