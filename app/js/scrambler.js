// Main-thread scramble service. 3x3 random-state scrambles come from a worker
// (falls back to the main thread if workers are unavailable).
import { randomMoveScramble, SCRAMBLE_LENGTH } from './cube/scramble.js';
import { invertAlg } from './cube/model.js';
import { PUZZLES } from './store.js';

let worker = null;
let nextId = 1;
const pending = new Map();
const queue333 = [];
let filling = false;

function startWorker() {
  if (worker !== null) return worker;
  try {
    worker = new Worker(new URL('./cube/scramble-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.error) p.reject(new Error(e.data.error)); else p.resolve(e.data.scramble);
    };
    worker.onerror = (e) => {
      console.warn('Scramble worker failed, using main thread', e);
      worker = false;
      for (const [, p] of pending) p.reject(new Error('worker failed'));
      pending.clear();
    };
  } catch (e) {
    console.warn('No module worker support', e);
    worker = false;
  }
  return worker;
}

let mainSolver = null;
async function mainThread(msg) {
  if (!mainSolver) {
    const [solver, model] = await Promise.all([import('./cube/solver333.js'), import('./cube/model.js')]);
    mainSolver = { ...solver, CubeState: model.CubeState, withCentersHome: model.withCentersHome };
  }
  if (msg.type === 'case') return mainSolver.scrambleForCubie(mainSolver.toCubie(mainSolver.withCentersHome(new mainSolver.CubeState(3).apply(msg.setup)).stickers));
  return mainSolver.randomStateScramble();
}

function request(msg) {
  const w = startWorker();
  if (!w) return mainThread(msg);
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    w.postMessage({ id, ...msg });
  }).catch(() => mainThread(msg));
}

async function fill333() {
  if (filling) return;
  filling = true;
  try {
    while (queue333.length < 3) queue333.push(await request({ type: '333' }));
  } catch (e) {
    console.warn(e);
  } finally {
    filling = false;
  }
}

export function warmUp() { fill333(); }

export async function nextScramble(puzzleId) {
  const N = PUZZLES[puzzleId].N;
  if (N !== 3) return randomMoveScramble(N, SCRAMBLE_LENGTH[N]);
  if (queue333.length) {
    const s = queue333.shift();
    fill333();
    return s;
  }
  try {
    const s = await request({ type: '333' });
    fill333();
    return s;
  } catch {
    return randomMoveScramble(3, SCRAMBLE_LENGTH[3]);
  }
}

// Practice scrambles: a random-state scramble that produces the given case
// (held yellow on top, green in front).
const AUFS = ['', 'U', 'U2', "U'"];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function caseSetup(kind, entry, pool = {}) {
  const inv = entry.setup || invertAlg(entry.alg);
  const pllNoise = () => (pool.PLL ? `${pick(AUFS)} ${invertAlg(pick(pool.PLL).alg)}` : '');
  const ollNoise = () => (pool.OLL ? `${pick(AUFS)} ${invertAlg(pick(pool.OLL).alg)}` : '');
  if (kind === 'PLL' || kind === 'PLL_EDGES' || kind === 'PLL_CORNERS') return `${pick(AUFS)} ${inv} ${pick(AUFS)}`;
  if (kind === 'OLL' || kind === 'OLL_CORNERS' || kind === 'OLL_EDGES') return `${pllNoise()} ${pick(AUFS)} ${inv} ${pick(AUFS)}`;
  // F2L: random last layer, then the case
  return `${pllNoise()} ${ollNoise()} ${pick(AUFS)} ${inv}`;
}

export function caseScramble(setup) {
  return request({ type: 'case', setup });
}
