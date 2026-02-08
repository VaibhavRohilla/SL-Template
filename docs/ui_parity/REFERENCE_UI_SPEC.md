# Reference UI Component Spec

## Layout Rules
- **Container**: `consolePanelContainer`
- **Docking**: `bottomCenter` (x: 0, y: 0 relative to bottom)
- **Orientations**:
  - **Landscape**: 1920x1080 design resolution (implied by positions like 1524, 922)
  - **Portrait**: 1080x1920 design resolution (implied by positions like 418, 1325)

## Components

### Spin Button (`spinBtn`)
- **Textures**: `SPIN.png` (Idle), `SPIN_mouse-ver.png` (Over), `SPIN_pressed.png` (Down), `SPIN_disabled.png` (Disabled)
- **Position (Landscape)**: x: 1524, y: 922
- **Position (Portrait)**: x: 418, y: 1325, scale: 1.45

### Stop Button (`spinStopButton`)
- **Textures**: `STOP.png`, `STOP_mouse-ver.png`, `STOP_pressed.png`, `STOP_disabled.png`
- **Visibility**: Shown only when spinning.

### Bet Panel
- **Meters**: `betMeter` (Displaying current bet)
- **Controls**: `betMinusButton`, `betPlusButton`
- **Position (Landscape)**: x: 903, y: 1045 (relative to slotButtonsContainer)
- **Font**: `MotleyForces`, size 40, color `#ffba08`

### Balance Display
- **Meter**: `balanceMeter`
- **Position (Landscape)**: x: -2, y: 1044
- **Font**: `MotleyForces`, size 40, color `#ffba08`

### Win Display
- **Meter**: `winMeter`
- **Position (Landscape)**: x: 80, y: 2 (relative to slotButtonsContainer)
- **Font**: `MotleyForces`, size 45, color `#ffba08`

### Turbo / Fast Play (`fastPlayButton`)
- **States**: Toggle (TURBO_ON / TURBO_OFF)
- **Position (Landscape)**: x: 1819, y: 994

### Autoplay (`autoSpinButton`)
- **Texture**: `AUTOSPIN.png`
- **Position (Landscape)**: x: 1708, y: 993
