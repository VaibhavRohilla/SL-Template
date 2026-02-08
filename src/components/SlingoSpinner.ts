/**
 * SlingoSpinner - 1-Row Horizontal Spinner with Real Spinning Animation
 *
 * Features:
 * - Always visible cells
 * - Real vertical scrolling animation
 * - Uses actual symbol sprites
 * - Match animations with yellow star effect and dragon animation
 *
 * Reference: blingo_front/ui/GameScreen/GameTable/GameSpinReel.ts
 * Reference: blingo_front/ui/GameScreen/GameTable/GameSpinSymbol.ts
 */

import { Container, Graphics, Sprite, AnimatedSprite, BitmapText, Text, TextStyle, BlurFilter, Texture } from 'pixi.js';
import { slotConfig } from '../config/slotConfig.js';
import { type ITweenService } from '@fnx/sl-engine';

import type { TextureResolver } from './SlingoGrid.js';

import { SPINNER_REELS, SYMBOL_W, SYMBOL_H, SYMBOL_GAP_H } from '../layout/DesignLayout.js';

// Reel speed matching reference config
const REEL_SPEED = 0.2;

/**
 * Available symbol types for the spinner
 */
export type SpinnerSymbolType =
  | 'number'
  | 'joker'
  | 'super_joker'
  | 'free_spin'
  | 'coin'
  | 'devil'
  | 'dragon';

/**
 * Spinner result for a single reel
 */
export interface SpinnerReelResult {
  type: SpinnerSymbolType;
  value?: number;
}

/**
 * Symbol texture keys for different types
 */
const SYMBOL_TEXTURES: Record<string, string> = {
  devil: 'symbols/SCATTER', // Placeholder mapping
  dragon: 'symbols/WILD',
  coin: 'symbols/Gold_Piggy',
  free_spin: 'symbols/SCATTER',
  joker: 'symbols/Rose_Gold_Piggy',
  super_joker: 'symbols/Gold_Piggy',
  sym_41: 'symbols/A',
  sym_42: 'symbols/K',
  sym_43: 'symbols/Q',
  sym_44: 'symbols/J',
  sym_45: 'symbols/10',
  sym_46: 'symbols/9',
  sym_51: 'symbols/Rose_Gold_Piggy',
  sym_52: 'symbols/Gold_Piggy',
  sym_53: 'symbols/Silver_Piggy',
  sym_54: 'symbols/Bronze_Piggy',
  sym_90: 'symbols/WILD',
  sym_91: 'symbols/SCATTER',
};

/**
 * Single spinner reel with real spinning animation and match effects
 */
export class SlingoReel extends Container {
  public readonly index: number;

  // Cell background - always visible
  private cellSprite: Sprite;
  private matchedBackground: Sprite | null = null;

  // Two reel containers for seamless scrolling
  private reelA: Container;
  private reelB: Container;
  private isReelAActive = true;

  // Mask for clipping
  private reelMask: Graphics;

  // Match effect sprites
  private yellowStar: Sprite | null = null;
  private yellowStarDouble: Sprite | null = null;
  private greenStar: Sprite | null = null;
  private greenStarDouble: Sprite | null = null;
  private dragonAnimation: AnimatedSprite | null = null;

  // Current symbol display
  private currentSymbol: Container | null = null;

  // Animation state
  public isSpinning = false;
  private spinSpeed = 0;
  private targetResult: SpinnerReelResult | null = null;
  private stopRequested = false;
  private isMatched = false;
  private randomSpeed: number;

  private readonly resolveTexture: TextureResolver;
  private readonly tweenService: ITweenService | null;

  constructor(index: number, resolveTexture: TextureResolver, tweenService?: ITweenService) {
    super();
    this.index = index;
    this.resolveTexture = resolveTexture;
    this.tweenService = tweenService ?? null;
    this.label = `SlingoReel_${index}`;

    // Enable z-ordering for proper layering (required for zIndex to work)
    this.sortableChildren = true;

    this.randomSpeed = Math.random() * 100;

    // ===== CELL BACKGROUND - Visible when stopped (matching reference) =====
    // Reference: gameSpinSymbolBackground.alpha = 0 initially, becomes visible when stopped
    const cellTexture = resolveTexture('GameTable/Common/cell');
    this.cellSprite = new Sprite(cellTexture ?? undefined);
    this.cellSprite.anchor.set(0.5);
    this.cellSprite.x = SYMBOL_W / 2;
    this.cellSprite.y = SYMBOL_H / 2;
    this.cellSprite.alpha = 1; // Hidden initially (matching reference alpha = 0)
    this.cellSprite.visible = true; // But visible (will fade in when stopped)
    this.addChild(this.cellSprite);

    // ===== MATCHED BACKGROUND (red_cell.png) =====
    const redCellTexture = resolveTexture('GameTable/Common/red_cell');
    if (redCellTexture) {
      this.matchedBackground = new Sprite(redCellTexture);
      this.matchedBackground.anchor.set(0.5);
      this.matchedBackground.x = SYMBOL_W / 2;
      this.matchedBackground.y = SYMBOL_H / 2;
      this.matchedBackground.visible = false;
      this.addChild(this.matchedBackground);
    }

    // ===== YELLOW STAR (matched effect) =====
    const yellowStarTexture = resolveTexture('GameTable/Common/yellow_star');
    if (yellowStarTexture) {
      this.yellowStar = new Sprite(yellowStarTexture);
      this.yellowStar.anchor.set(0.5);
      this.yellowStar.x = SYMBOL_W / 2;
      this.yellowStar.y = SYMBOL_H / 2;
      this.yellowStar.alpha = 0.8 + ((Math.random() * 10) % 3) / 10;
      this.yellowStar.scale.set(0.8 + ((Math.random() * 10) % 3) / 10);
      this.yellowStar.blendMode = 'screen';
      this.yellowStar.visible = false;
      this.addChild(this.yellowStar);

      this.yellowStarDouble = new Sprite(yellowStarTexture);
      this.yellowStarDouble.anchor.set(0.5);
      this.yellowStarDouble.x = SYMBOL_W / 2;
      this.yellowStarDouble.y = SYMBOL_H / 2;
      this.yellowStarDouble.alpha = 0.8 + ((Math.random() * 10) % 3) / 10;
      this.yellowStarDouble.scale.set(0.8 + ((Math.random() * 10) % 3) / 10);
      this.yellowStarDouble.blendMode = 'screen';
      this.yellowStarDouble.visible = false;
      this.addChild(this.yellowStarDouble);
    }

    // ===== GREEN STAR (choosed effect for jokers) =====
    const greenStarTexture = resolveTexture('GameTable/Common/green_star');
    if (greenStarTexture) {
      this.greenStar = new Sprite(greenStarTexture);
      this.greenStar.anchor.set(0.5);
      this.greenStar.x = SYMBOL_W / 2;
      this.greenStar.y = SYMBOL_H / 2;
      this.greenStar.alpha = 0.8 + ((Math.random() * 10) % 3) / 10;
      this.greenStar.scale.set(0.8 + ((Math.random() * 10) % 3) / 10);
      this.greenStar.blendMode = 'screen';
      this.greenStar.visible = false;
      this.addChild(this.greenStar);

      this.greenStarDouble = new Sprite(greenStarTexture);
      this.greenStarDouble.anchor.set(0.5);
      this.greenStarDouble.x = SYMBOL_W / 2;
      this.greenStarDouble.y = SYMBOL_H / 2;
      this.greenStarDouble.alpha = 0.8 + ((Math.random() * 10) % 3) / 10;
      this.greenStarDouble.scale.set(0.8 + ((Math.random() * 10) % 3) / 10);
      this.greenStarDouble.blendMode = 'screen';
      this.greenStarDouble.visible = false;
      this.addChild(this.greenStarDouble);
    }

    // ===== DRAGON ANIMATION =====
    const textureArray: Texture[] = [];
    for (let i = 1; i <= 16; i++) {
      const tex = resolveTexture(`GameTable/Table/dragon_appear/appear_${i}`);
      if (tex) {
        textureArray.push(tex);
      }
    }
    if (textureArray.length === 16) {
      this.dragonAnimation = new AnimatedSprite(textureArray);
      this.dragonAnimation.anchor.set(0.5);
      this.dragonAnimation.x = SYMBOL_W / 2;
      this.dragonAnimation.y = SYMBOL_H / 2;
      this.dragonAnimation.animationSpeed = 0.4;
      this.dragonAnimation.loop = false;
      this.dragonAnimation.visible = false;
      this.addChild(this.dragonAnimation);
    }

    // ===== REEL CONTAINERS for scrolling =====
    this.reelA = new Container();
    this.reelA.label = 'ReelA';

    this.reelB = new Container();
    this.reelB.label = 'ReelB';
    this.reelB.y = -SYMBOL_H;

    // ===== MASK for clipping =====
    this.reelMask = new Graphics();
    this.reelMask.rect(0, 0, SYMBOL_W, SYMBOL_H);
    this.reelMask.fill({ color: 0xffffff });

    // Create a mask container
    const maskContainer = new Container();
    maskContainer.addChild(this.reelA);
    maskContainer.addChild(this.reelB);
    maskContainer.mask = this.reelMask;
    this.addChild(maskContainer);
    this.addChild(this.reelMask);

    // Initialize with empty symbol
    this.initializeReel();
  }

  /**
   * Initialize reel with a random symbol
   */
  private initializeReel(): void {
    // Initialize with clear symbol (no blur) when not spinning
    const symbol = this.createRandomSymbol(false);
    symbol.x = 0;
    symbol.y = 0;
    symbol.visible = true;
    symbol.filters = []; // Ensure no blur
    this.reelA.addChild(symbol);
    this.currentSymbol = symbol;
  }

  /**
   * Create a random symbol for spinning (matching reference addNewRandomSymbol)
   * Reference shows RANDOM NUMBERS (0-59) during spin, not symbols
   * @param applyBlur - Whether to apply blur filter (only during active spinning)
   */
  private createRandomSymbol(applyBlur: boolean = false): Container {
    const container = new Container();

    // Matching reference: random = Math.floor((Math.random() * 100) % 60)
    // Shows random NUMBERS (0-59) during spin, not symbols
    const random = Math.floor((Math.random() * 100) % 60);

    // Create BitmapText for number (matching reference updateSpinSymbol with type='number')
    const text = new BitmapText({
      text: random.toString(),
      style: {
        fontFamily: 'Dragon Gold',
        fontSize: 90,
        align: 'center',
      },
    });
    text.anchor.set(0.5);
    text.x = SYMBOL_W / 2;
    text.y = SYMBOL_H / 2;
    container.addChild(text);

    // Add blur filter ONLY during active spinning (matching reference)
    // When spinner is stopped/initialized, no blur should be applied
    // Reference uses blur: 15, but reducing slightly for better visibility
    if (applyBlur) {
      const blurFilter = new BlurFilter();
      blurFilter.strength = 4; // Use strength instead of blur (PIXI v8.3+)
      container.filters = [blurFilter];
    }

    return container;
  }

  /**
   * Create symbol from result (matching reference updateSpinSymbol)
   * Handles: numbers, image sprites (D), and animated sprites (FS, PG, J, RJ, SJ)
   */
  private createSymbolFromResult(result: SpinnerReelResult): Container {
    const container = new Container();
    // Ensure container is visible and has no filters initially
    container.visible = true;
    container.alpha = 1;
    container.filters = []; // No blur on final symbols

    if (result.type === 'number' && result.value !== undefined) {
      // Number display with BitmapText (matching reference type='number')
      const text = new BitmapText({
        text: result.value.toString(),
        style: {
          fontFamily: 'Dragon Gold',
          fontSize: 90,
          align: 'center',
        },
      });
      text.anchor.set(0.5);
      text.x = SYMBOL_W / 2;
      text.y = SYMBOL_H / 2;
      text.visible = true;
      text.alpha = 1;
      container.addChild(text);
    } else if (result.type === 'dragon' || result.value === 90) {
      // Dragon (Wild) symbol
      const symbol = slotConfig.symbols.find(s => s.id === (result.value ?? 90));
      const spriteKey = symbol?.spriteKey || 'symbols/WILD';
      const texture = this.resolveTexture(spriteKey);
      if (texture) {
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.x = SYMBOL_W / 2;
        sprite.y = SYMBOL_H / 2;
        container.addChild(sprite);
      }
    } else {
      // Special symbols - animated sprite (matching reference type='animation' for FS, PG, J, RJ, SJ)
      // Reference: 'GameTable/Spin/' + data + '/' + data + '_' + (i + 1)
      // Map our types to reference keys: FS, PG, J, RJ, SJ
      const symbolKeyMap: Record<string, string> = {
        'free_spin': 'FS',
        'super_joker': 'PG', // Purple Gem
        'joker': 'J',
        'devil': 'RJ', // Red Joker
        'coin': 'SJ', // Super Joker
      };
      const symbolKey = symbolKeyMap[result.type] ?? result.type.toUpperCase();
      const textureArray: Texture[] = [];

      for (let i = 1; i <= 16; i++) {
        const textureKey = `GameTable/Spin/${symbolKey}/${symbolKey}_${i}`;
        const texture = this.resolveTexture(textureKey);
        if (texture) {
          textureArray.push(texture);
        }
      }

      if (textureArray.length === 16) {
        const animatedSprite = new AnimatedSprite(textureArray);
        animatedSprite.anchor.set(0, 0); // Use top-left anchor for positioning (matching reference)
        // Position matching reference: x = width/2 - sprite.width/2, y = height/2 - sprite.height/2
        const bgCenterX = SYMBOL_W / 2;
        const bgCenterY = SYMBOL_H / 2;
        animatedSprite.x = bgCenterX - animatedSprite.width / 2;
        animatedSprite.y = bgCenterY - animatedSprite.height / 2;
        animatedSprite.animationSpeed = 0.4; // Matching reference
        animatedSprite.loop = true;
        animatedSprite.visible = true;
        animatedSprite.alpha = 1;
        animatedSprite.play();
        container.addChild(animatedSprite);

        // Show green stars for joker symbols (matching reference)
        if (result.type !== 'free_spin' && result.type !== 'super_joker') {
          // J, RJ show green stars
          if (this.greenStar) this.greenStar.visible = true;
          if (this.greenStarDouble) this.greenStarDouble.visible = true;
          if (this.yellowStar) this.yellowStar.visible = false;
          if (this.yellowStarDouble) this.yellowStarDouble.visible = false;
        }

        console.log(`SlingoReel ${this.index}: Animated symbol created - type=${result.type}, key=${symbolKey}, x=${animatedSprite.x}, y=${animatedSprite.y}, width=${animatedSprite.width}, height=${animatedSprite.height}`);
      } else {
        console.warn(`SlingoReel ${this.index}: Animated symbol textures not found - type=${result.type}, key=${symbolKey}, loaded=${textureArray.length}/16`);
        // Fallback: try single sprite
        const textureKey = SYMBOL_TEXTURES[result.type] ?? 'BAR';
        const texture = this.resolveTexture(textureKey);
        if (texture) {
          const sprite = new Sprite(texture);
          sprite.anchor.set(0.5);
          sprite.x = SYMBOL_W / 2;
          sprite.y = SYMBOL_H / 2;
          const scale = Math.min(
            (SYMBOL_W * 0.7) / sprite.texture.width,
            (SYMBOL_H * 0.7) / sprite.texture.height,
          );
          sprite.scale.set(scale);
          container.addChild(sprite);
        }
      }
    }

    this.currentSymbol = container;
    return container;
  }

  /**
   * Start spinning
   */
  startSpin(): void {
    this.isSpinning = true;
    this.stopRequested = false;
    this.targetResult = null;
    this.spinSpeed = 20;
    this.isMatched = false;

    // Hide cell background during spin (matching reference - alpha = 0 during spin)
    this.cellSprite.alpha = 1;
    // Hide effects
    if (this.matchedBackground) this.matchedBackground.visible = false;
    if (this.yellowStar) this.yellowStar.visible = false;
    if (this.yellowStarDouble) this.yellowStarDouble.visible = false;
    if (this.greenStar) this.greenStar.visible = false;
    if (this.greenStarDouble) this.greenStarDouble.visible = false;
    if (this.dragonAnimation) this.dragonAnimation.visible = false;

    // Clear old symbols
    this.reelA.removeChildren();
    this.reelB.removeChildren();
    this.reelA.y = 0;
    this.reelB.y = -SYMBOL_H;

    // Add initial spinning symbols with blur (during active spin)
    const symbolA = this.createRandomSymbol(true);
    this.reelA.addChild(symbolA);

    const symbolB = this.createRandomSymbol(true);
    this.reelB.addChild(symbolB);

    this.isReelAActive = true;
  }

  /**
   * Request stop with specific result
   */
  requestStop(result: SpinnerReelResult): void {
    this.targetResult = result;
    this.stopRequested = true;
  }

  /**
   * Force stop immediately
   */
  forceStop(): void {
    this.isSpinning = false;
    this.spinSpeed = 0;
  }

  /**
   * Set result directly without animation (shows cell background)
   */
  setResult(result: SpinnerReelResult): void {
    this.isSpinning = false;
    this.stopRequested = false;

    // Show cell background (matching reference - background becomes visible when stopped)
    this.cellSprite.alpha = 1;
    this.cellSprite.visible = true;

    // Clear and set final symbol
    this.reelA.removeChildren();
    this.reelB.removeChildren();
    this.reelA.y = 0;
    this.reelB.y = -SYMBOL_H;

    const finalSymbol = this.createSymbolFromResult(result);
    // Remove any blur filters (matching reference - no blur on result)
    finalSymbol.filters = [];
    // Position symbol at (0, 0) in reel container (matching reference)
    finalSymbol.x = 0;
    finalSymbol.y = 0;
    finalSymbol.visible = true; // Ensure symbol is visible
    this.reelA.addChild(finalSymbol);

    // Store current symbol for later use
    this.currentSymbol = finalSymbol;
  }

  /**
   * Update matched text style (before full match animation)
   * Called when a number matches but before the full animation
   */
  updateMatchedText(): void {
    // IMPORTANT: Text must remain visible and clear (no blur)
    // Remove any blur filters from the symbol
    if (this.currentSymbol) {
      this.currentSymbol.filters = [];

      // Change font to Dragon Deep for matched numbers
      const text = this.currentSymbol.children.find(
        (child) => child instanceof BitmapText,
      ) as BitmapText | undefined;
      if (text) {
        text.style.fontFamily = 'Dragon Deep';
        text.visible = true; // Ensure text is visible
        text.alpha = 1; // Ensure text is fully opaque
      }
    }

    // Show yellow star effect scaling up
    if (this.yellowStar && this.tweenService) {
      this.yellowStar.scale.set(0);
      this.yellowStar.visible = true;

      const scaleTween = { x: 0, y: 0 };
      const durationMs = REEL_SPEED * 1.5 * 1000;
      this.tweenService
        .to(scaleTween, { x: 1, y: 1 }, {
          duration: durationMs,
          easing: 'linear',
          onUpdate: () => {
            if (this.yellowStar) {
              this.yellowStar.scale.set(scaleTween.x, scaleTween.y);
            }
          },
        })
        .promise.catch(() => {
          // Ignore errors
        });
    }
  }

  /**
   * Play full match animation (like reference updateMatchedState)
   * Matching reference: text fades out AFTER yellow star scales up and dragon animation plays
   */
  playMatchAnimation(): void {
    if (this.isMatched) return;
    this.isMatched = true;

    // Remove any blur filters - text must be clear
    if (this.currentSymbol) {
      this.currentSymbol.filters = [];
    }

    // Show matched background with alpha 0 (will animate to 1)
    if (this.matchedBackground) {
      this.matchedBackground.alpha = 1;
      this.matchedBackground.visible = true;
    }

    // Show yellow star effects with scale = 0 (will animate to 1)
    if (this.yellowStar) {
      this.yellowStar.scale.set(0);
      this.yellowStar.visible = true;
    }
    if (this.yellowStarDouble) {
      this.yellowStarDouble.scale.set(1); // Double star stays at scale 1
      this.yellowStarDouble.visible = true;
    }

    // Hide green stars
    if (this.greenStar) this.greenStar.visible = false;
    if (this.greenStarDouble) this.greenStarDouble.visible = false;

    // Change label font and ensure text is visible initially
    if (this.currentSymbol) {
      const text = this.currentSymbol.children.find(
        (child) => child instanceof BitmapText,
      ) as BitmapText | undefined;
      if (text) {
        text.style.fontFamily = 'Dragon Deep';
        text.visible = true; // Ensure text is visible
        text.alpha = 1; // Start fully opaque (will fade out later)
      }
    }

    // TweenService animation (matching reference exactly)
    if (!this.tweenService) return;

    const durationMs = REEL_SPEED * 1.5 * 1000; // REEL_SPEED * 1.5 in milliseconds

    // Animate yellow star scale from 0 to 1 (matching reference)
    // Reference: yellow star scales up first, THEN dragon animation appears in onComplete
    if (this.yellowStar) {
      const scaleTween = { x: 0, y: 0 };
      this.tweenService
        .to(scaleTween, { x: 1, y: 1 }, {
          duration: durationMs,
          easing: 'linear',
          onUpdate: () => {
            if (this.yellowStar) {
              this.yellowStar.scale.set(scaleTween.x, scaleTween.y);
            }
          },
          onComplete: () => {
            // Show and play dragon animation AFTER yellow star scales (matching reference)
            // Reference: dragon animation appears in onComplete callback of yellow star scale
            if (this.dragonAnimation) {
              // Position matching reference (centered on background)
              const bgCenterX = SYMBOL_W / 2;
              const bgCenterY = SYMBOL_H / 2;
              this.dragonAnimation.anchor.set(0, 0);
              this.dragonAnimation.x = bgCenterX - this.dragonAnimation.width / 2;
              this.dragonAnimation.y = bgCenterY - this.dragonAnimation.height / 2;
              this.dragonAnimation.visible = true;
              this.dragonAnimation.zIndex = 100; // Highest z-index (increased for visibility)
              this.dragonAnimation.animationSpeed = 0.4; // Matching reference
              this.dragonAnimation.loop = false; // Matching reference
              this.dragonAnimation.gotoAndPlay(0);
              this.dragonAnimation.play();

              // Debug log to verify animation is showing
              console.log(`SlingoReel ${this.index}: Dragon animation playing - visible=${this.dragonAnimation.visible}, zIndex=${this.dragonAnimation.zIndex}, width=${this.dragonAnimation.width}, height=${this.dragonAnimation.height}`);
            } else {
              console.warn(`SlingoReel ${this.index}: Dragon animation not available - animation was not created`);
            }
          },
        })
        .promise.catch(() => {
          // Ignore errors
        });
    }

    // Animate text alpha to 0 (in parallel)
    if (this.currentSymbol) {
      const text = this.currentSymbol.children.find(
        (child) => child instanceof BitmapText,
      ) as BitmapText | undefined;
      if (text) {
        const textTween = { alpha: text.alpha };
        this.tweenService
          .to(textTween, { alpha: 0 }, {
            duration: durationMs,
            easing: 'linear',
            onUpdate: () => {
              if (text) {
                text.alpha = textTween.alpha;
              }
            },
            onComplete: () => {
              text.visible = false;
              if (this.yellowStar) this.yellowStar.visible = false;
            },
          })
          .promise.catch(() => {
            // Ignore errors
          });
      }
    }

    // Animate matched background alpha to 1 (in parallel)
    if (this.matchedBackground) {
      const bgTween = { alpha: this.matchedBackground.alpha };
      this.tweenService
        .to(bgTween, { alpha: 1 }, {
          duration: durationMs,
          easing: 'linear',
          onUpdate: () => {
            if (this.matchedBackground) {
              this.matchedBackground.alpha = bgTween.alpha;
            }
          },
        })
        .promise.catch(() => {
          // Ignore errors
        });
    }
  }

  /**
   * Set choosed state (for jokers)
   */
  setChoosed(isChoosed: boolean): void {
    if (this.greenStar) this.greenStar.visible = isChoosed;
    if (this.greenStarDouble) this.greenStarDouble.visible = isChoosed;
    if (this.yellowStar) this.yellowStar.visible = false;
  }

  /**
   * Update purple state (when purple gem appears)
   * Matching reference: updatePurpleState()
   */
  updatePurpleState(): void {
    if (!this.resolveTexture || !this.tweenService) return;

    // Create purple gem effect (green star sprite)
    const pgTexture = this.resolveTexture('GameTable/Common/green_star');
    if (!pgTexture) return;

    const pgSprite = new Sprite(pgTexture);
    pgSprite.anchor.set(0.5);
    pgSprite.x = SYMBOL_W / 2;
    pgSprite.y = SYMBOL_H / 2;
    pgSprite.zIndex = 5;
    pgSprite.alpha = 0;
    this.addChild(pgSprite);

    // Animate fade in and out
    const fadeProxy = { alpha: pgSprite.alpha };
    this.tweenService
      .to(fadeProxy, { alpha: 1 }, {
        duration: 500,
        easing: 'linear',
        onUpdate: () => {
          pgSprite.alpha = fadeProxy.alpha;
        },
      })
      .promise.then(() => {
        // Fade out
        this.tweenService
          ?.to(fadeProxy, { alpha: 0 }, {
            duration: 500,
            easing: 'linear',
            onUpdate: () => {
              pgSprite.alpha = fadeProxy.alpha;
            },
            onComplete: () => {
              if (pgSprite.parent) {
                pgSprite.parent.removeChild(pgSprite);
              }
              pgSprite.destroy();
            },
          })
          .promise.catch(() => {
            // Ignore errors
          });
      })
      .catch(() => {
        // Ignore errors
      });
  }

  /**
   * Update (call each frame for animation)
   */
  updateReel(deltaMs: number): void {
    // Rotate stars
    if (this.yellowStar && this.yellowStar.visible) {
      this.yellowStar.rotation += Math.PI / (600 + this.randomSpeed);
    }
    if (this.yellowStarDouble && this.yellowStarDouble.visible) {
      this.yellowStarDouble.rotation += Math.PI / (300 + this.randomSpeed);
    }
    if (this.greenStar && this.greenStar.visible) {
      this.greenStar.rotation += Math.PI / (600 + this.randomSpeed);
    }
    if (this.greenStarDouble && this.greenStarDouble.visible) {
      this.greenStarDouble.rotation += Math.PI / (300 + this.randomSpeed);
    }

    if (!this.isSpinning) return;

    const movement = this.spinSpeed * (deltaMs / 16.67);

    // Move both reel containers down
    this.reelA.y += movement;
    this.reelB.y += movement;

    // Check if active reel has scrolled out of view
    const activeReel = this.isReelAActive ? this.reelA : this.reelB;
    const nextReel = this.isReelAActive ? this.reelB : this.reelA;

    if (activeReel.y >= SYMBOL_H) {
      // Active reel scrolled out - swap
      activeReel.y = nextReel.y - SYMBOL_H;
      activeReel.removeChildren();

      if (this.stopRequested && this.targetResult) {
        // Add final symbol and stop (matching reference dolastAction)
        const finalSymbol = this.createSymbolFromResult(this.targetResult);
        // Remove blur filter from final symbol (matching reference - no blur on result)
        finalSymbol.filters = [];
        // Position symbol at (0, 0) in reel container (matching reference)
        finalSymbol.x = 0;
        finalSymbol.y = 0;
        finalSymbol.visible = true; // Ensure symbol is visible
        finalSymbol.alpha = 1; // Ensure fully opaque
        activeReel.addChild(finalSymbol);

        // Debug: Log symbol creation
        console.log(`SlingoReel ${this.index}: Final symbol created - type=${this.targetResult.type}, visible=${finalSymbol.visible}, alpha=${finalSymbol.alpha}, children=${finalSymbol.children.length}`);

        // Snap to position (matching reference)
        nextReel.y = 0;
        activeReel.y = -SYMBOL_H;

        // Fade in cell background when stopped (matching reference)
        // Reference: background alpha transitions from 0 to 1 when symbol stops
        if (this.tweenService) {
          const bgTween = { alpha: this.cellSprite.alpha };
          this.tweenService
            .to(bgTween, { alpha: 1 }, {
              duration: REEL_SPEED * 0.75 * 1000, // Matching reference duration
              easing: 'linear',
              onUpdate: () => {
                this.cellSprite.alpha = bgTween.alpha;
              },
            })
            .promise.catch(() => {
              // Ignore errors
            });
        } else {
          // Fallback: show immediately if no tween service
          this.cellSprite.alpha = 1;
        }
        this.cellSprite.visible = true;

        // Store current symbol for later use
        this.currentSymbol = finalSymbol;

        this.isSpinning = false;
        this.stopRequested = false;
        this.targetResult = null;
      } else {
        // Add random symbol with blur and continue (during active spinning)
        const newSymbol = this.createRandomSymbol(true);
        activeReel.addChild(newSymbol);
        this.isReelAActive = !this.isReelAActive;
      }
    }
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.isSpinning = false;
    this.stopRequested = false;
    this.targetResult = null;
    this.spinSpeed = 0;
    this.isMatched = false;
    this.currentSymbol = null;

    // Hide cell background (matching reference - alpha = 0 when reset)
    this.cellSprite.alpha = 1;

    // Hide effects
    if (this.matchedBackground) this.matchedBackground.visible = false;
    if (this.yellowStar) this.yellowStar.visible = false;
    if (this.yellowStarDouble) this.yellowStarDouble.visible = false;
    if (this.greenStar) this.greenStar.visible = false;
    if (this.greenStarDouble) this.greenStarDouble.visible = false;
    if (this.dragonAnimation) this.dragonAnimation.visible = false;

    this.reelA.removeChildren();
    this.reelB.removeChildren();
    this.reelA.y = 0;
    this.reelB.y = -SYMBOL_H;

    // Initialize with clear symbol (no blur) when not spinning
    const symbol = this.createRandomSymbol(false);
    symbol.x = 0;
    symbol.y = 0;
    symbol.visible = true;
    symbol.filters = []; // Ensure no blur
    this.reelA.addChild(symbol);
    this.currentSymbol = symbol;
  }

  /**
   * Cleanup
   */
  override destroy(): void {
    super.destroy({ children: true });
  }
}

/**
 * SlingoSpinner - The horizontal spinner container
 */
export class SlingoSpinner extends Container {
  public readonly reels: SlingoReel[] = [];

  private _isSpinning = false;
  private readonly resolveTexture: TextureResolver;
  private readonly tweenService: ITweenService | undefined;

  // Callbacks
  public onAllReelsStopped: (() => void) | null = null;
  public onReelStopped: ((reelIndex: number, result: SpinnerReelResult) => void) | null = null;

  private stoppedCount = 0;
  private pendingResults: (SpinnerReelResult | null)[] = [];

  constructor(resolveTexture: TextureResolver, tweenService?: ITweenService) {
    super();
    this.label = 'SlingoSpinner';
    this.resolveTexture = resolveTexture;
    this.tweenService = tweenService;

    this.createReels();
  }

  /**
   * Create the 5 spinner reels
   */
  private createReels(): void {
    for (let i = 0; i < SPINNER_REELS; i++) {
      const reel = new SlingoReel(i, this.resolveTexture, this.tweenService);
      // Matching reference: singleBonusSlotReel.x = index * (singleBonusSlotReel.width + 9)
      reel.x = i * (reel.width + SYMBOL_GAP_H);
      reel.y = 0;
      this.reels.push(reel);
      this.addChild(reel);
    }
  }

  /**
   * Start all reels spinning
   */
  startSpin(): void {
    this._isSpinning = true;
    this.stoppedCount = 0;
    this.pendingResults = new Array(SPINNER_REELS).fill(null);

    for (const reel of this.reels) {
      reel.startSpin();
    }
  }

  /**
   * Stop reels with results (staggered, matching reference timing)
   */
  stopWithResults(results: SpinnerReelResult[], staggerMs: number = 150): void {
    if (results.length !== SPINNER_REELS) {
      console.warn('SlingoSpinner: Results length must match reel count');
      return;
    }

    this.pendingResults = [...results];

    // Stagger the stops (matching reference 150ms between each)
    results.forEach((result, i) => {
      setTimeout(() => {
        const reel = this.reels[i];
        if (reel) {
          reel.requestStop(result);
        }
      }, i * staggerMs);
    });
  }

  /**
   * Set results directly (no spin animation)
   */
  setResults(results: SpinnerReelResult[]): void {
    results.forEach((result, i) => {
      const reel = this.reels[i];
      if (reel) {
        reel.setResult(result);
      }
    });
  }

  /**
   * Mark a reel as matched (shows yellow star + dragon animation)
   */
  markReelMatched(reelIndex: number): void {
    const reel = this.reels[reelIndex];
    if (reel) {
      reel.playMatchAnimation();
    }
  }

  /**
   * Update matched text for a reel (before full animation)
   */
  updateMatchedText(reelIndex: number): void {
    const reel = this.reels[reelIndex];
    if (reel) {
      reel.updateMatchedText();
    }
  }

  /**
   * Set reel as choosed (for joker selection)
   */
  setReelChoosed(reelIndex: number, isChoosed: boolean): void {
    const reel = this.reels[reelIndex];
    if (reel) {
      reel.setChoosed(isChoosed);
    }
  }

  /**
   * Update purple state for a reel (when purple gem appears)
   * Matching reference: updatePurpleState()
   */
  updatePurpleState(reelIndex: number): void {
    const reel = this.reels[reelIndex];
    if (reel) {
      reel.updatePurpleState();
    }
  }

  /**
   * Show purple win font animation (when 3+ purple gems appear)
   * Matching reference: showPurpleWinFont()
   */
  showPurpleWinFont(purpleGemIndexes: number[], stake: number): void {
    if (purpleGemIndexes.length < 3 || !this.tweenService) return;

    // Create purple win label
    const winAmount = (stake / 2).toFixed(2);
    const purpleLabel = new Text({
      text: winAmount,
      style: new TextStyle({
        fontFamily: 'Gang, Arial, sans-serif',
        fontSize: 90,
        fill: 0xffffff,
        stroke: { color: 0x2b811c, width: 2 }, // Green stroke matching reference
      }),
    });
    purpleLabel.anchor.set(0.5);

    // Position at first purple gem reel
    const firstReelIndex = purpleGemIndexes[0] ?? 0;
    purpleLabel.x = firstReelIndex * (SYMBOL_W + SYMBOL_GAP_H) + SYMBOL_W / 2;
    purpleLabel.y = SYMBOL_H / 2;
    this.addChild(purpleLabel);

    const moveDuration = REEL_SPEED * 1.5 * 1000; // REEL_SPEED * 1.5 in ms

    // Animate to second purple gem
    const secondReelIndex = purpleGemIndexes[1] ?? firstReelIndex;
    const secondX = secondReelIndex * (SYMBOL_W + SYMBOL_GAP_H) + SYMBOL_W / 2;

    const tween1 = { x: purpleLabel.x };
    this.tweenService
      .to(tween1, { x: secondX }, {
        duration: moveDuration,
        easing: 'linear',
        onUpdate: () => {
          purpleLabel.x = tween1.x;
        },
      })
      .promise.then(() => {
        // Animate to third purple gem
        const thirdReelIndex = purpleGemIndexes[2] ?? secondReelIndex;
        const thirdX = thirdReelIndex * (SYMBOL_W + SYMBOL_GAP_H) + SYMBOL_W / 2;

        const tween2 = { x: purpleLabel.x };
        this.tweenService
          ?.to(tween2, { x: thirdX }, {
            duration: moveDuration,
            easing: 'linear',
            onUpdate: () => {
              purpleLabel.x = tween2.x;
            },
          })
          .promise.then(() => {
            // Hold at third position, then remove
            setTimeout(() => {
              if (purpleLabel.parent) {
                purpleLabel.parent.removeChild(purpleLabel);
              }
              purpleLabel.destroy();
            }, moveDuration);
          })
          .catch(() => {
            // Ignore errors
          });
      })
      .catch(() => {
        // Ignore errors
      });
  }

  /**
   * Force stop all reels
   */
  forceStopAll(): void {
    for (const reel of this.reels) {
      reel.forceStop();
    }
    this._isSpinning = false;
  }

  /**
   * Update (call each frame)
   */
  update(deltaMs: number): void {
    let allStopped = true;

    for (let i = 0; i < this.reels.length; i++) {
      const reel = this.reels[i];
      if (!reel) continue;

      const wasSpinning = reel.isSpinning;
      reel.updateReel(deltaMs);
      const nowSpinning = reel.isSpinning;

      // Check if this reel just stopped
      if (wasSpinning && !nowSpinning) {
        this.stoppedCount++;
        const result = this.pendingResults[i];
        if (result) {
          this.onReelStopped?.(i, result);
        }
      }

      if (nowSpinning) {
        allStopped = false;
      }
    }

    if (allStopped && this._isSpinning) {
      this._isSpinning = false;
      this.onAllReelsStopped?.();
    }
  }


  /**
   * Reset spinner to initial state
   */
  reset(): void {
    this._isSpinning = false;
    this.stoppedCount = 0;
    this.pendingResults = [];

    for (const reel of this.reels) {
      reel.reset();
    }
  }

  /**
   * Cleanup
   */
  override destroy(): void {
    this.reels.forEach((reel) => reel.destroy());
    this.reels.length = 0;
    super.destroy({ children: true });
  }
}

export default SlingoSpinner;
