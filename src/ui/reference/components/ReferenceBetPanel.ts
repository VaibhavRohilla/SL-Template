import { Container, Sprite, Texture } from 'pixi.js';
import { UI_ASSETS } from '../AssetMap.js';
import { ReferenceMeter } from './ReferenceMeters.js';

export class ReferenceBetPanel extends Container {
    private meter: ReferenceMeter;
    private minusBtn: Sprite;
    private plusBtn: Sprite;

    public onBetChange?: (delta: number) => void;

    constructor(resolver: (key: string) => Texture) {
        super();

        // Meter
        this.meter = new ReferenceMeter(
            resolver(UI_ASSETS.LABELS.BET),
            { fontSize: 40 }
        );
        this.meter.setLabelPosition(419, -40);
        this.meter.setValuePosition(330, 15);
        this.addChild(this.meter);

        // Minus Button
        this.minusBtn = new Sprite(resolver(UI_ASSETS.BET_CONTROLS.MINUS));
        this.minusBtn.anchor.set(0.5);
        this.minusBtn.position.set(300, -60);
        this.minusBtn.eventMode = 'static';
        this.minusBtn.cursor = 'pointer';
        this.minusBtn.on('pointerdown', () => this.onBetChange?.(-1));
        this.addChild(this.minusBtn);

        // Plus Button
        this.plusBtn = new Sprite(resolver(UI_ASSETS.BET_CONTROLS.PLUS));
        this.plusBtn.anchor.set(0.5);
        this.plusBtn.position.set(520, -60);
        this.plusBtn.eventMode = 'static';
        this.plusBtn.cursor = 'pointer';
        this.plusBtn.on('pointerdown', () => this.onBetChange?.(1));
        this.addChild(this.plusBtn);
    }

    public updateBet(formattedBet: string): void {
        this.meter.updateValue(formattedBet);
    }

    public setEnabled(enabled: boolean): void {
        this.minusBtn.eventMode = enabled ? 'static' : 'none';
        this.plusBtn.eventMode = enabled ? 'static' : 'none';
        this.minusBtn.alpha = enabled ? 1 : 0.5;
        this.plusBtn.alpha = enabled ? 1 : 0.5;
    }
}
