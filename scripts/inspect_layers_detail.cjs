const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const dir = 'src/assets/art/characters/aria/layers';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

console.log('Total PNG files in layers:', files.length);

files.forEach(f => {
  const p = path.join(dir, f);
  const png = PNG.sync.read(fs.readFileSync(p));
  let nonZero = 0;
  let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (y * png.width + x) * 4;
      if (png.data[idx + 3] > 0) {
        nonZero++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const pct = ((nonZero / (png.width * png.height)) * 100).toFixed(1);
  console.log(`${f.padEnd(22)} | ${png.width}x${png.height} | opaque: ${pct}% | bbox: [${minX},${minY} - ${maxX},${maxY}] (${maxX-minX+1}x${maxY-minY+1})`);
});
