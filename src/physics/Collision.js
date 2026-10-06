/**
 * AABB (Axis-Aligned Bounding Box) collision detection and resolution.
 */
export class Collision {
  /**
   * Simple AABB overlap check.
   */
  static intersects(rectA, rectB) {
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    );
  }

  /**
   * Resolves player collision against a solid rectangular platform.
   * Modifies player position and velocity appropriately.
   * Returns: { landed: boolean, headBonk: boolean, wallHit: boolean }
   */
  static resolveSolidPlatform(player, platform) {
    const result = { landed: false, headBonk: false, wallHit: false };

    // Quick overlap test
    if (!this.intersects(player.getBounds(), platform)) {
      return result;
    }

    const b = player.getBounds();

    // Calculate overlap depths on both axes
    const overlapLeft = (b.x + b.width) - platform.x;
    const overlapRight = (platform.x + platform.width) - b.x;
    const overlapTop = (b.y + b.height) - platform.y;
    const overlapBottom = (platform.y + platform.height) - b.y;

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    // Resolve along axis of least penetration
    if (minOverlapY < minOverlapX) {
      if (overlapTop < overlapBottom) {
        // Landing on top of platform
        if (player.vy >= 0) {
          player.y = platform.y - player.height;
          player.standingPlatform = platform;
          player.surfaceVx = platform.currentVx || 0;

          // Surface friction assignment
          if (platform.friction !== undefined) {
            player.currentSurfaceFriction = platform.friction;
          } else if (platform.type === 'slippery_mayo' || platform.type === 'mayo') {
            player.currentSurfaceFriction = 0.38; // Ultra slippery mayonnaise condiment slide!
          } else if (platform.type === 'toast_dune' || platform.type === 'bread_ground') {
            player.currentSurfaceFriction = 1.08; // Crispy toasted sesame crumb traction
          } else if (platform.type === 'castle_ground' || platform.type === 'castle_stone' || platform.type === 'marble') {
            player.currentSurfaceFriction = 0.72; // Slick polished marble slide
          } else if (platform.type === 'mossy_bark') {
            player.currentSurfaceFriction = 1.15; // Grippy organic moss
          } else if (platform.type === 'sticky_amber') {
            player.currentSurfaceFriction = 2.2; // High viscous drag
          } else {
            player.currentSurfaceFriction = 1.0;
          }

          if (platform.type === 'honey' || platform.type === 'moving_honey') {
            player.vy = -780; // High elastic trampoline bounce!
            player.isGrounded = false;
            player.scaleX = 0.72;
            player.scaleY = 1.38;
            result.bounced = true;
          } else if (platform.type === 'bouncy_pickle' || platform.type === 'pickle') {
            player.vy = -920; // Crinkle-cut tangy dill pickle spring launch!
            player.isGrounded = false;
            player.scaleX = 0.64;
            player.scaleY = 1.45;
            result.bounced = true;
          } else if (platform.type === 'bouncy_mushroom' || platform.type === 'mushroom') {
            player.vy = -900; // Deep organic fungal spring leap!
            player.isGrounded = false;
            player.scaleX = 0.66;
            player.scaleY = 1.44;
            result.bounced = true;
            result.shroomBounce = true;
          } else if (platform.type === 'bouncy_crest') {
            player.vy = -860; // Heraldic crest bounce
            player.isGrounded = false;
            player.scaleX = 0.68;
            player.scaleY = 1.42;
            result.bounced = true;
          } else if (platform.type === 'bouncy_amber_magma') {
            player.vy = -880; // Volcanic bubbling magma bounce
            player.isGrounded = false;
            player.scaleX = 0.68;
            player.scaleY = 1.42;
            result.bounced = true;
          } else if (platform.type === 'thorn_bramble' || platform.type === 'bramble' || platform.type === 'hazard' || platform.type === 'spikes' || platform.type === 'iron_spikes' || platform.type === 'castle_hazard' || platform.type === 'molten_honey' || platform.type === 'lava' || platform.type === 'mustard_river' || platform.type === 'hot_mustard') {
            result.hazard = true;
          } else if (platform.type === 'snapping_flower') {
            // Snapping flower hazard: active if jaws open/chomping
            if (platform.isSnapping !== false) {
              result.hazard = true;
            } else {
              player.vy = 0;
              player.isGrounded = true;
              result.landed = true;
            }
          } else if (platform.type === 'honey_geyser' || platform.type === 'geyser' || platform.type === 'thermal_updraft' || platform.type === 'updraft') {
            player.vy = -940; // Buoyant updraft thermal catapult!
            player.isGrounded = false;
            player.scaleX = 0.65;
            player.scaleY = 1.48;
            result.geyserLaunch = true;
          } else if (platform.type === 'sticky_amber') {
            player.vy = 0;
            player.isGrounded = true;
            player.vx *= 0.45; // Viscous nectar friction
            result.landed = true;
          } else if (platform.type === 'spoon_bridge') {
            // World 1 Wooden Spoon Crossing: balance plank over honey river
            player.vy = 0;
            player.isGrounded = true;
            result.landed = true;
            result.spoon = true;
            const midX = platform.x + platform.width / 2;
            const footX = player.x + player.width / 2;
            platform.tilt = Math.max(-0.25, Math.min(0.25, (footX - midX) / (platform.width / 2) * 0.2));
          } else {
            player.vy = 0;
            player.isGrounded = true;
            result.landed = true;
            if ((platform.type === 'crumble_cracker' || platform.type === 'crumble_toast') && !platform.isShaking && !platform.isBroken) {
              // Rapid 0.4s cracker crumble in Desert of Sandwiches!
              platform.isShaking = true;
              platform.shakeTimer = 0.40;
              result.crumbled = true;
            } else if (platform.type === 'crumble_ash' && !platform.isShaking && !platform.isBroken) {
              // Rapid 0.35s ash collapse in Volcano!
              platform.isShaking = true;
              platform.shakeTimer = 0.35;
              result.crumbled = true;
            } else if ((platform.type === 'crumble_block' || platform.type === 'crumble' || platform.type === 'crumble_bark' || platform.type === 'crumble_stone') && !platform.isShaking && !platform.isBroken) {
              platform.isShaking = true;
              platform.shakeTimer = 0.65;
              result.crumbled = true;
            }
          }
        }
      } else {
        // Bonking head on ceiling
        if (player.vy < 0) {
          player.y = platform.y + platform.height;
          player.vy = 0;
          result.headBonk = true;
        }
      }
    } else {
      // Wall collision (left or right)
      if (overlapLeft < overlapRight) {
        player.x = platform.x - player.width;
      } else {
        player.x = platform.x + platform.width;
      }
      player.vx = 0;
      result.wallHit = true;
    }

    return result;
  }

  /**
   * Liang-Barsky line segment vs AABB intersection test.
   * Tests if line segment (x1, y1) -> (x2, y2) intersects rectangle (rx, ry, rw, rh).
   * @returns {boolean}
   */
  static lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
    // If either point is inside the rect, immediate intersection
    if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
    if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;

    const dx = x2 - x1;
    const dy = y2 - y1;

    let t0 = 0.0;
    let t1 = 1.0;

    const p = [-dx, dx, -dy, dy];
    const q = [x1 - rx, rx + rw - x1, y1 - ry, ry + rh - y1];

    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] < 0) return false;
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) {
          if (t > t1) return false;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return false;
          if (t < t1) t1 = t;
        }
      }
    }
    return t0 <= t1;
  }

  /**
   * Evaluates line of sight between two world positions.
   * Returns true if no solid platform occludes the direct line.
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {Array} platforms
   * @param {Object} [ignoredPlatform]
   * @returns {boolean}
   */
  static hasLineOfSight(x1, y1, x2, y2, platforms = [], ignoredPlatform = null) {
    if (!platforms || platforms.length === 0) return true;

    for (let i = 0; i < platforms.length; i++) {
      const plat = platforms[i];
      if (plat === ignoredPlatform) continue;

      // Fast bounding envelope check
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);

      if (
        plat.x + plat.width < minX ||
        plat.x > maxX ||
        plat.y + plat.height < minY ||
        plat.y > maxY
      ) {
        continue;
      }

      if (this.lineIntersectsRect(x1, y1, x2, y2, plat.x, plat.y, plat.width, plat.height)) {
        return false; // Occluded by solid platform
      }
    }
    return true; // Unobstructed line of sight
  }
}

