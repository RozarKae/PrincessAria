import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/Constants.js';

export class ContinueDialog {
  constructor() {
    this.active = false;
    this.timer = 0;
    this.timeout = 20; // seconds until auto-decline (could be adjusted)
    this.onConfirm = null;
    this.onCancel = null;
  }

  show(onConfirm, onCancel) {
    this.active = true;
    this.timer = 0;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  hide() {
    this.active = false;
    this.timer = 0;
    this.onConfirm = null;
    this.onCancel = null;
  }

  update(dt, input) {
    if (!this.active) return;
    this.timer += dt;
    if (this.timer >= this.timeout) {
      // auto cancel
      this.active = false;
      if (this.onCancel) this.onCancel();
      return;
    }

    if (input && (input.justPressed('START') || input.justPressed('JUMP') || input.justPressed('ATTACK'))) {
      this.active = false;
      if (this.onConfirm) this.onConfirm();
      return;
    }

    if (input && input.justPressed('RESTART')) {
      this.active = false;
      if (this.onCancel) this.onCancel();
      return;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    // translucent backdrop
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const w = 540;
    const h = 140;
    const x = (CANVAS_WIDTH - w) / 2;
    const y = (CANVAS_HEIGHT - h) / 2 - 40;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = '700 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CONTINUE FROM LAST CHECKPOINT?', CANVAS_WIDTH / 2, y + 36);

    ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Press START / JUMP / ATTACK to continue (Consume 1 life)', CANVAS_WIDTH / 2, y + 74);

    const remaining = Math.max(0, Math.ceil(this.timeout - this.timer));
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 14px monospace';
    ctx.fillText(`Auto-decline in ${remaining}s  •  Press R to give up`, CANVAS_WIDTH / 2, y + 104);

    ctx.restore();
  }
}
