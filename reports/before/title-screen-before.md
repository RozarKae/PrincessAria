# Project Aria — Title Screen Before Audit

**Task Name**: `title-screen`  
**Date**: 2026-10-02  
**Target Goal**: Implement a Premium Real-Time 3D Title Screen while preserving the 256x240 minimal pixel platformer gameplay.

---

## 1. Current Implementation
The title screen is currently handled within the 2D canvas pipeline:
- `Game.js` boots directly in `GAME_STATES.TITLE` (or `GAME_STATES.PLAYING` if `?play=true` is in the query params).
- When `state === GAME_STATES.TITLE`, `Game.update()` calls `TitleScreen.update()` and `Game.render()` calls `Renderer.drawTitleScreen(titleScreen, player)`.
- `Renderer.drawTitleScreen()` renders flat 2D shapes into the low-resolution 256x240 internal canvas:
  - Flat dark blue background fill (`#090d16`).
  - Flat forest and earth color bands (`#0c381e`, `#5c3a21`).
  - Monospace 2D text: "PRINCESS ARIA", "THE RESCUE OF BATBOY", and blinking "PRESS SPACE / ENTER".
  - Centered stone plinth with a tiny 16x22 pixel Aria sprite.
  - Distant Queen Bee represented by two small red pixel squares (`#ef4444`).
- Any mouse click, touch, or Space/Enter press immediately transitions to `GAME_STATES.PLAYING`.

---

## 2. Current Visual & Functional Behavior
- **Visuals**: Flat, static 2D retro canvas at 256x240. No 3D depth, no real-time perspective, no atmospheric depth, no cinematic camera motion, no interactive menu choices.
- **Interactivity**: Single un-styled prompt "PRESS SPACE / ENTER" blinking every 450ms. Clicking anywhere or pressing Space/Enter abruptly switches `this.state` to `PLAYING`.
- **Audio**: Title theme BGM triggers on first user interaction.

---

## 3. Relevant Files
- [`src/ui/TitleScreen.js`](file:///d:/Princess-Aria/src/ui/TitleScreen.js): Legacy 2D TitleScreen class with particle sparkles and preview entity instances.
- [`src/renderer/Renderer.js`](file:///d:/Princess-Aria/src/renderer/Renderer.js): Contains `drawTitleScreen()` rendering flat retro graphics to the internal 256x240 canvas.
- [`src/game/Game.js`](file:///d:/Princess-Aria/src/game/Game.js): Manages game loop, state transitions between `TITLE` and `PLAYING`, and user input triggers.
- [`src/game/Constants.js`](file:///d:/Princess-Aria/src/game/Constants.js): Defines `GAME_STATES.TITLE`.
- [`package.json`](file:///d:/Princess-Aria/package.json): Lists current project dependencies (Vite only, no 3D library currently installed).

---

## 4. Systems That Must Remain Untouched
- **Pixel Gameplay Engine**: All gameplay physics, collision, player movement, enemy logic, and the 256x240 `PixelRenderer` pipeline must remain 100% untouched.
- **Audio Manager**: Background music triggers and sound effects.
- **Level Architecture**: 8,000px level structure, landmarks, checkpoints, and rescue conditions.

---

## 5. Existing Problems
1. The title screen does not feel like an opening screen of a modern premium console adventure game.
2. It lacks 3D depth, cinematic perspective, and lighting.
3. No camera motion or atmospheric depth.
4. No styled menu navigation (only a raw "PRESS SPACE / ENTER" prompt).
5. No transition effect when entering gameplay (abrupt state switch).

---

## 6. Existing Errors & Warnings
- Console Errors: **0**
- Build Errors: **0** (Vite builds cleanly in ~904ms)
- Asset Loading Failures: **0**

---

## 7. Baseline Measurements
- **Build Time**: 904ms (`npm run build`)
- **Bundle Size**: `index.js` = 415.65 kB, `index.css` = 0.81 kB
- **Runtime FPS**: 60 FPS (stable 60 Hz rAF)
- **Draw Calls**: NOT MEASURED (2D Canvas pipeline)
- **Memory Footprint**: NOT MEASURED

---

## 8. Baseline Visual Capture
- **Before Screenshot**: [`reports/before/title_screen_before.png`](file:///d:/Princess-Aria/reports/before/title_screen_before.png)

![Title Screen Before State](file:///d:/Princess-Aria/reports/before/title_screen_before.png)
*Figure: The baseline flat 2D title screen before 3D implementation.*
