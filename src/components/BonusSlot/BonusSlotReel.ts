/**
 * BonusSlotReel - Single vertical reel in bonus slot machine
 *
 * Matches reference: blingo_front/ui/GameScreen/BonusSlot/BonusSlotReel.ts
 */

import { PIXI, type ITweenService } from 'slot-frontend-engine';
const { Container, Sprite } = PIXI;

import type { TextureResolver } from '../SlingoGrid.js';
import { BonusSlotSymbol } from './BonusSlotSymbol.js';

// Reel speed matching reference
const REEL_SPEED = 0.2;

/**
 * Bonus symbols available
 */
const BONUS_SYMBOLS = ['FAN', 'LOTUS', 'BAR', 'YINYANG', 'PIG', 'EIGHT', 'DRAGON'];

/**
 * BonusSlotReel - A single vertical reel in the bonus slot
 */
export class BonusSlotReel extends Container {
  public background: PIXI.Sprite;
  public reel: PIXI.Container;
  public newReel: PIXI.Container;

  public reelId: number;
  public isNewReel: boolean = true;
  public repeatNumber: number = 0;
  public loopNumber: number = 0;

  private readonly resolveTexture: TextureResolver;
  private readonly tweenService: ITweenService | undefined;

  constructor(
    reelId: number,
    reelPattern: string[],
    resolveTexture: TextureResolver,
    tweenService?: ITweenService,
  ) {
    super();
    this.reelId = reelId;
    this.resolveTexture = resolveTexture;
    this.tweenService = tweenService;

    // Set Background (BonusSlot/reel)
    const backgroundTexture = resolveTexture('BonusSlot/reel');
    this.background = new Sprite(backgroundTexture ?? undefined);
    this.background.anchor.set(0.5);
    this.addChild(this.background);
    this.background.x = this.background.width / 2;
    this.background.y = this.background.height / 2;

    // Initialize Reel containers
    this.reel = new Container();
    this.addChild(this.reel);

    this.newReel = new Container();
    this.addChild(this.newReel);

    // Initialize with pattern
    this.initialize(reelPattern);
  }

  /**
   * Initialize reel with pattern
   */
  initialize(reelPattern: string[]): void {
    this.reel.removeChildren();
    reelPattern.forEach((symbol, index) => {
      const symbolSprite = new BonusSlotSymbol(symbol, this.resolveTexture, this.tweenService);
      symbolSprite.x = 0;
      symbolSprite.y = 8 + index * symbolSprite.height;
      this.reel.addChild(symbolSprite);
    });
  }

  /**
   * Add random symbol for spin
   */
  addNewRandomSymbol(): void {
    for (let i = 0; i < 3; i++) {
      const random = Math.floor((Math.random() * 10) % BONUS_SYMBOLS.length);
      const symbol = BONUS_SYMBOLS[random] ?? 'FAN';
      const bonusSlotSymbol = new BonusSlotSymbol(symbol, this.resolveTexture, this.tweenService);
      bonusSlotSymbol.x = 0;
      bonusSlotSymbol.y = 8 + i * bonusSlotSymbol.height;
      if (this.isNewReel) {
        this.newReel.addChild(bonusSlotSymbol);
      } else {
        this.reel.addChild(bonusSlotSymbol);
      }
    }
  }

  /**
   * Move reels (matching reference: move())
   */
  move(): void {
    if (!this.tweenService) return;

    const reelHeight = 571; // Matching reference
    const activeReel = this.isNewReel ? this.newReel : this.reel;
    const inactiveReel = this.isNewReel ? this.reel : this.newReel;

    // Move active reel to top
    const activeTween = { y: activeReel.y };
    this.tweenService
      .to(activeTween, { y: 0 }, {
        duration: REEL_SPEED * 1000,
        easing: 'linear',
        onUpdate: () => {
          activeReel.y = activeTween.y;
        },
      })
      .promise.catch(() => {
        // Ignore errors
      });

    // Move inactive reel down
    const inactiveTween = { y: inactiveReel.y };
    this.tweenService
      .to(inactiveTween, { y: reelHeight }, {
        duration: REEL_SPEED * 1000,
        easing: 'linear',
        onUpdate: () => {
          inactiveReel.y = inactiveTween.y;
        },
        onComplete: () => {
          this.dolastAction();
        },
      })
      .promise.catch(() => {
        // Ignore errors
      });
  }

  /**
   * Spin last action (matching reference: dolastAction())
   */
  dolastAction(): void {
    if (this.repeatNumber < 3) {
      this.isNewReel = !this.isNewReel;
      this.generateNextSymbols();
      this.repeatNumber++;
      this.move();
    } else {
      // Stop spinning
      this.repeatNumber = 0;
    }
  }

  /**
   * Generate next symbols
   */
  generateNextSymbols(): void {
    if (this.isNewReel) {
      this.newReel.removeChildren();
      this.addNewRandomSymbol();
    } else {
      this.reel.removeChildren();
      this.addNewRandomSymbol();
    }
  }

  /**
   * Start spin
   */
  spin(): void {
    this.repeatNumber = 0;
    this.addNewRandomSymbol();
    this.move();
  }

  /**
   * Show win effect on reel (matching reference: showWinEffectReel)
   */
  showWinEffectReel(_winPattern: any, _index: number, _direction: string): void {
    // Implementation would show win effects on matching symbols
    // This is complex and depends on win pattern structure
  }

  override destroy(): void {
    super.destroy({ children: true });
  }
}

