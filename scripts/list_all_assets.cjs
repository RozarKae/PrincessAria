const fs = require('fs');
const path = require('path');

// Let's inspect the files in src/assets/art/characters/aria
const masterDir = 'src/assets/art/characters/aria/master';
console.log('Files in master:');
fs.readdirSync(masterDir).forEach(f => {
  const stat = fs.statSync(path.join(masterDir, f));
  console.log(' ', f, (stat.size / 1024).toFixed(1) + ' KB');
});

const layersDir = 'src/assets/art/characters/aria/layers';
console.log('Files in layers:');
fs.readdirSync(layersDir).forEach(f => {
  const stat = fs.statSync(path.join(layersDir, f));
  console.log(' ', f, (stat.size / 1024).toFixed(1) + ' KB');
});
