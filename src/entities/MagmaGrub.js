import { Enemy } from './Enemy.js';
import { ENCOUNTER_ROLES } from '../ai/EncounterCoordinator.js';

/**
 * MAGMA GRUB
 * Canonical Volcanic Enemy: Accordion-crawling caterpillar with glowing molten honey nodules.
 * 
 * 8 Canonical Attributes:
 * 1. ROLE: FODDER (Predictable baseline hazard, rhythmic crawl)
 * 2. THREAT: Rating 1.5/5 (Low threat, platform obstacle)
 * 3. COUNTER: Simple stomp or Princess Starbeam shot
 * 4. TELEGRAPH: Pauses before scrunching forward (0.25s)
 * 5. MOVEMENT STYLE: Rhythmic accordion crawl with fiery tail glow
 * 6. ATTACK STYLE: Contact damage
 * 7. RECOVERY: Squashes flat upon stomp
 * 8. ENVIRONMENTAL PREFERENCE: Basalt rock terraces and cave tunnels
 */
export class MagmaGrub extends Enemy {
  constructor(x, y) {
    super(x, y, 48, 32, {
      name: 'Magma Grub',
      species: 'magma_grub',
      role: ENCOUNTER_ROLES.FODDER,
      threatLevel: 1.5,
      counterHint: 'Stomp or shoot with Starbeam',
      telegraphDesc: 'Scrunch pauses before expanding forward',
      movementStyle: 'Rhythmic accordion crawl',
      attackStyle: 'Contact burn',
      recoveryDesc: 'Squashed flat',
      environmentalPreference: 'Basalt terraces & cave paths',
      health: 1,
      damage: 1,
      speed: 45,
      gravity: 2100,
      detectionRange: 200,
      scoreValue: 120,
    });

    this.patrolStartX = x - 90;
    this.patrolEndX = x + 90;
    this.facing = 1;
    this.crawlCycle = 0;
  }

  update(dt, level, player, camera) {
    if (this.isDead) {
      super.update(dt, level, player, camera);
      return;
    }

    this.crawlCycle += dt * 4;

    // Patrolling logic
    this.vx = this.facing * this.speed;
    if (this.x > this.patrolEndX) {
      this.facing = -1;
    } else if (this.x < this.patrolStartX) {
      this.facing = 1;
    }

    super.update(dt, level, player, camera);
  }
}
