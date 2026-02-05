
import { Paytable } from './Paytable.js';
import { BigWin } from './BigWin.js';
import { Container } from 'pixi.js';

/**
 * Overlay Manager
 * Handles creating and showing different game overlays
 */
export class OverlayManager {
    public readonly container: Container;

    private paytable: Paytable;
    private bigWin: BigWin;

    constructor(private width: number, private height: number) {
        this.container = new Container();
        this.container.label = 'OverlayManager';

        // Initialize overlays
        this.paytable = new Paytable(this.width, this.height);
        this.bigWin = new BigWin(this.width, this.height);

        // Add to container (order matters for stacking)
        this.container.addChild(this.paytable);
        this.container.addChild(this.bigWin);
    }

    public showPaytable(): void {
        this.paytable.show();
    }

    public showBigWin(amount: number): void {
        this.bigWin.show(amount);
    }

    public hideAll(): void {
        this.paytable.hide();
        this.bigWin.hide();
    }

    public resize(width: number, height: number): void {
        // TODO: Propagate resize to overlays
        this.width = width;
        this.height = height;
    }
}
