// Modal 3D algorithm player: shows a start state and steps through moves.
import { h, modal, ICONS } from './dom.js';
import { CubeState, parseAlg, tokenize, invertAlg } from '../cube/model.js';
import { store } from '../store.js';

export async function openPlayer({ title, N = 3, alg, start = null, scheme = 'yellow', autoplay = true, subtitle = '', alts = [] }) {
  const { CubeView } = await import('./cube3d.js');
  const stage = h('div.player-stage');
  const movesEl = h('div.player-moves');
  const algSelect = alts.length ? h('select.select', { 'aria-label': 'Algorithm' }, [alg, ...alts].map((a, i) => h('option', { value: String(i) }, i ? `Alt ${i}: ${a}` : `Main: ${a}`))) : null;
  const playBtn = h('button.icon-btn.primary', { 'aria-label': 'Play', html: ICONS.play });
  const speeds = [0.5, 1, 2];
  let speedIdx = 1;
  const speedBtn = h('button.btn.btn-small', '1x');
  const controls = h('div.player-controls',
    h('button.icon-btn', { 'aria-label': 'Restart', html: ICONS.restart, onclick: () => restart(false) }),
    h('button.icon-btn', { 'aria-label': 'Step back', html: ICONS.stepB, onclick: () => step(-1) }),
    playBtn,
    h('button.icon-btn', { 'aria-label': 'Step forward', html: ICONS.stepF, onclick: () => step(1) }),
    speedBtn);
  let closed = false;
  const m = modal(h('div.player',
    subtitle ? h('div', { style: { color: 'var(--muted)', fontSize: '14px', textAlign: 'center' } }, subtitle) : null,
    algSelect,
    stage, movesEl, controls,
    h('div.player-hint', 'Drag to look around · double-click to reset the view')), {
    title, wide: true, onClose: () => { closed = true; gen++; view.dispose(); },
  });

  const view = new CubeView(stage, { N, scheme, orbit: true });
  let current = alg, tokens = [], moves = [], pos = 0, playing = false, gen = 0;
  const startState = () => (start ? start.clone() : new CubeState(N).apply(invertAlg(current)));
  const baseMs = () => 260 / speeds[speedIdx] / (store.settings.animSpeed || 1);

  function renderMoves() {
    movesEl.replaceChildren(...tokens.map((t, i) => h('span', { class: i < pos ? 'done' : i === pos && playing ? 'cur' : '' }, t)));
  }
  function setPlaying(v) {
    playing = v;
    playBtn.innerHTML = v ? ICONS.pause : ICONS.play;
    playBtn.setAttribute('aria-label', v ? 'Pause' : 'Play');
    renderMoves();
  }
  function restart(auto) {
    gen++;
    view.stop();
    tokens = tokenize(current);
    moves = parseAlg(current, N);
    pos = 0;
    view.setState(startState());
    setPlaying(false);
    if (auto) { const g = gen; setTimeout(() => { if (g === gen && !closed) play(); }, 450); }
  }
  async function play() {
    if (pos >= moves.length) restart(false);
    const g = ++gen;
    setPlaying(true);
    while (pos < moves.length) {
      renderMoves();
      await view.play([moves[pos]], { ms: baseMs() });
      if (g !== gen) return; // paused, stepped or restarted meanwhile
      pos++;
    }
    setPlaying(false);
  }
  // Pausing completes the move that is in flight.
  function pause() {
    if (!playing) return;
    gen++;
    view.finishAll();
    pos++;
    setPlaying(false);
  }
  function step(dir) {
    pause();
    view.finishAll();
    if (dir > 0 && pos < moves.length) { view.play([moves[pos]], { ms: baseMs() * 0.8 }); pos++; }
    if (dir < 0 && pos > 0) {
      pos--;
      const mv = moves[pos];
      view.play([{ ...mv, qt: (4 - mv.qt) % 4 }], { ms: baseMs() * 0.8 });
    }
    renderMoves();
  }
  playBtn.onclick = () => (playing ? pause() : play());
  speedBtn.onclick = () => { speedIdx = (speedIdx + 1) % speeds.length; speedBtn.textContent = `${speeds[speedIdx]}x`; };
  if (algSelect) algSelect.onchange = () => { current = algSelect.value === '0' ? alg : alts[Number(algSelect.value) - 1]; restart(true); };
  restart(autoplay);
  return m;
}
