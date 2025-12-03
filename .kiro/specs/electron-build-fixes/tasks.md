# Implementation Plan - Electron Build Fixes

## Overview

This plan fixes 147 TypeScript errors preventing Electron builds. Fixes are organized by category for efficient resolution.

**Fix Order:**
1. File casing (1 error) - Quick win
2. Unused imports (10 errors) - Quick cleanup
3. Browser API types (20+ errors) - Foundation for other fixes
4. Type errors (80+ errors) - Most complex
5. MUI Grid migration (30+ errors) - UI changes, test carefully

---

## Tasks

- [x] 1. Fix file casing issues
  - Fix import casing in ExperimentPanel.tsx
  - Change `'../services/imageGenerationService'` to `'../services/ImageGenerationService'`
  - Verify build compiles this file without casing errors
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Remove unused imports and variables
  - Remove unused `Divider` from ImageGenerationPreviewDialog.tsx
  - Remove unused `Chip`, `DEFAULT_PANEL_CONFIG`, `PanelConfig` from ImportStoryDialog.tsx
  - Remove unused `Divider`, `Character` from OperationsPanel.tsx
  - Remove unused `imageMap` variable from OperationsPanel.tsx
  - Remove unused Grid/Container imports from SceneLayoutEditor.tsx
  - Remove unused Box/Stack/Divider imports from SceneImageGenerator.tsx
  - Remove unused PromptBuildingService from ScenePromptPreview.tsx
  - Remove unused PromptBuildingService from SceneEditor.tsx
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3. Add browser API type definitions
  - Create src/types/browser-apis.d.ts with File System Access API types
  - Define FileSystemDirectoryHandle interface
  - Define FileSystemFileHandle interface
  - Define FileSystemWritableFileStream interface
  - Extend Window interface with showDirectoryPicker method
  - Update tsconfig.app.json to include new type definition file
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 4. Fix type errors in OperationsPanel.tsx
  - Add explicit type for imageId parameters (should be `string`)
  - Add optional chaining for character.imageGallery access
  - Fix implicit any types in image handling functions
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 5. Fix type errors in ImportStoryDialog.tsx
  - Remove references to Character.id (Character type doesn't have id)
  - Fix Character type usage (import from correct location)
  - Fix Story type mismatch (convert types/Story to models/Story)
  - Use Story.fromJSON() for proper type conversion
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Fix type errors in FileSystemService.ts
  - Add type guards for window.showDirectoryPicker availability
  - Handle FileSystemDirectoryHandle type properly with new type definitions
  - Fix all showDirectoryPicker usage with proper types
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2_

- [ ] 7. Fix remaining type errors in services
  - Fix type errors in TestDirectoryService.ts
  - Fix type errors in StoryExportService.ts
  - Fix type errors in StorageService.ts
  - Fix type errors in PromptBuildingService.ts
  - Fix type errors in LegacyPromptBuildingService.ts
  - Fix type errors in GeminiPromptBuildingService.ts
  - Fix type errors in ImageStorageService.ts
  - Fix type errors in ImageMigrationService.ts
  - Fix type errors in ImageCache.ts
  - Fix type errors in DirectoryMigrationService.ts
  - Fix type errors in DiagramService.ts
  - Fix type errors in DiagramRenderer.ts
  - Fix type errors in CharacterImageService.ts
  - Fix type errors in DocxExportService.ts
  - Fix type errors in BookService.ts
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 8. Fix remaining type errors in models and hooks
  - Fix type errors in models/Story.ts
  - Fix type errors in models/Scene.ts
  - Fix type errors in hooks/useImageGeneration.ts
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 9. Fix remaining type errors in components
  - Fix type errors in StoriesPanel.tsx
  - Fix type errors in SettingsDialog.tsx
  - Fix type errors in ScenePromptPreview.tsx (beyond unused imports)
  - Fix type errors in SceneEditor.tsx (beyond unused imports)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 10. Migrate MUI Grid components in ExperimentPanel.tsx
  - Convert 9 Grid instances from v1 to v2 API
  - Remove `item` prop from all Grid components
  - Convert `xs`, `md`, `sm` props to `size={{ xs: n, md: n }}` format
  - Test that layout remains unchanged
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 11. Migrate MUI Grid components in PanelConfigDialog.tsx
  - Convert 16 Grid instances from v1 to v2 API
  - Remove `item` prop from all Grid components
  - Convert `xs`, `sm` props to `size={{ xs: n, sm: n }}` format
  - Test that layout remains unchanged
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 12. Migrate MUI Grid components in SceneLayoutEditor.tsx
  - Convert 6 Grid instances from v1 to v2 API
  - Remove `item` prop from all Grid components
  - Convert `xs`, `md` props to `size={{ xs: n, md: n }}` format
  - Test that layout remains unchanged
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 13. Verify build and tests
  - Run `npm run build` and verify it succeeds
  - Run `npm run electron:build` and verify it succeeds
  - Run `npm test -- --run` and verify all 819 tests pass
  - Run `npm run lint` and verify no new warnings
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1_

- [ ] 14. Manual verification
  - Launch Electron app with `npm run electron:dev`
  - Verify app starts without errors
  - Test basic functionality (create book, add story, edit scene)
  - Verify UI layouts look correct after Grid migration
  - _Requirements: 6.2, 6.4, 7.4_

---

## Notes

### Fix Strategy
- Fix errors incrementally by category
- Verify build after each major category
- Run tests frequently to catch regressions early
- Commit after each successful category fix

### Common Patterns

**File Casing:**
- Always match exact filename casing in imports
- Use IDE auto-import to avoid casing errors

**Unused Imports:**
- Remove entire import line if nothing is used
- Remove specific imports from destructured imports

**Type Errors:**
- Add explicit types for parameters: `(param: string) => {}`
- Use optional chaining: `obj?.property`
- Use nullish coalescing: `value ?? defaultValue`
- Convert types properly: `Model.fromJSON(data)`

**MUI Grid v2:**
- Remove `item` prop completely
- Convert `xs={12}` to `size={{ xs: 12 }}`
- Convert `xs={12} md={6}` to `size={{ xs: 12, md: 6 }}`
- Always include `xs` for mobile responsiveness

### Success Metrics
- TypeScript errors: 147 → 0
- Build: Failing → Passing
- Tests: 819 passing (maintained)
- ESLint: No new warnings
- Electron app: Launches successfully
