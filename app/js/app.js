// CubeLab bootstrap: navigation, puzzle/session switching, practice mode.
import { store, PUZZLES } from './store.js';
import { $, $$, h, clear, ICONS, toast, promptDialog } from './ui/dom.js';
import { unlockAudio } from './sound.js';
import { warmUp } from './scrambler.js';
import * as timerView from './views/timerView.js';
import * as timesView from './views/timesView.js';
import * as learnView from './views/learnView.js';
import * as cubeView from './views/cubeView.js';
import * as settingsView from './views/settingsView.js';

export { VERSION } from './version.js';

const VIEWS = {
  timer: { label: 'Timer', icon: ICONS.timer, mod: timerView },
  times: { label: 'Times', icon: ICONS.list, mod: timesView },
  learn: { label: 'Learn', icon: ICONS.book, mod: learnView },
  cube: { label: 'Cube', icon: ICONS.cube, mod: cubeView },
  settings: { label: 'Settings', icon: ICONS.gear, mod: settingsView },
};

const app = {
  view: null,
  practice: null, // { kind, label, entries, pool }
  inited: new Set(),

  show(name) {
    if (!VIEWS[name] || name === this.view) return;
    const prev = this.view;
    if (prev) { VIEWS[prev].mod.onHide?.(); $(`#view-${prev}`).classList.remove('active'); }
    this.view = name;
    const el = $(`#view-${name}`);
    if (!this.inited.has(name)) { VIEWS[name].mod.init(el, app); this.inited.add(name); }
    el.classList.add('active');
    VIEWS[name].mod.onShow?.();
    $$('#tabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.view === name));
    try { sessionStorage.setItem('cubelab.view', name); } catch { /* ignore */ }
    updateWakeLock();
  },

  startPractice(practice) {
    if (store.puzzleId !== '333') store.setPuzzle('333');
    this.practice = practice;
    const s = store.findOrCreateTrainingSession(`Practice · ${practice.label}`);
    store.setSession(s.id, '333');
    this.show('timer');
    timerView.onPracticeChange();
    toast(`Practice: ${practice.label} — hold yellow on top, green in front`);
  },

  stopPractice() {
    this.practice = null;
    const p = store.puzzle('333');
    const main = p.sessions.find((s) => !s.training);
    if (main) store.setSession(main.id, '333');
    timerView.onPracticeChange();
  },
};

// ---- header: puzzle switch, sessions, tabs ----
function renderPuzzleSwitch() {
  const el = $('#puzzle-switch');
  clear(el);
  for (const p of Object.values(PUZZLES)) {
    el.append(h('button', {
      role: 'tab', 'aria-selected': String(store.puzzleId === p.id),
      class: store.puzzleId === p.id ? 'active' : '',
      onclick: () => {
        if (app.practice && p.id !== '333') app.stopPractice();
        store.setPuzzle(p.id);
      },
    }, p.name));
  }
}

function renderSessions() {
  const sel = $('#session-select');
  clear(sel);
  const p = store.puzzle();
  const cur = store.session();
  for (const s of p.sessions) {
    const label = `${s.name} (${s.solves.length})`;
    sel.append(h('option', { value: s.id, selected: s === cur }, label));
  }
  sel.append(h('option', { value: '__new' }, '＋ New session…'));
}

async function onSessionChange(e) {
  const v = e.target.value;
  if (v === '__new') {
    const name = await promptDialog('New session name', `Session ${store.puzzle().sessions.length + 1}`);
    if (name) store.createSession(name); else renderSessions();
    return;
  }
  const s = store.puzzle().sessions.find((x) => x.id === v);
  if (app.practice && !s?.training) app.stopPractice();
  store.setSession(v);
}

function renderTabs() {
  const nav = $('#tabs');
  for (const [name, v] of Object.entries(VIEWS)) {
    nav.append(h('button.tab', { dataset: { view: name }, onclick: () => app.show(name), 'aria-label': v.label },
      h('span', { html: v.icon }), h('span', v.label)));
  }
}

// ---- screen wake lock (keeps the phone awake on the timer) ----
let wakeLock = null;
async function updateWakeLock() {
  const want = store.settings.wakeLock && app.view === 'timer' && document.visibilityState === 'visible';
  try {
    if (want && !wakeLock && 'wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!want && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch { wakeLock = null; }
}

function applyAccent() {
  document.documentElement.dataset.accent = store.settings.accent;
}

// ---- service worker (web/PWA only) ----
function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) location.reload();
  });
  const offerUpdate = (worker) => toast('A new version of CubeLab is ready', {
    ms: 15000, action: 'Update', onAction: () => { reloading = true; worker.postMessage('skipWaiting'); },
  });
  navigator.serviceWorker.register('sw.js').then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(nw);
      });
    });
  }).catch((e) => console.warn('SW registration failed', e));
}

function boot() {
  store.load();
  applyAccent();
  renderTabs();
  renderPuzzleSwitch();
  renderSessions();
  $('#session-select').addEventListener('change', onSessionChange);
  store.on('puzzle', renderPuzzleSwitch);
  store.on('session', renderSessions);
  store.on('solves', renderSessions);
  store.on('settings', ({ key }) => {
    if (!key || key === 'accent') applyAccent();
    if (key === 'wakeLock') updateWakeLock();
    if (key === 'ignoreSilent') unlockAudio();
  });
  document.addEventListener('visibilitychange', updateWakeLock);
  // iOS: audio must be unlocked from a user gesture
  const unlock = () => { unlockAudio(); window.removeEventListener('pointerdown', unlock, true); window.removeEventListener('keydown', unlock, true); };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  // block pinch-zoom gestures on iOS (the timer is touch driven)
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  let start = 'timer';
  try { start = sessionStorage.getItem('cubelab.view') || 'timer'; } catch { /* ignore */ }
  if (location.hash.slice(1) in VIEWS) start = location.hash.slice(1);
  app.show(start in VIEWS ? start : 'timer');
  warmUp();
  registerSW();
  if (!store.storageOk) toast('Storage is unavailable — times will not be saved in this browser mode.', { ms: 6000 });
}

boot();
window.cubelab = app;
