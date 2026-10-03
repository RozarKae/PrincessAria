/**
 * ROUTE MANAGER & MULTI-PATH RECONNECTION SYSTEM
 * 
 * Supports authored level route topologies:
 * - SAFE ROUTE: Low-risk ground path, clear line of sight, minimal gap traversal.
 * - STANDARD ROUTE: Intended baseline platforming sequence (e.g., rope bridge, mid-tier boughs).
 * - ADVANCED ROUTE: High elevation, smaller landing surfaces, tighter timing, high reward.
 * - SECRET ROUTE: Hidden branches, climbable vines, obscured alcoves leading to discovery bonuses.
 * 
 * Routes can branch, fork, and seamlessly reconnect to the main progression line.
 */

export const ROUTE_TYPES = {
  SAFE: 'SAFE_ROUTE',
  STANDARD: 'STANDARD_ROUTE',
  ADVANCED: 'ADVANCED_ROUTE',
  SECRET: 'SECRET_ROUTE',
};

export const ROUTE_COLORS = {
  [ROUTE_TYPES.SAFE]: '#34d399',       // Emerald/mint
  [ROUTE_TYPES.STANDARD]: '#38bdf8',   // Azure blue
  [ROUTE_TYPES.ADVANCED]: '#f59e0b',   // Warm amber
  [ROUTE_TYPES.SECRET]: '#c084fc',     // Radiant violet
};

/**
 * Spatial definition of an authored route section with reconnection metadata.
 */
export class RouteZone {
  constructor(config = {}) {
    this.id = config.id || 'unnamed_route';
    this.name = config.name || this.id;
    this.type = config.type || ROUTE_TYPES.STANDARD;
    
    // Spatial bounding box in world pixels
    this.bounds = {
      minX: config.bounds?.minX !== undefined ? config.bounds.minX : 0,
      maxX: config.bounds?.maxX !== undefined ? config.bounds.maxX : 1000,
      minY: config.bounds?.minY !== undefined ? config.bounds.minY : 0,
      maxY: config.bounds?.maxY !== undefined ? config.bounds.maxY : 1080,
    };

    // Entry coordinates
    this.entryPoint = config.entryPoint || { x: this.bounds.minX, y: this.bounds.maxY };

    // Reconnection Point: Where this route safely rejoins the baseline flow
    this.reconnectPoint = config.reconnectPoint || {
      x: this.bounds.maxX,
      y: this.bounds.maxY,
      targetRouteType: ROUTE_TYPES.STANDARD,
      targetBeatName: 'RELIEF',
      description: 'Rejoins main terrace after traversal',
    };

    // Design attributes
    this.riskLevel = config.riskLevel || 1; // 1 (peaceful) to 5 (high peril)
    this.rewardMultiplier = config.rewardMultiplier || 1.0;
    this.suggestedPacingBeat = config.suggestedPacingBeat || null;
    this.description = config.description || '';
  }

  contains(x, y) {
    return (
      x >= this.bounds.minX &&
      x <= this.bounds.maxX &&
      y >= this.bounds.minY &&
      y <= this.bounds.maxY
    );
  }
}

/**
 * RouteManager orchestrates route detection, branching, and reconnection.
 */
export class RouteManager {
  constructor() {
    this.routes = new Map();
    this.currentRoute = ROUTE_TYPES.STANDARD;
    this.currentZone = null;
    this.previousRoute = null;

    // Route telemetry
    this.routeHistory = [];
    this.timeInRoute = {
      [ROUTE_TYPES.SAFE]: 0,
      [ROUTE_TYPES.STANDARD]: 0,
      [ROUTE_TYPES.ADVANCED]: 0,
      [ROUTE_TYPES.SECRET]: 0,
    };

    this.listeners = new Set();
  }

  /**
   * Register a route zone with the manager.
   */
  addRouteZone(zone) {
    const rZone = zone instanceof RouteZone ? zone : new RouteZone(zone);
    this.routes.set(rZone.id, rZone);
    return rZone;
  }

  /**
   * Register an event listener for route transitions: (newRoute, oldRoute, zone) => void
   */
  onRouteChanged(callback) {
    this.listeners.add(callback);
  }

  reset() {
    this.currentRoute = ROUTE_TYPES.STANDARD;
    this.currentZone = null;
    this.previousRoute = null;
    this.routeHistory = [];
    for (const key of Object.keys(this.timeInRoute)) {
      this.timeInRoute[key] = 0;
    }
  }

  /**
   * Update and evaluate player route location based on position and elevation.
   */
  update(dt, player) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height;

    // Find all matching route zones
    let matchedZone = null;
    // Higher elevation / specialized routes take priority over wide ground catch-alls
    const priority = [ROUTE_TYPES.SECRET, ROUTE_TYPES.ADVANCED, ROUTE_TYPES.STANDARD, ROUTE_TYPES.SAFE];

    for (const pType of priority) {
      for (const zone of this.routes.values()) {
        if (zone.type === pType && zone.contains(px, py)) {
          matchedZone = zone;
          break;
        }
      }
      if (matchedZone) break;
    }

    // Default route determination if no explicit zone matched
    let activeType = ROUTE_TYPES.STANDARD;
    if (matchedZone) {
      activeType = matchedZone.type;
    } else {
      // Fallback heuristic: low elevation ground = SAFE, mid elevation = STANDARD, high elevation = ADVANCED
      if (py >= 840) {
        activeType = ROUTE_TYPES.SAFE;
      } else if (py <= 520) {
        activeType = ROUTE_TYPES.ADVANCED;
      } else {
        activeType = ROUTE_TYPES.STANDARD;
      }
    }

    // Accumulate time in active route
    if (this.timeInRoute[activeType] !== undefined) {
      this.timeInRoute[activeType] += dt;
    }

    // Detect route transition
    if (activeType !== this.currentRoute || matchedZone !== this.currentZone) {
      const oldRoute = this.currentRoute;
      this.previousRoute = oldRoute;
      this.currentRoute = activeType;
      this.currentZone = matchedZone;

      this.routeHistory.push({
        from: oldRoute,
        to: activeType,
        x: px,
        y: py,
        zoneId: matchedZone ? matchedZone.id : 'heuristic',
        timestamp: performance.now(),
      });

      // Fire listeners
      for (const listener of this.listeners) {
        try {
          listener(activeType, oldRoute, matchedZone);
        } catch (err) {
          console.error('[RouteManager] Error in route transition callback:', err);
        }
      }
    }

    return {
      currentRoute: this.currentRoute,
      currentZone: this.currentZone,
      isReconnecting: this.checkIsReconnecting(px, py),
    };
  }

  /**
   * Check if player is approaching or passing through an authored route reconnect point.
   */
  checkIsReconnecting(x, y) {
    if (!this.currentZone || !this.currentZone.reconnectPoint) return null;
    const rp = this.currentZone.reconnectPoint;
    const distSq = (x - rp.x) * (x - rp.x) + (y - rp.y) * (y - rp.y);
    if (distSq < 120 * 120) {
      return rp;
    }
    return null;
  }

  /**
   * Authored Route Topology for Vertical Slice (Honeywood Glade 2,600px).
   */
  static createDefaultHoneywoodRoutes() {
    const rm = new RouteManager();

    // 1. SAFE ROUTE: Meadow floor loam and low turf (x: 0 to 2600, y: 760 to 920)
    rm.addRouteZone({
      id: 'meadow_floor_safe',
      name: 'Meadow Floor (Safe Ground Route)',
      type: ROUTE_TYPES.SAFE,
      bounds: { minX: 0, maxX: 2600, minY: 760, maxY: 940 },
      riskLevel: 1,
      rewardMultiplier: 1.0,
      description: 'Continuous grassy peat loam. Low risk, direct path with ground flowers.',
    });

    // 2. STANDARD ROUTE: Low Oak Bough & Suspended Rope Bridge (x: 600 to 1420, y: 550 to 760)
    rm.addRouteZone({
      id: 'oak_bough_and_rope_bridge',
      name: 'Rope Bridge Traversal (Standard Route)',
      type: ROUTE_TYPES.STANDARD,
      bounds: { minX: 600, maxX: 1420, minY: 550, maxY: 760 },
      entryPoint: { x: 620, y: 720 },
      reconnectPoint: {
        x: 1420,
        y: 640,
        targetRouteType: ROUTE_TYPES.SAFE,
        targetBeatName: 'RELIEF',
        description: 'Rejoins the Sunstone Terrace at x: 1420',
      },
      riskLevel: 2,
      rewardMultiplier: 1.25,
      description: 'Classic platformer challenge across the rope bridge over patrolling Hive Grub.',
    });

    // 3. ADVANCED ROUTE: High Canopy Terrace & Long Branch Leaps (x: 1240 to 1640, y: 340 to 550)
    rm.addRouteZone({
      id: 'high_canopy_terrace',
      name: 'High Canopy Bough (Advanced Route)',
      type: ROUTE_TYPES.ADVANCED,
      bounds: { minX: 1240, maxX: 1640, minY: 420, maxY: 550 },
      entryPoint: { x: 1260, y: 460 },
      reconnectPoint: {
        x: 1540,
        y: 720,
        targetRouteType: ROUTE_TYPES.SAFE,
        targetBeatName: 'RELIEF',
        description: 'Drops down gently to the eastern clearing at x: 1540',
      },
      riskLevel: 3,
      rewardMultiplier: 1.8,
      description: 'High-elevation branch leap requiring momentum jumping.',
    });

    // 4. SECRET ROUTE: Sunstone Canopy Sanctum (x: 1300 to 1440, y: 320 to 420)
    rm.addRouteZone({
      id: 'sunstone_canopy_sanctum_secret',
      name: 'Sunstone Canopy Sanctum (Secret Route)',
      type: ROUTE_TYPES.SECRET,
      bounds: { minX: 1300, maxX: 1440, minY: 320, maxY: 420 },
      entryPoint: { x: 1320, y: 390 },
      reconnectPoint: {
        x: 1420,
        y: 460,
        targetRouteType: ROUTE_TYPES.ADVANCED,
        targetBeatName: 'EXPLORATION',
        description: 'Slides onto lower oak bough reconnecting with advanced route',
      },
      riskLevel: 2,
      rewardMultiplier: 2.5,
      description: 'Hidden golden honeycomb shelf housing the Sun Crystal.',
    });

    // 5. ADVANCED ROUTE: Amber Chasm Bouncy Rafts & Vines (x: 2600 to 3520, y: 440 to 860)
    rm.addRouteZone({
      id: 'chasm_amber_raft_crossing',
      name: 'The Amber Chasm Crossing (Advanced Route)',
      type: ROUTE_TYPES.ADVANCED,
      bounds: { minX: 2600, maxX: 3520, minY: 440, maxY: 860 },
      entryPoint: { x: 2680, y: 760 },
      reconnectPoint: {
        x: 3520,
        y: 720,
        targetRouteType: ROUTE_TYPES.STANDARD,
        targetBeatName: 'RELIEF',
        description: 'Rejoins the Hollow Redwood Base Terrace sanctuary at x: 3520',
      },
      riskLevel: 4,
      rewardMultiplier: 2.2,
      description: 'Elastic trampoline leaps across bottomless amber chasm and hanging sequoia vines.',
    });

    // 6. STANDARD ROUTE: Hollow Redwood & Amber Cataract (x: 3520 to 4250, y: 400 to 760)
    rm.addRouteZone({
      id: 'hollow_redwood_ascent',
      name: 'The Great Hollow Redwood (Standard Route)',
      type: ROUTE_TYPES.STANDARD,
      bounds: { minX: 3520, maxX: 4250, minY: 400, maxY: 760 },
      entryPoint: { x: 3540, y: 720 },
      reconnectPoint: {
        x: 4320,
        y: 680,
        targetRouteType: ROUTE_TYPES.STANDARD,
        targetBeatName: 'EXPLORATION',
        description: 'Exits onto Lower Root Bridge at x: 4320',
      },
      riskLevel: 3,
      rewardMultiplier: 1.5,
      description: 'Ascending interior fungal shelves and bouncy amber cataract chamber inside the giant sequoia.',
    });

    // 7. SECRET ROUTE: The Forgotten Royal Apiary Sanctuary (x: 4300 to 4700, y: 220 to 380)
    rm.addRouteZone({
      id: 'royal_apiary_secret',
      name: 'The Forgotten Royal Apiary (Secret Route)',
      type: ROUTE_TYPES.SECRET,
      bounds: { minX: 4300, maxX: 4700, minY: 220, maxY: 380 },
      entryPoint: { x: 4360, y: 340 },
      reconnectPoint: {
        x: 4800,
        y: 780,
        targetRouteType: ROUTE_TYPES.SAFE,
        targetBeatName: 'CLIMAX',
        description: 'Drops down to Outpost Approach stone terrace at x: 4800',
      },
      riskLevel: 3,
      rewardMultiplier: 3.0,
      description: 'High canopy sanctuary housing ancient royal relics and floating sun crystal.',
    });

    // 8. SAFE ROUTE: Outpost Gateway (x: 4750 to 5200, y: 700 to 900)
    rm.addRouteZone({
      id: 'outpost_gateway_safe',
      name: 'Outpost Gateway (Safe Route)',
      type: ROUTE_TYPES.SAFE,
      bounds: { minX: 4750, maxX: 5200, minY: 700, maxY: 900 },
      entryPoint: { x: 4800, y: 780 },
      reconnectPoint: {
        x: 5240,
        y: 780,
        targetRouteType: ROUTE_TYPES.STANDARD,
        targetBeatName: 'DISCOVERY',
        description: 'Reaches Colonnade Gateway and Crumbling Fortress threshold',
      },
      riskLevel: 1,
      rewardMultiplier: 1.0,
      description: 'Ancient mossy granite terrace leading to the Sunstone Arch gateway.',
    });

    // 9. ADVANCED ROUTE: Aqueduct Viaduct & Moving Runestones (x: 5500 to 6180, y: 520 to 760)
    rm.addRouteZone({
      id: 'aqueduct_viaduct_runestones',
      name: 'Aqueduct Viaduct (Advanced Route)',
      type: ROUTE_TYPES.ADVANCED,
      bounds: { minX: 5500, maxX: 6180, minY: 520, maxY: 760 },
      entryPoint: { x: 5540, y: 700 },
      reconnectPoint: {
        x: 6180,
        y: 660,
        targetRouteType: ROUTE_TYPES.STANDARD,
        targetBeatName: 'EXPLORATION',
        description: 'Transfers to the central aqueduct pier and vertical elevator',
      },
      riskLevel: 4,
      rewardMultiplier: 2.4,
      description: 'Precision timing across moving runestone lifts and trembling crumble blocks over moat void.',
    });

    // 10. SECRET ROUTE: The Sunstone Armory Vault (x: 6160 to 6500, y: 200 to 440)
    rm.addRouteZone({
      id: 'fortress_armory_vault',
      name: 'The Sunstone Armory Vault (Secret Route)',
      type: ROUTE_TYPES.SECRET,
      bounds: { minX: 6160, maxX: 6500, minY: 200, maxY: 440 },
      entryPoint: { x: 6220, y: 420 },
      reconnectPoint: {
        x: 6440,
        y: 740,
        targetRouteType: ROUTE_TYPES.STANDARD,
        targetBeatName: 'TEACH',
        description: 'Drops down to Lower Canal Terrace at x: 6440',
      },
      riskLevel: 3,
      rewardMultiplier: 3.5,
      description: 'High royal armory pavilion housing floating sunstone gem and ancient crown shards.',
    });

    // 11. STANDARD ROUTE: Watchtower Rampart Ascent (x: 6860 to 7600, y: 340 to 780)
    rm.addRouteZone({
      id: 'watchtower_ramparts_ascent',
      name: 'The Sunstone Fortress Watchtower (Standard Route)',
      type: ROUTE_TYPES.STANDARD,
      bounds: { minX: 6860, maxX: 7600, minY: 340, maxY: 780 },
      entryPoint: { x: 6880, y: 740 },
      reconnectPoint: {
        x: 7680,
        y: 760,
        targetRouteType: ROUTE_TYPES.SAFE,
        targetBeatName: 'CLIMAX',
        description: 'Descends to the Grand Citadel Bridge at x: 7680',
      },
      riskLevel: 3,
      rewardMultiplier: 2.0,
      description: 'Stepped ramparts ascending the monumental white granite watchtower under beetle siege.',
    });

    // 12. SAFE ROUTE: Grand Citadel Gateway Viaduct (x: 7650 to 8000, y: 680 to 900)
    rm.addRouteZone({
      id: 'citadel_gateway_viaduct',
      name: 'Grand Citadel Gateway Viaduct (Safe Route)',
      type: ROUTE_TYPES.SAFE,
      bounds: { minX: 7650, maxX: 8000, minY: 680, maxY: 900 },
      entryPoint: { x: 7680, y: 760 },
      reconnectPoint: {
        x: 8000,
        y: 760,
        targetRouteType: ROUTE_TYPES.SAFE,
        targetBeatName: 'DISCOVERY',
        description: 'Crosses citadel bridge to Spire Threshold Gateway at x: 8000',
      },
      riskLevel: 1,
      rewardMultiplier: 1.0,
      description: 'Grand royal citadel bridge leading to the Spire threshold colonnade.',
    });

    // 13. SAFE ROUTE: Spire Threshold Colonnade (x: 8000 to 8460, y: 680 to 900)
    rm.addRouteZone({
      id: 'spire_threshold_gateway',
      name: 'The Spire Gateway Colonnade (Safe Route)',
      type: ROUTE_TYPES.SAFE,
      bounds: { minX: 8000, maxX: 8460, minY: 680, maxY: 900 },
      entryPoint: { x: 8000, y: 760 },
      reconnectPoint: {
        x: 8460,
        y: 680,
        targetRouteType: ROUTE_TYPES.ADVANCED,
        targetBeatName: 'CHALLENGE',
        description: 'Reaches the edge of the Hexagonal Gauntlet at x: 8460',
      },
      riskLevel: 1,
      rewardMultiplier: 1.0,
      description: 'Grand obsidian hex pillars and Checkpoint 5 marking entry into the Sovereign Spire.',
    });

    // 14. ADVANCED ROUTE: Hex Gauntlet & Geysers (x: 8460 to 9100, y: 460 to 820)
    rm.addRouteZone({
      id: 'hex_gauntlet_geysers',
      name: 'The Hexagonal Gauntlet & Honey Geysers (Advanced Route)',
      type: ROUTE_TYPES.ADVANCED,
      bounds: { minX: 8460, maxX: 9100, minY: 460, maxY: 820 },
      entryPoint: { x: 8460, y: 680 },
      reconnectPoint: {
        x: 8980,
        y: 380,
        targetRouteType: ROUTE_TYPES.SECRET,
        targetBeatName: 'EXPLORATION',
        description: 'Launches up into High Spire Gallery at x: 8980',
      },
      riskLevel: 4,
      rewardMultiplier: 2.5,
      description: 'Moving obsidian hex lifts and vertical golden updraft geysers over bottomless void.',
    });

    // 15. SECRET ROUTE: The Queen\'s Forbidden Secret Vault (x: 9100 to 9560, y: 220 to 420)
    rm.addRouteZone({
      id: 'queen_secret_vault',
      name: "The Queen's Forbidden Vault (Secret Route)",
      type: ROUTE_TYPES.SECRET,
      bounds: { minX: 9100, maxX: 9560, minY: 220, maxY: 420 },
      entryPoint: { x: 9260, y: 340 },
      reconnectPoint: {
        x: 9840,
        y: 720,
        targetRouteType: ROUTE_TYPES.STANDARD,
        targetBeatName: 'ESCALATION',
        description: 'Descends to the Royal Ante-Chamber at x: 9840',
      },
      riskLevel: 3,
      rewardMultiplier: 4.0,
      description: "High secret sanctuary housing Khan's enchanted bat keepsake and royal shard cache.",
    });

    // 16. STANDARD ROUTE: Sticky Amber Nectar Run (x: 9200 to 9700, y: 640 to 820)
    rm.addRouteZone({
      id: 'sticky_amber_run',
      name: 'Sticky Amber Nectar Run (Standard Route)',
      type: ROUTE_TYPES.STANDARD,
      bounds: { minX: 9200, maxX: 9700, minY: 640, maxY: 820 },
      entryPoint: { x: 9240, y: 760 },
      reconnectPoint: {
        x: 9840,
        y: 720,
        targetRouteType: ROUTE_TYPES.STANDARD,
        targetBeatName: 'ESCALATION',
        description: 'Transitions to Ante-Chamber terrace at x: 9840',
      },
      riskLevel: 2,
      rewardMultiplier: 1.5,
      description: 'Lower viscous amber nectar corridor requiring momentum control under beetle patrol.',
    });

    // 17. STANDARD ROUTE: Royal Guard Ante-Chamber (x: 9700 to 10180, y: 440 to 820)
    rm.addRouteZone({
      id: 'royal_antechamber_ascent',
      name: 'Royal Chrysalis Ante-Chamber (Standard Route)',
      type: ROUTE_TYPES.STANDARD,
      bounds: { minX: 9700, maxX: 10180, minY: 440, maxY: 820 },
      entryPoint: { x: 9840, y: 720 },
      reconnectPoint: {
        x: 10320,
        y: 720,
        targetRouteType: ROUTE_TYPES.SAFE,
        targetBeatName: 'CLIMAX',
        description: 'Launches onto Sovereign Throne Dais at x: 10320',
      },
      riskLevel: 3,
      rewardMultiplier: 2.2,
      description: "Vertical hex elevator and stepped ramparts under the Queen's elite royal guard defense.",
    });

    // 18. SAFE ROUTE: The Sovereign Royal Chrysalis Throne (x: 10180 to 10800, y: 480 to 900)
    rm.addRouteZone({
      id: 'sovereign_throne_climax',
      name: 'The Sovereign Chrysalis Throne (Climax Route)',
      type: ROUTE_TYPES.SAFE,
      bounds: { minX: 10180, maxX: 10800, minY: 480, maxY: 900 },
      entryPoint: { x: 10320, y: 720 },
      reconnectPoint: {
        x: 10480,
        y: 520,
        targetRouteType: ROUTE_TYPES.SAFE,
        targetBeatName: 'CLIMAX',
        description: 'Reaches Batboy rescue sanctuary at the Sovereign Hive Throne',
      },
      riskLevel: 1,
      rewardMultiplier: 1.0,
      description: 'The monumental climax of World 1: confronting the Queen Bee and shattering the Chrysalis to rescue Khan!',
    });

    return rm;
  }
}
