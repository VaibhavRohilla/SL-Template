# Time Ownership Map

Where time is computed and applied. For each knob: name, type, default, used by (file:line), runtime-safe.

---

## 1. Delta time entry (reel update)

| Location | What happens |
|----------|----------------|
| **SlotScene.ts:489–497** | `update(deltaMs)` calls `spinFlow.update(deltaMs)` then `reelsView.update(deltaMs)` then `_timelinePlanner.update(deltaMs)`. |
| **ReelsView.ts:206–211** | `update(deltaMs)`: each reel gets `reel.update(deltaMs * this.timeScale)`. So reel motion is scaled by `ReelsView.timeScale` (default 1). |
| **SpinFlow.ts:447–466** | `update(deltaMs)`: `flowElapsedMs += deltaMs`. Then `effectiveDeltaMs = this.turboMode ? deltaMs * 2 : deltaMs`. Used for: min spin time accumulation (`spinElapsedMs += effectiveDeltaMs`), reel stop sequence countdown (`delayRemainingMs -= effectiveDeltaMs`). |

**Conclusion:** Delta enters at SlotScene.update(deltaMs). Reels use ReelsView.timeScale; SpinFlow uses effectiveDeltaMs (currently 2x only when turboMode, which also takes skip path so the scaling is unused for the animated stop path).

---

## 2. Where timeScale multiplies deltaMs (or equivalent)

| Knob | Type | Default | Used by | Runtime-safe? |
|------|------|---------|---------|----------------|
| **ReelsView.timeScale** | Instance field | 1 | `ReelsView.ts:210` (reel.update(deltaMs * this.timeScale)); set via `setTimeScale(scale)` at `ReelsView.ts:216–220` | YES — set before/during spin; no other global state. |
| **SpinFlow effectiveDeltaMs** | Derived in update() | 1x or 2x when turboMode | `SpinFlow.ts:452–453`, then 456, 462 | YES if we separate “skip” from “fast” (use a speedProfile so scaling applies only when not skipping). |
| **TweenService.getTimeScale()** | Runtime service | 1 | `ReelsView.ts:383`, `482` (cascade); `CascadeViewAnimator.ts:555`, `692`; Wait commands use tweenService for duration | YES — used to scale wait/tween durations in cascade and win flows. |

---

## 3. Stop timing budgets (stop plan / delays / decel)

| Knob | Type | Default | Used by | Runtime-safe? |
|------|------|---------|---------|----------------|
| **minSpinMs** | Config (SpinFeelConfig) | 500 | `SpinFlow.ts:867`, `885` (waitForMinSpinTime, checkMinSpinTimeThreshold) | Read at spin start; safe. |
| **getStopDelay(config, reelIndex)** | Config (base config) | 150 or array | `SpinFlow.ts:706`, `910`, `1483`; `SpinFeelConfig.ts:299–302` | Used when building delay between reels; safe if we pass a profile-specific config or scale delays. |
| **config.turbo.stopDelayMs** | Config (TurboConfig) | 50 | Not currently used by SpinFlow for the stop sequence | Could be used when speedProfile === 'turbo' to build stopDelayMsArr. |
| **stopMotion.durationMs** | Config (per-reel stop animation) | 200 | Reel stop planner / mechanic (ReelMechanicClassic, ReelStopPlanner) | Per-reel animation duration; scaling via TweenService.getTimeScale() would affect it if set. |

---

## 4. Win presentation sequencing timing

| Knob | Type | Default | Used by | Runtime-safe? |
|------|------|---------|---------|----------------|
| **timing.singleWinDurationMs** | WinPresenterConfig | 1200 | `DefaultWinPresenterStrategy.ts:328`, `388` | Via createWait(tweenService, { duration }) — scaled by tweenService.getTimeScale() if set. |
| **timing.betweenWinsDelayMs** | WinPresenterConfig | 200 | `DefaultWinPresenterStrategy.ts:335`, `395` | Same. |
| **timing.allWinsDurationMs** | WinPresenterConfig | 1500 | `DefaultWinPresenterStrategy.ts:310`, `365` | Same. |
| **timelinePlanner** | Instance | — | Enqueues wait/tween commands; `update(deltaMs)` in `SlotScene.ts:497` | No global timeline speed scale; duration comes from commands (already scaled by TweenService.getTimeScale() where used). |

---

## 5. Summary table (for Real Turbo)

| Knob | Layer | Affects | Safe to scale? | Notes |
|------|-------|---------|----------------|-------|
| ReelsView.timeScale | Reels | Spin speed (visual) | YES | setTimeScale(2) before spin. |
| SpinFlow effectiveDeltaMs | SpinFlow | Min spin wait, inter-reel delay countdown | YES | Use speedProfile 'turbo' to apply multiplier without taking skip path. |
| getStopDelay() / turbo.stopDelayMs | SpinFlow | Delay between reel stops | YES | When building stop plan for 'turbo', use config.turbo.stopDelayMs or scale base delays. |
| TweenService.setTimeScale | Global/service | Cascade + any wait/tween using tweenService | YES | Would shorten win presentation and cascade; set for spin, reset after. |
