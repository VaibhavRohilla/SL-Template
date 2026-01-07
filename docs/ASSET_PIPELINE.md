# Asset Pipeline

Guide for managing game assets: manifest generation, audio sprites, and organization.

## Directory Structure

```
assets/
├── boot/                   # Boot bundle (loaded first)
│   ├── logo_game.png       # Game logo
│   ├── loading.png         # Loading indicator
│   └── bg_*.png            # Boot backgrounds
├── main/                   # Main bundle (loaded during loading screen)
│   ├── symbols/            # Slot symbol images
│   ├── backgrounds/        # Game backgrounds
│   ├── ui/                 # UI elements
│   ├── fonts/              # Bitmap fonts (.fnt + .png)
│   └── ...
├── audio/
│   ├── raw/                # Raw audio files (for sprite generation)
│   ├── sfx/                # Individual sound effects
│   └── sprites/            # Generated audio sprites
└── manifest.json           # Asset manifest (generated)
```

## Manifest Generation

### Generate Manifest

```bash
pnpm manifest:generate
```

This scans `assets/boot/` and `assets/main/` and creates `assets/manifest.json`.

### Manifest Schema

```json
{
  "version": "1.0.0",
  "baseUrl": "assets/",
  "bundles": [
    {
      "name": "boot",
      "priority": 0,
      "required": true,
      "assets": [
        { "key": "logo_game", "type": "texture", "url": "boot/logo_game.png" }
      ]
    },
    {
      "name": "main",
      "priority": 1,
      "required": true,
      "assets": [
        { "key": "sym_dragon", "type": "texture", "url": "main/symbols/DRAGON.png" },
        { "key": "ReelStart", "type": "audio", "url": "audio/sfx/ReelStart.mp3" }
      ]
    }
  ]
}
```

### Asset Types

| Extension | Type |
|-----------|------|
| `.png`, `.jpg`, `.webp` | `texture` |
| `.json` (with spritesheet) | `spritesheet` |
| `.json` (with skeleton) | `spine` |
| `.mp3`, `.ogg`, `.wav` | `audio` |
| `.woff`, `.woff2`, `.ttf` | `font` |

## Boot vs Main Bundle

### Boot Bundle (`assets/boot/`)

- Loads **before** loading screen appears
- Keep minimal (~500KB max)
- Contains:
  - Game logo
  - Loading screen background
  - Critical fonts

### Main Bundle (`assets/main/`)

- Loads **while** loading screen is visible
- Contains all game assets:
  - Symbols
  - Backgrounds
  - UI elements
  - Audio

## Adding New Assets

### 1. Add Files

```bash
# Add symbol
cp my_symbol.png assets/main/symbols/

# Add sound
cp my_sound.mp3 assets/audio/sfx/
```

### 2. Regenerate Manifest

```bash
pnpm manifest:generate
```

### 3. Reference in Config

```typescript
// src/config/slotConfig.ts
{
  id: 10,
  name: 'New Symbol',
  displayType: 'sprite',
  spriteKey: 'my_symbol',  // Matches filename without extension
}
```

## Audio Sprite Pipeline

### Prerequisites

```bash
# Install ffmpeg
winget install ffmpeg  # Windows
brew install ffmpeg    # macOS
apt install ffmpeg     # Linux

# Verify installation
pnpm audio:probe
```

### Generate Audio Sprite

1. Place raw audio files in `assets/audio/raw/`
2. Run:

```bash
pnpm audio:sprite
```

3. Output in `assets/audio/sprites/`:
   - `sfx_sprite.json` - Sprite map with timing
   - (Manual step: concatenate with ffmpeg)

### Sprite Map Format

```json
{
  "src": ["sfx_sprite.mp3", "sfx_sprite.ogg"],
  "sprite": {
    "ReelStart": [0, 500],
    "ReelStop": [600, 300],
    "WinSmall": [1000, 800]
  }
}
```

Format: `"name": [startMs, durationMs]`

### Using Audio Sprites

```typescript
// Via engine's audio bus
ctx.audioBus.playSprite('sfx_sprite', 'ReelStart');
```

## Symbol Specifications

### Recommended Size

- **Width:** 140px
- **Height:** 140px
- **Format:** PNG with transparency

### Naming Convention

```
sym_<name>.png
# Examples:
sym_dragon.png
sym_wild.png
sym_scatter.png
```

### High-DPI Support

For retina displays, provide 2x versions:
```
sym_dragon.png      # 140x140
sym_dragon@2x.png   # 280x280
```

## Fonts

### Bitmap Fonts

Place `.fnt` and corresponding `.png` in same directory:
```
assets/main/fonts/
├── Dragon Gold.fnt
└── Dragon Gold.png
```

### Web Fonts

```
assets/main/fonts/
└── Roboto.woff2
```

## Troubleshooting

### Asset Not Loading

1. Check manifest includes the asset
2. Verify file exists at specified path
3. Check browser console for 404 errors

### Wrong Asset Key

Asset keys are generated from filename:
- `DRAGON.png` → `DRAGON` (uppercase preserved)
- `my-symbol.png` → `my_symbol` (dashes to underscores)

### Regenerate After Changes

Always run `pnpm manifest:generate` after adding/removing assets.

