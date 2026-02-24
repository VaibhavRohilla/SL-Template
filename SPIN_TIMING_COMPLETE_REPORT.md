# Complete Spin Timing Report

## Test Environment
- **URL**: http://localhost:3000
- **Game**: Piggy Bank (Pixi.js Slot Game)
- **Test Date**: 2026-02-24
- **Number of Spins Captured**: 2

---

## Spin 1 - Complete Timing Data

### Spin ID: `5812c4ff-d375-42e3-b8a0-3f794ec5dda5`

#### Timeline of Events:

| Event | Time (ms) | Elapsed (ms) | Notes |
|-------|-----------|--------------|-------|
| SPIN_REQUESTED | 4787.9 | 0.1 | User clicked spin button |
| SPIN_STARTED | 4788.5 | 0.7 | Spin animation begins |
| RESULT_RECEIVED | 4789.4 | 1.6 | Server result received |
| STOP_SEQUENCE_START | 4985.0 | 197.2 | Begin stopping reels |
| REEL_STOP_REQUESTED (0) | 4985.6 | 197.8 | First reel stop requested |
| REEL_STOPPED (0) | 6434.7 | 1646.9 | First reel stopped |
| REEL_STOP_REQUESTED (1) | 6435.8 | 1648.0 | Second reel stop requested |
| REEL_STOPPED (1) | 7887.0 | 3099.2 | Second reel stopped |
| REEL_STOP_REQUESTED (2) | 7887.5 | 3099.7 | Third reel stop requested |
| REEL_STOPPED (2) | 9268.5 | 4480.7 | Third reel stopped |
| REEL_STOP_REQUESTED (3) | 9269.2 | 4481.4 | Fourth reel stop requested |
| REEL_STOPPED (3) | 10642.6 | 5854.8 | Fourth reel stopped |
| REEL_STOP_REQUESTED (4) | 10643.0 | 5855.2 | Fifth reel stop requested |
| REEL_STOPPED (4) | 12025.0 | 7237.2 | Fifth reel stopped |
| ALL_REELS_STOPPED | 12026.3 | 7238.5 | All reels complete |
| SPIN_COMPLETE | 12029.8 | 7242.0 | **Total spin duration** |

#### Reel Stop Durations (Spin 1):

| Reel | Stop Requested | Stopped | Duration | Target Symbols |
|------|----------------|---------|----------|----------------|
| 0 | 197.8ms | 1646.9ms | **1449ms** | [45, 45, 45, 52] |
| 1 | 1648.0ms | 3099.2ms | **1451ms** | [43, 43, 54, 53] |
| 2 | 3099.7ms | 4480.7ms | **1381ms** | [41, 42, 43, 44] |
| 3 | 4481.4ms | 5854.8ms | **1373ms** | [43, 44, 45, 53] |
| 4 | 5855.2ms | 7237.2ms | **1382ms** | [42, 43, 44, 45] |

#### PlanStop Data (Spin 1):

**Reel 0:**
```json
{
  "currentPosition": 3,
  "targetSymbols": [45, 45, 45, 52],
  "targetPosition": 59,
  "spinDistance": 14,
  "visibleRows": 4
}
```

**Reel 1:**
```json
{
  "currentPosition": 20,
  "targetSymbols": [43, 43, 54, 53],
  "targetPosition": 19,
  "spinDistance": 14,
  "visibleRows": 4
}
```

**Reel 2:**
```json
{
  "currentPosition": 36,
  "targetSymbols": [41, 42, 43, 44],
  "targetPosition": 24,
  "spinDistance": 14,
  "visibleRows": 4
}
```

**Reel 3:**
```json
{
  "currentPosition": 52,
  "targetSymbols": [43, 44, 45, 53],
  "targetPosition": 50,
  "spinDistance": 14,
  "visibleRows": 4
}
```

**Reel 4:**
```json
{
  "currentPosition": 6,
  "targetSymbols": [42, 43, 44, 45],
  "targetPosition": 25,
  "spinDistance": 14,
  "visibleRows": 4
}
```

---

## Spin 2 - Complete Timing Data

### Spin ID: `5334c019-4710-41ed-9936-00aecf0c98b3`

#### Timeline of Events:

| Event | Time (ms) | Elapsed (ms) | Notes |
|-------|-----------|--------------|-------|
| SPIN_REQUESTED | 13260.6 | 0.0 | User clicked spin button |
| SPIN_STARTED | 13260.8 | 0.2 | Spin animation begins |
| RESULT_RECEIVED | 13261.2 | 0.6 | Server result received |
| STOP_SEQUENCE_START | 13554.8 | 294.2 | Begin stopping reels |
| REEL_STOP_REQUESTED (0) | 13555.1 | 294.5 | First reel stop requested |
| REEL_STOPPED (0) | 14983.8 | 1723.2 | First reel stopped |
| REEL_STOP_REQUESTED (1) | 14984.5 | 1723.9 | Second reel stop requested |
| REEL_STOPPED (1) | 16449.9 | 3189.3 | Second reel stopped |
| REEL_STOP_REQUESTED (2) | 16450.7 | 3190.1 | Third reel stop requested |
| REEL_STOPPED (2) | 17903.1 | 4642.5 | Third reel stopped |
| REEL_STOP_REQUESTED (3) | 17903.6 | 4643.0 | Fourth reel stop requested |
| REEL_STOPPED (3) | 19275.8 | 6015.2 | Fourth reel stopped |
| REEL_STOP_REQUESTED (4) | 19276.2 | 6015.6 | Fifth reel stop requested |
| REEL_STOPPED (4) | 20658.6 | 7398.0 | Fifth reel stopped |
| ALL_REELS_STOPPED | 20659.5 | 7398.9 | All reels complete |
| SPIN_COMPLETE | 20661.1 | 7400.5 | **Total spin duration** |

#### Reel Stop Durations (Spin 2):

| Reel | Stop Requested | Stopped | Duration | Target Symbols |
|------|----------------|---------|----------|----------------|
| 0 | 294.5ms | 1723.2ms | **1429ms** | [43, 44, 45, 41] |
| 1 | 1723.9ms | 3189.3ms | **1465ms** | [42, 43, 44, 45] |
| 2 | 3190.1ms | 4642.5ms | **1452ms** | [45, 46, 41, 42] |
| 3 | 4643.0ms | 6015.2ms | **1372ms** | [45, 46, 41, 42] |
| 4 | 6015.6ms | 7398.0ms | **1382ms** | [91, 91, 51, 52] |

#### PlanStop Data (Spin 2):

**Reel 0:**
```json
{
  "currentPosition": 20,
  "targetSymbols": [43, 44, 45, 41],
  "targetPosition": 47,
  "spinDistance": 14,
  "visibleRows": 4
}
```

**Reel 1:**
```json
{
  "currentPosition": 54,
  "targetSymbols": [42, 43, 44, 45],
  "targetPosition": 32,
  "spinDistance": 14,
  "visibleRows": 4
}
```

**Reel 2:**
```json
{
  "currentPosition": 25,
  "targetSymbols": [45, 46, 41, 42],
  "targetPosition": 28,
  "spinDistance": 14,
  "visibleRows": 4
}
```

**Reel 3:**
```json
{
  "currentPosition": 57,
  "targetSymbols": [45, 46, 41, 42],
  "targetPosition": 28,
  "spinDistance": 14,
  "visibleRows": 4
}
```

**Reel 4:**
```json
{
  "currentPosition": 27,
  "targetSymbols": [91, 91, 51, 52],
  "targetPosition": 4,
  "spinDistance": 14,
  "visibleRows": 4
}
```

---

## Analysis & Key Findings

### 1. Overall Timing Consistency

Both spins showed very consistent timing:
- **Spin 1 Total Duration**: 7242ms (~7.2 seconds)
- **Spin 2 Total Duration**: 7400ms (~7.4 seconds)
- **Average**: ~7.3 seconds per spin

### 2. Stop Sequence Timing

The stop sequence begins approximately **200-300ms** after the result is received:
- Spin 1: 197.2ms after SPIN_REQUESTED
- Spin 2: 294.2ms after SPIN_REQUESTED

### 3. Individual Reel Stop Durations

Average duration for each reel to stop after being requested:

| Reel | Spin 1 | Spin 2 | Average |
|------|--------|--------|---------|
| 0 | 1449ms | 1429ms | **1439ms** |
| 1 | 1451ms | 1465ms | **1458ms** |
| 2 | 1381ms | 1452ms | **1417ms** |
| 3 | 1373ms | 1372ms | **1373ms** |
| 4 | 1382ms | 1382ms | **1382ms** |

**Overall Average Reel Stop Duration: ~1414ms**

### 4. Stop Order

Both spins used **left-to-right sequential stopping**:
- Stop Order: [0, 1, 2, 3, 4]
- Stop Delays: [0, 0, 0, 0, 0] (no artificial delays)

### 5. PlanStop Behavior

All reels consistently used:
- **spinDistance**: 14 symbols
- **visibleRows**: 4 rows
- The `currentPosition` and `targetPosition` vary based on where the reel was when stop was requested

### 6. Configuration

- **Turbo Mode**: Disabled (`turboEnabled: false`)
- **Quick Stop**: Not triggered (`quickStopTriggered: false`)
- **Number of Reels**: 5
- **Reel Strip Length**: Appears to be ~60+ symbols based on position values

### 7. Timing Breakdown

Average time allocation:
- **Initial delay** (request → stop sequence): ~250ms
- **Reel 0 stop**: ~1440ms
- **Reel 1 stop**: ~1460ms  
- **Reel 2 stop**: ~1420ms
- **Reel 3 stop**: ~1370ms
- **Reel 4 stop**: ~1380ms
- **Completion overhead**: ~4ms

---

## Screenshots

The following screenshots were captured during testing:

1. **game-initial-detailed.png** - Initial game state
2. **game-after-spin1-detailed.png** - After first spin completed
3. **game-after-spin2-detailed.png** - After second spin completed

---

## Raw Data Files

Complete data has been saved to:
- `spin-timing-detailed.json` - Structured timing and planStop data
- `console-logs-all.json` - All console logs captured during test
- `spin-test-output.txt` - Full test execution output

---

## Observations

1. **Consistent Performance**: The engine shows very consistent timing across multiple spins
2. **Sequential Stopping**: Reels stop one at a time with minimal delay between stop requests
3. **Predictable Duration**: Each reel takes approximately 1.3-1.5 seconds to complete its stop animation
4. **No Artificial Delays**: All `stopDelayMs` values are 0, indicating natural timing
5. **Spin Distance**: All reels spin exactly 14 symbols before stopping at the target position
