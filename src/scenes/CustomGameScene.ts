/**
 * CustomGameScene - Slingo-Style Game Scene
 *
 * Implements the game screen layout:
 * - 5x5 number grid
 * - 1-row horizontal spinner
 * - Reference UI (Parity)
 */

import {
  SceneState,
  type SceneContext,
  type IScene,
  type ITweenService,
  type NormalizedSpinOutcome,
  OutcomeStepRunner,
  type StepRunHandlers,
  type StepRunPolicy,
  type CascadeStep,
} from '@fnx/sl-engine';
import { GameBootstrap } from '../app/GameBootstrap.js';
import {
  DESIGN_W,
  DESIGN_H,
  GAME_TABLE_X,
  GAME_TABLE_Y,
  SPINNER_Y_OFFSET
} from '../layout/DesignLayout.js';

import { SlingoGrid, type TextureResolver } from '../components/SlingoGrid.js';
import { SlingoSpinner, type SpinnerReelResult } from '../components/SlingoSpinner.js';
import { ReferenceUIRoot } from '../ui/reference/ReferenceUIRoot.js';
import { slotConfig } from '../config/slotConfig.js';
import { GameUI, type GameUIConfig } from '../ui/GameUI.js';
import { OverlayManager } from '../ui/overlays/OverlayManager.js';
import { Container, Graphics } from 'pixi.js';

import { StickyWildStore } from '../game/persistence/StickyWildStore.js';
import { PersistentStoreManager } from '../game/persistence/PersistentStoreManager.js';

export class CustomGameScene implements IScene {
  public readonly id = 'game';
  public readonly container: Container;
  private readonly ctx: SceneContext;

  private _state: SceneState = SceneState.MOUNTING;
  private readonly tweenService: ITweenService;
  private readonly logger = console; // Simple logger

  // Components
  private grid: SlingoGrid | undefined;
  private spinner: SlingoSpinner | undefined;
  private uiRoot: ReferenceUIRoot | undefined;
  private gameUI: GameUI | undefined;
  private overlayManager: OverlayManager | undefined;

  // Persistence
  private stickyStore = new StickyWildStore();
  private readonly STICKY_WILD_ID = 90; // Matches SymbolId.WILD (Piggy Theme)

  // Layout container for scaling
  private gameLayer: Container;

  // Game Logic State
  private isSpinning: boolean = false;
  private currentStepIndex: number = 0;

  constructor(context: SceneContext) {
    this.ctx = context;
    this.container = new Container();
    this.container.label = 'CustomGameScene';

    // Create game layer for easier scaling
    this.gameLayer = new Container();
    this.gameLayer.label = 'GameLayer';
    this.container.addChild(this.gameLayer);

    // dependencies
    // @ts-ignore
    this.tweenService = (context).tweenService || {
      to: () => ({ promise: Promise.resolve() }),
      wait: () => Promise.resolve()
    };

    // Register persistence
    PersistentStoreManager.getInstance().register('stickyWilds', this.stickyStore);
  }

  static create(ctx: SceneContext): CustomGameScene {
    return new CustomGameScene(ctx);
  }

  public get state(): SceneState {
    return this._state;
  }

  public async mount(): Promise<void> {
    this._state = SceneState.MOUNTING;
    this.logger.info('Mounting CustomGameScene');

    // Initialize layout
    this.createBackground();
    this.createGrid();
    this.createSpinner();
    this.createUI();
    this.createOverlays();

    // Initial Layout update
    this.onResize(window.innerWidth, window.innerHeight);

    // P0: Recovery Check
    // In a full implementation, we'd check GameBootstrap.get().getRecovery().getPendingOutcome()
    // For now, let's verify if we can spin.

    // Fade in content
    await this.tweenService.to(this.container as any, { alpha: 1 }, { duration: 500 }).promise;

    this._state = SceneState.ACTIVE;
    this.logger.info('CustomGameScene Mounted');
  }

  public async update(deltaMs: number): Promise<void> {
    this.spinner?.update(deltaMs);
  }

  public async destroy(): Promise<void> {
    this._state = SceneState.DESTROYING;
    this.container.destroy({ children: true });
    this._state = SceneState.DESTROYED;
  }

  public onResize(width: number, height: number): void {
    if (!this.container) return;

    // Calculate scale to fit design resolution
    const scaleX = width / DESIGN_W;
    const scaleY = height / DESIGN_H;
    const scale = Math.min(scaleX, scaleY);

    // Center
    this.container.scale.set(scale);
    this.container.position.set(
      (width - DESIGN_W * scale) / 2,
      (height - DESIGN_H * scale) / 2
    );

    this.uiRoot?.resize(width, height);
    this.overlayManager?.resize(width, height);
  }

  // --- Component Creation ---

  private createBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill(0x1a1a2e);
    this.gameLayer.addChild(bg);
  }

  private createGrid(): void {
    const resolver: TextureResolver = (idOrKey: string) => {
      // Try resolving as a numeric ID (symbol)
      const id = parseInt(idOrKey);
      if (!isNaN(id)) {
        const symbol = slotConfig.symbols.find(s => s.id === id);
        if (symbol) return this.ctx.resolveTexture(symbol.spriteKey as string) as any;
      }
      // Fallback to direct key resolution
      return this.ctx.resolveTexture(idOrKey as string) as any;
    };

    this.grid = new SlingoGrid(resolver, this.tweenService);
    this.grid.x = GAME_TABLE_X;
    this.grid.y = GAME_TABLE_Y;

    this.gameLayer.addChild(this.grid);
  }

  private createSpinner(): void {
    const resolver: TextureResolver = (idOrKey: string) => {
      const id = parseInt(idOrKey);
      if (!isNaN(id)) {
        const symbol = slotConfig.symbols.find(s => s.id === id);
        if (symbol) return this.ctx.resolveTexture(symbol.spriteKey as string) as any;
      }
      return this.ctx.resolveTexture(idOrKey as string) as any;
    };

    this.spinner = new SlingoSpinner(resolver, this.tweenService);
    this.spinner.x = GAME_TABLE_X;
    this.spinner.y = GAME_TABLE_Y + SPINNER_Y_OFFSET;

    this.gameLayer.addChild(this.spinner);
  }

  private createUI(): void {
    const resolver: any = (key: string) => this.ctx.resolveTexture(key);

    this.uiRoot = new ReferenceUIRoot(resolver);
    this.container.addChild(this.uiRoot);

    const uiConfig: Partial<GameUIConfig> = {
      initialBalance: 1000,
      currencySymbol: '$'
    };
    this.gameUI = new GameUI(uiConfig);

    this.uiRoot.updateFromGameUI(this.gameUI);

    this.uiRoot.spinButton.onClick = () => this.startSpin();

    this.uiRoot.betPanel.onBetChange = (delta) => {
      const currentBet = this.gameUI!.getCurrentBet();
      const newBet = Math.max(1, currentBet + delta);
      this.gameUI!.setBet(newBet);
      this.uiRoot!.updateFromGameUI(this.gameUI!);
    };



    this.uiRoot.autoSpinButton.onClick = () => {
      console.log('[UI] Autoplay not implemented in this phase');
    };
  }

  private createOverlays(): void {
    this.overlayManager = new OverlayManager(DESIGN_W, DESIGN_H);
    this.container.addChild(this.overlayManager.container);
  }

  // --- Game Logic ---

  private async startSpin(): Promise<void> {
    if (this.isSpinning) return;

    this.logger.info('Starting Spin');
    this.isSpinning = true;

    const bet = this.gameUI?.getCurrentBet() || 10;
    this.gameUI?.onSpinStart(bet);
    this.uiRoot?.setSpinningState(true);

    try {
      this.spinner?.startSpin();

      const client = GameBootstrap.get().getBackend();
      const spinResult = await client.spin({
        credit: bet,
        persistentData: PersistentStoreManager.getInstance().serializeAll()
      }) as any;

      if (spinResult.outcome) {
        await this.processOutcome(spinResult.outcome);
        this.gameUI?.onSpinComplete({
          spinId: spinResult.outcome.spinId,
          totalWin: spinResult.outcome.totalWin
        });
      } else {
        throw new Error("No outcome returned");
      }

    } catch (e) {
      this.logger.warn('Spin failed', e);
      this.isSpinning = false;
      this.gameUI?.onSpinComplete({ error: e });
      this.uiRoot?.setSpinningState(false);
      this.spinner?.forceStopAll();
    }
  }

  private async processOutcome(outcome: NormalizedSpinOutcome): Promise<void> {
    // Reset sticky store on new base spin (round start)
    this.stickyStore.reset();

    const handlers: StepRunHandlers<CascadeStep> = {
      onStepStart: (_step, ctx) => {
        this.currentStepIndex = ctx.stepIndex;
        // P2: Update UI step labels if any (e.g. "Step X of Y")
        this.logger.info(`Step ${this.currentStepIndex + 1}/${ctx.totalSteps} Start`);
      },
      onRenderGrid: async (step) => {
        // 1. Apply Sticky Wilds from Store to Grid
        const rawGrid = step.gridAfter as number[][];
        const renderGrid = this.stickyStore.applyToGrid(rawGrid, this.STICKY_WILD_ID);

        // 2. Stop Reel / Render
        const stopSymbols: SpinnerReelResult[] = renderGrid.map((col) => ({
          type: 'number',
          value: col[0] // Simple 1-row spinner logic for P0
        }));

        this.spinner?.stopWithResults(stopSymbols);
        await this.tweenService.wait(300); // Standard pause after render
      },
      onHighlightWins: async (step, ctx) => {
        if (step.wins && step.wins.length > 0) {
          // Visualize win
          this.gameUI?.onWinUpdate(ctx.accumulatedWin, `$${ctx.accumulatedWin}`);
          this.logger.info(`Step ${ctx.stepIndex} Win: ${ctx.stepWin}`);
          await this.tweenService.wait(500);
        }
      },
      onStepEnd: (step) => {
        // Apply sticky merge for the NEXT step
        if (step.meta) {
          this.stickyStore.applyFromStep(step.meta, outcome.features as any);
        }
      }
    };

    const policy: StepRunPolicy = {
      shouldSkipAnimations: () => GameBootstrap.get().getSkip().isActive(),
      checkpoint: async (name) => {
        // Bridge to existing skip/turbo checkpoint logic if needed
        this.logger.debug(`Checkpoint reached: ${name}`);
      },
      aggregateWins: 'sumSteps'
    };

    try {
      await OutcomeStepRunner.run(outcome, handlers, policy);
    } finally {
      // Final UI Ensure
      this.uiRoot?.updateFromGameUI(this.gameUI!);
      this.isSpinning = false;
      this.uiRoot?.setSpinningState(false);
    }
  }
}
