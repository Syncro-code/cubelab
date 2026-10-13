// Lightweight canvas line chart: singles as dots, ao5/ao12 as lines.
import { effective } from '../stats.js';
import { fmtTime } from './dom.js';

export class TimesChart {
  constructor(container) {
    this.el = container;
    this.canvas = document.createElement('canvas');
    this.tip = document.createElement('div');
    this.tip.className = 'chart-tip';
    container.append(this.canvas, this.tip);
    this.hover = -1;
    this.ro = new ResizeObserver(() => this.draw());
    this.ro.observe(container);
    this.canvas.addEventListener('pointermove', (e) => this.onHover(e));
    this.canvas.addEventListener('pointerleave', () => { this.hover = -1; this.tip.style.opacity = 0; this.draw(); });
  }

  setData(solves, stats, precision = 2) {
    this.solves = solves;
    this.stats = stats;
    this.precision = precision;
    this.draw();
  }

  css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  layout() {
    const w = this.el.clientWidth, hgt = this.el.clientHeight;
    return { w, h: hgt, l: 46, r: 12, t: 12, b: 22 };
  }

  draw() {
    const solves = this.solves || [];
    const L = this.layout();
    if (!L.w || !L.h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = L.w * dpr; this.canvas.height = L.h * dpr;
    this.canvas.style.width = L.w + 'px'; this.canvas.style.height = L.h + 'px';
    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, L.w, L.h);
    const muted = this.css('--muted') || '#8b93a7';
    const line = this.css('--border') || '#2a3140';
    const accent = this.css('--accent') || '#4cc9f0';
    const accent2 = this.css('--accent-2') || '#ff9f43';
    ctx.font = '11px system-ui, -apple-system, Segoe UI, sans-serif';
    if (solves.length < 2) {
      ctx.fillStyle = muted;
      ctx.textAlign = 'center';
      ctx.fillText('Do a couple of solves to see your progress chart', L.w / 2, L.h / 2);
      return;
    }
    const times = solves.map(effective);
    const finite = times.filter((t) => t !== Infinity).sort((a, b) => a - b);
    if (!finite.length) return;
    const lo = finite[0];
    const hi = finite[Math.min(finite.length - 1, Math.floor(finite.length * 0.97))];
    const span = Math.max(500, hi - lo);
    const yMin = Math.max(0, lo - span * 0.08), yMax = hi + span * 0.12;
    const n = times.length;
    const X = (i) => L.l + (i / Math.max(1, n - 1)) * (L.w - L.l - L.r);
    const Y = (v) => L.t + (1 - (Math.min(v, yMax) - yMin) / (yMax - yMin)) * (L.h - L.t - L.b);
    this.map = { X, n, L };

    // grid
    ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.fillStyle = muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const step = niceStep((yMax - yMin) / 4);
    for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) {
      const y = Math.round(Y(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(L.l, y); ctx.lineTo(L.w - L.r, y); ctx.stroke();
      ctx.fillText(fmtTime(v, 2, { round: true }).replace(/\.00$/, ''), L.l - 6, y);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('1', X(0), L.h - 6);
    ctx.fillText(String(n), X(n - 1), L.h - 6);

    // singles
    ctx.fillStyle = muted;
    const r = n > 300 ? 1.2 : n > 100 ? 1.8 : 2.6;
    times.forEach((t, i) => {
      if (t === Infinity) return;
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.arc(X(i), Y(t), r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // averages
    const series = [[5, accent], [12, accent2]];
    for (const [k, color] of series) {
      const roll = this.stats?.rolling?.[k];
      if (!roll) continue;
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath();
      let started = false;
      roll.forEach((v, i) => {
        if (v == null || v === Infinity) { started = false; return; }
        if (!started) { ctx.moveTo(X(i), Y(v)); started = true; } else ctx.lineTo(X(i), Y(v));
      });
      ctx.stroke();
    }
    // best single marker
    const b = this.stats?.best?.single;
    if (b) {
      ctx.fillStyle = '#ffd60a';
      ctx.beginPath(); ctx.arc(X(b.index), Y(b.value), 4, 0, Math.PI * 2); ctx.fill();
    }
    if (this.hover >= 0 && this.hover < n) {
      ctx.strokeStyle = muted; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X(this.hover), L.t); ctx.lineTo(X(this.hover), L.h - L.b); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  onHover(e) {
    if (!this.map || !this.solves?.length) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const { L, n } = this.map;
    const i = Math.round(((x - L.l) / (L.w - L.l - L.r)) * (n - 1));
    if (i < 0 || i >= n) return;
    this.hover = i;
    const s = this.solves[i];
    const a5 = this.stats?.rolling?.[5]?.[i], a12 = this.stats?.rolling?.[12]?.[i];
    const p = this.precision;
    this.tip.innerHTML = `<b>#${i + 1}</b> ${s.p === -1 ? 'DNF' : fmtTime(effective(s), p)}` +
      (a5 != null ? `<br>ao5 ${fmtTime(a5, p, { round: true })}` : '') +
      (a12 != null ? `<br>ao12 ${fmtTime(a12, p, { round: true })}` : '');
    this.tip.style.opacity = 1;
    const tx = Math.min(Math.max(8, x + 12), rect.width - 120);
    this.tip.style.transform = `translate(${tx}px, 8px)`;
    this.draw();
  }

  dispose() { this.ro.disconnect(); }
}

function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}
