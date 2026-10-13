// Web worker: builds the two-phase tables off the main thread and returns
// random-state 3x3 scrambles (or scrambles for a specific practice case).
import { initSolver, randomStateScramble, scrambleForCubie, toCubie } from './solver333.js';
import { CubeState, withCentersHome } from './model.js';

let ready = false;

self.onmessage = (e) => {
  const { id, type, setup } = e.data;
  try {
    if (!ready) { initSolver(); ready = true; }
    let scramble;
    if (type === 'case') scramble = scrambleForCubie(toCubie(withCentersHome(new CubeState(3).apply(setup)).stickers));
    else scramble = randomStateScramble();
    self.postMessage({ id, scramble });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
