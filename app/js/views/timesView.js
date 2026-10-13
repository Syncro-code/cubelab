// Times & statistics page: stat tiles, progress chart and the full solve list.
import { store, PUZZLES } from '../store.js';
import { h, clear, fmtTime, fmtSolve, fmtDate, ICONS, confirmDialog, promptDialog, toast } from '../ui/dom.js';
import { AVG_SIZES } from '../stats.js';
import { TimesChart } from '../ui/chart.js';
import { openSolveDetail, openAverageDetail } from './shared.js';

let root, chart, els = {}, visible = false, dirty = true, limit = 100;
const prec = () => store.settings.precision;

export function init(el) {
  root = el;
  els.head = h('div.page-head');
  els.tiles = h('div.stat-grid');
  els.chartWrap = h('div.chart-wrap');
  els.chart = h('div.card.chart-card',
    h('div.chart-legend', h('span', h('i', { style: { background: 'var(--accent)' } }), 'ao5'), h('span', h('i', { style: { background: 'var(--accent-2)' } }), 'ao12'), h('span', h('i', { style: { background: 'var(--muted)', height: '6px', width: '6px', borderRadius: '50%' } }), 'single')),
    els.chartWrap);
  els.list = h('div.card');
  root.append(h('div.view-pad', els.head, els.tiles, els.chart, els.list));
  chart = new TimesChart(els.chartWrap);
  const mark = () => { dirty = true; if (visible) render(); };
  store.on('solves', mark);
  store.on('session', () => { limit = 100; mark(); });
  store.on('puzzle', mark);
  store.on('settings', mark);
}

export function onShow() { visible = true; if (dirty) render(); }
export function onHide() { visible = false; }

function render() {
  dirty = false;
  const session = store.session();
  const st = store.stats(session);
  const pz = PUZZLES[store.puzzleId];

  clear(els.head).append(
    h('h1', `${pz.long} · ${session.name}`),
    h('div.spacer'),
    h('button.btn.btn-small', { onclick: newSession }, h('span', { html: ICONS.plus }), 'New session'),
    h('button.btn.btn-small', { onclick: rename }, h('span', { html: ICONS.edit }), 'Rename'),
    h('button.btn.btn-small', { onclick: exportCsv }, h('span', { html: ICONS.download }), 'CSV'),
    h('button.btn.btn-small.btn-danger', { onclick: removeSession }, h('span', { html: ICONS.trash }), 'Delete'));

  const all = session.training ? null : store.allTimeBests();
  const tile = (k, v, sub, onclick, highlight) => h('div.card.stat-tile', { class: highlight ? 'highlight' : '', onclick }, h('div.k', k), h('div.v', v), sub ? h('div.sub', sub) : null);
  clear(els.tiles).append(
    tile('Best single', st.best.single ? fmtTime(st.best.single.value, prec()) : '—',
      all && all.single !== Infinity ? `all-time ${fmtTime(all.single, prec())}` : `${st.count} solves`,
      st.best.single ? () => openSolveDetail(session, session.solves[st.best.single.index]) : null,
      all && st.best.single && st.best.single.value === all.single),
    ...AVG_SIZES.map((n) => {
      const b = st.best[n];
      const cur = st.current[n];
      return tile(`Best ao${n}`, b ? fmtTime(b.value, prec(), { round: true }) : '—',
        cur != null ? `current ${fmtTime(cur, prec(), { round: true })}` : `${Math.max(0, n - st.count)} more solves`,
        b ? () => openAverageDetail(session, n, b.index) : null,
        all && b && b.value === all[n] && b.value !== Infinity);
    }),
    tile('Mean', st.mean != null ? fmtTime(st.mean, prec(), { round: true }) : '—', `${st.count} solves${st.dnf ? ` · ${st.dnf} DNF` : ''}`));

  chart.setData(session.solves, st, prec());

  clear(els.list);
  const solves = session.solves;
  if (!solves.length) {
    els.list.append(h('div.empty', 'No solves in this session yet. Head to the timer and do a solve!'));
    return;
  }
  const r5 = st.rolling[5], r12 = st.rolling[12];
  const bestIdx = st.best.single?.index;
  const rows = [];
  const from = Math.max(0, solves.length - limit);
  for (let i = solves.length - 1; i >= from; i--) {
    const s = solves[i];
    rows.push(h('tr', { class: i === bestIdx ? 'best' : '', onclick: () => openSolveDetail(session, s) },
      h('td.dim', String(i + 1)),
      h('td.t', fmtSolve(s, prec())),
      h('td.dim', r5?.[i] != null ? fmtTime(r5[i], prec(), { round: true }) : ''),
      h('td.dim', r12?.[i] != null ? fmtTime(r12[i], prec(), { round: true }) : ''),
      h('td.dim.hide-sm', s.c ? `💬 ${s.c}` : ''),
      h('td.dim.hide-sm', fmtDate(s.d))));
  }
  els.list.append(h('table.solve-table',
    h('thead', h('tr', h('th', '#'), h('th', 'Time'), h('th', 'ao5'), h('th', 'ao12'), h('th.hide-sm', 'Note'), h('th.hide-sm', 'Date'))),
    h('tbody', rows)));
  if (from > 0) {
    els.list.append(h('div', { style: { padding: '12px', textAlign: 'center' } },
      h('button.btn', { onclick: () => { limit += 200; render(); } }, `Show more (${from} older)`)));
  }
}

async function newSession() {
  const name = await promptDialog('New session name', `Session ${store.puzzle().sessions.length + 1}`);
  if (name) store.createSession(name);
}

async function rename() {
  const s = store.session();
  const name = await promptDialog('Rename session', s.name);
  if (name) store.renameSession(s, name);
}

async function removeSession() {
  const s = store.session();
  if (!(await confirmDialog(`Delete session "${s.name}" and its ${s.solves.length} solves? This cannot be undone.`, { ok: 'Delete', danger: true }))) return;
  store.deleteSession(s);
  toast('Session deleted');
}

function exportCsv() {
  const s = store.session();
  const rows = [['#', 'time_ms', 'penalty', 'result', 'scramble', 'date', 'comment']];
  s.solves.forEach((x, i) => rows.push([i + 1, x.t, x.p === -1 ? 'DNF' : x.p ? '+2' : '', fmtSolve(x, 3), x.s || '', new Date(x.d).toISOString(), x.c || '']));
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  downloadText(`cubelab-${store.puzzleId}-${s.name.replace(/\W+/g, '_')}.csv`, csv, 'text/csv');
}

export function downloadText(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
