import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';
import { Collision } from '../physics/Collision.js';

/**
 * HONEY BUMBLE
 * Canonical Boss of World 1: The Meadows of Angry Bees
 * 
 * Screenplay Lore:
 * - Giant armored bee charging through trees; trapped in canyon.
 * - Defeated by baiting charges into honeycomb canyon pillars.
 * - Rewards the first golden hive symbol and confirms Khan's trail.
 */
export class HoneyBumble extends Enemy {
  constructor(x, y) {
    super(x, y, 140, 110, {
      name: 'Honey Bumble',
      species: 'honey_bumble',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 5,
      counterHint: 'Lure his furious charges into the honeycomb pillars, then strike his exposed wings!',
      telegraphDesc: 'Vibrates armored chitin wings and aims horn directly at Aria',
      movementStyle: 'Heavy aerial hovering and high-speed horizontal ramming charge',
      attackStyle: 'Armored canyon charge & shockwave collision',
      recoveryDesc: 'Dazed and grounded after crashing into a pillar',
      environmentalPreference: 'The Sunstone Canyon Arena',
      health: 6,
      damage: 1,
      speed: 80,
      gravity: 0, // Aerial boss
      detectionRange: 750,
      scoreValue: 4000,
    });

    this.baseY = y;
    this.arenaMinX = 9800;
    this.arenaMaxX = 10600;

    // States: 'hover', 'telegraph', 'charge', 'stunned', 'recover'
    this.bossState = 'hover';
    this.stateTimer = 2.0;
    this.chargeSpeed = 420;
    this.hoverTimer = 0;
    this.isStunned = false;
    this.isDefeated = false;

    // 3 Destructible Canyon Honeycomb Pillars
    this.pillars = [
      { id: 'pillar_west', name: 'West Honeycomb Pillar', x: 9940, y: 720, width: 50, height: 160, shattered: false },
      { id: 'pillar_center', name: 'Canyon Arch Pillar', x: 10220, y: 700, width: 56, height: 180, shattered: false },
      { id: 'pillar_east', name: 'East Honeycomb Pillar', x: 10500, y: 720, width: 50, height: 160, shattered: false },
    ];
  }

  update(dt, level, player, camera) {
    if (this.isDefeated) {
      this.vy += 1200 * dt;
      this.y += this.vy * dt;
      this.alpha = Math.max(0, (this.alpha || 1.0) - dt * 0.4);
      return;
    }

    this.hoverTimer += dt * 3.5;

    // Boss State Machine
    switch (this.bossState) {
      case 'hover':
        // Hover and track player altitude
        this.y = this.baseY + Math.sin(this.hoverTimer) * 28;
        this.facing = player.x < this.x ? -1 : 1;
        
        // Patrol gently toward player
        const targetX = Math.max(this.arenaMinX + 100, Math.min(this.arenaMaxX - 100, player.x + (this.facing > 0 ? -220 : 220)));
        this.vx = (targetX - this.x) * 1.8;
        this.x += this.vx * dt;

        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.bossState = 'telegraph';
          this.stateTimer = 0.85;
          this.vx = 0;
          this.scaleX = 1.3;
          this.scaleY = 0.85;
          if (level && level.spawnSparkles) {
            level.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 8);
          }
        }
        break;

      case 'telegraph':
        // Vibrate and telegraph charge
        this.stateTimer -= dt;
        this.facing = player.x < this.x ? -1 : 1;
        this.x += (Math.random() - 0.5) * 4;
        this.scaleX = 0.9 + Math.sin(this.stateTimer * 20) * 0.15;

        if (this.stateTimer <= 0) {
          this.bossState = 'charge';
          this.stateTimer = 2.2;
          this.vx = this.facing * this.chargeSpeed;
          this.scaleX = 1.4;
          this.scaleY = 0.75;
          if (camera && camera.shake) camera.shake(6, 0.2);
        }
        break;

      case 'charge':
        this.stateTimer -= dt;
        this.x += this.vx * dt;

        // Trail amber wind particles
        if (level && Math.random() < 0.6) {
          level.spawnDust(this.x + (this.facing > 0 ? 0 : this.width), this.y + this.height / 2, 3);
        }

        // Check collision with arena pillars
        const myBounds = this.getBounds();
        for (const pillar of this.pillars) {
          if (!pillar.shattered && Collision.intersects(myBounds, pillar)) {
            // CRASH INTO PILLAR!
            pillar.shattered = true;
            this.bossState = 'stunned';
            this.stateTimer = 2.6;
            this.isStunned = true;
            this.vx = -this.facing * 90;
            this.vy = -180;
            this.scaleX = 0.7;
            this.scaleY = 1.4;

            if (camera && camera.shake) camera.shake(14, 0.45);
            if (level) {
              level.spawnBurst(pillar.x + pillar.width / 2, pillar.y + pillar.height / 2, 24, '#f59e0b');
              level.spawnBurst(pillar.x + pillar.width / 2, pillar.y + pillar.height / 2, 16, '#fde047');
              level.spawnDust(pillar.x + pillar.width / 2, pillar.y + pillar.height / 2, 12);
            }
            break;
          }
        }

        // Stop at arena boundaries
        if (this.x < this.arenaMinX) {
          this.x = this.arenaMinX;
          this.bossState = 'recover';
          this.stateTimer = 0.8;
          this.vx = 0;
        } else if (this.x > this.arenaMaxX - this.width) {
          this.x = this.arenaMaxX - this.width;
          this.bossState = 'recover';
          this.stateTimer = 0.8;
          this.vx = 0;
        } else if (this.stateTimer <= 0) {
          this.bossState = 'recover';
          this.stateTimer = 0.6;
          this.vx = 0;
        }
        break;

      case 'stunned':
        this.isStunned = true;
        this.stateTimer -= dt;
        this.vx *= 0.88;
        this.x += this.vx * dt;
        this.y += Math.sin(this.hoverTimer * 2) * 2;

        // Dazed stars
        if (level && Math.random() < 0.3) {
          level.spawnSparkles(this.x + this.width / 2, this.y - 10, 2);
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
        // Fly back up to hover altitude
        this.y += (this.baseY - this.y) * 4 * dt;
        if (this.stateTimer <= 0) {
          this.bossState = 'hover';
          this.stateTimer = 2.0;
        }
        break;
    }
  }

  takeDamage(amount, knockX, knockY, audio) {
    if (!this.isStunned) {
      // Frontal chitin deflects while active!
      return false;
    }

    this.health -= amount;
    this.scaleX = 1.35;
    this.scaleY = 0.8;

    if (this.health <= 0) {
      this.isDefeated = true;
      this.isDead = true;
      this.vy = -320;
      return true;
    }
    return false;
  }

  stomp(player, audio) {
    if (this.isStunned) {
      this.takeDamage(2, 0, -100, audio);
    } else {
      // Bounces player harmlessly off armored carapace
      player.bounceFromEnemy();
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
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    ctx.translate(rx + this.width / 2, ry + this.height / 2);
    ctx.scale(this.facing * (this.scaleX || 1), this.scaleY || 1);

    if (this.alpha !== undefined) {
      ctx.globalAlpha = this.alpha;
    }

    // Wing oscillation
    const wingFlap = Math.sin(this.hoverTimer * 8);

    // 1. Wings (Top translucent iridescent)
    ctx.fillStyle = 'rgba(254, 240, 138, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-20, -45 + wingFlap * 8, 38, 16, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-10, -48 + wingFlap * 8, 28, 12, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 2. Abdomen (striped black & golden amber)
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.ellipse(-30, 10, 42, 32, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Amber stripes
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(-32, 10, 20, 28, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(-20, 8, 12, 24, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 3. Stinger (exposed rear weak point)
    ctx.fillStyle = this.isStunned ? '#ef4444' : '#78350f';
    ctx.beginPath();
    ctx.moveTo(-72, 12);
    ctx.lineTo(-90, 16);
    ctx.lineTo(-72, 22);
    ctx.closePath();
    ctx.fill();

    // 4. Thorax & Armored Golden Chitin Plate
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(15, 0, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(22, -4, 26, 0, Math.PI * 2);
    ctx.fill();

    // 5. Armored Carapace Horn / Mandibles (front)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(42, -8);
    ctx.lineTo(68, 0);
    ctx.lineTo(42, 14);
    ctx.closePath();
    ctx.fill();

    // 6. Glowing Red Compound Eyes
    ctx.fillStyle = this.isStunned ? '#38bdf8' : '#dc2626';
    ctx.beginPath();
    ctx.arc(36, -10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(38, -12, 4, 0, Math.PI * 2);
    ctx.fill();

    // 7. Stunned overhead dizzy stars
    if (this.isStunned) {
      for (let i = 0; i < 3; i++) {
        const starAng = this.hoverTimer * 4 + (i * Math.PI * 2) / 3;
        const sx = Math.cos(starAng) * 32;
        const sy = -60 + Math.sin(starAng) * 12;
        ctx.fillStyle = '#fde047';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
      }
    }

    ctx.restore();
  }
}
