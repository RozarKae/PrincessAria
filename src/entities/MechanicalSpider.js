import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * MECHANICAL SPIDER
 * Canonical World 6 Ambush Automaton: Multi-legged brass arachnid that drops on chain tethers.
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: AMBUSH / ZONE DENIAL (Ceiling dropper & chokepoint guardian)
 * 2. THREAT: Rating 3/5 (Sudden vertical drops on brass chain tethers)
 * 3. COUNTER: Bait the drop from the side and slash while dangling, or stomp from above
 * 4. TELEGRAPH: Gears grind loudly, red optical sensors illuminate downward, legs twitch (0.4s)
 * 5. MOVEMENT STYLE: High-truss scuttle & rapid vertical chain descent/ascent
 * 6. ATTACK STYLE: Rapid vertical drop-strike with brass pincers
 * 7. RECOVERY: Pauses at chain apex or lowest point for 0.8s before reeling back
 * 8. ENVIRONMENTAL PREFERENCE: Underneath high bridges, astrolabe trusses, ceiling gearworks
 */
export class MechanicalSpider extends Enemy {
  constructor(x, y, options = {}) {
    super(x, y, 48, 36, {
      name: 'Mechanical Spider',
      species: 'mechanical_spider',
      role: ENCOUNTER_ROLES.AMBUSH,
      threatLevel: 3,
      counterHint: 'Bait its drop then slash while it hangs dangling on its brass chain',
      telegraphDesc: 'Gears click and red ocular lenses shine downward before drop',
      movementStyle: 'Ceiling scuttle & rapid vertical chain descent',
      attackStyle: 'Vertical drop-strike with sharp brass pincers',
      recoveryDesc: 'Hangs dangling at bottom of chain for 0.8s',
      environmentalPreference: 'High trusses, ceiling gearworks, narrow chasms',
      health: 1,
      damage: 1,
      speed: 110,
      gravity: 0, // Tethered
      detectionRange: 450,
      scoreValue: 260,
      patrolLeft: options.patrolLeft !== undefined ? options.patrolLeft : x - 120,
      patrolRight: options.patrolRight !== undefined ? options.patrolRight : x + 120,
    });

    this.anchorY = y;
    this.chainLength = 0;
    this.maxChainLength = options.dropDistance || 280;
    this.state = 'patrol'; // 'patrol', 'telegraph', 'dropping', 'hanging', 'reeling'
    this.hangTimer = 0;
    this.telegraphTimer = 0;
  }

  update(dt, level, player, camera) {
    if (this.isDead) {
      // If dead while dangling, fall with gravity
      this.vy += 1800 * dt;
      this.y += this.vy * dt;
      super.update(dt, level, player, camera);
      return;
    }

    if (player) {
      const dx = Math.abs((player.x + player.width / 2) - (this.x + this.width / 2));
      const dy = player.y - this.y;

      // Patrol horizontally along ceiling anchor
      if (this.state === 'patrol') {
        this.x += this.facing * this.speed * dt;
        if (this.x < this.patrolLeft) {
          this.x = this.patrolLeft;
          this.facing = 1;
        } else if (this.x > this.patrolRight) {
          this.x = this.patrolRight;
          this.facing = -1;
        }

        // Trigger drop ambush if Aria walks beneath
        if (dx < 65 && dy > 40 && dy < this.maxChainLength + 100) {
          this.state = 'telegraph';
          this.telegraphTimer = 0.4;
          this.vx = 0;
        }
      } else if (this.state === 'telegraph') {
        this.telegraphTimer -= dt;
        if (level && Math.random() < 0.3) {
          level.spawnSparkles(this.x + this.width / 2, this.y + this.height, 2);
        }
        if (this.telegraphTimer <= 0) {
          this.state = 'dropping';
        }
      } else if (this.state === 'dropping') {
        const dropSpeed = 420;
        this.chainLength += dropSpeed * dt;
        this.y = this.anchorY + this.chainLength;

        if (this.chainLength >= this.maxChainLength) {
          this.chainLength = this.maxChainLength;
          this.y = this.anchorY + this.chainLength;
          this.state = 'hanging';
          this.hangTimer = 0.85;
        }
      } else if (this.state === 'hanging') {
        this.hangTimer -= dt;
        if (this.hangTimer <= 0) {
          this.state = 'reeling';
        }
      } else if (this.state === 'reeling') {
        const reelSpeed = 190;
        this.chainLength -= reelSpeed * dt;
        this.y = this.anchorY + this.chainLength;

        if (this.chainLength <= 0) {
          this.chainLength = 0;
          this.y = this.anchorY;
          this.state = 'patrol';
        }
      }
    }
  }
}
