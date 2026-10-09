const fs = require('fs');
let content = fs.readFileSync('src/renderer/PixelRenderer.js', 'utf8');
const startIdx = content.indexOf('  beginFrame() {');
const endIdx = content.indexOf('  // ========================================================');
if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `  beginFrame() {\n    this.internalCtx.imageSmoothingEnabled = false;\n  }\n\n  endFrame() {\n    const dW = this.canvas.width;\n    const dH = this.canvas.height;\n    const ctx = this.ctx;\n\n    // 1. Blit internal pixel art buffer to full display canvas (perfect crisp nearest-neighbor)\n    ctx.imageSmoothingEnabled = false;\n    ctx.drawImage(this.internalCanvas, 0, 0, dW, dH);\n\n    // 2. Clean Modern Arcade Vignette (Subtle depth, no blur or scanlines)\n    const vigGrad = ctx.createRadialGradient(\n      dW / 2, dH / 2, dH * 0.5,\n      dW / 2, dH / 2, dW * 0.75\n    );\n    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');\n    vigGrad.addColorStop(0.7, 'rgba(2, 6, 23, 0.1)');\n    vigGrad.addColorStop(1, 'rgba(2, 6, 23, 0.4)');\n    ctx.fillStyle = vigGrad;\n    ctx.fillRect(0, 0, dW, dH);\n  }\n\n`;
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync('src/renderer/PixelRenderer.js', content);
  console.log('Fixed');
}
