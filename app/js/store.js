// Persistent app data (localStorage) with a tiny change-event system.
import { sessionStats, AVG_SIZES } from './stats.js';

const KEY = 'cubelab.v1';

export const PUZZLES = {
  333: { id: '333', N: 3, name: '3x3', long: '3x3x3' },
  444: { id: '444', N: 4, name: '4x4', long: '4x4x4' },
  555: { id: '555', N: 5, name: '5x5', long: '5x5x5' },
};

export const DEFAULT_SETTINGS = {
  inspection: false,        // WCA 15 second inspection
  inspectionAlerts: 'beep', // 'off' | 'beep' | 'voice'
  holdDelay: 300,           // ms to hold before the timer is ready
  timerUpdate: 'full',      // 'full' | 'seconds' | 'hidden'
  precision: 2,             // 2 = centiseconds, 3 = milliseconds
  sounds: true,
  volume: 0.8,
  ignoreSilent: false,      // iPhone: play through the silent switch
  confetti: true,
  preview: '3d',            // '3d' | 'net' | 'off'
  animSpeed: 1,
  wakeLock: true,
  accent: 'cyan',
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function newSession(name, extra = {}) {
  return { id: uid(), name, created: Date.now(), solves: [], ...extra };
}

function freshData() {
  const puzzles = {};
  for (const id of Object.keys(PUZZLES)) {
    const s = newSession('Main');
    puzzles[id] = { current: s.id, sessions: [s] };
  }
  return { v: 1, settings: { ...DEFAULT_SETTINGS }, ui: { puzzle: '333' }, puzzles, learned: {} };
}

function sanitize(d) {
  const base = freshData();
  if (!d || typeof d !== 'object') return base;
  const out = { v: 1, settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) }, ui: { ...base.ui, ...(d.ui || {}) }, puzzles: {}, learned: d.learned || {} };
  for (const id of Object.keys(PUZZLES)) {
    const p = d.puzzles?.[id];
    if (p && Array.isArray(p.sessions) && p.sessions.length) {
      const sessions = p.sessions.map((s) => ({
        ...s,
        id: s.id || uid(),
        name: s.name || 'Session',
        solves: (s.solves || []).filter((x) => x && typeof x.t === 'number'),
      }));
      out.puzzles[id] = { current: sessions.some((s) => s.id === p.current) ? p.current : sessions[0].id, sessions };
    } else out.puzzles[id] = base.puzzles[id];
  }
  if (!PUZZLES[out.ui.puzzle]) out.ui.puzzle = '333';
  return out;
}

const listeners = new Map();
let data = freshData();
let storageOk = true;
const statsCache = new WeakMap(); // session -> {rev, stats}
const revs = new WeakMap();

function bump(session) { revs.set(session, (revs.get(session) || 0) + 1); }

export const store = {
  get data() { return data; },
  get settings() { return data.settings; },
  get storageOk() { return storageOk; },

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      data = sanitize(raw ? JSON.parse(raw) : null);
    } catch (e) {
      console.warn('Could not load data', e);
      storageOk = false;
      data = freshData();
    }
    try { navigator.storage?.persist?.(); } catch { /* optional */ }
  },

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); storageOk = true; } catch (e) {
      storageOk = false;
      console.warn('Could not save data', e);
    }
  },

  on(evt, fn) {
    if (!listeners.has(evt)) listeners.set(evt, new Set());
    listeners.get(evt).add(fn);
    return () => listeners.get(evt).delete(fn);
  },
  emit(evt, payload) { listeners.get(evt)?.forEach((fn) => fn(payload)); },

  // ---- settings / ui ----
  setSetting(key, value) {
    data.settings[key] = value;
    this.save();
    this.emit('settings', { key, value });
  },
  get puzzleId() { return data.ui.puzzle; },
  setPuzzle(id) {
    if (!PUZZLES[id] || id === data.ui.puzzle) return;
    data.ui.puzzle = id;
    this.save();
    this.emit('puzzle', id);
    this.emit('session');
  },

  // ---- sessions ----
  puzzle(id = data.ui.puzzle) { return data.puzzles[id]; },
  session(id = data.ui.puzzle) {
    const p = data.puzzles[id];
    return p.sessions.find((s) => s.id === p.current) || p.sessions[0];
  },
  setSession(sessionId, puzzleId = data.ui.puzzle) {
    data.puzzles[puzzleId].current = sessionId;
    this.save();
    this.emit('session');
  },
  createSession(name, extra = {}, puzzleId = data.ui.puzzle) {
    const s = newSession(name, extra);
    data.puzzles[puzzleId].sessions.push(s);
    data.puzzles[puzzleId].current = s.id;
    this.save();
    this.emit('session');
    return s;
  },
  findOrCreateTrainingSession(name) {
    const p = data.puzzles['333'];
    let s = p.sessions.find((x) => x.training && x.name === name);
    if (!s) { s = newSession(name, { training: true }); p.sessions.push(s); }
    return s;
  },
  renameSession(session, name) { session.name = name; this.save(); this.emit('session'); },
  deleteSession(session, puzzleId = data.ui.puzzle) {
    const p = data.puzzles[puzzleId];
    p.sessions = p.sessions.filter((s) => s !== session);
    if (!p.sessions.length) p.sessions.push(newSession('Main'));
    if (!p.sessions.some((s) => s.id === p.current)) p.current = p.sessions[0].id;
    this.save();
    this.emit('session');
  },

  // ---- solves ----
  addSolve(solve, session = this.session()) {
    session.solves.push(solve);
    bump(session);
    this.save();
    this.emit('solves', { session, added: solve });
  },
  updateSolve(session, solve, patch) {
    Object.assign(solve, patch);
    bump(session);
    this.save();
    this.emit('solves', { session });
  },
  deleteSolve(session, solve) {
    const i = session.solves.indexOf(solve);
    if (i >= 0) session.solves.splice(i, 1);
    bump(session);
    this.save();
    this.emit('solves', { session });
  },
  clearSession(session) {
    session.solves = [];
    bump(session);
    this.save();
    this.emit('solves', { session });
  },

  stats(session = this.session()) {
    const rev = revs.get(session) || 0;
    const c = statsCache.get(session);
    if (c && c.rev === rev && c.len === session.solves.length) return c.stats;
    const stats = sessionStats(session.solves);
    statsCache.set(session, { rev, len: session.solves.length, stats });
    return stats;
  },

  // Best single/averages across all regular (non-practice) sessions of a puzzle.
  allTimeBests(puzzleId = data.ui.puzzle) {
    const best = { single: Infinity };
    for (const n of AVG_SIZES) best[n] = Infinity;
    for (const s of data.puzzles[puzzleId].sessions) {
      if (s.training) continue;
      const st = this.stats(s);
      if (st.best.single && st.best.single.value < best.single) best.single = st.best.single.value;
      for (const n of AVG_SIZES) if (st.best[n] && st.best[n].value < best[n]) best[n] = st.best[n].value;
    }
    return best;
  },

  // ---- learned algorithms ----
  isLearned(key) { return !!data.learned[key]; },
  setLearned(key, v) {
    if (v) data.learned[key] = true; else delete data.learned[key];
    this.save();
    this.emit('learned', key);
  },

  // ---- backup ----
  exportJSON() { return JSON.stringify({ app: 'CubeLab', exported: new Date().toISOString(), ...data }, null, 1); },
  importJSON(text, { merge = true } = {}) {
    const incoming = sanitize(JSON.parse(text));
    if (!merge) data = incoming;
    else {
      for (const id of Object.keys(PUZZLES)) {
        const mine = data.puzzles[id];
        for (const s of incoming.puzzles[id].sessions) {
          if (!s.solves.length) continue;
          const existing = mine.sessions.find((x) => x.id === s.id);
          if (existing) {
            const seen = new Set(existing.solves.map((x) => `${x.d}:${x.t}`));
            for (const sv of s.solves) if (!seen.has(`${sv.d}:${sv.t}`)) existing.solves.push(sv);
            existing.solves.sort((a, b) => a.d - b.d);
            bump(existing);
          } else mine.sessions.push(s);
        }
      }
      Object.assign(data.learned, incoming.learned);
    }
    this.save();
    this.emit('puzzle', data.ui.puzzle);
    this.emit('session');
    this.emit('settings', {});
  },
  resetAll() {
    data = freshData();
    this.save();
    this.emit('puzzle', data.ui.puzzle);
    this.emit('session');
    this.emit('settings', {});
  },
};
