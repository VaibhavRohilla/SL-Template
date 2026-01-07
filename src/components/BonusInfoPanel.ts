/**
 * BonusInfoPanel - Left Panel Win Progress Display
 *
 * Shows the Slingo win progress (3 matches → Full House).
 * 11 boxes stacked vertically with blingo labels and bonus symbols.
 *
 * Reference: blingo_front/ui/GameScreen/BonusInfo/BonusInfoBox.ts
 * Uses actual game assets
 */

import { PIXI } from 'slot-frontend-engine';
const { Container, Sprite, Text, TextStyle } = PIXI;

import { BONUS_INFO_COUNT, BONUS_INFO_GAP } from '../layout/DesignLayout.js';

/**
 * Texture resolver function type
 */
export type TextureResolver = (key: string) => PIXI.Texture | null;

/**
 * Bonus symbol keys mapping to texture keys (matching reference BONUS_INFO config)
 */
const BONUS_SYMBOLS = [
  'symbol_amulet_dragon', // index 0 (11 blingo - FULL HOUSE)
  'symbol_amulet_eight', // index 1 (10 blingo)
  'symbol_amulet_pig', // index 2 (9 blingo)
  'symbol_eight', // index 3 (8 blingo)
  'symbol_pig', // index 4 (7 blingo)
  'symbol_yinyang', // index 5 (6 blingo)
  'symbol_bar', // index 6 (5 blingo)
  'symbol_lotus', // index 7 (4 blingo)
  'symbol_fan', // index 8 (3 blingo)
  'symbol_arrow', // index 9 (2 blingo - not typically shown)
  'symbol_arrow', // index 10 (1 blingo - not typically shown)
];

/**
 * Single bonus info box (matching reference BonusInfoBox)
 */
export class BonusInfoBox extends Container {
  public readonly index: number;

  // Sprites
  private bonusInfoBackground: PIXI.Sprite | null = null;
  private bonusInfoCoverBackground: PIXI.Sprite | null = null;
  private bonusInfoLabel: PIXI.Sprite | null = null;
  private bonusInfoImage: PIXI.Sprite | null = null;
  private winSpinLabel: PIXI.Text | null = null;

  private isActive = false;

  constructor(index: number, resolveTexture: TextureResolver) {
    super();
    this.index = index;

    // ===== BACKGROUND (bonus_info_box.png) =====
    const boxTexture = resolveTexture('bonus/bonus_info_box');
    if (boxTexture) {
      this.bonusInfoBackground = new Sprite(boxTexture);
      this.bonusInfoBackground.anchor.set(0.5);
      this.addChild(this.bonusInfoBackground);
      this.bonusInfoBackground.x = this.bonusInfoBackground.width / 2;
      this.bonusInfoBackground.y = this.bonusInfoBackground.height / 2;
    }

    // ===== BLINGO LABEL (1_blingo to 11_blingo) =====
    // Index 0 = 11_blingo (full house), index 10 = 1_blingo
    const blingoNum = 11 - index;
    const blingoLabelTexture = resolveTexture(`bonus/${blingoNum}_blingo`);
    if (blingoLabelTexture && this.bonusInfoBackground) {
      this.bonusInfoLabel = new Sprite(blingoLabelTexture);
      this.bonusInfoLabel.anchor.set(0.5);
      // Position like reference: (width - 70) / 2
      this.bonusInfoLabel.x = (this.bonusInfoBackground.width - 70) / 2;
      this.bonusInfoLabel.y = this.bonusInfoBackground.height / 2;
      this.addChild(this.bonusInfoLabel);
    }

    // ===== BONUS SYMBOL IMAGE =====
    const symbolKey = BONUS_SYMBOLS[index];
    if (symbolKey && this.bonusInfoBackground) {
      const symbolTexture = resolveTexture(`bonus/${symbolKey}`);
      if (symbolTexture) {
        this.bonusInfoImage = new Sprite(symbolTexture);
        this.bonusInfoImage.anchor.set(0.5);
        // Position like reference: right side of box
        const offsetX = index < 3 ? 18 : -5;
        this.bonusInfoImage.x =
          this.bonusInfoBackground.width - this.bonusInfoImage.width / 2 + offsetX;
        this.bonusInfoImage.y = this.bonusInfoBackground.height / 2;
        this.addChild(this.bonusInfoImage);
      }
    }

    // ===== WIN SPIN LABEL (for index < 9, which means 3-10 blingo) =====
    if (index < 9 && this.bonusInfoBackground && this.bonusInfoImage) {
      const winSpinStyle = new TextStyle({
        fontFamily: 'Gang, Arial, sans-serif',
        fontSize: 15,
        fill: 0xffffff,
      });
      this.winSpinLabel = new Text({ text: 'WIN SPIN', style: winSpinStyle });
      this.winSpinLabel.anchor.set(0.5);
      this.winSpinLabel.x = this.bonusInfoImage.x + 1;
      this.winSpinLabel.y = this.bonusInfoBackground.height / 2 + 18;
      this.addChild(this.winSpinLabel);
    }

    // ===== COVER BACKGROUND (bonus_info_cover.png) - hidden by default =====
    const coverTexture = resolveTexture('bonus/bonus_info_cover');
    if (coverTexture && this.bonusInfoBackground) {
      this.bonusInfoCoverBackground = new Sprite(coverTexture);
      this.bonusInfoCoverBackground.anchor.set(0.5);
      this.bonusInfoCoverBackground.x = this.bonusInfoBackground.width / 2;
      this.bonusInfoCoverBackground.y = this.bonusInfoBackground.height / 2;
      this.bonusInfoCoverBackground.visible = false;
      this.addChild(this.bonusInfoCoverBackground);
    }
  }

  /**
   * Update win state (shows/hides cover)
   */
  updateWinState(isActive: boolean): void {
    this.isActive = isActive;
    if (this.bonusInfoCoverBackground) {
      this.bonusInfoCoverBackground.visible = isActive;
    }
  }

  /**
   * Get win state
   */
  getWinState(): boolean {
    return this.isActive;
  }

  /**
   * Set active (alias for updateWinState)
   */
  setActive(active: boolean): void {
    this.updateWinState(active);
  }

  /**
   * Get active state
   */
  getActive(): boolean {
    return this.isActive;
  }
}

/**
 * BonusInfoPanel - Container for all bonus info boxes
 */
export class BonusInfoPanel extends Container {
  public readonly boxes: BonusInfoBox[] = [];
  private readonly resolveTexture: TextureResolver;

  constructor(resolveTexture: TextureResolver) {
    super();
    this.label = 'BonusInfoPanel';
    this.resolveTexture = resolveTexture;
    this.createBoxes();
  }

  /**
   * Create all bonus info boxes
   */
  private createBoxes(): void {
    for (let i = 0; i < BONUS_INFO_COUNT; i++) {
      const box = new BonusInfoBox(i, this.resolveTexture);

      // Position vertically
      box.x = 0;
      box.y = i * (70 + BONUS_INFO_GAP); // Box height (~70) + gap

      this.boxes.push(box);
      this.addChild(box);
    }
  }

  /**
   * Update win progress based on number of matches
   * @param winNumber Number of slingos achieved (3-11, where 11 = full house)
   */
  updateWinProgress(winNumber: number): void {
    for (let i = 0; i < BONUS_INFO_COUNT; i++) {
      // Box at index 0 represents 11 blingo, index 10 represents 1 blingo
      const threshold = 11 - i;
      const shouldBeActive = winNumber >= threshold;
      this.boxes[i]?.setActive(shouldBeActive);
    }
  }

  /**
   * Reset all boxes to inactive
   */
  reset(): void {
    for (const box of this.boxes) {
      box.setActive(false);
    }
  }

  /**
   * Cleanup
   */
  override destroy(): void {
    this.boxes.forEach((box) => box.destroy({ children: true }));
    this.boxes.length = 0;
    super.destroy({ children: true });
  }
}

export default BonusInfoPanel;
