/**
 * CinematicLayer.js
 * 
 * Manages depth-ordered rendering layers in Project Aria cinematics.
 * Supports:
 * - Depth sorting (zIndex)
 * - Layer-wide opacity and visibility
 * - Parallax translation factor
 * - Layer transforms
 */
export class CinematicLayer {
  constructor(name = 'default', zIndex = 0) {
    this.name = name;
    this.zIndex = zIndex;
    this.opacity = 1.0;
    this.visible = true;
    this.parallax = { x: 0, y: 0 };
    this.elements = [];
  }

  add(element) {
    if (!this.elements.includes(element)) {
      this.elements.push(element);
      this.sort();
    }
    return element;
  }

  remove(element) {
    const idx = this.elements.indexOf(element);
    if (idx !== -1) {
      this.elements.splice(idx, 1);
    }
  }

  clear() {
    this.elements = [];
  }

  sort() {
    this.elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }

  update(dt) {
    if (!this.visible) return;
    for (let i = 0; i < this.elements.length; i++) {
      if (typeof this.elements[i].update === 'function') {
        this.elements[i].update(dt);
      }
    }
  }

  draw(ctx, camX = 0, camY = 0) {
    if (!this.visible || this.opacity <= 0) return;

    ctx.save();
    if (this.opacity < 1.0) {
      ctx.globalAlpha *= this.opacity;
    }

    const effectiveCamX = camX * (1 - this.parallax.x);
    const effectiveCamY = camY * (1 - this.parallax.y);

    for (let i = 0; i < this.elements.length; i++) {
      const el = this.elements[i];
      if (typeof el.draw === 'function') {
        el.draw(ctx, effectiveCamX, effectiveCamY);
      }
    }

    ctx.restore();
  }
}
