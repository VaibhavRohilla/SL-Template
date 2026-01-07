/**
 * StakeBox - Stake selection popup
 *
 * Matches reference: blingo_front/popups/GameScreen.ts StakeBox
 */

import { PIXI } from 'slot-frontend-engine';
const { Container, Graphics } = PIXI;

import { DESIGN_W, DESIGN_H } from '../../layout/DesignLayout.js';
import type { TextureResolver } from '../SlingoGrid.js';

/**
 * Stake multipliers (matching reference STAKE_MULTI)
 */
const STAKE_MULTI = [1, 2, 5, 10, 20, 50, 100, 250, 500, 1000];

/**
 * StakeBox - Stake selection popup
 */
export class StakeBox extends Container {
  public gradientBackground: PIXI.Graphics;
  public stakeButtons: Array<{ button: PIXI.Container; value: number }> = [];

  public onStakeSelected: ((stake: number) => void) | null = null;

  constructor(_resolveTexture: TextureResolver) {
    super();

    // Add Gradient Background
    this.gradientBackground = new Graphics();
    this.gradientBackground.rect(0, 0, DESIGN_W, DESIGN_H);
    this.gradientBackground.fill({ color: 0x180000, alpha: 0.7 });
    this.gradientBackground.eventMode = 'static';
    this.gradientBackground.cursor = 'pointer';
    this.gradientBackground.on('pointerdown', () => {
      this.hide();
    });
    this.addChild(this.gradientBackground);

    // Create stake buttons (simplified - would use SetStakeButton in real implementation)
    const minStake = 0.2; // Matching reference STAKE_MIN
    STAKE_MULTI.forEach((multi) => {
      const stakeValue = multi * minStake;
      // In real implementation, would use SetStakeButton component
      // For now, create placeholder
      const button = new Container();
      button.eventMode = 'static';
      button.cursor = 'pointer';
      button.on('pointerdown', () => {
        this.selectStake(stakeValue);
      });
      this.stakeButtons.push({ button, value: stakeValue });
      this.addChild(button);
    });

    this.visible = false;
  }

  /**
   * Select stake (matching reference: updateStake)
   */
  selectStake(stake: number): void {
    if (this.onStakeSelected) {
      this.onStakeSelected(stake);
    }
    this.hide();
  }

  /**
   * Show stake box
   */
  show(): void {
    this.visible = true;
  }

  /**
   * Hide stake box
   */
  hide(): void {
    this.visible = false;
  }

  override destroy(): void {
    super.destroy({ children: true });
  }
}

