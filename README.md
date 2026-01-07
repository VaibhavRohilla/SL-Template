# Slot Game Template - Dragon Blingos

A production-grade slot game template using the **Slot Frontend Engine**.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:3000
```

## Project Structure

```
slot-game-template/
├── assets/
│   ├── boot/               # Boot bundle (loading screen assets)
│   ├── main/               # Main bundle (game assets)
│   │   ├── symbols/        # Slot symbols
│   │   ├── ui/             # UI elements
│   │   ├── fonts/          # Bitmap fonts
│   │   └── ...
│   ├── audio/
│   │   └── sfx/            # Sound effects
│   └── manifest.json       # Asset manifest
├── src/
│   ├── config/             # Game configuration
│   │   ├── slotConfig.ts   # Symbols, paytable, reels
│   │   ├── spinFeelConfig.ts # Spin timing & feel
│   │   └── themeConfig.ts  # Visual theme
│   ├── scenes/             # Custom scenes
│   │   ├── CustomLoadingScene.ts
│   │   └── CustomStartScene.ts
│   ├── ui/                 # UI handlers
│   │   ├── GameUI.ts       # Balance, bet, win management
│   │   └── MockResultSource.ts # DEV ONLY mock results
│   └── main.ts             # Entry point
├── tools/
│   ├── manifest/           # Manifest generator
│   ├── audio/              # Audio sprite tools
│   └── doctor/             # Setup validator
└── docs/                   # Documentation
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm manifest:generate` | Regenerate asset manifest |
| `pnpm audio:sprite` | Build audio sprite map |
| `pnpm audio:probe` | Check ffmpeg installation |
| `pnpm doctor` | Validate project setup |
| `pnpm clean` | Remove build artifacts |

## Engine Integration

This template uses the Slot Frontend Engine as a local dependency:

```json
{
  "dependencies": {
    "slot-frontend-engine": "file:../SlotFEngine"
  }
}
```

### Install Engine Locally

```bash
# From template directory
pnpm install
```

### Import Engine APIs

```typescript
import {
  Game,
  type GameOptions,
  type SlotConfig,
  type SpinFeelConfig,
  premiumPreset,
} from 'slot-frontend-engine';
```

## How to Create a New Slot Theme

### 1. Update Symbols (`src/config/slotConfig.ts`)

```typescript
export const SymbolId = {
  CHERRY: 0,
  LEMON: 1,
  // ... add your symbols
} as const;

export const slotConfig: SlotConfig = {
  gameId: 'my-slot-game',
  gameName: 'My Slot Game',
  symbols: [
    { id: 0, name: 'Cherry', displayType: 'sprite', spriteKey: 'sym_cherry' },
    // ... define all symbols
  ],
  paytable: [
    { symbolId: 0, payouts: { '3': 5, '4': 15, '5': 40 } },
    // ... define payouts
  ],
  // ...
};
```

### 2. Add Assets

1. Place boot assets in `assets/boot/`:
   - `logo_game.png` - Game logo
   - `loading.png` - Loading indicator (optional)

2. Place main assets in `assets/main/`:
   - `symbols/sym_*.png` - Symbol images (140x140 recommended)
   - `backgrounds/bg_main.png` - Background (1280x720)

3. Place audio in `assets/audio/sfx/`:
   - `ReelStart.mp3`, `ReelStop.mp3`, etc.

### 3. Regenerate Manifest

```bash
pnpm manifest:generate
```

### 4. Update Theme (`src/config/themeConfig.ts`)

```typescript
export const colors = {
  primary: 0xd4af37,    // Your primary color
  bgDark: 0x1a0a0a,     // Background color
  // ...
};

export const bootConfig: Partial<BootConfig> = {
  loading: {
    logo: { type: 'image', value: 'logo_game' },
    loader: { type: 'bar', bar: { fillColor: colors.primary } },
  },
  // ...
};
```

### 5. Customize Spin Feel (`src/config/spinFeelConfig.ts`)

```typescript
export const spinFeelConfig: SpinFeelConfig = {
  ...premiumPreset,
  presetName: 'my-game',
  symbolHeightPx: 140,
  stopDelayMs: [0, 120, 240, 360, 480],
  audioCues: {
    spinStart: 'ReelStart',
    reelStop: 'ReelStop',
    // ...
  },
};
```

## Custom Scenes

Override default scenes via factories in `src/scenes/`:

```typescript
// src/scenes/index.ts
export const sceneFactories: SceneFactories = {
  loading: (ctx) => new CustomLoadingScene(ctx),
  start: (ctx) => new CustomStartScene(ctx),
  // game: (ctx) => new CustomGameScene(ctx), // Optional
};

// Pass to Game
const game = new Game({
  scenes: sceneFactories,
  // ...
});
```

### Scene Requirements

- **Loading Scene**: Must implement `ILoadingScene` with `setProgress(progress, status)`
- **Start Scene**: Must implement `IStartScene` with `setOnStart(callback)`
- **Game Scene**: Receives full `SceneContext` for slot gameplay

## How to Swap Theme Assets

This template includes visual parity features matching the reference project (Dragon Blingo).
Here's how to swap assets for your own theme:

### Boot Bundle Assets (Split-Door Loading Screen)

Replace these files in `assets/boot/`:

| File | Purpose | Recommended Size |
|------|---------|------------------|
| `bg_left.png` | Left door half | 960×1080 |
| `bg_right.png` | Right door half | 960×1080 |
| `logo_game.png` | Game logo | ~600×300 (centered) |
| `Gang.ttf` | Custom font | TTF format |

### Audio Assets

Add/replace these in `assets/main/audio/` and update manifest:

| Asset Key | Purpose |
|-----------|---------|
| `ReelStart` | Plays when spin starts |
| `ReelSpinLoop` | Loops during spin (fades on stop) |
| `ReelStop_V1/V2/V3` | Cycles through on each reel stop |
| `door_open` | Door animation sound |

### Visual Configuration

Edit `src/config/themeConfig.ts`:

```typescript
// Update referenceVisualConfig for boot screens
export const referenceVisualConfig = {
  doors: {
    leftImage: 'bg_left',    // Boot bundle asset key
    rightImage: 'bg_right',
  },
  logo: {
    assetKey: 'logo_game',
    yOffset: -41,            // Pixels from vertical center
  },
  loader: {
    text: 'LOADING...',
    fontFamily: 'Gang',      // Must match loaded font
    fillColor: 0xfb0058,     // Progress fill color
  },
  doorAnimation: {
    durationMs: 2000,        // Door open duration
    doorSound: 'door_open',  // Audio asset key
  },
};
```

### Audio Configuration

Edit `src/config/spinFeelConfig.ts`:

```typescript
audioCues: {
  spinStart: 'ReelStart',
  spinLoop: 'ReelSpinLoop',
  spinLoopFadeOutMs: 200,
  reelStop: ['ReelStop_V1', 'ReelStop_V2', 'ReelStop_V3'], // Rotation
  // Win sounds...
},
```

## Differences from Reference Project

This template improves upon the reference project:

| Reference | Template | Why Better |
|-----------|----------|------------|
| Global `gameState` | DI Container | Testable, no singletons |
| GSAP animations | TweenService | Deterministic, cleanup-safe |
| Direct Pixi | Engine abstraction | Reusable across games |
| Hardcoded values | Config files | Theme-swappable |
| No audio looping | Spin loop + fadeout | Better UX |
| Single stop sound | Sound rotation | More variety |

## Production Checklist

See [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)
See [docs/PARITY_CHECKLIST.md](docs/PARITY_CHECKLIST.md) for visual parity status

## DEV Keyboard Controls

| Key | Action |
|-----|--------|
| Space | Spin |
| T | Turbo spin |
| R | Add 100 credits |
| B | Cycle bet |

---

Built with [Slot Frontend Engine](../SlotFEngine)

