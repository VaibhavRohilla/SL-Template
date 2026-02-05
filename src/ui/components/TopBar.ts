/**
 * Top Bar Component
 * 
 * Displays:
 * - Menu Button (Left)
 * - Balance Display (Center/Right)
 * - Sound Toggle (Right)
 */

import { Container, Sprite, Graphics, Text, TextStyle } from 'pixi.js';
import type { TextureProvider } from '../types.js';
import { colors } from '../../game/BrandConfig.js';

export class TopBar extends Container {
    private readonly resolveTexture: TextureProvider;
    private readonly layoutWidth: number;
    private readonly layoutHeight: number;

    private menuButton!: Sprite;
    private balanceContainer!: Container;
    private balanceText!: Text;
    private soundButton!: Graphics; // Placeholder until we have asset

    public onMenuClick?: () => void;
    public onSoundToggle?: (muted: boolean) => void;

    constructor(resolveTexture: TextureProvider, width: number, height = 60) {
        super();
        this.resolveTexture = resolveTexture;
        this.layoutWidth = width;
        this.layoutHeight = height;

        this.createBackground();
        this.createMenuButton();
        this.createBalanceDisplay();
        this.createSoundButton();
    }

    private createBackground(): void {
        // Semi-transparent black bar
        const bg = new Graphics();
        bg.rect(0, 0, this.layoutWidth, this.layoutHeight);
        bg.fill({ color: 0x000000, alpha: 0.5 });
        this.addChild(bg);
    }

    private createMenuButton(): void {
        const texture = this.resolveTexture('menu');

        if (texture) {
            this.menuButton = new Sprite(texture);
            this.menuButton.anchor.set(0.5);
            this.menuButton.scale.set(0.8); // Adjust scale to fit
        } else {
            // Fallback

            // Draw placeholder
            const g = new Graphics();
            g.circle(0, 0, 20);
            g.fill({ color: colors.primary });
            this.menuButton = g as unknown as Sprite; // Hack for placeholder
        }

        this.menuButton.x = 40;
        this.menuButton.y = this.layoutHeight / 2;
        this.menuButton.eventMode = 'static';
        this.menuButton.cursor = 'pointer';
        this.menuButton.on('pointerdown', () => this.onMenuClick?.());

        this.addChild(this.menuButton);
    }

    private createBalanceDisplay(): void {
        this.balanceContainer = new Container();

        // Label
        const labelStyle = new TextStyle({
            fontFamily: 'Arial', // Generic safe font
            fontSize: 14,
            fill: colors.textSecondary,
            fontWeight: 'bold',
        });

        const label = new Text({ text: 'BALANCE', style: labelStyle });
        label.anchor.set(1, 0.5);
        label.x = -10;
        this.balanceContainer.addChild(label);

        // Value
        const valueStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 20,
            fill: colors.textGold,
            fontWeight: 'bold',
        });

        this.balanceText = new Text({ text: '$1,000.00', style: valueStyle });
        this.balanceText.anchor.set(0, 0.5);
        this.balanceContainer.addChild(this.balanceText);

        // Position: Center-Rightish or Center
        this.balanceContainer.x = this.layoutWidth - 200;
        this.balanceContainer.y = this.layoutHeight / 2;

        this.addChild(this.balanceContainer);
    }

    private createSoundButton(): void {
        // Placeholder sound icon
        this.soundButton = new Graphics();
        this.soundButton.circle(0, 0, 15);
        this.soundButton.fill({ color: colors.textSecondary });

        this.soundButton.x = this.layoutWidth - 40;
        this.soundButton.y = this.layoutHeight / 2;
        this.soundButton.eventMode = 'static';
        this.soundButton.cursor = 'pointer';
        this.soundButton.on('pointerdown', () => {
            // Toggle logic handled by parent usually, or visual state here
            this.soundButton.alpha = this.soundButton.alpha === 1 ? 0.5 : 1;
            this.onSoundToggle?.(this.soundButton.alpha === 0.5);
        });

        this.addChild(this.soundButton);
    }

    public updateBalance(formattedBalance: string): void {
        if (this.balanceText) {
            this.balanceText.text = formattedBalance;
        }
    }
}
