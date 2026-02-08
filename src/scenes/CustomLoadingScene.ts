/**
 * Custom Loading Scene - Reference Visual Parity
 *
 * Implements reference project visual parity:
 * - Split door background (left/right halves)
 * - Centered logo with -41px Y offset
 * - Text-reveal loader ("LOADING..." with pink mask)
 *
 * RULES:
 * - Uses only boot bundle assets
 * - Animations are time-based (deterministic-safe)
 * - destroy() must cleanup everything
 */

import {
  BaseScene,
  type ILoadingScene,
  type SceneContext,
} from '@fnx/sl-engine';

import { referenceVisualConfig } from '../game/BrandConfig.js';
import { Sprite, Container, Graphics, TextStyle, Text } from 'pixi.js';

/**
 * Custom Loading Scene with reference project visual parity
 * Uses text-reveal loader matching reference ProgressBar component
 */
export class CustomLoadingScene extends BaseScene implements ILoadingScene {
  public readonly id = 'custom-loading';

  private readonly ctx: SceneContext;
  private readonly visualConfig = referenceVisualConfig;

  // Split door background
  private bgLeft: Sprite | null = null;
  private bgRight: Sprite | null = null;

  // Logo
  private logo: Sprite | null = null;
  private logoBaseScale = 1;

  // Graphics-based progress bar (no text to avoid canvas fallback bugs)
  private loaderContainer: Container | null = null;
  progressBarBg: Graphics | null = null;
  progressBarFill: Graphics | null = null;
  readonly progressBarWidth = 400;
  readonly progressBarHeight = 8;

  // State
  private currentProgress = 0;
  private targetProgress = 0;
  private animationTime = 0;
  private loaderBg: Sprite | null = null;
  private labelWhite: Text | null = null;
  private labelPink: Text | null = null;
  private labelMask: Graphics | null = null;

  constructor(ctx: SceneContext) {
    super();
    this.ctx = ctx;
  }

  /**
   * Factory method for scene factories
   */
  static create(ctx: SceneContext): CustomLoadingScene {
    return new CustomLoadingScene(ctx);
  }

  protected async onMount(): Promise<void> {
    this.ctx.logger.info('CustomLoadingScene: Mounting with reference visuals');

    const { width, height } = this.ctx.viewport;

    // Hide CSS pre-loader spinner
    this.hideCssSpinner();

    // Create split-door background
    this.createSplitBackground(width, height);

    // Create centered logo
    this.createLogo(width, height);

    // Create text-reveal loader (reference style)
    this.createTextRevealLoader(width, height);

    this.ctx.logger.info('CustomLoadingScene: Mounted');
  }

  /**
   * Hide the CSS pre-loader spinner
   */
  private hideCssSpinner(): void {
    if (typeof document === 'undefined') return;

    const spinners = document.getElementsByClassName('wrapper');
    for (let i = 0; i < spinners.length; i++) {
      const el = spinners[i] as HTMLElement;
      el.style.display = 'none';
    }

    // Also add class to body
    document.body.classList.add('game-started');
  }

  /**
   * Create split-door background (reference style)
   */
  private createSplitBackground(width: number, height: number): void {
    const BG = this.ctx.resolveTexture(this.visualConfig.Locker.assetKey);

    // Left door
    if (BG) {
      this.bgLeft = new Sprite(BG);
      this.bgLeft.width = width;
      this.bgLeft.height = height;
      this.bgLeft.x = 0;
      this.bgLeft.y = 0;
      this.container.addChild(this.bgLeft);
    }
  }

  /**
   * Create centered logo (reference style: center - 41px Y offset)
   */
  private createLogo(width: number, height: number): void {
    const logoTexture = this.ctx.resolveTexture(this.visualConfig.logo.assetKey);

    if (logoTexture) {
      this.logo = new Sprite(logoTexture);
      this.logo.anchor.set(0.5);
      this.logo.x = width / 2;
      // Reference: logo.y = height/2 - 41
      this.logo.y = height / 2 + this.visualConfig.logo.yOffset;
      this.logoBaseScale = this.logo.scale.x;
      this.container.addChild(this.logo);
    } else {
      this.ctx.logger.warn('CustomLoadingScene: Logo texture not found');
    }

  }

  /**
   * Create text-reveal loader (reference ProgressBar style)
   * Two text labels: white (background) and pink (revealed via mask)
   */
  private createTextRevealLoader(width: number, height: number): void {
    const config = this.visualConfig.loader;

    this.loaderContainer = new Container();
    this.loaderContainer.x = width / 2;
    // Reference: progressBar.y = height/2 + 433
    this.loaderContainer.y = height / 2 + config.yOffset;
    this.container.addChild(this.loaderContainer);

    // Optional background sprite (loading.png)
    const bgTexture = this.ctx.resolveTexture('Loading_Bar');
    if (bgTexture) {
      this.loaderBg = new Sprite(bgTexture);
      this.loaderBg.anchor.set(0.5);
      this.loaderBg.y = -170
      this.loaderBg.width = this.loaderBg.width * 1.5
      this.loaderContainer.addChild(this.loaderBg);
    }

    // Text style matching reference
    const textStyle = new TextStyle({
      fontFamily: config.fontFamily,  // 'Gang'
      fontSize: config.fontSize,       // 35
      fill: config.textColor,          // 0xffffff
    });

    // White text (background layer)
    this.labelWhite = new Text({ text: config.text, style: textStyle });
    this.labelWhite.anchor.set(0.5);
    this.loaderContainer.addChild(this.labelWhite);

    // Pink text (revealed via mask)
    const pinkStyle = new TextStyle({
      fontFamily: config.fontFamily,
      fontSize: config.fontSize,
      fill: config.fillColor,  // 0xfb0058
      stroke: { color: config.fillColor, width: 1 },
    });
    this.labelPink = new Text({ text: config.text, style: pinkStyle });
    this.labelPink.anchor.set(0.5);
    this.loaderContainer.addChild(this.labelPink);

    // Mask for reveal effect
    this.labelMask = new Graphics();
    this.labelMask.eventMode = 'none';  // Prevent mask from interfering with hit testing
    this.loaderContainer.addChild(this.labelMask);
    this.labelPink.mask = this.labelMask;

    // Initial state: 0% revealed
    this.updateTextReveal();
  }

  /**
   * Update the text-reveal mask based on current progress
   */
  private updateTextReveal(): void {
    if (!this.labelMask || !this.labelPink) return;

    const textWidth = this.labelPink.width;
    const textHeight = this.labelPink.height;
    const revealWidth = Math.max(0, textWidth * this.currentProgress);

    this.labelMask.clear();
    if (revealWidth > 0) {
      this.labelMask.rect(
        -textWidth / 2,      // Start from left edge of text
        -textHeight / 2,
        revealWidth,
        textHeight
      );
      this.labelMask.fill({ color: 0xffffff });
    }
  }

  /**
   * Update loading progress (0-1)
   */
  setProgress(progress: number, _status?: string): void {
    if (this.isDestroyed) return;
    this.targetProgress = Math.max(0, Math.min(1, progress));
  }

  /**
   * Check if loading is complete
   */
  isComplete(): boolean {
    return this.currentProgress >= 1;
  }

  update(deltaMs: number): void {
    if (this.isDestroyed) return;

    this.animationTime += deltaMs;

    // Smooth progress interpolation
    const lerpSpeed = 5;
    const dt = deltaMs / 1000;
    this.currentProgress +=
      (this.targetProgress - this.currentProgress) * Math.min(1, lerpSpeed * dt);

    if (Math.abs(this.targetProgress - this.currentProgress) < 0.001) {
      this.currentProgress = this.targetProgress;
    }

    // Update text-reveal mask
    this.updateTextReveal();

    // Subtle logo animation (deterministic - time-based sine wave)
    if (this.logo && this.logoBaseScale > 0) {
      const pulse = Math.sin(this.animationTime / 1000) * 0.02 + 1;
      this.logo.scale.set(this.logoBaseScale * pulse);
    }
  }

  protected onDestroy(): void {
    this.ctx.logger.info('CustomLoadingScene: Destroying');

    // Destroy all elements
    this.bgLeft?.destroy();
    this.bgLeft = null;
    this.bgRight?.destroy();
    this.bgRight = null;
    this.logo?.destroy();
    this.logo = null;

    // Destroy loader components
    this.loaderBg?.destroy();
    this.loaderBg = null;
    this.labelWhite?.destroy();
    this.labelWhite = null;
    this.labelPink?.destroy();
    this.labelPink = null;
    this.labelMask?.destroy();
    this.labelMask = null;
    this.loaderContainer?.destroy();
    this.loaderContainer = null;

    this.ctx.logger.info('CustomLoadingScene: Destroyed');
  }
}

export default CustomLoadingScene;
