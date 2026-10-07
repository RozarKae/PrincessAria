import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { Collision } from '../physics/Collision.js';

/**
 * THE SANDWICH KING
 * Canonical World 5 Climax Boss: Sovereign Monarch of the Desert of Endless Sandwiches.
 * 
 * Production-Grade 3-Phase Climax Boss:
 * - Phase 1 (HP 12-9): Regal march, Sesame Starburst Volleys, and flying Tomato Discs.
 *                      Stomping on the Golden Crown or hitting the layers causes a wobble.
 *                      Sufficient impacts induce a Topple/Stagger (2.5s) exposing the Melted Cheddar Core!
 * - Phase 2 (HP 8-5):  Condiment Deluge! Colossal Crust Stomps send ground-skimming mustard/ketchup
 *                      shockwaves across the deli plateau. Sesame barrages fire in wider double fans.
 * - Phase 3 (HP 4-1):  The Grand Deli Collapse! Fiery spicy condiment eruptions from above,
 *                      faster royal charging strides, relentless airborne tomato discs, and frantic wobbles.
 * 
 * Features:
 * - Royal Deli Cracker Gates (x: 9740 - 10660) with player arena clamping
 * - Native HD Boss Bar integration with golden toast & dijon mustard theme
 * - Vulnerable Melted Cheddar Core exposed during Topple / Stagger for Stardust Slash & Star Projectiles
 * - Toothpick Olive Scepter telegraphs and majestic crown head hitbox
 * - Grand Finale: The monarch crumbles into toasted croutons, unsealing the Portal to World 6!
 */
export class SandwichKing extends Enemy {
  constructor(x, y) {
    super(x, y, 160, 160, {
      name: 'The Sandwich King',
      species: 'sandwich_king',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 5,
      counterHint: 'Dodge his condiment shockwaves and sesame volleys, stomp his crown to wobble his towering layers, then strike the glowing Melted Cheddar Core!',
      telegraphDesc: 'Golden crown flashes and toothpick scepter points skyward with mustard steam',
      movementStyle: 'Heavy royal stomps and floating levitation',
      attackStyle: 'Sesame starbursts, condiment waves & colossal crust slam',
      recoveryDesc: 'Towering club sandwich layers stagger and collapse sideways, cheddar core exposed',
      environmentalPreference: 'The Royal Deli Plateau Arena',
      health: 12,
      maxHealth: 12,
      damage: 1,
      speed: 85,
      gravity: 2200,
      detectionRange: 850,
      scoreValue: 9000,
    });

    this.baseX = x;
    this.baseY = y;
    this.arenaMinX = 9760;
    this.arenaMaxX = 10640;
    this.maxHealth = 12;
    this.health = 12;
    this.phase = 1; // Phase 1 (12-9), Phase 2 (8-5), Phase 3 (4-1)

    // Arena lock & encounter state
    this.isArenaActive = false;
    this.introTimer = 0;
    this.introDuration = 2.4;
    this.introComplete = false;
    this.isDefeated = false;
    this.hitFlashTimer = 0;

    // Wobble & Stagger Physics
    this.wobbleAngle = 0;
    this.wobbleSpeed = 0;
    this.wobbleHits = 0;
    this.wobbleHitsRequired = 3;
    this.isStaggered = false;
    this.staggerTimer = 0;

    // Attack Scheduling
    this.attackTimer = 0;
    this.attackInterval = 3.6;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.nextAttackType = 0;

    // Projectiles & Hazards
    this.projectiles = []; // Sesame seeds / Tomato discs
    this.shockwaves = [];  // Ground mustard / ketchup waves
    this.condimentRain = []; // Phase 3 spicy drizzle

    // Weak Point: Melted Cheddar Core
    this.cheddarCore = {
      x: x + 40,
      y: y + 60,
      width: 80,
      height: 40,
      vulnerable: false,
    };

    // Royal Deli Cracker Gates (West & East)
    this.gateWest = { x: 9740, y: 440, width: 32, height: 460, alpha: 0 };
    this.gateEast = { x: 10660, y: 440, width: 32, height: 460, alpha: 0 };
  }

  hurt(damage = 1, attackDirection = 1, attackSource = 'projectile') {
    if (this.isDead || this.isDefeated) return false;

    // Direct damage when staggered / cheddar core exposed
    if (this.isStaggered) {
      this.damageCore(damage, null, null);
      return true;
    }

    // Attacks while standing add to wobble instability
    this.wobbleHits += 1;
    this.wobbleSpeed = (this.facing > 0 ? 1 : -1) * 8;
    this.hitFlashTimer = 0.18;

    if (this.wobbleHits >= this.wobbleHitsRequired) {
      this.triggerStagger();
    }

    return false; // Toast crust absorbs direct damage until staggered!
  }

  damageCore(amount = 1, level, camera) {
    if (this.isDead || this.isDefeated) return;

    this.health -= amount;
    this.hitFlashTimer = 0.22;

    const lvl = level || this.levelRef;
    if (lvl && lvl.spawnBurst) {
      lvl.spawnBurst(this.cheddarCore.x + 40, this.cheddarCore.y + 20, 24, '#f59e0b');
      lvl.spawnBurst(this.cheddarCore.x + 40, this.cheddarCore.y + 20, 16, '#fef08a');
      lvl.spawnSparkles(this.cheddarCore.x + 40, this.cheddarCore.y + 20, 20);
    }
    if (camera && camera.shake) camera.shake(12, 0.3);

    if (this.health <= 0) {
      this.triggerDefeat(lvl, camera);
    } else {
      this.checkPhaseTransition(lvl, camera);
      // Break out of stagger on hit
      this.isStaggered = false;
      this.isVulnerable = false;
      this.cheddarCore.vulnerable = false;
      this.wobbleHits = 0;
      this.attackTimer = 0;
      this.wobbleAngle = 0;
    }
  }

  checkPhaseTransition(level, camera) {
    if (this.health <= 4 && this.phase < 3) {
      this.triggerPhase(3, level, camera);
    } else if (this.health <= 8 && this.phase < 2) {
      this.triggerPhase(2, level, camera);
    }
  }

  triggerPhase(newPhase, level, camera) {
    this.phase = newPhase;
    this.wobbleHitsRequired = newPhase === 3 ? 2 : (newPhase === 2 ? 3 : 4);
    if (camera && camera.shake) camera.shake(18, 0.65);
    const lvl = level || this.levelRef;
    if (lvl && lvl.spawnBurst) {
      lvl.spawnBurst(this.x + this.width / 2, this.y + 40, 40, newPhase === 3 ? '#ef4444' : '#eab308');
      lvl.spawnSparkles(this.x + this.width / 2, this.y + 40, 25);
    }
  }

  triggerStagger() {
    this.isStaggered = true;
    this.staggerTimer = this.phase === 3 ? 2.0 : 2.8; // Ample window for player to strike
    this.vx = 0;
    this.wobbleAngle = 0.32; // Leaning sideways dramatically
    this.isVulnerable = true;
    this.cheddarCore.vulnerable = true;

    if (this.levelRef && this.levelRef.spawnBurst) {
      this.levelRef.spawnBurst(this.x + this.width / 2, this.y + 50, 20, '#fbbf24');
    }
  }

  triggerDefeat(level, camera) {
    if (this.isDefeated) return;
    this.isDefeated = true;
    this.isDead = true;
    this.health = 0;
    this.vx = 0;
    this.vy = 60;
    this.defeatDuration = 3.8;
    this.defeatTimer = 0;
    this.wobbleAngle = 0.65; // Completely toppled over

    const lvl = level || this.levelRef;
    if (lvl && lvl.spawnSparkles) {
      lvl.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 80);
      lvl.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 50, '#f59e0b');
      lvl.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 40, '#fef08a');
    }
    if (camera && camera.shake) camera.shake(22, 1.0);

    // Unseal Ancient Portal to World 6
    if (lvl) {
      lvl.shrineBannerText = '🥪 THE SANDWICH KING BOWS TO THY BLADE! THE CLOCKWORK PORTAL IS UNSEALED!';
      lvl.shrineBannerTimer = 6.5;
      if (lvl.goal) {
        lvl.goal.unlocked = true;
        lvl.goal.active = true;
      }
    }
  }

  takeDamage(amount, knockX, knockY, audio) {
    if (this.isStaggered) {
      this.damageCore(1, null, null);
      if (audio && audio.playEnemyHit) audio.playEnemyHit();
      return true;
    }
    // Adds to wobble
    this.hurt(amount, 1, 'melee');
    if (audio && audio.playDeflect) audio.playDeflect();
    return false;
  }

  stomp(player, audio) {
    if (this.isStaggered) {
      this.damageCore(1, null, null);
      player.bounceFromEnemy();
      if (audio && audio.playEnemyHit) audio.playEnemyHit();
      return true;
    }

    // Stomping on the Golden Crown directly induces massive wobble!
    this.wobbleHits += 2;
    this.wobbleSpeed = 14;
    player.bounceFromEnemy();

    if (this.wobbleHits >= this.wobbleHitsRequired) {
      this.triggerStagger();
    }

    if (audio && audio.playEnemyHit) audio.playEnemyHit();
    return false;
  }

  update(dt, level, player, camera) {
    this.levelRef = level;

    // Defeat sequence handling
    if (this.isDefeated) {
      this.defeatTimer += dt;
      this.gateWest.alpha = Math.max(0, this.gateWest.alpha - dt * 1.5);
      this.gateEast.alpha = Math.max(0, this.gateEast.alpha - dt * 1.5);

      if (level && Math.random() < 0.45) {
        level.spawnSparkles(
          this.x + Math.random() * this.width,
          this.y + Math.random() * this.height,
          4
        );
        if (camera && camera.shake) camera.shake(6, 0.15);
      }
      super.update(dt, level, player, camera);
      return;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // 1. Arena Lock-in Trigger (x: 9780 - 10640)
    if (!this.isArenaActive && player && player.x >= 9780 && player.x <= 10640) {
      this.isArenaActive = true;
      this.introTimer = this.introDuration;
      if (camera && camera.focus) camera.focus(this.x + this.width / 2, this.y + this.height / 2, 2.4);
      if (camera && camera.shake) camera.shake(16, 0.8);
      if (level && level.spawnBurst) {
        level.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 36, '#eab308');
      }
    }

    // Raise deli cracker gates & clamp player within arena
    if (this.isArenaActive && !this.isDefeated) {
      this.gateWest.alpha = Math.min(1.0, this.gateWest.alpha + dt * 2.0);
      this.gateEast.alpha = Math.min(1.0, this.gateEast.alpha + dt * 2.0);

      if (player && player.x < 9760) {
        player.x = 9760;
        player.vx = Math.max(0, player.vx);
      } else if (player && player.x > 10620) {
        player.x = 10620;
        player.vx = Math.min(0, player.vx);
      }
    }

    if (this.introTimer > 0) {
      this.introTimer -= dt;
      if (this.introTimer <= 0) {
        this.introComplete = true;
      }
      return;
    }

    // 2. Update Weak Point Position
    this.cheddarCore.x = this.x + 40;
    this.cheddarCore.y = this.y + 60;
    this.cheddarCore.vulnerable = this.isStaggered;

    // 3. Stagger & Wobble Handling
    if (this.isStaggered) {
      this.staggerTimer -= dt;
      this.vx = 0;
      this.wobbleAngle = 0.30 + Math.sin(Date.now() * 0.008) * 0.08;

      if (level && Math.random() < 0.35) {
        level.spawnSparkles(this.cheddarCore.x + 40, this.cheddarCore.y + 20, 2);
      }

      if (this.staggerTimer <= 0) {
        this.isStaggered = false;
        this.isVulnerable = false;
        this.cheddarCore.vulnerable = false;
        this.wobbleAngle = 0;
        this.wobbleHits = 0;
        this.attackTimer = 0;
        if (level && level.spawnBurst) {
          level.spawnBurst(this.x + this.width / 2, this.y + 50, 16, '#f59e0b');
        }
      }

      // Check player melee slash while staggered
      if (player && player.isAttacking && player.getAttackBounds) {
        const atk = player.getAttackBounds();
        if (Collision.intersects(atk, this.cheddarCore)) {
          this.damageCore(1, level, camera);
        }
      }

      super.update(dt, level, player, camera);
      return;
    } else {
      // Natural wobble damping
      this.wobbleAngle *= 0.90;
    }

    // 4. Update Hazards & Projectiles
    this.updateProjectiles(dt, level, player);
    this.updateShockwaves(dt, level, player);
    if (this.phase === 3) {
      this.updateCondimentRain(dt, level, player);
    }

    if (!player) {
      super.update(dt, level, player, camera);
      return;
    }

    const dx = player.x - this.x;
    this.facing = dx > 0 ? 1 : -1;

    // 5. Attack Telegraphing & Cycling
    if (this.isTelegraphing) {
      this.telegraphTimer -= dt;
      this.vx = 0;
      if (level && Math.random() < 0.4) {
        level.spawnSparkles(this.x + this.width / 2, this.y - 10, 2);
      }
      if (this.telegraphTimer <= 0) {
        this.isTelegraphing = false;
        this.attackTimer = 0;
        this.executeAttack(player, level, camera);
      }
      super.update(dt, level, player, camera);
      return;
    }

    this.attackTimer += dt;
    const interval = this.phase === 3 ? 2.4 : (this.phase === 2 ? 3.0 : 3.8);

    if (this.attackTimer >= interval) {
      this.isTelegraphing = true;
      this.telegraphTimer = this.phase === 3 ? 0.45 : 0.65;
      this.vx = 0;
    } else {
      // March toward player within arena bounds
      const moveSpeed = this.phase === 3 ? this.speed * 1.4 : (this.phase === 2 ? this.speed * 1.2 : this.speed);
      this.vx = this.facing * moveSpeed;

      if (this.x < 9820) {
        this.x = 9820;
        this.facing = 1;
      } else if (this.x > 10580) {
        this.x = 10580;
        this.facing = -1;
      }
    }

    super.update(dt, level, player, camera);
  }

  executeAttack(player, level, camera) {
    const type = Math.floor(Math.random() * 3);

    if (type === 0 || this.phase === 1) {
      // 1. Sesame Starburst Volley
      const count = this.phase === 3 ? 8 : (this.phase === 2 ? 6 : 4);
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI * 0.85 + (i / (count - 1)) * Math.PI * 0.7;
        const spd = this.phase === 3 ? 320 : 270;
        this.projectiles.push({
          x: this.x + this.width / 2,
          y: this.y + 20,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          radius: 6,
          life: 2.8,
          type: 'sesame',
        });
      }
      if (level && level.spawnBurst) {
        level.spawnBurst(this.x + this.width / 2, this.y + 20, 14, '#fef08a');
      }
    } else if (type === 1 || this.phase === 2) {
      // 2. Colossal Crust Stomp & Ground Shockwaves
      if (camera && camera.shake) camera.shake(16, 0.5);
      if (level && level.spawnDust) {
        level.spawnDust(this.x + this.width / 2, this.y + this.height, 12);
      }
      const waveSpeed = this.phase === 3 ? 280 : 230;
      this.shockwaves.push({
        x: this.x,
        y: this.y + this.height - 12,
        vx: -waveSpeed,
        life: 2.4,
      });
      this.shockwaves.push({
        x: this.x + this.width,
        y: this.y + this.height - 12,
        vx: waveSpeed,
        life: 2.4,
      });
    } else {
      // 3. High-Velocity Flying Tomato Disc
      this.projectiles.push({
        x: this.x + (this.facing > 0 ? this.width : 0),
        y: this.y + 60,
        vx: this.facing * (this.phase === 3 ? 380 : 320),
        vy: -40,
        radius: 12,
        life: 2.6,
        type: 'tomato',
      });
      if (level && level.spawnBurst) {
        level.spawnBurst(this.x + (this.facing > 0 ? this.width : 0), this.y + 60, 12, '#ef4444');
      }
    }
  }

  updateProjectiles(dt, level, player) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (player && !player.isDead) {
        const pBounds = player.getBounds ? player.getBounds() : { x: player.x, y: player.y, width: player.width, height: player.height };
        const dist = Math.hypot(p.x - (pBounds.x + pBounds.width / 2), p.y - (pBounds.y + pBounds.height / 2));
        if (dist < p.radius + 16) {
          player.hurt();
          p.life = 0;
          if (level && level.spawnBurst) {
            level.spawnBurst(p.x, p.y, 10, p.type === 'tomato' ? '#ef4444' : '#fef08a');
          }
        }
      }

      if (p.life <= 0 || p.y > 1050) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  updateShockwaves(dt, level, player) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.x += sw.vx * dt;
      sw.life -= dt;

      if (player && !player.isDead) {
        if (Math.abs(sw.x - (player.x + player.width / 2)) < 32 && player.y + player.height >= sw.y - 12) {
          player.hurt();
          sw.life = 0;
        }
      }

      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  updateCondimentRain(dt, level, player) {
    if (Math.random() < 0.08) {
      const dropX = this.arenaMinX + 100 + Math.random() * (this.arenaMaxX - this.arenaMinX - 200);
      this.condimentRain.push({
        x: dropX,
        y: 420,
        vy: 260,
        radius: 6,
        life: 2.5,
      });
    }

    for (let i = this.condimentRain.length - 1; i >= 0; i--) {
      const d = this.condimentRain[i];
      d.y += d.vy * dt;
      d.life -= dt;

      if (player && !player.isDead) {
        const pBounds = player.getBounds ? player.getBounds() : { x: player.x, y: player.y, width: player.width, height: player.height };
        const dist = Math.hypot(d.x - (pBounds.x + pBounds.width / 2), d.y - (pBounds.y + pBounds.height / 2));
        if (dist < d.radius + 16) {
          player.hurt();
          d.life = 0;
        }
      }

      if (d.life <= 0 || d.y > 900) {
        this.condimentRain.splice(i, 1);
      }
    }
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

    // 1. Draw Projectiles (Sesame & Tomato Discs)
    if (this.projectiles.length > 0) {
      ctx.save();
      for (const p of this.projectiles) {
        const px = Math.round(p.x - camX);
        const py = Math.round(p.y - camY);
        if (p.type === 'tomato') {
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(px, py, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(px, py, p.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(px, py, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 2. Draw Condiment Shockwaves
    if (this.shockwaves.length > 0) {
      ctx.save();
      for (const sw of this.shockwaves) {
        const sx = Math.round(sw.x - camX);
        const sy = Math.round(sw.y - camY);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(sx - 12, sy, 24, 12);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(sx - 8, sy + 2, 16, 8);
      }
      ctx.restore();
    }

    // 3. Draw Deli Cracker Gates
    if (this.gateWest.alpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = this.gateWest.alpha;
      const wGx = Math.round(this.gateWest.x - camX);
      const wGy = Math.round(this.gateWest.y - camY);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(wGx, wGy, this.gateWest.width, this.gateWest.height);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(wGx + 4, wGy + 4, this.gateWest.width - 8, this.gateWest.height - 8);

      const eGx = Math.round(this.gateEast.x - camX);
      const eGy = Math.round(this.gateEast.y - camY);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(eGx, eGy, this.gateEast.width, this.gateEast.height);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(eGx + 4, eGy + 4, this.gateEast.width - 8, this.gateEast.height - 8);
      ctx.restore();
    }
  }
}
