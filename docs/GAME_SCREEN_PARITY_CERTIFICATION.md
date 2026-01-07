# Game Screen Parity Certification

This document certifies the completion of Game Screen visual parity implementation between the Template (slot-game-template) and Reference (blingo_front) projects.

---

## Summary

**Status**: ✅ **PHASE 3 COMPLETE - Implementation Done**

The Template project now implements a custom `CustomGameScene` that matches the Reference (Slingo/bingo-style game) layout structure, replacing the default slot machine layout.

---

## What Changed

### New Files Created

#### Layout System
| File | Purpose |
|------|---------|
| `src/layout/DesignLayout.ts` | Central layout constants matching reference exact values (1920×1080 design, positions, gaps) |
| `src/layout/index.ts` | Layout module exports |

#### Components (Slingo-style)
| File | Purpose |
|------|---------|
| `src/components/SlingoGrid.ts` | 5×5 number grid with cell states (normal/selectable/matched) |
| `src/components/SlingoSpinner.ts` | 1-row horizontal spinner (5 reels spinning vertically) |
| `src/components/BonusInfoPanel.ts` | Left panel showing win progress (3-match to Full House) |
| `src/components/GameButtonsPanel.ts` | Right panel with menu, spin, stake buttons and spin counter |
| `src/components/GameBottomBar.ts` | Bottom HUD bar showing stake, description, balance |
| `src/components/index.ts` | Components module exports |

#### Scene
| File | Purpose |
|------|---------|
| `src/scenes/CustomGameScene.ts` | Main game scene implementing reference layout and layer structure |

### Files Modified

| File | Change |
|------|--------|
| `src/scenes/index.ts` | Added `createGameScene` factory and `CustomGameScene` export |

---

## Reference Layout Spec Implemented

### Design Resolution
- **Width**: 1920px
- **Height**: 1080px
- **Scaling**: Engine's "contain" (scale-to-fit) strategy preserved

### Layer Hierarchy (Z-Order)
```
CustomGameScene.container
├── backgroundLayer (z=0)
│   └── Solid dark background (0x1a0a0a)
├── gameLayer (z=1)
│   └── GameContainer (pivot center, scalable)
│       ├── SlingoGrid (5×5 number grid)
│       └── SlingoSpinner (1-row horizontal spinner)
├── overlayLayer (z=2)
│   └── (Reserved for frame/effects)
└── uiLayer (z=3)
    ├── BonusInfoPanel (left)
    ├── GameButtonsPanel (right)
    └── GameBottomBar (bottom)
```

### Position Constants (Reference Exact Values)
| Element | X | Y | Notes |
|---------|---|---|-------|
| Game Table | 594.5 | 94 | `width * 0.5 - 365.5`, `height * 0.5 - 453 + 7` |
| Spinner Y Offset | - | 766 | `symbolH * 5.5 - 4` from grid top |
| Bonus Info | 283 | 31 | Left panel |
| Game Buttons | 1359 | 109 | Right panel |
| Game Bottom | 0 | 1010 | `DESIGN_H - barHeight` |

### Symbol/Cell Dimensions
| Property | Value |
|----------|-------|
| Symbol Width | 140px |
| Symbol Height | 140px |
| Horizontal Gap | 9px |
| Vertical Gap | 8px |
| Grid Columns | 5 |
| Grid Rows | 5 |
| Total Grid Width | 736px |
| Total Grid Height | 732px |

---

## Parity Checklist

### P0 Items (Must Fix) - ✅ All Implemented

| Item | Status | Implementation |
|------|--------|----------------|
| Design Resolution | ✅ | 1920×1080 via `DesignLayout.ts` |
| Canvas Scaling | ✅ | Engine "contain" strategy preserved |
| Layer Hierarchy | ✅ | 4-layer structure in CustomGameScene |
| Game Table Position | ✅ | Exact reference values (594.5, 94) |
| Grid Layout | ✅ | 5×5 SlingoGrid with 140px cells, 9px/8px gaps |
| Spinner Layout | ✅ | 1-row SlingoSpinner, 5 reels |
| Left Panel (BonusInfo) | ✅ | 11 boxes at (283, 31) |
| Right Panel (GameButtons) | ✅ | Menu/Spin/Stake at (1359, 109) |
| Bottom Bar (GameBottom) | ✅ | Full-width at bottom |
| Reveal Animation | ✅ | Scale 0.9→1.0 + fade |

### P1 Items (Polish) - ⏳ Partial

| Item | Status | Notes |
|------|--------|-------|
| Video Background | ⏳ | Solid color placeholder; video requires engine extension |
| Stop Stagger | ✅ | 150ms stagger implemented |
| Bounce Animation | ⏳ | Basic snap; needs tuning |
| Sound Cues | ✅ | ReelSpinLoop, ReelStop_V1/2/3 |
| Win Highlight | ⏳ | Cell matched state; needs effects |

---

## Debug Mode

The `CustomGameScene` includes a debug mode to verify layout rects:

```typescript
// Enable debug overlay
scene.setDebugMode({ showLayoutRects: true });
```

This draws colored outlines for:
- Grid (red)
- Spinner (green)
- BonusInfo (blue)
- GameButtons (magenta)
- GameBottom (yellow)

---

## Remaining Deltas

### Not Implemented (Engine Limitation)
1. **Video Background**: Engine's `BackgroundView` supports image/color/gradient but not video. Would require engine extension.
2. **Server Integration**: Spin results are mocked; real game needs backend connection.

### Cosmetic Differences
1. **Font Styling**: Using system Arial; reference may use custom fonts from assets.
2. **Cell Textures**: Using Graphics primitives; reference uses `cell` texture sprites.
3. **Special Symbols**: Placeholder graphics for joker/free_spin/coin; need sprite assets.

---

## Verification Steps

### Manual Testing
1. Run `pnpm dev` in slot-game-template
2. Verify loading screen → start screen → game screen flow
3. Confirm game screen layout matches reference positions
4. Test spin functionality (click SPIN button)
5. Verify grid matches mark on spinner results
6. Check bonus panel updates on matches

### Automated Checks
```bash
cd D:\PersonalProjects\slot-game-template
pnpm typecheck  # TypeScript type checking
pnpm build      # Production build
pnpm test       # Unit tests (if configured)
```

---

## Architectural Notes

### Engine Changes
**None required**. All customization done through:
- Custom scene (`CustomGameScene`)
- Theme config (`themeConfig.ts`)
- Layout constants (`DesignLayout.ts`)

### Template Extension Points
1. **`sceneFactories.game`**: Points to `createGameScene` for custom scene
2. **`DesignLayout.ts`**: Centralized layout constants for easy tuning
3. **Components**: Modular Slingo-specific components in `src/components/`

---

## Sign-Off

| Phase | Status | Date |
|-------|--------|------|
| Phase 1 - Layout Spec | ✅ Complete | Jan 6, 2026 |
| Phase 2 - Root Cause | ✅ Complete | Jan 6, 2026 |
| Phase 3 - Implementation | ✅ Complete | Jan 6, 2026 |
| Phase 4 - Feel Tuning | ⏳ Pending | - |
| Phase 5 - Verification | ⏳ Pending | - |

---

*Generated by Game Screen Parity Implementation Process*

