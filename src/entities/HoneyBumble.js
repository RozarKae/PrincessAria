import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { Collision } from '../physics/Collision.js';

/**
 * HONEY BUMBLE
 * Canonical Boss of World 1: The Meadows of Angry Bees
 * 
 * Production-Grade 3-Phase Climax Boss:
 * - Phase 1 (HP 6-5): Canonical Armored Ram & Destructible Honeycomb Pillars
 * - Phase 2 (HP 4-3): Enraged Amber Volleys (arcing gloop projectiles) + Faster Charges
 * - Phase 3 (HP 2-1): Frenzied Stinger Buzzsaw + Bedrock Wall Crashing when all pillars broken
 * 
 * Features:
 * - Dynamic Arena Barrier gates (seals arena at x: 9800 - 10600)
 * - HD Boss Health Bar & Phase Badge
 * - Cinematic Roar & Entrance sequence with camera focus
 * - Defeat explosion & dissolution of arena gates unlocking Batboy sanctuary
 */
export class HoneyBumble extends Enemy {
  constructor(x, y) {
    super(x, 260, 400, 310, {
      name: 'Honey Bumble',
      species: 'honey_bumble',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 5,
      counterHint: 'Lure his furious charges into the honeycomb pillars, then strike his exposed wings or stinger!',
      telegraphDesc: 'Vibrates armored chitin wings, buzzes angrily, and aims horn directly at Aria',
      movementStyle: 'Heavy aerial hovering, high-speed ramming charge, and amber gloop volleys',
      attackStyle: 'Armored canyon charge, amber projectile barrage, & shockwave collision',
      recoveryDesc: 'Dazed and grounded after crashing into a pillar or canyon wall',
      environmentalPreference: 'The Sunstone Canyon Arena',
      health: 6,
      maxHealth: 6,
      damage: 1,
      speed: 80,
      gravity: 0, // Aerial boss
      detectionRange: 850,
      scoreValue: 5000,
    });

    this.baseY = y;
    this.arenaMinX = 10000;
    this.arenaMaxX = 11500;
    this.maxHealth = 6;
    this.health = 6;

    // Arena lock & encounter state
    this.isArenaActive = false;
    this.introTimer = 0;
    this.introDuration = 2.5;
    this.introComplete = false;

    // Phases: 1 (HP 6-5), 2 (HP 4-3), 3 (HP 2-1)
    this.phase = 1;
    this.phaseTransitionTimer = 0;

    // States: 'idle', 'hover', 'telegraph', 'charge', 'amber_spit', 'stunned', 'recover'
    this.bossState = 'idle';
    this.stateTimer = 1.8;
    this.chargeSpeed = 440;
    this.hoverTimer = 0;
    this.isStunned = false;
    this.isDefeated = false;
    this.hitFlashTimer = 0;

    // 3 Destructible Canyon Honeycomb Pillars
    this.pillars = [
      { id: 'pillar_west', name: 'West Honeycomb Pillar', x: 9940, y: 720, width: 50, height: 160, shattered: false },
      { id: 'pillar_center', name: 'Canyon Arch Pillar', x: 10220, y: 700, width: 56, height: 180, shattered: false },
      { id: 'pillar_east', name: 'East Honeycomb Pillar', x: 10500, y: 720, width: 50, height: 160, shattered: false },
    ];

    // Phase 2 & 3 Amber Projectiles
    this.amberGloops = [];
    this.gloopCooldown = 0;

    // Arena Barrier Gates (West and East)
    this.gateWest = { x: 9780, y: 480, width: 28, height: 420, alpha: 0 };
    this.gateEast = { x: 10620, y: 480, width: 28, height: 420, alpha: 0 };
  }

  update(dt, level, player, camera) {
    // 1. Defeat Sequence
    if (this.isDefeated) {
      this.vy += 800 * dt;
      this.y += this.vy * dt;
      this.x += (Math.random() - 0.5) * 6;
      this.alpha = Math.max(0, (this.alpha ?? 1.0) - dt * 0.35);

      // Fade out arena gates
      this.gateWest.alpha = Math.max(0, this.gateWest.alpha - dt * 1.5);
      this.gateEast.alpha = Math.max(0, this.gateEast.alpha - dt * 1.5);

      if (level && Math.random() < 0.4) {
        level.spawnBurst(this.x + Math.random() * this.width, this.y + Math.random() * this.height, 6, '#f59e0b');
        level.spawnSparkles(this.x + Math.random() * this.width, this.y + Math.random() * this.height, 4);
      }
      return;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    this.hoverTimer += dt * 3.5;

    // Update Phase based on current health
    if (this.health <= 2 && this.phase < 3) {
      this.triggerPhase(3, level, camera);
    } else if (this.health <= 4 && this.phase < 2) {
      this.triggerPhase(2, level, camera);
    }

    // 2. Trigger Arena Activation when Aria steps into Sunstone Canyon
    if (!this.isArenaActive && player && player.x >= 9820 && player.x <= 10620) {
      this.isArenaActive = true;
      this.bossState = 'intro';
      this.introTimer = this.introDuration;
      if (camera) camera.focus(this.x + this.width / 2, this.y + this.height / 2, 2.2);
      if (camera) camera.shake(12, 0.8);
      if (level && level.spawnBurst) {
        level.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 28, '#f59e0b');
      }
    }

    // Smoothly raise barrier gates when arena is active
    if (this.isArenaActive && !this.isDefeated) {
      this.gateWest.alpha = Math.min(1.0, this.gateWest.alpha + dt * 2.0);
      this.gateEast.alpha = Math.min(1.0, this.gateEast.alpha + dt * 2.0);

      // Clamp player within arena bounds
      if (player && player.x < 9810) {
        player.x = 9810;
        player.vx = Math.max(0, player.vx);
      } else if (player && player.x > 10590) {
        player.x = 10590;
        player.vx = Math.min(0, player.vx);
      }
    }

    // 3. Update Amber Gloop Projectiles
    this.updateGloops(dt, level, player);

    // 4. Boss State Machine
    switch (this.bossState) {
      case 'idle':
        // Waiting for player to enter arena
        this.y = this.baseY + Math.sin(this.hoverTimer) * 12;
        break;

      case 'intro':
        // Dramatic entrance roar
        this.introTimer -= dt;
        this.facing = player && player.x < this.x ? -1 : 1;
        this.scaleX = 1.35 + Math.sin(this.introTimer * 18) * 0.15;
        this.scaleY = 0.85 + Math.cos(this.introTimer * 18) * 0.15;

        if (level && Math.random() < 0.35) {
          level.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 4);
        }

        if (this.introTimer <= 0) {
          this.introComplete = true;
          this.bossState = 'hover';
          this.stateTimer = 1.5;
        }
        break;

      case 'hover':
        // Hover and track player altitude
        this.y = this.baseY + Math.sin(this.hoverTimer) * (this.phase === 3 ? 38 : 28);
        this.facing = player && player.x < this.x ? -1 : 1;

        // Move horizontally toward optimal distance from player
        const idealDistance = this.facing > 0 ? -240 : 240;
        const targetX = Math.max(this.arenaMinX + 120, Math.min(this.arenaMaxX - 120, (player ? player.x : this.x) + idealDistance));
        this.vx = (targetX - this.x) * (this.phase === 3 ? 2.6 : 1.9);
        this.x += this.vx * dt;

        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          // In Phase 2 or 3, alternate between amber spit and ramming charge
          if (this.phase >= 2 && Math.random() < 0.45) {
            this.bossState = 'amber_spit';
            this.stateTimer = 1.2;
            this.vx = 0;
          } else {
            this.bossState = 'telegraph';
            this.stateTimer = this.phase === 3 ? 0.6 : 0.85;
            this.vx = 0;
            this.scaleX = 1.3;
            this.scaleY = 0.85;
            if (level && level.spawnSparkles) {
              level.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 10);
            }
          }
        }
        break;

      case 'amber_spit':
        // Spit arcing amber gloop projectiles at player
        this.stateTimer -= dt;
        this.facing = player && player.x < this.x ? -1 : 1;
        this.scaleX = 1.2 + Math.sin(this.stateTimer * 15) * 0.12;

        if (this.stateTimer <= 0.6 && !this.hasSpit) {
          this.hasSpit = true;
          this.fireAmberGloops(player, level);
        }

        if (this.stateTimer <= 0) {
          this.hasSpit = false;
          this.bossState = 'telegraph';
          this.stateTimer = this.phase === 3 ? 0.55 : 0.75;
          this.vx = 0;
        }
        break;

      case 'telegraph':
        // Vibrate and telegraph high-speed charge
        this.stateTimer -= dt;
        this.facing = player && player.x < this.x ? -1 : 1;
        this.x += (Math.random() - 0.5) * (this.phase === 3 ? 6 : 4);
        this.scaleX = 0.9 + Math.sin(this.stateTimer * 24) * 0.18;

        if (this.stateTimer <= 0) {
          this.bossState = 'charge';
          this.stateTimer = 2.4;
          const speedMultiplier = this.phase === 3 ? 1.4 : (this.phase === 2 ? 1.2 : 1.0);
          this.vx = this.facing * this.chargeSpeed * speedMultiplier;
          this.scaleX = 1.45;
          this.scaleY = 0.72;
          if (camera && camera.shake) camera.shake(7, 0.22);
        }
        break;

      case 'charge':
        this.stateTimer -= dt;
        this.x += this.vx * dt;

        // Trail fiery amber wind particles
        if (level && Math.random() < 0.7) {
          level.spawnDust(this.x + (this.facing > 0 ? 0 : this.width), this.y + this.height / 2, 3);
          if (this.phase === 3) {
            level.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 2, '#ef4444');
          }
        }

        // A. Check collision with destructible honeycomb pillars
        const myBounds = this.getBounds();
        let hitPillar = false;
        for (const pillar of this.pillars) {
          if (!pillar.shattered && Collision.intersects(myBounds, pillar)) {
            pillar.shattered = true;
            hitPillar = true;
            this.dazeBoss(pillar.x + pillar.width / 2, pillar.y + pillar.height / 2, level, camera);
            break;
          }
        }

        // B. If all pillars are already shattered (Phase 3), crashing into canyon bedrock walls also stuns!
        const allPillarsShattered = this.pillars.every(p => p.shattered);
        if (!hitPillar && allPillarsShattered) {
          if (this.x <= this.arenaMinX + 15 || this.x >= this.arenaMaxX - this.width - 15) {
            this.dazeBoss(this.x + this.width / 2, this.y + this.height / 2, level, camera);
            hitPillar = true;
          }
        }

        if (!hitPillar) {
          // Reached arena boundary without crashing
          if (this.x < this.arenaMinX) {
            this.x = this.arenaMinX;
            this.bossState = 'recover';
            this.stateTimer = 0.7;
            this.vx = 0;
          } else if (this.x > this.arenaMaxX - this.width) {
            this.x = this.arenaMaxX - this.width;
            this.bossState = 'recover';
            this.stateTimer = 0.7;
            this.vx = 0;
          } else if (this.stateTimer <= 0) {
            this.bossState = 'recover';
            this.stateTimer = 0.55;
            this.vx = 0;
          }
        }
        break;

      case 'stunned':
        this.isStunned = true;
        this.stateTimer -= dt;
        this.vx *= 0.88;
        this.x += this.vx * dt;
        this.y += Math.sin(this.hoverTimer * 2) * 2;

        // Dazed stars orbiting overhead
        if (level && Math.random() < 0.35) {
          level.spawnSparkles(this.x + this.width / 2, this.y - 12, 3);
        }

        if (this.stateTimer <= 0) {
          this.isStunned = false;
          this.bossState = 'recover';
          this.stateTimer = 1.0;
          this.scaleX = 1.0;
          this.scaleY = 1.0;
        }
        break;

      case 'recover':
        this.isStunned = false;
        this.stateTimer -= dt;
        // Fly smoothly back up to hover altitude
        this.y += (this.baseY - this.y) * 4.2 * dt;
        if (this.stateTimer <= 0) {
          this.bossState = 'hover';
          this.stateTimer = this.phase === 3 ? 1.4 : 1.9;
        }
        break;
    }
  }

  dazeBoss(impactX, impactY, level, camera) {
    this.bossState = 'stunned';
    this.stateTimer = this.phase === 3 ? 2.4 : 3.0; // Ample window for player to strike!
    this.isStunned = true;
    this.vx = -this.facing * 95;
    this.vy = -180;
    this.scaleX = 0.68;
    this.scaleY = 1.42;

    if (camera && camera.shake) camera.shake(16, 0.5);
    if (level) {
      level.spawnBurst(impactX, impactY, 26, '#f59e0b');
      level.spawnBurst(impactX, impactY, 18, '#fde047');
      level.spawnDust(impactX, impactY, 14);
    }
  }

  triggerPhase(newPhase, level, camera) {
    this.phase = newPhase;
    if (camera) camera.shake(14, 0.4);
    if (level && level.spawnBurst) {
      level.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 28, newPhase === 3 ? '#ef4444' : '#f59e0b');
      level.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 16);
    }
  }

  fireAmberGloops(player, level) {
    const startX = this.x + (this.facing > 0 ? this.width - 20 : 20);
    const startY = this.y + 40;
    const count = this.phase === 3 ? 3 : 2;

    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 80;
      const targetX = (player ? player.x : this.x) + spread;
      const dx = targetX - startX;
      const speedX = dx * 1.4;
      const speedY = -340 - Math.random() * 80;

      this.amberGloops.push({
        x: startX,
        y: startY,
        vx: speedX,
        vy: speedY,
        radius: 12,
        lifetime: 2.2,
      });
    }

    if (level && level.spawnBurst) {
      level.spawnBurst(startX, startY, 12, '#f59e0b');
    }
  }

  updateGloops(dt, level, player) {
    for (let i = this.amberGloops.length - 1; i >= 0; i--) {
      const g = this.amberGloops[i];
      g.vy += 850 * dt; // Gravity
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.lifetime -= dt;

      // Hit player check
      if (player && !player.isDead) {
        const pBounds = player.getBounds ? player.getBounds() : { x: player.x, y: player.y, width: player.width, height: player.height };
        const dist = Math.hypot(g.x - (pBounds.x + pBounds.width / 2), g.y - (pBounds.y + pBounds.height / 2));
        if (dist < g.radius + 18) {
          player.hurt();
          g.lifetime = 0;
          if (level && level.spawnBurst) {
            level.spawnBurst(g.x, g.y, 14, '#f59e0b');
          }
        }
      }

      // Despawn on timeout or bottom chasm
      if (g.lifetime <= 0 || g.y > 1000) {
        if (level && level.spawnDust) {
          level.spawnDust(g.x, g.y, 4);
        }
        this.amberGloops.splice(i, 1);
      }
    }
  }

  takeDamage(amount, knockX, knockY, audio) {
    if (!this.isStunned && !this.isDefeated) {
      // Frontal chitin deflects while active!
      if (audio && audio.playDeflect) audio.playDeflect();
      return false;
    }

    this.health -= amount;
    this.hitFlashTimer = 0.22;
    this.scaleX = 1.4;
    this.scaleY = 0.78;

    if (audio && audio.playDamage) audio.playDamage();

    if (this.health <= 0) {
      this.health = 0;
      this.isDefeated = true;
      this.isDead = true;
      this.vy = -340;
      if (audio && audio.playVictory) audio.playVictory();
      return true;
    }
    return false;
  }

  stomp(player, audio) {
    if (this.isStunned) {
      this.takeDamage(2, 0, -120, audio);
      player.bounceFromEnemy();
    } else {
      // Bounces player harmlessly off armored carapace
      player.bounceFromEnemy();
      if (audio && audio.playDeflect) audio.playDeflect();
    }
  }

  getBounds() {
    return {
      x: this.x + 12,
      y: this.y + 12,
      width: this.width - 24,
      height: this.height - 24,
    };
  }

  render(ctx, camera) {
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;

    // 1. Draw Amber Gloops
    if (this.amberGloops.length > 0) {
      ctx.save();
      for (const g of this.amberGloops) {
        const gx = Math.round(g.x - camX);
        const gy = Math.round(g.y - camY);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(gx, gy, g.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(gx - 2, gy - 2, g.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Draw Barrier Gates (West and East)
    if (this.gateWest.alpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = this.gateWest.alpha;
      // West Gate
      const wGx = Math.round(this.gateWest.x - camX);
      const wGy = Math.round(this.gateWest.y - camY);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(wGx, wGy, this.gateWest.width, this.gateWest.height);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(wGx + 4, wGy + 4, this.gateWest.width - 8, this.gateWest.height - 8);
      // East Gate
      const eGx = Math.round(this.gateEast.x - camX);
      const eGy = Math.round(this.gateEast.y - camY);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(eGx, eGy, this.gateEast.width, this.gateEast.height);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(eGx + 4, eGy + 4, this.gateEast.width - 8, this.gateEast.height - 8);
      ctx.restore();
    }

    // 3. Draw Honey Bumble Sprite
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    ctx.translate(rx + this.width / 2, ry + this.height / 2);
    ctx.scale(this.facing * (this.scaleX || 1), this.scaleY || 1);

    if (this.alpha !== undefined) {
      ctx.globalAlpha = this.alpha;
    }

    // Hit flash
    if (this.hitFlashTimer > 0) {
      ctx.filter = 'brightness(2.2)';
    }

    // Wing oscillation
    const wingFlap = Math.sin(this.hoverTimer * (this.phase === 3 ? 14 : 9));

    // Wings (Top translucent iridescent)
    ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-20, -45 + wingFlap * 8, 40, 18, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-10, -48 + wingFlap * 8, 30, 13, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Abdomen (striped black & golden amber)
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.ellipse(-30, 10, 44, 34, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Amber stripes (turn fiery red in Phase 3)
    ctx.fillStyle = this.phase === 3 ? '#ef4444' : '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(-32, 10, 22, 30, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.phase === 3 ? '#fca5a5' : '#fde047';
    ctx.beginPath();
    ctx.ellipse(-20, 8, 14, 25, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Stinger (exposed rear weak point)
    ctx.fillStyle = this.isStunned ? '#ef4444' : '#78350f';
    ctx.beginPath();
    ctx.moveTo(-74, 12);
    ctx.lineTo(-94, 16);
    ctx.lineTo(-74, 22);
    ctx.closePath();
    ctx.fill();

    // Thorax & Armored Golden Chitin Plate
    ctx.fillStyle = this.phase === 3 ? '#b91c1c' : '#d97706';
    ctx.beginPath();
    ctx.arc(15, 0, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.phase === 3 ? '#f87171' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(22, -4, 28, 0, Math.PI * 2);
    ctx.fill();

    // Armored Carapace Horn / Mandibles (front)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(44, -8);
    ctx.lineTo(72, 0);
    ctx.lineTo(44, 15);
    ctx.closePath();
    ctx.fill();

    // Compound Eyes (red glow, bright blue when stunned)
    ctx.fillStyle = this.isStunned ? '#38bdf8' : (this.phase === 3 ? '#ff0000' : '#dc2626');
    ctx.beginPath();
    ctx.arc(38, -10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(40, -12, 4, 0, Math.PI * 2);
    ctx.fill();

    // Stunned overhead dizzy stars
    if (this.isStunned) {
      for (let i = 0; i < 4; i++) {
        const starAng = this.hoverTimer * 4.5 + (i * Math.PI * 2) / 4;
        const sx = Math.cos(starAng) * 36;
        const sy = -64 + Math.sin(starAng) * 12;
        ctx.fillStyle = '#fde047';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
      }
    }

    ctx.restore();
  }
}
