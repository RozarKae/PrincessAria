# PRINCESS ARIA — ART PRODUCTION GUIDE
**Version:** 2.0.0  
**Project:** D:\Princess-Aria  
**Genre:** High-Definition 2D Cinematic Fantasy Platformer  
**Target Visual Quality:** Professional hand-painted fantasy illustration, believable anatomy, detailed costume fabric folds, layered atmospheric depth, classic arcade side-scrolling spirit.

---

## 1. Core Art Direction Principles

### 1.1 What the Game IS
- **Cinematic 2D Illustration**: Rich, hand-painted digital fantasy art with soft brush textures and clean silhouettes.
- **Layered Atmospheric Depth**: Deep multi-layer parallax (8 independent planes) where foregrounds, playfields, and distant layers feel harmoniously staged.
- **Heroic & Elegant Characters**: Recognizable, athletic, expressive protagonists and distinct, memorable antagonists.
- **Subtle Visual Storytelling**: The environment transforms dynamically (e.g. Honeywood transitioning from peaceful sunlit forest to corrupted amber hive).

### 1.2 What the Game MUST NEVER BE
- **NO Procedural SVG/Geometric Construction**: The game engine does NOT visually build characters from circles, rectangles, or procedural code polygons.
- **NO Pixel Art**: The game is not retro pixel art or low-res sprite work.
- **NO Generic Mobile Clip-Art**: No flat, sterile corporate vector shapes or asset-store cartoon archetypes.
- **NO Photorealistic 3D / CGI**: No pre-rendered clay or uncanny 3D models.
- **NO Ripped or Copyrighted Sprites**: Completely original identity.

---

## 2. Master Color Language

| Entity / Zone | Primary Palette | Accent Colors | Material & Lighting Texture |
| :--- | :--- | :--- | :--- |
| **Princess Aria** | Warm Gold (`#fbbf24`), Ivory Silk (`#fefce8`), Charcoal Chitin (`#1e293b`) | Emerald Droplet (`#10b981`), Burnished Gold (`#d97706`) | Translucent wing-cut silk capelet, gold embroidery, leather boots. |
| **Honeywood Forest** | Lush Canopy Green (`#15803d`), Dawn Sky Azure (`#0284c7`), Earth (`#58240c`) | Warm Sunbeam Gold (`#fef08a`), Moss (`#84cc16`) | Soft morning sunlight, dappled foliage, misty waterfalls. |
| **Hive Corruption** | Viscous Amber (`#f59e0b`), Deep Honey (`#d97706`), Obsidian (`#0f0804`) | Corrupted Ruby (`#ef4444`), Burgundy (`#7f1d1d`) | Glossy dripping nectar, hexagonal wax crystals, shadow veils. |

---

## 3. Character Master Specifications

### 3.1 Princess Aria (`ariaDesignVersion: "2.0"`) — MASTER PRODUCTION SPECIFICATION

> **Authoritative Pipeline Document**: See [`CHARACTER_IMPORT_GUIDE.md`](file:///d:/Princess-Aria/CHARACTER_IMPORT_GUIDE.md).  
> **Archived Procedural Assets**: Preserved for development fallback in `src/assets/art/characters/aria/legacy_procedural/`.  
> All future production art, cinematics, marketing renders, and animation sprites MUST derive directly from this locked design specification.

#### 1. Visual Identity & Archetype
- **Archetype**: Active, courageous royal heroine on a rescue mission to save Batboy from the tyrannical Queen Bee.
- **Personality**: Courageous, adventurous, elegant, compassionate, determined, curious, and playful when safe.
- **Tone**: High-definition hand-painted cinematic 2D platformer art. Illustrated, expressive, clean silhouette, soft painterly shading, controlled specular highlights.

#### 2. Body Proportions & Silhouette
- **Proportions**: 6.2 heads tall. Athletic, agile, nimble adventurer physique.
- **Silhouette Readability**: Unambiguously identifiable from silhouette alone at 48px, 64px, 96px, 128px, and 1080p close-ups.
- **Key Silhouette Markers**:
  1. Distinctive high adventurer ponytail with billowing ponytail plume.
  2. Hexagonal honeycomb tiara with suspended teardrop emerald droplet.
  3. Translucent wing-cut silk capelet creating dual gossamer trails behind movement.
  4. Sculpted dual-petal peplum skirt over ivory underskirt.
  5. Fitted knee-high adventurer boots with clear calf-to-ankle tapered articulation.

#### 3. Facial Identity & Expression Matrix
- **Facial Structure**: Soft oval jawline with gently defined chin; natural nose bridge with subtle warm shading.
- **Eyes**: Warm amber-hazel irises with luminous highlights and clean dark upper lash lines. Expressive, determined, and intelligent.
- **Eyebrows**: Delicately arched, dark chestnut brows capable of strong emotional range.
- **Mouth**: Natural expressive lips; clear readable mouth shapes for close-up dialogue portraits and in-game states.
- **Master Expressions (Locked)**:
  - *Neutral*: Composed, watchful, royal poise.
  - *Smile*: Warm, compassionate, uplifting.
  - *Determined*: Hardened brows, focused gaze, battle-ready.
  - *Surprised*: Widened irises, raised brows, slightly parted mouth.
  - *Worried*: Knitted inner brows, soft concerned gaze.
  - *Angry/Focused*: Tightly set mouth, piercing focused eyes.

#### 4. Hairstyle & Dynamics
- **Color**: Rich warm chestnut-amber hair (`#78350f` base with `#9a3412` and `#d97706` warm golden highlights).
- **Style**: Soft side-swept bangs framing the face, tied into a high adventurer ponytail bound with an ornate gold ring.
- **Animation Reaction**:
  - In *Run*: Hair plume trails 15–20 degrees behind movement with secondary fluid delay.
  - In *Jump*: Hair lifts upward with vertical drag and spreads softly.
  - In *Land*: Hair settles downward with slight squash and bounce.

#### 5. Costume & Royal Attire
- **Bodice / Tunic**: Fitted midnight charcoal/slate tunic (`#1e293b`) with metallic gold embroidered filigree, hexagonal chest plate trim, and soft honey-gold inner lining.
- **Peplum Skirt**: Dual-petal flared peplum in rich amber-gold silk (`#fbbf24`) with honeycomb-embroidered hem, worn over an ivory/cream layered underskirt (`#fefce8`).
- **Silk Capelet**: **MANDATORY RULE: NO physical insect wings growing from Aria's body.** Aria wears a gossamer, semi-translucent wing-cut silk capelet (`#fef08a` with 0.65 opacity) fastened at the golden collar brooch. It billows dynamically during aerial moves and dashing.
- **Headwear / Crown**: Ornate honeycomb royal circlet/tiara crafted from polished brass-gold (`#f59e0b` / `#d97706`) with a single suspended emerald teardrop gemstone (`#10b981`) resting on her forehead.
- **Footwear**: Supple dark brown leather knee-high boots (`#58240c` / `#78350f`) with gold-buckled greaves, reinforced ankles, and flexible traction soles.
- **Arms & Hands**: Ivory-cuffed sleeves with dark leather archer bracers and fingerless golden-trimmed gloves.

#### 6. Authoritative Master Color Palette
| Element | Hex Code | Material & Lighting Role |
| :--- | :--- | :--- |
| **Royal Golden Amber** | `#fbbf24` / `#f59e0b` | Primary peplum skirt, capelet ribbon trim, embroidery. |
| **Ivory Silk** | `#fefce8` / `#fffbeb` | Underskirt, inner sleeve cuffs, soft highlights. |
| **Midnight Charcoal** | `#1e293b` / `#0f172a` | Bodice tunic, structural contrast accents. |
| **Metallic Gold** | `#d97706` / `#b45309` | Honeycomb crown circlet, buckles, embroidery threads. |
| **Emerald Droplet** | `#10b981` / `#059669` | Suspended teardrop gemstone on tiara forehead. |
| **Chestnut Hair** | `#78350f` / `#9a3412` | Hair base and warm golden-amber volume highlights. |
| **Adventurer Leather** | `#58240c` / `#3e1a08` | Knee-high boots, vambraces, belt straps. |
| **Skin Tone** | `#fed7aa` / `#fcd34d` | Warm radiant porcelain with peach-amber ambient warmth. |

#### 7. Lighting & Rendering Rules
- **Key Light**: Warm overhead sunlight (3500K–4500K) casting gentle downward ambient occlusion.
- **Specular Highlights**: Crisp, controlled metallic glints on the gold tiara, boot buckles, and embroidery; satin sheen on silk.
- **Rim Light**: Soft celestial amber edge-lighting separating Aria cleanly from dark forest and cave backgrounds.
- **Shadow**: Self-shadowing under chin, skirt folds, and boot rims with warm violet-tinted darks (`#1e1b4b` at 15% opacity).

#### 8. Prohibited Redesigns & Negative Invariants
- **NEVER** give Aria physical biological insect wings, antennae, stingers, or insect legs.
- **NEVER** make her costume a literal bee mascot suit.
- **NEVER** copy or imitate Mario, Princess Peach, Zelda, Disney princesses, or existing commercial game characters.
- **NEVER** alter her facial structure, eye shape, or hairstyle across different animation states.
- **NEVER** alter the grounding pivot (`anchorX: 0.5, anchorY: 0.95`, foot contact `y = 131` on 138px frame).
- **NEVER** use pixel art, low-res scaling, or generic flat vector styles for production assets.

---

### 3.2 The Queen Bee (Central Antagonist)
- **Archetype**: Enormous, ancient, tyrannical insect queen with royal majesty and terrifying power.
- **Scale**: Dramatic contrast — 4x to 6x the scale of Aria.
- **Appearance**: Obsidian/dark chocolate carapace, natural hive crown spire, glowing ruby-amber compound eyes, massive gossamer wings, royal burgundy mantle, and a stinger dripping glowing corrupted nectar.

### 3.3 Batboy (Captured Hero)
- **Archetype**: Mysterious nocturnal vigilante champion captured by the Queen Bee.
- **Silhouette**: Slender athletic build, distinctive bat-eared cowl, pointed scalloped bat cape folded around his torso, glowing cyan hero emblem visible through crystalline honey stasis.

---

## 4. Environment Production Pipeline

### 4.1 Folder Hierarchy
All world environment assets must strictly reside in:
```
assets/
  art/
    worlds/
      honeywood/
        backgrounds/     -> Sky gradients, celestial backdrops
        parallax/        -> Mountain silhouettes, distant canopies, waterfalls
        terrain/         -> Ground slabs, soil roots, base terrain
        platforms/       -> Grass-topped stone, carved wood, honey wax ledges
        props/           -> Giant honeycombs, sunstone beacons, secret hollows
        vegetation/      -> Giant ancient titan trees, moss tendrils, vines
        structures/      -> Hive spires, ancient royal arches
        hive/            -> Hexagonal hive walls, dripping honey stalactites
        effects/         -> Sunbeams, ambient spore fields, shadow maps
```

### 4.2 Standardized File Naming Convention
- Backgrounds: `honeywood_bg_[descriptor]_[variant#]` (e.g. `honeywood_bg_sky_01.svg`)
- Parallax: `honeywood_parallax_[layer]_[variant#]` (e.g. `honeywood_parallax_mountains_01.svg`)
- Platforms: `honeywood_platform_[type]_[variant#]` (e.g. `honeywood_platform_grass_01.svg`)
- Props: `honeywood_prop_[descriptor]_[variant#]` (e.g. `honeywood_prop_honeycomb_01.svg`)
- Enemies: `enemy_[species]_[state/part]` (e.g. `enemy_honey_beetle_shell.svg`)

---

## 5. Technical Specifications & Resolutions

### 5.1 Resolution Targets
- **Logical Canvas Resolution**: Fixed `1920x1080` (16:9 widescreen aspect ratio).
- **Source Artwork Dimensions**:
  - Full-screen Backgrounds: `2048x1152` or `4096x2304` source master.
  - Parallax Ribbons: `2048x600` or `4096x1200` tiling horizontally.
  - Hero Character Sprites: `512x512` source canvas (in-game footprint: `128x128` to `256x256`).
  - Major Boss Master: `1024x1024` source canvas.
  - Platforms: Width multiples of 120px, height 32px to 140px.

### 5.2 High-DPI Display Handling
- The rendering engine automatically checks `window.devicePixelRatio` (supporting 1.0x, 1.5x, 2.0x for 1080p, 1440p, and 4K UHD).
- All logical coordinate math remains strictly within `1920x1080` units; scaling is applied globally in `Renderer.beginFrame()`.

---

## 6. Animation Guidelines & Production Principles

### 6.1 Core 2D Animation Principles Applied to Aria
1. **Anticipation**: Before dynamic leaps, Aria dips in a 4-frame anticipation crouch (`jump_start`), loading kinetic energy into her legs.
2. **Follow-Through & Overlapping Action**: Her chestnut ponytail plume and silk capelet drag behind body movement with secondary fluid delay, settling only after the body has come to rest.
3. **Squash & Stretch**: Ground impact (`land`, 5 frames) demonstrates clear anatomical squash (6% vertical compression) before immediate spring-like elastic recovery into `idle` or `run`.
4. **Weight & Timing**: Accelerations ramp smoothly; running utilizes 16 fps with ground-strike roll and high push-off stride.
5. **Rigid Ground Foot Alignment**: `anchorX: 0.5`, `anchorY: 0.95` (`y = 131` on the 138px canvas) is invariant across every animation state to eliminate ground floating or sinking.

### 6.2 Authoritative Production Animation Frame Counts & Rates
| State | Frame Count | Target FPS | Loop | Description |
| :--- | :--- | :--- | :--- | :--- |
| **IDLE** | 8 frames | 8 fps | Yes | Organic chest breathing, subtle capelet sway, eye blink on frame 4. |
| **WALK** | 8 frames | 12 fps | Yes | Deliberate exploratory stride with natural weight shift and boot roll. |
| **RUN** | 10 frames | 16 fps | Yes | High-energy forward sprint, 12-degree body lean, trailing capelet. |
| **JUMP_START** | 4 frames | 16 fps | No | Anticipation crouch loading spring energy into knees. |
| **JUMP_RISE** | 4 frames | 12 fps | Yes | Ascending flight with downward billowing capelet and outstretched limbs. |
| **FALL** | 4 frames | 12 fps | Yes | Controlled aerodynamic descent with upward wind resistance on skirt. |
| **LAND** | 5 frames | 16 fps | No | Ground impact squash, boot compression, and elastic spring recovery. |
| **CROUCH** | 4 frames | 8 fps | Yes | Low-profile stance for sliding, sneaking, and ducking projectiles. |
| **DASH** | 6 frames | 16 fps | No | Horizontal aerodynamic burst with golden stardust trail. |
| **HURT** | 4 frames | 14 fps | No | Recoil flinch, defensive arm guard, and immediate balance recovery. |
| **DEATH** | 8 frames | 10 fps | No | Dramatic heroic defeat collapse and crystallizing stasis fade. |
| **VICTORY** | 10 frames | 10 fps | Yes | Celebratory royal spin, confident salute, and compassionate smile. |

---

## 7. Decoupled Asset Architecture (Asset Registry)
Game code must **NEVER** import hard-coded image files directly. All requests query the `AssetRegistry` via logical keys:
```javascript
// Correct:
const runClip = assetRegistry.resolveKey('characters.aria.run');

// Incorrect:
const img = new Image(); img.src = '/assets/aria_run_01.png';
```
This enables zero-code asset hot-swapping between SVG vector prototypes and final 4K digital painted textures.
