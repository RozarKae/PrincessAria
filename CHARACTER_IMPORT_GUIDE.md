# PRINCESS ARIA — CHARACTER IMPORT GUIDE (ILLUSTRATED ART PIPELINE)
**Version:** 2.0.0  
**Project:** D:\Princess-Aria  
**Architecture:** Decoupled High-Definition 2D Engine with Hierarchical Layered Rig & Frame Sequence Support  

---

## 1. Overview & Art Philosophy

The Princess Aria engine has transitioned from procedural vector prototypes to a **Professional Hand-Illustrated 2D Character Pipeline**. 

The game engine **NEVER visually constructs the character from geometric code primitives**. Instead:
```
ILLUSTRATED ART ASSETS (PNG/WebP)
              ↓
        ASSET MANAGER
              ↓
  CHARACTER RIG / ANIMATION CLIP
              ↓
            PLAYER
              ↓
          GAME VIEW
```

---

## 2. Supported Production Pipelines

The engine supports two production methods for characters:

### Method A: Hierarchical Layered 2D Rig Animation
- The character is split into individual illustrated transparent body parts (layers).
- The engine's `CharacterRig` orchestrates hierarchical bone transforms (`position`, `rotation`, `scale`, `anchor`, `z-order`, `opacity`).
- **Advantage**: Extreme fluidity, zero visual inconsistency, lightweight memory footprint, seamless dynamic physics reactions (capelet wind, hair rebound).

### Method B: Artist-Created Frame Sequences
- Complete, hand-illustrated full-body character animation frames derived strictly from the **MASTER ARIA DESIGN v2.0**.
- **Advantage**: Full frame-by-frame illustrated animation with custom painterly poses and dramatic keyframes.

---

## 3. Directory Structure

Place all new illustrated assets into the structured folders under `src/assets/art/characters/aria/`:

```text
src/assets/art/characters/aria/
├── master/                          <- Master reference turnaround & facial matrices (2048px+)
│   ├── aria_master_concept.png      <- Authoritative master visual reference
│   ├── turnaround_front.png         <- Front orthographic view
│   ├── turnaround_three_quarter.png <- 3/4 front perspective
│   ├── turnaround_side.png          <- Side profile view
│   ├── turnaround_three_quarter_back.png
│   ├── turnaround_back.png          <- Back orthographic view
│   └── facial_expressions/          <- Expression studies (Neutral, Smile, Determined, etc.)
│
├── layers/                          <- Method A: Layered illustrated rig parts (Transparent PNG)
│   ├── aria_head.png
│   ├── aria_face_neutral.png
│   ├── aria_face_determined.png
│   ├── aria_hair_front.png
│   ├── aria_hair_back.png
│   ├── aria_crown.png
│   ├── aria_torso.png
│   ├── aria_dress.png
│   ├── aria_capelet.png
│   ├── aria_arm_left.png
│   ├── aria_arm_right.png
│   ├── aria_hand_left.png
│   ├── aria_hand_right.png
│   ├── aria_leg_left.png
│   ├── aria_leg_right.png
│   ├── aria_boot_left.png
│   ├── aria_boot_right.png
│   └── aria_accessories.png
│
├── animation/                       <- Method B: High-res illustrated frame sequences (Transparent PNG/WebP)
│   ├── idle/         (8 frames: frame_0.png .. frame_7.png)
│   ├── walk/         (8 frames: frame_0.png .. frame_7.png)
│   ├── run/          (10 frames: frame_0.png .. frame_9.png)
│   ├── jump_start/   (4 frames: frame_0.png .. frame_3.png)
│   ├── jump_rise/    (4 frames: frame_0.png .. frame_3.png)
│   ├── fall/         (4 frames: frame_0.png .. frame_3.png)
│   ├── land/         (5 frames: frame_0.png .. frame_4.png)
│   ├── crouch/       (4 frames: frame_0.png .. frame_3.png)
│   ├── dash/         (6 frames: frame_0.png .. frame_5.png)
│   ├── hurt/         (4 frames: frame_0.png .. frame_3.png)
│   ├── death/        (8 frames: frame_0.png .. frame_7.png)
│   └── victory/      (10 frames: frame_0.png .. frame_9.png)
│
└── legacy_procedural/               <- Archived procedural vector assets (Dev fallback only)
```

---

## 4. Technical Specifications

### 4.1 Resolution Requirements
* **Master Concept & Turnaround Artwork**: `2048 x 2048 px` to `4096 x 4096 px` lossless PNG.
* **Runtime Full-Body Animation Frames**: `256 x 256 px` or `512 x 512 px` (normalized canvas `138 x 138 px` logical platformer scale).
* **Layered Rig Parts**: Exported on transparent canvas fitting their bounding proportion at 2x resolution (`256 x 256 px` per part).

### 4.2 Format & Transparency
* **Format**: 32-bit PNG with clean alpha channel (`RGBA8888`), or high-quality lossless WebP (`quality: 95+`).
* **Transparency**: 100% clean transparent background. No white halos, no baked backgrounds, no colored fringe, and **NO baked drop shadows**.
* **Shadows**: Shadows are rendered dynamically by the engine's physical shadow system (ground contact, landing squash, and jump altitude scaling).

### 4.3 Pivot Points & Ground Alignment
* **Character Root Anchor**: `anchorX: 0.5`, `anchorY: 0.95`.
* Feet contact must strictly touch the normalized baseline `y = 131` on the `138 x 138` logical canvas.
* Frame sequences must not float or sink between frames.

---

## 5. Layer Naming & Hierarchy (Method A: Rig)

When supplying layered artwork for the 2D skeletal rig, name the files strictly according to this standard:

| Layer Name | File Name | Parent Node | Default Z-Order | Description |
| :--- | :--- | :--- | :---: | :--- |
| `ROOT` | *(Virtual)* | `null` | 0 | Ground contact origin (`0.5, 0.95`) |
| `TORSO` | `aria_torso.png` | `ROOT` | 0 | Midnight charcoal bodice with gold filigree |
| `DRESS` | `aria_dress.png` | `TORSO` | 2 | Amber-gold peplum skirt & ivory underskirt |
| `CAPELET` | `aria_capelet.png` | `TORSO` | -6 | Translucent wing-cut silk capelet |
| `HAIR_BACK` | `aria_hair_back.png`| `TORSO` | -8 | Chestnut adventurer ponytail plume |
| `LEG_LEFT` | `aria_leg_left.png` | `TORSO` | -4 | Background thigh & knee |
| `BOOT_LEFT` | `aria_boot_left.png`| `LEG_LEFT` | -3 | Background knee-high leather boot |
| `LEG_RIGHT` | `aria_leg_right.png`| `TORSO` | 4 | Foreground thigh & knee |
| `BOOT_RIGHT`| `aria_boot_right.png`| `LEG_RIGHT`| 5 | Foreground knee-high leather boot with gold buckles |
| `ARM_LEFT` | `aria_arm_left.png` | `TORSO` | -2 | Background arm & sleeve |
| `HAND_LEFT` | `aria_hand_left.png`| `ARM_LEFT` | -1 | Background hand |
| `ARM_RIGHT` | `aria_arm_right.png`| `TORSO` | 15 | Foreground arm & archer bracer |
| `HAND_RIGHT`| `aria_hand_right.png`| `ARM_RIGHT`| 16 | Foreground hand holding royal star wand |
| `HEAD` | `aria_head.png` | `TORSO` | 10 | Head shape, neck, and ears |
| `FACE` | `aria_face_*.png` | `HEAD` | 11 | Expressive eyes, eyebrows, nose, and lips |
| `CROWN` | `aria_crown.png` | `HEAD` | 12 | Honeycomb gold tiara with emerald droplet |
| `HAIR_FRONT`| `aria_hair_front.png`| `HEAD` | 13 | Side-swept bangs framing face |
| `ACCESSORIES`| `aria_accessories.png`| `HEAD` | 14 | Collar brooch and star jewelry |

---

## 6. Animation States & Frame Sequences (Method B)

If exporting full frame-by-frame animation sequences:

| State Directory | Frames | Target FPS | Loop | Essential Animation Action |
| :--- | :---: | :---: | :---: | :--- |
| `animation/idle/` | 8 | 8 fps | Yes | Organic breathing, subtle capelet drift, eye blink on frame 4 |
| `animation/walk/` | 8 | 12 fps | Yes | Confident exploratory stride, natural foot plant & roll |
| `animation/run/` | 10 | 16 fps | Yes | Athletic sprint, 12° forward lean, ponytail trailing |
| `animation/jump_start/` | 4 | 16 fps | No | Anticipation crouch loading spring energy into knees |
| `animation/jump_rise/` | 4 | 12 fps | Yes | Dynamic upward ascension, billowing skirt & capelet |
| `animation/fall/` | 4 | 12 fps | Yes | Controlled aerodynamic fall with upward wind drag |
| `animation/land/` | 5 | 16 fps | No | Anatomical squash & stretch, boot impact, spring rebound |
| `animation/crouch/` | 4 | 8 fps | Yes | Low-profile stance for sliding & dodging hazards |
| `animation/dash/` | 6 | 16 fps | No | Aerodynamic horizontal burst with trailing ribbon lines |
| `animation/hurt/` | 4 | 14 fps | No | Recoil flinch, defensive arm guard, immediate balance recovery |
| `animation/death/` | 8 | 10 fps | No | Dramatic defeat collapse into amber crystal stasis |
| `animation/victory/` | 10 | 10 fps | Yes | Royal celebratory twirl, wand salute, warm triumphant smile |

---

## 7. How the Engine Loads the Artwork

1. **Auto-Discovery**: Vite's `import.meta.glob('/src/assets/**/*.{png,webp,svg}')` automatically bundles and preloads all images placed in `src/assets/art/characters/aria/`.
2. **Registry Mapping**: Logical keys are configured in [`src/assets/assets.json`](file:///d:/Princess-Aria/src/assets/assets.json):
   ```json
   "ariaProduction": {
     "designVersion": "2.0",
     "masterConcept": "art/characters/aria/master/aria_master_concept",
     "idle": "art/characters/aria/animation/idle",
     "run": "art/characters/aria/animation/run"
   }
   ```
3. **Runtime Asset Resolution**:
   - `assetManager.getFrameSequence('aria', 'run', 10)` loads PNG/WebP files directly.
   - When layers exist in `layers/`, `player.rig.setLayerImage('TORSO', img)` automatically binds the illustrated texture to the skeletal node.
4. **Render Mode Toggle**: Pressing **`[F2]`** during gameplay instantly cycles between:
   - `DEV_FALLBACK`: Uses archived procedural graphics with dev watermark.
   - `SILHOUETTE`: Neutral temporary heroic silhouette.
   - `RIG`: Method A layered 2D rig animation.
   - `FRAME_SEQUENCE`: Method B artist-created transparent frame sequences.

---

## 8. Checklist for Importing New Art

- [ ] All assets are transparent PNG or WebP with zero background fringes.
- [ ] No physical insect wings growing from Aria's body; capelet is silk fabric.
- [ ] No insect antennae; royal circlet has suspended emerald gemstone.
- [ ] Foot contact points aligned precisely to `y = 131` on standard canvas.
- [ ] Master artwork delivered at 2048px minimum for archival and close-up portraits.
- [ ] Run `npm run build` to verify zero bundling or missing asset errors.
