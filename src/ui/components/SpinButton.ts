/**
 * Spin Button Component
 * 
 * Handles Normal, Auto, and Stop states.
 */

import { Container, Sprite, Graphics, Text, TextStyle } from 'pixi.js';
import type { TextureProvider } from '../types.js';
import { colors } from '../../game/BrandConfig.js';

export class SpinButton extends Container {
    private readonly resolveTexture: TextureProvider;

    private background!: Sprite;

    private labelText!: Text;

    private isEnabled = true;


    public onClick?: () => void;

    constructor(resolveTexture: TextureProvider) {
        super();
        this.resolveTexture = resolveTexture;

        this.createVisuals();
        this.setupInteraction();
    }

    private createVisuals(): void {
        // 1. Background (Circle)
        const texture = this.resolveTexture('spin'); // 'spin.png'

        if (texture) {
            this.background = new Sprite(texture);
            this.background.anchor.set(0.5);
        } else {
            // Fallback
            const g = new Graphics();
            g.circle(0, 0, 60);
            g.fill({ color: colors.success });
            g.stroke({ width: 4, color: 0xffffff });
            this.background = g as unknown as Sprite;
        }
        this.addChild(this.background);

        // 2. Icon (Loop arrow or something) - usually part of the texture in simple games
        // For now text overlay
        const style = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff,
            fontWeight: 'bold',
            dropShadow: true,
        });

        this.labelText = new Text({ text: 'SPIN', style });
        this.labelText.anchor.set(0.5);
        this.addChild(this.labelText);
    }

    private setupInteraction(): void {
        this.eventMode = 'static';
        this.cursor = 'pointer';

        this.on('pointerdown', () => {
            if (this.isEnabled) {
                this.scale.set(0.95);
            }
        });

        this.on('pointerup', () => {
            if (this.isEnabled) {
                this.scale.set(1.0);
                this.onClick?.();
            }
        });

        this.on('pointerupoutside', () => {
            this.scale.set(1.0);
        });

        // Hover effects could go here
    }

    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        this.alpha = enabled ? 1 : 0.6;
        this.cursor = enabled ? 'pointer' : 'default';
    }

    public setSpinningState(isSpinning: boolean): void {
        if (isSpinning) {
            this.labelText.text = 'STOP'; // Or empty if using skip capability
        } else {
            this.labelText.text = 'SPIN';
        }
    }
}
