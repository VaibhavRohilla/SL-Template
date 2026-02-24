# P10: Risk Ranking & Artifact Analysis

Based on the certification-grade audit of the Reel Lifecycle, here is the ranked analysis of where movement artifacts or lifecycle bugs might theoretically originate in the SL-Engine.

## Rank 1: Feature Plugin Overrides (High Risk)
*   **Culprit:** Developers mutating reels natively instead of using established engine hooks.
*   **Explanation:** The engine locks `yOffset` and `visualOffset` perfectly (`P3`). But a custom `FeaturePlugin` doing something like `reelsView.getReel(0).container.y = 50` will break the pixel-perfect alignment invisibly, causing "snapbacks" when the global container recalculates.
*   **Prevention:** `ReelsView` should block direct access to `.y` setter or document extreme cautions.

## Rank 2: Timeline Command Ordering (Medium Risk)
*   **Culprit:** Non-deterministic custom `CommandFactory` invocations.
*   **Explanation:** If a custom stop sequence enqueues a `Tween` on the reel and immediately enqueues an `Event` that resolves the stop before the tween finishes, `ReelState:IDLE` gets invoked early.
*   **Prevention:** Rely strictly on `ReelMechanicClassic`'s `animateStop` chain (decel -> promise -> bounce -> promise -> snap -> promise).

## Rank 3: Double Apply in Turbo Mode (Low Risk)
*   **Culprit:** Turbo bounds overriding timeline.
*   **Explanation:** If turbo mode disables `skipBounce`, the timeline shrinks to zero. Currently guarded perfectly by `skip()` handling (`P8`), but if modifications to `CommandQueue` skip liveness are made, skipped tweens might double-apply final coords.
*   **Prevention:** Kept safe by `this.strip.setVisibleSymbols` resetting `yOffset=0` hard.

## Rank 4: Symbol Memory Bloat in Extreme Scenarios (Negligible Risk)
*   **Culprit:** Megaways or massive grid-changing features.
*   **Explanation:** `SymbolPool` prevents memory leaks beautifully (`P7`), but if a feature requires dynamically spawning hundreds of *unique*, non-reusable symbols not covered by the `SymbolFactory` texture cache, `acquire()` could bypass cache hit logic.
*   **Prevention:** Texture atlasing optimization.

## Conclusion
The base engine's reel mechanic is incredibly robust. Almost 100% of reported visual "jank" or "snapbacks" can be traced back to incorrect implementer usage in the Template app (e.g. manually overriding container bounds) or using `setTimeout` instead of `TimelinePlanner` inside Feature Plugins.
