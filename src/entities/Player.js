import { PHYSICS } from '../game/Constants.js';
import { Physics } from '../physics/Physics.js';
import { AnimationController, ANIM_STATES } from '../animation/AnimationController.js';
import { AnimationClip } from '../animation/AnimationClip.js';
import { CharacterRig } from '../animation/CharacterRig.js';
import { assetManager } from '../renderer/AssetManager.js';
import { characterRenderer } from '../renderer/HDCharacterRenderer.js';
import { pixelAriaRenderer } from '../renderer/PixelCharacterRenderer.js';
import { Collision } from '../physics/Collision.js';
import { StarProjectile } from './StarProjectile.js';

/**
 * PRINCESS ARIA
 * Heroic Fantasy Protagonist:
 * - High-definition decoupled animation controller
 * - 12 expressive animation states:
 *   IDLE, WALK, RUN, JUMP_START, JUMP_RISE, FALL, LAND, CROUCH, DASH, HURT, DEATH, VICTORY
 * - Automatic directional flipping & smooth squash-and-stretch
 * - Dash mechanic with trailing golden honey particles
 * - Preloaded asset binding with instant hot-swappable frame artwork
 */
export class Player {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;

    // Platformer collider dimensions
    this.baseWidth = 56;
    this.baseHeight = 84;
    this.width = this.baseWidth;
    this.height = this.baseHeight;

    this.vx = 0;
    this.vy = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.isGrounded = false;
    this.isCrouching = false;
    this.isDashing = false;
    this.isClimbing = false;
    this.isHurt = false;
    this.isDead = false;
    this.isVictorious = false;
    this.groundDistance = 0;

    // Production Hierarchical 2D Character Rig (Method A)
    this.rig = new CharacterRig('aria');

    // Timers
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.invincibilityTimer = 0;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.dashParticles = [];

    // Shield state (hold-to-block)
    this.isShielding = false;
    this.shieldStamina = 100; // current stamina
    this.shieldMaxStamina = 100;
    this.shieldDrainRate = 32; // per second while holding
    this.shieldRegenRate = 12; // per second when not holding

    // Mid-Air Double Jump (Celestial Starlight Flutter)
    this.canDoubleJump = true;
    this.doubleJumpParticles = [];

    // Surface Physics, Momentum & World Modifiers
    this.currentSurfaceFriction = 1.0;
    this.surfaceVx = 0;
    this.standingPlatform = null;
    this.isDrowsy = false;
    this.drowsyTimer = 0;

    // Extensible Primary Attack Foundation
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackCooldownTimer = 0;

    // Ranged Celestial Starbeam Power
    this.projectiles = [];
    this.shootCooldownTimer = 0;
    this.shootTimer = 0;

    // Squash & Stretch factors
    this.scaleX = 1;
    this.scaleY = 1;

    // Initialize HD Animation Controller
    this.anim = new AnimationController();
    this.setupAnimations();
  }

  /**
   * Bind all 12 HD Animation Clips to Princess Aria.
   */
  setupAnimations() {
    // 1. IDLE (subtle breathing, blinking, dress ripple)
    this.anim.addAnimation(
      ANIM_STATES.IDLE,
      new AnimationClip({
        name: ANIM_STATES.IDLE,
        frames: assetManager.getFrameSequence('aria', 'idle', 8),
        fps: 8,
        loop: true,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    // 2. WALK (natural athletic walking gait)
    this.anim.addAnimation(
      ANIM_STATES.WALK,
      new AnimationClip({
        name: ANIM_STATES.WALK,
        frames: assetManager.getFrameSequence('aria', 'walk', 8),
        fps: 12,
        loop: true,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    // 3. RUN (energetic forward stride, trailing capelet)
    this.anim.addAnimation(
      ANIM_STATES.RUN,
      new AnimationClip({
        name: ANIM_STATES.RUN,
        frames: assetManager.getFrameSequence('aria', 'run', 10),
        fps: 16,
        loop: true,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    // 4. JUMP_START (anticipation crouch before jump)
    this.anim.addAnimation(
      ANIM_STATES.JUMP_START,
      new AnimationClip({
        name: ANIM_STATES.JUMP_START,
        frames: assetManager.getFrameSequence('aria', 'jump_start', 4),
        fps: 16,
        loop: false,
        minDuration: 0.08,
        nextAnimation: ANIM_STATES.JUMP_RISE,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    // 5. JUMP_RISE (ascending upward, spread wings)
    this.anim.addAnimation(
      ANIM_STATES.JUMP_RISE,
      new AnimationClip({
        name: ANIM_STATES.JUMP_RISE,
        frames: assetManager.getFrameSequence('aria', 'jump_rise', 4),
        fps: 12,
        loop: true,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    // Alias JUMP -> JUMP_RISE for backward compatibility
    this.anim.addAnimation(
      ANIM_STATES.JUMP,
      new AnimationClip({
        name: ANIM_STATES.JUMP,
        frames: assetManager.getFrameSequence('aria', 'jump_rise', 4),
        fps: 12,
        loop: true,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    // 6. FALL (descending, billowing dress)
    this.anim.addAnimation(
      ANIM_STATES.FALL,
      new AnimationClip({
        name: ANIM_STATES.FALL,
        frames: assetManager.getFrameSequence('aria', 'fall', 4),
        fps: 12,
        loop: true,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    // 7. LAND (landing impact squash & stretch)
    this.anim.addAnimation(
      ANIM_STATES.LAND,
      new AnimationClip({
        name: ANIM_STATES.LAND,
        frames: assetManager.getFrameSequence('aria', 'land', 5),
        fps: 16,
        loop: false,
        minDuration: 0.12,
        nextAnimation: ANIM_STATES.IDLE,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    // 8. CROUCH (crouching pose)
    this.anim.addAnimation(
      ANIM_STATES.CROUCH,
      new AnimationClip({
        name: ANIM_STATES.CROUCH,
        frames: assetManager.getFrameSequence('aria', 'crouch', 4),
        fps: 8,
        loop: true,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    // 9. DASH (aerodynamic high-speed glide)
    this.anim.addAnimation(
      ANIM_STATES.DASH,
      new AnimationClip({
        name: ANIM_STATES.DASH,
        frames: assetManager.getFrameSequence('aria', 'dash', 6),
        fps: 16,
        loop: false,
        minDuration: 0.22,
        nextAnimation: ANIM_STATES.RUN,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    // 10. HURT (knockback stagger & hit reaction)
    this.anim.addAnimation(
      ANIM_STATES.HURT,
      new AnimationClip({
        name: ANIM_STATES.HURT,
        frames: assetManager.getFrameSequence('aria', 'hurt', 4),
        fps: 14,
        loop: false,
        minDuration: 0.28,
        nextAnimation: ANIM_STATES.IDLE,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    // 11. DEATH (defeat animation)
    this.anim.addAnimation(
      ANIM_STATES.DEATH,
      new AnimationClip({
        name: ANIM_STATES.DEATH,
        frames: assetManager.getFrameSequence('aria', 'death', 8),
        fps: 10,
        loop: false,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    // 12. VICTORY (level clear royal celebration)
    this.anim.addAnimation(
      ANIM_STATES.VICTORY,
      new AnimationClip({
        name: ANIM_STATES.VICTORY,
        frames: assetManager.getFrameSequence('aria', 'victory', 10),
        fps: 10,
        loop: true,
        anchorX: 0.5,
        anchorY: 0.95,
      })
    );

    this.anim.play(ANIM_STATES.IDLE, true);
    this.bindRigLayers();
  }

  /**
   * Bind all approved illustrated master plates, expressions, and layers to Princess Aria's 2D Rig.
   */
  bindRigLayers() {
    // 1. Bind Master Illustrated Plates (High-Definition source of truth)
    const masterFront = assetManager.getImage('art/characters/aria/master/aria_master_front_transparent');
    if (masterFront) {
      this.rig.setMasterImage('front', masterFront);
    }
    const masterThreeQuarter = assetManager.getImage('art/characters/aria/master/aria_master_three_quarter_view');
    if (masterThreeQuarter) {
      this.rig.setMasterImage('three_quarter', masterThreeQuarter);
    }
    const masterSide = assetManager.getImage('art/characters/aria/master/aria_master_side_view');
    if (masterSide) {
      this.rig.setMasterImage('side', masterSide);
    }
    const masterBack = assetManager.getImage('art/characters/aria/master/aria_master_back_view');
    if (masterBack) {
      this.rig.setMasterImage('back', masterBack);
    }

    // 2. Bind Approved Facial Mouth Expressions
    const expressions = ['neutral', 'smile', 'surprised', 'hurt'];
    for (const expr of expressions) {
      const mouthImg = assetManager.getImage(`art/characters/aria/layers/mouth_${expr}`);
      if (mouthImg) {
        this.rig.setLayerImage(`mouth_${expr}`, mouthImg);
      }
    }

    // 3. Bind Individual Anatomical Secondary & Fallback Layers
    const layerNames = [
      'face', 'eyes', 'hair_front', 'hair_back', 'crown', 'earrings', 'ribbon',
      'torso_front', 'torso_back', 'shoulder_L', 'shoulder_R',
      'skirt_front', 'skirt_side_L', 'skirt_side_R', 'skirt_back', 'ribbon_flow',
      'upper_arm_L', 'forearm_L', 'hand_L', 'upperarm_R', 'forearm_R', 'hand_R',
      'thigh_L', 'lower_leg_L', 'foot_L', 'thigh_R', 'lower_leg_R', 'foot_R',
      'tail_base', 'tail_mid', 'tail_tip', 'tail_ribbon',
      'ribbon_L', 'ribbon_R', 'waist_jewel', 'thigh_jewel_L', 'thigh_jewel_R'
    ];

    for (const name of layerNames) {
      const img = assetManager.getImage(`art/characters/aria/layers/${name.toLowerCase()}`);
      if (img) {
        this.rig.setLayerImage(name, img);
      }
    }

    if (masterFront) {
      this.layersBound = true;
    }
  }

  respawn(spawnX = this.startX, spawnY = this.startY) {
    this.x = spawnX;
    this.y = spawnY;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.isGrounded = true;
    this.isCrouching = false;
    this.isDashing = false;
    this.isClimbing = false;
    this.isHurt = false;
    this.isDead = false;
    this.isVictorious = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.canDoubleJump = true;
    this.doubleJumpParticles = [];
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackCooldownTimer = 0;
    this.projectiles = [];
    this.shootCooldownTimer = 0;
    this.shootTimer = 0;
    this.invincibilityTimer = PHYSICS.INVINCIBILITY_TIME;
    this.currentSurfaceFriction = 1.0;
    this.surfaceVx = 0;
    this.standingPlatform = null;
    this.isDrowsy = false;
    this.drowsyTimer = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.anim.setFacing(1);
    this.rig.setFacing(1);
    this.anim.play(ANIM_STATES.IDLE, true);
  }

  applyDrowsy(duration = 2.5) {
    this.isDrowsy = true;
    this.drowsyTimer = Math.max(this.drowsyTimer, duration);
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  getAttackBounds() {
    if (!this.isAttacking) return null;
    const reach = 76;
    return {
      x: this.facing > 0 ? this.x + this.width - 10 : this.x - reach + 10,
      y: this.y + 12,
      width: reach,
      height: this.height - 24,
    };
  }

  update(input, audio, dt, level = null) {
    this.inputRef = input;

    // Dynamically bind illustrated rig layers once assetManager has completed preloading
    if ((!this.layersBound || !this.rig?.masterPlates?.front) && assetManager.isReady) {
      this.bindRigLayers();
    }

    if (this.isDead) {
      this.anim.update(dt);
      if (this.rig) this.rig.update(dt, this);
      return;
    }

    if (this.isVictorious) {
      this.vx = 0;
      this.anim.play(ANIM_STATES.VICTORY);
      this.anim.update(dt);
      if (this.rig) this.rig.update(dt, this);
      return;
    }

    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= dt;
      if (this.invincibilityTimer <= 0) {
        this.isHurt = false;
      }
    }

    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= dt;
    }

    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt;
    }

    if (this.shootCooldownTimer > 0) {
      this.shootCooldownTimer -= dt;
    }

    if (this.shootTimer > 0) {
      this.shootTimer -= dt;
    }

    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }

    // Extensible Primary Attack Trigger (Melee Stardust Slash)
    if (
      input.justPressed('ATTACK') &&
      this.attackCooldownTimer <= 0 &&
      !this.isCrouching &&
      !this.isDead
    ) {
      this.isAttacking = true;
      this.attackTimer = 0.22;
      this.attackCooldownTimer = 0.42;
      this.scaleX = 1.25;
      this.scaleY = 0.88;
      if (audio) {
        if (audio.playAttack) audio.playAttack();
        else if (audio.playEnemyAttack) audio.playEnemyAttack();
      }
      if (input && input.rumbleAttack) {
        input.rumbleAttack();
      }
    }

    // Extensible Ranged Power Trigger (Royal Starbeam / Stardust Shot)
    if (
      input.justPressed('SHOOT') &&
      this.shootCooldownTimer <= 0 &&
      !this.isCrouching &&
      !this.isDead &&
      !this.isDashing
    ) {
      this.shoot(audio, level);
      if (input && input.rumbleShoot) {
        input.rumbleShoot();
      }
    }

    // Squash & Stretch physics recovery
    this.scaleX += (1 - this.scaleX) * 14 * dt;
    this.scaleY += (1 - this.scaleY) * 14 * dt;

    // --- SHIELD (hold) ---
    const wantsShield = input.isDown('SHIELD') && !this.isDead && !this.isDashing;
    if (wantsShield && this.shieldStamina > 0) {
      this.isShielding = true;
      this.shieldStamina = Math.max(0, this.shieldStamina - this.shieldDrainRate * dt);
    } else {
      this.isShielding = false;
      this.shieldStamina = Math.min(this.shieldMaxStamina, this.shieldStamina + this.shieldRegenRate * dt);
    }

    // --- 1. CROUCH HANDLING ---
    const wantsCrouch = input.isDown('CROUCH') && this.isGrounded && !this.isDashing;
    this.isCrouching = wantsCrouch;
    this.height = this.isCrouching ? 54 : this.baseHeight;

    // --- 2. HORIZONTAL MOVEMENT & FACING ---
    let moveDir = 0;
    if (input.isDown('LEFT')) moveDir -= 1;
    if (input.isDown('RIGHT')) moveDir += 1;

    // Automatic direction flipping based on movement intent
    if (moveDir !== 0 && !this.isDashing) {
      this.facing = moveDir;
      this.anim.setFacing(moveDir);
      this.rig.setFacing(moveDir);
    }

    // World-specific physics and surface modifiers
    const worldPhys = level?.physics || {};
    const gravity = worldPhys.gravity ?? PHYSICS.GRAVITY;
    const terminalVelocity = worldPhys.terminalVelocity ?? PHYSICS.TERMINAL_VELOCITY;
    let jumpVel = worldPhys.jumpVelocity ?? PHYSICS.JUMP_VELOCITY;
    let doubleJumpVel = worldPhys.doubleJumpVelocity ?? PHYSICS.DOUBLE_JUMP_VELOCITY;
    const worldFriction = worldPhys.friction ?? 1.0;
    const airControl = worldPhys.airControl ?? 1.0;

    // Sleeping Spores Drowsiness effect
    if (this.isDrowsy) {
      this.drowsyTimer -= dt;
      if (this.drowsyTimer <= 0) {
        this.isDrowsy = false;
      }
      jumpVel *= 0.78;
      doubleJumpVel *= 0.80;
    }

    // --- 3. DASH MECHANIC ---
    if (
      input.justPressed('DASH') &&
      this.dashCooldownTimer <= 0 &&
      !this.isCrouching &&
      !this.isDashing
    ) {
      this.isDashing = true;
      this.isDrowsy = false; // Dashing immediately bursts out of spore drowsiness!
      this.drowsyTimer = 0;
      this.dashTimer = PHYSICS.DASH_DURATION;
      this.dashCooldownTimer = PHYSICS.DASH_COOLDOWN;
      this.vx = this.facing * PHYSICS.DASH_SPEED;
      this.vy = 0; // maintain horizontal glide during dash

      this.scaleX = 1.35;
      this.scaleY = 0.8;
      this.anim.play(ANIM_STATES.DASH, true);

      if (audio) {
        if (audio.playDash) audio.playDash();
        else if (audio.playJump) audio.playJump();
      }
      if (input && input.rumbleDash) {
        input.rumbleDash();
      }
    }

    if (this.isDashing) {
      this.dashTimer -= dt;
      this.vx = this.facing * PHYSICS.DASH_SPEED;

      // Add ghost trail particle
      this.dashParticles.push({
        x: this.x,
        y: this.y,
        facing: this.facing,
        alpha: 0.6,
      });

      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else {
      let maxSpeed = this.isCrouching ? PHYSICS.CROUCH_SPEED : PHYSICS.MAX_RUN_SPEED;
      if (this.isDrowsy) {
        maxSpeed *= 0.72; // Spore pollen sluggishness
      }
      const effectiveFriction = this.isGrounded ? (this.currentSurfaceFriction || 1.0) * worldFriction : 1.0;
      const accelMod = this.isGrounded ? (effectiveFriction < 0.8 ? 0.85 : 1.0) : airControl;
      this.vx = Physics.applyHorizontalMovement(this.vx, moveDir, this.isGrounded, maxSpeed, dt, effectiveFriction, accelMod);
    }

    // Conveyor / drifting platform momentum while grounded
    if (this.isGrounded && this.surfaceVx) {
      this.x += this.surfaceVx * dt;
    }

    // --- 4. JUMPING MECHANICS (Buffer, Coyote Time & Double Jump) ---
    if (this.isGrounded) {
      this.coyoteTimer = PHYSICS.COYOTE_TIME;
      this.canDoubleJump = true;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (input.justPressed('JUMP')) {
      this.jumpBufferTimer = PHYSICS.JUMP_BUFFER_TIME;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.isCrouching) {
      // Ground / Coyote Jump
      this.vy = jumpVel;
      // Inherit platform momentum when leaping off drifting magma/honey rafts!
      if (this.surfaceVx) {
        this.vx += this.surfaceVx;
      }
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.isDashing = false;
      this.canDoubleJump = true;

      // Jump launch squash and stretch
      this.scaleX = 0.82;
      this.scaleY = 1.28;
      this.anim.play(ANIM_STATES.JUMP_START, true);

      if (audio && audio.playJump) audio.playJump();
      if (input && input.rumbleJump) {
        input.rumbleJump();
      }
    } else if (
      input.justPressed('JUMP') &&
      this.canDoubleJump &&
      !this.isGrounded &&
      !this.isClimbing &&
      !this.isCrouching
    ) {
      // Mid-Air Double Jump (Celestial Starlight Flutter)
      this.vy = doubleJumpVel;
      this.canDoubleJump = false;
      this.jumpBufferTimer = 0;
      this.isDashing = false;

      // Double jump springy squash & stretch
      this.scaleX = 0.78;
      this.scaleY = 1.34;
      this.anim.play(ANIM_STATES.JUMP_RISE, true);

      // Trailing stardust flutter ring
      this.doubleJumpParticles.push({
        x: this.x + this.width / 2,
        y: this.y + this.height - 4,
        timer: 0,
        alpha: 1.0,
      });

      if (level && level.spawnSparkles) {
        level.spawnSparkles(this.x + this.width / 2, this.y + this.height - 4, 10);
      }

      if (audio) {
        if (audio.playDoubleJump) audio.playDoubleJump();
        else if (audio.playJump) audio.playJump();
      }
      if (input && input.rumbleDoubleJump) {
        input.rumbleDoubleJump();
      }
    }

    // Variable jump height: release early to cut jump short
    if (input.justReleased('JUMP') && this.vy < 0) {
      this.vy *= PHYSICS.JUMP_CUT_MULTIPLIER;
    }

    // --- VINE CLIMBING MECHANIC ---
    let onVine = false;
    if (level && level.getClimbableVines) {
      const pBounds = this.getBounds();
      const vines = level.getClimbableVines();
      for (const v of vines) {
        if (Collision.intersects(pBounds, v)) {
          onVine = true;
          break;
        }
      }
    }

    if (onVine && (input.isDown('UP') || input.isDown('DOWN') || (this.isClimbing && !this.isGrounded))) {
      this.isClimbing = true;
      this.coyoteTimer = PHYSICS.COYOTE_TIME;
      if (input.isDown('UP')) {
        this.vy = -230;
      } else if (input.isDown('DOWN')) {
        this.vy = 230;
      } else {
        this.vy = 0;
      }
      this.vx *= 0.7;

      if (input.justPressed('JUMP')) {
        this.isClimbing = false;
        this.vy = jumpVel * 0.95;
        this.vx = this.facing * 300;
        this.scaleX = 0.85;
        this.scaleY = 1.25;
        if (audio && audio.playJump) audio.playJump();
      }
    } else {
      this.isClimbing = false;
    }

    // Apply gravity unless actively mid-dash or climbing a vine
    if (!this.isDashing && !this.isClimbing) {
      this.vy = Physics.applyGravity(this.vy, dt, gravity, terminalVelocity);
    }

    // Integrate position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // --- 5. STATE MACHINE TO ANIMATION SELECTION ---
    if (!this.isHurt) {
      if (this.isClimbing) {
        if (Math.abs(this.vy) > 15) {
          this.anim.play(ANIM_STATES.WALK);
        } else {
          this.anim.play(ANIM_STATES.IDLE);
        }
      } else if (this.isGrounded) {
        if (this.isCrouching) {
          this.anim.play(ANIM_STATES.CROUCH);
        } else if (this.isDashing) {
          this.anim.play(ANIM_STATES.DASH);
        } else if (Math.abs(this.vx) > 360) {
          // High movement speed -> RUN
          this.anim.play(ANIM_STATES.RUN);
        } else if (Math.abs(this.vx) > 25) {
          // Slow movement -> WALK
          this.anim.play(ANIM_STATES.WALK);
        } else {
          // Velocity == 0 -> IDLE
          this.anim.play(ANIM_STATES.IDLE);
        }
      } else {
        // Airborne states
        if (this.isDashing) {
          this.anim.play(ANIM_STATES.DASH);
        } else if (this.vy < 0) {
          // Jumping upward -> JUMP_RISE (unless still finishing JUMP_START anticipation)
          if (this.anim.currentAnimationName !== ANIM_STATES.JUMP_START) {
            this.anim.play(ANIM_STATES.JUMP_RISE);
          }
        } else {
          // Falling downward -> FALL
          this.anim.play(ANIM_STATES.FALL);
        }
      }
    }

    // Update ghost trail particles
    for (let i = this.dashParticles.length - 1; i >= 0; i--) {
      this.dashParticles[i].alpha -= dt * 3.5;
      if (this.dashParticles[i].alpha <= 0) {
        this.dashParticles.splice(i, 1);
      }
    }

    // Update double jump flutter particles
    for (let i = this.doubleJumpParticles.length - 1; i >= 0; i--) {
      const p = this.doubleJumpParticles[i];
      p.timer += dt;
      p.alpha -= dt * 3.5;
      if (p.alpha <= 0) {
        this.doubleJumpParticles.splice(i, 1);
      }
    }

    // Update active starbeam projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt, level, audio);
      if (proj.isDead && proj.particles.length === 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // Advance animation controller & rig
    this.anim.update(dt);
    if (this.rig) {
      this.rig.update(dt, this);
    }
  }

  /**
   * Fire a Royal Starbeam projectile in the direction Aria is currently facing.
   */
  shoot(audio, level) {
    this.shootCooldownTimer = 0.32;
    this.shootTimer = 0.16;
    this.scaleX = 0.88;
    this.scaleY = 1.15;

    const spawnX = this.facing > 0 ? this.x + this.width + 4 : this.x - 28;
    const spawnY = this.y + this.height * 0.38;

    const proj = new StarProjectile(spawnX, spawnY, this.facing);
    this.projectiles.push(proj);

    if (audio) {
      if (audio.playStarshot) audio.playStarshot();
      else if (audio.playAttack) audio.playAttack();
    }

    if (level && level.spawnBurst) {
      level.spawnBurst(spawnX + 12, spawnY + 9, 6, '#38bdf8');
    }
  }

  bounceFromEnemy() {
    this.vy = PHYSICS.BOUNCE_VELOCITY;
    this.isGrounded = false;
    this.isDashing = false;
    this.canDoubleJump = true;
    this.scaleX = 0.85;
    this.scaleY = 1.25;
    this.anim.play(ANIM_STATES.JUMP_RISE, true);
    if (this.inputRef && this.inputRef.rumbleStomp) {
      this.inputRef.rumbleStomp();
    }
  }

  land() {
    if (!this.isGrounded) {
      this.isGrounded = true;
      this.isDashing = false;
      this.canDoubleJump = true;
      this.scaleX = 1.26;
      this.scaleY = 0.76;
      this.anim.play(ANIM_STATES.LAND, true);
      if (this.inputRef && this.inputRef.rumbleLand) {
        this.inputRef.rumbleLand();
      }
    }
  }

  hurt() {
    if (this.invincibilityTimer > 0) return false;

    // If shielding and have stamina, reduce or negate damage
    if (this.isShielding && this.shieldStamina > 0) {
      // Successful block: short window of reduced knockback and no hurt state
      this.shieldStamina = Math.max(0, this.shieldStamina - 12);
      if (this.inputRef && this.inputRef.rumbleAttack) this.inputRef.rumbleAttack();
      // play block sound if available
      if (this.inputRef && this.inputRef.gamepad && this.inputRef.gamepad.playBlock) {
        try { this.inputRef.gamepad.playBlock(); } catch (e) {}
      }
      return false; // did not enter hurt state
    }

    this.invincibilityTimer = PHYSICS.INVINCIBILITY_TIME;
    this.isHurt = true;
    this.isDashing = false;
    this.vy = -560;
    this.vx = -this.facing * 320;
    this.anim.triggerHitReaction();
    if (this.inputRef && this.inputRef.rumbleDamage) {
      this.inputRef.rumbleDamage();
    }
    return true;
  }

  setVictory() {
    this.isVictorious = true;
    this.vx = 0;
    this.anim.play(ANIM_STATES.VICTORY, true);
  }

  draw(ctx) {
    if (this.isDead && this.anim.isFinished) return;

    // 1985 Pixel Platformer Character Draw
    pixelAriaRenderer.draw(ctx, this.x, this.y, this);

    // 3. Draw Royal Stardust Burst Attack Arc
    if (this.isAttacking) {
      const atk = this.getAttackBounds();
      if (atk) {
        ctx.save();
        const arcCenterX = this.facing > 0 ? this.x + this.width + 12 : this.x - 12;
        const arcCenterY = this.y + this.height * 0.45;
        const progress = 1 - (this.attackTimer / 0.22);

        // Royal Stardust Swirl — Radiant Gold & Warm Amber Arc
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 5.5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        const startAngle = this.facing > 0 ? -Math.PI * 0.42 + progress * 0.65 : Math.PI * 0.58 - progress * 0.65;
        const endAngle = this.facing > 0 ? Math.PI * 0.42 + progress * 0.65 : Math.PI * 1.42 - progress * 0.65;
        ctx.arc(arcCenterX, arcCenterY, 40, startAngle, endAngle, this.facing < 0);
        ctx.stroke();

        // Inner Brilliant Sunstone White-Gold Core
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(arcCenterX, arcCenterY, 38, startAngle, endAngle, this.facing < 0);
        ctx.stroke();

        // Emerald Droplets & Royal Diamond Sparkles along the slash
        for (let i = 0; i < 5; i++) {
          const spAngle = startAngle + (i / 4) * (endAngle - startAngle);
          const spRadius = 38 + Math.sin(progress * Math.PI + i) * 6;
          const spX = arcCenterX + Math.cos(spAngle) * spRadius;
          const spY = arcCenterY + Math.sin(spAngle) * spRadius;

          // Alternate Emerald droplet and Gold star
          if (i % 2 === 0) {
            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(spX, spY, 3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = '#fffbeb';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;
            // 4-point diamond star
            ctx.beginPath();
            ctx.moveTo(spX, spY - 4);
            ctx.lineTo(spX + 3, spY);
            ctx.lineTo(spX, spY + 4);
            ctx.lineTo(spX - 3, spY);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();
      }
    }

    // 4. Draw Active Starbeam Projectiles
    this.projectiles.forEach(p => p.draw(ctx));

    // 5. Draw shield in hand when shielding (simple pixel shield)
    if (this.isShielding) {
      ctx.save();
      // shield position relative to facing and player
      const sx = this.facing > 0 ? this.x + this.width - 6 : this.x - 10;
      const sy = this.y + this.height * 0.42;
      ctx.translate(sx, sy);
      if (this.facing < 0) ctx.scale(-1, 1);

      // shield body
      ctx.fillStyle = '#0ea5a4';
      ctx.fillRect(-2, -6, 10, 12);
      // shield rim
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = 1;
      ctx.strokeRect(-2, -6, 10, 12);
      // shimmer
      ctx.fillStyle = '#ffffff88';
      ctx.fillRect(0, -4, 2, 2);

      ctx.restore();
    }
  }
}
