import { Collision } from '../physics/Collision.js';
import { HoneyBeetle } from './HoneyBeetle.js';
import { ThornGoblin } from './ThornGoblin.js';

/**
 * StarProjectile.js
 * 
 * Royal Starbeam / Stardust Shot - Princess Aria's dedicated ranged power.
 * 
 * Mechanics:
 * - High-speed radiant celestial projectile (750 px/s).
 * - Maximum range: ~680 px before dissipating into stardust sparkles.
 * - Gentle subtle wave oscillation along horizontal trajectory.
 * - Frontal Shield Deflection:
 *   When striking armored enemies from the front (HoneyBeetle, ThornGoblin),
 *   the starbeam ricochets upward/backward with sparks and high metallic ping.
 * - Direct Enemy Hits:
 *   Deals 1 damage, causes knockback, triggers starlight burst and audio impact.
 * - Boss Encounter:
 *   Can target Forest King corrupted root cores from distance.
 */
export class StarProjectile {
  constructor(x, y, facing) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 18;
    this.facing = facing >= 0 ? 1 : -1;
    this.vx = this.facing * 750;
    this.vy = 0;
    this.baseY = y;
    this.flightTimer = 0;
    this.lifetime = 0.95;
    this.distanceTraveled = 0;
    this.maxRange = 680;
    this.rotation = 0;
    this.rotationSpeed = this.facing * 14;
    this.isDead = false;
    this.isDeflected = false;
    this.particles = [];
  }

  update(dt, level, audio, camera) {
    if (this.isDead) return;

    this.flightTimer += dt;
    this.rotation += this.rotationSpeed * dt;

    if (this.isDeflected) {
      // Deflected upward and backward in an arc
      this.vy += 1200 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Deflection sparks
      if (Math.random() < 0.6) {
        this.particles.push({
          x: this.x + (Math.random() - 0.5) * 6,
          y: this.y + (Math.random() - 0.5) * 6,
          alpha: 1.0,
          color: Math.random() < 0.5 ? '#f59e0b' : '#ef4444',
          size: 2,
        });
      }

      if (this.flightTimer > 0.45 || this.y > 1150) {
        this.isDead = true;
      }
    } else {
      // Normal celestial trajectory: gentle wave oscillation
      this.vy = Math.sin(this.flightTimer * 16) * 35;
      const stepX = this.vx * dt;
      this.x += stepX;
      this.y += this.vy * dt;
      this.distanceTraveled += Math.abs(stepX);

      // Trailing stardust particles
      this.particles.push({
        x: this.x + (this.facing > 0 ? -4 : this.width + 4) + (Math.random() - 0.5) * 4,
        y: this.y + this.height * 0.5 + (Math.random() - 0.5) * 6,
        alpha: 0.95,
        color: Math.random() < 0.4 ? '#38bdf8' : (Math.random() < 0.5 ? '#fef08a' : '#c084fc'),
        size: Math.random() < 0.3 ? 3 : 2,
      });

      // Range check
      if (this.distanceTraveled >= this.maxRange || this.flightTimer >= this.lifetime) {
        this.isDead = true;
        if (level && level.spawnSparkles) {
          level.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 6);
        }
        return;
      }

      // Check collision with level platforms (solid ground/walls)
      if (level && level.platforms) {
        const bounds = this.getBounds();
        for (const plat of level.platforms) {
          if (plat.isDeadly || plat.isBouncy || plat.isVine) continue;
          if (Collision.intersects(bounds, plat)) {
            this.isDead = true;
            if (audio && audio.playStarHit) audio.playStarHit();
            if (level.spawnBurst) {
              level.spawnBurst(this.x + this.width / 2, this.y + this.height / 2, 8, '#38bdf8');
            }
            return;
          }
        }
      }

      // Check collision with ForestKing root cores first
      const king = level && (level.forestKing || (level.enemies ? level.enemies.find(e => e.constructor.name === 'ForestKing' || e.name === 'Forest King') : null));
      if (king && !king.isDead && !king.isPurified && king.cores) {
        const bounds = this.getBounds();
        for (const core of king.cores) {
          if (!core.severed && !core.shielded) {
            if (Collision.intersects(bounds, core)) {
              this.isDead = true;
              if (king.damageCore) {
                king.damageCore(core, 1, level, camera);
              } else {
                core.hp -= 1;
                if (core.hp <= 0) core.severed = true;
              }
              if (audio && audio.playStarHit) audio.playStarHit();
              return;
            }
          }
        }
      }

      // Check collision with SirSlamALot power core when vulnerable
      const slammer = level && (level.sirSlamALot || (level.enemies ? level.enemies.find(e => e.constructor.name === 'SirSlamALot' || e.name === 'Sir Slam-A-Lot') : null));
      if (slammer && !slammer.isDead && !slammer.isDefeated && slammer.powerCore && slammer.isHammerStuck) {
        const bounds = this.getBounds();
        if (Collision.intersects(bounds, slammer.powerCore)) {
          this.isDead = true;
          if (slammer.damageCore) {
            slammer.damageCore(1, level, camera);
          }
          if (audio && audio.playStarHit) audio.playStarHit();
          return;
        }
      }

      // Check collision with HoneyDragon heart core when vulnerable/stunned
      const dragon = level && (level.honeyDragon || (level.enemies ? level.enemies.find(e => e.constructor.name === 'HoneyDragon' || e.name === 'The Honey Dragon' || e.species === 'honey_dragon') : null));
      if (dragon && !dragon.isDead && !dragon.isDefeated && dragon.heartCore && (dragon.isStunned || dragon.heartCore.vulnerable)) {
        const bounds = this.getBounds();
        if (Collision.intersects(bounds, dragon.heartCore)) {
          this.isDead = true;
          if (dragon.hurt) {
            dragon.hurt(1, this.facing, 'projectile');
          }
          if (audio && audio.playStarHit) audio.playStarHit();
          return;
        }
      }

      // Check collision with SandwichKing cheddar core when staggered
      const sandwichKing = level && (level.sandwichKing || (level.enemies ? level.enemies.find(e => e.constructor.name === 'SandwichKing' || e.name === 'The Sandwich King' || e.species === 'sandwich_king') : null));
      if (sandwichKing && !sandwichKing.isDead && !sandwichKing.isDefeated && sandwichKing.cheddarCore && (sandwichKing.isStaggered || sandwichKing.cheddarCore.vulnerable)) {
        const bounds = this.getBounds();
        if (Collision.intersects(bounds, sandwichKing.cheddarCore)) {
          this.isDead = true;
          if (sandwichKing.hurt) {
            sandwichKing.hurt(1, this.facing, 'projectile');
          }
          if (audio && audio.playStarHit) audio.playStarHit();
          return;
        }
      }

      // Check collision with TimeTinker sunstone heart when staggered/exposed
      const timeTinker = level && (level.timeTinker || (level.enemies ? level.enemies.find(e => e.constructor.name === 'TimeTinker' || e.name === 'The Time Tinker' || e.species === 'time_tinker') : null));
      if (timeTinker && !timeTinker.isDead && !timeTinker.isDefeated && timeTinker.sunstoneHeart && (timeTinker.isStaggered || timeTinker.sunstoneHeart.vulnerable)) {
        const bounds = this.getBounds();
        if (Collision.intersects(bounds, timeTinker.sunstoneHeart)) {
          this.isDead = true;
          if (timeTinker.hurt) {
            timeTinker.hurt(1, this.facing, 'projectile');
          }
          if (audio && audio.playStarHit) audio.playStarHit();
          return;
        }
      }

      // Check collision with enemies
      if (level && level.enemies) {
        const bounds = this.getBounds();
        for (const enemy of level.enemies) {
          if (enemy.isDead || enemy.isInvulnerable || enemy === king) continue;
          const enemyBounds = enemy.getBounds();

          if (Collision.intersects(bounds, enemyBounds)) {
            // Frontal shield deflection check (ThornGoblin & HoneyBeetle)
            const isBeetle = enemy instanceof HoneyBeetle;
            const isGoblin = enemy instanceof ThornGoblin;
            const isFrontal = (isBeetle || isGoblin) && !enemy.isVulnerable &&
              ((enemy.facing < 0 && this.facing > 0) || (enemy.facing > 0 && this.facing < 0));

            if (isFrontal) {
              // Armor / shield deflection!
              this.isDeflected = true;
              this.vx = -this.facing * 360;
              this.vy = -420;
              this.flightTimer = 0;
              if (audio && audio.playDeflect) audio.playDeflect();
              else if (audio && audio.playEnemyHit) audio.playEnemyHit();

              enemy.scaleX = 1.25;
              if (level.spawnSparkles) {
                level.spawnSparkles(enemy.x + enemy.width / 2, enemy.y + 16, 8);
              }
              if (camera && camera.shake) camera.shake(5, 0.1);
              return;
            } else {
              // Direct hit on enemy!
              const defeated = enemy.takeDamage(1, this.facing * 180, -220, audio);
              this.isDead = true;

              if (audio && audio.playStarHit) audio.playStarHit();
              else if (audio && audio.playEnemyHit) audio.playEnemyHit();

              if (defeated) {
                if (level && level.gameState) {
                  level.gameState.addScore(enemy.scoreValue);
                }
                if (level.director) {
                  level.director.telemetry.recordSuccess('starshot', enemy.scoreValue, enemy.x, enemy.y);
                }
                if (level.spawnBurst) {
                  level.spawnBurst(enemy.x + enemy.width / 2, enemy.y + 15, 14, '#38bdf8');
                  level.spawnBurst(enemy.x + enemy.width / 2, enemy.y + 15, 6, '#fbbf24');
                }
                if (camera && camera.shake) camera.shake(7, 0.14);
              } else {
                if (level.spawnBurst) {
                  level.spawnBurst(enemy.x + enemy.width / 2, enemy.y + 15, 8, '#38bdf8');
                }
              }
              return;
            }
          }
        }
      }
    }

    // Update trail particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].alpha -= dt * 3.2;
      if (this.particles[i].alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  draw(ctx) {
    if (this.isDead) return;
    ctx.save();

    // Render trail particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1.0;
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);

    // Glowing outer diamond star
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(4, -3);
    ctx.lineTo(12, 0);
    ctx.lineTo(4, 3);
    ctx.lineTo(0, 12);
    ctx.lineTo(-4, 3);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-4, -3);
    ctx.closePath();
    ctx.fill();

    // Radiant core
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
