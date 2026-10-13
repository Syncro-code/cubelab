// Learn page: guides for notation, 3x3, 4x4, 5x5 and tips, with case diagrams,
// 3D playback, practice mode and "learned" tracking.
import { store } from '../store.js';
import { h, clear, richText, ICONS } from '../ui/dom.js';
import { GUIDES, NOTATION_DEMO, NOTATION_BIG } from '../data/guides.js';
import * as ALGS from '../data/algs.js';
import { CubeState, invertAlg, withCentersHome } from '../cube/model.js';
import { drawTopView, drawIso, f2lMask, firstTwoLayersMask } from '../ui/diagrams.js';
import { openPlayer } from '../ui/player.js';

const SOURCES = { ...ALGS, NOTATION_DEMO, NOTATION_BIG };
const SET_LABEL = {
  PLL: 'PLL', OLL: 'OLL', F2L: 'F2L', OLL_EDGES: '2-look OLL (edges)', OLL_CORNERS: '2-look OLL (corners)',
  PLL_CORNERS: '2-look PLL (corners)', PLL_EDGES: '2-look PLL (edges)',
};
const UI_KEY = 'cubelab.learn';

let app, root, els = {};
let ui = { guide: '333', section: {} };

export function init(el, appRef) {
  app = appRef;
  root = el;
  try { ui = { ...ui, ...JSON.parse(localStorage.getItem(UI_KEY) || '{}') }; } catch { /* ignore */ }
  els.guides = h('div.seg.learn-tabs');
  els.sections = h('div.chips');
  els.content = h('div.guide');
  root.append(h('div.view-pad', els.guides, els.sections, els.content));
  render();
}

function saveUi() { try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch { /* ignore */ } }

function currentGuide() { return GUIDES.find((g) => g.id === ui.guide) || GUIDES[1]; }

function render() {
  const guide = currentGuide();
  clear(els.guides).append(...GUIDES.map((g) => h('button', {
    class: g.id === guide.id ? 'active' : '',
    onclick: () => { ui.guide = g.id; saveUi(); render(); root.scrollTop = 0; },
  }, g.title)));
  const secId = ui.section[guide.id] || guide.sections[0].id;
  const section = guide.sections.find((s) => s.id === secId) || guide.sections[0];
  clear(els.sections).append(...guide.sections.map((s) => h('button.chip', {
    class: s.id === section.id ? 'active' : '',
    onclick: () => { ui.section[guide.id] = s.id; saveUi(); render(); root.scrollTop = 0; },
  }, s.title)));
  clear(els.content).append(h('h2', section.title), ...section.blocks.map((b) => renderBlock(b, section)).filter(Boolean));
}

function renderBlock(b, section) {
  switch (b.type) {
    case 'p': return h('p', { html: richText(b.text) });
    case 'h': return h('h4', b.text);
    case 'tip': return h('div.callout.tip', h('span.ico', '💡'), h('div', { html: richText(b.text) }));
    case 'warn': return h('div.callout.warn', h('span.ico', '⚠️'), h('div', { html: richText(b.text) }));
    case 'list': return h('ul', b.items.map((t) => h('li', { html: richText(t) })));
    case 'steps': return h('div.steps', b.items.map(([title, text]) => h('div.step', h('div', h('b', title), h('span', { html: richText(text) })))));
    case 'algs': return renderAlgs(b, section);
    default: return null;
  }
}

function renderAlgs(b, section) {
  const all = SOURCES[b.source] || [];
  const entries = b.ids ? b.ids.map((id) => all.find((e) => e.id === id)).filter(Boolean) : all;
  const practice = b.practice !== false;
  const wrap = h('div');
  const keyOf = (e) => `${b.source}:${e.id}`;
  let progress = null;
  const updateProgress = () => {
    if (!progress) return;
    const n = entries.filter((e) => store.isLearned(keyOf(e))).length;
    progress.querySelector('i').style.width = `${(100 * n) / entries.length}%`;
    progress.querySelector('.count').textContent = `${n} / ${entries.length} learned`;
  };
  if (practice && entries.length > 1) {
    progress = h('div.progress', h('div.bar', h('i')), h('span.count'),
      h('button.btn.btn-small', { onclick: () => startPractice(b, entries, SET_LABEL[b.source] || section.title) }, h('span', { html: ICONS.target }), 'Practice all'),
      h('button.btn.btn-small', {
        onclick: () => {
          const learned = entries.filter((e) => store.isLearned(keyOf(e)));
          if (learned.length) startPractice(b, learned, `${SET_LABEL[b.source] || section.title} (learned)`);
          else alertNone();
        },
      }, 'Practice learned'));
    wrap.append(progress);
    updateProgress();
  }
  const card = (e) => algCard(e, b, keyOf(e), updateProgress, practice);
  if (b.grouped) {
    const groups = new Map();
    for (const e of entries) { if (!groups.has(e.group)) groups.set(e.group, []); groups.get(e.group).push(e); }
    for (const [g, list] of groups) wrap.append(h('div.group-title', `${g} · ${list.length}`), h('div.alg-grid', list.map(card)));
  } else {
    wrap.append(h('div.alg-grid', entries.map(card)));
  }
  return wrap;
}

function alertNone() {
  import('../ui/dom.js').then(({ toast }) => toast('Mark some cases as learned with ✓ first'));
}

function startPractice(b, entries, label) {
  app.startPractice({ kind: b.source, label, entries, pool: { PLL: ALGS.PLL, OLL: ALGS.OLL } });
}

function resolveView(b, e) {
  const v = b.view === 'auto' || !b.view ? e.view : b.view;
  return v || 'none';
}

function algCard(e, b, key, onLearned, practice) {
  const N = e.puzzle || b.puzzle || 3;
  const view = resolveView(b, e);
  const scheme = b.source.startsWith('NOTATION') ? 'wca' : 'yellow';
  const fromSolved = b.source.startsWith('NOTATION');
  const startState = () => (fromSolved ? new CubeState(N) : e.setup ? new CubeState(N).apply(e.setup) : null);
  const watch = () => openPlayer({ title: e.name, N, alg: e.alg, alts: e.alts || [], scheme, start: startState(), subtitle: e.note || '' });
  let diagram = null;
  if (view !== 'none') {
    diagram = h('canvas.diagram', { onclick: watch, title: 'Watch in 3D' });
    const st = withCentersHome(CubeState.tracking(N).apply(e.setup || invertAlg(e.alg)), true);
    const size = 96;
    if (view === 'oll') drawTopView(diagram, st, { size, mode: 'oll' });
    else if (view === 'pll') drawTopView(diagram, st, { size, mode: 'pll' });
    else if (view === 'pll-edges') drawTopView(diagram, st, { size, mode: 'pll', maskCorners: true });
    else if (view === 'f2l') drawIso(diagram, st, { size, mask: f2lMask(3) });
    else if (view === 'f2l-full') drawIso(diagram, st, { size, mask: firstTwoLayersMask(3) });
  }
  const learned = store.isLearned(key);
  const el = h('div.card.alg-card', { class: `${learned ? 'learned' : ''} ${diagram ? '' : 'no-diagram'}` });
  const canPractice = practice && N === 3 && view !== 'none' && !b.source.startsWith('NOTATION') && b.source !== 'BEGINNER';
  el.append(...[
    diagram,
    h('div',
      h('div.name', e.name),
      e.group && !b.grouped ? h('div.group', e.group) : null,
      h('div.alg', e.alg),
      (e.alts || []).map((a) => h('div.alt', `alt: ${a}`)),
      e.note ? h('div.note', { html: richText(e.note) }) : null,
      h('div.actions',
        h('button.btn.btn-small', { onclick: watch }, h('span', { html: ICONS.play }), 'Watch'),
        canPractice ? h('button.btn.btn-small', { onclick: () => app.startPractice({ kind: b.source, label: e.name, entries: [e], pool: { PLL: ALGS.PLL, OLL: ALGS.OLL } }) }, h('span', { html: ICONS.target }), 'Practice') : null)),
    practice ? h('button.learn-toggle', {
      title: 'Mark as learned', 'aria-label': `Mark ${e.name} as learned`, html: ICONS.check,
      onclick: () => {
        const v = !store.isLearned(key);
        store.setLearned(key, v);
        el.classList.toggle('learned', v);
        onLearned();
      },
    }) : null].filter(Boolean));
  return el;
}
