# Spin Timing Analysis

## Test Results Summary

Successfully captured timing data for 2 complete spins on the slot game running at http://localhost:3000.

## Spin 1 Timing Data

**Spin ID**: `5812c4ff-d375-42e3-b8a0-3f794ec5dda5`

### Key Events:

1. **STOP_SEQUENCE_START** - 317ms elapsed
   - Stop order: [0, 1, 2, 3, 4] (left to right)
   - All stop delays: 0ms

2. **Reel 0 (First Reel)**
   - REEL_STOP_REQUESTED: 318.1ms elapsed
   - REEL_STOPPED: 1909.5ms elapsed
   - **Duration: ~1591ms**

3. **Reel 1 (Second Reel)**
   - REEL_STOP_REQUESTED: 1910.1ms elapsed
   - REEL_STOPPED: 3283ms elapsed
   - **Duration: ~1373ms**

4. **Reel 2 (Third Reel)**
   - REEL_STOP_REQUESTED: 3283.6ms elapsed
   - REEL_STOPPED: 4669.7ms elapsed
   - **Duration: ~1386ms**

5. **Reel 3 (Fourth Reel)**
   - REEL_STOP_REQUESTED: 4670.2ms elapsed
   - REEL_STOPPED: 6043.2ms elapsed
   - **Duration: ~1373ms**

6. **Reel 4 (Fifth Reel)**
   - REEL_STOP_REQUESTED: 6044ms elapsed
   - REEL_STOPPED: 7430ms elapsed
   - **Duration: ~1386ms**

7. **ALL_REELS_STOPPED**: 7430.9ms elapsed

8. **SPIN_COMPLETE**: 7433.6ms elapsed

**Total Spin Duration: ~7.4 seconds**

---

## Spin 2 Timing Data

**Spin ID**: `5334c019-4710-41ed-9936-00aecf0c98b3`

### Key Events:

1. **SPIN_REQUESTED**: 0.1ms elapsed
2. **SPIN_STARTED**: 0.3ms elapsed
3. **RESULT_RECEIVED**: 0.9ms elapsed

4. **STOP_SEQUENCE_START** - 310.1ms elapsed
   - Stop order: [0, 1, 2, 3, 4] (left to right)
   - All stop delays: 0ms

5. **Reel 0 (First Reel)**
   - REEL_STOP_REQUESTED: 310.6ms elapsed
   - REEL_STOPPED: 1719.9ms elapsed
   - **Duration: ~1409ms**

6. **Reel 1 (Second Reel)**
   - REEL_STOP_REQUESTED: 1720.3ms elapsed
   - REEL_STOPPED: 3186.9ms elapsed
   - **Duration: ~1467ms**

7. **Reel 2 (Third Reel)**
   - REEL_STOP_REQUESTED: 3187.5ms elapsed
   - REEL_STOPPED: 4627.1ms elapsed
   - **Duration: ~1440ms**

8. **Reel 3 (Fourth Reel)**
   - REEL_STOP_REQUESTED: 4627.6ms elapsed
   - REEL_STOPPED: 6027.3ms elapsed
   - **Duration: ~1400ms**

9. **Reel 4 (Fifth Reel)**
   - REEL_STOP_REQUESTED: 6028ms elapsed
   - REEL_STOPPED: 7411.6ms elapsed
   - **Duration: ~1384ms**

10. **ALL_REELS_STOPPED**: 7412.2ms elapsed

11. **SPIN_COMPLETE**: 7413.4ms elapsed

**Total Spin Duration: ~7.4 seconds**

---

## Analysis

### Stop Order
Both spins used the same stop order: **[0, 1, 2, 3, 4]** (left to right)

### Stop Delays
All reels had 0ms stop delay configured.

### Reel Stop Durations

**Spin 1:**
- Reel 0: ~1591ms
- Reel 1: ~1373ms
- Reel 2: ~1386ms
- Reel 3: ~1373ms
- Reel 4: ~1386ms

**Spin 2:**
- Reel 0: ~1409ms
- Reel 1: ~1467ms
- Reel 2: ~1440ms
- Reel 3: ~1400ms
- Reel 4: ~1384ms

### Observations

1. **Consistent Total Duration**: Both spins took approximately 7.4 seconds from start to completion.

2. **Stop Sequence Timing**: The stop sequence starts around 300-317ms after the spin begins.

3. **Sequential Stopping**: Reels stop sequentially from left to right (0→1→2→3→4) with no configured delays.

4. **Individual Reel Duration**: Each reel takes approximately 1.3-1.6 seconds to stop after receiving the stop request.

5. **Turbo Mode**: Not enabled in either spin (`turboEnabled: false`).

6. **Quick Stop**: Not triggered in either spin (`quickStopTriggered: false`).

### Configuration Details

- **Number of Reels**: 5
- **Stop Order**: Left to right (sequential)
- **Stop Delays**: All 0ms (no artificial delays between reel stops)
- **Turbo Mode**: Disabled
- **Quick Stop**: Not used

---

## Screenshots

Three screenshots were captured:
1. `game-initial.png` - Initial game state before any spins
2. `game-after-spin1.png` - Game state after first spin completed
3. `game-after-spin2.png` - Game state after second spin completed
