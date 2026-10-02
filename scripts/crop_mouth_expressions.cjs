const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const raw = fs.readFileSync('src/assets/art/characters/aria/layers/eyes.png');
const png = PNG.sync.read(raw);

function crop(x, y, w, h) {
  const result = new PNG({ width: w, height: h });
  for (let cy = 0; cy < h; cy++) {
    for (let cx = 0; cx < w; cx++) {
      const srcIdx = ((y + cy) * png.width + (x + cx)) * 4;
      const dstIdx = (cy * w + cx) * 4;
      result.data[dstIdx] = png.data[srcIdx];
      result.data[dstIdx + 1] = png.data[srcIdx + 1];
      result.data[dstIdx + 2] = png.data[srcIdx + 2];
      result.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }
  return result;
}

const outDir = 'src/assets/art/characters/aria/layers';

// Crop mouths:
// 1. mouth_neutral (center mouth y: 36..48, x: 32..54)
const mouthNeutral = crop(32, 35, 23, 14);
fs.writeFileSync(path.join(outDir, 'mouth_neutral.png'), PNG.sync.write(mouthNeutral));

// 2. mouth_smile (bottom-left smiling mouth y: 66..78, x: 8..38)
const mouthSmile = crop(8, 66, 30, 12);
fs.writeFileSync(path.join(outDir, 'mouth_smile.png'), PNG.sync.write(mouthSmile));

// 3. mouth_surprised (bottom-right 'o' mouth y: 66..78, x: 50..76)
const mouthSurprised = crop(50, 66, 26, 12);
fs.writeFileSync(path.join(outDir, 'mouth_surprised.png'), PNG.sync.write(mouthSurprised));

// 4. mouth_hurt (top-left determined/parted mouth y: 36..48, x: 8..32)
const mouthHurt = crop(8, 35, 24, 14);
fs.writeFileSync(path.join(outDir, 'mouth_hurt.png'), PNG.sync.write(mouthHurt));

console.log('Saved 4 mouth expression layers.');
