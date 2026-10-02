const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

function inspectDir(dir) {
  console.log('=== ' + dir + ' ===');
  if (!fs.existsSync(dir)) {
    console.log('Does not exist');
    return;
  }
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) continue;
    if (f.endsWith('.png')) {
      try {
        const p = PNG.sync.read(fs.readFileSync(full));
        let transparentPixels = 0;
        for (let i = 3; i < p.data.length; i += 4) {
          if (p.data[i] === 0) transparentPixels++;
        }
        const pctTrans = ((transparentPixels / (p.width * p.height)) * 100).toFixed(1);
        console.log(`PNG: ${f} | ${p.width}x${p.height} | ${pctTrans}% trans | ${(stat.size/1024).toFixed(1)} KB`);
      } catch(e) {
        console.log(`PNG error ${f}: ${e.message}`);
      }
    } else if (f.endsWith('.jpg') || f.endsWith('.jpeg')) {
      try {
        const j = jpeg.decode(fs.readFileSync(full));
        console.log(`JPG: ${f} | ${j.width}x${j.height} | ${(stat.size/1024).toFixed(1)} KB`);
      } catch(e) {
        console.log(`JPG error ${f}: ${e.message}`);
      }
    } else if (f.endsWith('.svg')) {
      console.log(`SVG: ${f} | ${(stat.size/1024).toFixed(1)} KB`);
    }
  }
}

inspectDir('src/assets/art/characters/aria/master');
inspectDir('src/assets/art/characters/aria/layers');
inspectDir('src/assets/art/characters/aria/layers/precise_crops');
inspectDir('src/assets/characters/aria/master');
