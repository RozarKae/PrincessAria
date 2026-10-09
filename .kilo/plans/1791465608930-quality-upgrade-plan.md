# Princess Aria — Quality Upgrade Plan

## Executive Summary

Transform the codebase from a functional prototype into a maintainable, scalable, production-quality game engine with modern tooling, type safety, testing, and developer experience.

---

## Current State Assessment

| Area | Status | Risk |
|------|--------|------|
| **Architecture** | Monolithic classes (Game.js: 812 lines, Player.js: 1173 lines, Level.js: 1100+) | High — hard to modify, test, debug |
| **Type Safety** | Pure JS, no static typing, magic strings everywhere | High — runtime errors, refactoring risk |
| **Testing** | 1 test file (23 assertions), no CI | Critical — no regression protection |
| **Code Style** | No ESLint/Prettier, inconsistent patterns | Medium — maintenance friction |
| **Performance** | No object pooling, per-frame allocations, O(n²) collision | Medium — frame drops at scale |
| **Asset Pipeline** | Manual glob + fallback URLs, no validation | Medium — missing assets at runtime |
| **DX/Tooling** | No HMR for game logic, scattered debug keys | Medium — slow iteration |
| **Error Handling** | Console.warn, no boundaries | Medium — silent failures |
| **Accessibility** | None | Low — excluded players |
| **Documentation** | Inline only, no architecture/API docs | Low — onboarding barrier |

---

## Phase 1: Foundation & Tooling (Week 1-2)

### 1.1 TypeScript Migration
- [ ] Add `typescript`, `ts-node`, `@types/node` to devDependencies
- [ ] Create `tsconfig.json` with strict mode, ESNext modules, DOM lib
- [ ] Migrate `src/game/Constants.js` → `Constants.ts` (export const enums, typed bindings)
- [ ] Migrate `src/game/GameState.ts`, `src/physics/Physics.ts`, `src/physics/Collision.ts`
- [ ] Define shared interfaces: `IEntity`, `ILevel`, `IInput`, `IAudio`, `IRenderer`
- [ ] Enable `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`

### 1.2 Linting & Formatting
- [ ] Add `eslint`, `@typescript-eslint`, `prettier`, `eslint-plugin-import`
- [ ] Create `.eslintrc.json` with recommended rules + game-specific (no console.log in prod)
- [ ] Create `.prettierrc` (2-space, single quotes, trailing commas)
- [ ] Add `lint`, `format`, `format:check` scripts to package.json
- [ ] Run auto-fix on entire codebase

### 1.3 Build & CI Pipeline
- [ ] Add `vitest` for unit testing (compatible with Vite)
- [ ] Create `vitest.config.ts` with jsdom environment
- [ ] Add GitHub Actions workflow: `lint`, `typecheck`, `test`, `build`
- [ ] Configure `npm run check` = `lint && typecheck && test`

---

## Phase 2: Core System Refactoring (Week 2-4)

### 2.1 Game Loop & State Machine
- [ ] Extract `GameLoop` class (fixed timestep, accumulator, RAF management)
- [ ] Extract `GameStateMachine` with typed states (`Title`, `WorldIntro`, `Playing`, `Defeated`, `GameOver`, `LevelClear`, `WorldOutro`)
- [ ] Move state transition logic out of `Game.fixedUpdate()` into state machine
- [ ] Add `onEnter`/`onExit`/`update` hooks per state

### 2.2 Entity System Architecture
- [ ] Create `Entity` base class with `id`, `active`, `components` map
- [ ] Implement `Component` interface (`update(dt)`, `draw(ctx)`)
- [ ] Extract `PhysicsComponent`, `AnimationComponent`, `AIComponent`, `CollisionComponent`
- [ ] Create `EntityManager` for spawn/despawn, queries, spatial indexing
- [ ] Refactor `Player`, `Enemy`, `MovingPlatform` to use component composition

### 2.3 Input System
- [ ] Create `InputAction` enum (type-safe action names)
- [ ] Extract `KeyboardMapper`, `GamepadMapper` classes
- [ ] Add `InputContext` for device-isolated queries
- [ ] Implement rebindable controls with persistence

### 2.4 Physics & Collision
- [ ] Add spatial hash grid for broad-phase collision (reduce O(n²))
- [ ] Implement object pooling for `Particle`, `StarProjectile`, `SlashParticle`
- [ ] Create `CollisionWorld` with static/dynamic body separation
- [ ] Add continuous collision detection for fast-moving entities

---

## Phase 3: Data-Driven Design (Week 3-4)

### 3.1 Level Data Schema
- [ ] Define JSON Schema for level data (`level.schema.json`)
- [ ] Validate `LevelData.ts` against schema at build time
- [ ] Move all hardcoded platform/enemy/pickup data to JSON files per world
- [ ] Create `LevelLoader` with schema validation + helpful errors

### 3.2 Enemy Archetypes
- [ ] Extract enemy definitions to `data/enemies/*.json` (stats, AI params, telegraph timings)
- [ ] Create `EnemyFactory` that builds from data + behavior scripts
- [ ] Replace `HoneyBeetle.setupStates()` override pattern with data-driven state config

### 3.3 Animation Data
- [ ] Move animation frame counts, fps, anchors to `data/animations/aria.json`
- [ ] Create `AnimationRegistry` for runtime lookup
- [ ] Remove magic numbers from `Player.setupAnimations()`

### 3.4 Audio Scene Definitions
- [ ] Extract `SCENE_THEMES` to `data/audio/scenes.json`
- [ ] Create `AudioSceneConfig` type with tempo, intensity curves, instrument layers
- [ ] Data-drive `updateMusicDirector()` scene/intensity logic

---

## Phase 4: Testing Infrastructure (Week 3-4)

### 4.1 Unit Tests (Target: 80% coverage on core)
| Module | Test Focus |
|--------|------------|
| `Physics` | Horizontal movement, gravity, friction, edge cases |
| `Collision` | AABB, circle-rect, platform resolution, moving platforms |
| `GameState` | Lives, HP, score, high score persistence |
| `Input` | Key mappings, justPressed/justReleased, gamepad |
| `AudioManager` | Bus routing, volume, mute, biome switching |
| `EnemyStateMachine` | Transitions, timers, token requests |
| `LevelDirector` | Pacing beats, template selection, telemetry |
| `AssetManager` | Loading, caching, fallback generation |

### 4.2 Integration Tests
- [ ] Full game loop tick (fixedUpdate + render) with mocked canvas
- [ ] Player death → Defeated → Continue flow
- [ ] Level complete → World advance flow
- [ ] Checkpoint activation → respawn preservation

### 4.3 Visual Regression (Optional)
- [ ] Add `playwright` + `pixelmatch` for render output comparison
- [ ] Snapshot key screens: Title, Gameplay, HUD, GameOver, Victory

---

## Phase 5: Performance & Polish (Week 4-5)

### 5.1 Rendering Optimizations
- [ ] Batch draw calls by texture/shader (Atlas for pixel art)
- [ ] Implement dirty rect rendering for static background layers
- [ ] Add `requestAnimationFrame` scheduling with `scheduler.postTask` priority
- [ ] Profile with Chrome DevTools Performance tab; target < 8ms/frame

### 5.2 Memory Management
- [ ] Object pools: `ParticlePool`, `ProjectilePool`, `EnemyPool`
- [ ] WeakRef caches for assets with LRU eviction
- [ ] Dispose pattern for level unload (remove event listeners, clear timers)

### 5.3 Asset Pipeline
- [ ] Generate asset manifest at build time (`asset-manifest.json`)
- [ ] Add `asset:validate` script (check all refs exist, no duplicates)
- [ ] Compress SVGs with SVGO, generate WebP fallbacks
- [ ] Preload critical path assets (player, first level) with priority hints

---

## Phase 6: Developer Experience (Week 4-5)

### 6.1 Debug Tools
- [ ] Create `DebugOverlay` singleton (F1 toggle) with:
  - Entity inspector (click entity → show state, health, AI)
  - Performance graphs (FPS, frame time, entity count, draw calls)
  - Physics debug (collision boxes, velocity vectors, ground contacts)
  - Audio debug (active voices, biome, intensity)
  - Level director log (decisions, pacing beat, active interventions)
- [ ] Add `?debug=true` URL param for auto-open

### 6.2 Hot Module Replacement
- [ ] Configure Vite HMR for game systems (accept `Game`, `Level`, `Player`)
- [ ] Preserve game state on HMR (serialize/restore `GameState`, `Player`)

### 6.3 Logging & Telemetry
- [ ] Structured logger (`log.debug`, `log.info`, `log.warn`, `log.error`)
- [ ] Redact in production build
- [ ] Telemetry events: `level_start`, `level_complete`, `death`, `secret_found`, `boss_defeated`

---

## Phase 7: Accessibility & Polish (Week 5-6)

### 7.1 Accessibility
- [ ] Screen reader announcements for state changes (ARIA live regions)
- [ ] High contrast mode (CSS filter + canvas recolor)
- [ ] Color blind palettes (protanopia, deuteranopia, tritanopia)
- [ ] Remappable controls UI (Settings screen)
- [ ] Reduced motion option (disable screen shake, particle bursts)

### 7.2 Settings & Persistence
- [ ] `SettingsManager` with localStorage sync
- [ ] Categories: Video, Audio, Controls, Accessibility, Gameplay
- [ ] Import/Export settings JSON

### 7.3 Error Boundaries
- [ ] Global `window.onerror` + `unhandledrejection` handler
- [ ] Friendly error screen with "Report Bug" button (copies context to clipboard)
- [ ] Graceful degradation: disable audio if Web Audio fails, disable WebGL if context lost

---

## Deliverables & Validation

| Phase | Deliverable | Validation |
|-------|-------------|------------|
| 1 | `npm run check` passes | CI green on PR |
| 2 | Refactored `Game`, `Entity`, `Input`, `Physics` | All tests pass, no regressions |
| 3 | Data-driven levels/enemies/animations/audio | Schema validation passes, content editable without code |
| 4 | Test suite (80% core coverage) | `npm run test` ≥ 80% lines |
| 5 | < 8ms/frame on mid-tier device | Chrome Performance trace |
| 6 | HMR working, debug overlay functional | Manual verification |
| 7 | Accessibility audit (axe-core) | 0 violations WCAG AA |

---

## Open Questions for User

1. **Scope Priority**: Which phases are must-have vs nice-to-have? (e.g., Phase 7 accessibility may be deferred)
2. **TypeScript Strictness**: Target `strict: true` or gradual (`strictNullChecks` first)?
3. **Testing Framework**: `vitest` (Vite-native) or `jest`? (Recommend vitest)
4. **CI Provider**: GitHub Actions only, or also local pre-commit hooks (husky)?
5. **Asset Pipeline**: Keep manual glob + fallback, or migrate fully to Vite `import.meta.glob` with plugin?
6. **Entity Architecture**: Full ECS (bitmasks, archetypes) or lightweight component composition? (Recommend lightweight)
7. **Performance Target**: Target device spec? (e.g., 60fps on 2018 laptop, 30fps on 2015 mobile)

---

## Recommended First Step

Start with **Phase 1.1–1.3** (TypeScript + Lint + CI) — this enables safe refactoring for all subsequent phases. The migration can be done incrementally file-by-file with `allowJs: true` in tsconfig.