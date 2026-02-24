# Acceptance — Turbo Fast Mode 2026

## Contract statement

**Skip Animations is a branch; Real Turbo is a profile; they must not be coupled.**

---

## Manual acceptance checklist

- [ ] **Skip Animations OFF, Turbo OFF:** Spin runs full animation; reels stop in order; win presentation plays. Timing logs (DEV_SPIN_TIMING / DEV_SPIN_TIMING_TRACE) show normal durations.
- [ ] **Skip Animations ON:** Spin snaps to result immediately; no reel motion; win text/highlights appear at once. Same final grid and balance as normal. With DEV: `[SKIP] enabled → Turbo speed profile ignored for this spin` when spinning.
- [ ] **Turbo ON, Skip Animations OFF:** Spin is animated but faster (reels scroll by config.turbo.timeScale, stop delays use config.turbo.stopDelayMs or scaled base, win timeline via TweenService timeScale). Win presentation runs (normal path). No crashes, no desync.
- [ ] **Input unlock:** SPIN_COMPLETE / input unlock occurs after presentation in all modes. No double-spin or stuck lock.
- [ ] **Visuals:** Highlights, paylines (if showPaylines), big win, dim overlay still render in both normal and skip paths.
- [ ] **Multi-stage:** If outcome has multiple stages, skip path shows correct final win and base grid; turbo path runs normal stage flow. No post-stop mutation logs; same final grid as normal.
- [ ] **Stuck turbo edge test:** Trigger a backend failure or throw once in result handler (DEV-only). Ensure `reelsView.timeScale` and `tweenService.timeScale` reset to 1 after failure. Next spin in normal must look normal.

## Timing comparison (example)

| Mode | FIRST_REEL_STOPPED | ALL_REELS_STOPPED | WIN_PRESENTATION_DONE | SPIN_COMPLETE |
|------|--------------------|-------------------|------------------------|---------------|
| Normal | ~500–800 ms | ~1200–2500 ms | +400–2000 ms | total |
| Turbo (fast) | ~250–400 ms | ~600–1250 ms | +200–1000 ms | total |
| Skip Animations | — | instant | instant | <200 ms |

(Exact numbers depend on config; use DEV_SPIN_TIMING / DEV_SPIN_TIMING_TRACE logs to capture.)

## Runtime verification (with DEV flags)

1. **5 spins normal** — record FIRST_REEL_STOPPED, ALL_REELS_STOPPED, WIN_PRESENTATION_DONE.
2. **5 spins Real Turbo** (Turbo ON, Skip OFF) — same milestones; elapsedMs should be shorter.
3. **5 spins Skip Animations** (Skip ON) — SPIN_REQUESTED → SPIN_COMPLETE <200 ms; no reel motion.

## Parity

- Same math/outcome in all modes.
- Skip Animations = instant path only; Turbo = normal path with scaled time.
- No refactors beyond the listed changes; minimal blast radius.

## Skip animations parity (certification)

- [ ] **Skip uses final stage grid:** When outcome has multiple stages (e.g. cascade), Skip path shows the last stage grid (same as normal flow after all cascades). Single-stage outcome unchanged. DEV: `SKIP_APPLY_GRID_STAGE_INDEX` / `stageCount` in logs.
- [ ] **Skip draws paylines:** With Skip ON and a line win, paylines are drawn when `showPaylines` is enabled (same layer and `LineWinVisualizer` as normal). With no line wins, no payline draw. DEV: `SKIP_PAYLINES_DRAWN count` / `showPaylines` in logs.

## DEV guard: TweenService timeScale outside spin

- **DEV_TWEEN_TIMESCALE_GUARD** (default false): When enabled, any call to `tweenService.setTimeScale(x)` with `x !== 1` while `spinActive === false` logs `TWEEN_TIMESCALE_OUTSIDE_SPIN` with stack. Use to detect unintended scaling outside the spin lifecycle. No production behavior change; log only.
- [ ] **Guard verification:** Normal gameplay logs nothing. If timescale is set outside spin (e.g. stray call), console shows ERROR and stack.
