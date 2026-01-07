/**
 * ExtraSymbols - Logo and Time Display Component
 *
 * Displays the dragon logo and current time (HH:MM AM/PM).
 * Matches reference: blingo_front/ui/GameScreen/ExtraSymbols.ts
 *
 * Logo position changes during bonus mode:
 * - Normal: x=75, y=864 (bottom left)
 * - Bonus: x=960-center, y=36 (top center)
 */

import { PIXI } from 'slot-frontend-engine';
const { Container, Sprite, Text, TextStyle } = PIXI;

import { DESIGN_W } from '../layout/DesignLayout.js';

/**
 * Texture resolver function type
 */
export type TextureResolver = (key: string) => PIXI.Texture | null;

/**
 * ExtraSymbols - Logo and time display
 */
export class ExtraSymbols extends Container {
  public logo: PIXI.Sprite;
  public timeLabel: PIXI.Text;
  public meridiem: PIXI.Text;

  private readonly resolveTexture: TextureResolver;
  private timeUpdateInterval: number | null = null;

  constructor(resolveTexture: TextureResolver) {
    super();
    this.label = 'ExtraSymbols';
    this.resolveTexture = resolveTexture;


    // Add Logo Image (matching reference: Extra/dragon_logo)
    const logoTexture = this.resolveTexture('ui/dragon_logo');
    if (!logoTexture) {
      console.warn('ExtraSymbols: dragon_logo texture not found');
    }
    this.logo = new Sprite(logoTexture ?? undefined);
    this.logo.x = 75; // Matching reference
    this.logo.y = 864; // Matching reference
    this.addChild(this.logo);

    // Get current time
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const isPM = parseInt(hours) >= 12;

    // Add Meridiem Label (AM/PM) - matching reference
    const meridiemStyle = new TextStyle({
      fontFamily: 'Roboto, Arial, sans-serif',
      fontSize: 16,
      fill: 0xffd800, // #ffd800
    });
    this.meridiem = new Text({ text: isPM ? 'PM' : 'AM', style: meridiemStyle });
    this.meridiem.x = 1899; // Matching reference
    this.meridiem.y = 20; // Matching reference
    this.addChild(this.meridiem);

    // Add Time Label (HH:MM) - matching reference
    const timeStyle = new TextStyle({
      fontFamily: 'Roboto, Arial, sans-serif',
      fontSize: 20,
      fill: 0xffffff,
      letterSpacing: 1.2,
    });
    this.timeLabel = new Text({ text: `${hours}:${minutes}`, style: timeStyle });
    // Position time label to the left of meridiem (matching reference)
    this.timeLabel.anchor.set(1, 0); // Right-aligned
    this.timeLabel.x = this.meridiem.x - this.meridiem.width / 2 - 5; // Small gap
    this.timeLabel.y = 18; // Matching reference
    this.addChild(this.timeLabel);

    // Update time every minute
    this.startTimeUpdate();
  }

  /**
   * Start time update interval (updates every minute)
   */
  private startTimeUpdate(): void {
    // Update immediately on next minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000;
    
    setTimeout(() => {
      this.updateTime();
      // Then update every minute
      this.timeUpdateInterval = window.setInterval(() => {
        this.updateTime();
      }, 60000); // 60 seconds
    }, msUntilNextMinute);
  }

  /**
   * Stop time update interval
   */
  private stopTimeUpdate(): void {
    if (this.timeUpdateInterval !== null) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  /**
   * Update state (normal vs bonus mode)
   * Matching reference: updateState(isBonus: boolean)
   */
  updateState(isBonus: boolean): void {
    if (isBonus) {
      // Bonus mode: center logo at top
      this.logo.x = DESIGN_W / 2 - this.logo.width / 2; // 960 - width/2
      this.logo.y = 36; // Matching reference
    } else {
      // Normal mode: logo at bottom left
      this.logo.x = 75; // Matching reference
      this.logo.y = 864; // Matching reference
    }
  }

  /**
   * Update time text (matching reference: updateTime())
   */
  updateTime(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const isPM = parseInt(hours) >= 12;

    // Update time label
    this.timeLabel.text = `${hours}:${minutes}`;
    
    // Reposition time label (width may have changed)
    this.timeLabel.x = this.meridiem.x - this.meridiem.width / 2 - 5;

    // Update meridiem
    this.meridiem.text = isPM ? 'PM' : 'AM';
  }

  /**
   * Resize handler (matching reference)
   */
  resize(width: number, height: number): void {
    // Reference implementation doesn't do anything special here
    // But we keep the method for API compatibility
    if (width > height) {
      // Landscape mode - keep current positions
    } else {
      // Portrait mode - could adjust if needed
    }
  }

  /**
   * Destroy and cleanup
   */
  override destroy(): void {
    this.stopTimeUpdate();
    super.destroy({ children: true });
  }
}

export default ExtraSymbols;

