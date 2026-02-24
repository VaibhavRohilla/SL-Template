# Line Win Overlay — Rendering Pipeline

Recon-only. Current LineWinVisualizer implementation, drawing style, clearing, and performance notes.

---

## LineWinVisualizer implementation

| Aspect | Evidence |
|--------|----------|
| **File** | SL-Engine `src/view/win/LineWinVisualizer.ts` |
| **Constructor** | Takes `reelsView`, `tweenService`, `timelinePlanner`, optional `config`, optional `container`. Creates single `Graphics`, adds to `container ?? reelsView.container.parent` (56–73). |
| **Drawing** | One shared `Graphics` instance (68). No sprite or texture usage. |

---

## What it draws

| Element | Method | Technique | Evidence |
|---------|--------|-----------|----------|
| **Path** | `drawPaylinePath`, `drawPathFromPositions` | `graphics.moveTo` first point; `lineTo` each next; single `graphics.stroke({ width, color, alpha })` | 174–188, 219–224 |
| **Segments** | Straight segments only | No bezier; polyline through symbol centers. | 137–167 (points from getSymbolAt + getGlobalPosition) |
| **Per-cell anchors** | Implicit | Points are symbol centers; no explicit “anchor” shape per cell. | 144–156 |
| **Thickness, color, alpha** | Config | `lineThickness`, `lineColor`, `lineAlpha` from LineWinVisualizerConfig (12–18, 31–33). Default 3, 0x00ff00, 0.8. | 31–33, 184–188, 227–231 |
| **Caps/joins** | Default Pixi | No explicit cap/join API used; Pixi Graphics default. | N/A |
| **Line label** | `addLineLabel` | `graphics.circle` + fill for background; `new Text(lineId)` added to `graphics.parent` (not to graphics). | 281–297 |

---

## Clearing behavior

| When | What | Evidence |
|------|------|----------|
| **Start of visualizeMultipleLineWins** | `this.graphics.clear()` | LineWinVisualizer.ts 99 |
| **Start of visualizeLineWin** | `this.graphics.clear()` | LineWinVisualizer.ts 80 |
| **Strategy clear()** | `lineWinVisualizer.clear()` → `graphics.clear()` | DefaultWinPresenterStrategy.ts 304–306; LineWinVisualizer.ts 303–305 |
| **Per-win in animateLineDrawing** | DrawLineWinCommand redraws segment-by-segment; each `drawProgress` does `this.config.graphics.clear()` then redraw up to current progress | DrawLineWinCommand.ts 97, 133–134 |

**Line labels:** Text objects are added to `this.graphics.parent`. `clear()` only clears the Graphics; it does **not** remove or destroy Text children. So labels can persist or leak until container is cleared elsewhere (e.g. next full present or destroy). Evidence: LineWinVisualizer.ts 297 `this.graphics.parent?.addChild(text)`; 303–305 `clear()` only calls `this.graphics.clear()`.

---

## Pooling

- No object pooling. One Graphics per LineWinVisualizer instance; strategy holds one `lineWinVisualizer` (lazy-created). No sprite pool; no segment pool.

---

## PNG / texture support

- **None.** No texture keys, no sprites, no PNG assets. Only Pixi Graphics. Evidence: no `Texture`, `Sprite`, or asset keys in LineWinVisualizer.ts; payline recon (docs/recon/payline_system_existing) states “LineWinVisualizer uses only Graphics”.

---

## Graphics renderer performance profile

| Concern | Where | Note |
|---------|--------|------|
| **Allocation** | New Graphics once per visualizer (lazy). New Text per line when `showLineLabel` (281–297). DrawLineWinCommand created per line when animating (255–274). | Moderate: one Graphics long-lived; Text and commands per presentation. |
| **Redraw per frame** | DrawLineWinCommand.update(): each frame calls `graphics.clear()` then redraws path up to current progress (97, 100–125). | Full path redraw every frame during line-draw animation; single stroke at end. |
| **Clear** | graphics.clear() is cheap (Pixi clears command buffer for that Graphics). | Low cost. |
| **getGlobalPosition** | Called once per point when building path (not per frame). | Low. |

Potential hotspot: many line wins with animated drawing → multiple DrawLineWinCommands, each clearing and redrawing its path every frame until complete. For instant (skip) path, no per-frame redraw.
