# UI Removal Plan

## Delete Candidate Files
- `src/ui/Shell.ts`: Replaced by `ReferenceUIRoot.ts`.
- `src/ui/components/TopBar.ts`: Replaced by `ReferenceUIRoot` top section.
- `src/ui/components/BottomPanel.ts`: Replaced by `ReferenceUIRoot` bottom section.
- `src/ui/components/SpinButton.ts`: Replaced by `ReferenceSpinButton.ts`.

## Manifest Entries to Remove
- Remove old UI texture keys from `src/assets/manifest.ts` (once migration is complete).

## Execution Strategy
1. Implement `ReferenceUIRoot` and components in `src/ui/reference/`.
2. Update `CustomGameScene.ts` to use `ReferenceUIRoot` instead of `Shell`/`GameUI` (legacy mode).
3. Verify new UI works correctly.
4. Delete old files.
