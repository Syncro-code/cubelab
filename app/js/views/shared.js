// UI shared by the timer and times views.
import { store, PUZZLES } from '../store.js';
import { h, fmtTime, fmtSolve, fmtDate, modal, confirmDialog, toast, ICONS } from '../ui/dom.js';
import { AVG_SIZES, averageDetail, effective } from '../stats.js';
import { CubeState } from '../cube/model.js';
import { drawNet } from '../ui/diagrams.js';

const p = () => store.settings.precision;
const fmtAvg = (v) => (v == null ? '—' : fmtTime(v, p(), { round: true }));

export function statsTable(stats, session) {
  const row = (label, cur, best, n) => h('tr',
    h('td', label),
    h('td', { class: n && cur != null ? 'click' : '', onclick: n && cur != null ? () => openAverageDetail(session, n, session.solves.length - 1) : null }, cur),
    h('td', { class: best != null ? 'click' : '', onclick: best != null ? () => (n ? openAverageDetail(session, n, stats.best[n].index) : openSolveDetail(session, session.solves[stats.best.single.index])) : null }, best ?? '—'));
  const lastSolve = session.solves[session.solves.length - 1];
  return h('div',
    h('table.stats-table',
      h('thead', h('tr', h('th', ''), h('th', 'Current'), h('th', 'Best'))),
      h('tbody',
        row('single', lastSolve ? fmtSolve(lastSolve, p()) : '—', stats.best.single ? fmtTime(stats.best.single.value, p()) : null, 0),
        AVG_SIZES.map((n) => row(`ao${n}`, fmtAvg(stats.current[n]), stats.best[n] ? fmtAvg(stats.best[n].value) : null, n)))),
    h('div.stats-foot',
      h('span', `${stats.count} solve${stats.count === 1 ? '' : 's'}${stats.dnf ? ` · ${stats.dnf} DNF` : ''}`),
      h('span', `mean ${fmtAvg(stats.mean)}`)));
}

export function openSolveDetail(session, solve) {
  if (!solve) return;
  const idx = session.solves.indexOf(solve);
  const puzzle = PUZZLES[Object.keys(store.data.puzzles).find((id) => store.data.puzzles[id].sessions.includes(session)) || store.puzzleId];
  const big = h('div.big');
  const seg = h('div.seg');
  const render = () => {
    big.textContent = fmtSolve(solve, p());
    seg.replaceChildren(...[['OK', 0], ['+2', 2000], ['DNF', -1]].map(([label, val]) =>
      h('button', { class: (solve.p || 0) === val ? 'active' : '', onclick: () => { store.updateSolve(session, solve, { p: val }); render(); } }, label)));
  };
  render();
  const net = h('canvas');
  const comment = h('input.input', { type: 'text', placeholder: 'Add a comment…', value: solve.c || '', onchange: (e) => store.updateSolve(session, solve, { c: e.target.value.trim() || undefined }) });
  const m = modal(h('div.solve-detail',
    big,
    h('div.meta', `#${idx + 1} · ${puzzle.long} · ${fmtDate(solve.d)}${solve.p > 0 ? ' · +2' : ''}`),
    h('div.row', seg, h('div.spacer'),
      h('button.btn.btn-small', { onclick: () => { navigator.clipboard?.writeText(`${fmtSolve(solve, p())}   ${solve.s}`); toast('Copied'); } }, h('span', { html: ICONS.copy }), 'Copy'),
      h('button.btn.btn-small.btn-danger', {
        onclick: async () => {
          if (await confirmDialog('Delete this solve?', { ok: 'Delete', danger: true })) { store.deleteSolve(session, solve); m.close(); }
        },
      }, h('span', { html: ICONS.trash }), 'Delete')),
    solve.s ? h('div.scr', solve.s) : null,
    solve.s ? h('div', { style: { display: 'grid', placeItems: 'center', margin: '6px 0 12px' } }, net) : null,
    comment), { title: 'Solve' });
  if (solve.s) {
    try {
      const scheme = session.training ? 'yellow' : 'wca';
      drawNet(net, new CubeState(puzzle.N).apply(solve.s), { width: Math.min(300, window.innerWidth - 80), scheme });
    } catch { net.remove(); }
  }
}

export function openAverageDetail(session, n, end) {
  if (end < n - 1) return;
  const d = averageDetail(session.solves, n, end);
  const prec = p();
  const lines = d.solves.map((s, i) => {
    const t = fmtSolve(s, prec);
    return h('div', { class: d.trimmed.has(i) ? 'trim' : '' },
      h('span', { style: { color: 'var(--faint)', display: 'inline-block', width: '3.2em' } }, `${d.start + i + 1}.`),
      d.trimmed.has(i) ? `(${t})` : t,
      s.s ? h('span', { style: { color: 'var(--faint)', fontSize: '12px', marginLeft: '10px' } }, s.s.length > 60 ? s.s.slice(0, 60) + '…' : s.s) : null);
  });
  const text = `ao${n}: ${fmtTime(d.value, prec, { round: true })}\n` +
    d.solves.map((s, i) => `${i + 1}. ${d.trimmed.has(i) ? `(${fmtSolve(s, prec)})` : fmtSolve(s, prec)}   ${s.s || ''}`).join('\n');
  modal(h('div',
    h('div.solve-detail', h('div.big', fmtTime(d.value, prec, { round: true })),
      h('div.meta', `Average of ${n} · solves ${d.start + 1}–${end + 1} · times in (brackets) are trimmed`)),
    h('div.avg-list', lines),
    h('div.row.end', h('button.btn', { onclick: () => { navigator.clipboard?.writeText(text); toast('Copied'); } }, h('span', { html: ICONS.copy }), 'Copy'))),
  { title: `Average of ${n}`, wide: true });
}

export { effective };
