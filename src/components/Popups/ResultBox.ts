/**
 * ResultBox - Game result popup
 *
 * Matches reference: blingo_front/popups/GameScreen.ts ResultBox
 */

import { PIXI } from 'slot-frontend-engine';
const { Container, Sprite, Graphics, Text, TextStyle } = PIXI;

import { DESIGN_W, DESIGN_H } from '../../layout/DesignLayout.js';
import type { TextureResolver } from '../SlingoGrid.js';

/**
 * ResultBox - Game result popup
 */
export class ResultBox extends Container {
  public gradientBackground: PIXI.Graphics;
  public background: PIXI.Sprite;
  public resultLabel: PIXI.Text;
  public slotWinType: PIXI.Sprite;
  public slotWinTypeLabel: PIXI.Text;
  public slotWinAmount: PIXI.Text;
  public coinWin: PIXI.Sprite;
  public coinWinLabel: PIXI.Text;
  public coinWinAmount: PIXI.Text;
  public totalWinLabel: PIXI.Text;
  public totalWinAmount: PIXI.Text;

  public onClose: (() => void) | null = null;

  constructor(resolveTexture: TextureResolver) {
    super();

    // Add Gradient Background
    this.gradientBackground = new Graphics();
    this.gradientBackground.rect(0, 0, DESIGN_W, DESIGN_H);
    this.gradientBackground.fill({ color: 0x180000, alpha: 0.7 });
    this.gradientBackground.eventMode = 'static';
    this.gradientBackground.cursor = 'pointer';
    this.gradientBackground.on('pointerdown', () => {
      if (this.onClose) {
        this.onClose();
      }
    });
    this.addChild(this.gradientBackground);

    // Add Background (Popup/result_panel)
    const backgroundTexture = resolveTexture('result_panel');
    this.background = new Sprite(backgroundTexture ?? undefined);
    this.background.anchor.set(0.5);
    this.background.x = DESIGN_W / 2;
    this.background.y = DESIGN_H / 2;
    this.addChild(this.background);

    // Result Label
    const resultStyle = new TextStyle({
      fontFamily: 'Gang, Arial, sans-serif',
      fontSize: 48,
      fill: 0xffffff,
      letterSpacing: 0,
      dropShadow: {
        angle: 90,
        color: '#000000',
        distance: 4,
      },
    });
    this.resultLabel = new Text({ text: 'RESULT', style: resultStyle });
    this.resultLabel.x = (this.background.width ?? 0) / 2 + 2;
    this.resultLabel.y = 86;
    this.addChild(this.resultLabel);

    // Slot Win Type (simplified - would show symbol)
    const slotWinTypeTexture = resolveTexture('LOTUS');
    this.slotWinType = new Sprite(slotWinTypeTexture ?? undefined);
    this.slotWinType.anchor.set(0.5);
    this.slotWinType.scale.set(0.7);
    this.slotWinType.x = 259;
    this.slotWinType.y = 300;
    this.addChild(this.slotWinType);

    // Slot Win Type Label
    const slotWinTypeStyle = new TextStyle({
      fontFamily: 'Gang, Arial, sans-serif',
      fontSize: 32,
      fill: 0xffffff,
      letterSpacing: 0,
      dropShadow: {
        angle: 90,
        color: '#000000',
        distance: 5,
      },
    });
    this.slotWinTypeLabel = new Text({ text: '4 BLINGOS', style: slotWinTypeStyle });
    this.slotWinTypeLabel.x = this.slotWinType.x + ((this.slotWinType.width ?? 0) + (this.slotWinTypeLabel.width ?? 0)) / 2 + 6;
    this.slotWinTypeLabel.y = 300;
    this.addChild(this.slotWinTypeLabel);

    // Slot Win Amount
    const slotWinAmountStyle = new TextStyle({
      fontFamily: 'Gang, Arial, sans-serif',
      fontSize: 32,
      fill: 0xffffff,
    });
    this.slotWinAmount = new Text({ text: '20.00', style: slotWinAmountStyle });
    this.slotWinAmount.x = this.slotWinTypeLabel.x;
    this.slotWinAmount.y = this.slotWinTypeLabel.y + 40;
    this.addChild(this.slotWinAmount);

    // Coin Win (simplified)
    const coinWinTexture = resolveTexture('EIGHT');
    this.coinWin = new Sprite(coinWinTexture ?? undefined);
    this.coinWin.anchor.set(0.5);
    this.coinWin.scale.set(0.7);
    this.coinWin.x = 259;
    this.coinWin.y = 400;
    this.addChild(this.coinWin);

    // Coin Win Label
    const coinWinLabelStyle = new TextStyle({
      fontFamily: 'Gang, Arial, sans-serif',
      fontSize: 32,
      fill: 0xffffff,
    });
    this.coinWinLabel = new Text({ text: 'COIN WIN', style: coinWinLabelStyle });
    this.coinWinLabel.x = this.coinWin.x + ((this.coinWin.width ?? 0) + (this.coinWinLabel.width ?? 0)) / 2 + 6;
    this.coinWinLabel.y = 400;
    this.addChild(this.coinWinLabel);

    // Coin Win Amount
    this.coinWinAmount = new Text({ text: '0.00', style: coinWinLabelStyle });
    this.coinWinAmount.x = this.coinWinLabel.x;
    this.coinWinAmount.y = this.coinWinLabel.y + 40;
    this.addChild(this.coinWinAmount);

    // Total Win Label
    const totalWinStyle = new TextStyle({
      fontFamily: 'Gang, Arial, sans-serif',
      fontSize: 48,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    this.totalWinLabel = new Text({ text: 'TOTAL WIN', style: totalWinStyle });
    this.totalWinLabel.x = (this.background.width ?? 0) / 2;
    this.totalWinLabel.y = 500;
    this.addChild(this.totalWinLabel);

    // Total Win Amount
    this.totalWinAmount = new Text({ text: '0.00', style: totalWinStyle });
    this.totalWinAmount.x = (this.background.width ?? 0) / 2;
    this.totalWinAmount.y = 550;
    this.addChild(this.totalWinAmount);

    this.visible = false;
  }

  /**
   * Update result values
   */
  updateResult(slotWin: number, coinWin: number, totalWin: number): void {
    this.slotWinAmount.text = slotWin.toFixed(2);
    this.coinWinAmount.text = coinWin.toFixed(2);
    this.totalWinAmount.text = totalWin.toFixed(2);
  }

  /**
   * Show result box
   */
  show(): void {
    this.visible = true;
  }

  /**
   * Hide result box
   */
  hide(): void {
    this.visible = false;
  }

  override destroy(): void {
    super.destroy({ children: true });
  }
}

