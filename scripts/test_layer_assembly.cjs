const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const layersDir = 'src/assets/art/characters/aria/layers';

function loadPng(name) {
  const p = path.join(layersDir, name);
  if (!fs.existsSync(p)) return null;
  return PNG.sync.read(fs.readFileSync(p));
}

// Canvas size for assembly test: 600 x 700
const canvas = new PNG({ width: 600, height: 700 });
// Fill with background color #1e293b
for (let i = 0; i < canvas.data.length; i += 4) {
  canvas.data[i] = 0x1e;
  canvas.data[i + 1] = 0x29;
  canvas.data[i + 2] = 0x3b;
  canvas.data[i + 3] = 0xff;
}

function blit(img, targetX, targetY, anchorX = 0.5, anchorY = 0.5, opacity = 1.0) {
  if (!img) return;
  const startX = Math.round(targetX - img.width * anchorX);
  const startY = Math.round(targetY - img.height * anchorY);

  for (let y = 0; y < img.height; y++) {
    const cy = startY + y;
    if (cy < 0 || cy >= canvas.height) continue;
    for (let x = 0; x < img.width; x++) {
      const cx = startX + x;
      if (cx < 0 || cx >= canvas.width) continue;

      const srcIdx = (y * img.width + x) * 4;
      const srcA = (img.data[srcIdx + 3] / 255) * opacity;
      if (srcA <= 0.01) continue;

      const dstIdx = (cy * canvas.width + cx) * 4;
      const dstA = canvas.data[dstIdx + 3] / 255;

      const outA = srcA + dstA * (1 - srcA);
      if (outA <= 0) continue;

      canvas.data[dstIdx] = Math.round((img.data[srcIdx] * srcA + canvas.data[dstIdx] * dstA * (1 - srcA)) / outA);
      canvas.data[dstIdx + 1] = Math.round((img.data[srcIdx + 1] * srcA + canvas.data[dstIdx + 1] * dstA * (1 - srcA)) / outA);
      canvas.data[dstIdx + 2] = Math.round((img.data[srcIdx + 2] * srcA + canvas.data[dstIdx + 2] * dstA * (1 - srcA)) / outA);
      canvas.data[dstIdx + 3] = Math.round(outA * 255);
    }
  }
}

// Load pieces
const hairBack = loadPng('hair_back.png');
const ribbonFlow = loadPng('ribbon_flow.png');
const skirtBack = loadPng('skirt_side_R.png'); // as discovered earlier, skirt_side_R was the back skirt peplum
const tailBase = loadPng('tail_base.png');
const tailMid = loadPng('tail_mid.png');
const tailTip = loadPng('tail_tip.png');
const tailRibbon = loadPng('tail_ribbon.png');

const thighL = loadPng('thigh_L.png');
const lowerLegL = loadPng('lower_leg_L.png');
const footL = loadPng('foot_L.png');
const thighR = loadPng('thigh_R.png');
const lowerLegR = loadPng('lower_leg_R.png');
const footR = loadPng('foot_R.png');

const torsoBack = loadPng('torso_back.png');
const torsoFront = loadPng('torso_front.png');
const skirtFront = loadPng('skirt_front.png');
const skirtSideL = loadPng('skirt_side_L.png');

const upperArmL = loadPng('upper_arm_L.png');
const forearmL = loadPng('forearm_L.png');
const handL = loadPng('hand_L.png');

const upperArmR = loadPng('upperarm_R.png');
const forearmR = loadPng('forearm_R.png');
const handR = loadPng('hand_R.png');

const face = loadPng('face.png');
const eyes = loadPng('eyes.png');
const mouth = loadPng('mouth_neutral.png');
const hairFront = loadPng('hair_front.png');
const crown = loadPng('crown.png');
const earrings = loadPng('earrings.png');
const ribbon = loadPng('ribbon.png');

// Center X and Baseline Y
const cx = 300;
const cy = 600; // ground baseline

// Assembly test
// 1. Hair back
blit(hairBack, cx, cy - 490, 0.5, 0.5);

// 2. Ribbons flow back
blit(ribbonFlow, cx - 10, cy - 350, 0.5, 0.5);

// 3. Tail
blit(tailBase, cx + 80, cy - 320, 0.2, 0.8);
blit(tailRibbon, cx + 70, cy - 330, 0.5, 0.5);

// 4. Legs Left & Right
blit(thighL, cx - 45, cy - 250, 0.5, 0.1);
blit(thighR, cx + 45, cy - 250, 0.5, 0.1);

// 5. Torso
blit(torsoFront, cx, cy - 390, 0.5, 0.5);

// 6. Skirt front & sides
blit(skirtFront, cx, cy - 310, 0.5, 0.1);
blit(skirtSideL, cx - 45, cy - 310, 0.5, 0.1);

// 7. Head & Face
blit(face, cx, cy - 470, 0.5, 0.5);
blit(mouth, cx, cy - 455, 0.5, 0.5);
blit(hairFront, cx, cy - 485, 0.5, 0.5);
blit(crown, cx, cy - 530, 0.5, 0.5);
blit(earrings, cx, cy - 455, 0.5, 0.5);

fs.writeFileSync('test_rig_assembly.png', PNG.sync.write(canvas));
console.log('Saved test_rig_assembly.png');
