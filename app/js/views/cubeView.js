// Virtual cube: drag stickers to turn layers, drag the background to look
// around, or use the move pad / keyboard. Scramble it and race the clock.
import { store, PUZZLES } from '../store.js';
import { h, clear, fmtTime, ICONS, modalOpen } from '../ui/dom.js';
import { parseMove } from '../cube/model.js';
import { nextScramble } from '../scrambler.js';
import { pop } from '../sound.js';
import { confetti } from '../ui/confetti.js';

let app, root, els = {}, view = null, visible = false;
let history = [];
let phase = 'free'; // free | scrambled | solving | solved
let startTime = 0, raf = 0, moveCount = 0, wide = false;

export function init(el, appRef) {
  app = appRef;
  root = el;
  els.time = h('div.vc-time', '0.00');
  els.sub = h('div.vc-sub', 'Drag a sticker to turn · drag the background to rotate');
  els.hud = h('div.vc-hud', els.time, els.sub);
  els.stage = h('div.vc-stage');
  els.bar = h('div.vc-bar');
  els.pad = h('div.vc-pad');
  els.help = h('div.vc-help', h('span', 'Keyboard: '), h('span.kbd', 'U D R L F B'), ' clockwise · ', h('span.kbd', 'Shift'), ' + letter counter-clockwise · ', h('span.kbd', 'X Y Z'), ' rotate · ', h('span.kbd', 'Ctrl+Z'), ' undo');
  root.append(h('div.vc', els.hud, els.stage, els.bar, els.pad, els.help));
  renderBar();
  renderPad();
  store.on('puzzle', () => { if (view) { view.setPuzzle(PUZZLES[store.puzzleId].N); reset(); } renderBar(); renderPad(); });
  window.addEventListener('keydown', onKey);
}

export async function onShow() {
  visible = true;
  if (!view) {
    const { CubeView } = await import('../ui/cube3d.js');
    view = new CubeView(els.stage, {
      N: PUZZLES[store.puzzleId].N, scheme: 'wca', interactive: true, turnMs: 150,
      onMove: (mv) => recordMove(mv),
      onSettled: (state) => checkSolved(state),
    });
  }
  view.resize();
}
export function onHide() { visible = false; }

function renderBar() {
  const big = PUZZLES[store.puzzleId].N > 3;
  clear(els.bar).append(...[
    h('button.btn.btn-primary', { onclick: scramble }, h('span', { html: ICONS.shuffle }), 'Scramble'),
    h('button.btn', { onclick: reset }, h('span', { html: ICONS.restart }), 'Reset'),
    h('button.btn', { onclick: undo }, h('span', { html: ICONS.undo }), 'Undo'),
    big ? h('button.btn', { class: wide ? 'on' : '', onclick: () => { wide = !wide; renderBar(); renderPad(); } }, 'Wide') : null,
    h('button.btn', { onclick: () => view?.resetView() }, h('span', { html: ICONS.eye }), 'View')].filter(Boolean));
}

function renderPad() {
  clear(els.pad);
  const w = wide && PUZZLES[store.puzzleId].N > 3 ? 'w' : '';
  const rows = [['U', 'D', 'R', 'L', 'F', 'B'].map((f) => f + w), ['U', 'D', 'R', 'L', 'F', 'B'].map((f) => `${f}${w}'`), ['x', "x'", 'y', "y'", 'z', "z'"]];
  for (const row of rows) for (const m of row) els.pad.append(h('button.btn', { onclick: () => doMove(m) }, m));
}

function doMove(token) {
  if (!view) return;
  const mv = parseMove(token, view.N);
  view.turn(mv);
  recordMove(mv);
}

function recordMove(mv) {
  history.push(mv);
  const isRotation = mv.lo === 0 && mv.hi === view.N - 1;
  if (isRotation) return;
  if (phase === 'scrambled') { phase = 'solving'; startTime = performance.now(); moveCount = 0; tick(); }
  if (phase === 'solving') moveCount++;
  updateSub();
}

function undo() {
  if (!view || !history.length) return;
  const mv = history.pop();
  view.turn({ ...mv, qt: (4 - mv.qt) % 4 });
}

function reset() {
  cancelAnimationFrame(raf);
  history = [];
  phase = 'free';
  moveCount = 0;
  view?.reset();
  els.time.textContent = '0.00';
  updateSub();
}

async function scramble() {
  if (!view) return;
  reset();
  els.sub.textContent = 'Scrambling…';
  const s = await nextScramble(store.puzzleId);
  view.reset();
  await view.play(s, { ms: 45 });
  history = [];
  phase = 'scrambled';
  updateSub();
}

function tick() {
  if (phase !== 'solving') return;
  els.time.textContent = fmtTime(performance.now() - startTime, 2);
  raf = requestAnimationFrame(tick);
}

function checkSolved(state) {
  if (phase !== 'solving' || !state.isSolved()) return;
  phase = 'solved';
  cancelAnimationFrame(raf);
  const t = performance.now() - startTime;
  els.time.textContent = fmtTime(t, store.settings.precision);
  pop();
  if (store.settings.confetti) confetti({ count: 90, duration: 2000 });
  updateSub();
}

function updateSub() {
  if (phase === 'free') els.sub.textContent = 'Drag a sticker to turn · drag the background to rotate';
  else if (phase === 'scrambled') els.sub.textContent = 'Scrambled! The clock starts on your first turn.';
  else if (phase === 'solving') els.sub.textContent = `${moveCount} moves`;
  else if (phase === 'solved') { els.sub.replaceChildren(h('span.vc-solved', 'Solved! '), `${moveCount} moves`); }
}

function onKey(e) {
  if (!visible || app.view !== 'cube' || modalOpen()) return;
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  const k = e.key.toLowerCase();
  const prime = e.shiftKey ? "'" : '';
  if ('udrlfb'.includes(k) && k.length === 1) {
    e.preventDefault();
    doMove(k.toUpperCase() + (wide && view?.N > 3 ? 'w' : '') + prime);
  } else if ('xyz'.includes(k) && k.length === 1) {
    e.preventDefault();
    doMove(k + prime);
  } else if (e.code === 'Space') {
    e.preventDefault();
    scramble();
  }
}
