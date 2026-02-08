import { Container, Text, TextStyle, Sprite } from 'pixi.js';
import { UI_ASSETS } from '../AssetMap.js';

export class ReferenceMeter extends Container {
    private labelSprite: Sprite | null = null;
    private valueText: Text;

    constructor(
        labelTexture: any,
        style: Partial<TextStyle>,
        initialValue: string = '$0.00'
    ) {
        super();

        if (labelTexture) {
            this.labelSprite = new Sprite(labelTexture);
            this.labelSprite.anchor.set(0.5);
            this.addChild(this.labelSprite);
        }

        const textStyle = new TextStyle({
            fontFamily: UI_ASSETS.FONTS.MAIN,
            fontSize: 40,
            fill: '#ffba08',
            align: 'center',
            ...style
        });

        this.valueText = new Text({ text: initialValue, style: textStyle });
        this.valueText.anchor.set(0.5);
        this.addChild(this.valueText);
    }

    public updateValue(formattedValue: string): void {
        this.valueText.text = formattedValue;
    }

    public setLabelPosition(x: number, y: number): void {
        if (this.labelSprite) {
            this.labelSprite.position.set(x, y);
        }
    }

    public setValuePosition(x: number, y: number): void {
        this.valueText.position.set(x, y);
    }
}

export class BalanceMeter extends ReferenceMeter {
    constructor(labelTexture: any) {
        super(labelTexture, { fontSize: 40 });
        // Specific offsets from consolePanelView.json
        this.setLabelPosition(385, -40);
        this.setValuePosition(350, 15);
    }
}

export class WinMeter extends ReferenceMeter {
    constructor(labelTexture: any) {
        super(labelTexture, { fontSize: 45 });
        // Specific offsets from consolePanelView.json
        this.setLabelPosition(740, 1020);
        this.setValuePosition(868, 1000);
    }
}
