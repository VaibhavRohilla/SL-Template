# Reference Assets Spec

## Texture Atlases
- **UI Atlas**: Contains all button states, panels, and frames.
  - `Band.png`: Bottom panel background.
  - `SPIN.png`, `SPIN_mouse-ver.png`, `SPIN_pressed.png`, `SPIN_disabled.png`: Spin button.
  - `STOP.png`, `STOP_mouse-ver.png`, `STOP_pressed.png`, `STOP_disabled.png`: Stop/Skip button.
  - `Left_arrow.png`, `Right_arrow.png`: Bet navigation.
  - `SOUND_ON.png`, `SOUND_OFF.png`: Sound toggle.
  - `TURBO_ON.png`, `TURBO_OFF.png`: Fast play toggle.
  - `AUTOSPIN.png`: Auto play button.
  - `I.png`: Paytable/Info button.
  - `balance.png`, `bet.png`, `win.png`: Meter labels.

## Fonts
- **MotleyForces**: primary meter font (TTF/Bitmap).
  - Used for Beta, Balance, and Win meters.

## Asset Mapping (AssetMap.ts)
All UI components in the Template must resolve textures through `AssetMap`.

```typescript
export const UI_ASSETS = {
    SPIN_BUTTON: 'SPIN.png',
    SPIN_BUTTON_OVER: 'SPIN_mouse-ver.png',
    // ...
};
```
