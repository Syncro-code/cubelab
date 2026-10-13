// Timer state machine. Input-agnostic: call press()/release()/cancel().
//
// idle -> (press) holding -> (hold delay) ready -> (release) running -> (press) stopped -> (release) idle
// With inspection: idle -> (press+release) inspecting -> (press) holding -> ... (penalty +2 after 15 s, DNF after 17 s)

export class Timer {
  constructor({ getSettings, onState, onTick, onFinish, onInspectionAlert }) {
    this.getSettings = getSettings;
    this.onState = onState;
    this.onTick = onTick;
    this.onFinish = onFinish;
    this.onInspectionAlert = onInspectionAlert;
    this.state = 'idle';
    this.raf = 0;
    this.holdTimer = 0;
    this.alerts = new Set();
  }

  set(state) {
    this.state = state;
    this.onState(state, this);
  }

  get busy() { return this.state !== 'idle'; }

  press() {
    const s = this.getSettings();
    switch (this.state) {
      case 'idle':
        if (s.inspection) { this.pendingInspection = true; return; }
        this.startHold('idle');
        break;
      case 'inspecting':
        this.startHold('inspecting');
        break;
      case 'running':
        this.stop();
        break;
      default:
    }
  }

  release() {
    switch (this.state) {
      case 'idle':
        if (this.pendingInspection) { this.pendingInspection = false; this.startInspection(); }
        break;
      case 'holding':
        clearTimeout(this.holdTimer);
        this.set(this.holdFrom);
        break;
      case 'ready':
        this.start();
        break;
      case 'stopped':
        this.set('idle');
        break;
      default:
    }
  }

  cancel() {
    clearTimeout(this.holdTimer);
    cancelAnimationFrame(this.raf);
    this.pendingInspection = false;
    if (this.state === 'running') return; // never discard a running solve silently
    this.set('idle');
  }

  startHold(from) {
    this.holdFrom = from;
    this.set('holding');
    const delay = this.getSettings().holdDelay;
    const ready = () => { if (this.state === 'holding') this.set('ready'); };
    if (delay <= 0) ready(); else this.holdTimer = setTimeout(ready, delay);
  }

  startInspection() {
    this.inspectStart = performance.now();
    this.alerts.clear();
    this.set('inspecting');
    const tick = () => {
      if (this.state !== 'inspecting' && this.state !== 'holding' && this.state !== 'ready') return;
      if (this.holdFrom !== 'inspecting' && this.state !== 'inspecting') return;
      const el = (performance.now() - this.inspectStart) / 1000;
      for (const sec of [8, 12]) if (el >= sec && !this.alerts.has(sec)) { this.alerts.add(sec); this.onInspectionAlert?.(sec); }
      if (el >= 17) {
        clearTimeout(this.holdTimer);
        this.set('stopped');
        this.onFinish({ t: 0, p: -1 });
        this.set('idle');
        return;
      }
      this.onTick(el, 'inspection');
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  inspectionPenalty() {
    if (!this.inspectStart || this.holdFrom !== 'inspecting') return 0;
    const el = (performance.now() - this.inspectStart) / 1000;
    if (el > 17) return -1;
    if (el > 15) return 2000;
    return 0;
  }

  start() {
    cancelAnimationFrame(this.raf);
    this.penalty = this.inspectionPenalty();
    this.inspectStart = 0;
    this.startTime = performance.now();
    this.set('running');
    const tick = () => {
      if (this.state !== 'running') return;
      this.onTick(performance.now() - this.startTime, 'running');
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  stop() {
    const t = Math.round(performance.now() - this.startTime);
    cancelAnimationFrame(this.raf);
    this.set('stopped');
    this.onFinish({ t, p: this.penalty || 0 });
  }
}
