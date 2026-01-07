/**
 * BonusSlotTable - Container for bonus slot reels
 *
 * Matches reference: blingo_front/ui/GameScreen/BonusSlot/BonusSlotTable.ts
 */

import { PIXI, type ITweenService } from 'slot-frontend-engine';
const { Container, Graphics } = PIXI;

import type { TextureResolver } from '../SlingoGrid.js';
import { BonusSlotReel } from './BonusSlotReel.js';

/**
 * BonusSlotTable - Container for 5 bonus slot reels
 */
export class BonusSlotTable extends Container {
  public bonusSlotTable: BonusSlotReel[];

  private readonly resolveTexture: TextureResolver;
  private readonly tweenService: ITweenService | undefined;

  constructor(
    tablePattern: string[][],
    resolveTexture: TextureResolver,
    tweenService?: ITweenService,
  ) {
    super();
    this.resolveTexture = resolveTexture;
    this.tweenService = tweenService;

    // Create 5 reels
    this.bonusSlotTable = tablePattern.map((reelPattern, index) => {
      const singleBonusSlotReel = new BonusSlotReel(
        index,
        reelPattern,
        resolveTexture,
        tweenService,
      );
      singleBonusSlotReel.x = index * (singleBonusSlotReel.width + 12);
      this.addChild(singleBonusSlotReel);
      return singleBonusSlotReel;
    });

    // Add mask for bonus slot (matching reference)
    const mask = new Graphics();
    mask.rect(0, 0, (this.bonusSlotTable[0]?.width ?? 225 + 12) * 5, this.bonusSlotTable[0]?.height ?? 571);
    mask.fill({ color: 0xffffff });
    this.mask = mask;
    this.addChild(mask);
  }

  /**
   * Initialize with new pattern
   */
  initialize(tablePattern: string[][]): void {
    this.bonusSlotTable.forEach((reel) => {
      this.removeChild(reel);
      reel.destroy();
    });

    this.bonusSlotTable = tablePattern.map((reelPattern, index) => {
      const singleBonusSlotReel = new BonusSlotReel(
        index,
        reelPattern,
        this.resolveTexture,
        this.tweenService,
      );
      singleBonusSlotReel.x = index * (singleBonusSlotReel.width + 12);
      this.addChild(singleBonusSlotReel);
      return singleBonusSlotReel;
    });
  }

  /**
   * Spin all reels
   */
  spin(): void {
    this.bonusSlotTable.forEach((reel) => {
      reel.spin();
    });
  }

  /**
   * Show win effect table (matching reference: showWinEffectTable)
   */
  showWinEffectTable(_loopNumber: number): void {
    // Implementation would show win effects based on slotWins
    // This is complex and depends on game state structure
  }

  override destroy(): void {
    this.bonusSlotTable.forEach((reel) => reel.destroy());
    super.destroy({ children: true });
  }
}

