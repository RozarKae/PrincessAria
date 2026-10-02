const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const raw = fs.readFileSync('src/assets/art/characters/aria/master/aria_master_turnaround_transparent.png');
const png = PNG.sync.read(raw);

// The 4 figures are roughly in 4 quarters of the image:
// 1: x 0..270
// 2: x 260..520
// 3: x 500..730
// 4: x 720..1024

const splits = [
  { name: 'aria_master_front_view.png', minXRange: [0, 270] },
  { name: 'aria_master_three_quarter_view.png', minXRange: [260, 520] },
  { name: 'aria_master_side_view.png', minXRange: [500, 730] },
  { name: 'aria_master_back_view.png', minXRange: [720, 1024] }
];

const outDir = 'src/assets/art/characters/aria/master';

splits.forEach(split => {
  let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = split.minXRange[0]; x < split.minXRange[1]; x++) {
      const idx = (y * png.width + x) * 4;
      const alpha = png.data[idx + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Add 4px padding
  minX = Math.max(0, minX - 4);
  maxX = Math.min(png.width - 1, maxX + 4);
  minY = Math.max(0, minY - 4);
  maxY = Math.min(png.height - 1, maxY + 4);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const cropped = new PNG({ width: cropW, height: cropH });

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((minY + y) * png.width + (minX + x)) * 4;
      const dstIdx = (y * cropW + x) * 4;
      cropped.data[dstIdx] = png.data[srcIdx];
      cropped.data[dstIdx + 1] = png.data[srcIdx + 1];
      cropped.data[dstIdx + 2] = png.data[srcIdx + 2];
      cropped.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }

  const outPath = path.join(outDir, split.name);
  fs.writeFileSync(outPath, PNG.sync.write(cropped));
  console.log(`Saved ${split.name}: ${cropW}x${cropH}`);
});
