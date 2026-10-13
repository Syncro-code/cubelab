// Random-move scrambles for big cubes (and a 3x3 fallback).

const AXES = [['U', 'D'], ['R', 'L'], ['F', 'B']];
const SUFFIX = ['', "'", '2'];

// WCA-style random-move scramble. Wide moves: 4x4 uses Uw Rw Fw, 5x5 all six.
export function randomMoveScramble(N, length, rnd = Math.random) {
  const moves = [];
  for (let a = 0; a < 3; a++) {
    for (let s = 0; s < 2; s++) {
      const f = AXES[a][s];
      moves.push({ axis: a, key: f, name: f });
      if (N === 4 && s === 0) moves.push({ axis: a, key: f + 'w', name: f + 'w' });
      if (N >= 5) moves.push({ axis: a, key: f + 'w', name: f + 'w' });
    }
  }
  const out = [];
  let lastAxis = -1;
  let used = new Set();
  while (out.length < length) {
    const m = moves[Math.floor(rnd() * moves.length)];
    if (m.axis === lastAxis) {
      if (used.has(m.key)) continue;
    } else {
      lastAxis = m.axis;
      used = new Set();
    }
    used.add(m.key);
    out.push(m.name + SUFFIX[Math.floor(rnd() * 3)]);
  }
  return out.join(' ');
}

export const SCRAMBLE_LENGTH = { 3: 25, 4: 40, 5: 60 };
