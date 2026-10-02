import assetsConfig from '../assets/assets.json';
import { assetManager } from './AssetManager.js';

/**
 * ASSET REGISTRY
 * Decoupled asset resolution layer.
 * Guarantees game code NEVER binds directly to concrete filenames or raster paths.
 * 
 * Usage:
 *   const img = assetRegistry.resolve('aria.idle');
 *   const wall = assetRegistry.resolve('worlds.honeywood.hive.wall');
 */
export class AssetRegistry {
  constructor() {
    this.registry = assetsConfig;
    this.overrides = new Map();
  }

  /**
   * Resolve a dot-notated logical key to an image element or asset descriptor.
   * Example: 'characters.aria.run', 'enemies.honeyBeetle.idle', 'worlds.honeywood.backgrounds.sky'
   */
  resolveKey(logicalKey) {
    if (this.overrides.has(logicalKey)) {
      return this.overrides.get(logicalKey);
    }

    const parts = logicalKey.split('.');
    let curr = this.registry;
    for (const part of parts) {
      if (curr && curr[part] !== undefined) {
        curr = curr[part];
      } else {
        return null;
      }
    }
    return curr;
  }

  /**
   * Get preloaded Image from AssetManager using logical key.
   */
  resolveImage(logicalKey) {
    const assetPath = this.resolveKey(logicalKey);
    if (typeof assetPath === 'string') {
      return assetManager.getImage(assetPath);
    }
    return null;
  }

  /**
   * Hot-swap an asset at runtime without altering game code.
   */
  registerOverride(logicalKey, replacementPath) {
    this.overrides.set(logicalKey, replacementPath);
  }
}

export const assetRegistry = new AssetRegistry();
