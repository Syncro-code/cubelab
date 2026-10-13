// Cube-coloured confetti burst for personal bests.
import { SCHEMES } from '../cube/colors.js';

export function confetti({ count = 140, duration = 2600 } = {}) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvas.style.display = 'block';
  const colors = SCHEMES.wca;
  const parts = Array.from({ length: count }, (_, i) => {
    const fromLeft = i % 2 === 0;
    const angle = (fromLeft ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.9;
    const speed = 9 + Math.random() * 9;
    return {
      x: fromLeft ? -10 : W + 10, y: H * (0.55 + Math.random() * 0.25),
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      color: colors[i % colors.length],
    };
  });
  const start = performance.now();
  const step = (now) => {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.32; p.vx *= 0.99; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / duration);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.8);
      ctx.restore();
    }
    if (t < duration) requestAnimationFrame(step);
    else { ctx.clearRect(0, 0, W, H); canvas.style.display = 'none'; }
  };
  requestAnimationFrame(step);
}
