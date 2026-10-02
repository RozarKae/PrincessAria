const fs = require('fs');
const { PNG } = require('pngjs');

const raw = fs.readFileSync('src/assets/art/characters/aria/master/aria_master_front_transparent.png');
const png = PNG.sync.read(raw);

let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const a = png.data[(y * png.width + x) * 4 + 3];
    if (a > 20) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('Character bounds in 682x1024:');
console.log('X:', minX, 'to', maxX, '(width:', maxX - minX, ', center:', Math.round((minX + maxX)/2), ')');
console.log('Y:', minY, 'to', maxY, '(height:', maxY - minY, ')');
console.log('Feet contact baseline Y:', maxY);
