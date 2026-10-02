const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

// 1. Process aria_master_front.jpg -> transparent PNG
function extractTransparentPng(jpgPath, outPngPath, tolerance = 12) {
  const rawJpg = fs.readFileSync(jpgPath);
  const decoded = jpeg.decode(rawJpg, { useTArray: true });
  const { width, height, data } = decoded;

  const png = new PNG({ width, height });

  // Flood-fill / chroma-key background white pixels
  // In aria_master_front.jpg, the background is pure white #ffffff (r > 245, g > 245, b > 245)
  // Let's do a flood fill from (0,0) and all border pixels to find background
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Helper
  const isWhite = (x, y) => {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return r >= (255 - tolerance) && g >= (255 - tolerance) && b >= (255 - tolerance);
  };

  // Push borders
  for (let x = 0; x < width; x++) {
    if (isWhite(x, 0)) { queue.push((0 * width + x)); visited[0 * width + x] = 1; }
    if (isWhite(x, height - 1)) { queue.push(((height - 1) * width + x)); visited[(height - 1) * width + x] = 1; }
  }
  for (let y = 0; y < height; y++) {
    if (isWhite(0, y)) { queue.push((y * width + 0)); visited[y * width + 0] = 1; }
    if (isWhite(width - 1, y)) { queue.push((y * width + width - 1)); visited[y * width + width - 1] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nidx = ny * width + nx;
        if (!visited[nidx] && isWhite(nx, ny)) {
          visited[nidx] = 1;
          queue.push(nidx);
        }
      }
    }
  }

  // Now copy data to PNG, setting visited pixels to alpha 0
  // and soft antialiasing on edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const pidx = y * width + x;

      if (visited[pidx]) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      } else {
        // Check if neighbor is visited for soft edge
        let neighborVisited = 0;
        if (x > 0 && visited[pidx - 1]) neighborVisited++;
        if (x < width - 1 && visited[pidx + 1]) neighborVisited++;
        if (y > 0 && visited[pidx - width]) neighborVisited++;
        if (y < height - 1 && visited[pidx + width]) neighborVisited++;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        if (neighborVisited > 0 && (r > 230 && g > 230 && b > 230)) {
          // Soft edge blending
          const whiteness = Math.min(r, g, b);
          const alpha = Math.max(0, Math.min(255, Math.round(255 - (whiteness - 230) * 10)));
          png.data[idx] = r;
          png.data[idx + 1] = g;
          png.data[idx + 2] = b;
          png.data[idx + 3] = alpha;
        } else {
          png.data[idx] = r;
          png.data[idx + 1] = g;
          png.data[idx + 2] = b;
          png.data[idx + 3] = 255;
        }
      }
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outPngPath, buffer);
  console.log(`Saved transparent PNG: ${outPngPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  return { width, height };
}

// Extract aria_master_front
const outDir = 'src/assets/art/characters/aria/master';
extractTransparentPng(
  path.join(outDir, 'aria_master_front.jpg'),
  path.join(outDir, 'aria_master_front_transparent.png'),
  14
);

// Extract turnaround figures
extractTransparentPng(
  path.join(outDir, 'aria_master_turnaround.jpg'),
  path.join(outDir, 'aria_master_turnaround_transparent.png'),
  14
);
