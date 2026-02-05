import { BaseOverlay } from './BaseOverlay.js';
import { TextStyle, Text } from 'pixi.js';

/**
 * Paytable Overlay
 * Displays symbol values and win lines
 */
export class Paytable extends BaseOverlay {
    constructor(width: number, height: number) {
        super(width, height, 'PAYTABLE');
        this.buildContent();
    }

    private buildContent(): void {
        // Placeholder content
        // In a real game, this would display symbols and their payouts

        const info = new Text({
            text: 'Detailed paytable information will go here.\n\n- Match 5 numbers to complete a line\n- Lines trigger Slingos\n- Jokers matching any in column\n- Super Jokers match any in grid',
            style: new TextStyle({
                fontFamily: 'Verdana, sans-serif',
                fontSize: 24,
                fill: '#eeeeee',
                align: 'center',
                wordWrap: true,
                wordWrapWidth: 800
            })
        });
        info.anchor.set(0.5);
        this.contentContainer.addChild(info);

        // TODO: Add actual symbol sprites and values
    }
}
