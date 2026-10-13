// Synthesised sounds (no audio files): PB chimes, inspection beeps.
import { store } from './store.js';

let ctx = null;
let master = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  master.gain.value = store.settings.volume;
  return ctx;
}

// iOS only allows audio after a user gesture; call this from one.
export function unlockAudio() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = store.settings.ignoreSilent ? 'playback' : 'ambient';
  } catch { /* not supported */ }
  const c = audio();
  if (!c) return;
  const b = c.createBuffer(1, 1, 22050);
  const src = c.createBufferSource();
  src.buffer = b; src.connect(master); src.start(0);
}

// A bell-ish note: fundamental + soft overtones with exponential decay.
function bell(freq, at, { dur = 1.4, gain = 0.25, type = 'sine' } = {}) {
  const c = ctx;
  const t = c.currentTime + at;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(master);
  for (const [mult, amp] of [[1, 1], [2.01, 0.35], [3.02, 0.12]]) {
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = type;
    o.frequency.value = freq * mult;
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

const enabled = () => store.settings.sounds && audio();

// New best single: bright rising arpeggio.
export function chimeSingle() {
  if (!enabled()) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, i * 0.09, { dur: 1.2, gain: 0.22 }));
  bell(1567.98, 0.4, { dur: 1.6, gain: 0.12 });
}

// New best average: warm two-chord fanfare.
export function chimeAverage() {
  if (!enabled()) return;
  [392, 493.88, 587.33].forEach((f) => bell(f, 0, { dur: 0.9, gain: 0.14, type: 'triangle' }));
  [523.25, 659.25, 783.99, 1046.5].forEach((f) => bell(f, 0.22, { dur: 1.8, gain: 0.13, type: 'triangle' }));
}

export function beep(freq = 880, dur = 0.12, gain = 0.25) {
  if (!enabled()) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain * 0.4, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return beep();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.15;
    u.volume = store.settings.volume;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch { beep(); }
}

// Small click when the virtual cube is solved etc.
export function pop() {
  if (!enabled()) return;
  bell(880, 0, { dur: 0.35, gain: 0.15 });
  bell(1318.5, 0.07, { dur: 0.5, gain: 0.12 });
}
