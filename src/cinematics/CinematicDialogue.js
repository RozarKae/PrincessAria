import { INTERNAL_WIDTH, INTERNAL_HEIGHT, PIXEL_PALETTE } from '../renderer/PixelPalette.js';

const P = PIXEL_PALETTE;

/**
 * Canonical Project Aria World Narrative Lore
 */
export const WORLD_LORE = {
  1: {
    title: 'WORLD 1 — HONEYWOOD GLADE',
    introLines: [
      'The enchanted woodland fell silent when the Queen Bee invaded.',
      'Batboy was trapped within the Sovereign Amber Chrysalis.',
      'Princess Aria steps through the celestial gate to rescue him.',
    ],
    outroTitle: 'BATBOY RESCUED!',
    outroLines: [
      'The amber chrysalis shatters and Batboy is freed!',
      'Grateful flutter wings guide Princess Aria forward.',
      'A new dimensional portal opens toward the Whispering Forest.',
    ],
  },
  2: {
    title: 'WORLD 2 — THE WHISPERING FOREST',
    introLines: [
      'Ancient twilight glades whisper of bioluminescent spores.',
      'The enchanted guardian Forest King slumbers under a dark haze.',
      'Princess Aria advances deeper to cleanse the forest heart.',
    ],
    outroTitle: 'FOREST KING PURIFIED!',
    outroLines: [
      'The ancient oak boughs awaken in emerald brilliance.',
      'The Forest King grants Princess Aria passage through the mists.',
      'A dimensional gate manifests before the Castle of a Thousand Doors.',
    ],
  },
  3: {
    title: 'WORLD 3 — CASTLE OF A THOUSAND DOORS',
    introLines: [
      'A gothic granite fortress lined with shifting dimensional doorways.',
      'Sir Slam-A-Lot guards the royal gateway with an iron hammer.',
      'Aria must find the true passage through the shifting halls.',
    ],
    outroTitle: 'GATEWAY UNLOCKED!',
    outroLines: [
      'Sir Slam-A-Lot yields the ancient keystone.',
      'The shifting doors align into a single searing pathway.',
      'The threshold ignites with the heat of the molten volcano.',
    ],
  },
  4: {
    title: 'WORLD 4 — VOLCANO OF HOT HONEY',
    introLines: [
      'Basalt columns surge with rivers of boiling golden nectar.',
      'The fiery Honey Dragon circles above the blazing updrafts.',
      'Princess Aria braves the magma flow to reach the final realms.',
    ],
    outroTitle: 'HONEY DRAGON PACIFIED!',
    outroLines: [
      'The magma honey cools into sweet crystalline gold.',
      'The soaring dragon bows before Princess Aria and Batboy.',
      'A golden dimensional vortex leads across the desert dunes.',
    ],
  },
  5: {
    title: 'WORLD 5 — DESERT OF ENDLESS SANDWICHES',
    introLines: [
      'Surreal toasted dunes, mustard rivers, and swiss cheese peaks.',
      'The Sandwich King defends his savory throne atop the bread crusts.',
      'Aria presses forward toward the clockwork heavens.',
    ],
    outroTitle: 'FEAST RECONCILED!',
    outroLines: [
      'The Sandwich King yields the golden olive toothpick.',
      'The golden dunes part to reveal the celestial gears above.',
      'Princess Aria steps into the ticking machinery of time.',
    ],
  },
  6: {
    title: 'WORLD 6 — THE CLOCKWORK KINGDOM',
    introLines: [
      'Towering brass escapements and spinning celestial astrolabes.',
      'The Time Tinker freezes time itself to stop the royal rescue.',
      'Princess Aria must reclaim the sunstone heart of eternity.',
    ],
    outroTitle: 'CHRONOS RESTORED — TRIUMPH!',
    outroLines: [
      'The golden escapements synchronize in glorious harmony.',
      'Time flows freely across all kingdoms once more.',
      'Princess Aria and Batboy stand triumphant as heroes of the realm!',
    ],
  },
};

/**
 * CinematicDialogue.js
 * 
 * Pixel-art narrative lore presenter on the 320x240 internal raster grid.
 * Respects nearest-neighbor rendering, disciplined palette colors, and
 * clean typographic layout.
 */
export class CinematicDialogue {
  constructor() {
    this.visible = false;
    this.alpha = 0;
    this.title = '';
    this.lines = [];
    this.timer = 0;
  }

  show(title, lines) {
    this.title = title;
    this.lines = Array.isArray(lines) ? lines : [lines];
    this.visible = true;
    this.alpha = 0;
    this.timer = 0;
  }

  hide() {
    this.visible = false;
    this.alpha = 0;
  }

  update(dt) {
    if (!this.visible) return;
    this.timer += dt;
    // Smooth fade in
    this.alpha = Math.min(1.0, this.timer * 3.0);
  }

  draw(ctx) {
    if (!this.visible || this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    const boxX = 20;
    const boxY = 152;
    const boxW = INTERNAL_WIDTH - 40; // 280
    const boxH = 64;

    // 1. Dark ornate background panel
    ctx.fillStyle = P.UI_BG;
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // 2. Double-layered gold filigree border
    ctx.fillStyle = P.HONEY_DARK;
    ctx.fillRect(boxX - 1, boxY - 1, boxW + 2, 1);
    ctx.fillRect(boxX - 1, boxY + boxH, boxW + 2, 1);
    ctx.fillRect(boxX - 1, boxY - 1, 1, boxH + 2);
    ctx.fillRect(boxX + boxW, boxY - 1, 1, boxH + 2);

    ctx.fillStyle = P.HONEY_AMBER;
    ctx.fillRect(boxX, boxY, boxW, 1);
    ctx.fillRect(boxX, boxY + boxH - 1, boxW, 1);
    ctx.fillRect(boxX, boxY, 1, boxH);
    ctx.fillRect(boxX + boxW - 1, boxY, 1, boxH);

    // Corner decorative rosettes
    ctx.fillStyle = P.HONEY_CORE;
    ctx.fillRect(boxX, boxY, 2, 2);
    ctx.fillRect(boxX + boxW - 2, boxY, 2, 2);
    ctx.fillRect(boxX, boxY + boxH - 2, 2, 2);
    ctx.fillRect(boxX + boxW - 2, boxY + boxH - 2, 2, 2);

    // 3. Title badge header
    ctx.fillStyle = P.HONEY_DARK;
    ctx.fillRect(boxX + 20, boxY - 4, boxW - 40, 8);
    ctx.fillStyle = P.HONEY_PALE;
    ctx.fillRect(boxX + 22, boxY - 3, boxW - 44, 1);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = P.HONEY_CORE;
    ctx.fillText(this.title, INTERNAL_WIDTH / 2, boxY);

    // 4. Narrative lore text lines
    ctx.font = '6px monospace';
    ctx.fillStyle = P.UI_TEXT_WHITE;
    ctx.textBaseline = 'top';

    const startY = boxY + 12;
    const lineHeight = 11;
    for (let i = 0; i < this.lines.length; i++) {
      ctx.fillText(this.lines[i], INTERNAL_WIDTH / 2, startY + i * lineHeight);
    }

    // 5. Blinking Skip / Continue indicator
    const blink = Math.floor(this.timer * 3) % 2 === 0;
    if (blink) {
      ctx.fillStyle = P.STONE_LIGHT;
      ctx.font = '5px monospace';
      ctx.fillText('PRESS SPACE / START TO SKIP', INTERNAL_WIDTH / 2, boxY + boxH - 8);
    }

    ctx.restore();
  }
}
