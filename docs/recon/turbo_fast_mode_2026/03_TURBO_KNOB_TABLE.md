# Turbo Knob Table (Fast Turbo Feasibility)

Minimal set of knobs to get Real Turbo without breaking stop physics or outcome.

| Knob | Layer | Affects | Safe to scale? | Risk | Evidence |
|------|-------|---------|----------------|------|----------|
| **timeScale** (ReelsView) | Reels | Spin speed (reel scroll) | YES | Overshoot/jank if too high (e.g. >3) | `ReelsView.ts:210` (deltaMs * this.timeScale); `217–220` setTimeScale. |
| **stopDelayMs** (between reels) | SpinFlow | Stop spacing (delay between onStopReel) | YES | Desync if too low (reels overlap visually) | `SpinFlow.ts:460–465`, `706`, `910`, `919`; use base or config.turbo.stopDelayMs. |
| **minSpinMs** | SpinFlow | Min duration before first stop | YES | UX (too short feels abrupt) | `SpinFlow.ts:885`, `867–877`; can scale or reduce for turbo. |
| **effectiveDeltaMs** (SpinFlow) | SpinFlow | Rate at which delayRemainingMs and spinElapsedMs advance | YES | Same as above | `SpinFlow.ts:452–456`, `461`. |
| **Win wait durations** | Presenter / TimelinePlanner | singleWinDurationMs, betweenWinsDelayMs, allWinsDurationMs | YES | Missing highlights if timeline skipped (we do not skip; we scale) | `DefaultWinPresenterStrategy.ts:309–314`, `327–338`, `364–368`, `387–398`. Commands use TweenService; getTimeScale() scales duration in TweenCommand. |
| **TimelinePlanner speed** | TimelinePlanner | All enqueued wait/tween durations | Indirect | Timeline has no global scale; each command gets duration from config/tweenService | `SlotScene.ts:497` update(deltaMs); commands created with fixed duration — scaling via TweenService.getTimeScale() is the lever. |

---

## Decision: minimal set for Real Turbo

1. **ReelsView.setTimeScale(scale)** — e.g. 2 for turbo. Reel motion 2x faster. Low risk.
2. **SpinFlow speedProfile 'turbo'** (new):
   - Do **not** take onSkipAnimations path (run normal stop sequence).
   - Apply **effectiveDeltaMs = deltaMs * timeScale** (e.g. 2) so min spin wait and inter-reel delays count down faster. Evidence: `SpinFlow.ts:452–453`, `460–465`.
   - Optionally use **config.turbo.stopDelayMs** (or scale base stopDelayMs) when building the stop plan so delays are shorter. Evidence: `SpinFlow.ts:910`, `getStopDelay` in `SpinFeelConfig.ts:299–302`; `config.turbo` at `SpinFeelConfig.ts:91–99`.
3. **TweenService.setTimeScale(scale)** (optional): Shortens all wait/tween durations (win presentation, cascade). Set before spin when speedProfile is 'turbo', reset to 1 after. Evidence: ReelsView and CascadeViewAnimator use getTimeScale() for durations; DefaultWinPresenterStrategy uses commandFactory.createWait(tweenService, { duration }) — duration is typically not divided by timeScale in presenter, so setting tweenService timeScale would need to be reflected in how wait duration is computed, or we pass a shorter duration for turbo. Checking: Wait command likely uses tweenService.update and duration; if the driver multiplies delta by getTimeScale(), then wait completes faster. So setTimeScale(2) on TweenService = 2x faster timeline. Safe.

**Risks to avoid:** Do not change stop order, symbol outcomes, or alignment/snap. Do not use skip path for Real Turbo.
