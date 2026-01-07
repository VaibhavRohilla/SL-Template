# Scene Customization

Guide for creating custom Loading, Start, and Game scenes.

## Scene Architecture

The engine uses a three-scene boot flow:

```
Loading Scene → Start Scene → Game Scene
     ↓              ↓             ↓
  Load assets   Tap-to-start   Gameplay
```

## Scene Factories

Override default scenes by providing factories:

```typescript
// src/scenes/index.ts
import type { SceneFactories, SceneContext } from 'slot-frontend-engine';

export const sceneFactories: SceneFactories = {
  loading: (ctx) => new CustomLoadingScene(ctx),
  start: (ctx) => new CustomStartScene(ctx),
  game: (ctx) => new CustomGameScene(ctx), // Optional
};

// src/main.ts
const game = new Game({
  scenes: sceneFactories,
  // ...
});
```

## Custom Loading Scene

### Interface Requirements

Must implement `ILoadingScene`:

```typescript
interface ILoadingScene extends IScene {
  setProgress(progress: number, status?: string): void;
  isComplete(): boolean;
}
```

### Example Implementation

```typescript
import { BaseScene, type ILoadingScene, type SceneContext } from 'slot-frontend-engine';

export class CustomLoadingScene extends BaseScene implements ILoadingScene {
  public readonly id = 'custom-loading';
  private ctx: SceneContext;
  private progress = 0;

  constructor(ctx: SceneContext) {
    super();
    this.ctx = ctx;
  }

  protected async onMount(): Promise<void> {
    const { Graphics, Text } = await import('pixi.js');
    const { width, height } = this.ctx.viewport;

    // Create background
    const bg = new Graphics();
    bg.rect(0, 0, width, height);
    bg.fill({ color: 0x1a0a0a });
    this.container.addChild(bg);

    // Create progress bar, logo, etc.
    // ...
  }

  setProgress(progress: number, status?: string): void {
    if (this.isDestroyed) return;
    this.progress = Math.max(0, Math.min(1, progress));
    // Update visual
  }

  isComplete(): boolean {
    return this.progress >= 1;
  }

  update(deltaMs: number): void {
    // Animations (time-based only for determinism)
  }

  protected onDestroy(): void {
    // Cleanup
  }
}
```

### Loading Scene Rules

1. **Use only boot assets** - Main bundle loads after this scene mounts
2. **Cancel-safe** - Check `isDestroyed` before callbacks
3. **Monotonic progress** - Progress should only increase

## Custom Start Scene

### Interface Requirements

Must implement `IStartScene`:

```typescript
interface IStartScene extends IScene {
  setOnStart(callback: () => void): void;
  hasUserInteracted(): boolean;
}
```

### Example Implementation

```typescript
import { BaseScene, type IStartScene, type SceneContext } from 'slot-frontend-engine';

export class CustomStartScene extends BaseScene implements IStartScene {
  public readonly id = 'custom-start';
  private ctx: SceneContext;
  private onStartCallback: (() => void) | null = null;
  private hasInteracted = false;

  constructor(ctx: SceneContext) {
    super();
    this.ctx = ctx;
  }

  setOnStart(callback: () => void): void {
    this.onStartCallback = callback;
  }

  hasUserInteracted(): boolean {
    return this.hasInteracted;
  }

  protected async onMount(): Promise<void> {
    // Create visuals
    // ...

    // Setup tap handler
    this.container.eventMode = 'static';
    this.container.on('pointerdown', () => this.handleTap());
  }

  private async handleTap(): Promise<void> {
    if (this.hasInteracted || this.isDestroyed) return;
    this.hasInteracted = true;

    // Unlock audio
    await this.ctx.audioBus.unlock();

    // Trigger callback
    this.onStartCallback?.();
  }

  protected onDestroy(): void {
    this.container.off('pointerdown');
    this.onStartCallback = null;
  }
}
```

### Start Scene Rules

1. **Must unlock audio** - Call `audioBus.unlock()` on tap
2. **Single interaction** - Prevent double-tap
3. **Call callback** - Must trigger `onStartCallback` to proceed

## Advanced: Intro Animations

Add a cinematic intro before gameplay:

```typescript
class CustomStartScene extends BaseScene implements IStartScene {
  private async handleTap(): Promise<void> {
    if (this.hasInteracted) return;
    this.hasInteracted = true;

    await this.ctx.audioBus.unlock();

    // Play intro animation before callback
    await this.playIntroAnimation();

    // Now proceed to game
    this.onStartCallback?.();
  }

  private async playIntroAnimation(): Promise<void> {
    // Example: Doors opening animation
    await new Promise<void>((resolve) => {
      this.ctx.tweenService.create(this.leftDoor)
        .to({ x: -this.ctx.viewport.width / 2 }, 1000)
        .start();
      
      this.ctx.tweenService.create(this.rightDoor)
        .to({ x: this.ctx.viewport.width }, 1000)
        .onComplete(resolve)
        .start();
    });
  }
}
```

## SceneContext Reference

All scenes receive `SceneContext` with these services:

```typescript
interface SceneContext {
  // Core services
  assetAPI: AssetAPI;           // Asset loading
  audioBus: IAudioBus;          // Audio playback
  tweenService: ITweenService;  // Animations
  logger: ILogger;              // Logging
  eventBus: EventBus;           // Engine events
  presentationRng: IPresentationRng; // Deterministic RNG

  // Configuration
  bootConfig: BootConfig;
  slotConfig: SlotConfig;
  spinFeelConfig: SpinFeelConfig;

  // Layout
  viewport: { width: number; height: number };

  // Game-specific
  spinFlow: SpinFlow;
  gameUI: ISlotUI;
  winFormatter: IWinFormatter;

  // Helpers
  resolveTexture(key: string): Texture | null;
}
```

## Deterministic Animations

All animations must be time-based for determinism:

```typescript
// ✅ GOOD - Time-based
update(deltaMs: number): void {
  this.animationTime += deltaMs;
  const pulse = Math.sin(this.animationTime / 500) * 0.05 + 1;
  this.logo.scale.set(pulse);
}

// ❌ BAD - Random
update(): void {
  const pulse = 1 + Math.random() * 0.1; // Non-deterministic!
}
```

## Testing Custom Scenes

```typescript
// Skip start screen for faster iteration (DEV ONLY)
bootConfig: {
  skipStartScreen: true, // ⚠️ Never in production!
}
```

