# Rename: Turbo → Skip Animations

## Scope

- **Template:** UI label and storage key; semantics = "skip animations" (instant snap). SDK param name remains `turboMode` for backward compatibility.
- **Storage:** Prefer `slot_skip_animations`; optional backward compat: if key missing, read `slot_turbo_mode` so existing saves still work.
- **Code identifiers:** Keep public API `game.spin(bet, turboMode)`; treat `turboMode === true` as "skip animations" in Template/UI and docs.

## Changes

| Location | Change |
|----------|--------|
| Template `src/index.html` | Button label: "Skip Animations OFF" (script updates to ON/OFF). |
| Template `src/bootstrap/bootstrap.ts` | Storage key: `slot_skip_animations`; read with fallback `slot_turbo_mode`. Functions: getSkipAnimations(), setSkipAnimations(). Wire spin to pass getSkipAnimations() as second arg to game.spin(). Button id can stay `turbo-button` or become `skip-animations-button` (optional). Label text: "Skip Animations OFF/ON". |
| SDK | No identifier rename; comments/doc can say turboMode means "skip animations" where relevant. |

## Acceptance

- Behavior unchanged: when Skip Animations ON, same instant path as before (onSkipAnimations, applyFinalState).
- Only naming clarified in UI and storage.
