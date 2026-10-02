# Project Aria — Title Screen Cinematic Before Audit

**Task Name**: `title-screen-cinematic`  
**Date**: 2026-10-02  
**Target Goal**: Implement a continuous anime cinematic montage / living main menu for the Title Screen while keeping the 256×240 retro pixel platformer gameplay 100% intact.

---

## 1. Current Implementation
The current title screen was built in the previous pass using WebGL / Three.js:
- Implemented in [`src/ui/TitleScreen3D.js`](file:///d:/Princess-Aria/src/ui/TitleScreen3D.js) and coordinated by [`src/game/Game.js`](file:///d:/Princess-Aria/src/game/Game.js).
- Mounts an overlay canvas over `#game-container`.
- Renders a stylized 3D miniature scene:
  - Overlook cliff on the left with a stone brazier and a procedural low-poly Princess Aria figure.
  - Midground low-poly pine trees and rising golden particles.
  - Background celestial moon and Hive Citadel silhouette.
  - Centered HTML title overlay and minimal menu ("BEGIN JOURNEY", "CREDITS").
  - On "BEGIN JOURNEY", fades to black and transfers execution to the 256×240 pixel engine.

---

## 2. Current Visual & Functional Behavior
- **Visuals**: Low-poly procedural 3D WebGL scene. While dynamic, it does not feel like an opening sequence from a fantasy anime adventure game. It lacks illustrated anime cinematic shots, dramatic character expressions, storytelling cuts, and cinematic montage pacing.
- **Interactivity**: Keyboard (Arrow keys, Space/Enter), mouse hover, and click support for "BEGIN JOURNEY" and "CREDITS".
- **Story Communication**: Conveys a mood, but does NOT tell the narrative of Princess Aria, the captured Batboy (Khan), Queen Bee (Fimabi)'s threat, and the journey ahead.

---

## 3. Relevant Files
- [`src/ui/TitleScreen3D.js`](file:///d:/Princess-Aria/src/ui/TitleScreen3D.js): Existing 3D WebGL title screen.
- [`src/game/Game.js`](file:///d:/Princess-Aria/src/game/Game.js): Lifecycle manager for title state and transition to gameplay.
- [`src/audio/AudioManager.js`](file:///d:/Princess-Aria/src/audio/AudioManager.js): Title music and audio context unlock.
- Canonical Art Assets in `src/assets/art/characters/aria/master/`: Reference assets for Princess Aria's face, costume, colors, and crown.

---

## 4. Systems That Must Remain Untouched
- **256×240 Retro Pixel Gameplay Engine**: Physics, collision detection, player movement, enemy behaviors, level geometry, and `PixelRenderer.js`.
- **Level Architecture & Checkpoints**: 8,000px level data and rescue condition.
- **Audio Manager**: Synthesizer and sound effect routines.

---

## 5. Existing Problems
1. The title screen uses low-poly geometric 3D primitives rather than a premium anime cinematic presentation.
2. It lacks narrative storytelling: the player cannot see Batboy's capture, Queen Bee's imposing majesty, or Aria's heroic determination.
3. No film-like editing, crossfades, camera cuts, or montage pacing.

---

## 6. Baseline Measurements & Status
- **Build Status**: `npm run build` succeeds cleanly (exit code 0).
- **Console Errors**: 0 errors.
- **Runtime FPS**: 60 FPS.
- **Before Screenshot**: [`reports/before/title_screen_cinematic_before.png`](file:///d:/Princess-Aria/reports/before/title_screen_cinematic_before.png)

![Title Screen Cinematic Before State](file:///d:/Princess-Aria/reports/before/title_screen_cinematic_before.png)
*Figure: The WebGL 3D title screen before implementing the Anime Cinematic Video Title Screen.*
