import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/Constants.js';
import { assetManager } from '../renderer/AssetManager.js';

/**
 * DIALOGUE SYSTEM
 * HD fantasy dialogue box supporting portraits, character names, typewriter text, and advance/skip controls.
 */
export class DialogueBox {
  constructor() {
    this.active = false;
    this.dialogueQueue = [];
    this.currentSpeaker = '';
    this.currentText = '';
    this.displayedText = '';
    this.portraitKey = '';
    this.charIndex = 0;
    this.typeSpeed = 0.025; // seconds per character
    this.typeTimer = 0;
    this.onFinish = null;

    this.boxWidth = 1100;
    this.boxHeight = 180;
    this.boxX = (CANVAS_WIDTH - this.boxWidth) / 2;
    this.boxY = CANVAS_HEIGHT - this.boxHeight - 48;
  }

  /**
   * Start a sequence of dialogue lines.
   * @param {Array<Object>} lines [{ speaker, text, portrait }]
   * @param {Function} onFinish Callback when all lines conclude
   */
  startDialogue(lines, onFinish = null) {
    this.dialogueQueue = [...lines];
    this.onFinish = onFinish;
    this.nextLine();
  }

  nextLine() {
    if (this.dialogueQueue.length === 0) {
      this.active = false;
      if (this.onFinish) {
        const cb = this.onFinish;
        this.onFinish = null;
        cb();
      }
      return;
    }

    const next = this.dialogueQueue.shift();
    this.active = true;
    this.currentSpeaker = next.speaker || 'PRINCESS ARIA';
    this.currentText = next.text || '';
    this.portraitKey = next.portrait || 'characters/aria/expressions/determined';
    this.displayedText = '';
    this.charIndex = 0;
    this.typeTimer = 0;
  }

  skipOrNext() {
    if (!this.active) return;
    // If still typing, complete line immediately
    if (this.charIndex < this.currentText.length) {
      this.displayedText = this.currentText;
      this.charIndex = this.currentText.length;
    } else {
      // Advance to next line
      this.nextLine();
    }
  }

  update(dt, input) {
    if (!this.active) return;

    // Advance input check
    if (input && (input.justPressed('START') || input.justPressed('JUMP') || input.justPressed('ATTACK'))) {
      this.skipOrNext();
      return;
    }

    // Typewriter effect
    if (this.charIndex < this.currentText.length) {
      this.typeTimer += dt;
      while (this.typeTimer >= this.typeSpeed && this.charIndex < this.currentText.length) {
        this.typeTimer -= this.typeSpeed;
        this.charIndex++;
        this.displayedText = this.currentText.substring(0, this.charIndex);
      }
    }
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();

    // 1. Dialogue Frame (Translucent Obsidian with Royal Gold Filigree)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.roundRect(this.boxX, this.boxY, this.boxWidth, this.boxHeight, 16);
    ctx.fill();
    ctx.stroke();

    // Inner gold border accent
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(this.boxX + 6, this.boxY + 6, this.boxWidth - 12, this.boxHeight - 12, 12);
    ctx.stroke();

    // 2. Character Portrait Frame
    const portraitSize = 130;
    const portX = this.boxX + 24;
    const portY = this.boxY + 25;

    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(portX, portY, portraitSize, portraitSize, 10);
    ctx.fill();
    ctx.stroke();

    const portraitImg = assetManager.getImage(this.portraitKey);
    if (portraitImg && portraitImg.complete) {
      ctx.drawImage(portraitImg, portX + 6, portY + 6, portraitSize - 12, portraitSize - 12);
    } else {
      // Vector silhouette fallback
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 36px serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', portX + portraitSize / 2, portY + 80);
    }

    // 3. Speaker Name Badge
    const textStartX = portX + portraitSize + 28;
    const nameY = this.boxY + 44;

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.currentSpeaker.toUpperCase(), textStartX, nameY);

    // Subtle divider line under name
    ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.fillRect(textStartX, nameY + 8, 300, 2);

    // 4. Typewriter Dialogue Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '19px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Word wrap rendering
    const maxWidth = this.boxWidth - (textStartX - this.boxX) - 30;
    const words = this.displayedText.split(' ');
    let line = '';
    let lineY = nameY + 24;
    const lineHeight = 28;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, textStartX, lineY);
        line = words[i] + ' ';
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, textStartX, lineY);

    // 5. Next & Skip Controls Hint
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('NEXT [Space / Enter]   SKIP [Esc]', this.boxX + this.boxWidth - 24, this.boxY + this.boxHeight - 16);

    ctx.restore();
  }
}
