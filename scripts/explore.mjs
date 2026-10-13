// Print an ASCII net of the cube after an algorithm (for checking algs by eye).
// Usage: node scripts/explore.mjs 4 "Rw U2 x Rw U2 ..."
import { CubeState, invertAlg } from '../app/js/cube/model.js';

const N = parseInt(process.argv[2], 10);
const alg = process.argv[3];
const useInverse = process.argv[4] === 'inv';
const s = new CubeState(N).apply(useInverse ? invertAlg(alg) : alg);
const C = 'WRGYOB';
const face = (f) => {
  const a = s.face(f); const rows = [];
  for (let r = 0; r < N; r++) rows.push(a.slice(r * N, r * N + N).map((c) => (c === f ? '.' : C[c])).join(''));
  return rows;
};
const pad = ' '.repeat(N + 1);
const [U, R, F, D, L, B] = [0, 1, 2, 3, 4, 5].map(face);
for (let r = 0; r < N; r++) console.log(pad + U[r]);
for (let r = 0; r < N; r++) console.log(`${L[r]} ${F[r]} ${R[r]} ${B[r]}`);
for (let r = 0; r < N; r++) console.log(pad + D[r]);
console.log('solved:', s.isSolved());
