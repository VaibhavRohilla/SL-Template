/**
 * GameBottomBar - Bottom HUD Component
 *
 * Shows stake, status description, and balance.
 *
 * Reference: blingo_front/ui/GameScreen/GameBottom.ts
 * Uses game assets where available (bottom_shadowbar)
 */

import { PIXI } from 'slot-frontend-engine';
const { Container, Graphics, Sprite, Text, TextStyle } = PIXI;

import { DESIGN_W } from '../layout/DesignLayout.js';

/**
 * Texture resolver function type
 */
export type TextureResolver = (key: string) => PIXI.Texture | null;

/**
 * GameBottomBar - The bottom status/info bar
 */
export class GameBottomBar extends Container {
  private barSprite: PIXI.Sprite | null = null;
  private fallbackBg: PIXI.Graphics | null = null;

  // Stake section (left)
  private stakeLabel: PIXI.Text;
  private stakeValue: PIXI.Text;
  private stakeCurrency: PIXI.Text;

  // Description (center)
  private description: PIXI.Text;

  // Balance section (right)
  private balanceLabel: PIXI.Text;
  private balanceValue: PIXI.Text;
  private balanceCurrency: PIXI.Text;

  private currencyCode = 'USD';

  // Bar dimensions
  private static readonly BAR_H = 70;

  constructor(resolveTexture: TextureResolver) {
    super();
    this.label = 'GameBottomBar';

    // Try to use bottom_shadowbar texture
    const barTexture = resolveTexture('ui/bottom_shadowbar');

    if (barTexture) {
      this.barSprite = new Sprite(barTexture);
      this.barSprite.width = DESIGN_W;
      this.barSprite.height = GameBottomBar.BAR_H;
      this.addChild(this.barSprite);
    } else {
      // Fallback gradient bar
      this.fallbackBg = new Graphics();
      this.fallbackBg.rect(0, 0, DESIGN_W, GameBottomBar.BAR_H);
      this.fallbackBg.fill({ color: 0x000000, alpha: 0.7 });
      this.addChild(this.fallbackBg);
    }

    // === STAKE SECTION (Left) ===
    const labelStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fill: 0xffd700,
      letterSpacing: 1,
    });

    const valueStyle = new TextStyle({
      fontFamily: 'Dragon Gold, Arial, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xffffff,
    });

    this.stakeLabel = new Text({ text: 'TOTAL STAKED', style: labelStyle });
    this.stakeLabel.anchor.set(0, 0.5);
    this.stakeLabel.x = 15;
    this.stakeLabel.y = GameBottomBar.BAR_H / 2;
    this.addChild(this.stakeLabel);

    this.stakeValue = new Text({ text: '0.00', style: valueStyle });
    this.stakeValue.anchor.set(0, 0.5);
    this.stakeValue.x = this.stakeLabel.x + this.stakeLabel.width + 10;
    this.stakeValue.y = GameBottomBar.BAR_H / 2;
    this.addChild(this.stakeValue);

    this.stakeCurrency = new Text({ text: this.currencyCode, style: labelStyle });
    this.stakeCurrency.anchor.set(0, 0.5);
    this.stakeCurrency.x = this.stakeValue.x + this.stakeValue.width + 5;
    this.stakeCurrency.y = GameBottomBar.BAR_H / 2;
    this.addChild(this.stakeCurrency);

    // === DESCRIPTION (Center) ===
    const descStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 20,
      fill: 0xffffff,
      letterSpacing: 1.5,
    });

    this.description = new Text({ text: '', style: descStyle });
    this.description.anchor.set(0.5);
    this.description.x = DESIGN_W / 2;
    this.description.y = GameBottomBar.BAR_H / 2;
    this.addChild(this.description);

    // === BALANCE SECTION (Right) ===
    this.balanceCurrency = new Text({ text: this.currencyCode, style: labelStyle });
    this.balanceCurrency.anchor.set(1, 0.5);
    this.balanceCurrency.x = DESIGN_W - 15;
    this.balanceCurrency.y = GameBottomBar.BAR_H / 2;
    this.addChild(this.balanceCurrency);

    this.balanceValue = new Text({ text: '0.00', style: valueStyle });
    this.balanceValue.anchor.set(1, 0.5);
    this.balanceValue.x = this.balanceCurrency.x - this.balanceCurrency.width - 5;
    this.balanceValue.y = GameBottomBar.BAR_H / 2;
    this.addChild(this.balanceValue);

    this.balanceLabel = new Text({ text: 'BALANCE:', style: labelStyle });
    this.balanceLabel.anchor.set(1, 0.5);
    this.balanceLabel.x = this.balanceValue.x - this.balanceValue.width - 10;
    this.balanceLabel.y = GameBottomBar.BAR_H / 2;
    this.addChild(this.balanceLabel);
  }

  updateStake(amount: number): void {
    this.stakeValue.text = amount.toFixed(2);
    this.repositionStake();
  }

  updateBalance(amount: number): void {
    this.balanceValue.text = amount.toFixed(2);
    this.repositionBalance();
  }

  updateDescription(text: string): void {
    this.description.text = text;
  }

  setCurrency(code: string): void {
    this.currencyCode = code;
    this.stakeCurrency.text = code;
    this.balanceCurrency.text = code;
    this.repositionStake();
    this.repositionBalance();
  }

  private repositionStake(): void {
    this.stakeValue.x = this.stakeLabel.x + this.stakeLabel.width + 10;
    this.stakeCurrency.x = this.stakeValue.x + this.stakeValue.width + 5;
  }

  private repositionBalance(): void {
    this.balanceCurrency.x = DESIGN_W - 15;
    this.balanceValue.x = this.balanceCurrency.x - this.balanceCurrency.width - 5;
    this.balanceLabel.x = this.balanceValue.x - this.balanceValue.width - 10;
  }

  getHeight(): number {
    return GameBottomBar.BAR_H;
  }

  override destroy(): void {
    super.destroy({ children: true });
  }
}

export default GameBottomBar;
