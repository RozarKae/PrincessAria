import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * THE TIME TINKER
 * Canonical World 6 Climax Boss: Master Horologist of the Clockwork Kingdom.
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: TITAN WORLD CLIMAX BOSS
 * 2. THREAT: Rating 5/5 (Master of chrono-dilation, rolling escapement wheels, sweeping clock hands)
 * 3. COUNTER: Navigate moving escapement tiers, dodge time dilation waves, and strike the exposed Sunstone Heart!
 * 4. TELEGRAPH: Grand Astrolabe back-wheel spins wildly, clock face chest rings chime, ruby monocle flashes (0.8s)
 * 5. MOVEMENT STYLE: Stepped mechanical gliding, chronometer hover, and instant chrono-shift repositioning
 * 6. ATTACK STYLE: Spinning escapement cog throws, falling gear rain, chrono shockwaves, sweeping clock hands
 * 7. RECOVERY: Mainspring unwinds with a loud chime, exposing the Sunstone Heart for 2.8s
 * 8. ENVIRONMENTAL PREFERENCE: The Grand Chronometer Citadel Arena (x: 9,800 - 10,700)
 */
export class TimeTinker extends Enemy {
  constructor(x, y) {
    super(x, y, 140, 160, {
      name: 'The Time Tinker',
      species: 'time_tinker',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 5,
      counterHint: 'Dodge rolling escapement wheels, then strike the glowing Sunstone Heart when his mainspring unwinds!',
      telegraphDesc: 'Astrolabe back-wheel spins rapidly, grand chest clock chimes, ruby monocle glints',
      movementStyle: 'Stepped clockwork glide & instant chrono-shift repositioning',
      attackStyle: 'Rolling brass cogs, chrono shockwaves & sweeping clock hands',
      recoveryDesc: 'Clockwork mainspring unspools, exposed Sunstone Heart vulnerable for 2.8s',
      environmentalPreference: 'The Grand Chronometer Citadel Arena',
      health: 12,
      damage: 1,
      speed: 85,
      gravity: 2100,
      detectionRange: 850,
      scoreValue: 6000,
    });

    this.baseY = y;
    this.isDefeated = false;
    this.phase = 1; // 1: Escapement Wheels (12-9), 2: Time Dilation & Gear Rain (8-5), 3: Grand Astrolabe Overload (4-1)
    this.attackTimer = 0;
    this.attackInterval = 3.4;
    this.isStaggered = false;
    this.staggerTimer = 0;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.clockRotation = 0;
    this.wobbleAngle = 0;
    this.projectiles = []; // Spinning cogs & falling gear rain
    this.shockwaves = []; // Chrono ground shockwaves
    this.clockHandsAngle = 0;

    // Arena Astrolabe Tiers / Clock Platform Stations
    this.escapementPlatforms = [
      { id: 'left_escapement', x: 9940, y: 720, width: 140, height: 26 },
      { id: 'center_dial', x: 10220, y: 620, width: 160, height: 26 },
      { id: 'right_escapement', x: 10500, y: 720, width: 140, height: 26 },
    ];

    // Weak Point: Exposed Sunstone Heart
    this.sunstoneHeart = {
      x: x + 45,
      y: y + 45,
      width: 50,
      height: 50,
      vulnerable: false,
    };
  }

  hurt(damage = 1, attackDirection = 1, attackSource = 'projectile') {
    if (this.isDead || this.isDefeated) return false;

    // Full damage when staggered, or damage from jump stomp on exposed heart
    if (this.isStaggered) {
      this.health -= damage;
      if (this.health <= 0) {
        this.triggerDefeat();
      } else {
        this.checkPhaseTransition();
      }
      return true;
    } else if (attackSource === 'stomp' || attackSource === 'jump') {
      // Stomp on the clockwork chassis triggers an escapement desync!
      this.health -= 1;
      this.checkPhaseTransition();
      if (this.health <= 0) {
        this.triggerDefeat();
      } else {
        if (Math.random() < 0.6) {
          this.triggerStagger();
        }
      }
      return true;
    } else {
      // Frontal heavy brass armor deflects weak attacks
      this.wobbleAngle = Math.sin(Date.now() * 0.02) * 0.08;
      return false;
    }
  }

  checkPhaseTransition() {
    if (this.health <= 4 && this.phase < 3) {
      this.phase = 3;
      this.attackInterval = 2.2;
      this.triggerStagger();
    } else if (this.health <= 8 && this.phase < 2) {
      this.phase = 2;
      this.attackInterval = 2.8;
    }
  }

  triggerStagger() {
    this.isStaggered = true;
    this.staggerTimer = 2.8;
    this.vx = 0;
    this.sunstoneHeart.vulnerable = true;
    this.wobbleAngle = 0.22;
  }

  triggerDefeat() {
    this.isDefeated = true;
    this.isDead = true;
    this.vx = 0;
    this.vy = 40;
    this.defeatDuration = 4.5;
    this.defeatTimer = 0;
    this.wobbleAngle = 0.55;

    // Unseal Ancient Ocean Gate to World 7 (The Kingdom Beneath the Sea)
    if (this.levelRef && this.levelRef.goal) {
      this.levelRef.goal.unlocked = true;
      this.levelRef.goal.active = true;
    }
  }

  update(dt, level, player, camera) {
    if (!this.levelRef && level) {
      this.levelRef = level;
    }

    this.clockRotation += dt * 3.5;
    this.clockHandsAngle += dt * (this.phase === 3 ? 4.5 : 2.0);

    // Synchronize Sunstone Heart position
    this.sunstoneHeart.x = this.x + 45;
    this.sunstoneHeart.y = this.y + 45;

    // Defeat death sequence
    if (this.isDefeated) {
      this.defeatTimer += dt;
      this.clockRotation += dt * 15;
      if (level && Math.random() < 0.5) {
        level.spawnBurst(
          this.x + Math.random() * this.width,
          this.y + Math.random() * this.height,
          6,
          '#fbbf24'
        );
      }
      return;
    }

    // Stagger / vulnerable recovery window
    if (this.isStaggered) {
      this.staggerTimer -= dt;
      this.wobbleAngle = Math.sin(Date.now() * 0.015) * 0.2;
      if (this.staggerTimer <= 0) {
        this.isStaggered = false;
        this.sunstoneHeart.vulnerable = false;
        this.wobbleAngle = 0;
      }
      return;
    }

    // Update active projectiles (rolling cogs & gear rain)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.rotation = (p.rotation || 0) + dt * 10;

      // Bounce on arena boundaries if rolling cog
      if (p.isRolling && (p.x < 9840 || p.x > 10640)) {
        p.vx = -p.vx;
      }

      // Check collision with player
      if (player && !player.isDead) {
        const dx = p.x - (player.x + player.width / 2);
        const dy = p.y - (player.y + player.height / 2);
        if (Math.hypot(dx, dy) < 28) {
          player.hurt();
          if (level) level.spawnBurst(p.x, p.y, 8, '#f59e0b');
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      if (p.life <= 0) {
        if (level) level.spawnSparkles(p.x, p.y, 6);
        this.projectiles.splice(i, 1);
      }
    }

    // Update chrono shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.x += sw.vx * dt;
      sw.life -= dt;
      sw.width = Math.min(60, sw.width + dt * 40);

      if (player && !player.isDead) {
        if (
          player.x + player.width > sw.x &&
          player.x < sw.x + sw.width &&
          player.y + player.height >= sw.y - 10 &&
          player.y + player.height <= sw.y + 30
        ) {
          player.hurt();
        }
      }

      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    if (player) {
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      this.facing = (player.x > this.x) ? 1 : -1;

      // Arena patrol movement
      this.x += this.facing * this.speed * dt * 0.4;
      if (this.x < 9960) {
        this.x = 9960;
        this.facing = 1;
      } else if (this.x > 10480) {
        this.x = 10480;
        this.facing = -1;
      }

      // Attack cycle
      this.attackTimer += dt;
      if (this.attackTimer >= this.attackInterval && !this.isTelegraphing) {
        this.isTelegraphing = true;
        this.telegraphTimer = 0.8;
      }

      if (this.isTelegraphing) {
        this.telegraphTimer -= dt;
        if (level && Math.random() < 0.4) {
          level.spawnSparkles(this.x + this.width / 2, this.y + 40, 2);
        }

        if (this.telegraphTimer <= 0) {
          this.isTelegraphing = false;
          this.attackTimer = 0;
          this.executeAttack(player, level, camera);
        }
      }
    }
  }

  executeAttack(player, level, camera) {
    if (!player) return;

    if (camera) camera.shake(7, 0.18);

    if (this.phase === 1) {
      // Phase 1: Rolling Escapement Wheel & Ground Chrono Shockwave
      const originX = this.x + (this.facing > 0 ? this.width : 0);
      const originY = this.y + this.height - 30;

      // Rolling Cog
      this.projectiles.push({
        x: originX,
        y: originY,
        vx: this.facing * 340,
        vy: 0,
        life: 4.0,
        isRolling: true,
        rotation: 0,
      });

      // Ground Chrono Shockwave
      this.shockwaves.push({
        x: originX,
        y: originY + 10,
        vx: this.facing * 280,
        width: 30,
        height: 24,
        life: 2.2,
      });
    } else if (this.phase === 2) {
      // Phase 2: Time Dilation & Falling Gear Rain
      for (let i = 0; i < 4; i++) {
        const dropX = 9920 + i * 180 + Math.random() * 80;
        this.projectiles.push({
          x: dropX,
          y: this.y - 280,
          vx: (Math.random() - 0.5) * 60,
          vy: 360 + Math.random() * 80,
          life: 2.5,
          isRolling: false,
          rotation: 0,
        });
      }

      // Chrono pulse shockwave in both directions
      this.shockwaves.push({
        x: this.x + this.width / 2,
        y: this.y + this.height - 20,
        vx: 260,
        width: 30,
        height: 24,
        life: 2.0,
      });
      this.shockwaves.push({
        x: this.x + this.width / 2,
        y: this.y + this.height - 20,
        vx: -260,
        width: 30,
        height: 24,
        life: 2.0,
      });
    } else {
      // Phase 3: Grand Astrolabe Overload - Twin Rolling Cogs + Radial Sunstone Burst!
      const originX = this.x + this.width / 2;
      const originY = this.y + this.height / 2;

      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
        this.projectiles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * 320,
          vy: Math.sin(angle) * 320,
          life: 2.2,
          isRolling: false,
          rotation: 0,
        });
      }

      // Brief stagger opportunity after massive overload
      if (Math.random() < 0.4) {
        this.triggerStagger();
      }
    }
  }
}
