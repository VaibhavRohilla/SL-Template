# Line Win Overlay — Presentation Flow and Timing

Recon-only. How wins are sequenced, how line overlay syncs with highlights/audio, and effect of timeScale.

---

## Win sequencing

| Mode | Flow | Evidence |
|------|------|----------|
| **Single win** | presentSingleWin(win): clear highlights, createWinHighlights(win), triggerSymbolWinAnimations(win), enqueue wait singleWinDurationMs, then betweenWinsDelayMs (if !skipRequested). | DefaultWinPresenterStrategy.ts 364–383 |
| **Multiple wins (individual)** | When showIndividualWins && (sortedWins.length > 1 \|\| lineWins.length > 0): first presentLineWins(lineWins) [line path + symbol anims + wait singleWinDurationMs + betweenWinsDelayMs], then for each sortedWin presentSingleWin(win). | DefaultWinPresenterStrategy.ts 174–184 |
| **All wins (final hold)** | presentAllWins(wins, lineWins): clear, draw all line paths (visualizeMultipleLineWins), createWinHighlights for all, triggerSymbolWinAnimations for all + lineWins, enqueue wait allWinsDurationMs. | DefaultWinPresenterStrategy.ts 385–412 |
| **Between-wins delay** | betweenWinsDelayMs enqueued after each single-win segment (378–382). | DefaultWinPresenterStrategy.ts 378–382 |

Durations come from **WinPresenterConfig**: `timing.singleWinDurationMs`, `timing.betweenWinsDelayMs`, `timing.allWinsDurationMs` (WinPresenterConfig.ts 79–88). SlotScene override: singleWinDurationMs 1000, betweenWinsDelayMs 150, allWinsDurationMs 1200 (SlotScene.ts 762–766).

---

## Line overlay sync with symbol highlights and audio

- **Highlights:** presentLineWins and presentAllWins call createWinHighlights (for PresentableWin) and triggerSymbolWinAnimations. Line path is drawn in the same phase (presentLineWins: visualizeMultipleLineWins then triggerSymbolWinAnimations; presentAllWins: visualizeMultipleLineWins, then createWinHighlights for all wins, then triggerSymbolWinAnimations for wins and lineWins). So **line path and highlights are shown together** for the same win set; ordering is: path drawn (or enqueued), then highlights created, then symbol callbacks.
- **Audio:** playTierAudio(currentTier) is called once at start of present() (98); no per-line or per-win audio in the cited code. So **one tier cue for the whole presentation**; line overlay is not tied to a separate audio trigger.

---

## Line draw animation duration

Line path can be **animated** (segment-by-segment) or **instant**. Duration when animated: `LineWinVisualizerConfig.drawingDurationMs` (default 500) (LineWinVisualizer.ts 21, 34). DrawLineWinCommand uses this for segment progress (DrawLineWinCommand.ts 44–49). So line draw and win-hold waits are all driven by the **same timeline** (timelinePlanner); they run in sequence with the same clock.

---

## TweenService timeScale and timeline

- **Timeline:** TimelinePlanner.update(deltaMs) is called from the app tick (e.g. sceneManager.update(ticker.deltaMS)); CommandQueue runs WaitCommand and DrawLineWinCommand with **raw deltaMs** (WaitCommand.ts 35–38; DrawLineWinCommand.ts 66–73). So **timeline does not apply TweenService timeScale** to wait or line-draw progress; it uses whatever deltaMs the scene passes.
- **App update:** App.ts 647: `this.sceneManager?.update(ticker.deltaMS)` and `services.tweenService.update(ticker.deltaMS)`. So **deltaMs is raw ticker delta**. Real Turbo could shorten win presentation by either: (1) passing scaled delta to timeline (e.g. deltaMs * timeScale) if the scene did that, or (2) using shorter config durations. As implemented, **TweenService timeScale does not change timeline wait or line-draw duration** unless the scene or a wrapper scales the delta passed to timelinePlanner.update(). Real Turbo spec (docs/recon/turbo_fast_mode_2026/05_REAL_TURBO_SPEC.md) says win presentation can be shortened via “TweenService timeScale > 1 or shorter durations”; today the timeline itself uses unscaled delta.

Summary: **Win presentation waits and line-draw animation use config durations and raw frame delta; TweenService timeScale does not currently scale these.** To get faster win presentation in Real Turbo, either scale the delta into the timeline or reduce timing config values.
