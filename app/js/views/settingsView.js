// Settings: timer behaviour, sounds, display, data backup.
import { store } from '../store.js';
import { h, clear, ICONS, toast, confirmDialog } from '../ui/dom.js';
import { chimeSingle, chimeAverage, unlockAudio } from '../sound.js';
import { confetti } from '../ui/confetti.js';
import { downloadText } from './timesView.js';
import { VERSION } from '../version.js';

let root;
const ACCENTS = { cyan: '#4cc9f0', purple: '#b28dff', green: '#34d77b', orange: '#ff9f43', pink: '#ff6fae' };

export function init(el) {
  root = el;
  render();
  store.on('settings', () => render());
}

const s = () => store.settings;
const set = (k, v) => store.setSetting(k, v);

function toggle(key) {
  return h('label.switch', h('input', { type: 'checkbox', checked: !!s()[key], onchange: (e) => set(key, e.target.checked) }), h('i'));
}
function seg(key, options) {
  return h('div.seg', options.map(([label, value]) => h('button', { class: s()[key] === value ? 'active' : '', onclick: () => set(key, value) }, label)));
}
function setting(title, desc, control) {
  return h('div.setting', h('div.txt', h('b', title), desc ? h('span', desc) : null), control);
}

function render() {
  const wrap = h('div.view-pad.settings');
  wrap.append(
    h('h2', 'Timer'),
    h('div.card',
      setting('WCA inspection', '15 seconds to inspect. +2 after 15 s, DNF after 17 s.', toggle('inspection')),
      setting('Inspection alerts', 'Warnings at 8 and 12 seconds.', seg('inspectionAlerts', [['Off', 'off'], ['Beep', 'beep'], ['Voice', 'voice']])),
      setting('Hold to start', `Hold for ${(s().holdDelay / 1000).toFixed(2)} s before the timer turns green.`,
        h('input', { type: 'range', min: 0, max: 1000, step: 50, value: s().holdDelay, 'aria-label': 'Hold delay', onchange: (e) => set('holdDelay', Number(e.target.value)) })),
      setting('While solving show', 'Hiding the time can help you focus.', seg('timerUpdate', [['Time', 'full'], ['Seconds', 'seconds'], ['Hidden', 'hidden']])),
      setting('Precision', null, seg('precision', [['0.01', 2], ['0.001', 3]])),
      setting('Keep screen awake', 'Stops your phone from sleeping on the timer.', toggle('wakeLock'))),

    h('h2', 'Sounds & celebrations'),
    h('div.card',
      setting('Personal best chimes', 'Plays when you beat your best single or Ao5/12/50/100.', toggle('sounds')),
      setting('Volume', null, h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s().volume, 'aria-label': 'Volume', onchange: (e) => set('volume', Number(e.target.value)) })),
      setting('Play in Silent mode (iPhone)', 'Lets chimes play with the ringer switch off. This may pause music from other apps.', toggle('ignoreSilent')),
      setting('Confetti', null, toggle('confetti')),
      setting('Try it', null, h('div.row',
        h('button.btn.btn-small', { onclick: () => { unlockAudio(); chimeSingle(); if (s().confetti) confetti(); } }, 'PB single'),
        h('button.btn.btn-small', { onclick: () => { unlockAudio(); chimeAverage(); } }, 'PB average')))),

    h('h2', 'Display'),
    h('div.card',
      setting('Scramble preview', 'Shown on the timer screen.', seg('preview', [['3D', '3d'], ['Flat', 'net'], ['Off', 'off']])),
      setting('Animation speed', null, seg('animSpeed', [['Slow', 0.6], ['Normal', 1], ['Fast', 1.8]])),
      setting('Accent color', null, h('div.swatches', Object.entries(ACCENTS).map(([name, color]) =>
        h('button.swatch', { class: s().accent === name ? 'active' : '', style: { background: color }, 'aria-label': name, onclick: () => set('accent', name) }))))),

    h('h2', 'Data'),
    h('div.card',
      setting('Back up', 'Download all sessions, times and settings as a file.', h('button.btn.btn-small', { onclick: backup }, h('span', { html: ICONS.download }), 'Export')),
      setting('Restore', 'Merge a CubeLab backup into this device.', h('label.btn.btn-small', h('span', { html: ICONS.upload }), 'Import',
        h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: restore }))),
      setting('Reset everything', 'Deletes all sessions and times on this device.', h('button.btn.btn-small.btn-danger', { onclick: resetAll }, 'Reset'))),
    h('p', { style: { color: 'var(--muted)', fontSize: '13px', marginTop: '10px' } },
      'Times are stored on this device only. Export a backup now and then — especially on iPhone, where clearing Safari data also clears the app.'),

    h('h2', 'Keyboard shortcuts'),
    h('div.card.card-pad', { style: { fontSize: '14px', color: 'var(--muted)', lineHeight: '2' } },
      h('div', h('span.kbd', 'Space'), ' hold & release to start, any key to stop'),
      h('div', h('span.kbd', '2'), ' toggle +2 · ', h('span.kbd', 'D'), ' toggle DNF · ', h('span.kbd', 'Delete'), ' delete last solve'),
      h('div', h('span.kbd', 'N'), ' new scramble · ', h('span.kbd', 'W'), ' watch scramble · ', h('span.kbd', 'Esc'), ' cancel inspection')),

    h('h2', 'About'),
    h('div.card.card-pad', { style: { fontSize: '14px', color: 'var(--muted)' } },
      h('div', h('b', { style: { color: 'var(--text)' } }, 'CubeLab Timer'), ` v${VERSION}`),
      h('div', '3x3 scrambles are random-state (two-phase solver), 4x4 and 5x5 are random-move (40 / 60 moves).'),
      h('div', '3D rendering by three.js (MIT).'),
      h('div', h('a', { href: 'https://github.com/Syncro-code/cubelab', target: '_blank', rel: 'noopener' }, 'github.com/Syncro-code/cubelab'))));
  clear(root).append(wrap);
}

function backup() {
  const date = new Date().toISOString().slice(0, 10);
  downloadText(`cubelab-backup-${date}.json`, store.exportJSON());
  toast('Backup downloaded');
}

function restore(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      store.importJSON(String(reader.result), { merge: true });
      toast('Backup imported');
    } catch (err) {
      console.error(err);
      toast('That file is not a CubeLab backup');
    }
  };
  reader.readAsText(file);
}

async function resetAll() {
  if (!(await confirmDialog('Delete ALL sessions and times on this device? Export a backup first if you want to keep them.', { ok: 'Delete everything', danger: true }))) return;
  store.resetAll();
  toast('All data reset');
}
