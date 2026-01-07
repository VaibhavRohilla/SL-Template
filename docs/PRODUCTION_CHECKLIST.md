# Production Checklist

Essential items to verify before deploying a slot game to production.

## ✅ Required Settings

### 1. Tap-to-Start Gate

```typescript
// src/config/themeConfig.ts
bootConfig: {
  start: {
    requireTap: true,  // ✅ MUST be true in production
  },
  skipStartScreen: false,  // ✅ MUST be false in production
}
```

**Why?** Mobile browsers require user interaction to unlock audio context.

### 2. No Mock Results

```typescript
// src/main.ts
// ❌ DO NOT import MockResultSource in production
// import { MockResultSource } from './ui/index.js';

// ✅ Results must come from authoritative backend
```

### 3. Backend Integration

- [ ] Real backend connected via `ISpinResultSource`
- [ ] Spin results validated against schema version
- [ ] Balance managed server-side
- [ ] Bet amounts validated server-side

## 🎰 Deterministic Presentation

### No `Math.random()` in Views

```typescript
// ❌ BAD - Non-deterministic
const offset = Math.random() * 10;

// ✅ GOOD - Use presentation RNG (when enabled)
const offset = ctx.presentationRng.next() * 10;
```

### Time-Based Animations Only

```typescript
// ✅ GOOD - Deterministic animation
this.animationTime += deltaMs;
const pulse = Math.sin(this.animationTime / 500) * 0.05 + 1;
```

### Enable Deterministic Mode (Optional)

```typescript
const game = new Game({
  deterministicPresentation: true,
  presentationSeed: 42,
  // ...
});
```

## 🔊 Audio

### Audio Unlocked After Tap

The engine automatically unlocks audio on tap-to-start, but verify:

```typescript
// In StartScene or after user interaction
await ctx.audioBus.unlock();
```

### No Autoplay Before Interaction

Audio should never play before tap-to-start gate.

## 🧹 Memory & Cleanup

### Scene Cleanup

Every scene's `onDestroy()` must clean up:

- [ ] Event listeners removed
- [ ] Ticker callbacks removed
- [ ] Tweens killed
- [ ] Display objects destroyed

```typescript
protected onDestroy(): void {
  // Remove event listeners
  this.container.off('pointerdown', this.handler);
  
  // Kill tweens
  this.ctx.tweenService.killAll();
  
  // Clear references
  this.background = null;
}
```

### No Leaked Resources

Use engine's `DevLeakDetector` in development to catch leaks.

## 📦 Asset Manifest

### Verify All Assets Load

```bash
pnpm manifest:generate
pnpm doctor
```

### Boot Bundle Contains Only

- Logo image
- Loading screen background
- Critical fonts

### Main Bundle Contains

- All symbols
- UI assets
- Audio files
- Fonts

## 🔒 Security

### No Sensitive Data in Client

- [ ] No RTP calculations client-side
- [ ] No backend URLs hardcoded (use environment variables)
- [ ] No admin features in production build

### Validate All Backend Responses

```typescript
import { validateSpinResult } from 'slot-frontend-engine';

const result = await backend.spin(request);
const validatedResult = validateSpinResult(result); // Throws on invalid
```

## 📱 Mobile Compatibility

- [ ] Tested on iOS Safari
- [ ] Tested on Android Chrome
- [ ] No scroll/zoom on game container
- [ ] Touch events work correctly
- [ ] Orientation changes handled

## 🏷️ Final Checks

- [ ] Remove all `console.log` statements (or use log levels)
- [ ] Remove DEV keyboard controls from production
- [ ] Set `logLevel: 'error'` in production
- [ ] Minified build tested
- [ ] Error boundaries in place

## Deployment

```bash
# Build for production
pnpm build

# Verify build
pnpm preview

# Deploy dist/ folder
```

---

**Remember:** The backend is the source of truth for all monetary calculations.

