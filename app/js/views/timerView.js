// Timer screen: scramble, big timer, penalties, quick stats, cube preview.
import { store, PUZZLES } from '../store.js';
import { h, clear, fmtTime, fmtSolve, ICONS, toast, modalOpen, confirmDialog } from '../ui/dom.js';
import { Timer } from '../timer.js';
import { nextScramble, caseSetup, caseScramble } from '../scrambler.js';
import { CubeState } from '../cube/model.js';
import { AVG_SIZES, effective } from '../stats.js';
import { chimeSingle, chimeAverage, beep, speak } from '../sound.js';
import { confetti } from '../ui/confetti.js';
import { drawNet } from '../ui/diagrams.js';
import { openPlayer } from '../ui/player.js';
import { statsTable, openSolveDetail, openAverageDetail } from './shared.js';

let app, root;
const els = {};
let timer;
let cube = null, cubeLoading = null;
let scramble = '';
let scrambleToken = 0;
let practiceEntry = null, lastPracticeId = null;
let last = null; // { session, solve, entry }
let activePointer = null;
let celebrate = null;

const settings = () => store.settings;
const puzzle = () => PUZZLES[store.puzzleId];
const scheme = () => (app.practice ? 'yellow' : 'wca');

export function init(el, appRef) {
  app = appRef;
  root = el;
  els.side = h('aside.timer-side',
    h('div.card.card-pad', h('h3', 'Statistics'), els.stats = h('div')),
    h('div.card.times-card',
      h('div.times-head', els.timesTitle = h('h3', 'Times'),
        h('button.btn.btn-small', { onclick: () => app.show('times') }, 'All')),
      els.times = h('ol.times-list')));
  els.banner = h('div.practice-banner', { hidden: true });
  els.scramble = h('div.scramble-text');
  els.tools = h('div.scramble-tools.no-timer',
    h('button.icon-btn', { title: 'New scramble (N)', 'aria-label': 'New scramble', html: ICONS.refresh, onclick: () => newScramble() }),
    h('button.icon-btn', { title: 'Copy scramble', 'aria-label': 'Copy scramble', html: ICONS.copy, onclick: copyScramble }),
    h('button.icon-btn', { title: 'Watch the scramble (W)', 'aria-label': 'Watch the scramble', html: ICONS.play, onclick: watchScramble }));
  els.time = h('div.time-display', '0.00');
  els.hint = h('div.timer-hint');
  els.penalty = h('div.penalty-bar.no-timer');
  els.mini = h('div.mini-stats.no-timer');
  els.pb = h('div', { hidden: true });
  els.lastCase = h('div.last-case.no-timer', { hidden: true });
  els.area = h('div.timer-area', els.time, els.hint, els.penalty, els.pb, els.lastCase, els.mini);
  els.preview3d = h('div.preview-3d');
  els.previewNet = h('div.preview-net', els.netCanvas = h('canvas'));
  els.preview = h('div.preview-box.no-timer', {
    title: 'Tap to enlarge',
    onclick: (e) => { if (!e.target.closest('button') && (window.innerWidth <= 860 || settings().preview === 'net')) watchScramble(); },
  },
  h('div.preview-tools',
    h('button.icon-btn', { title: 'Animate scramble', 'aria-label': 'Animate scramble', html: ICONS.play, onclick: animatePreview }),
    h('button.icon-btn', { title: 'Open large view', 'aria-label': 'Open large view', html: ICONS.eye, onclick: watchScramble }),
    h('button.icon-btn', { title: 'Reset view', 'aria-label': 'Reset view', html: ICONS.restart, onclick: () => cube?.resetView() })),
  els.preview3d, els.previewNet);
  els.main = h('div.timer-main', els.banner, h('div.scramble-box', els.scramble, els.tools), els.area, els.preview);
  root.append(h('div.timer-view', els.side, els.main));

  timer = new Timer({
    getSettings: settings,
    onState,
    onTick,
    onFinish,
    onInspectionAlert: (sec) => {
      const mode = settings().inspectionAlerts;
      if (mode === 'voice') speak(`${sec} seconds`);
      else if (mode === 'beep') beep(sec === 8 ? 740 : 990, 0.15);
    },
  });

  bindInput();
  window.matchMedia('(max-width: 1000px)').addEventListener?.('change', refreshStats);
  store.on('puzzle', () => { updateHint(); newScramble(); refreshStats(); });
  store.on('session', () => { refreshStats(); });
  store.on('solves', () => { refreshStats(); renderPenaltyBar(); });
  store.on('settings', ({ key }) => {
    if (!key || key === 'preview') updatePreview();
    if (!key || key === 'precision') refreshStats();
    updateHint();
  });
  updateHint();
  renderPractice();
  refreshStats();
  newScramble();
}

export function onShow() {
  cube?.resize();
}
export function onHide() {
  timer?.cancel();
}

export function onPracticeChange() {
  if (!timer) return;
  renderPractice();
  els.lastCase.hidden = true;
  newScramble();
}

// ---------- scramble ----------
async function newScramble() {
  const token = ++scrambleToken;
  els.scramble.textContent = 'Generating scramble…';
  els.scramble.classList.add('loading');
  let s, entry = null;
  try {
    if (app.practice) {
      const pool = app.practice.entries;
      do { entry = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && entry.id === lastPracticeId);
      s = await caseScramble(caseSetup(app.practice.kind, entry, app.practice.pool));
    } else {
      s = await nextScramble(store.puzzleId);
    }
  } catch (e) {
    console.error(e);
    s = '';
  }
  if (token !== scrambleToken) return;
  scramble = s || '';
  practiceEntry = entry;
  if (entry) lastPracticeId = entry.id;
  els.scramble.classList.remove('loading');
  els.scramble.classList.toggle('big-cube', puzzle().N > 3);
  els.scramble.textContent = scramble || 'Could not make a scramble — tap ↻ to try again';
  updatePreview();
}

function scrambleState() {
  try { return new CubeState(puzzle().N).apply(scramble); } catch { return new CubeState(puzzle().N); }
}

async function ensureCube() {
  if (cube) return cube;
  if (!cubeLoading) {
    cubeLoading = import('../ui/cube3d.js').then(({ CubeView }) => {
      cube = new CubeView(els.preview3d, { N: puzzle().N, scheme: scheme(), orbit: true, turnMs: 150 });
      return cube;
    });
  }
  return cubeLoading;
}

async function updatePreview() {
  const mode = settings().preview;
  els.preview.classList.toggle('hidden', mode === 'off');
  els.main.classList.toggle('has-preview', mode !== 'off');
  els.preview3d.hidden = mode !== '3d';
  els.previewNet.hidden = mode !== 'net';
  if (mode === 'off' || !scramble) return;
  const state = scrambleState();
  if (mode === 'net') {
    const w = els.preview.clientWidth - 20 || 200;
    drawNet(els.netCanvas, state, { width: w, scheme: scheme() });
    return;
  }
  const c = await ensureCube();
  c.setScheme(scheme());
  c.setPuzzle(puzzle().N);
  c.setState(state);
}

async function animatePreview() {
  if (!scramble || settings().preview !== '3d') return watchScramble();
  const c = await ensureCube();
  c.setPuzzle(puzzle().N);
  c.setState(new CubeState(puzzle().N));
  c.play(scramble, { ms: 120 / (settings().animSpeed || 1) });
}

function watchScramble() {
  if (!scramble) return;
  openPlayer({
    title: `${puzzle().long} scramble`, N: puzzle().N, alg: scramble, start: new CubeState(puzzle().N),
    scheme: scheme(), autoplay: true,
    subtitle: app.practice ? 'Hold yellow on top and green in front' : 'Hold white on top and green in front',
  });
}

function copyScramble() {
  if (!scramble) return;
  navigator.clipboard?.writeText(scramble).then(() => toast('Scramble copied'), () => toast('Could not copy'));
}

// ---------- timer display ----------
function onState(state, t) {
  els.main.classList.remove('state-idle', 'state-holding', 'state-ready', 'state-running', 'state-inspecting', 'state-stopped', 'inspect-late');
  els.main.classList.add(`state-${state}`);
  const inspecting = t.holdFrom === 'inspecting' && (state === 'holding' || state === 'ready');
  const focus = state === 'running' || state === 'ready' || state === 'inspecting' || inspecting;
  document.body.classList.toggle('timing', focus);
  if ((state === 'holding' || state === 'ready') && t.holdFrom === 'idle') setTime('0.00');
  if (state === 'ready' || state === 'running') { els.pb.hidden = true; els.lastCase.hidden = true; }
  if (state === 'running' && settings().timerUpdate === 'hidden') setTime('solving');
}

function setTime(text) {
  els.time.textContent = text;
  els.time.classList.toggle('small-digits', text.length > 7);
}

function onTick(v, kind) {
  if (kind === 'inspection') {
    const rem = 15 - Math.floor(v);
    els.main.classList.toggle('inspect-late', v >= 15);
    setTime(rem > 0 ? String(rem) : v < 17 ? '+2' : 'DNF');
    return;
  }
  const mode = settings().timerUpdate;
  if (mode === 'full') setTime(fmtTime(v, settings().precision));
  else if (mode === 'seconds') setTime(String(Math.floor(v / 1000)));
}

function onFinish({ t, p }) {
  const session = store.session();
  const before = session.training ? null : store.allTimeBests();
  const solve = { t, p, s: scramble, d: Date.now() };
  const entry = practiceEntry;
  if (entry) solve.c = entry.name;
  store.addSolve(solve, session);
  last = { session, solve, entry };
  setTime(fmtSolve(solve, settings().precision));
  if (before) checkPersonalBests(before, session, solve);
  if (entry) showLastCase(entry);
  renderPenaltyBar();
  newScramble();
}

function checkPersonalBests(before, session, solve) {
  const st = store.stats(session);
  const prec = settings().precision;
  const wins = [];
  const single = effective(solve);
  if (single !== Infinity && before.single !== Infinity && single < before.single) wins.push(`PB single ${fmtTime(single, prec)}`);
  let avg = false;
  for (const n of AVG_SIZES) {
    const cur = st.current[n];
    if (cur != null && cur !== Infinity && before[n] !== Infinity && cur < before[n]) { wins.push(`best ao${n} ${fmtTime(cur, prec, { round: true })}`); avg = true; }
  }
  if (!wins.length) return;
  const isSingle = wins[0].startsWith('PB single');
  if (isSingle) chimeSingle();
  if (avg) setTimeout(chimeAverage, isSingle ? 750 : 0);
  if (settings().confetti) confetti();
  els.pb.className = 'pb-banner';
  els.pb.innerHTML = `${ICONS.trophy}<span>New ${wins.join(' · ')}!</span>`;
  els.pb.hidden = false;
  clearTimeout(celebrate);
  celebrate = setTimeout(() => { els.pb.hidden = true; }, 9000);
}

function showLastCase(entry) {
  clear(els.lastCase);
  els.lastCase.append('That was ', h('b', entry.name), ': ', h('code', entry.alg), ' ',
    h('button.btn.btn-small', { onclick: () => openPlayer({ title: entry.name, N: 3, alg: entry.alg, alts: entry.alts || [] }) }, 'Watch'));
  els.lastCase.hidden = false;
}

function renderPenaltyBar() {
  clear(els.penalty);
  if (!last || !last.session.solves.includes(last.solve) || timer.state === 'running') return;
  const { session, solve } = last;
  const toggle = (val) => {
    store.updateSolve(session, solve, { p: solve.p === val ? 0 : val });
    setTime(fmtSolve(solve, settings().precision));
  };
  els.penalty.append(
    h('button.btn.btn-small', { class: solve.p === 2000 ? 'on' : '', onclick: () => toggle(2000), title: '+2 (key 2)' }, '+2'),
    h('button.btn.btn-small', { class: solve.p === -1 ? 'on' : '', onclick: () => toggle(-1), title: 'DNF (key D)' }, 'DNF'),
    h('button.btn.btn-small', { onclick: () => deleteLast(), title: 'Delete (Delete key)', 'aria-label': 'Delete solve', html: ICONS.trash }),
    h('button.btn.btn-small', { onclick: () => openSolveDetail(session, solve), title: 'Details', 'aria-label': 'Solve details', html: ICONS.edit }));
}

async function deleteLast() {
  if (!last) return;
  if (!(await confirmDialog('Delete the last solve?', { ok: 'Delete', danger: true }))) return;
  store.deleteSolve(last.session, last.solve);
  last = null;
  setTime('0.00');
  renderPenaltyBar();
}

// ---------- stats ----------
function refreshStats() {
  const session = store.session();
  const st = store.stats(session);
  const prec = settings().precision;
  clear(els.mini);
  for (const n of AVG_SIZES) {
    const cur = st.current[n];
    const isBest = cur != null && st.best[n] && cur === st.best[n].value && cur !== Infinity && session.solves.length > n;
    els.mini.append(h('div.mini-stat', {
      class: isBest ? 'pb' : '',
      onclick: () => cur != null && openAverageDetail(session, n, session.solves.length - 1),
      title: isBest ? 'Session best' : '',
    }, h('div.k', `ao${n}`), h('div.v', cur == null ? '—' : fmtTime(cur, prec, { round: true }))));
  }
  if (!els.side.isConnected || getComputedStyle(els.side).display === 'none') return;
  els.stats.replaceChildren(statsTable(st, session));
  els.timesTitle.textContent = `Times · ${session.name}`;
  clear(els.times);
  const solves = session.solves;
  if (!solves.length) { els.times.append(h('li.empty', 'No solves yet')); return; }
  const roll5 = st.rolling[5];
  const bestIdx = st.best.single?.index;
  const from = Math.max(0, solves.length - 300);
  for (let i = solves.length - 1; i >= from; i--) {
    const s = solves[i];
    els.times.append(h('li', { class: i === bestIdx ? 'best' : '', onclick: () => openSolveDetail(session, s) },
      h('span.idx', `${i + 1}.`), h('span.t', fmtSolve(s, prec)),
      h('span.a', roll5?.[i] != null ? fmtTime(roll5[i], prec, { round: true }) : '')));
  }
}

function renderPractice() {
  const p = app.practice;
  els.banner.hidden = !p;
  if (!p) return;
  clear(els.banner);
  els.banner.append(
    h('span', { html: ICONS.target }),
    h('div.grow', h('b', `Practice · ${p.label}`), ` — ${p.entries.length} case${p.entries.length === 1 ? '' : 's'}. Scramble with yellow on top, green in front.`),
    h('button.btn.btn-small', { onclick: () => app.stopPractice() }, 'Exit'));
}

function updateHint() {
  if (!els.hint) return;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const ins = settings().inspection;
  els.hint.textContent = touch
    ? (ins ? 'Tap to inspect · hold to get ready · release to start' : 'Touch and hold, release to start')
    : (ins ? 'Space to inspect · hold Space · release to start' : 'Hold Space, release to start');
}

// ---------- input ----------
const isTyping = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
const active = () => app.view === 'timer' && !modalOpen();

function bindInput() {
  window.addEventListener('keydown', (e) => {
    if (!active() || isTyping(e.target)) return;
    if (timer.state === 'running') { e.preventDefault(); if (!e.repeat) timer.press(); return; }
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) timer.press(); return; }
    if (e.key === 'Escape') { timer.cancel(); return; }
    if (timer.state !== 'idle' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === '2' && last) { e.preventDefault(); els.penalty.querySelector('button')?.click(); }
    else if (k === 'd' && last) { e.preventDefault(); els.penalty.querySelectorAll('button')[1]?.click(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && last) { e.preventDefault(); deleteLast(); }
    else if (k === 'n') newScramble();
    else if (k === 'w') watchScramble();
  });
  window.addEventListener('keyup', (e) => {
    if (!active()) return;
    if (e.code === 'Space' || timer.state === 'stopped') { e.preventDefault(); timer.release(); }
  });

  const ignore = (e) => e.target.closest('button, a, input, select, textarea, .no-timer');
  els.main.addEventListener('pointerdown', (e) => {
    if (!active() || !e.isPrimary) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (timer.state === 'running' || timer.state === 'stopped') return;
    if (ignore(e)) return;
    e.preventDefault();
    activePointer = e.pointerId;
    timer.press();
  });
  // While running, a touch/click anywhere stops the timer.
  window.addEventListener('pointerdown', (e) => {
    if (!active() || timer.state !== 'running') return;
    e.preventDefault();
    e.stopPropagation();
    activePointer = e.pointerId;
    timer.press();
  }, true);
  const up = (e) => {
    if (e.pointerId !== activePointer) return;
    activePointer = null;
    timer.release();
  };
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  // iOS: stop long-press magnifier / text selection on the timer surface
  els.main.addEventListener('touchstart', (e) => { if (!ignore(e)) e.preventDefault(); }, { passive: false });
  window.addEventListener('blur', () => { if (timer.state === 'holding' || timer.state === 'ready') timer.cancel(); });
}
