/**
 * BonusSlotSymbol - Single symbol in bonus slot reel
 *
 * Matches reference: blingo_front/ui/GameScreen/BonusSlot/BonusSlotSymbol.ts
 */

import { PIXI, type ITweenService } from 'slot-frontend-engine';
const { Container, Sprite } = PIXI;

import type { TextureResolver } from '../SlingoGrid.js';

/**
 * BonusSlotSymbol - A single symbol cell in the bonus slot reel
 */
export class BonusSlotSymbol extends Container {
  public bonuSymbolBackground: PIXI.Sprite;
  public bonusSymbol: PIXI.Sprite;
  public bonusSymbolEffect: PIXI.Sprite | null = null;
  public bonusSymbolLine: PIXI.Sprite | null = null;

  private readonly resolveTexture: TextureResolver;
  private readonly tweenService: ITweenService | undefined;

  constructor(symbol: string, resolveTexture: TextureResolver, tweenService?: ITweenService) {
    super();
    this.resolveTexture = resolveTexture;
    this.tweenService = tweenService;

    // Add Bonus Background Image (BonusSlot/reel)
    const bonusTypeBackgroundTexture = resolveTexture('BonusSlot/reel');
    this.bonuSymbolBackground = new Sprite(bonusTypeBackgroundTexture ?? undefined);
    this.bonuSymbolBackground.anchor.set(0.5);
    if (bonusTypeBackgroundTexture) {
      // Height is divided by 3 (matching reference)
      this.bonuSymbolBackground.height = (this.bonuSymbolBackground.height - 16) / 3;
    }
    this.bonuSymbolBackground.x = this.bonuSymbolBackground.width / 2;
    this.bonuSymbolBackground.y = this.bonuSymbolBackground.height / 2;
    this.bonuSymbolBackground.alpha = 0;
    this.addChild(this.bonuSymbolBackground);

    // Add Bonus Symbol (BonusSlot/Symbols/{symbol})
    const bonusSymbolTexture = resolveTexture(`BonusSlot/Symbols/${symbol}`);
    this.bonusSymbol = new Sprite(bonusSymbolTexture ?? undefined);
    this.bonusSymbol.anchor.set(0.5);
    this.bonusSymbol.x = this.bonuSymbolBackground.width / 2;
    this.bonusSymbol.y = this.bonuSymbolBackground.height / 2;
    this.bonusSymbol.zIndex = 10;
    this.addChild(this.bonusSymbol);
  }

  /**
   * Show effect symbol (matching reference: showEffectSymbol)
   */
  showEffectSymbol(symbol: string, type?: number): void {
    if (!this.tweenService) return;

    // Play win sound (matching reference)
    // this.audioBus?.play('BSWin', { channel: 'sfx' });

    // Create star effect (BonusSlot/Star/star_{symbol})
    const starTexture = this.resolveTexture(`BonusSlot/Star/star_${symbol.toLowerCase()}`);
    if (starTexture) {
      this.bonusSymbolEffect = new Sprite(starTexture);
      this.bonusSymbolEffect.scale.set(0, 0);
      this.bonusSymbolEffect.anchor.set(0.5);
      this.bonusSymbolEffect.x = this.bonuSymbolBackground.width / 2;
      this.bonusSymbolEffect.y = this.bonuSymbolBackground.height / 2;
      this.bonusSymbolEffect.zIndex = (this.bonusSymbol.zIndex ?? 0) + 1;
      this.bonusSymbolEffect.blendMode = 'screen';
      this.addChild(this.bonusSymbolEffect);
    }

    // Create line effect if type is provided
    if (type !== undefined) {
      const lineKey =
        type === 0
          ? `BonusSlot/Line/winline_${symbol.toLowerCase()}_horizontal`
          : type === 1
            ? `BonusSlot/Line/winline_${symbol.toLowerCase()}_diagonal`
            : `BonusSlot/Line/winline_${symbol.toLowerCase()}_rotate`;
      const lineTexture = this.resolveTexture(lineKey);
      if (lineTexture) {
        this.bonusSymbolLine = new Sprite(lineTexture);
        this.bonusSymbolLine.alpha = 0;
        this.bonusSymbolLine.anchor.set(0.5);
        this.bonusSymbolLine.x = this.bonuSymbolBackground.width / 2 + this.bonusSymbolLine.width / 2;
        this.bonusSymbolLine.y =
          type === 0
            ? this.bonuSymbolBackground.height / 2
            : type === 1
              ? this.bonuSymbolBackground.height / 2 + this.bonusSymbolLine.height / 2
              : this.bonuSymbolBackground.height / 2 - this.bonusSymbolLine.height / 2;
        this.bonusSymbolLine.zIndex = (this.bonusSymbol.zIndex ?? 0) - 1;
        this.addChild(this.bonusSymbolLine);
      }
    }

    const REEL_SPEED_MS = 0.2 * 1000; // REEL_SPEED * 1000
    const duration = REEL_SPEED_MS * 0.8; // REEL_SPEED * 0.8

    // Animate line alpha
    if (this.bonusSymbolLine) {
      const lineAlpha = { alpha: this.bonusSymbolLine.alpha };
      this.tweenService
        .to(lineAlpha, { alpha: 1 }, {
          duration,
          easing: 'linear',
          onUpdate: () => {
            if (this.bonusSymbolLine) {
              this.bonusSymbolLine.alpha = lineAlpha.alpha;
            }
          },
        })
        .promise.catch(() => {
          // Ignore errors
        });
    }

    // Animate star effect scale
    if (this.bonusSymbolEffect) {
      const scaleProxy = { x: 0, y: 0 };
      this.tweenService
        .to(scaleProxy, { x: 1, y: 1 }, {
          duration,
          easing: 'linear',
          onUpdate: () => {
            if (this.bonusSymbolEffect) {
              this.bonusSymbolEffect.scale.set(scaleProxy.x, scaleProxy.y);
            }
          },
        })
        .promise.then(() => {
          // Scale back down
          this.tweenService
            ?.to(scaleProxy, { x: 0, y: 0 }, {
              duration,
              easing: 'linear',
              onUpdate: () => {
                if (this.bonusSymbolEffect) {
                  this.bonusSymbolEffect.scale.set(scaleProxy.x, scaleProxy.y);
                }
              },
              onComplete: () => {
                if (this.bonusSymbolEffect && this.bonusSymbolEffect.parent) {
                  this.bonusSymbolEffect.parent.removeChild(this.bonusSymbolEffect);
                  this.bonusSymbolEffect.destroy();
                  this.bonusSymbolEffect = null;
                }
              },
            })
            .promise.catch(() => {
              // Ignore errors
            });
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }

  /**
   * Remove show effect (matching reference: removeShowEffect)
   */
  removeShowEffect(): void {
    if (this.bonusSymbolLine && this.bonusSymbolLine.parent) {
      this.bonusSymbolLine.parent.removeChild(this.bonusSymbolLine);
      this.bonusSymbolLine.destroy();
      this.bonusSymbolLine = null;
    }
  }

  override destroy(): void {
    super.destroy({ children: true });
  }
}

