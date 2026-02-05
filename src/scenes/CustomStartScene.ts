/**
 * Custom Start Scene (Tap-to-Start) - Reference Visual Parity
 *
 * Implements the reference project's DoorSymbol component:
 * - Split door background (left/right halves)
 * - Centered logo with -41px Y offset
 * - Text-based "CLICK TO START" indicator (same style as loader)
 * - Door opening animation when tapped
 *
 * RULES:
 * - Must call setOnStart callback when user taps
 * - Animations use engine tween service (cleanup-safe)
 * - destroy() must cleanup everything including event listeners
 */

import {
  BaseScene,
  type IStartScene,
  type SceneContext,
  type TweenHandle,
} from 'slot-frontend-engine';

import { referenceVisualConfig, colors } from '../game/BrandConfig.js';
import { Sprite, Container, Graphics, TextStyle, Text } from 'pixi.js';

/**
 * Custom Start Scene with reference project door animation
 * Uses text-based CTA matching reference ProgressBar style
 */
export class CustomStartScene extends BaseScene implements IStartScene {
  public readonly id = 'custom-start';

  private readonly ctx: SceneContext;
  private readonly visualConfig = referenceVisualConfig;

  // Callbacks
  private onStartCallback: (() => void) | null = null;

  // Split door background
  private bgLeft: Sprite | null = null;
  private bgRight: Sprite | null = null;

  // Logo
  private logo: Sprite | null = null;

  // Text-based CTA indicator (matching reference style)
  private ctaContainer: Container | null = null;
  private labelWhite: Text | null = null;
  private labelPink: Text | null = null;
  private labelMask: Graphics | null = null;

  // Interactive hit area (PIXI v8 compatible)
  private hitAreaOverlay: Graphics | null = null;

  // State
  private hasInteracted = false;
  private animationTime = 0;
  private isAnimating = false;

  // Tween handles for cleanup
  private tweenHandles: TweenHandle[] = [];

  // Event handler references for cleanup
  private pointerHandler: (() => void) | null = null;

  constructor(ctx: SceneContext) {
    super();
    this.ctx = ctx;
  }

  /**
   * Factory method for scene factories
   */
  static create(ctx: SceneContext): CustomStartScene {
    return new CustomStartScene(ctx);
  }

  /**
   * Set callback for when user taps to start
   */
  setOnStart(callback: () => void): void {
    this.onStartCallback = callback;
  }

  /**
   * Check if user has interacted
   */
  hasUserInteracted(): boolean {
    return this.hasInteracted;
  }

  protected async onMount(): Promise<void> {
    this.ctx.logger.info('CustomStartScene: Mounting with reference visuals');

    const { width, height } = this.ctx.viewport;

    // Create split-door background
    this.createSplitBackground(width, height);

    // Create centered logo
    this.createLogo(width, height);

    // Create text-based CTA indicator (reference style)
    this.createTextCta(width, height);

    // Setup interaction
    this.setupInteraction(width, height);

    this.ctx.logger.info('CustomStartScene: Mounted');
  }

  /**
   * Create split-door background (reference style)
   */
  private createSplitBackground(width: number, height: number): void {
    const leftTexture = this.ctx.resolveTexture(this.visualConfig.doors.leftImage);
    const rightTexture = this.ctx.resolveTexture(this.visualConfig.doors.rightImage);

    // Left door - anchored at center for animation
    if (leftTexture) {
      this.bgLeft = new Sprite(leftTexture);
      this.bgLeft.anchor.set(0.5);
      this.bgLeft.width = width / 2;
      this.bgLeft.height = height;
      this.bgLeft.x = width / 4; // Center of left half
      this.bgLeft.y = height / 2;
      this.container.addChild(this.bgLeft);
    }

    // Right door - anchored at center for animation
    if (rightTexture) {
      this.bgRight = new Sprite(rightTexture);
      this.bgRight.anchor.set(0.5);
      this.bgRight.width = width / 2;
      this.bgRight.height = height;
      this.bgRight.x = width * 3 / 4; // Center of right half
      this.bgRight.y = height / 2;
      this.container.addChild(this.bgRight);
    }

    // Fallback if no textures
    if (!this.bgLeft && !this.bgRight) {
      this.ctx.logger.warn('CustomStartScene: Door textures not found, using fallback');
      const bg = new Graphics();
      bg.rect(0, 0, width, height);
      bg.fill({ color: colors.bgDark });
      this.container.addChild(bg);
    }
  }

  /**
   * Create centered logo (reference style)
   */
  private createLogo(width: number, height: number): void {
    const logoTexture = this.ctx.resolveTexture(this.visualConfig.logo.assetKey);

    if (logoTexture) {
      this.logo = new Sprite(logoTexture);
      this.logo.anchor.set(0.5);
      this.logo.x = width / 2;
      // Reference: logo.y = height/2 - 41
      this.logo.y = height / 2 + this.visualConfig.logo.yOffset;
      this.container.addChild(this.logo);
    }
  }

  /**
   * Create text-based CTA indicator (reference ProgressBar style)
   * "CLICK TO START" with pink fill fully revealed
   */
  private createTextCta(width: number, height: number): void {
    const config = this.visualConfig.cta;

    this.ctaContainer = new Container();
    this.ctaContainer.x = width / 2;
    // Reference: same position as loader - height/2 + 433
    this.ctaContainer.y = height / 2 + config.yOffset;
    this.container.addChild(this.ctaContainer);

    // Text style matching reference
    const textStyle = new TextStyle({
      fontFamily: config.fontFamily,  // 'Gang'
      fontSize: config.fontSize,       // 35
      fill: config.textColor,          // 0xffffff
    });

    // White text (background layer)
    this.labelWhite = new Text({ text: config.text, style: textStyle });
    this.labelWhite.anchor.set(0.5);
    this.ctaContainer.addChild(this.labelWhite);

    // Pink text (fully revealed for CTA - 100% mask)
    const pinkStyle = new TextStyle({
      fontFamily: config.fontFamily,
      fontSize: config.fontSize,
      fill: config.fillColor,  // 0xfb0058
      stroke: { color: config.fillColor, width: 1 },
    });
    this.labelPink = new Text({ text: config.text, style: pinkStyle });
    this.labelPink.anchor.set(0.5);
    this.ctaContainer.addChild(this.labelPink);

    // Mask for reveal effect - start fully revealed
    this.labelMask = new Graphics();
    this.labelMask.eventMode = 'none';  // Prevent mask from interfering with hit testing
    this.ctaContainer.addChild(this.labelMask);
    this.labelPink.mask = this.labelMask;
    this.updateCtaMask(1);  // Full reveal
  }

  /**
   * Update CTA mask for progress reveal effect
   */
  private updateCtaMask(progress: number): void {
    if (!this.labelMask || !this.labelPink) return;

    const textWidth = this.labelPink.width;
    const textHeight = this.labelPink.height;
    const revealWidth = textWidth * Math.max(0, Math.min(1, progress));

    this.labelMask.clear();
    if (revealWidth > 0) {
      this.labelMask.rect(-textWidth / 2, -textHeight / 2, revealWidth, textHeight);
      this.labelMask.fill({ color: 0xffffff });
    }
  }

  /**
   * Setup interaction handlers
   */
  private setupInteraction(width: number, height: number): void {
    // Create invisible hit area overlay (PIXI v8 compatible approach)
    // Using a Graphics child instead of hitArea property to avoid isInteractive issues
    this.hitAreaOverlay = new Graphics();
    this.hitAreaOverlay.rect(0, 0, width, height);
    this.hitAreaOverlay.fill({ color: 0x000000, alpha: 0 }); // Invisible
    this.hitAreaOverlay.eventMode = 'static';
    this.hitAreaOverlay.cursor = 'pointer';
    this.container.addChild(this.hitAreaOverlay);

    // Handle tap/click on the overlay
    this.pointerHandler = () => this.handleInteraction();
    this.hitAreaOverlay.on('pointerdown', this.pointerHandler);
    this.hitAreaOverlay.on('touchstart', this.pointerHandler);
  }

  /**
   * Handle user interaction - start door animation
   */
  private async handleInteraction(): Promise<void> {
    // Prevent double-tap
    if (this.hasInteracted || this.isDestroyed || this.isAnimating) return;

    this.hasInteracted = true;
    this.isAnimating = true;
    this.ctx.logger.info('CustomStartScene: User interaction detected');

    // Disable further interaction
    if (this.hitAreaOverlay) {
      this.hitAreaOverlay.eventMode = 'none';
      this.hitAreaOverlay.cursor = 'default';
    }

    // Unlock audio
    const alreadyUnlocked = this.ctx.audioBus.isUnlocked();
    if (!alreadyUnlocked) {
      try {
        await this.ctx.audioBus.unlock();
        this.ctx.logger.info('CustomStartScene: Audio context unlocked');
      } catch (error) {
        this.ctx.logger.warn('CustomStartScene: Failed to unlock audio', error);
      }
    }

    // Play door open sound
    try {
      this.ctx.audioBus.play(this.visualConfig.doorAnimation.doorSound, { channel: 'sfx' });
    } catch (error) {
      this.ctx.logger.warn('CustomStartScene: Door sound not found', error);
    }

    // Start door animation
    await this.playDoorAnimation();

    // Cancel-safety check
    if (this.isDestroyed) {
      this.ctx.logger.info('CustomStartScene: Scene destroyed, skipping callback');
      return;
    }

    // Trigger callback
    this.ctx.logger.info('CustomStartScene: Door animation complete, calling callback');
    this.onStartCallback?.();
  }

  /**
   * Play the door opening animation (reference: DoorSymbol.showGame)
   * Reference timings: REEL_SPEED * 10 = 0.2 * 10 = 2 seconds
   */
  private async playDoorAnimation(): Promise<void> {
    const { width } = this.ctx.viewport;
    const config = this.visualConfig.doorAnimation;
    const duration = config.durationMs;

    // Create animation promises
    const promises: Promise<void>[] = [];

    // Animate logo: fade out + scale up
    if (this.logo) {
      const startAlpha = this.logo.alpha;
      const startScale = this.logo.scale.x;
      const targetScale = startScale * config.logoScaleTo;
      const logoRef = this.logo;

      const logoTween = { progress: 0 };
      const handle = this.ctx.tweenService.to(logoTween, { progress: 1 }, {
        duration,
        easing: 'easeInQuad',
        onUpdate: () => {
          if (logoRef && !this.isDestroyed) {
            const p = logoTween.progress;
            logoRef.alpha = startAlpha * (1 - p);
            const scale = startScale + (targetScale - startScale) * p;
            logoRef.scale.set(scale);
          }
        },
      });
      this.tweenHandles.push(handle);
      promises.push(handle.promise);
    }

    // Animate CTA: fade out
    if (this.ctaContainer) {
      const startAlpha = this.ctaContainer.alpha;
      const ctaRef = this.ctaContainer;

      const ctaTween = { progress: 0 };
      const handle = this.ctx.tweenService.to(ctaTween, { progress: 1 }, {
        duration,
        easing: 'easeInQuad',
        onUpdate: () => {
          if (ctaRef && !this.isDestroyed) {
            ctaRef.alpha = startAlpha * (1 - ctaTween.progress);
          }
        },
      });
      this.tweenHandles.push(handle);
      promises.push(handle.promise);
    }

    // Animate left door: scale up + slide left
    // Reference: x = -576 at 1920 width (proportionally: -width * 0.3)
    if (this.bgLeft) {
      const startX = this.bgLeft.x;
      const startScale = this.bgLeft.scale.x;
      const targetX = -width * 0.3;  // Reference: -576 at 1920
      const targetScale = startScale * config.doorScaleTo;
      const leftRef = this.bgLeft;

      const leftTween = { progress: 0 };
      const handle = this.ctx.tweenService.to(leftTween, { progress: 1 }, {
        duration,
        easing: 'easeInQuad',
        onUpdate: () => {
          if (leftRef && !this.isDestroyed) {
            const p = leftTween.progress;
            leftRef.x = startX + (targetX - startX) * p;
            const scale = startScale + (targetScale - startScale) * p;
            leftRef.scale.set(scale);
          }
        },
      });
      this.tweenHandles.push(handle);
      promises.push(handle.promise);
    }

    // Animate right door: scale up + slide right
    // Reference: x = 2496 at 1920 width (proportionally: width * 1.3)
    if (this.bgRight) {
      const startX = this.bgRight.x;
      const startScale = this.bgRight.scale.x;
      const targetX = width * 1.3;  // Reference: 2496 at 1920
      const targetScale = startScale * config.doorScaleTo;
      const rightRef = this.bgRight;

      const rightTween = { progress: 0 };
      const handle = this.ctx.tweenService.to(rightTween, { progress: 1 }, {
        duration,
        easing: 'easeInQuad',
        onUpdate: () => {
          if (rightRef && !this.isDestroyed) {
            const p = rightTween.progress;
            rightRef.x = startX + (targetX - startX) * p;
            const scale = startScale + (targetScale - startScale) * p;
            rightRef.scale.set(scale);
          }
        },
      });
      this.tweenHandles.push(handle);
      promises.push(handle.promise);
    }

    // Wait for all animations to complete
    await Promise.all(promises);
    this.isAnimating = false;
  }

  update(deltaMs: number): void {
    if (this.isDestroyed || this.hasInteracted) return;

    this.animationTime += deltaMs;

    // Pulse animation on CTA container (alpha only - scale would break mask)
    if (this.ctaContainer) {
      // Alpha pulse: 0.7 to 1.0
      const alphaPulse = Math.sin(this.animationTime / 700) * 0.15 + 0.85;
      this.ctaContainer.alpha = alphaPulse;
    }
  }

  protected onDestroy(): void {
    this.ctx.logger.info('CustomStartScene: Destroying');

    // Stop all running tweens
    for (const handle of this.tweenHandles) {
      handle.stop();
    }
    this.tweenHandles = [];

    // Remove event listeners from hit area overlay
    if (this.pointerHandler && this.hitAreaOverlay) {
      this.hitAreaOverlay.off('pointerdown', this.pointerHandler);
      this.hitAreaOverlay.off('touchstart', this.pointerHandler);
      this.pointerHandler = null;
    }

    // Clear callbacks
    this.onStartCallback = null;

    // Destroy and clear references
    this.bgLeft?.destroy();
    this.bgLeft = null;
    this.bgRight?.destroy();
    this.bgRight = null;
    this.logo?.destroy();
    this.logo = null;

    // Destroy CTA components
    this.labelWhite?.destroy();
    this.labelWhite = null;
    this.labelPink?.destroy();
    this.labelPink = null;
    this.labelMask?.destroy();
    this.labelMask = null;
    this.ctaContainer?.destroy();
    this.ctaContainer = null;

    // Destroy hit area overlay
    this.hitAreaOverlay?.destroy();
    this.hitAreaOverlay = null;

    this.ctx.logger.info('CustomStartScene: Destroyed');
  }
}

export default CustomStartScene;
