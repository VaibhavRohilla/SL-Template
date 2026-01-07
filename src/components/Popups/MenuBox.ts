/**
 * MenuBox - Menu/settings popup
 *
 * Matches reference: blingo_front/popups/GameScreen.ts MenuBox
 */

import { PIXI } from 'slot-frontend-engine';
const { Container, Sprite, Graphics, Rectangle, Text, TextStyle } = PIXI;

import { DESIGN_W, DESIGN_H } from '../../layout/DesignLayout.js';
import type { TextureResolver } from '../SlingoGrid.js';

/**
 * MenuBox - Menu/settings popup
 */
export class MenuBox extends Container {
  public gradientBackground: PIXI.Graphics;
  public background: PIXI.Sprite;
  public closeButton: PIXI.Sprite;
  public gameInfoButton: PIXI.Text;
  public optionButton: PIXI.Text;

  public menuBoxState: boolean = true; // true = GameInfo, false = Options
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

    // Add Background (Popup/Setting/info_menu)
    const backgroundTexture = resolveTexture('info_menu');
    this.background = new Sprite(backgroundTexture ?? undefined);
    this.background.anchor.set(0.5);
    this.background.x = DESIGN_W / 2;
    this.background.y = DESIGN_H / 2;
    this.addChild(this.background);

    // Add Close Button (Popup/Setting/close_button)
    const closeButtonTexture = resolveTexture('close_button');
    this.closeButton = new Sprite(closeButtonTexture ?? undefined);
    this.closeButton.anchor.set(0.5);
    this.closeButton.eventMode = 'static';
    this.closeButton.cursor = 'pointer';
    this.closeButton.hitArea = new Rectangle(
      -1.5 * (this.closeButton.width ?? 0),
      -1.5 * (this.closeButton.height ?? 0),
      2.5 * (this.closeButton.width ?? 0),
      2.5 * (this.closeButton.height ?? 0),
    );
    this.closeButton.x = DESIGN_W / 2 + (this.background.width ?? 0) / 2 - (this.closeButton.width ?? 0) - 17;
    this.closeButton.y = DESIGN_H / 2 - (this.background.height ?? 0) / 2 + (this.closeButton.height ?? 0) + 8;
    this.closeButton.on('pointerdown', () => {
      if (this.onClose) {
        this.onClose();
      }
    });
    this.addChild(this.closeButton);

    // Add Game Info Button
    const gameInfoStyle = new TextStyle({
      fontFamily: 'Roboto, Arial, sans-serif',
      fontSize: 21,
      fill: 0xff0054,
      fontWeight: '400',
      letterSpacing: 2.5,
    });
    this.gameInfoButton = new Text({ text: 'GAME INFO', style: gameInfoStyle });
    this.gameInfoButton.eventMode = 'static';
    this.gameInfoButton.cursor = 'pointer';
    this.gameInfoButton.hitArea = new Rectangle(
      -(this.background.width ?? 0) * 0.225,
      -1.5 * (this.gameInfoButton.height ?? 0),
      (this.background.width ?? 0) * 0.45,
      2.5 * (this.gameInfoButton.height ?? 0),
    );
    this.gameInfoButton.x = this.background.x - (this.gameInfoButton.width ?? 0) / 4 - ((this.background.width ?? 0) * 0.45) / 2;
    this.gameInfoButton.y = this.background.y - (this.background.height ?? 0) / 2 + (this.gameInfoButton.height ?? 0) / 2 + 20;
    this.addChild(this.gameInfoButton);

    // Add Option Button
    const optionStyle = new TextStyle({
      fontFamily: 'Roboto, Arial, sans-serif',
      fontSize: 21,
      fill: 0xff0054,
      fontWeight: '400',
      letterSpacing: 2.5,
    });
    this.optionButton = new Text({ text: 'OPTIONS', style: optionStyle });
    this.optionButton.eventMode = 'static';
    this.optionButton.cursor = 'pointer';
    this.optionButton.hitArea = new Rectangle(
      -(this.background.width ?? 0) * 0.225,
      -1.5 * (this.optionButton.height ?? 0),
      (this.background.width ?? 0) * 0.45,
      2.5 * (this.optionButton.height ?? 0),
    );
    this.optionButton.x = this.background.x + (this.optionButton.width ?? 0) / 4 + ((this.background.width ?? 0) * 0.45) / 2;
    this.optionButton.y = this.background.y - (this.background.height ?? 0) / 2 + (this.optionButton.height ?? 0) / 2 + 20;
    this.addChild(this.optionButton);

    this.visible = false;
  }

  /**
   * Show menu box
   */
  show(): void {
    this.visible = true;
  }

  /**
   * Hide menu box
   */
  hide(): void {
    this.visible = false;
  }

  override destroy(): void {
    super.destroy({ children: true });
  }
}

