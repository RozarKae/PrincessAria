import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { Collision } from '../physics/Collision.js';

/**
 * FOREST KING
 * Canonical Boss of World 2: The Whispering Forest
 * 
 * Production-Grade 3-Phase Titan Climax Boss:
 * - Immovable colossal ancient oak corrupted by dark purple root magic
 * - Phase 1 (HP 7-6): Left & Right Corrupted Branch Root Cores exposed (Heart Crown shielded)
 *                     Root Quake slams kicking up ground brambles
 * - Phase 2 (HP 5-3): Both Branch Root Cores severed; Heart Crown shield falls!
 *                     Enraged Spore Storm (bursts of tracking bioluminescent spore bombs)
 * - Phase 3 (HP 2-1): Corrupted Heart Crown frenzy! High-frequency root tremors,
 *                     dense canopy spore barrages, and pulsating purple corruption rings
 * 
 * Features:
 * - Arena Boundary lock-in at x: 9740 - 10640 with Thorny Briar Barrier Gates
 * - High-definition Boss Health Bar with Phase display in the HUD
 * - Bouncy Mushrooms in arena to launch Aria into the canopy
 * - Cinematic Awakening & Sacred Purification Sequence unlocking portal to World 3
 */
export class ForestKing extends Enemy {
  constructor(x, y) {
    super(x, y, 220, 320, {
      name: 'Forest King',
      species: 'forest_king',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 5,
      counterHint: 'Bounce on mushrooms to strike corrupted branch nodes; once both break, assault the Heart Crown!',
      telegraphDesc: 'Trunk tremors and pulsating dark purple root veins anticipate massive root slams',
      movementStyle: 'Rooted colossal titan with canopy spore storms and ground bramble tremors',
      attackStyle: 'Root quake tremors, tracking spore showers, & bramble shockwaves',
      recoveryDesc: 'Root exhaustion state after heavy quake slams',
      environmentalPreference: 'The Ancient Sacred Grove',
      health: 7, // 2 (Left Root) + 2 (Right Root) + 3 (Heart Crown)
      maxHealth: 7,
      damage: 1,
      speed: 0,
      gravity: 0,
      isFlying: true,
      detectionRange: 850,
      scoreValue: 6000,
    });

    this.maxHealth = 7;
    this.health = 7;
    this.phase = 1;

    // Arena lock & encounter state
    this.isArenaActive = false;
    this.introTimer = 0;
    this.introDuration = 2.4;
    this.introComplete = false;
    this.isPurified = false;
    this.hitFlashTimer = 0;

    // 3 Authored Corrupted Root Cores
    this.cores = [
      { id: 'left_root', name: 'Left Root Node', x: x - 130, y: y + 90, width: 48, height: 48, hp: 2, maxHp: 2, severed: false, shielded: false },
      { id: 'right_root', name: 'Right Root Node', x: x + 170, y: y + 90, width: 48, height: 48, hp: 2, maxHp: 2, severed: false, shielded: false },
      { id: 'heart_crown', name: 'Heart Crown Core', x: x + 30, y: y - 85, width: 60, height: 60, hp: 3, maxHp: 3, severed: false, shielded: true },
    ];

    // Attacks & Timing
    this.quakeTimer = 0;
    this.quakeInterval = 3.8;
    this.isQuaking = false;
    this.quakeDuration = 0.8;
    this.sporeStormTimer = 0;
    this.spores = [];

    // Thorny Briar Gates sealing the arena
    this.gateWest = { x: 9720, y: 460, width: 32, height: 460, alpha: 0 };
    this.gateEast = { x: 10660, y: 460, width: 32, height: 460, alpha: 0 };
  }

  update(dt, level, player, camera) {
    // 1. If Purified, celebrate victory and remain peaceful
    if (this.isPurified) {
      this.gateWest.alpha = Math.max(0, this.gateWest.alpha - dt * 1.5);
      this.gateEast.alpha = Math.max(0, this.gateEast.alpha - dt * 1.5);

      if (level && Math.random() < 0.25) {
        level.spawnSparkles(this.x + 40 + Math.random() * 140, this.y + Math.random() * 180, 2);
      }
      return;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // 2. Trigger Arena Lock-in when Aria enters Sacred Grove
    if (!this.isArenaActive && player && player.x >= 9750 && player.x <= 10650) {
      this.isArenaActive = true;
      this.introTimer = this.introDuration;
      if (camera) camera.focus(this.x + 110, this.y + 140, 2.4);
      if (camera) camera.shake(14, 0.8);
      if (level && level.spawnBurst) {
        level.spawnBurst(this.x + 110, this.y + 100, 36, '#d946ef');
      }
    }

    // Clamp player within arena bounds while active
    if (this.isArenaActive && !this.isPurified) {
      this.gateWest.alpha = Math.min(1.0, this.gateWest.alpha + dt * 2.0);
      this.gateEast.alpha = Math.min(1.0, this.gateEast.alpha + dt * 2.0);

      if (player && player.x < 9750) {
        player.x = 9750;
        player.vx = Math.max(0, player.vx);
      } else if (player && player.x > 10620) {
        player.x = 10620;
        player.vx = Math.min(0, player.vx);
      }
    }

    // Intro roar
    if (this.introTimer > 0) {
      this.introTimer -= dt;
      if (this.introTimer <= 0) {
        this.introComplete = true;
      }
      return;
    }

    // 3. Phase Transition Logic
    const branchesSevered = this.cores[0].severed && this.cores[1].severed;
    if (branchesSevered && this.cores[2].shielded) {
      // Lower shield on Heart Crown -> Phase 2!
      this.cores[2].shielded = false;
      this.phase = 2;
      this.quakeInterval = 3.0; // Faster attacks
      if (camera && camera.shake) camera.shake(16, 0.6);
      if (level && level.spawnBurst) {
        level.spawnBurst(this.cores[2].x + 30, this.cores[2].y + 30, 32, '#c026d3');
        level.spawnSparkles(this.cores[2].x + 30, this.cores[2].y + 30, 24);
      }
    }

    // Phase 3 trigger when Heart Crown has only 1 HP remaining
    if (this.cores[2].hp <= 1 && !this.cores[2].severed && this.phase < 3) {
      this.phase = 3;
      this.quakeInterval = 2.4; // Frenzied quakes
      if (camera && camera.shake) camera.shake(18, 0.7);
      if (level && level.spawnBurst) {
        level.spawnBurst(this.x + 110, this.y + 140, 40, '#a855f7');
      }
    }

    // 4. Update Spores
    this.updateSpores(dt, level, player);

    // 5. Spore Storm Cycle (Phase 2 and 3)
    if (this.phase >= 2) {
      this.sporeStormTimer += dt;
      const stormInterval = this.phase === 3 ? 2.8 : 3.8;
      if (this.sporeStormTimer >= stormInterval) {
        this.sporeStormTimer = 0;
        this.launchSporeStorm(level);
      }
    }

    // 6. Root Quake Attack Cycle
    this.quakeTimer += dt;
    if (this.quakeTimer >= this.quakeInterval) {
      this.quakeTimer = 0;
      this.triggerRootQuake(level, camera, player);
    }

    // 7. Process Player Melee Attacks against vulnerable cores
    if (player && player.isAttacking && player.getAttackBounds) {
      const atk = player.getAttackBounds();
      this.cores.forEach(core => {
        if (!core.severed && !core.shielded) {
          if (Collision.intersects(atk, core)) {
            this.damageCore(core, 1, level, camera);
          }
        }
      });
    }

    // 8. Synchronize Total Boss Health
    let currentTotalHp = 0;
    this.cores.forEach(c => {
      if (!c.severed) currentTotalHp += c.hp;
    });
    this.health = currentTotalHp;

    // Check Victory Condition (All 3 cores severed)
    if (this.cores[0].severed && this.cores[1].severed && this.cores[2].severed) {
      this.purify(level, camera);
    }
  }

  damageCore(core, amount, level, camera) {
    if (core.severed || core.shielded) return;

    core.hp -= amount;
    this.hitFlashTimer = 0.2;

    if (level && level.spawnBurst) {
      level.spawnBurst(core.x + core.width / 2, core.y + core.height / 2, 18, '#d946ef');
      level.spawnBurst(core.x + core.width / 2, core.y + core.height / 2, 10, '#38bdf8');
    }
    if (camera && camera.shake) camera.shake(9, 0.2);

    if (core.hp <= 0) {
      core.hp = 0;
      core.severed = true;
      if (level && level.spawnSparkles) {
        level.spawnSparkles(core.x + core.width / 2, core.y + core.height / 2, 36);
        level.spawnBurst(core.x + core.width / 2, core.y + core.height / 2, 28, '#22c55e');
      }
    }
  }

  triggerRootQuake(level, camera, player) {
    if (camera && camera.shake) camera.shake(14, 0.5);

    // Kicks up dust and brambles along arena floor (x: 9700 - 10600)
    if (level && level.spawnDust) {
      for (let px = 9760; px <= 10600; px += 75) {
        level.spawnDust(px, 880, 5);
      }
    }

    // Ground shockwave hurts player if they are standing on ground floor!
    if (player && player.isGrounded && player.y >= 830) {
      player.hurt();
    }
  }

  launchSporeStorm(level) {
    const startX = this.x + 110;
    const startY = this.y - 40;
    const count = this.phase === 3 ? 4 : 2;

    for (let i = 0; i < count; i++) {
      const spreadAngle = (i - (count - 1) / 2) * 0.45;
      const speed = 260 + Math.random() * 80;
      const vx = Math.sin(spreadAngle) * speed;
      const vy = -Math.cos(spreadAngle) * speed * 0.8;

      this.spores.push({
        x: startX,
        y: startY,
        vx: vx,
        vy: vy,
        radius: 10,
        lifetime: 3.0,
      });
    }

    if (level && level.spawnBurst) {
      level.spawnBurst(startX, startY, 16, '#c084fc');
    }
  }

  updateSpores(dt, level, player) {
    for (let i = this.spores.length - 1; i >= 0; i--) {
      const s = this.spores[i];
      s.vy += 320 * dt; // Gentle floaty descent
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.lifetime -= dt;

      // Check collision with player
      if (player && !player.isDead) {
        const pBounds = player.getBounds ? player.getBounds() : { x: player.x, y: player.y, width: player.width, height: player.height };
        const dist = Math.hypot(s.x - (pBounds.x + pBounds.width / 2), s.y - (pBounds.y + pBounds.height / 2));
        if (dist < s.radius + 18) {
          player.hurt();
          s.lifetime = 0;
          if (level && level.spawnBurst) {
            level.spawnBurst(s.x, s.y, 14, '#d946ef');
          }
        }
      }

      if (s.lifetime <= 0 || s.y > 900) {
        if (level && level.spawnDust) {
          level.spawnDust(s.x, s.y, 3);
        }
        this.spores.splice(i, 1);
      }
    }
  }

  purify(level, camera) {
    if (this.isPurified) return;
    this.isPurified = true;
    this.isDead = true;
    this.health = 0;

    if (level && level.spawnSparkles) {
      level.spawnSparkles(this.x + 110, this.y + 120, 80);
      level.spawnBurst(this.x + 110, this.y + 120, 50, '#22c55e');
      level.spawnBurst(this.x + 110, this.y + 120, 30, '#38bdf8');
    }
    if (camera && camera.shake) camera.shake(16, 0.8);

    // Awakening banner and opening portal to World 3
    if (level) {
      level.shrineBannerText = '🌿 THE SACRED FOREST KING IS PURIFIED: THE PORTAL AWAKENS! 🌿';
      level.shrineBannerTimer = 6.0;
      if (level.goal) {
        level.goal.x = this.x + 360;
        level.goal.y = 800;
      }
    }
  }

  takeDamage(amount, knockX, knockY, audio) {
    // Frontal body absorbs attacks; damage must be delivered to root cores
    if (audio && audio.playDeflect) audio.playDeflect();
    return false;
  }

  stomp(player, audio) {
    player.bounceFromEnemy();
    if (audio && audio.playDeflect) audio.playDeflect();
    return false;
  }

  getBounds() {
    return {
      x: this.x + 10,
      y: this.y + 10,
      width: this.width - 20,
      height: this.height - 20,
    };
  }

  render(ctx, camera) {
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    // 1. Draw Spore Projectiles
    if (this.spores.length > 0) {
      ctx.save();
      for (const s of this.spores) {
        const sx = Math.round(s.x - camX);
        const sy = Math.round(s.y - camY);
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(sx, sy, s.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f0abfc';
        ctx.beginPath();
        ctx.arc(sx - 2, sy - 2, s.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Draw Thorny Briar Gates
    if (this.gateWest.alpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = this.gateWest.alpha;
      const wGx = Math.round(this.gateWest.x - camX);
      const wGy = Math.round(this.gateWest.y - camY);
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(wGx, wGy, this.gateWest.width, this.gateWest.height);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(wGx + 4, wGy + 4, this.gateWest.width - 8, this.gateWest.height - 8);

      const eGx = Math.round(this.gateEast.x - camX);
      const eGy = Math.round(this.gateEast.y - camY);
      ctx.fillStyle = '#1e1b18';
      ctx.fillRect(eGx, eGy, this.gateEast.width, this.gateEast.height);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(eGx + 4, eGy + 4, this.gateEast.width - 8, this.gateEast.height - 8);
      ctx.restore();
    }
  }
}
