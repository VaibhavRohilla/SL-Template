/**
 * BonusStartButton - Start button for bonus slot
 *
 * Matches reference: blingo_front/ui/Common/Buttons.ts BonusStartButton
 */

import { PIXI } from 'slot-frontend-engine';
const { Container, Sprite, Text, TextStyle } = PIXI;

import type { TextureResolver } from '../SlingoGrid.js';

/**
 * BonusStartButton - Button to start bonus slot spin
 */
export class BonusStartButton extends Container {
  public background: PIXI.Sprite;
  public buttonType: boolean = true; // true = START, false = WIN
  public startLabel: PIXI.Text;
  public winLabel: PIXI.Text;
  public winValueLabel: PIXI.Text;

  public onClick: (() => void) | null = null;

  constructor(resolveTexture: TextureResolver) {
    super();

    // Add Background Image (GameTable/Spin/green_button)
    const backgroundTexture = resolveTexture('GameTable/Spin/green_button');
    this.background = new Sprite(backgroundTexture ?? undefined);
    this.background.anchor.set(0.5);
    this.addChild(this.background);
    this.background.x = this.background.width / 2;
    this.background.y = this.background.height / 2;

    // Start Label
    const startStyle = new TextStyle({
      fontFamily: 'Gang, Arial, sans-serif',
      fontSize: 48,
      fill: 0xffffff,
      fontWeight: 'bold',
      letterSpacing: 0.5,
      dropShadow: {
        angle: 90,
        color: '#000000',
        distance: 5,
      },
    });
    this.startLabel = new Text({ text: 'START BONUS', style: startStyle });
    this.startLabel.anchor.set(0.5);
    this.startLabel.x = this.background.width / 2;
    this.startLabel.y = this.background.height / 2;
    this.addChild(this.startLabel);

    // Win Label (hidden initially)
    const winStyle = new TextStyle({
      fontFamily: 'Gang, Arial, sans-serif',
      fontSize: 48,
      fill: 0xffffff,
      fontWeight: 'bold',
      letterSpacing: 0.5,
      dropShadow: {
        angle: 90,
        color: '#000000',
        distance: 5,
      },
    });
    this.winLabel = new Text({ text: 'WIN', style: winStyle });
    this.winLabel.anchor.set(0.5);
    this.winLabel.x = this.background.width / 2;
    this.winLabel.y = this.background.height / 2 - 20;
    this.winLabel.visible = false;
    this.addChild(this.winLabel);

    // Win Value Label (hidden initially)
    const winValueStyle = new TextStyle({
      fontFamily: 'Gang, Arial, sans-serif',
      fontSize: 48,
      fill: 0xffffff,
      fontWeight: 'bold',
      letterSpacing: 0.5,
      dropShadow: {
        angle: 90,
        color: '#000000',
        distance: 5,
      },
    });
    this.winValueLabel = new Text({ text: '0.00', style: winValueStyle });
    this.winValueLabel.anchor.set(0.5);
    this.winValueLabel.x = this.background.width / 2;
    this.winValueLabel.y = this.background.height / 2 + 20;
    this.winValueLabel.visible = false;
    this.addChild(this.winValueLabel);

    // Make interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', this.handleDown.bind(this));
    this.on('pointerup', this.handleUp.bind(this));
    this.on('pointerupoutside', this.handleUp.bind(this));
  }

  private handleDown(): void {
    // Could swap to click texture if available
  }

  private handleUp(): void {
    if (this.onClick) {
      this.onClick();
    }
  }

  /**
   * Update button type (matching reference: updateButtonType)
   */
  updateButtonType(type: boolean): void {
    this.buttonType = type;
    if (type) {
      // START mode
      this.startLabel.visible = true;
      this.winLabel.visible = false;
      this.winValueLabel.visible = false;
    } else {
      // WIN mode
      this.startLabel.visible = false;
      this.winLabel.visible = true;
      this.winValueLabel.visible = true;
    }
  }

  /**
   * Update win value (matching reference: updateWinValue)
   */
  updateWinValue(): void {
    // In real game, this would show the win amount
    this.winValueLabel.text = '0.00';
  }

  override destroy(): void {
    super.destroy({ children: true });
  }
}

