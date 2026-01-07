/**
 * BonusSlot - Bonus slot machine feature
 *
 * Matches reference: blingo_front/ui/GameScreen/BonusSlot/BonusSlot.ts
 */

import { PIXI, type ITweenService } from 'slot-frontend-engine';
const { Container } = PIXI;

import type { TextureResolver } from '../SlingoGrid.js';
import { BonusSlotTable } from './BonusSlotTable.js';
import { BonusStartButton } from './BonusStartButton.js';

/**
 * Initial bonus slot table pattern (matching reference)
 */
const INITIAL_BONUS_SLOT_TABLE = [
  ['LOTUS', 'LOTUS', 'FAN'],
  ['FAN', 'LOTUS', 'BAR'],
  ['BAR', 'LOTUS', 'DRAGON'],
  ['DRAGON', 'EIGHT', 'PIG'],
  ['EIGHT', 'PIG', 'YINYANG'],
];

/**
 * BonusSlot - Main bonus slot container
 */
export class BonusSlot extends Container {
  public bonusSlotTable: BonusSlotTable;
  public bonusStartButton: BonusStartButton;

  constructor(resolveTexture: TextureResolver, tweenService?: ITweenService) {
    super();

    // Create bonus slot table
    this.bonusSlotTable = new BonusSlotTable(INITIAL_BONUS_SLOT_TABLE, resolveTexture, tweenService);
    this.addChild(this.bonusSlotTable);

    // Create bonus start button
    this.bonusStartButton = new BonusStartButton(resolveTexture);
    this.bonusStartButton.interactive = true;
    this.bonusStartButton.onClick = () => {
      this.spin();
    };
    this.addChild(this.bonusStartButton);

    // Position button below table
    this.bonusStartButton.x = this.width / 2 - this.bonusStartButton.width / 2;
    this.bonusStartButton.y = this.bonusSlotTable.height + 30;
  }

  /**
   * Event when spin button click (matching reference: spin())
   */
  public spin(): void {
    // Play spin sound (matching reference)
    // this.audioBus?.play('BSReelStart', { channel: 'sfx' });

    this.bonusStartButton.updateButtonType(false);
    this.bonusStartButton.updateWinValue();
    this.bonusSlotTable.spin();
  }

  /**
   * Resize handler
   */
  resize(width: number, height: number): void {
    if (width > height) {
      // Landscape mode
      this.bonusStartButton.x = this.width / 2 - this.bonusStartButton.width / 2;
      this.bonusStartButton.y = this.bonusSlotTable.height + 30;
    } else {
      // Portrait mode - could adjust if needed
    }
  }

  override destroy(): void {
    this.bonusSlotTable.destroy();
    this.bonusStartButton.destroy();
    super.destroy({ children: true });
  }
}

