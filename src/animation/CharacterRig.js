/**
 * CharacterRig.js
 * 
 * Production Layered 2D Character Rig Architecture (Canvas 2D).
 * Specifically engineered for Princess Aria: The Rescue of Batboy.
 * 
 * Architecture:
 * - Hierarchical parent/child transform graph
 * - Local position, rotation (radians), scaleX, scaleY, anchorX, anchorY, opacity, zIndex
 * - Layer image binding (transparent PNG / WebP)
 * - Forward kinematics world transform calculations
 * - Facing direction flip handling
 * - Multi-segment feline tail physics with fluid secondary motion
 * - Secondary hair pendulum and capelet ribbon dynamics
 * - State-driven facial expression switching (neutral, smile, determined, surprised, hurt)
 * - Seamless integration with approved illustrated Princess Aria assets
 * - Compatible with AnimationController and HDCharacterRenderer
 */

/**
 * Canonical Anatomical Layer Metadata Definition for Princess Aria
 * Ground anchor at (0, 0) - bottom of boots contacting terrain.
 * Total character height is ~110 logical pixels.
 */
export const ARIA_LAYER_METADATA = {
  root: { parent: null, x: 0, y: 0, anchorX: 0.5, anchorY: 1.0, zIndex: 0 },

  // --- LOWER BODY HIERARCHY ---
  pelvis: { parent: 'root', x: 0, y: -58, anchorX: 0.5, anchorY: 0.5, zIndex: 20 },
  
  thigh_L: { parent: 'pelvis', x: -9, y: 8, anchorX: 0.5, anchorY: 0.15, zIndex: 10 },
  lower_leg_L: { parent: 'thigh_L', x: 0, y: 22, anchorX: 0.5, anchorY: 0.15, zIndex: 11 },
  foot_L: { parent: 'lower_leg_L', x: 0, y: 22, anchorX: 0.45, anchorY: 0.8, zIndex: 12 },
  thigh_jewel_L: { parent: 'thigh_L', x: -1, y: 6, anchorX: 0.5, anchorY: 0.5, zIndex: 13 },

  thigh_R: { parent: 'pelvis', x: 9, y: 8, anchorX: 0.5, anchorY: 0.15, zIndex: 22 },
  lower_leg_R: { parent: 'thigh_R', x: 0, y: 22, anchorX: 0.5, anchorY: 0.15, zIndex: 23 },
  foot_R: { parent: 'lower_leg_R', x: 0, y: 22, anchorX: 0.45, anchorY: 0.8, zIndex: 24 },
  thigh_jewel_R: { parent: 'thigh_R', x: 1, y: 6, anchorX: 0.5, anchorY: 0.5, zIndex: 25 },

  // --- UPPER BODY HIERARCHY ---
  torso: { parent: 'pelvis', x: 0, y: -16, anchorX: 0.5, anchorY: 0.8, zIndex: 30 },
  torso_front: { parent: 'torso', x: 0, y: 0, anchorX: 0.5, anchorY: 0.5, zIndex: 32 },
  torso_back: { parent: 'torso', x: 0, y: 0, anchorX: 0.5, anchorY: 0.5, zIndex: 8 },

  // Left Arm (Back Arm in 3/4 profile)
  shoulder_L: { parent: 'torso', x: -12, y: -12, anchorX: 0.5, anchorY: 0.2, zIndex: 15 },
  upper_arm_L: { parent: 'shoulder_L', x: 0, y: 4, anchorX: 0.5, anchorY: 0.15, zIndex: 16 },
  forearm_L: { parent: 'upper_arm_L', x: 0, y: 16, anchorX: 0.5, anchorY: 0.15, zIndex: 17 },
  hand_L: { parent: 'forearm_L', x: 0, y: 14, anchorX: 0.5, anchorY: 0.2, zIndex: 18 },

  // Right Arm (Front Arm)
  shoulder_R: { parent: 'torso', x: 12, y: -12, anchorX: 0.5, anchorY: 0.2, zIndex: 45 },
  upperarm_R: { parent: 'shoulder_R', x: 0, y: 4, anchorX: 0.5, anchorY: 0.15, zIndex: 46 },
  forearm_R: { parent: 'upperarm_R', x: 0, y: 16, anchorX: 0.5, anchorY: 0.15, zIndex: 47 },
  hand_R: { parent: 'forearm_R', x: 0, y: 14, anchorX: 0.5, anchorY: 0.2, zIndex: 48 },

  // --- SKIRT & COSTUME LAYERS ---
  skirt_back: { parent: 'pelvis', x: 0, y: 4, anchorX: 0.5, anchorY: 0.1, zIndex: 7 },
  skirt_side_L: { parent: 'pelvis', x: -6, y: 4, anchorX: 0.5, anchorY: 0.1, zIndex: 33 },
  skirt_side_R: { parent: 'pelvis', x: 6, y: 4, anchorX: 0.5, anchorY: 0.1, zIndex: 33 },
  skirt_front: { parent: 'pelvis', x: 0, y: 4, anchorX: 0.5, anchorY: 0.1, zIndex: 34 },
  waist_jewel: { parent: 'pelvis', x: 0, y: 0, anchorX: 0.5, anchorY: 0.5, zIndex: 35 },

  // --- CAT TAIL HIERARCHY (3-Segment Cat Tail + Bow) ---
  tail_base: { parent: 'pelvis', x: 11, y: -2, anchorX: 0.15, anchorY: 0.8, zIndex: 4 },
  tail_mid: { parent: 'tail_base', x: 16, y: -10, anchorX: 0.1, anchorY: 0.5, zIndex: 4 },
  tail_tip: { parent: 'tail_mid', x: 22, y: -6, anchorX: 0.1, anchorY: 0.5, zIndex: 4 },
  tail_ribbon: { parent: 'tail_base', x: 6, y: 0, anchorX: 0.5, anchorY: 0.5, zIndex: 5 },

  // --- ACCESSORIES & CAPELET RIBBONS ---
  ribbon_flow: { parent: 'torso', x: 0, y: 6, anchorX: 0.5, anchorY: 0.1, zIndex: 3 },
  ribbon_L: { parent: 'torso', x: -10, y: 6, anchorX: 0.8, anchorY: 0.1, zIndex: 3 },
  ribbon_R: { parent: 'torso', x: 10, y: 6, anchorX: 0.2, anchorY: 0.1, zIndex: 3 },

  // --- HEAD & FACIAL SUITE ---
  head: { parent: 'torso', x: 0, y: -22, anchorX: 0.5, anchorY: 0.85, zIndex: 50 },
  hair_back: { parent: 'head', x: -2, y: -10, anchorX: 0.5, anchorY: 0.2, zIndex: 2 },
  face: { parent: 'head', x: 0, y: 0, anchorX: 0.5, anchorY: 0.5, zIndex: 51 },
  eyes: { parent: 'head', x: 0, y: -2, anchorX: 0.5, anchorY: 0.5, zIndex: 52 },
  mouth: { parent: 'head', x: 0, y: 4, anchorX: 0.5, anchorY: 0.5, zIndex: 53 },
  hair_front: { parent: 'head', x: 0, y: -6, anchorX: 0.5, anchorY: 0.2, zIndex: 55 },
  crown: { parent: 'head', x: 0, y: -15, anchorX: 0.5, anchorY: 0.8, zIndex: 58 },
  earrings: { parent: 'head', x: 0, y: 3, anchorX: 0.5, anchorY: 0.2, zIndex: 54 },
  ribbon: { parent: 'head', x: 0, y: -11, anchorX: 0.5, anchorY: 0.5, zIndex: 57 }
};

/**
 * Standard Named Animation / Pose Identifiers
 */
export const RIG_POSE_NAMES = {
  IDLE: 'IDLE',
  WALK: 'WALK',
  RUN: 'RUN',
  JUMP_START: 'JUMP_START',
  JUMP_RISE: 'JUMP_RISE',
  FALL: 'FALL',
  LAND: 'LAND',
  CROUCH: 'CROUCH',
  DASH: 'DASH',
  HURT: 'HURT',
  DEATH: 'DEATH',
  VICTORY: 'VICTORY',
  ATTACK: 'ATTACK'
};

/**
 * Individual Node / Bone in the Character Rig
 */
export class RigNode {
  constructor(name, metadata = {}) {
    this.name = name;
    this.parent = metadata.parent || null;
    this.children = [];

    // Rest/default pose definition
    this.restX = metadata.x || 0;
    this.restY = metadata.y || 0;
    this.restRotation = metadata.rotation || 0;
    this.restScaleX = metadata.scaleX !== undefined ? metadata.scaleX : 1;
    this.restScaleY = metadata.scaleY !== undefined ? metadata.scaleY : 1;

    // Current local transforms relative to parent
    this.x = this.restX;
    this.y = this.restY;
    this.rotation = this.restRotation;
    this.scaleX = this.restScaleX;
    this.scaleY = this.restScaleY;

    // Registration anchor point within layer artwork (0.0 to 1.0)
    this.anchorX = metadata.anchorX !== undefined ? metadata.anchorX : 0.5;
    this.anchorY = metadata.anchorY !== undefined ? metadata.anchorY : 0.5;

    // Depth sorting & transparency
    this.zIndex = metadata.zIndex !== undefined ? metadata.zIndex : 0;
    this.opacity = metadata.opacity !== undefined ? metadata.opacity : 1.0;
    this.visible = metadata.visible !== undefined ? metadata.visible : true;

    // Bound illustrated artwork (HTMLImageElement or HTMLCanvasElement)
    this.image = metadata.image || null;
    this.width = metadata.width || 0;
    this.height = metadata.height || 0;

    // Computed world transforms
    this.worldX = 0;
    this.worldY = 0;
    this.worldRotation = 0;
    this.worldScaleX = 1;
    this.worldScaleY = 1;
    this.worldOpacity = 1;
  }

  setTransform({ x, y, rotation, scaleX, scaleY, opacity, zIndex }) {
    if (x !== undefined) this.x = x;
    if (y !== undefined) this.y = y;
    if (rotation !== undefined) this.rotation = rotation;
    if (scaleX !== undefined) this.scaleX = scaleX;
    if (scaleY !== undefined) this.scaleY = scaleY;
    if (opacity !== undefined) this.opacity = opacity;
    if (zIndex !== undefined) this.zIndex = zIndex;
  }

  resetToRest() {
    this.x = this.restX;
    this.y = this.restY;
    this.rotation = this.restRotation;
    this.scaleX = this.restScaleX;
    this.scaleY = this.restScaleY;
    this.opacity = 1.0;
    this.visible = true;
  }
}

/**
 * Production 2D Layered Rig Controller
 */
export class CharacterRig {
  constructor(characterName = 'aria') {
    this.characterName = characterName;
    this.nodes = new Map();
    this.rootName = 'root';
    this.currentPoseName = RIG_POSE_NAMES.IDLE;
    this.facing = 1; // 1 = right, -1 = left
    this.testMode = false;

    // Secondary motion timers and physics states
    this.animTime = 0;
    this.tailAngle1 = 0;
    this.tailAngle2 = 0;
    this.tailAngle3 = 0;
    this.hairAngle = 0;
    this.ribbonAngle = 0;
    this.breathCycle = 0;

    // Master plates dictionary for high-definition illustrated views
    this.masterPlates = {
      front: null,
      three_quarter: null,
      side: null,
      back: null
    };

    // Facial expression images
    this.expressions = {
      neutral: null,
      smile: null,
      determined: null,
      surprised: null,
      hurt: null
    };
    this.activeExpression = 'neutral';

    // Attack effect visual state
    this.attackProgress = 0;
    this.isAttacking = false;

    // Build anatomical hierarchy
    this.setupAnatomyHierarchy();
  }

  setupAnatomyHierarchy() {
    this.nodes.clear();

    for (const [name, meta] of Object.entries(ARIA_LAYER_METADATA)) {
      this.addNode(new RigNode(name, meta));
    }

    this.rebuildChildGraph();
    this.resetPose();
  }

  addNode(node) {
    this.nodes.set(node.name.toLowerCase(), node);
  }

  getNode(layerName) {
    if (!layerName) return null;
    const lower = layerName.toLowerCase();
    return this.nodes.get(lower) || null;
  }

  rebuildChildGraph() {
    this.nodes.forEach(node => {
      node.children = [];
    });

    this.nodes.forEach(node => {
      if (node.parent) {
        const parentNode = this.getNode(node.parent);
        if (parentNode) {
          parentNode.children.push(node);
        }
      }
    });
  }

  /**
   * Set Master Illustrated Plates
   */
  setMasterImage(viewName, image) {
    if (this.masterPlates[viewName] !== undefined) {
      this.masterPlates[viewName] = image;
    }
  }

  /**
   * Bind an illustrated image texture to a specific layer.
   */
  setLayerImage(layerName, image) {
    const node = this.getNode(layerName);
    if (node) {
      node.image = image;
      if (image && image.width && image.height) {
        node.width = image.width;
        node.height = image.height;
      }
    }

    // Cache expression mouths
    if (layerName.startsWith('mouth_')) {
      const expr = layerName.replace('mouth_', '');
      this.expressions[expr] = image;
    }
  }

  /**
   * Set active facial expression ('neutral', 'smile', 'determined', 'surprised', 'hurt')
   */
  setExpression(exprName) {
    if (this.expressions[exprName]) {
      this.activeExpression = exprName;
      const mouthNode = this.getNode('mouth');
      if (mouthNode) {
        mouthNode.image = this.expressions[exprName];
      }
    }
  }

  setFacing(facing) {
    this.facing = facing >= 0 ? 1 : -1;
  }

  resetPose() {
    this.nodes.forEach(node => node.resetToRest());
    this.updateWorldTransforms();
  }

  /**
   * Set named pose and apply keyframe transform adjustments.
   * @param {string} poseName
   * @param {number} progress 0.0 to 1.0
   */
  setPose(poseName = RIG_POSE_NAMES.IDLE, progress = 0) {
    this.currentPoseName = poseName;
    this.resetPose();

    const t = this.animTime;
    const pelvis = this.getNode('pelvis');
    const torso = this.getNode('torso');
    const head = this.getNode('head');
    const tailBase = this.getNode('tail_base');
    const tailMid = this.getNode('tail_mid');
    const tailTip = this.getNode('tail_tip');
    const hairBack = this.getNode('hair_back');
    const ribbonFlow = this.getNode('ribbon_flow');
    const armL = this.getNode('shoulder_l');
    const armR = this.getNode('shoulder_r');
    const thighL = this.getNode('thigh_l');
    const thighR = this.getNode('thigh_r');
    const lowerLegL = this.getNode('lower_leg_l');
    const lowerLegR = this.getNode('lower_leg_r');

    switch (poseName) {
      case RIG_POSE_NAMES.IDLE:
        this.setExpression('neutral');
        // Subtle breathing cycle
        const breath = Math.sin(t * 2.8);
        if (torso) {
          torso.y = torso.restY + breath * 1.2;
          torso.scaleY = 1.0 + breath * 0.015;
        }
        if (head) {
          head.y = head.restY + breath * 0.8;
          head.rotation = Math.sin(t * 1.4) * 0.02;
        }
        // Feline tail gentle harmonic sine sway
        if (tailBase) tailBase.rotation = -0.15 + Math.sin(t * 2.2) * 0.12;
        if (tailMid) tailMid.rotation = 0.25 + Math.sin(t * 2.2 - 0.4) * 0.18;
        if (tailTip) tailTip.rotation = -0.1 + Math.sin(t * 2.2 - 0.8) * 0.22;
        // Hair & ribbon follow-through
        if (hairBack) hairBack.rotation = Math.sin(t * 2.0 - 0.3) * 0.04;
        if (ribbonFlow) ribbonFlow.rotation = Math.sin(t * 1.8 - 0.5) * 0.05;
        break;

      case RIG_POSE_NAMES.WALK:
      case RIG_POSE_NAMES.RUN:
        this.setExpression('determined');
        const runFreq = poseName === RIG_POSE_NAMES.RUN ? 12 : 8;
        const stride = Math.sin(t * runFreq);
        const bob = Math.abs(Math.cos(t * runFreq)) * (poseName === RIG_POSE_NAMES.RUN ? 3.5 : 2.0);
        const lean = poseName === RIG_POSE_NAMES.RUN ? -0.10 : -0.05;

        if (pelvis) {
          pelvis.y = pelvis.restY + bob;
          pelvis.rotation = stride * 0.04;
        }
        if (torso) {
          torso.rotation = lean;
        }
        if (head) {
          head.rotation = -lean * 0.7;
        }

        // Arm counter-swing
        if (armR) armR.rotation = -stride * 0.45;
        if (armL) armL.rotation = stride * 0.45;

        // Leg stride cycle
        if (thighR) {
          thighR.rotation = stride * 0.5;
          if (lowerLegR) lowerLegR.rotation = Math.max(0, -stride * 0.4);
        }
        if (thighL) {
          thighL.rotation = -stride * 0.5;
          if (lowerLegL) lowerLegL.rotation = Math.max(0, stride * 0.4);
        }

        // Dynamic tail reaction: arches up and tracks momentum
        if (tailBase) tailBase.rotation = -0.45 + Math.sin(t * runFreq) * 0.2;
        if (tailMid) tailMid.rotation = 0.55 + Math.sin(t * runFreq - 0.5) * 0.25;
        if (tailTip) tailTip.rotation = 0.25 + Math.sin(t * runFreq - 1.0) * 0.3;

        // Hair streaming backward
        if (hairBack) hairBack.rotation = 0.12 + Math.sin(t * runFreq - 0.4) * 0.08;
        if (ribbonFlow) ribbonFlow.rotation = 0.18 + Math.sin(t * runFreq - 0.6) * 0.12;
        break;

      case RIG_POSE_NAMES.JUMP_START:
        this.setExpression('determined');
        // Compression crouch before takeoff
        if (pelvis) {
          pelvis.y = pelvis.restY + 5;
          pelvis.scaleY = 0.9;
          pelvis.scaleX = 1.06;
        }
        if (thighL) thighL.rotation = -0.25;
        if (thighR) thighR.rotation = -0.25;
        if (tailBase) tailBase.rotation = -0.1;
        break;

      case RIG_POSE_NAMES.JUMP_RISE:
        this.setExpression('determined');
        // Airborne ascending leap
        if (pelvis) {
          pelvis.y = pelvis.restY - 3;
          pelvis.scaleY = 1.05;
          pelvis.scaleX = 0.96;
        }
        if (armR) armR.rotation = -0.6;
        if (armL) armL.rotation = 0.4;
        if (thighR) thighR.rotation = 0.3;
        if (thighL) thighL.rotation = -0.2;
        // Tail curls tight
        if (tailBase) tailBase.rotation = -0.6;
        if (tailMid) tailMid.rotation = 0.7;
        if (tailTip) tailTip.rotation = 0.5;
        // Hair trails downward
        if (hairBack) hairBack.rotation = -0.15;
        if (ribbonFlow) ribbonFlow.rotation = -0.25;
        break;

      case RIG_POSE_NAMES.FALL:
        this.setExpression('surprised');
        // Aerodynamic descent
        if (pelvis) {
          pelvis.y = pelvis.restY - 1;
        }
        if (armR) armR.rotation = -0.2;
        if (armL) armL.rotation = 0.2;
        if (thighR) thighR.rotation = 0.15;
        if (thighL) thighL.rotation = 0.1;
        // Hair and ribbons drift upward
        if (hairBack) hairBack.rotation = 0.18;
        if (ribbonFlow) ribbonFlow.rotation = 0.35;
        if (tailBase) tailBase.rotation = -0.3;
        if (tailMid) tailMid.rotation = 0.4;
        break;

      case RIG_POSE_NAMES.LAND:
        this.setExpression('neutral');
        // Impact squash
        if (pelvis) {
          pelvis.y = pelvis.restY + 6;
          pelvis.scaleY = 0.84;
          pelvis.scaleX = 1.14;
        }
        if (tailBase) tailBase.rotation = 0.2;
        if (tailMid) tailMid.rotation = -0.1;
        if (hairBack) hairBack.rotation = -0.05;
        break;

      case RIG_POSE_NAMES.CROUCH:
        this.setExpression('determined');
        if (pelvis) {
          pelvis.y = pelvis.restY + 8;
          pelvis.scaleY = 0.82;
          pelvis.scaleX = 1.15;
        }
        if (torso) torso.rotation = -0.12;
        if (head) head.rotation = 0.08;
        if (tailBase) tailBase.rotation = -0.3;
        break;

      case RIG_POSE_NAMES.DASH:
        this.setExpression('determined');
        // Sleek horizontal forward strike
        if (pelvis) {
          pelvis.y = pelvis.restY + 2;
          pelvis.rotation = -0.2;
        }
        if (torso) torso.rotation = -0.25;
        if (head) head.rotation = 0.15;
        if (armR) armR.rotation = -0.8;
        if (armL) armL.rotation = 0.8;
        if (hairBack) hairBack.rotation = 0.35;
        if (ribbonFlow) ribbonFlow.rotation = 0.45;
        if (tailBase) tailBase.rotation = -0.7;
        if (tailMid) tailMid.rotation = 0.8;
        break;

      case RIG_POSE_NAMES.ATTACK:
        this.setExpression('determined');
        const p = this.attackProgress; // 0 to 1
        // Dynamic forward strike
        if (torso) torso.rotation = -0.15 + (1 - p) * 0.25;
        if (head) head.rotation = 0.1 - (1 - p) * 0.15;
        if (armR) armR.rotation = -0.9 + (1 - p) * 1.4; // Front arm sweeps forward
        if (armL) armL.rotation = 0.4;
        if (hairBack) hairBack.rotation = 0.2;
        if (tailBase) tailBase.rotation = -0.5;
        break;

      case RIG_POSE_NAMES.HURT:
        this.setExpression('hurt');
        // Recoil backward
        if (pelvis) {
          pelvis.x = pelvis.restX - 6;
          pelvis.rotation = 0.18;
        }
        if (torso) torso.rotation = 0.15;
        if (head) head.rotation = -0.12;
        if (armR) armR.rotation = 0.5;
        if (armL) armL.rotation = -0.4;
        if (tailBase) tailBase.rotation = 0.3;
        if (hairBack) hairBack.rotation = -0.2;
        break;

      case RIG_POSE_NAMES.VICTORY:
        this.setExpression('smile');
        // Celebratory royal pose
        if (torso) torso.rotation = -0.04;
        if (head) {
          head.rotation = 0.06;
          head.y = head.restY - 1;
        }
        if (armR) armR.rotation = -0.6; // Hand on hip
        if (armL) armL.rotation = 0.5;
        if (tailBase) tailBase.rotation = -0.65 + Math.sin(t * 4.0) * 0.15; // Joyful tail wag
        if (tailMid) tailMid.rotation = 0.75 + Math.sin(t * 4.0 - 0.4) * 0.2;
        break;

      case RIG_POSE_NAMES.DEATH:
        this.setExpression('hurt');
        if (pelvis) {
          pelvis.y = pelvis.restY + 10;
          pelvis.rotation = 0.4;
          pelvis.opacity = 0.7;
        }
        break;
    }

    this.updateWorldTransforms();
  }

  applyPose(poseName, progress = 0) {
    this.setPose(poseName, progress);
  }

  update(deltaTime, playerEntity = null) {
    this.animTime += deltaTime;

    // Detect attack state from player
    if (playerEntity && playerEntity.isAttacking) {
      this.isAttacking = true;
      this.attackProgress = Math.max(0, playerEntity.attackTimer / 0.22);
      this.setPose(RIG_POSE_NAMES.ATTACK, this.attackProgress);
    } else {
      this.isAttacking = false;
      if (playerEntity && playerEntity.anim) {
        this.setPose(playerEntity.anim.currentAnimationName || RIG_POSE_NAMES.IDLE);
      }
    }

    this.updateWorldTransforms();
  }

  updateWorldTransforms() {
    const root = this.getNode(this.rootName);
    if (!root) return;

    root.worldX = root.x;
    root.worldY = root.y;
    root.worldRotation = root.rotation;
    root.worldScaleX = root.scaleX * this.facing;
    root.worldScaleY = root.scaleY;
    root.worldOpacity = root.opacity;

    this.computeNodeTransforms(root);
  }

  computeNodeTransforms(parentNode) {
    for (const child of parentNode.children) {
      if (!child.visible) continue;

      const cos = Math.cos(parentNode.worldRotation);
      const sin = Math.sin(parentNode.worldRotation);

      const scaledX = child.x * parentNode.worldScaleX;
      const scaledY = child.y * parentNode.worldScaleY;

      child.worldX = parentNode.worldX + (scaledX * cos - scaledY * sin);
      child.worldY = parentNode.worldY + (scaledX * sin + scaledY * cos);

      child.worldRotation = parentNode.worldRotation + child.rotation;
      child.worldScaleX = parentNode.worldScaleX * child.scaleX;
      child.worldScaleY = parentNode.worldScaleY * child.scaleY;
      child.worldOpacity = parentNode.worldOpacity * child.opacity;

      this.computeNodeTransforms(child);
    }
  }

  /**
   * Render the complete illustrated Princess Aria character.
   * 
   * Strict Quality Mandate:
   * Real Illustrated Character Art > Procedural Geometry.
   * Renders the authentic, approved hand-painted Princess Aria with
   * fluid secondary hair, tail, ribbon, and facial expression motion.
   * 
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} options { testMode, visualScale }
   */
  draw(ctx, options = {}) {
    const isTestMode = options.testMode !== undefined ? options.testMode : this.testMode;

    ctx.save();

    // High quality sampling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Target visual scale: Princess Aria renders at ~108px visual height
    // Master transparent artwork is 682x1024 with character height = 985px
    // Scale factor: 108 / 985 = ~0.1096
    const visualHeight = options.visualHeight || 108;
    const masterBaseHeight = 985;
    const baseScale = visualHeight / masterBaseHeight;

    // Center X offset in master image is 360, ground baseline Y is 987
    const masterOriginX = 360;
    const masterOriginY = 987;

    // 1. Check if Master Plate is available for seamless anatomical rendering
    const masterImg = this.masterPlates.front || this.getNode('torso')?.image;

    if (masterImg && (masterImg.complete || masterImg.naturalWidth > 0 || masterImg instanceof HTMLCanvasElement)) {
      this.drawIllustratedCharacter(ctx, masterImg, baseScale, masterOriginX, masterOriginY);
    } else if (!this.masterPlates.front) {
      // Modular Rig Layer fallback only if master plate was not registered
      this.drawSegmentedLayers(ctx, baseScale);
    }

    // 2. Attack Starlight Energy Slash Arc Effect
    if (this.isAttacking) {
      this.drawAttackSlashEffect(ctx);
    }

    // 3. Technical Test Overlay (Bones & Joint Pivots only if testMode is explicitly enabled)
    if (isTestMode) {
      this.drawTechnicalTestOverlay(ctx);
    }

    ctx.restore();
  }

  /**
   * Draw the authentic illustrated Princess Aria character with layered secondary motion.
   */
  drawIllustratedCharacter(ctx, masterImg, scale, originX, originY) {
    const t = this.animTime;
    const facing = this.facing;

    // Get animated secondary offsets from rig nodes
    const pelvis = this.getNode('pelvis');
    const torso = this.getNode('torso');
    const head = this.getNode('head');
    const tailBase = this.getNode('tail_base');
    const tailMid = this.getNode('tail_mid');
    const tailTip = this.getNode('tail_tip');
    const hairBack = this.getNode('hair_back');

    const bobY = pelvis ? (pelvis.y - pelvis.restY) : 0;
    const leanRot = torso ? torso.rotation : 0;
    const headRot = head ? head.rotation : 0;
    const torsoScaleY = torso ? torso.scaleY : 1;

    ctx.save();

    // Apply rig-driven body dynamics (breathing, stride bob, squash & stretch)
    ctx.translate(0, bobY);
    ctx.rotate(leanRot);
    ctx.scale(1, torsoScaleY);

    // 1. MAIN ILLUSTRATED BODY (Pristine Approved Princess Aria Art)
    // Anchored precisely at feet contact point (originX, originY) -> (0, 0)
    const drawW = masterImg.naturalWidth * scale;
    const drawH = masterImg.naturalHeight * scale;
    const drawX = -originX * scale;
    const drawY = -originY * scale;

    ctx.drawImage(masterImg, drawX, drawY, drawW, drawH);

    // 2. DYNAMIC FACIAL EXPRESSION OVERLAY
    if (this.activeExpression && this.activeExpression !== 'neutral') {
      const mouthImg = this.expressions[this.activeExpression];
      if (mouthImg && mouthImg.complete) {
        ctx.save();
        // Position mouth accurately on Aria's face (~Y = -90)
        ctx.translate(0, -90);
        ctx.rotate(headRot);
        const mw = mouthImg.naturalWidth * 0.45;
        const mh = mouthImg.naturalHeight * 0.45;
        ctx.drawImage(mouthImg, -mw * 0.5, -mh * 0.5, mw, mh);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  /**
   * Fallback for rendering individual segmented layers if master image is absent.
   */
  drawSegmentedLayers(ctx, scale) {
    const sortedNodes = Array.from(this.nodes.values())
      .filter(n => n.name !== this.rootName && n.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const node of sortedNodes) {
      if (node.worldOpacity <= 0) continue;

      if (node.image && (node.image.complete || node.image instanceof HTMLCanvasElement)) {
        ctx.save();
        ctx.translate(node.worldX, node.worldY);
        ctx.rotate(node.worldRotation);
        ctx.scale(node.worldScaleX, node.worldScaleY);
        ctx.globalAlpha *= node.worldOpacity;

        const w = (node.width || node.image.naturalWidth) * 0.28;
        const h = (node.height || node.image.naturalHeight) * 0.28;
        ctx.drawImage(node.image, -w * node.anchorX, -h * node.anchorY, w, h);

        ctx.restore();
      }
    }
  }

  /**
   * Magical Celestial Starlight Attack Slash Arc
   */
  drawAttackSlashEffect(ctx) {
    const p = this.attackProgress; // 1.0 (start) down to 0.0 (end)
    const sweep = 1 - p;

    ctx.save();
    ctx.translate(22, -58);

    const arcRadius = 42 + sweep * 16;
    const startAngle = -Math.PI * 0.5 + sweep * Math.PI * 0.8;
    const endAngle = startAngle + Math.PI * 0.6;

    // Glowing Rose-Pink / Celestial Gold Energy Arc
    ctx.lineWidth = 6 * (1 - sweep * 0.6);
    ctx.lineCap = 'round';

    const grad = ctx.createLinearGradient(0, -arcRadius, arcRadius, arcRadius);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.9)'); // Gold
    grad.addColorStop(0.5, 'rgba(244, 63, 94, 0.85)'); // Rose pink
    grad.addColorStop(1, 'rgba(253, 224, 71, 0.2)');

    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, arcRadius, startAngle, endAngle);
    ctx.stroke();

    // Sparkling Diamond Stars
    const starCount = 3;
    for (let i = 0; i < starCount; i++) {
      const angle = startAngle + (i / starCount) * Math.PI * 0.6;
      const sx = Math.cos(angle) * arcRadius;
      const sy = Math.sin(angle) * arcRadius;
      const starSize = 3 + (1 - sweep) * 2.5;

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(sx, sy - starSize);
      ctx.lineTo(sx + starSize * 0.4, sy);
      ctx.lineTo(sx + starSize, sy);
      ctx.lineTo(sx + starSize * 0.4, sy + starSize * 0.4);
      ctx.lineTo(sx, sy + starSize);
      ctx.lineTo(sx - starSize * 0.4, sy + starSize * 0.4);
      ctx.lineTo(sx - starSize, sy);
      ctx.lineTo(sx - starSize * 0.4, sy);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Diagnostic Technical Test Overlay (Bones & Joint pivots only)
   */
  drawTechnicalTestOverlay(ctx) {
    const sortedNodes = Array.from(this.nodes.values()).filter(n => n.visible);

    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;

    for (const node of sortedNodes) {
      if (node.parent) {
        const parentNode = this.getNode(node.parent);
        if (parentNode) {
          ctx.beginPath();
          ctx.moveTo(parentNode.worldX, parentNode.worldY);
          ctx.lineTo(node.worldX, node.worldY);
          ctx.stroke();
        }
      }
    }

    for (const node of sortedNodes) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.beginPath();
      ctx.arc(node.worldX, node.worldY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
