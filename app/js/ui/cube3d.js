// Three.js NxN cube with animated layer turns.
//
// The view always keeps cubies at their home positions and recolours stickers
// from a CubeState after every move; a turn is animated by temporarily
// parenting the affected cubies to a pivot and rotating it.
import * as THREE from '../../vendor/three.module.min.js';
import { CubeState, geometry, parseAlg, FACE_NORMALS } from '../cube/model.js';
import { SCHEMES, BODY_COLOR, MASK_COLOR } from '../cube/colors.js';

const AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
const DEFAULT_ROT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.52, -0.68, 0, 'XYZ'));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

let stickerGeo = null;
function getStickerGeometry() {
  if (stickerGeo) return stickerGeo;
  const s = 0.43, r = 0.11;
  const shape = new THREE.Shape();
  shape.moveTo(-s + r, -s);
  shape.lineTo(s - r, -s); shape.quadraticCurveTo(s, -s, s, -s + r);
  shape.lineTo(s, s - r); shape.quadraticCurveTo(s, s, s - r, s);
  shape.lineTo(-s + r, s); shape.quadraticCurveTo(-s, s, -s, s - r);
  shape.lineTo(-s, -s + r); shape.quadraticCurveTo(-s, -s, -s + r, -s);
  stickerGeo = new THREE.ShapeGeometry(shape, 3);
  return stickerGeo;
}

export class CubeView {
  constructor(container, opts = {}) {
    this.el = container;
    this.N = opts.N || 3;
    this.scheme = opts.scheme || 'wca';
    this.interactive = !!opts.interactive;
    this.orbit = opts.orbit !== false;
    this.onMove = opts.onMove || null;       // called when the user turns a layer
    this.onSettled = opts.onSettled || null; // called when the animation queue drains
    this.turnMs = opts.turnMs || 200;
    this.mask = null;
    this.queue = [];
    this.anim = null;
    this.raf = 0;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.canvas = this.renderer.domElement;
    this.canvas.classList.add('cube-canvas');
    container.appendChild(this.canvas);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x404858, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.3);
    key.position.set(4, 9, 7);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xbcd2ff, 0.5);
    fill.position.set(-6, -3, 4);
    this.scene.add(fill);

    this.root = new THREE.Group();
    this.root.quaternion.copy(DEFAULT_ROT);
    this.scene.add(this.root);

    this.bodyMat = new THREE.MeshStandardMaterial({ color: BODY_COLOR, roughness: 0.55, metalness: 0.1 });
    this.makeMaterials();
    this.state = new CubeState(this.N);
    this.build();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();
    if (this.orbit || this.interactive) this.bindPointer();
  }

  makeMaterials() {
    const mk = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.38, metalness: 0.0 });
    this.mats = SCHEMES[this.scheme].map(mk);
    this.maskMat = mk(MASK_COLOR);
  }

  build() {
    if (this.cubieRoot) this.root.remove(this.cubieRoot);
    this.cubieRoot = new THREE.Group();
    this.root.add(this.cubieRoot);
    const N = this.N, off = (N - 1) / 2;
    const g = geometry(N);
    const body = new THREE.BoxGeometry(0.965, 0.965, 0.965);
    this.cubies = [];
    const byCoord = new Map();
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
      const grp = new THREE.Group();
      grp.position.set(i - off, j - off, k - off);
      grp.userData = { coord: [i, j, k], home: grp.position.clone() };
      const m = new THREE.Mesh(body, this.bodyMat);
      m.userData.cubie = grp;
      grp.add(m);
      this.cubieRoot.add(grp);
      this.cubies.push(grp);
      byCoord.set(`${i},${j},${k}`, grp);
    }
    this.stickers = new Array(g.count);
    const sg = getStickerGeometry();
    const zAxis = new THREE.Vector3(0, 0, 1);
    for (let f = 0; f < g.count; f++) {
      const [i, j, k] = g.cubie[f];
      const n = FACE_NORMALS[g.face[f]];
      const nv = new THREE.Vector3(...n);
      const mesh = new THREE.Mesh(sg, this.mats[g.face[f]]);
      mesh.position.copy(nv).multiplyScalar(0.4835);
      mesh.quaternion.setFromUnitVectors(zAxis, nv);
      const grp = byCoord.get(`${i},${j},${k}`);
      mesh.userData = { facelet: f, normal: n, cubie: grp };
      grp.add(mesh);
      this.stickers[f] = mesh;
    }
    this.pickables = this.cubies.flatMap((c) => c.children);
    this.recolor();
    this.frame();
  }

  recolor() {
    const s = this.state.stickers;
    for (let f = 0; f < this.stickers.length; f++) {
      const v = s[f];
      this.stickers[f].material = this.mask && !this.mask(v, f) ? this.maskMat : this.mats[this.colorIndex(v)];
    }
    this.requestRender();
  }

  // Stickers normally hold a face index (0-5); tracking states hold a facelet index.
  colorIndex(v) {
    return this.tracking ? geometry(this.N).face[v] : v;
  }

  // ---- public API ----
  setPuzzle(N) {
    if (N === this.N) return;
    this.finishAll();
    this.N = N;
    this.state = new CubeState(N);
    this.build();
    this.resize();
  }

  setScheme(name) {
    if (name === this.scheme) return;
    this.scheme = name;
    this.makeMaterials();
    this.recolor();
  }

  // mask(value, faceletIndex) -> bool, for highlighting pieces (tracking states).
  setMask(fn) { this.mask = fn; this.recolor(); }

  setState(state, { tracking = false } = {}) {
    this.finishAll();
    if (state.N !== this.N) this.setPuzzle(state.N);
    this.tracking = tracking;
    this.state = state.clone();
    this.recolor();
  }

  reset() { this.setState(new CubeState(this.N)); }

  get busy() { return !!this.anim || this.queue.length > 0; }

  // Queue moves (string or parsed list) for animation.
  play(alg, { ms } = {}) {
    const moves = typeof alg === 'string' ? parseAlg(alg, this.N) : alg;
    for (const mv of moves) this.queue.push({ mv, ms: ms ?? this.turnMs });
    this.requestRender();
    return new Promise((resolve) => { this.queue.push({ done: resolve }); this.requestRender(); });
  }

  turn(mv, ms) { this.queue.push({ mv, ms: ms ?? this.turnMs }); this.requestRender(); }

  stop() { this.queue = this.queue.filter((q) => q.done); this.finishAll(); }

  // Complete every running/queued move instantly.
  finishAll() {
    if (this.anim) this.endAnim();
    while (this.queue.length) {
      const q = this.queue.shift();
      if (q.done) q.done(); else this.state.applyMove(q.mv);
    }
    this.recolor();
  }

  resetView() {
    this.viewFrom = this.root.quaternion.clone();
    this.viewStart = performance.now();
    this.requestRender();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    this.canvas.remove();
    this.disposed = true;
  }

  // ---- rendering ----
  resize() {
    const w = Math.max(1, this.el.clientWidth), hgt = Math.max(1, this.el.clientHeight);
    this.renderer.setSize(w, hgt, false);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.camera.aspect = w / hgt;
    this.frame();
    this.requestRender();
  }

  frame() {
    const r = this.N * 0.9;
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect);
    const d = r / Math.sin(Math.min(vfov, hfov) / 2);
    this.camera.position.set(0, 0, d * 1.04);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
  }

  requestRender() {
    if (!this.raf && !this.disposed) this.raf = requestAnimationFrame((t) => this.tick(t));
  }

  startNext(now) {
    while (this.queue.length && this.queue[0].done) this.queue.shift().done();
    if (!this.queue.length) return;
    const { mv, ms } = this.queue.shift();
    const pivot = new THREE.Group();
    this.cubieRoot.add(pivot);
    const affected = this.cubies.filter((c) => c.userData.coord[mv.axis] >= mv.lo && c.userData.coord[mv.axis] <= mv.hi);
    for (const c of affected) pivot.attach(c);
    const angle = mv.qt === 3 ? -Math.PI / 2 : mv.qt === 2 ? Math.PI : (mv.qt * Math.PI) / 2;
    this.anim = { mv, pivot, affected, angle, start: now, dur: Math.max(1, ms * (mv.qt === 2 ? 1.45 : 1)) };
  }

  endAnim() {
    const { mv, pivot, affected } = this.anim;
    for (const c of affected) {
      this.cubieRoot.attach(c);
      c.position.copy(c.userData.home);
      c.quaternion.identity();
    }
    this.cubieRoot.remove(pivot);
    this.state.applyMove(mv);
    this.anim = null;
  }

  tick(now) {
    this.raf = 0;
    if (!this.anim && this.queue.length) this.startNext(now);
    if (this.anim) {
      const a = this.anim;
      const t = Math.min(1, (now - a.start) / a.dur);
      a.pivot.quaternion.setFromAxisAngle(AXES[a.mv.axis], a.angle * ease(t));
      if (t >= 1) {
        this.endAnim();
        this.recolor();
        if (this.queue.length) this.startNext(now);
        else this.onSettled?.(this.state);
      }
    }
    if (this.viewFrom) {
      const t = Math.min(1, (now - this.viewStart) / 350);
      this.root.quaternion.slerpQuaternions(this.viewFrom, DEFAULT_ROT, ease(t));
      if (t >= 1) this.viewFrom = null;
    }
    if (this.spin && !this.drag) {
      this.applyOrbit(this.spin.x, this.spin.y);
      this.spin.x *= 0.93; this.spin.y *= 0.93;
      if (Math.hypot(this.spin.x, this.spin.y) < 0.0005) this.spin = null;
    }
    this.renderer.render(this.scene, this.camera);
    if (this.anim || this.queue.length || this.viewFrom || this.spin) this.requestRender();
  }

  // ---- pointer interaction ----
  applyOrbit(ax, ay) {
    const qy = new THREE.Quaternion().setFromAxisAngle(AXES[1], ax);
    const qx = new THREE.Quaternion().setFromAxisAngle(AXES[0], ay);
    this.root.quaternion.premultiply(qy).premultiply(qx);
  }

  bindPointer() {
    const c = this.canvas;
    c.style.touchAction = 'none';
    this.raycaster = new THREE.Raycaster();
    c.addEventListener('pointerdown', (e) => this.onDown(e));
    c.addEventListener('pointermove', (e) => this.onMoveEvt(e));
    c.addEventListener('pointerup', (e) => this.onUp(e));
    c.addEventListener('pointercancel', (e) => this.onUp(e));
    c.addEventListener('dblclick', () => this.resetView());
  }

  pick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const p = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(p, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    for (const h of hits) {
      const cubie = h.object.userData.cubie;
      if (!cubie) continue;
      let n;
      if (h.object.userData.normal) n = new THREE.Vector3(...h.object.userData.normal);
      else n = h.face.normal.clone().round();
      const [i, j, k] = cubie.userData.coord;
      const M = this.N - 1;
      const outer = (n.x === 1 && i === M) || (n.x === -1 && i === 0) || (n.y === 1 && j === M) || (n.y === -1 && j === 0) || (n.z === 1 && k === M) || (n.z === -1 && k === 0);
      if (!outer) continue;
      return { normal: n, point: this.root.worldToLocal(h.point.clone()), coord: cubie.userData.coord };
    }
    return null;
  }

  onDown(e) {
    if (this.drag) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.canvas.setPointerCapture?.(e.pointerId);
    this.spin = null;
    this.viewFrom = null;
    let hit = null;
    if (this.interactive) {
      this.finishAll();
      hit = this.pick(e);
    }
    this.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, mode: null, hit, t: performance.now(), vx: 0, vy: 0 };
  }

  onMoveEvt(e) {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.mode && Math.hypot(dx, dy) > 7) {
      d.mode = d.hit ? 'turn' : this.orbit ? 'orbit' : 'none';
      if (d.mode === 'turn') this.turnFromDrag(d.hit, dx, dy);
    }
    if (d.mode === 'orbit') {
      const sx = (e.clientX - d.x) * 0.009, sy = (e.clientY - d.y) * 0.009;
      this.applyOrbit(sx, sy);
      const now = performance.now();
      const dt = Math.max(1, now - d.t);
      d.vx = (sx / dt) * 16; d.vy = (sy / dt) * 16; d.t = now;
      this.requestRender();
    }
    d.x = e.clientX; d.y = e.clientY;
  }

  onUp(e) {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    if (d.mode === 'orbit' && performance.now() - d.t < 60 && Math.hypot(d.vx, d.vy) > 0.004) {
      this.spin = { x: d.vx, y: d.vy };
      this.requestRender();
    }
    this.drag = null;
  }

  turnFromDrag(hit, dx, dy) {
    const rect = this.canvas.getBoundingClientRect();
    const drag = new THREE.Vector2(dx, dy).normalize();
    const p = hit.point;
    const toScreen = (v) => {
      const w = v.clone().applyMatrix4(this.root.matrixWorld).project(this.camera);
      return new THREE.Vector2((w.x * rect.width) / 2, (-w.y * rect.height) / 2);
    };
    const p0 = toScreen(p);
    let best = null;
    for (let a = 0; a < 3; a++) {
      if (Math.abs(hit.normal.getComponent(a)) > 0.5) continue;
      const tangent = new THREE.Vector3().crossVectors(AXES[a], p);
      if (tangent.lengthSq() < 1e-6) continue;
      const s = toScreen(p.clone().addScaledVector(tangent.normalize(), 0.3)).sub(p0);
      if (s.lengthSq() < 1e-6) continue;
      const score = s.normalize().dot(drag);
      if (!best || Math.abs(score) > Math.abs(best.score)) best = { a, score };
    }
    if (!best) return;
    const layer = hit.coord[best.a];
    const mv = { axis: best.a, lo: layer, hi: layer, qt: best.score > 0 ? 1 : 3 };
    this.turn(mv, Math.min(this.turnMs, 140));
    this.onMove?.(mv);
  }
}
