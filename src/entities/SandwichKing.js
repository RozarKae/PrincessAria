import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * THE SANDWICH KING
 * Canonical World 5 Climax Boss: Sovereign Monarch of the Desert of Endless Sandwiches.
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: TITAN WORLD CLIMAX BOSS
 * 2. THREAT: Rating 5/5 (Multi-tier colossal monarch, condiment shockwaves, collapsing layers)
 * 3. COUNTER: Dodge the condiment tsunami and toothpick scepter thrusts, then strike the exposed core when the towering layers stagger and collapse!
 * 4. TELEGRAPH: Crown flashes brilliant gold, eyes gleam red, toothpick scepter points skyward with sizzling mustard steam (0.75s)
 * 5. MOVEMENT STYLE: Heavy imposing stomps, floating royal levitation, and screen-shaking seismic leaps
 * 6. ATTACK STYLE: Sesame projectile volleys, mustard/mayo shockwaves, flying tomato discs, and colossal club stomp
 * 7. RECOVERY: Towering sandwich layers wobble and collapse sideways, exposing the Melted Cheddar Core (2.5s)
 * 8. ENVIRONMENTAL PREFERENCE: The Royal Deli Plateau Arena (x: 9,800 - 10,700)
 */
export class SandwichKing extends Enemy {
  constructor(x, y) {
    super(x, y, 160, 150, {
      name: 'The Sandwich King',
      species: 'sandwich_king',
      role: ENCOUNTER_ROLES.CONTROL,
      threatLevel: 5,
      counterHint: 'Dodge his condiment stomps and starbursts, then attack when his sandwich layers wobble and collapse!',
      telegraphDesc: 'Golden crown flashes and toothpick scepter charges with mustard steam',
      movementStyle: 'Heavy royal stomps and floating levitation',
      attackStyle: 'Sesame starbursts, condiment waves & colossal crust slam',
      recoveryDesc: 'Towering club sandwich layers stagger and collapse, core exposed',
      environmentalPreference: 'The Royal Deli Plateau Arena',
      health: 12,
      damage: 1,
      speed: 80,
      gravity: 2100,
      detectionRange: 800,
      scoreValue: 5000,
    });

    this.baseY = y;
    this.isDefeated = false;
    this.phase = 1; // 1: Toasting (12-9), 2: Condiment Deluge (8-5), 3: Grand Collapse (4-1)
    this.attackTimer = 0;
    this.attackInterval = 3.6;
    this.isStaggered = false;
    this.staggerTimer = 0;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.wobbleAngle = 0;
    this.wobbleSpeed = 0;
    this.projectiles = []; // Sesame seeds / tomato slices
    this.shockwaves = []; // Ground condiment waves

    // Arena landmarks / pillars or serving platters
    this.platters = [
      { id: 'left_platter', x: 9940, y: 720, width: 120, height: 24 },
      { id: 'center_platter', x: 10220, y: 640, width: 140, height: 24 },
      { id: 'right_platter', x: 10500, y: 720, width: 120, height: 24 },
    ];

    // Weak Point: Melted Cheddar Core (exposed when staggered)
    this.cheddarCore = {
      x: x + 50,
      y: y + 45,
      width: 60,
      height: 50,
      vulnerable: false,
    };
  }

  hurt(damage = 1, attackDirection = 1, attackSource = 'projectile') {
    if (this.isDead || this.isDefeated) return false;

    // Boss takes full damage when staggered, or half damage from strong starbeam
    if (this.isStaggered) {
      this.health -= damage;
      if (this.health <= 0) {
        this.triggerDefeat();
      } else {
        this.checkPhaseTransition();
      }
      return true;
    } else if (attackSource === 'stomp' || attackSource === 'jump') {
      // Stomp on the crown triggers a wobble!
      this.wobbleSpeed = 12;
      this.health -= 1;
      this.checkPhaseTransition();
      if (this.health <= 0) {
        this.triggerDefeat();
      } else {
        // High stomp could trigger stagger
        if (Math.random() < 0.5) {
          this.triggerStagger();
        }
      }
      return true;
    } else {
      // Frontal toast crust deflects weak attacks
      this.wobbleAngle = Math.sin(Date.now() * 0.01) * 0.1;
      return false;
    }
  }

  checkPhaseTransition() {
    if (this.health <= 4 && this.phase < 3) {
      this.phase = 3;
      this.attackInterval = 2.4;
      this.triggerStagger();
    } else if (this.health <= 8 && this.phase < 2) {
      this.phase = 2;
      this.attackInterval = 3.0;
    }
  }

  triggerStagger() {
    this.isStaggered = true;
    this.staggerTimer = 2.8;
    this.vx = 0;
    this.wobbleAngle = 0.28; // Leaning sideways
  }

  triggerDefeat() {
    this.isDefeated = true;
    this.isDead = true;
    this.vx = 0;
    this.vy = 60;
    this.defeatDuration = 4.0;
    this.defeatTimer = 0;
    this.wobbleAngle = 0.6; // Toppled over

    // Unseal Ancient Portal to World 6
    if (this.levelRef && this.levelRef.goal) {
      this.levelRef.goal.unlocked = true;
      this.levelRef.goal.active = true;
    }
  }

  update(dt, level, player, camera) {
    if (!this.levelRef && level) {
      this.levelRef = level;
    }

    // Defeat sequence
    if (this.isDefeated) {
      this.defeatTimer += dt;
      if (level && Math.random() < 0.4) {
        level.spawnSparkles(
          this.x + Math.random() * this.width,
          this.y + Math.random() * this.height,
          2
        );
      }
      super.update(dt, level, player, camera);
      return;
    }

    // Wobble damping
    if (this.isStaggered) {
      this.staggerTimer -= dt;
      this.wobbleAngle = 0.25 + Math.sin(Date.now() * 0.008) * 0.08;
      if (this.staggerTimer <= 0) {
        this.isStaggered = false;
        this.wobbleAngle = 0;
      }
    } else {
      this.wobbleAngle *= 0.92;
    }

    // Update projectiles (sesame bursts / tomato discs)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (player && !player.isInvulnerable) {
        if (
          p.x > player.x &&
          p.x < player.x + player.width &&
          p.y > player.y &&
          p.y < player.y + player.height
        ) {
          player.takeDamage(1, p.vx > 0 ? 1 : -1);
          p.life = 0;
        }
      }

      if (p.life <= 0 || p.y > 1100) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update condiment shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.x += sw.vx * dt;
      sw.life -= dt;

      if (player && !player.isInvulnerable) {
        if (
          Math.abs(sw.x - (player.x + player.width / 2)) < 30 &&
          player.y + player.height >= sw.y - 10
        ) {
          player.takeDamage(1, sw.vx > 0 ? 1 : -1);
          sw.life = 0;
        }
      }

      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    if (player) {
      const dx = player.x - this.x;
      this.facing = dx > 0 ? 1 : -1;
      const dist = Math.abs(dx);

      // Attack scheduling
      if (!this.isStaggered && !this.isTelegraphing) {
        this.attackTimer += dt;
        if (this.attackTimer >= this.attackInterval && dist < this.detectionRange) {
          this.isTelegraphing = true;
          this.telegraphTimer = 0.7;
          this.vx = 0;
        }
      }

      // Telegraphing
      if (this.isTelegraphing) {
        this.telegraphTimer -= dt;
        if (level && Math.random() < 0.4) {
          level.spawnSparkles(this.x + this.width / 2, this.y + 10, 2);
        }
        if (this.telegraphTimer <= 0) {
          this.isTelegraphing = false;
          this.attackTimer = 0;
          this.executeBossAttack(player, level);
        }
      }

      // Movement between attacks
      if (!this.isStaggered && !this.isTelegraphing) {
        // Slow regal march toward player
        this.vx = this.facing * this.speed;
        // Keep within arena bounds (9,800 to 10,650)
        if (this.x < 9820) {
          this.x = 9820;
          this.facing = 1;
        } else if (this.x > 10600) {
          this.x = 10600;
          this.facing = -1;
        }
      }
    }

    super.update(dt, level, player, camera);
  }

  executeBossAttack(player, level) {
    const attackType = Math.floor(Math.random() * 3);

    if (attackType === 0 || this.phase === 1) {
      // 1. Sesame Starburst Volley
      const count = this.phase === 3 ? 7 : 5;
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI * 0.8 + (i / (count - 1)) * Math.PI * 0.6;
        const spd = 260;
        this.projectiles.push({
          x: this.x + this.width / 2,
          y: this.y + 30,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 2.8,
          type: 'sesame',
        });
      }
    } else if (attackType === 1 || this.phase === 2) {
      // 2. Colossal Crust Stomp & Condiment Shockwaves
      if (level) {
        level.spawnDust(this.x + this.width / 2, this.y + this.height, 8);
      }
      // Shockwaves traveling left and right along the ground
      this.shockwaves.push({
        x: this.x,
        y: this.y + this.height,
        vx: -240,
        life: 2.2,
      });
      this.shockwaves.push({
        x: this.x + this.width,
        y: this.y + this.height,
        vx: 240,
        life: 2.2,
      });
    } else {
      // 3. Flying Tomato Disc Throw
      this.projectiles.push({
        x: this.x + (this.facing > 0 ? this.width : 0),
        y: this.y + 60,
        vx: this.facing * 320,
        vy: -60,
        life: 2.5,
        type: 'tomato',
      });
    }
  }
}
