/**
 * Joystick module
 * Provides a simple virtual joystick UI that limits the stick inside a circular base
 * Emits normalized dx, dy (-1..1) based on stick position relative to center.
 * Supports mouse and touch. When released, it springs back to center.
 */
export class Joystick {
  constructor({ baseId = 'joy-base', stickId = 'joy-stick', maxRadius = 52 } = {}) {
    this.base = document.getElementById(baseId);
    this.stick = document.getElementById(stickId);
    if (!this.base || !this.stick) throw new Error('Joystick elements not found');

    this.maxRadius = maxRadius; // pixels
    this.center = { x: 0, y: 0 };
    this.pointerId = null;
    this.value = { dx: 0, dy: 0 };
    this.listeners = [];
  // keyboard state for A,W,S,D
  this._keys = { w: false, a: false, s: false, d: false };

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
  this._onKeyDown = this._onKeyDown.bind(this);
  this._onKeyUp = this._onKeyUp.bind(this);

    // Enable pointer events on base
    this.base.style.touchAction = 'none';
    this.base.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
  // Keyboard controls (A,W,S,D) - allow holding keys instead of pointer
  window.addEventListener('keydown', this._onKeyDown);
  window.addEventListener('keyup', this._onKeyUp);

    this._updateCenter();
    window.addEventListener('resize', () => this._updateCenter());
  }

  // Public: subscribe to value changes
  onChange(fn) {
    this.listeners.push(fn);
  }

  // Private: recalc base center in page coords
  _updateCenter() {
    const rect = this.base.getBoundingClientRect();
    this.center.x = rect.left + rect.width / 2;
    this.center.y = rect.top + rect.height / 2;
  }

  _onPointerDown(e) {
    if (this.pointerId !== null) return;
    this.pointerId = e.pointerId;
    this.base.setPointerCapture?.(e.pointerId);
    this._updateCenter();
    this._applyPointer(e.clientX, e.clientY);
  }

  _onPointerMove(e) {
    if (this.pointerId === null) return;
    if (e.pointerId !== this.pointerId) return;
    this._applyPointer(e.clientX, e.clientY);
  }

  _onPointerUp(e) {
    if (this.pointerId === null) return;
    if (e.pointerId !== this.pointerId) return;
    this.base.releasePointerCapture?.(e.pointerId);
    this.pointerId = null;
    // Animate stick back to center
    this._setStickPosition(0, 0, true);
    this._emit(0, 0);
  }

  // Keyboard handlers: set directional state and apply as if joystick moved
  _onKeyDown(e) {
    // ignore repeated keydown events
    if (e.repeat) return;
    const k = e.code || e.key;
    let changed = false;
    if (k === 'KeyW' || k === 'w' || k === 'W') { this._keys.w = true; changed = true; }
    if (k === 'KeyA' || k === 'a' || k === 'A') { this._keys.a = true; changed = true; }
    if (k === 'KeyS' || k === 's' || k === 'S') { this._keys.s = true; changed = true; }
    if (k === 'KeyD' || k === 'd' || k === 'D') { this._keys.d = true; changed = true; }
    if (changed) {
      // if pointer is active, prefer pointer control
      if (this.pointerId !== null) return;
      this._applyKeyboard();
      e.preventDefault?.();
    }
  }

  _onKeyUp(e) {
    const k = e.code || e.key;
    let changed = false;
    if (k === 'KeyW' || k === 'w' || k === 'W') { this._keys.w = false; changed = true; }
    if (k === 'KeyA' || k === 'a' || k === 'A') { this._keys.a = false; changed = true; }
    if (k === 'KeyS' || k === 's' || k === 'S') { this._keys.s = false; changed = true; }
    if (k === 'KeyD' || k === 'd' || k === 'D') { this._keys.d = false; changed = true; }
    if (changed) {
      if (this.pointerId !== null) return;
      this._applyKeyboard();
      e.preventDefault?.();
    }
  }

  _applyKeyboard() {
    // Map keys to normalized game vector (ndx, ndy) where ndy: up is +1
    let x = 0, y = 0;
    if (this._keys.w) y += 1;
    if (this._keys.s) y -= 1;
    if (this._keys.d) x += 1;
    if (this._keys.a) x -= 1;

    if (x === 0 && y === 0) {
      // release
      this._setStickPosition(0, 0, true);
      this._emit(0, 0);
      return;
    }

    // normalize vector to length 1 (so diagonals aren't stronger)
    const len = Math.sqrt(x * x + y * y) || 1;
    const ndx = x / len;
    const ndy = y / len;

    // convert normalized to pixel positions used by _setStickPosition
    const px = ndx * this.maxRadius;
    const py = -ndy * this.maxRadius; // invert y for screen coords

    this._setStickPosition(px, py, false);
    this._emit(ndx, ndy);
  }

  _applyPointer(clientX, clientY) {
    const dx = clientX - this.center.x;
    const dy = clientY - this.center.y;
    // limit to circle
    const dist = Math.sqrt(dx * dx + dy * dy);
    const r = Math.min(dist, this.maxRadius);
    const nx = (dist === 0) ? 0 : (dx / dist) * r;
    const ny = (dist === 0) ? 0 : (dy / dist) * r;

    // set stick CSS (transform)
    this._setStickPosition(nx, ny, false);

    // normalized vector in range [-1,1] (y inverted for game coordinates)
    const ndx = (nx / this.maxRadius);
    const ndy = (-ny / this.maxRadius);
    this._emit(ndx, ndy);
  }

  _setStickPosition(px, py, animate) {
    if (animate) {
      this.stick.style.transition = 'transform 0.15s ease-out';
    } else {
      this.stick.style.transition = 'none';
    }
    this.stick.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
  }

  _emit(dx, dy) {
    this.value.dx = dx;
    this.value.dy = dy;
    for (const fn of this.listeners) {
      try { fn({ dx, dy }); } catch (err) { console.error(err); }
    }
  }

  // Get current value
  getValue() {
    return { ...this.value };
  }

  // Destroy listeners
  destroy() {
    this.base.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}

export default Joystick;
