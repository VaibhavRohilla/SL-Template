import { Container, Sprite, Texture } from 'pixi.js';
import { UI_ASSETS } from '../AssetMap.js';

export class ReferenceFastPlayToggle extends Container {
    private mainSprite: Sprite;
    private textures: {
        on: Texture;
        off: Texture;
    };

    private _isToggled: boolean = false;
    public onToggle?: (isToggled: boolean) => void;

    constructor(resolver: (key: string) => Texture) {
        super();

        this.textures = {
            on: resolver(UI_ASSETS.TURBO_BTN.ON),
            off: resolver(UI_ASSETS.TURBO_BTN.OFF),
        };

        this.mainSprite = new Sprite(this.textures.off);
        this.mainSprite.anchor.set(0.5);
        this.addChild(this.mainSprite);

        this.eventMode = 'static';
        this.cursor = 'pointer';

        this.on('pointerdown', () => this.toggle());
    }

    public toggle(force?: boolean): void {
        this._isToggled = force !== undefined ? force : !this._isToggled;
        this.mainSprite.texture = this._isToggled ? this.textures.on : this.textures.off;
        this.onToggle?.(this._isToggled);
    }

    public get isToggled(): boolean {
        return this._isToggled;
    }
}
