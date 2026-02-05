/**
 * Bottom Panel Component
 * 
 * Displays:
 * - Spin Button (Center)
 * - Bet Controls (Left)
 * - Win Display (Right)
 * - Autoplay/Turbo Toggles (Sides)
 */

import { Container, Sprite, Graphics, Text, TextStyle } from 'pixi.js';
import type { TextureProvider } from '../types.js';
import { SpinButton } from './SpinButton.js';
import { colors } from '../../game/BrandConfig.js';

export class BottomPanel extends Container {
    private readonly resolveTexture: TextureProvider;
    private readonly layoutWidth: number;
    private readonly layoutHeight: number;

    public spinButton!: SpinButton;

    // Bet Controls
    private betMinus!: Sprite;
    private betPlus!: Sprite;
    private betValueText!: Text;

    // Win Display
    private winLabel!: Text;
    private winValueText!: Text;

    // Callbacks
    public onSpinClick?: () => void;
    public onBetChange?: (delta: number) => void;

    constructor(resolveTexture: TextureProvider, width: number, height = 150) {
        super();
        this.resolveTexture = resolveTexture;
        this.layoutWidth = width;
        this.layoutHeight = height;

        this.createBackground();
        this.createControls();
    }

    private createBackground(): void {
        // Semi-transparent gradient or solid
        const bg = new Graphics();
        bg.rect(0, 0, this.layoutWidth, this.layoutHeight);
        bg.fill({ color: 0x000000, alpha: 0.8 });
        this.addChild(bg);

        // Gold line at top
        const line = new Graphics();
        line.rect(0, 0, this.layoutWidth, 4);
        line.fill({ color: colors.primary });
        this.addChild(line);
    }

    private createControls(): void {
        const centerY = this.layoutHeight / 2;

        // 1. Spin Button (Center)
        this.spinButton = new SpinButton(this.resolveTexture);
        this.spinButton.x = this.layoutWidth / 2;
        this.spinButton.y = centerY - 20; // Slightly moved up to overlap top
        this.spinButton.onClick = () => this.onSpinClick?.();
        this.addChild(this.spinButton);

        // 2. Bet Controls (Left of Spin)
        this.createBetControls(this.layoutWidth / 2 - 300, centerY);

        // 3. Win Display (Right of Spin)
        this.createWinDisplay(this.layoutWidth / 2 + 300, centerY);
    }

    private createBetControls(x: number, y: number): void {
        const container = new Container();
        container.x = x;
        container.y = y;

        // Bet Label
        const labelStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 16,
            fill: colors.textSecondary,
        });
        const label = new Text({ text: 'TOTAL BET', style: labelStyle });
        label.anchor.set(0.5);
        label.y = -30;
        container.addChild(label);

        // Value
        const valueStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff,
            fontWeight: 'bold',
        });
        this.betValueText = new Text({ text: '$1.00', style: valueStyle });
        this.betValueText.anchor.set(0.5);
        container.addChild(this.betValueText);

        // Minus Button
        this.betMinus = this.createSimpleButton('-', -80, 0);
        this.betMinus.on('pointerdown', () => this.onBetChange?.(-1));
        container.addChild(this.betMinus);

        // Plus Button
        this.betPlus = this.createSimpleButton('+', 80, 0);
        this.betPlus.on('pointerdown', () => this.onBetChange?.(1));
        container.addChild(this.betPlus);

        this.addChild(container);
    }

    private createWinDisplay(x: number, y: number): void {
        const container = new Container();
        container.x = x;
        container.y = y;

        const labelStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 16,
            fill: colors.textSecondary,
        });
        this.winLabel = new Text({ text: 'WIN', style: labelStyle });
        this.winLabel.anchor.set(0.5);
        this.winLabel.y = -30;
        container.addChild(this.winLabel);

        const valueStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 32,
            fill: colors.success,
            fontWeight: 'bold',
        });
        this.winValueText = new Text({ text: '$0.00', style: valueStyle });
        this.winValueText.anchor.set(0.5);
        container.addChild(this.winValueText);

        this.addChild(container);
    }

    private createSimpleButton(text: string, x: number, y: number): Sprite {
        const g = new Graphics();
        g.circle(0, 0, 20);
        g.fill({ color: colors.primaryDark });
        g.stroke({ width: 2, color: colors.primary });

        const t = new Text({ text, style: { fill: 0xffffff, fontSize: 20, fontWeight: 'bold' } });
        t.anchor.set(0.5);
        g.addChild(t);

        const s = g as unknown as Sprite;
        s.x = x;
        s.y = y;
        s.eventMode = 'static';
        s.cursor = 'pointer';
        return s;
    }

    public updateBet(formattedBet: string): void {
        this.betValueText.text = formattedBet;
    }

    public updateWin(formattedWin: string): void {
        this.winValueText.text = formattedWin;
    }
}
