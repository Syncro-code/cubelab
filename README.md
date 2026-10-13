# CubeLab Timer

A dark-themed speedcubing timer for **3x3x3, 4x4x4 and 5x5x5** that runs on **iPhone** (as an installable web app) and **Windows** (as a desktop app) from one codebase.

![CubeLab icon](app/icons/icon-192.png)

## Features

- **Timer** — hold Space (or touch and hold on a phone) until it turns green, release to start, any key/tap to stop. Optional **WCA 15 s inspection** with 8 s / 12 s alerts and automatic +2 / DNF.
- **Scrambles** — random-state 3x3 scrambles (Kociemba two-phase solver, the same idea as official WCA scrambles), WCA-style random-move scrambles for 4x4 (40 moves) and 5x5 (60 moves).
- **3D cube** — the scrambled state is shown on a 3D cube you can spin; watch the scramble animate move by move. A full **virtual cube** lets you drag stickers to turn layers and race the clock.
- **Statistics** — current and best **single, Ao5, Ao12, Ao50 and Ao100**, session mean, progress chart, per-solve details, +2/DNF, comments, multiple sessions per puzzle, CSV export.
- **PB celebrations** — a chime (and confetti) when you beat your best single, and a different chime for a new best average.
- **Learn** — notation, beginner method, CFOP overview, F2L cases, 2-look OLL/PLL, **all 57 OLL and 21 PLL** cases, 4x4 reduction with **OLL & PLL parity**, 5x5 reduction with last-two-edges parity. Every case has a generated diagram, a 3D "Watch" player and a **Practice** mode that gives you real scrambles producing exactly that case.
- **Works offline**, keeps the screen awake while timing, and stores everything on the device (with JSON backup/restore).

## Use it

### iPhone

1. Open the web app link (`https://<your-username>.github.io/<repo-name>/`) in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Launch CubeLab from the home screen: it opens full-screen and works offline.

> Times live on the phone. Use **Settings → Back up** now and then. To hear PB chimes with the ringer switch on silent, turn on **Settings → Play in Silent mode**.

### Windows

Download `CubeLab-Timer-Setup-x.y.z.exe` (installer) or `CubeLab-Timer-x.y.z-portable.exe` (no install) from the **Releases** page. The app is not code-signed, so Windows SmartScreen may show "Windows protected your PC" — click **More info → Run anyway**.

## Development

Requires [Node.js](https://nodejs.org) 22.12 or newer.

```bash
npm install          # three.js, Electron, electron-builder
npm run serve        # web app at http://localhost:5173
npm start            # Windows desktop app (downloads Electron on first run)
npm test             # cube engine, solver and algorithm checks
npm run dist         # build the Windows installer + portable exe into dist/
```

The web app in `app/` has no build step: plain ES modules, so GitHub Pages serves it as-is and Electron loads the same files.

```
app/                 the web app (deployed to GitHub Pages, packaged by Electron)
  js/cube/           NxN cube model, notation parser, two-phase solver, scramblers
  js/data/           algorithm database + tutorial text
  js/ui/             3D cube (three.js), 2D case diagrams, chart, player, dialogs
  js/views/          timer, times, learn, virtual cube and settings screens
  sw.js              offline cache (service worker)
electron/main.cjs    Windows desktop shell
scripts/             tests, algorithm verification, icon generator, dev server
.github/workflows/   Pages deploy + Windows release builds
```

### Algorithm checks

`scripts/verify-algs.mjs` simulates every algorithm: OLLs must keep F2L intact and match their group, PLLs must be pure last-layer permutations with the right swap pattern, F2L cases may only touch the front-right slot, parity algorithms must stay in the top layer. Case diagrams are drawn from the same simulation, so a diagram always matches its algorithm.

### Releasing

```bash
npm version patch    # bumps package.json, app/js/version.js and the offline cache name, then tags
git push --follow-tags
```

Pushing to `main` redeploys the web app; pushing a `v*` tag builds the Windows installer and attaches it to a GitHub Release.

## Credits

3D rendering by [three.js](https://threejs.org) (MIT). Algorithms are the community-standard sets (speedsolving.com wiki, J Perm), each verified by simulation.
