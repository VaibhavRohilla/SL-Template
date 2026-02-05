/**
 * SlingoGrid - 5×5 Symbol Grid Component
 *
 * Implements the Slingo-style bingo grid with symbol sprites
 * that can be marked as matched when the spinner lands on them.
 * Now includes AnimatedSprite for dragon_appear animation on match.
 *
 * Uses actual game symbols: BAR, DRAGON, EIGHT, FAN, LOTUS, PIG, YINYANG
 */

import { type ITweenService } from 'slot-frontend-engine';

import {
  GRID_COLS,
  GRID_ROWS,
  SYMBOL_W,
  SYMBOL_H,
  SYMBOL_GAP_H,
  SYMBOL_GAP_V,
} from '../layout/DesignLayout.js';
import { AnimatedSprite, BitmapText, Container, Sprite, Texture } from 'pixi.js';

// Reel speed from config (matching reference)
const REEL_SPEED = 0.2;

/**
 * Texture resolver function type
 */
export type TextureResolver = (key: string) => Texture | null;

/**
 * Cell state
 */
export enum CellState {
  NORMAL = 'normal',
  SELECTABLE = 'selectable',
  MATCHED = 'matched',
}

/**
 * Available symbol types
 */
const SYMBOL_KEYS = ['BAR', 'DRAGON', 'EIGHT', 'FAN', 'LOTUS', 'PIG', 'YINYANG'] as const;
type SymbolKey = (typeof SYMBOL_KEYS)[number];

/**
 * Single grid cell with symbol sprite
 */
export class SlingoCell extends Container {
  public readonly index: number;
  public value: number = 0;
  public symbolValue: any = null; // Store the actual value (matching reference)
  public symbolKey: SymbolKey = 'BAR';
  public isMatched: boolean = false;
  public isChoosed: boolean = false;

  // Sprites
  public gameSymbolBackground: Sprite;
  public gameSymbolMatchedBackground: Sprite | null = null;
  public gameSymbolLabel: BitmapText | null = null;
  public gameSymbolChoosed: Sprite | null = null;
  public gameSymbolDoubleChoosed: Sprite | null = null;
  public gameSymbolMatchedEffect: Sprite | null = null;
  public gameSymbolDoubleMatchedEffect: Sprite | null = null;
  public gameSymbolMatchedAnimation: AnimatedSprite | null = null;

  private _state: CellState = CellState.NORMAL;
  private readonly resolveTexture: TextureResolver;
  private readonly tweenService: ITweenService | null;

  // Random speeds for star rotation
  private randomSpeed: number;
  private randomDoubleSpeed: number;

  constructor(index: number, resolveTexture: TextureResolver, tweenService?: ITweenService) {
    super();
    this.index = index;
    this.resolveTexture = resolveTexture;
    this.tweenService = tweenService ?? null;

    // Enable z-ordering for proper layering (required for zIndex to work)
    this.sortableChildren = true;

    // Set cell size to match reference (FancyButton default or background size)
    // Reference uses singleSymbol.width/height for positioning, so we need explicit size
    this.width = SYMBOL_W;
    this.height = SYMBOL_H;

    // Set random speeds
    this.randomSpeed = Math.random() * 200;
    this.randomDoubleSpeed = Math.random() * 200;

    // ===== CELL BACKGROUND (cell.png) =====
    const cellTexture = this.resolveTexture('GameTable/Common/cell');
    this.gameSymbolBackground = new Sprite(cellTexture ?? undefined);
    this.gameSymbolBackground.anchor.set(0.5);
    this.gameSymbolBackground.x = SYMBOL_W / 2;
    this.gameSymbolBackground.y = SYMBOL_H / 2;
    this.addChild(this.gameSymbolBackground);

    // ===== MATCHED BACKGROUND (red_cell.png) =====
    const redCellTexture = this.resolveTexture('GameTable/Common/red_cell');
    if (redCellTexture) {
      this.gameSymbolMatchedBackground = new Sprite(redCellTexture);
      this.gameSymbolMatchedBackground.anchor.set(0.5);
      this.gameSymbolMatchedBackground.x = SYMBOL_W / 2;
      this.gameSymbolMatchedBackground.y = SYMBOL_H / 2;
      this.gameSymbolMatchedBackground.visible = false;
      this.addChild(this.gameSymbolMatchedBackground);
    }

    // ===== GREEN STAR (selectable/choosed state) =====
    const greenStarTexture = this.resolveTexture('GameTable/Common/green_star');
    if (greenStarTexture) {
      this.gameSymbolChoosed = new Sprite(greenStarTexture);
      this.gameSymbolChoosed.anchor.set(0.5);
      this.gameSymbolChoosed.x = SYMBOL_W / 2;
      this.gameSymbolChoosed.y = SYMBOL_H / 2;
      this.gameSymbolChoosed.alpha = 0.8 + ((Math.random() * 10) % 3) / 10;
      this.gameSymbolChoosed.scale.set(0.8 + ((Math.random() * 10) % 3) / 10);
      this.gameSymbolChoosed.blendMode = 'screen';
      this.addChild(this.gameSymbolChoosed);
      this.gameSymbolChoosed.visible = false;

      // Double green star
      this.gameSymbolDoubleChoosed = new Sprite(greenStarTexture);
      this.gameSymbolDoubleChoosed.anchor.set(0.5);
      this.gameSymbolDoubleChoosed.x = SYMBOL_W / 2;
      this.gameSymbolDoubleChoosed.y = SYMBOL_H / 2;
      this.gameSymbolDoubleChoosed.alpha = 0.8 + ((Math.random() * 10) % 3) / 10;
      this.gameSymbolDoubleChoosed.scale.set(0.8 + ((Math.random() * 10) % 3) / 10);
      this.gameSymbolDoubleChoosed.blendMode = 'screen';
      this.addChild(this.gameSymbolDoubleChoosed);
      this.gameSymbolDoubleChoosed.visible = false;
    }

    // ===== YELLOW STAR (matched state) =====
    const yellowStarTexture = this.resolveTexture('GameTable/Common/yellow_star');
    if (yellowStarTexture) {
      this.gameSymbolMatchedEffect = new Sprite(yellowStarTexture);
      this.gameSymbolMatchedEffect.anchor.set(0.5);
      this.gameSymbolMatchedEffect.x = SYMBOL_W / 2;
      this.gameSymbolMatchedEffect.y = SYMBOL_H / 2;
      this.gameSymbolMatchedEffect.alpha = 0.8 + ((Math.random() * 10) % 3) / 10;
      this.gameSymbolMatchedEffect.scale.set(0.8 + ((Math.random() * 10) % 3) / 10);
      this.gameSymbolMatchedEffect.blendMode = 'screen';
      this.addChild(this.gameSymbolMatchedEffect);
      this.gameSymbolMatchedEffect.visible = false;

      // Double yellow star
      this.gameSymbolDoubleMatchedEffect = new Sprite(yellowStarTexture);
      this.gameSymbolDoubleMatchedEffect.anchor.set(0.5);
      this.gameSymbolDoubleMatchedEffect.x = SYMBOL_W / 2;
      this.gameSymbolDoubleMatchedEffect.y = SYMBOL_H / 2;
      this.gameSymbolDoubleMatchedEffect.alpha = 0.8 + ((Math.random() * 10) % 3) / 10;
      this.gameSymbolDoubleMatchedEffect.scale.set(0.8 + ((Math.random() * 10) % 3) / 10);
      this.gameSymbolDoubleMatchedEffect.blendMode = 'screen';
      this.addChild(this.gameSymbolDoubleMatchedEffect);
      this.gameSymbolDoubleMatchedEffect.visible = false;
    }

    // ===== DRAGON APPEAR ANIMATION =====
    // Matching reference: 'GameTable/Table/dragon_appear/appear_' + i
    const textureArray: Texture[] = [];
    for (let i = 1; i <= 16; i++) {
      const tex = this.resolveTexture(`GameTable/Table/dragon_appear/appear_${i}`);
      if (tex) {
        textureArray.push(tex);
      } else {
        console.warn(`SlingoCell: Dragon animation texture GameTable/Table/dragon_appear/appear_${i} not found`);
      }
    }
    if (textureArray.length === 16) {
      this.gameSymbolMatchedAnimation = new AnimatedSprite(textureArray);
      // Position matching reference (centered on background)
      // Reference uses: x = width/2 - animation.width/2, y = height/2 - animation.height/2
      // We'll position it when we show it (in playMatchAnimation) since we need the actual size
      this.gameSymbolMatchedAnimation.anchor.set(0.5);
      this.gameSymbolMatchedAnimation.x = SYMBOL_W / 2;
      this.gameSymbolMatchedAnimation.y = SYMBOL_H / 2;
      this.gameSymbolMatchedAnimation.animationSpeed = 0.75;
      this.gameSymbolMatchedAnimation.loop = false;
      this.gameSymbolMatchedAnimation.visible = false;
      this.gameSymbolMatchedAnimation.zIndex = 100; // Highest z-index to ensure it's on top (increased for visibility)
      this.addChild(this.gameSymbolMatchedAnimation);
      console.log(`SlingoCell ${this.index}: Dragon animation created successfully`);
    } else {
      console.warn(`SlingoCell ${this.index}: Dragon animation not created - only ${textureArray.length}/16 textures loaded`);
    }

    // ===== NUMBER LABEL (BitmapText) - displays numbers like reference =====
    this.gameSymbolLabel = new BitmapText({
      text: '',
      style: {
        fontFamily: 'Dragon Gold',
        fontSize: 90,
        align: 'center',
      },
    });
    this.gameSymbolLabel.anchor.set(0.5);
    this.gameSymbolLabel.x = SYMBOL_W / 2;
    this.gameSymbolLabel.y = SYMBOL_H / 2;
    this.addChild(this.gameSymbolLabel);
  }

  /**
   * Handle cell click (matching reference setSymbolMatched)
   * Only works if cell is choosed (green star) and not matched
   */
  private handleCellClick(): void {
    // Only allow clicking if cell is choosed (green star) and not matched
    // Yellow stars (matched effect) are NOT clickable
    if (this.isChoosed && !this.isMatched) {
      // Notify grid that this cell was clicked
      // The grid will handle removing all choosed states and calling API
      // Then play match animation
      if (this.parent instanceof SlingoGrid) {
        this.parent.handleCellClick(this.index, this.value);
      }
    }
  }

  /**
   * Set the cell's number value (matching reference updateSymbolValue)
   */
  setValue(value: number): void {
    this.value = value;
    this.symbolValue = value; // Store for matching (matching reference)
    if (this.gameSymbolLabel) {
      this.gameSymbolLabel.text = String(value);
      this.gameSymbolLabel.visible = true;
    }
  }

  /**
   * Set symbol directly by key (for bonus symbols - not used in main grid)
   */
  setSymbol(key: SymbolKey): void {
    this.symbolKey = key;
    this.value = SYMBOL_KEYS.indexOf(key);
    // For symbols, we still show the number if there's a value
    if (this.gameSymbolLabel && this.value > 0) {
      this.gameSymbolLabel.text = String(this.value);
      this.gameSymbolLabel.visible = true;
    }
  }

  /**
   * Get current cell state
   */
  get state(): CellState {
    return this._state;
  }

  /**
   * Set cell state
   */
  setState(state: CellState): void {
    this._state = state;

    switch (state) {
      case CellState.NORMAL:
        this.gameSymbolBackground.visible = true;
        if (this.gameSymbolMatchedBackground) this.gameSymbolMatchedBackground.visible = false;
        if (this.gameSymbolChoosed) this.gameSymbolChoosed.visible = false;
        if (this.gameSymbolDoubleChoosed) this.gameSymbolDoubleChoosed.visible = false;
        if (this.gameSymbolMatchedEffect) this.gameSymbolMatchedEffect.visible = false;
        if (this.gameSymbolDoubleMatchedEffect) this.gameSymbolDoubleMatchedEffect.visible = false;
        if (this.gameSymbolMatchedAnimation) this.gameSymbolMatchedAnimation.visible = false;
        if (this.gameSymbolLabel) {
          this.gameSymbolLabel.visible = true;
          this.gameSymbolLabel.alpha = 1;
          this.gameSymbolLabel.style.fontFamily = 'Dragon Gold';
        }
        this.isMatched = false;
        this.isChoosed = false;
        break;

      case CellState.SELECTABLE:
        this.gameSymbolBackground.visible = true;
        if (this.gameSymbolMatchedBackground) this.gameSymbolMatchedBackground.visible = false;
        if (this.gameSymbolChoosed) this.gameSymbolChoosed.visible = true;
        if (this.gameSymbolDoubleChoosed) this.gameSymbolDoubleChoosed.visible = true;
        if (this.gameSymbolMatchedEffect) this.gameSymbolMatchedEffect.visible = false;
        if (this.gameSymbolDoubleMatchedEffect) this.gameSymbolDoubleMatchedEffect.visible = false;
        if (this.gameSymbolLabel) {
          this.gameSymbolLabel.style.fontFamily = 'Dragon Deep';
        }
        this.isChoosed = true;
        break;

      case CellState.MATCHED:
        // Don't directly set to matched - use playMatchAnimation()
        break;
    }
  }

  /**
   * Play the match animation with TweenService (exactly like reference)
   */
  playMatchAnimation(): void {
    if (this.isMatched) return; // Already matched
    this.isMatched = true;
    this._state = CellState.MATCHED;

    // Hide choosed effects
    if (this.gameSymbolChoosed) this.gameSymbolChoosed.visible = false;
    if (this.gameSymbolDoubleChoosed) this.gameSymbolDoubleChoosed.visible = false;

    // Show matched background with alpha 0 initially
    if (this.gameSymbolMatchedBackground) {
      this.gameSymbolMatchedBackground.alpha = 0;
      this.gameSymbolMatchedBackground.visible = true;
    }

    // Show matched star effects with scale = 0 (will animate to 1)
    if (this.gameSymbolMatchedEffect) {
      this.gameSymbolMatchedEffect.scale.set(0);
      this.gameSymbolMatchedEffect.visible = true;
    }
    if (this.gameSymbolDoubleMatchedEffect) {
      this.gameSymbolDoubleMatchedEffect.scale.set(1); // Double star stays at scale 1
      this.gameSymbolDoubleMatchedEffect.visible = true;
    }

    // Update label font to Dragon Deep (matching reference)
    if (this.gameSymbolLabel) {
      this.gameSymbolLabel.style.fontFamily = 'Dragon Deep';
    }

    // Dragon animation will be shown AFTER yellow star scales up (matching reference)
    // Reference: dragon animation appears in onComplete callback of yellow star scale animation

    // TweenService animation (matching reference exactly)
    if (!this.tweenService) return;

    const durationMs = REEL_SPEED * 1000; // Convert to milliseconds (REEL_SPEED = 0.2, so 200ms)

    // Animate yellow star scale from 0 to 1 (matching reference)
    // Reference: yellow star scales up first, THEN dragon animation appears in onComplete
    if (this.gameSymbolMatchedEffect) {
      const scaleTween = { x: 0, y: 0 };
      this.tweenService
        .to(scaleTween, { x: 1, y: 1 }, {
          duration: durationMs,
          easing: 'linear',
          onUpdate: () => {
            if (this.gameSymbolMatchedEffect) {
              this.gameSymbolMatchedEffect.scale.set(scaleTween.x, scaleTween.y);
            }
          },
          onComplete: () => {
            // Show and play dragon animation AFTER yellow star scales (matching reference)
            // Reference: dragon animation appears in onComplete callback of yellow star scale
            if (this.gameSymbolMatchedAnimation) {
              // Position matching reference (centered on background)
              const bgCenterX = SYMBOL_W / 2;
              const bgCenterY = SYMBOL_H / 2;
              this.gameSymbolMatchedAnimation.anchor.set(0, 0);
              this.gameSymbolMatchedAnimation.x = bgCenterX - this.gameSymbolMatchedAnimation.width / 2;
              this.gameSymbolMatchedAnimation.y = bgCenterY - this.gameSymbolMatchedAnimation.height / 2;
              this.gameSymbolMatchedAnimation.visible = true;
              this.gameSymbolMatchedAnimation.zIndex = 100; // Highest z-index (increased for visibility)
              this.gameSymbolMatchedAnimation.animationSpeed = 0.75; // Matching reference
              this.gameSymbolMatchedAnimation.loop = false; // Matching reference
              this.gameSymbolMatchedAnimation.gotoAndPlay(0);
              this.gameSymbolMatchedAnimation.play();

              // Ensure yellow stars are below dragon animation
              if (this.gameSymbolMatchedEffect) {
                this.gameSymbolMatchedEffect.zIndex = 50;
              }
              if (this.gameSymbolDoubleMatchedEffect) {
                this.gameSymbolDoubleMatchedEffect.zIndex = 50;
              }

              // Debug log to verify animation is showing
              console.log(`SlingoCell ${this.index}: Dragon animation playing - visible=${this.gameSymbolMatchedAnimation.visible}, zIndex=${this.gameSymbolMatchedAnimation.zIndex}, width=${this.gameSymbolMatchedAnimation.width}, height=${this.gameSymbolMatchedAnimation.height}`);
            } else {
              console.warn(`SlingoCell ${this.index}: Dragon animation not available - animation was not created`);
            }
          },
        })
        .promise.catch(() => {
          // Ignore errors
        });
    }

    // Animate label alpha to 0 (matching reference - label fades out in parallel)
    if (this.gameSymbolLabel) {
      const labelTween = { alpha: this.gameSymbolLabel.alpha };
      this.tweenService
        .to(labelTween, { alpha: 0 }, {
          duration: durationMs,
          easing: 'linear',
          onUpdate: () => {
            if (this.gameSymbolLabel) {
              this.gameSymbolLabel.alpha = labelTween.alpha;
            }
          },
          onComplete: () => {
            // Hide label (matching reference)
            if (this.gameSymbolLabel) {
              this.gameSymbolLabel.visible = false;
            }
            // Fade out yellow effects AFTER text fades out (matching reference)
            // Yellow star STAYS visible during dragon animation, only fades after text fades
            if (this.gameSymbolMatchedEffect && this.tweenService) {
              const yellowTween = { alpha: this.gameSymbolMatchedEffect.alpha };
              this.tweenService
                .to(yellowTween, { alpha: 0 }, {
                  duration: 300,
                  easing: 'linear',
                  onUpdate: () => {
                    if (this.gameSymbolMatchedEffect) {
                      this.gameSymbolMatchedEffect.alpha = yellowTween.alpha;
                    }
                  },
                  onComplete: () => {
                    if (this.gameSymbolMatchedEffect) {
                      this.gameSymbolMatchedEffect.visible = false;
                    }
                  },
                })
                .promise.catch(() => {
                  // Ignore errors
                });
            }
            if (this.gameSymbolDoubleMatchedEffect && this.tweenService) {
              const yellowDoubleTween = { alpha: this.gameSymbolDoubleMatchedEffect.alpha };
              this.tweenService
                .to(yellowDoubleTween, { alpha: 0 }, {
                  duration: 300,
                  easing: 'linear',
                  onUpdate: () => {
                    if (this.gameSymbolDoubleMatchedEffect) {
                      this.gameSymbolDoubleMatchedEffect.alpha = yellowDoubleTween.alpha;
                    }
                  },
                  onComplete: () => {
                    if (this.gameSymbolDoubleMatchedEffect) {
                      this.gameSymbolDoubleMatchedEffect.visible = false;
                    }
                  },
                })
                .promise.catch(() => {
                  // Ignore errors
                });
            }
          },
        })
        .promise.catch(() => {
          // Ignore errors
        });
    }

    // Animate matched background alpha to 1 (in parallel)
    if (this.gameSymbolMatchedBackground) {
      const bgTween = { alpha: this.gameSymbolMatchedBackground.alpha };
      this.tweenService
        .to(bgTween, { alpha: 1 }, {
          duration: durationMs,
          easing: 'linear',
          onUpdate: () => {
            if (this.gameSymbolMatchedBackground) {
              this.gameSymbolMatchedBackground.alpha = bgTween.alpha;
            }
          },
        })
        .promise.catch(() => {
          // Ignore errors
        });
    }
  }

  /**
   * Update matched symbol text (before animation, like reference)
   * This shows yellow stars when a number is spun - cell is NOT clickable
   */
  updateMatchedSymbolText(): void {
    // Hide choosed effects (green stars)
    if (this.gameSymbolChoosed) this.gameSymbolChoosed.visible = false;
    if (this.gameSymbolDoubleChoosed) this.gameSymbolDoubleChoosed.visible = false;

    // Remove choosed state (matching reference)
    this.isChoosed = false;

    // Show matched background with alpha 0
    if (this.gameSymbolMatchedBackground) {
      this.gameSymbolMatchedBackground.alpha = 0;
      this.gameSymbolMatchedBackground.visible = true;
    }

    // Update label font
    if (this.gameSymbolLabel) {
      this.gameSymbolLabel.style.fontFamily = 'Dragon Deep';
    }

    // Show matched effects (yellow stars)
    if (this.gameSymbolMatchedEffect) this.gameSymbolMatchedEffect.visible = true;
    if (this.gameSymbolDoubleMatchedEffect) this.gameSymbolDoubleMatchedEffect.visible = true;

    // IMPORTANT: Make cell NON-INTERACTIVE when yellow stars appear (matching reference)
    // Yellow stars mean the number was spun, but it's NOT clickable
    // Only green stars (choosed) are clickable
    this.eventMode = 'auto'; // Disable interaction
    this.cursor = 'default';
  }

  /**
   * Reset to unmatched state
   */
  resetMatched(): void {
    this.isMatched = false;
    this._state = CellState.NORMAL;
    this.isChoosed = false; // Also reset choosed state

    // Hide matched background
    if (this.gameSymbolMatchedBackground) this.gameSymbolMatchedBackground.visible = false;

    // Hide matched stars (yellow)
    if (this.gameSymbolMatchedEffect) this.gameSymbolMatchedEffect.visible = false;
    if (this.gameSymbolDoubleMatchedEffect) this.gameSymbolDoubleMatchedEffect.visible = false;

    // Hide choosed stars (green)
    if (this.gameSymbolChoosed) this.gameSymbolChoosed.visible = false;
    if (this.gameSymbolDoubleChoosed) this.gameSymbolDoubleChoosed.visible = false;

    // Hide animation
    if (this.gameSymbolMatchedAnimation) this.gameSymbolMatchedAnimation.visible = false;

    // Restore label (matching reference)
    if (this.gameSymbolLabel) {
      this.gameSymbolLabel.visible = true;
      this.gameSymbolLabel.alpha = 1;
      this.gameSymbolLabel.style.fontFamily = 'Dragon Gold';
    }

    // Disable interaction
    this.eventMode = 'auto';
    this.cursor = 'default';
    this.off('pointertap', this.handleCellClick);
  }

  /**
   * Update choosed symbol state (matching reference updateChoosedSymbol)
   * Shows green star when joker/super joker chooses this number
   */
  updateChoosedSymbol(isChoosed: boolean): void {
    if (!this.isMatched) {
      if (this.gameSymbolChoosed) this.gameSymbolChoosed.visible = isChoosed;
      if (this.gameSymbolDoubleChoosed) this.gameSymbolDoubleChoosed.visible = isChoosed;
      this.isChoosed = isChoosed;

      if (isChoosed) {
        // Change font to Dragon Deep when choosed (matching reference)
        if (this.gameSymbolLabel) {
          this.gameSymbolLabel.style.fontFamily = 'Dragon Deep';
        }
        // Make cell interactive for clicking (matching reference)
        // ONLY green stars are clickable - yellow stars are NOT
        this.eventMode = 'static';
        this.cursor = 'pointer';
        // Remove any existing listeners to avoid duplicates
        this.off('pointertap', this.handleCellClick);
        this.on('pointertap', this.handleCellClick.bind(this));
      } else {
        // Restore font to Dragon Gold
        if (this.gameSymbolLabel) {
          this.gameSymbolLabel.style.fontFamily = 'Dragon Gold';
        }
        // Disable interaction when not choosed
        this.eventMode = 'auto';
        this.cursor = 'default';
        this.off('pointertap', this.handleCellClick);
      }
    } else {
      // If already matched, don't show choosed
      if (this.gameSymbolChoosed) this.gameSymbolChoosed.visible = false;
      if (this.gameSymbolDoubleChoosed) this.gameSymbolDoubleChoosed.visible = false;
      this.isChoosed = false;
      if (this.gameSymbolLabel) {
        this.gameSymbolLabel.style.fontFamily = 'Dragon Gold';
      }
      // Disable interaction if already matched
      this.eventMode = 'auto';
      this.cursor = 'default';
      this.off('pointertap', this.handleCellClick);
    }
  }

  /**
   * Check if this cell matches a value
   */
  matches(value: number): boolean {
    return this.value === value && !this.isMatched;
  }

  /**
   * Check if this cell matches a symbol key
   */
  matchesSymbol(key: SymbolKey): boolean {
    return this.symbolKey === key && !this.isMatched;
  }

  /**
   * Update (called each frame for star rotation)
   */
  update(): void {
    // Rotate stars (matching reference speeds)
    if (this.gameSymbolChoosed && this.gameSymbolChoosed.visible) {
      this.gameSymbolChoosed.rotation += Math.PI / (400 + this.randomSpeed);
    }
    if (this.gameSymbolDoubleChoosed && this.gameSymbolDoubleChoosed.visible) {
      this.gameSymbolDoubleChoosed.rotation += Math.PI / (200 + this.randomDoubleSpeed);
    }
    if (this.gameSymbolMatchedEffect && this.gameSymbolMatchedEffect.visible) {
      this.gameSymbolMatchedEffect.rotation += Math.PI / (400 + this.randomSpeed);
    }
    if (this.gameSymbolDoubleMatchedEffect && this.gameSymbolDoubleMatchedEffect.visible) {
      this.gameSymbolDoubleMatchedEffect.rotation += Math.PI / (200 + this.randomDoubleSpeed);
    }
  }
}

/**
 * SlingoGrid - The 5×5 symbol grid
 */
export class SlingoGrid extends Container {
  public readonly cells: SlingoCell[] = [];
  private readonly resolveTexture: TextureResolver;
  private readonly tweenService: ITweenService | undefined;

  // Callback for cell clicks
  public onCellClick: ((cellIndex: number, value: number) => void) | null = null;

  // Win line animations container (for cleanup)
  private winLineAnimations: AnimatedSprite[] = [];
  private winLineContainer: Container | null = null;

  constructor(resolveTexture: TextureResolver, tweenService?: ITweenService) {
    super();
    this.label = 'SlingoGrid';
    this.resolveTexture = resolveTexture;
    this.tweenService = tweenService;
    this.createGrid();
    this.createWinLineContainer();
  }

  /**
   * Create container for win line animations (above grid)
   */
  private createWinLineContainer(): void {
    this.winLineContainer = new Container();
    this.winLineContainer.label = 'WinLineContainer';
    this.addChild(this.winLineContainer);
  }

  /**
   * Create the 5×5 grid of cells
   */
  private createGrid(): void {
    const totalCells = GRID_COLS * GRID_ROWS; // 25

    for (let i = 0; i < totalCells; i++) {
      const cell = new SlingoCell(i, this.resolveTexture, this.tweenService);

      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      // Matching reference: singleSymbol.x = (index % 5) * (singleSymbol.width + 9)
      // Use cell.width to match reference behavior (even though we set it to SYMBOL_W)
      cell.x = col * (cell.width + SYMBOL_GAP_H);
      // Matching reference: singleSymbol.y = Math.floor(index / 5) * (singleSymbol.height + 8)
      cell.y = row * (cell.height + SYMBOL_GAP_V);

      this.cells.push(cell);
      this.addChild(cell);
    }
  }

  /**
   * Handle cell click from SlingoCell (matching reference setSymbolMatched)
   */
  handleCellClick(cellIndex: number, value: number): void {
    const cell = this.cells[cellIndex];
    if (!cell || !cell.isChoosed || cell.isMatched) return;

    // Remove all choosed states (matching reference removeAllChoosed)
    this.removeAllChoosed();

    // Play match animation on clicked cell (matching reference updatedMatchedSymbol)
    cell.playMatchAnimation();

    // Notify scene (matching reference callAPI)
    this.onCellClick?.(cellIndex, value);
  }

  /**
   * Initialize grid with number values (1-60 typical for Slingo)
   */
  initializeWithNumbers(numbers?: number[]): void {
    if (numbers && numbers.length === 25) {
      this.cells.forEach((cell, i) => {
        const num = numbers[i];
        if (num !== undefined) {
          cell.setValue(num);
        }
        cell.resetMatched();
      });
    } else {
      // Generate random numbers 1-60
      this.cells.forEach((cell) => {
        const randomNum = Math.floor(Math.random() * 60) + 1;
        cell.setValue(randomNum);
        cell.resetMatched();
      });
    }
  }

  /**
   * Update grid with table pattern from server
   */
  updateTablePattern(pattern: number[]): void {
    if (pattern.length !== 25) return;
    pattern.forEach((value, i) => {
      const cell = this.cells[i];
      if (cell) {
        cell.setValue(value);
      }
    });
  }

  /**
   * Mark cells as matched based on a spinner result value
   * This plays the match animation
   * @returns Array of matched cell indices
   */
  markMatches(value: number): number[] {
    const matched: number[] = [];
    this.cells.forEach((cell) => {
      if (cell.matches(value)) {
        cell.playMatchAnimation();
        matched.push(cell.index);
      }
    });
    return matched;
  }

  /**
   * Mark cells as matched based on symbol key
   * This plays the match animation
   * @returns Array of matched cell indices
   */
  markMatchesBySymbol(symbolKey: string): number[] {
    const matched: number[] = [];
    this.cells.forEach((cell) => {
      if (cell.matchesSymbol(symbolKey as SymbolKey)) {
        cell.playMatchAnimation();
        matched.push(cell.index);
      }
    });
    return matched;
  }

  /**
   * Mark single cell as matched (for choose cell flow)
   */
  markSingleMatch(index: number): void {
    const cell = this.cells[index];
    if (cell && !cell.isMatched) {
      cell.playMatchAnimation();
    }
  }

  /**
   * Update matched symbol text only (before full animation)
   */
  updateMatchedSymbolText(value: number): void {
    this.cells.forEach((cell) => {
      if (cell.matches(value)) {
        cell.updateMatchedSymbolText();
      }
    });
  }

  /**
   * Update choosed table (matching reference updateChoosedTable)
   * Shows green stars on cells whose numbers are in the choosedTable array
   */
  updateChoosedTable(choosedTable: number[]): void {
    this.cells.forEach((cell) => {
      if (choosedTable.includes(cell.value)) {
        cell.updateChoosedSymbol(true);
      } else {
        cell.updateChoosedSymbol(false);
      }
    });
  }

  /**
   * Remove all choosed states (matching reference removeAllChoosed)
   */
  removeAllChoosed(): void {
    this.cells.forEach((cell) => {
      cell.updateChoosedSymbol(false);
    });
  }

  /**
   * Set cells as selectable (for joker/wild picks)
   */
  setSelectable(indices: number[]): void {
    this.cells.forEach((cell) => {
      if (indices.includes(cell.index) && !cell.isMatched) {
        cell.setState(CellState.SELECTABLE);
      }
    });
  }

  /**
   * Set cells as selectable by value
   */
  setSelectableByValue(values: number[]): void {
    this.cells.forEach((cell) => {
      if (values.includes(cell.value) && !cell.isMatched) {
        cell.setState(CellState.SELECTABLE);
      }
    });
  }

  /**
   * Clear all selectable states
   */
  clearSelectable(): void {
    this.cells.forEach((cell) => {
      if (cell.state === CellState.SELECTABLE) {
        cell.setState(CellState.NORMAL);
      }
    });
  }

  /**
   * Reset all cells to normal state
   */
  resetAll(): void {
    this.cells.forEach((cell) => {
      cell.resetMatched();
    });
  }

  /**
   * Get all matched cells
   */
  getMatchedCells(): SlingoCell[] {
    return this.cells.filter((cell) => cell.isMatched);
  }

  /**
   * Count matches
   */
  getMatchCount(): number {
    return this.getMatchedCells().length;
  }

  /**
   * Get cell by value
   */
  getCellByValue(value: number): SlingoCell | undefined {
    return this.cells.find((cell) => cell.value === value && !cell.isMatched);
  }

  /**
   * Show win line animations (matching reference showWinAnimation)
   * @param winLines Array of win line numbers (0-11)
   * - 0-4: Horizontal rows (left to right)
   * - 5-9: Vertical columns (top to bottom)
   * - 10: Diagonal (top-left to bottom-right)
   * - 11: Diagonal (top-right to bottom-left)
   */
  showWinAnimation(winLines: number[]): void {
    if (!this.tweenService || !this.winLineContainer) return;

    // Clear previous animations
    this.winLineAnimations.forEach((anim) => {
      if (anim.parent) {
        anim.parent.removeChild(anim);
      }
      anim.destroy();
    });
    this.winLineAnimations = [];

    // Get first cell for reference positioning
    const firstCell = this.cells[0];
    const lastCell = this.cells[24];
    if (!firstCell) return;

    winLines.forEach((winline, index) => {
      // Stagger animations by 1000ms per line (matching reference)
      setTimeout(() => {
        if (firstCell && lastCell) {
          this.createWinLineAnimation(winline, index, firstCell, lastCell);
        }
      }, (index + 1) * 1000);
    });
  }

  /**
   * Create a single win line animation
   */
  private createWinLineAnimation(
    winline: number,
    _index: number,
    firstCell: SlingoCell,
    lastCell: SlingoCell,
  ): void {
    if (!this.tweenService || !this.winLineContainer) return;

    // Create texture array for animated sprite (Popup/Winline/1 to 13)
    // Reference uses: Texture.from('Popup/Winline/' + i)
    const textureArray: Texture[] = [];
    for (let i = 1; i <= 13; i++) {
      // Try multiple path formats (matching reference)
      const texture =
        this.resolveTexture(`Popup/Winline/${i}`) ||
        this.resolveTexture(`Popup/Winline/${i}.png`) ||
        this.resolveTexture(`Winline_${i}`) ||
        this.resolveTexture(`winline_${i}`);
      if (texture) {
        textureArray.push(texture);
      }
    }

    // Fallback: if no textures found, skip this animation
    if (textureArray.length === 0) {
      console.warn('Win line textures not found, skipping animation');
      return;
    }

    const winAnimation = new AnimatedSprite(textureArray);
    winAnimation.anchor.set(0.5);
    winAnimation.animationSpeed = 0.6; // Matching reference
    winAnimation.loop = true;
    this.winLineAnimations.push(winAnimation);
    this.winLineContainer.addChild(winAnimation);

    const moveDuration = REEL_SPEED * 4 * 1000; // REEL_SPEED * 4 in ms
    const fadeDuration = REEL_SPEED * 0.5 * 1000; // REEL_SPEED * 0.5 in ms

    // Calculate positions and animations based on win line type
    if (winline >= 0 && winline <= 4) {
      // Horizontal lines (0-4): Left to right sweep
      winAnimation.scale.set(-0.5, 0.5);
      winAnimation.rotation = 0;
      winAnimation.x = firstCell.x - winAnimation.width / 4;
      winAnimation.y =
        firstCell.y +
        SYMBOL_H / 2 +
        (SYMBOL_H + SYMBOL_GAP_V) * winline;

      winAnimation.play();

      // Animate from left to right
      const startX = winAnimation.x;
      const endX = lastCell.x + SYMBOL_W + winAnimation.width / 2;

      const tweenProxy = { x: startX };
      this.tweenService
        .to(tweenProxy, { x: endX }, {
          duration: moveDuration,
          easing: 'linear',
          onUpdate: () => {
            winAnimation.x = tweenProxy.x;
          },
          onComplete: () => {
            // Fade out and remove
            const fadeProxy = { alpha: winAnimation.alpha };
            this.tweenService
              ?.to(fadeProxy, { alpha: 0 }, {
                duration: fadeDuration,
                easing: 'linear',
                onUpdate: () => {
                  winAnimation.alpha = fadeProxy.alpha;
                },
                onComplete: () => {
                  if (winAnimation.parent) {
                    winAnimation.parent.removeChild(winAnimation);
                  }
                  winAnimation.destroy();
                },
              })
              .promise.catch(() => {
                // Ignore errors
              });
          },
        })
        .promise.catch(() => {
          // Ignore errors
        });
    } else if (winline >= 5 && winline <= 9) {
      // Vertical lines (5-9): Top to bottom sweep
      winAnimation.scale.set(-0.5, 0.5);
      winAnimation.rotation = Math.PI / 2; // 90 degrees
      winAnimation.x =
        firstCell.x +
        SYMBOL_W / 2 +
        (SYMBOL_W + SYMBOL_GAP_H) * (winline - 5);
      winAnimation.y = firstCell.y - winAnimation.width / 4;

      winAnimation.play();

      // Animate from top to bottom
      const startY = winAnimation.y;
      const endY = lastCell.y + SYMBOL_H + winAnimation.width / 2;

      const tweenProxy = { y: startY };
      this.tweenService
        .to(tweenProxy, { y: endY }, {
          duration: moveDuration,
          easing: 'linear',
          onUpdate: () => {
            winAnimation.y = tweenProxy.y;
          },
          onComplete: () => {
            // Fade out and remove
            const fadeProxy = { alpha: winAnimation.alpha };
            this.tweenService
              ?.to(fadeProxy, { alpha: 0 }, {
                duration: fadeDuration,
                easing: 'linear',
                onUpdate: () => {
                  winAnimation.alpha = fadeProxy.alpha;
                },
                onComplete: () => {
                  if (winAnimation.parent) {
                    winAnimation.parent.removeChild(winAnimation);
                  }
                  winAnimation.destroy();
                },
              })
              .promise.catch(() => {
                // Ignore errors
              });
          },
        })
        .promise.catch(() => {
          // Ignore errors
        });
    } else if (winline === 10) {
      // Diagonal (10): Top-left to bottom-right
      winAnimation.scale.set(-0.5, 0.5);
      winAnimation.rotation = Math.PI / 4; // 45 degrees
      winAnimation.x = firstCell.x - (firstCell.width * Math.sqrt(2)) / 2;
      winAnimation.y = firstCell.y - (firstCell.height * Math.sqrt(2)) / 2;

      winAnimation.play();

      // Animate diagonally
      const startX = winAnimation.x;
      const startY = winAnimation.y;
      const endX = lastCell.x + SYMBOL_W + lastCell.width * Math.sqrt(2);
      const endY = lastCell.y + SYMBOL_H + lastCell.height * Math.sqrt(2);

      const tweenProxy = { x: startX, y: startY };
      this.tweenService
        .to(tweenProxy, { x: endX, y: endY }, {
          duration: moveDuration,
          easing: 'linear',
          onUpdate: () => {
            winAnimation.x = tweenProxy.x;
            winAnimation.y = tweenProxy.y;
          },
          onComplete: () => {
            // Fade out and remove
            const fadeProxy = { alpha: winAnimation.alpha };
            this.tweenService
              ?.to(fadeProxy, { alpha: 0 }, {
                duration: fadeDuration,
                easing: 'linear',
                onUpdate: () => {
                  winAnimation.alpha = fadeProxy.alpha;
                },
                onComplete: () => {
                  if (winAnimation.parent) {
                    winAnimation.parent.removeChild(winAnimation);
                  }
                  winAnimation.destroy();
                },
              })
              .promise.catch(() => {
                // Ignore errors
              });
          },
        })
        .promise.catch(() => {
          // Ignore errors
        });
    } else if (winline === 11) {
      // Diagonal (11): Top-right to bottom-left
      winAnimation.scale.set(0.5, 0.5);
      winAnimation.rotation = -Math.PI / 4; // -45 degrees
      const cell4 = this.cells[4]; // Top-right cell
      const cell20 = this.cells[20]; // Bottom-left cell
      if (!cell4 || !cell20 || !this.tweenService) return;

      winAnimation.x =
        cell4.x +
        cell4.width +
        (SYMBOL_W * Math.sqrt(2)) / 2;
      winAnimation.y = cell4.y - (SYMBOL_H * Math.sqrt(2)) / 2;

      winAnimation.play();

      // Animate diagonally
      const startX = winAnimation.x;
      const startY = winAnimation.y;
      const endX = cell20.x - SYMBOL_W * Math.sqrt(2);
      const endY = cell20.y + SYMBOL_H + SYMBOL_H * Math.sqrt(2);

      const tweenProxy = { x: startX, y: startY };
      this.tweenService
        .to(tweenProxy, { x: endX, y: endY }, {
          duration: moveDuration,
          easing: 'linear',
          onUpdate: () => {
            winAnimation.x = tweenProxy.x;
            winAnimation.y = tweenProxy.y;
          },
          onComplete: () => {
            // Fade out and remove
            const fadeProxy = { alpha: winAnimation.alpha };
            this.tweenService
              ?.to(fadeProxy, { alpha: 0 }, {
                duration: fadeDuration,
                easing: 'linear',
                onUpdate: () => {
                  winAnimation.alpha = fadeProxy.alpha;
                },
                onComplete: () => {
                  if (winAnimation.parent) {
                    winAnimation.parent.removeChild(winAnimation);
                  }
                  winAnimation.destroy();
                },
              })
              .promise.catch(() => {
                // Ignore errors
              });
          },
        })
        .promise.catch(() => {
          // Ignore errors
        });
    }
  }

  /**
   * Check for any complete lines and return win count (stub)
   */
  checkForWins(): number {
    // Stub implementation to satisfy type checker
    return 0;
  }

  /**
   * Clear all win line animations
   */
  clearWinAnimations(): void {
    this.winLineAnimations.forEach((anim) => {
      if (anim.parent) {
        anim.parent.removeChild(anim);
      }
      anim.destroy();
    });
    this.winLineAnimations = [];
  }

  /**
   * Update (called each frame for animations)
   */
  update(_deltaMs: number): void {
    this.cells.forEach((cell) => cell.update());
  }

  /**
   * Cleanup
   */
  override destroy(): void {
    this.cells.length = 0;
    super.destroy({ children: true });
  }
}

export default SlingoGrid;
