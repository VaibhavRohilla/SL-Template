# 02 — Bootstrap Pipeline Trace

> **Goal:** Trace how layout numbers flow from Template config to Engine runtime, identifying every hop, default, and potential override.

---

## Full Pipeline

```
Template BrandConfig.dimensions
        │
        ▼
bootstrap.ts  gameOptions.layout = { symbolWidth, symbolHeight, symbolGap, reelGap }
        │
        ▼
Game constructor (App.ts)  this.options = { ...options }
        │
        ▼
Game.getSceneLayout() → { symbolWidth, symbolHeight, symbolGap, reelGap }
        │                    (with ?? fallback defaults)
        ▼
Game.createSceneContext() → SceneContext.sceneLayout
        │
        ▼
SlotGameScene.fromContext(ctx) → reads ctx.sceneLayout
        │
        ▼
SlotScene constructor → this.sceneConfig = { ...DEFAULT_SCENE_CONFIG_PARTIAL, ...sceneConfig }
        │
        ▼
SlotScene.createReels() → ReelsViewConfig → ReelsView → ReelView
```

---

## HOP 1: Template defines dimensions

**File:** `SL-Template/src/brand/BrandConfig.ts:106-113`

```typescript
export const dimensions = {
  width: 1920,
  height: 1080,
  symbolWidth: 200,
  symbolHeight: 200,
  symbolGap: 60,
  reelGap: 100,
} as const;
```

## HOP 2: bootstrap.ts maps to GameOptions.layout

**File:** `SL-Template/src/bootstrap/bootstrap.ts:34-39`

```typescript
layout: {
  symbolWidth: dimensions.symbolWidth,   // 200
  symbolHeight: dimensions.symbolHeight, // 200
  symbolGap: dimensions.symbolGap,       // 60
  reelGap: dimensions.reelGap,           // 100
},
```

Also passes `width: dimensions.width` (1920) and `height: dimensions.height` (1080) at lines 26-27.

**No transformation.** Values pass through 1:1.

## HOP 3: Game constructor stores options

**File:** `SL-Engine/src/app/App.ts:203-209`

```typescript
this.options = {
  width: 1280,    // default
  height: 720,    // default
  backgroundColor: 0x1a1a2e,
  logLevel: 'info',
  ...options,     // Template values override defaults
};
```

`this.designWidth = this.options.width ?? 1280;` → **1920** (line 217)
`this.designHeight = this.options.height ?? 720;` → **1080** (line 218)

**No transformation.** Template values win via spread.

## HOP 4: getSceneLayout() applies fallback defaults

**File:** `SL-Engine/src/app/App.ts:372-380`

```typescript
private getSceneLayout() {
  const L = this.options.layout;
  return {
    symbolWidth:  L?.symbolWidth  ?? 140,   // gets 200
    symbolHeight: L?.symbolHeight ?? 140,   // gets 200
    symbolGap:    L?.symbolGap    ?? 5,     // gets 60
    reelGap:      L?.reelGap      ?? 10,    // gets 100
  };
}
```

**OBSERVATION:** Defaults (140, 140, 5, 10) would only apply if Template didn't provide `layout`. Since Template DOES provide it, these defaults are inert. **No override.**

## HOP 5: createSceneContext() passes layout to SceneContext

**File:** `SL-Engine/src/app/App.ts:325-357`

```typescript
sceneLayout: this.getSceneLayout(),  // line 356
viewport: { width: this.designWidth, height: this.designHeight },  // lines 341-344
```

**No transformation.**

## HOP 6: SlotGameScene.fromContext() reads sceneLayout

**File:** `SL-Engine/src/view/scene/SlotGameScene.ts:50-66`

```typescript
const layout = ctx.sceneLayout ?? {
  symbolWidth: 140,   // fallback (inert — ctx.sceneLayout is always provided)
  symbolHeight: 140,
  symbolGap: 5,
  reelGap: 10,
};
const sceneConfig = {
  ...
  width: ctx.viewport.width,          // 1920
  height: ctx.viewport.height,        // 1080
  symbolWidth: layout.symbolWidth,    // 200
  symbolHeight: layout.symbolHeight,  // 200
  symbolGap: layout.symbolGap,        // 60
  reelGap: layout.reelGap,            // 100
};
```

**No transformation.** Fallback is inert.

## HOP 7: SlotScene constructor merges with DEFAULT_SCENE_CONFIG_PARTIAL

**File:** `SL-Engine/src/view/scene/SlotScene.ts:334`

```typescript
this.sceneConfig = { ...DEFAULT_SCENE_CONFIG_PARTIAL, ...sceneConfig };
```

Where `DEFAULT_SCENE_CONFIG_PARTIAL` is (line 146-154):
```typescript
{
  width: 1280,
  height: 720,
  symbolWidth: 150,
  symbolHeight: 150,
  symbolGap: 5,
  reelGap: 10,
  backgroundColor: 0x1a1a2e,
}
```

**Because `sceneConfig` is spread AFTER defaults, Template values win.** The defaults are overwritten. **No override in this path.**

## HOP 8: SlotScene.createReels() passes to ReelsView

**File:** `SL-Engine/src/view/scene/SlotScene.ts:616-633`

```typescript
const reelsConfig: ReelsViewConfig = {
  symbolWidth: this.sceneConfig.symbolWidth,    // 200
  symbolHeight: this.sceneConfig.symbolHeight,  // 200
  symbolGap: this.sceneConfig.symbolGap,        // 60
  reelGap: this.sceneConfig.reelGap,            // 100
  x: (this.sceneConfig.width - this.calculateReelsWidth()) / 2,
  y: (this.sceneConfig.height - this.calculateReelsHeight()) / 2,
};
```

**No transformation.**

## HOP 9: ReelsView.createReels() creates individual ReelViews

**File:** `SL-Engine/src/view/reels/ReelsView.ts:583-621`

```typescript
const symbolWidth = this.viewConfig.symbolWidth;   // 200
const symbolHeight = this.viewConfig.symbolHeight;  // 200
const symbolGap = this.viewConfig.symbolGap ?? 0;   // 60
const reelGap = this.viewConfig.reelGap ?? 0;       // 100

x: i * (symbolWidth + reelGap),  // positions: 0, 300, 600, 900, 1200
```

**No transformation.**

## HOP 10: ReelView constructor creates mask

**File:** `SL-Engine/src/view/reels/ReelView.ts:71-76`

```typescript
const maskHeight = config.visibleRows * (config.symbolHeight + (config.symbolGap ?? 0));
// maskHeight = 4 * (200 + 60) = 1040
this.mask.rect(0, 0, config.symbolWidth, maskHeight);
// mask = rect(0, 0, 200, 1040)
```

## HOP 11: ReelSymbolStrip receives layout dimensions

**File:** `SL-Engine/src/view/reels/ReelView.ts:79-86`

But here, `ReelSymbolStrip` gets `symbolHeight` and `symbolGap` from the ReelViewConfig (200 and 60).

**File:** `SL-Engine/src/view/reels/ReelSymbolStrip.ts:51-53`
```typescript
get slotHeight(): number {
  return this.symbolHeight + this.symbolGap; // 200 + 60 = 260
}
```

---

## Summary: Final values at each hop

| Hop | symbolWidth | symbolHeight | symbolGap | reelGap | Source |
|-----|-------------|--------------|-----------|---------|--------|
| Template | 200 | 200 | 60 | 100 | BrandConfig.ts:106-113 |
| bootstrap.ts | 200 | 200 | 60 | 100 | bootstrap.ts:34-39 |
| getSceneLayout | 200 | 200 | 60 | 100 | App.ts:372-380 |
| SceneContext | 200 | 200 | 60 | 100 | App.ts:356 |
| SlotGameScene | 200 | 200 | 60 | 100 | SlotGameScene.ts:63-66 |
| SlotScene | 200 | 200 | 60 | 100 | SlotScene.ts:334 |
| ReelsView | 200 | 200 | 60 | 100 | SlotScene.ts:617-621 |
| ReelView mask | 200 | 200 | 60 | — | ReelView.ts:71-76 |
| ReelSymbolStrip | — | 200 | 60 | — | ReelSymbolStrip.ts:44-45 |

**CONCLUSION:** Layout values DO flow through correctly from Template to Engine. The pipeline does NOT drop `reelGap`. The issue is likely in the *math formulas* or the *scroll animation path* (SpinFeel), not in value transmission.
