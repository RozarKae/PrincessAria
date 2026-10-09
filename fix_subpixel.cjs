const fs = require('fs');

// 1. Remove Math.round from Character and Enemy
function processFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/Math\.round\(/g, 'Number(');
  fs.writeFileSync(path, content);
}
processFile('src/renderer/PixelCharacterRenderer.js');
processFile('src/renderer/PixelEnemyRenderer.js');
processFile('src/renderer/PixelRenderer.js');

// 2. Override PixelRenderer to draw directly to scaled display canvas
let pr = fs.readFileSync('src/renderer/PixelRenderer.js', 'utf8');

const beginFrameRepl = `  beginFrame() {
    const dW = this.canvas.width;
    const dH = this.canvas.height;
    this.internalCtx = this.ctx;
    this.internalCtx.save();
    this.internalCtx.scale(dW / 320, dH / 240);
    this.internalCtx.imageSmoothingEnabled = false;
  }`;

pr = pr.replace(/beginFrame\(\) \{\n    this\.internalCtx\.imageSmoothingEnabled = false;\n  \}/g, beginFrameRepl);

const endFrameRepl = `  endFrame() {
    this.internalCtx.restore();
    const dW = this.canvas.width;
    const dH = this.canvas.height;
    const ctx = this.ctx;
    const vigGrad = ctx.createRadialGradient(
      dW / 2, dH / 2, dH * 0.5,
      dW / 2, dH / 2, dW * 0.75
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(0.7, 'rgba(2, 6, 23, 0.1)');
    vigGrad.addColorStop(1, 'rgba(2, 6, 23, 0.4)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, dW, dH);
  }`;

pr = pr.replace(/endFrame\(\) \{[\s\S]*?ctx\.fillRect\(0, 0, dW, dH\);\n  \}/g, endFrameRepl);

fs.writeFileSync('src/renderer/PixelRenderer.js', pr);
console.log('Done!');
