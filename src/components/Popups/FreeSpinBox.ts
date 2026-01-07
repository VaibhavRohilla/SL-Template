/**
 * FreeSpinBox - Extra spin wheel popup
 *
 * Matches reference: blingo_front/popups/GameScreen.ts FreeSpinBox
 */

import { PIXI, type ITweenService } from 'slot-frontend-engine';
const { Container, Sprite } = PIXI;

import { DESIGN_W, DESIGN_H } from '../../layout/DesignLayout.js';
import type { TextureResolver } from '../SlingoGrid.js';

const REEL_SPEED = 0.2;

/**
 * FreeSpinBox - Extra spin wheel popup
 */
export class FreeSpinBox extends Container {
  public freeSpinEffect: PIXI.Sprite;
  public freeSpinBackground: PIXI.Sprite;
  public freeSpinES: PIXI.Sprite;
  public freeSpinRate: PIXI.Sprite;
  public freeSpinPointer: PIXI.Sprite;

  private readonly resolveTexture: TextureResolver;
  private readonly tweenService: ITweenService | undefined;

  constructor(resolveTexture: TextureResolver, tweenService?: ITweenService) {
    super();
    this.resolveTexture = resolveTexture;
    this.tweenService = tweenService;

    // Add Free Spin Effect (Popup/ExtraSpin/green_star_big)
    const freeSpinEffectTexture = resolveTexture('green_star_big');
    this.freeSpinEffect = new Sprite(freeSpinEffectTexture ?? undefined);
    this.freeSpinEffect.anchor.set(0.5);
    this.freeSpinEffect.x = DESIGN_W / 2;
    this.freeSpinEffect.y = DESIGN_H / 2;
    this.addChild(this.freeSpinEffect);

    // Add Free Spin Background (Popup/ExtraSpin/stator)
    const freeSpinBackgroundTexture = resolveTexture('stator');
    this.freeSpinBackground = new Sprite(freeSpinBackgroundTexture ?? undefined);
    this.freeSpinBackground.anchor.set(0.5);
    this.freeSpinBackground.x = DESIGN_W / 2;
    this.freeSpinBackground.y = DESIGN_H / 2;
    this.addChild(this.freeSpinBackground);

    // Add Free Spin Rate (Popup/ExtraSpin/spin_1)
    const freeSpinRateTexture = resolveTexture('spin_1');
    this.freeSpinRate = new Sprite(freeSpinRateTexture ?? undefined);
    this.freeSpinRate.anchor.set(0.5);
    this.freeSpinRate.blendMode = 'screen';
    this.freeSpinRate.x = DESIGN_W / 2;
    this.freeSpinRate.y = DESIGN_H / 2;
    this.addChild(this.freeSpinRate);

    // Add Free Spin ES (Popup/ExtraSpin/es_spin_1)
    const freeSpinESTexture = resolveTexture('es_spin_1');
    this.freeSpinES = new Sprite(freeSpinESTexture ?? undefined);
    this.freeSpinES.anchor.set(0.5);
    this.freeSpinES.x = DESIGN_W / 2;
    this.freeSpinES.y = DESIGN_H / 2;
    this.addChild(this.freeSpinES);

    // Add Free Spin Pointer (Popup/ExtraSpin/point)
    const freeSpinPointerTexture = resolveTexture('point');
    this.freeSpinPointer = new Sprite(freeSpinPointerTexture ?? undefined);
    this.freeSpinPointer.anchor.set(0.5);
    this.freeSpinPointer.x = DESIGN_W / 2;
    this.freeSpinPointer.y = DESIGN_H / 2 - (this.freeSpinBackground.height ?? 0) / 2 + (this.freeSpinPointer.height ?? 0) / 2 + 3;
    this.addChild(this.freeSpinPointer);

    this.visible = false;
  }

  /**
   * Update Free Spin Type (matching reference: updateFreeSpinType)
   */
  updateFreeSpinType(type: number): void {
    // Update Free Spin Rate
    if (this.freeSpinRate.parent) {
      this.freeSpinRate.parent.removeChild(this.freeSpinRate);
    }
    const freeSpinRateTexture = this.resolveTexture(`spin_${type}`);
    this.freeSpinRate = new Sprite(freeSpinRateTexture ?? undefined);
    this.freeSpinRate.anchor.set(0.5);
    this.freeSpinRate.blendMode = 'screen';
    this.freeSpinRate.x = DESIGN_W / 2;
    this.freeSpinRate.y = DESIGN_H / 2;
    this.addChild(this.freeSpinRate);

    // Update Free Spin ES
    if (this.freeSpinES.parent) {
      this.freeSpinES.parent.removeChild(this.freeSpinES);
    }
    const freeSpinESTexture = this.resolveTexture(type <= 3 ? 'es_spin_1' : `es_spin_${type}`);
    this.freeSpinES = new Sprite(freeSpinESTexture ?? undefined);
    this.freeSpinES.anchor.set(0.5);
    this.freeSpinES.x = DESIGN_W / 2;
    this.freeSpinES.y = DESIGN_H / 2;
    this.addChild(this.freeSpinES);
  }

  /**
   * Show and rotate free spin box (matching reference: show)
   */
  async show(type: number, state: boolean): Promise<void> {
    if (!this.tweenService) return;

    // Show Free Spin Box
    this.scale.set(0, 0);
    this.freeSpinEffect.rotation = 0;
    this.freeSpinES.rotation = 0;
    this.freeSpinRate.rotation = 0;
    this.visible = true;

    const prevAngle = [90, 45, 22.5, 11.25, 5.625];
    const stateAngle = state
      ? (Math.random() * 100) % (prevAngle[type - 1]! * 2)
      : prevAngle[type - 1]! * 2 + ((Math.random() * 1000) % (360 - prevAngle[type - 1]! * 2));

    // Animate scale and rotation
    const scaleProxy = { x: 0, y: 0 };
    const effectRotation = { rotation: 0 };
    const esRotation = { rotation: 0 };

    // Scale up
    await this.tweenService
      .to(scaleProxy, { x: 1, y: 1 }, {
        duration: REEL_SPEED * 20 * 1000,
        easing: 'backOut',
        onUpdate: () => {
          this.scale.set(scaleProxy.x, scaleProxy.y);
        },
      })
      .promise;

    // Rotate effect
    this.tweenService
      .to(effectRotation, { rotation: 300 * (Math.PI / 180) }, {
        duration: REEL_SPEED * 20 * 1000,
        easing: 'linear',
        onUpdate: () => {
          this.freeSpinEffect.rotation = effectRotation.rotation;
        },
      })
      .promise.catch(() => {
        // Ignore errors
      });

    // Rotate ES and Rate
    const targetRotation = (1080 - prevAngle[type - 1]! + stateAngle) * (Math.PI / 180);
    await this.tweenService
      .to(esRotation, { rotation: targetRotation }, {
        duration: REEL_SPEED * 10 * 1000,
        easing: 'powerInOut',
        onUpdate: () => {
          this.freeSpinES.rotation = esRotation.rotation;
          this.freeSpinRate.rotation = esRotation.rotation;
        },
      })
      .promise;

    // Continue rotating effect
    this.tweenService
      .to(effectRotation, { rotation: 600 * (Math.PI / 180) }, {
        duration: REEL_SPEED * 20 * 1000,
        easing: 'linear',
        onUpdate: () => {
          this.freeSpinEffect.rotation = effectRotation.rotation;
        },
        onComplete: () => {
          this.hide();
        },
      })
      .promise.catch(() => {
        // Ignore errors
      });
  }

  /**
   * Hide Free Spin Box (matching reference: hide)
   */
  hide(): void {
    this.visible = false;
  }

  override destroy(): void {
    super.destroy({ children: true });
  }
}

