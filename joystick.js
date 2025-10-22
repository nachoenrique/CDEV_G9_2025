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

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    // Enable pointer events on base
    this.base.style.touchAction = 'none';
    this.base.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);

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
  }
}

export default Joystick;
