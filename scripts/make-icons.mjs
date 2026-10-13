// Generates the app icons (PNG, SVG, ICO) from one vector description.
// Run: node scripts/make-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import zlib from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BG_TOP = [20, 31, 52], BG_BOTTOM = [9, 12, 19];
const BODY = [8, 9, 13];
const COLORS = { U: [244, 246, 251], F: [18, 184, 78], R: [232, 35, 47] };

// Polygons in a 512x512 design space. scale shrinks the cube (maskable safe zone).
function shapes(scale = 1) {
  const s = 61 * scale, cx = 256, cy = 262;
  const proj = ([x, y, z]) => [cx + (x - z) * 0.866 * s, cy + ((x + z) * 0.5 - y) * s];
  const h = 1.5;
  const polys = [];
  const hex = [[-h, h, -h], [h, h, -h], [h, -h, -h], [h, -h, h], [-h, -h, h], [-h, h, h]].map(proj);
  const grow = (pts, k) => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
  polys.push({ pts: grow(hex, 1.045), color: BODY });
  const faces = [
    { key: 'U', n: [0, 1, 0], t1: [1, 0, 0], t2: [0, 0, 1] },
    { key: 'F', n: [0, 0, 1], t1: [1, 0, 0], t2: [0, 1, 0] },
    { key: 'R', n: [1, 0, 0], t1: [0, 0, 1], t2: [0, 1, 0] },
  ];
  for (const f of faces) {
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const c = [0, 1, 2].map((i) => f.n[i] * h + f.t1[i] * a + f.t2[i] * b);
      const k = 0.43;
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => proj([0, 1, 2].map((i) => c[i] + (f.t1[i] * u + f.t2[i] * v) * k)));
      polys.push({ pts, color: COLORS[f.key] });
    }
  }
  return polys;
}

function inside(pts, x, y) {
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    const c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
    if (c !== 0) { const s = c > 0 ? 1 : -1; if (sign && s !== sign) return false; sign = s; }
  }
  return true;
}

function inRoundRect(x, y, size, r) {
  const cx = Math.min(Math.max(x, r), size - r), cy = Math.min(Math.max(y, r), size - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function render(size, { rounded = true, scale = 1 } = {}) {
  const polys = shapes(scale).map((p) => {
    const xs = p.pts.map((q) => q[0]), ys = p.pts.map((q) => q[1]);
    return { ...p, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
  });
  const k = 512 / size, SS = 4;
  const out = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const x = (px + (sx + 0.5) / SS) * k, y = (py + (sy + 0.5) / SS) * k;
        if (rounded && !inRoundRect(x, y, 512, 112)) continue;
        const t = y / 512;
        let col = BG_TOP.map((v, i) => v + (BG_BOTTOM[i] - v) * t);
        const glow = Math.max(0, 1 - Math.hypot(x - 256, y - 200) / 300) * 0.35;
        col = col.map((v) => v + (76 - v * 0) * glow * (v === col[2] ? 1 : 0.5));
        for (const p of polys) {
          if (x < p.box[0] || x > p.box[2] || y < p.box[1] || y > p.box[3]) continue;
          if (inside(p.pts, x, y)) col = p.color;
        }
        r += col[0]; g += col[1]; b += col[2]; a += 255;
      }
      const n = SS * SS, o = (py * size + px) * 4;
      const cover = a / n / 255;
      out[o] = cover ? Math.round(r / (n * cover)) : 0;
      out[o + 1] = cover ? Math.round(g / (n * cover)) : 0;
      out[o + 2] = cover ? Math.round(b / (n * cover)) : 0;
      out[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

function png(size, rgba) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const dir = [], datas = [];
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size; e[1] = size >= 256 ? 0 : size; e[2] = 0; e[3] = 0;
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(data.length, 8); e.writeUInt32LE(offset, 12);
    offset += data.length;
    dir.push(e); datas.push(data);
  }
  return Buffer.concat([header, ...dir, ...datas]);
}

function svg() {
  const f = (c) => `rgb(${c.join(',')})`;
  const polys = shapes(1).map((p) => `<polygon points="${p.pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" fill="${f(p.color)}" stroke="${f(p.color)}" stroke-width="2" stroke-linejoin="round"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f(BG_TOP)}"/><stop offset="1" stop-color="${f(BG_BOTTOM)}"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/>${polys}</svg>\n`;
}

const icons = join(ROOT, 'app', 'icons');
const build = join(ROOT, 'build');
mkdirSync(icons, { recursive: true });
mkdirSync(build, { recursive: true });
const write = (path, buf) => { writeFileSync(path, buf); console.log('wrote', path.replace(ROOT, '.')); };

write(join(icons, 'icon.svg'), svg());
write(join(icons, 'icon-192.png'), png(192, render(192)));
write(join(icons, 'icon-512.png'), png(512, render(512)));
write(join(icons, 'icon-maskable-512.png'), png(512, render(512, { rounded: false, scale: 0.78 })));
write(join(icons, 'apple-touch-icon.png'), png(180, render(180, { rounded: false, scale: 0.92 })));
write(join(build, 'icon.png'), png(512, render(512)));
write(join(build, 'icon.ico'), ico([16, 24, 32, 48, 64, 128, 256].map((size) => ({ size, data: png(size, render(size)) }))));
