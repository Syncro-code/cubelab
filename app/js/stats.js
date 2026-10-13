// Solve statistics. A solve is {t: ms, p: 0 | 2000 | -1 (DNF), s: scramble, d: timestamp}.

export const AVG_SIZES = [5, 12, 50, 100];

export const effective = (s) => (s.p === -1 ? Infinity : s.t + (s.p > 0 ? s.p : 0));

// Number of results trimmed from each end: 1 for ao5/ao12, 5% (rounded up) beyond.
export const trimOf = (n) => Math.ceil(n / 20);

// Trimmed average of an array of effective times (Infinity = DNF).
export function average(times) {
  const n = times.length;
  if (!n) return null;
  const k = trimOf(n);
  const sorted = times.slice().sort((a, b) => a - b);
  if (sorted[n - k - 1] === Infinity) return Infinity;
  let sum = 0;
  for (let i = k; i < n - k; i++) sum += sorted[i];
  return sum / (n - 2 * k);
}

function insertSorted(arr, v) {
  let lo = 0, hi = arr.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid] < v) lo = mid + 1; else hi = mid; }
  arr.splice(lo, 0, v);
}
function removeSorted(arr, v) {
  let lo = 0, hi = arr.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid] < v) lo = mid + 1; else hi = mid; }
  arr.splice(lo, 1);
}

// Average of n ending at every index (undefined before index n-1).
export function rollingAverages(times, n) {
  const out = new Array(times.length);
  const k = trimOf(n);
  const win = [];
  for (let i = 0; i < times.length; i++) {
    insertSorted(win, times[i]);
    if (i >= n) removeSorted(win, times[i - n]);
    if (i >= n - 1) {
      if (win[n - k - 1] === Infinity) out[i] = Infinity;
      else {
        let sum = 0;
        for (let j = k; j < n - k; j++) sum += win[j];
        out[i] = sum / (n - 2 * k);
      }
    }
  }
  return out;
}

// Full stats for a list of solves (oldest first).
export function sessionStats(solves) {
  const times = solves.map(effective);
  const res = { count: solves.length, dnf: 0, mean: null, best: {}, current: {}, rolling: {} };
  let sum = 0, ok = 0, bestSingle = Infinity, bestIdx = -1, worst = -Infinity;
  times.forEach((t, i) => {
    if (t === Infinity) { res.dnf++; return; }
    sum += t; ok++;
    if (t < bestSingle) { bestSingle = t; bestIdx = i; }
    if (t > worst) worst = t;
  });
  res.mean = ok ? sum / ok : null;
  res.best.single = bestIdx >= 0 ? { value: bestSingle, index: bestIdx } : null;
  res.worst = ok ? worst : null;
  res.current.single = times.length ? times[times.length - 1] : null;
  for (const n of AVG_SIZES) {
    if (times.length < n) { res.current[n] = null; res.best[n] = null; continue; }
    const roll = rollingAverages(times, n);
    res.rolling[n] = roll;
    res.current[n] = roll[roll.length - 1];
    let b = Infinity, bi = -1;
    for (let i = n - 1; i < roll.length; i++) if (roll[i] < b) { b = roll[i]; bi = i; }
    res.best[n] = bi >= 0 ? { value: b, index: bi } : { value: Infinity, index: n - 1 };
  }
  return res;
}

// Value of the average of n ending at index end, plus which solves were trimmed.
export function averageDetail(solves, n, end) {
  const slice = solves.slice(end - n + 1, end + 1);
  const times = slice.map(effective);
  const k = trimOf(n);
  const order = times.map((t, i) => [t, i]).sort((a, b) => a[0] - b[0]);
  const trimmed = new Set([...order.slice(0, k), ...order.slice(n - k)].map((x) => x[1]));
  return { value: average(times), solves: slice, trimmed, start: end - n + 1 };
}
