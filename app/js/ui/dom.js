// Tiny DOM helpers.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// h('div.card#id', {onclick, title}, child, 'text', [children])
export function h(spec, attrs, ...children) {
  const m = /^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i.exec(spec);
  const el = document.createElement((m && m[1]) || 'div');
  if (m && m[2]) {
    for (const part of m[2].match(/[.#][\w-]+/g)) {
      if (part[0] === '.') el.classList.add(part.slice(1));
      else el.id = part.slice(1);
    }
  }
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    children.unshift(attrs);
    attrs = null;
  }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className += ' ' + v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// **bold**, `alg`, _italic_ in guide text.
export function richText(s) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="alg-inline">$1</code>')
    .replace(/(^|\s)_(.+?)_(?=\s|$|[.,!?])/g, '$1<em>$2</em>');
}

// Format milliseconds as a timer string. Singles are truncated (WCA style).
export function fmtTime(ms, precision = 2, { round = false } = {}) {
  if (ms == null || Number.isNaN(ms)) return '—';
  if (ms === Infinity) return 'DNF';
  const unit = precision === 3 ? 1 : 10;
  let v = round ? Math.round(ms / unit) : Math.floor(ms / unit);
  const fracDigits = precision === 3 ? 3 : 2;
  const perSec = 10 ** fracDigits;
  const frac = v % perSec; v = Math.floor(v / perSec);
  const s = v % 60; v = Math.floor(v / 60);
  const m = v % 60; const hrs = Math.floor(v / 60);
  const f = String(frac).padStart(fracDigits, '0');
  if (hrs) return `${hrs}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${f}`;
  if (m) return `${m}:${String(s).padStart(2, '0')}.${f}`;
  return `${s}.${f}`;
}

export function fmtSolve(solve, precision = 2) {
  if (solve.p === -1) return 'DNF';
  const t = fmtTime(solve.t + (solve.p > 0 ? solve.p : 0), precision);
  return solve.p > 0 ? `${t}+` : t;
}

export function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function toast(msg, { ms = 2600, action, onAction } = {}) {
  const root = document.getElementById('toasts');
  const el = h('div.toast', h('span', msg), action && h('button.btn.btn-small', { onclick: () => { onAction?.(); el.remove(); } }, action));
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, ms);
}

let openModals = 0;
export const modalOpen = () => openModals > 0;

export function modal(content, { title, wide = false, onClose } = {}) {
  const root = document.getElementById('modal-root');
  const close = () => {
    if (!wrap.isConnected) return;
    wrap.classList.remove('show');
    openModals--;
    document.removeEventListener('keydown', onKey, true);
    setTimeout(() => wrap.remove(), 200);
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  const box = h('div.modal' + (wide ? '.modal-wide' : ''), { role: 'dialog', 'aria-modal': 'true' },
    h('div.modal-head',
      h('h2', title || ''),
      h('button.icon-btn', { 'aria-label': 'Close', onclick: close, html: ICONS.close })),
    h('div.modal-body', content));
  const wrap = h('div.modal-wrap', { onpointerdown: (e) => { if (e.target === wrap) close(); } }, box);
  root.appendChild(wrap);
  openModals++;
  document.addEventListener('keydown', onKey, true);
  requestAnimationFrame(() => wrap.classList.add('show'));
  return { close, box };
}

export function confirmDialog(message, { ok = 'OK', danger = false } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); m.close(); } };
    const m = modal(h('div',
      h('p', message),
      h('div.row.end',
        h('button.btn', { onclick: () => finish(false) }, 'Cancel'),
        h('button.btn' + (danger ? '.btn-danger' : '.btn-primary'), { onclick: () => finish(true) }, ok))),
    { title: 'Are you sure?', onClose: () => finish(false) });
  });
}

export function promptDialog(message, value = '') {
  return new Promise((resolve) => {
    let done = false;
    const input = h('input.input', { type: 'text', value });
    const finish = (v) => { if (!done) { done = true; resolve(v); m.close(); } };
    const m = modal(h('form', { onsubmit: (e) => { e.preventDefault(); finish(input.value.trim() || null); } },
      h('label.label', message), input,
      h('div.row.end', h('button.btn', { type: 'button', onclick: () => finish(null) }, 'Cancel'), h('button.btn.btn-primary', { type: 'submit' }, 'Save'))),
    { title: message, onClose: () => finish(null) });
    setTimeout(() => { input.focus(); input.select(); }, 50);
  });
}

// Inline SVG icons (stroke-based, inherit currentColor).
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const ICONS = {
  timer: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6M12 2v3"/>'),
  list: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  book: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/>'),
  cube: svg('<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M21 7l-9 5-9-5"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  close: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  refresh: svg('<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>'),
  copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  play: svg('<path d="M6 4l14 8-14 8z" fill="currentColor"/>'),
  pause: svg('<path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor"/>'),
  stepF: svg('<path d="M5 4l10 8-10 8zM19 5v14"/>'),
  stepB: svg('<path d="M19 20 9 12l10-8zM5 19V5"/>'),
  restart: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  trash: svg('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  edit: svg('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>'),
  eye: svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
  target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  shuffle: svg('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
  download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
  upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'),
  trophy: svg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
  chevron: svg('<path d="m9 18 6-6-6-6"/>'),
  home: svg('<path d="M3 12 12 3l9 9M5 10v10h14V10"/>'),
  grid: svg('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>'),
};
