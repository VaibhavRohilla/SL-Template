# ASSET PIPELINE LOCK

This document defines the single sources of truth for assets in the `SL-Template` project. Adherence to these locks is mandatory for all UI and scene rendering.

## 1. Runtime Asset Registry
- **Path**: [manifest.json](file:///d:/PersonalProjects/SL-Template/dist/assets/manifest.json)
- **Role**: Defines the exact list of assets loaded into the game at runtime.
- **Production**: Generated via `pnpm assets:manifest`.
- **Enforcement**: PixiJS `Assets` loader uses this manifest.

## 2. Type-Safe Key Registry
- **Path**: [Asset.d.ts](file:///d:/PersonalProjects/SL-Template/src/Asset.d.ts)
- **Role**: Provides TypeScript definitions for all asset keys, ensuring no "magic strings" or key drift.
- **Production**: Automatically generated alongside `manifest.json`.
- **Enforcement**: All UI components and scene builders MUST use `AssetKeys` or `AssetKey` types.

## 3. UI Key Mapping Layer
- **Path**: [AssetMap.ts](file:///d:/PersonalProjects/SL-Template/src/ui/reference/AssetMap.ts)
- **Role**: Decouples logical UI usage (e.g., `SPIN_BUTTON_IDLE`) from physical reference asset names (e.g., `SPIN`).
- **Policy**: Code should never import raw strings; use `UI_ASSETS` from this map.

## 4. Asset Resolution Policy
- **UI Components**: Use `UI_ASSETS`.
- **Symbols**: Use `SymbolKeyResolver`.
- **Loading Screen**: Use `bootConfig` in `BrandConfig.ts`.
- **SFX**: Use `UI_ASSETS.AUDIO`.

---
*Locked Date: 2026-02-06*
*Status: ENFORCED*
