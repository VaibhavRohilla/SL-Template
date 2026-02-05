

import { Container, Graphics, Text, TextStyle } from "pixi.js";

/**
 * Big Win Overlay
 * Celebration screen for large wins
 */
export class BigWin extends Container {
    private background: Graphics;
    private winText: Text;
    private amountText: Text;

    constructor(width: number, height: number) {
        super();

        // Semi-transparent darker background to focus attention
        this.background = new Graphics();
        this.background.rect(0, 0, width, height);
        this.background.fill({ color: 0x000000, alpha: 0.7 });
        this.background.eventMode = 'static'; // Block clicks
        this.addChild(this.background);

        // "BIG WIN" Label
        this.winText = new Text({
            text: 'BIG WIN!',
            style: new TextStyle({
                fontFamily: 'Verdana, sans-serif',
                fontSize: 80,
                fontWeight: 'bold',
                fill: [0xffd700, 0xff8c00], // Gold gradient
                stroke: { color: 0x000000, width: 6 },
                dropShadow: {
                    alpha: 0.5,
                    angle: 45,
                    blur: 10,
                    distance: 5,
                    color: 0x000000,
                },
            })
        });
        this.winText.anchor.set(0.5);
        this.winText.position.set(width / 2, height / 2 - 50);
        this.addChild(this.winText);

        // Amount Label
        this.amountText = new Text({
            text: '0.00',
            style: new TextStyle({
                fontFamily: 'Verdana, sans-serif',
                fontSize: 60,
                fontWeight: 'bold',
                fill: '#ffffff',
                stroke: { color: 0x000000, width: 4 },
            })
        });
        this.amountText.anchor.set(0.5);
        this.amountText.position.set(width / 2, height / 2 + 50);
        this.addChild(this.amountText);

        // Tap to close
        this.background.on('pointertap', () => this.hide());

        this.visible = false;
        this.alpha = 0;
    }

    public show(amount: number): void {
        this.amountText.text = amount.toFixed(2);
        this.visible = true;
        this.alpha = 1;

        // Reset scale for pop effect
        this.winText.scale.set(0.1);

        // Simple animation tick
        let tick = 0;
        const animate = () => {
            if (!this.visible) return;
            tick += 0.05;

            // Scale up pop
            if (this.winText.scale.x < 1) {
                this.winText.scale.x += 0.1;
                this.winText.scale.y += 0.1;
            }

            // Pulse
            const s = 1 + Math.sin(tick * 5) * 0.05;
            this.amountText.scale.set(s);

            requestAnimationFrame(animate);
        };
        animate();
    }

    public hide(): void {
        this.visible = false;
        this.alpha = 0;
    }
}
