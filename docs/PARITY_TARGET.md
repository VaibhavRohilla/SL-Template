# Visual Parity Target Document

This document describes the exact visual specifications extracted from the reference project
(blingo_front) that our template must match.

> **Note:** The reference is a Slingo game (bingo+slots hybrid), not a traditional video slot.
> We extract visual/UX patterns, NOT game mechanics.

---

## 1. Design Size & Scaling

### Design Dimensions
```
DESIGN_WIDTH:  1920px
DESIGN_HEIGHT: 1080px
ASPECT_RATIO:  16:9 (1.777...)
```

### Scaling Policy: **FIT (Letterbox)**

The reference uses a **FIT** scaling strategy with letterboxing:

```typescript
// Reference resize logic (main.ts):
const designRatio = DESIGN_WIDTH / DESIGN_HEIGHT;  // 1920/1080 = 1.777...

if (windowRatio > designRatio) {
  // Window is wider than design - fit to height
  width = windowHeight * designRatio;
  height = windowHeight;
} else {
  // Window is taller than design - fit to width
  width = windowWidth;
  height = windowWidth / designRatio;
}

// Canvas positioning: centered with CSS
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
canvas.style.position = 'absolute';
canvas.style.left = `${(windowWidth - width) / 2}px`;
canvas.style.top = `${(windowHeight - height) / 2}px`;
```

### Renderer Configuration
- **Renderer size**: Always `DESIGN_WIDTH × DESIGN_HEIGHT` (1920×1080)
- **Canvas CSS size**: Scaled to fit viewport while maintaining aspect ratio
- **Resolution**: `Math.max(window.devicePixelRatio, 2)` - minimum 2x for crisp display
- **Antialias**: `true`
- **Background**: `0x000000` (black)

### Key Insight
The renderer always renders at design size (1920×1080). Scaling is achieved purely via
CSS sizing of the canvas element, not by scaling stage contents.

---

## 2. HTML/CSS Structure

### Body Styles
```css
html, body {
  overflow: hidden !important;
  height: 100% !important;
  margin: 0;
  padding: 0;
  background-color: #000000;  /* Black letterbox bars */
  position: relative;
}
```

### Canvas Styles
```css
canvas {
  margin: 0;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);  /* Center in viewport */
}
```

### Pre-Pixi Loading Spinner
Reference shows a CSS spinner before PixiJS initializes:
```css
.loader {
  border: 3px solid #ff0054;
  border-radius: 50%;
  border-right-color: transparent;
  border-bottom-color: transparent;
  width: 80px;
  height: 80px;
  animation: loading 700ms linear infinite;
}
```

---

## 3. Boot Flow & Screens

### Screen Transition Order
```
[CSS Spinner] → [LoadScreen] → [GameScreen with DoorSymbol overlay]
                                         ↓ (tap to start)
                               [Door animation opens]
                                         ↓
                               [Main game revealed]
```

### Key Difference from Engine
- Reference has NO separate "StartScene" - instead uses `DoorSymbol` overlay on GameScreen
- "Tap to start" is handled by `DoorSymbol.showGame()` method
- Our engine's Loading → Start → Game flow maps to:
  - **Loading** = Reference LoadScreen
  - **Start** = Reference DoorSymbol (doors closed)  
  - **Game** = Reference GameScreen (doors open)

---

## 4. LoadScreen Layout

### Visual Elements (in z-order, bottom to top)
1. **Split Background** - Two halves that form the "doors"
   - `background_left.png` - Left door half
   - `background_right.png` - Right door half
   - Each sized to 960×1080 (half of design)
   
2. **Logo** - Centered game logo
   - `logo.png`
   - Position: Center of screen, offset up by ~41px
   - Anchor: center (0.5, 0.5)
   
3. **Progress Bar** - Loading text with fill reveal
   - `loading.png` - Bar image asset
   - "LOADING..." text in white, revealed progressively in pink (#fb0058)
   - Font: "Gang" custom font, 35px
   - Position: Centered horizontally, Y = `height/2 + 433`

4. **Rotate Alert** (for portrait mode) - Hidden in landscape

### Exact Coordinates (at 1920×1080)
```
Logo:
  x: 960 (width / 2)
  y: 499 (height / 2 - 41)
  anchor: (0.5, 0.5)

Progress Bar:
  x: 960 - progressBar.width / 2
  y: 973 (height / 2 + 433)

Background Left:
  x: 0
  width: 960 (half of screen)

Background Right:  
  x: 960
  width: 960 (half of screen)
```

### Progress Bar Behavior
- Text: "LOADING..." initially
- Fill: Pink color (#fb0058) mask reveals colored text from left
- After load complete: Text changes to "CLICK TO START"

---

## 5. Start/Door Screen Layout

The reference combines Start screen into GameScreen with a `DoorSymbol` overlay:

### DoorSymbol Component Layout
```
Logo:
  x: width / 2
  y: height / 2 - 41
  anchor: (0.5, 0.5)

Progress Bar:
  x: width / 2 - progressBar.width / 2  
  y: height / 2 + 433
  text: "CLICK TO START"

Background Left:
  anchor: (0.5, 0.5)
  width: 960
  height: 1080
  x: 480 (width / 2)
  y: 540 (height / 2)

Background Right:
  anchor: (0.5, 0.5)
  width: 960  
  height: 1080
  x: 1440 (960 + width / 2)
  y: 540 (height / 2)
```

### Door Opening Animation (REEL_SPEED = 0.2s base)
```javascript
Duration: REEL_SPEED * 10 = 2 seconds

Timeline (simultaneous):
1. Logo & ProgressBar: alpha → 0, scale → 1.2
2. Left door: scale → 1.2, x → -576 (slides left)
3. Right door: scale → 1.2, x → 2496 (slides right)
4. Easing: power1.in

Audio: 'MassiveDoorOpen.mp3' plays at start
```

---

## 6. GameScreen Layout

### Layer Order (bottom to top)
1. **Background** - Video background (`background.mp4`)
2. **BonusInfo Panel** - Left side win tracker
3. **GameTable** - Main 5×5 bingo grid + spin reel
4. **GameButtons** - Right side buttons (spin, stake, menu)
5. **ExtraSymbols** - Decorative corner symbols
6. **GameBottom** - Bottom bar (stake, balance)
7. **BonusSlot** - Bonus game overlay (hidden initially)
8. **DoorSymbol** - Start screen overlay (z-index: 11)
9. **RotateAlert** - Portrait mode warning (z-index: 50)

### Positions at 1920×1080 (Landscape)
```
Background:
  x: width / 2 = 960
  y: height / 2 = 540
  (video sprite anchored at center, sized to fill)

BonusInfo:
  x: 283
  y: 31

GameTable:
  x: width * 0.5 - 365.5 = 594.5
  y: height * 0.5 - 453 + 7 = 94

GameButtons:
  x: 1359
  y: height * 0.5 - gameButtons.height * 0.5 + 109

ExtraSymbols:
  x: 0
  y: 0

GameBottom:
  x: 0  
  y: height - gameBottom.height
  (anchored to bottom)

BonusSlot:
  x: width / 2 - bonusSlot.width / 2
  y: height / 2 - bonusSlot.height / 2 + 78
  (centered with 78px Y offset)
```

---

## 7. Typography

### Custom Fonts
| Font Name | Usage | File |
|-----------|-------|------|
| Gang | Loading text, some UI | `Gang.ttf` |
| Roboto | Most game text | `Roboto.woff` |

### Common Text Styles
```javascript
// Loading text
{
  fill: '0xffffff',
  fontFamily: 'Gang',
  fontSize: '35px',
}

// Loading text colored
{
  fill: '#fb0058',
  stroke: '#fb0058',
  strokeThickness: 1,
  fontFamily: 'Gang',
  fontSize: '35px',
}

// Game labels
{
  fill: '#ffd800',  // Gold for labels
  fontFamily: 'Roboto',
  fontSize: '22px',
  letterSpacing: 1.7,
}

// Game values
{
  fill: '0xffffff',
  fontFamily: 'Roboto', 
  fontSize: '30px',
  fontWeight: 'bold',
}
```

---

## 8. Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Black | `#000000` | App background |
| Pink/Magenta | `#fb0058` / `#ff0054` | Accent, loading fill |
| Gold | `#ffd800` | Labels, highlights |
| White | `0xffffff` | Text values |

---

## 9. Audio Integration Points

### Boot/Start Sounds
| Event | Sound File |
|-------|------------|
| Door open (tap to start) | `MassiveDoorOpen.mp3` |
| BGM start (after doors) | `music_loop.mp3` |

### Spin Sounds
| Event | Sound File |
|-------|------------|
| Spin start | `ReelStart.mp3` |
| Spin loop | `ReelSpinLoop.mp3` |
| Reel stop (cycling) | `ReelStop_V1.mp3`, `ReelStop_V2.mp3`, `ReelStop_V3.mp3` |

---

## 10. Portrait Mode Handling

When `width < height` AND not desktop:
- Show `RotateAlert` component (alpha = 1)
- Hide game content (gameContainer.alpha = 0)
- Message to rotate device to landscape

---

## 11. Mapping to Engine Architecture

| Reference | Engine Equivalent |
|-----------|------------------|
| LoadScreen | LoadingScene |
| DoorSymbol overlay | StartScene |
| GameScreen (revealed) | SlotGameScene |
| `navigation.showScreen()` | `SceneManager.setScene()` |
| `gameState` singleton | DI container services |
| GSAP animations | TweenService |
| @pixi/sound | AudioBus (Howler) |

---

## 12. Required Template Changes Summary

### Config Changes Needed
1. Design size: 1920×1080 (currently 1280×720)
2. Scale mode: FIT with letterbox
3. Boot background: Split door images
4. Logo position: center, Y offset -41px
5. Loader: Text reveal style (not progress bar)

### Scene Implementation Needs
1. **CustomLoadingScene**: Match door background + logo + progress text
2. **CustomStartScene**: "CLICK TO START" with door animation
3. **CustomGameScene**: Video background (or fallback image)

### Asset Requirements
- `background_left.png` (960×1080)
- `background_right.png` (960×1080)
- `logo.png` (variable size, centered)
- `loading.png` (progress bar graphic)
- `background.mp4` (or `background.png` fallback)
- Font: Gang.ttf, Roboto.woff

---

## 13. Acceptance Criteria

✅ Canvas fills viewport with black letterboxing  
✅ Content always 1920×1080 at renderer level  
✅ Loading screen shows split doors + centered logo + progress text  
✅ Progress text reveals from left to right (pink over white)  
✅ "CLICK TO START" appears after load  
✅ Tap triggers door animation (doors slide apart, logo fades/scales)  
✅ Door animation takes ~2 seconds with power1.in easing  
✅ Game content revealed behind doors  
✅ Portrait mode shows rotate prompt  

---

*Document generated for slot-game-template visual parity implementation*

