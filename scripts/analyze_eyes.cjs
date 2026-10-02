const fs = require('fs');
const { PNG } = require('pngjs');

const raw = fs.readFileSync('src/assets/art/characters/aria/layers/eyes.png');
const png = PNG.sync.read(raw);

console.log('eyes.png dimensions:', png.width, png.height);

// Let's locate the mouth regions in eyes.png (82x78)
// Let's print out non-transparent clusters or a visualization
for (let y = 0; y < png.height; y += 4) {
  let line = '';
  for (let x = 0; x < png.width; x += 2) {
    const a = png.data[(y * png.width + x) * 4 + 3];
    line += a > 50 ? '#' : '.';
  }
  console.log(y.toString().padStart(2, '0') + ' ' + line);
}
