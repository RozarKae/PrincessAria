import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const worldDirs = [
  'src/assets/worlds/honeywood/background',
  'src/assets/worlds/honeywood/midground',
  'src/assets/worlds/honeywood/foreground',
  'src/assets/worlds/honeywood/platforms',
  'src/assets/worlds/honeywood/props',
  'src/assets/worlds/honeywood/collectibles',
  'src/assets/worlds/honeywood/enemies',
  'src/assets/worlds/honeywood/effects',
  'src/assets/worlds/honeywood/particles',
];

for (const dir of worldDirs) {
  const full = path.join(rootDir, dir);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
  }
}

// 1. ROYAL SHARD (Glowing multifaceted royal crystal)
const royalShardSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <!-- Radiant Golden Shard Glow -->
    <radialGradient id="shardAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9" />
      <stop offset="45%" stop-color="#fbbf24" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="crystalFacetA" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <linearGradient id="crystalFacetB" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <linearGradient id="emeraldFacet" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2dd4bf" />
      <stop offset="100%" stop-color="#0f766e" />
    </linearGradient>
  </defs>

  <!-- Ambient Outer Glow -->
  <circle cx="64" cy="64" r="54" fill="url(#shardAura)" />

  <!-- Multifaceted Golden Royal Crystal -->
  <!-- Top Apex Facets -->
  <polygon points="64,16 88,44 64,52" fill="url(#crystalFacetA)" stroke="#fde047" stroke-width="1.2" />
  <polygon points="64,16 40,44 64,52" fill="url(#crystalFacetB)" stroke="#fde047" stroke-width="1.2" />
  <polygon points="40,44 64,16 64,52" fill="#fffbeb" opacity="0.4" />

  <!-- Center Belt Facets -->
  <polygon points="40,44 64,52 64,88 28,68" fill="url(#crystalFacetB)" stroke="#d97706" stroke-width="1.2" />
  <polygon points="88,44 64,52 64,88 100,68" fill="url(#crystalFacetA)" stroke="#d97706" stroke-width="1.2" />

  <!-- Bottom Terminal Facets -->
  <polygon points="64,88 28,68 64,114" fill="url(#crystalFacetB)" stroke="#b45309" stroke-width="1.2" />
  <polygon points="64,88 100,68 64,114" fill="url(#crystalFacetA)" stroke="#b45309" stroke-width="1.2" />

  <!-- Central Emerald Royal Core Insignia -->
  <polygon points="64,56 72,66 64,76 56,66" fill="url(#emeraldFacet)" stroke="#fde047" stroke-width="1.5" />
  <circle cx="64" cy="66" r="2.5" fill="#fef08a" />

  <!-- Specular Sparkle Star -->
  <polygon points="76,28 78,34 84,36 78,38 76,44 74,38 68,36 74,34" fill="#ffffff" opacity="0.95" />
</svg>`;

fs.writeFileSync(path.join(rootDir, 'src/assets/worlds/honeywood/collectibles/royal_shard.svg'), royalShardSVG, 'utf-8');

// 2. HIVE GRUB (Enemy 1: Soft segmented magical larva with amber markings and small legs)
const hiveGrubSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 96" width="128" height="96">
  <defs>
    <linearGradient id="grubBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="35%" stop-color="#fbbf24" />
      <stop offset="70%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#78350f" />
    </linearGradient>
    <radialGradient id="grubEye" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#f87171" />
      <stop offset="60%" stop-color="#dc2626" />
      <stop offset="100%" stop-color="#7f1d1d" />
    </radialGradient>
  </defs>

  <g id="hive_grub">
    <!-- Tail Segment -->
    <ellipse cx="28" cy="62" rx="16" ry="14" fill="url(#grubBody)" stroke="#78350f" stroke-width="1.5" />
    <path d="M22 54 Q28 50 34 54" stroke="#78350f" stroke-width="2" fill="none" />

    <!-- Mid Segment 1 -->
    <ellipse cx="48" cy="58" rx="18" ry="18" fill="url(#grubBody)" stroke="#78350f" stroke-width="1.5" />
    <!-- Amber Honeycomb Markings -->
    <polygon points="48,46 53,49 53,55 48,58 43,55 43,49" fill="#18181b" stroke="#fbbf24" stroke-width="1" />

    <!-- Mid Segment 2 -->
    <ellipse cx="72" cy="54" rx="20" ry="20" fill="url(#grubBody)" stroke="#78350f" stroke-width="1.5" />
    <polygon points="72,40 78,43 78,51 72,54 66,51 66,43" fill="#18181b" stroke="#fbbf24" stroke-width="1" />

    <!-- Head Segment -->
    <ellipse cx="98" cy="50" rx="22" ry="22" fill="url(#grubBody)" stroke="#78350f" stroke-width="1.5" />

    <!-- Expressive Alert Red/Amber Eye -->
    <ellipse cx="106" cy="44" rx="7" ry="9" fill="url(#grubEye)" stroke="#450a0a" stroke-width="1.2" />
    <circle cx="108" cy="41" r="2.5" fill="#ffffff" />
    <circle cx="104" cy="46" r="1.2" fill="#ffffff" />
    <!-- Menacing Brow Line -->
    <path d="M98 35 Q106 37 114 41" stroke="#450a0a" stroke-width="2.5" stroke-linecap="round" fill="none" />

    <!-- Mandible / Small Pincer -->
    <path d="M116 54 Q122 58 118 64 Q112 62 110 56 Z" fill="#78350f" stroke="#450a0a" stroke-width="1" />
    <path d="M110 58 Q118 66 112 70 Q106 66 106 60 Z" fill="#78350f" stroke="#450a0a" stroke-width="1" />

    <!-- Little Crawling Legs -->
    <g stroke="#78350f" stroke-width="3" stroke-linecap="round">
      <path d="M38 72 L36 82 L30 86" />
      <path d="M58 72 L58 84 L52 88" />
      <path d="M78 70 L80 84 L76 88" />
      <path d="M96 68 L102 82 L108 86" />
    </g>

    <!-- Glowing Nectar Drop on Tail -->
    <circle cx="18" cy="62" r="4" fill="#fde047" opacity="0.9" />
  </g>
</svg>`;

fs.writeFileSync(path.join(rootDir, 'src/assets/worlds/honeywood/enemies/hive_grub.svg'), hiveGrubSVG, 'utf-8');

// 3. HONEY WISP (Enemy 2: Floating corrupted honey magical creature)
const honeyWispSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <radialGradient id="wispAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fde047" stop-opacity="0.95" />
      <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#78350f" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="wispCore" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="30%" stop-color="#fef08a" />
      <stop offset="70%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
  </defs>

  <g id="honey_wisp">
    <!-- Outer Honey Glow Aura -->
    <circle cx="64" cy="56" r="48" fill="url(#wispAura)" />

    <!-- Trailing Honey Splashes -->
    <path d="M64 80 Q68 104 64 116 Q58 104 60 84 Z" fill="#f59e0b" opacity="0.75" />
    <path d="M52 75 Q42 96 38 108 Q44 94 54 80 Z" fill="#fbbf24" opacity="0.65" />
    <path d="M76 75 Q86 96 90 108 Q84 94 74 80 Z" fill="#fbbf24" opacity="0.65" />

    <!-- Teardrop Wisp Body -->
    <path d="M64 20 C84 20 96 38 96 56 C96 78 80 94 64 104 C48 94 32 78 32 56 C32 38 44 20 64 20 Z"
          fill="url(#wispCore)" stroke="#fde047" stroke-width="1.8" />

    <!-- Glowing Core Eyes -->
    <ellipse cx="54" cy="50" rx="5" ry="7" fill="#78350f" />
    <ellipse cx="74" cy="50" rx="5" ry="7" fill="#78350f" />
    <circle cx="56" cy="48" r="2" fill="#ffffff" />
    <circle cx="76" cy="48" r="2" fill="#ffffff" />
    <circle cx="52" cy="52" r="1" fill="#fde047" />
    <circle cx="72" cy="52" r="1" fill="#fde047" />

    <!-- Playful/Mischievous Smile -->
    <path d="M58 64 Q64 70 70 64" stroke="#78350f" stroke-width="2" stroke-linecap="round" fill="none" />

    <!-- Floating Honey Embers -->
    <circle cx="40" cy="36" r="3" fill="#fef08a" opacity="0.8" />
    <circle cx="88" cy="40" r="2.5" fill="#fde047" opacity="0.8" />
    <circle cx="64" cy="14" r="3.5" fill="#ffffff" opacity="0.9" />
  </g>
</svg>`;

fs.writeFileSync(path.join(rootDir, 'src/assets/worlds/honeywood/enemies/honey_wisp.svg'), honeyWispSVG, 'utf-8');

// 4. PLATFORM TILES & PROPS
const honeyPlatformSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 64" width="256" height="64">
  <defs>
    <linearGradient id="honeyPlatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="25%" stop-color="#fbbf24" />
      <stop offset="60%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#78350f" />
    </linearGradient>
  </defs>
  <!-- Honey Amber Slab -->
  <path d="M12 8 L244 8 Q252 8 252 18 L248 38 Q240 44 230 40 Q220 38 214 46 Q208 54 200 48 Q190 40 180 44 Q170 50 162 42 Q150 36 140 44 Q130 52 120 46 Q110 38 100 44 Q90 52 82 46 Q70 38 60 46 Q50 54 42 48 Q32 40 24 46 L8 36 Q4 24 12 8 Z"
        fill="url(#honeyPlatGrad)" stroke="#fde047" stroke-width="2" />
  <!-- Gloss Surface Rim -->
  <path d="M16 12 L240 12" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.75" />
  <!-- Honey Dripping Nodes -->
  <circle cx="50" cy="56" r="3.5" fill="#fbbf24" opacity="0.9" />
  <circle cx="162" cy="52" r="4" fill="#fbbf24" opacity="0.9" />
  <circle cx="204" cy="58" r="3" fill="#fde047" opacity="0.9" />
</svg>`;

fs.writeFileSync(path.join(rootDir, 'src/assets/worlds/honeywood/platforms/honey_platform.svg'), honeyPlatformSVG, 'utf-8');

// 5. GIANT HONEYCOMB PROP (Environmental Storytelling)
const giantHoneycombSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="hiveCombGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.8" />
      <stop offset="60%" stop-color="#b45309" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </radialGradient>
  </defs>
  <circle cx="128" cy="128" r="110" fill="url(#hiveCombGlow)" />
  <!-- Hexagon Grid -->
  <g stroke="#f59e0b" stroke-width="3" fill="#1e1b4b" fill-opacity="0.85">
    <!-- Center Hex -->
    <polygon points="128,96 156,112 156,144 128,160 100,144 100,112" fill="#d97706" fill-opacity="0.6"/>
    <!-- Surrounding Hexes -->
    <polygon points="128,48 156,64 156,96 128,112 100,96 100,64" />
    <polygon points="184,80 212,96 212,128 184,144 156,128 156,96" />
    <polygon points="184,144 212,160 212,192 184,208 156,192 156,160" />
    <polygon points="128,160 156,176 156,208 128,224 100,208 100,176" fill="#f59e0b" fill-opacity="0.5"/>
    <polygon points="72,144 100,160 100,192 72,208 44,192 44,160" />
    <polygon points="72,80 100,96 100,128 72,144 44,128 44,96" fill="#b45309" fill-opacity="0.5"/>
  </g>
  <!-- Glowing Honey Pools inside select combs -->
  <circle cx="128" cy="128" r="12" fill="#fde047" opacity="0.9" />
  <circle cx="128" cy="192" r="10" fill="#fbbf24" opacity="0.8" />
  <circle cx="72" cy="112" r="8" fill="#f59e0b" opacity="0.8" />
</svg>`;

fs.writeFileSync(path.join(rootDir, 'src/assets/worlds/honeywood/props/giant_honeycomb.svg'), giantHoneycombSVG, 'utf-8');

// 6. QUEEN BEE SHADOW & EYES (Encounter Event)
const queenShadowSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 384" width="512" height="384">
  <defs>
    <radialGradient id="shadowFade" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#020617" stop-opacity="0.95" />
      <stop offset="70%" stop-color="#020617" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0" />
    </radialGradient>
  </defs>
  <!-- Gigantic Queen Bee Menacing Silhouette -->
  <g fill="url(#shadowFade)" stroke="#090d16" stroke-width="4">
    <!-- Huge Wings Spread -->
    <ellipse cx="140" cy="120" rx="130" ry="70" transform="rotate(-25 140 120)" />
    <ellipse cx="372" cy="120" rx="130" ry="70" transform="rotate(25 372 120)" />
    <!-- Lower Wings -->
    <ellipse cx="160" cy="200" rx="90" ry="45" transform="rotate(-15 160 200)" />
    <ellipse cx="352" cy="200" rx="90" ry="45" transform="rotate(15 352 200)" />
    <!-- Enormous Thorax & Abdomen -->
    <ellipse cx="256" cy="180" rx="60" ry="50" />
    <ellipse cx="256" cy="270" rx="75" ry="95" />
    <!-- Giant Stinger -->
    <polygon points="246,350 266,350 256,380" fill="#020617" />
    <!-- Queen Head & Crown Silhouette -->
    <circle cx="256" cy="115" r="42" />
    <!-- Spiked Queen Crown Silhouette -->
    <polygon points="230,85 240,65 248,78 256,58 264,78 272,65 282,85" />
  </g>
</svg>`;

fs.writeFileSync(path.join(rootDir, 'src/assets/worlds/honeywood/effects/queen_bee_shadow.svg'), queenShadowSVG, 'utf-8');

const queenEyesSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 128" width="256" height="128">
  <defs>
    <radialGradient id="queenEyeGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ef4444" stop-opacity="1" />
      <stop offset="50%" stop-color="#dc2626" stop-opacity="0.8" />
      <stop offset="85%" stop-color="#991b1b" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
  </defs>
  <!-- Pair of Malevolent Glowing Queen Bee Compound Eyes -->
  <ellipse cx="80" cy="64" rx="42" ry="32" fill="url(#queenEyeGlow)" />
  <ellipse cx="176" cy="64" rx="42" ry="32" fill="url(#queenEyeGlow)" />
  <!-- Inner Hexagonal Facets -->
  <ellipse cx="82" cy="64" rx="26" ry="18" fill="#fca5a5" opacity="0.9" />
  <ellipse cx="174" cy="64" rx="26" ry="18" fill="#fca5a5" opacity="0.9" />
  <ellipse cx="84" cy="64" rx="12" ry="8" fill="#ffffff" />
  <ellipse cx="172" cy="64" rx="12" ry="8" fill="#ffffff" />
</svg>`;

fs.writeFileSync(path.join(rootDir, 'src/assets/worlds/honeywood/effects/queen_bee_eyes.svg'), queenEyesSVG, 'utf-8');

console.log('Successfully generated all World 1 (Honeywood Kingdom) HD illustrated assets!');
