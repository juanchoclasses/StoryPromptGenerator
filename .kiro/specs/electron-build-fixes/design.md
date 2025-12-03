# Design Document - Electron Build Fixes

## Overview

This document outlines the technical approach for fixing 147 TypeScript errors that prevent successful Electron builds. The errors are categorized into 5 main groups, each requiring a specific fix strategy.

**Design Goals:**
1. Fix all 147 TypeScript compilation errors
2. Enable successful `npm run electron:build` execution
3. Maintain all existing functionality (no breaking changes)
4. Keep all 819 tests passing
5. Improve code quality through proper typing

## Architecture

### Error Categories and Counts

```
Category 1: File Casing Issues (1 error)
├── ExperimentPanel.tsx - imageGenerationService vs ImageGenerationService

Category 2: MUI Grid v2 Migration (30+ errors)
├── ExperimentPanel.tsx - 9 Grid errors
├── PanelConfigDialog.tsx - 16 Grid errors
└── SceneLayoutEditor.tsx - 6 Grid errors

Category 3: Unused Imports/Variables (10 errors)
├── ImageGenerationPreviewDialog.tsx - Divider
├── ImportStoryDialog.tsx - Chip, DEFAULT_PANEL_CONFIG, PanelConfig
├── OperationsPanel.tsx - Divider, Character, imageMap
├── SceneLayoutEditor.tsx - Grid, Container
├── SceneImageGenerator.tsx - Box, Stack, Divider
├── ScenePromptPreview.tsx - PromptBuildingService
└── SceneEditor.tsx - PromptBuildingService

Category 4: Type Errors (80+ errors)
├── FileSystemService.ts - showDirectoryPicker type missing
├── OperationsPanel.tsx - implicit any, possibly undefined
├── ImportStoryDialog.tsx - Character type, Story type mismatch
├── Various services - type mismatches
└── Various components - type issues

Category 5: Browser API Type Definitions (20+ errors)
├── window.showDirectoryPicker not defined
└── FileSystemDirectoryHandle type issues
```

## Components and Interfaces

### 1. File Casing Fix

**Problem:** Import uses wrong casing for ImageGenerationService

**Solution:**
```typescript
// BEFORE (ExperimentPanel.tsx)
import ImageGenerationService from '../services/imageGenerationService';

// AFTER
import ImageGenerationService from '../services/ImageGenerationService';
```

**Files to Fix:**
- `src/components/ExperimentPanel.tsx`

---

### 2. MUI Grid v2 Migration

**Problem:** Grid v2 removed `item`, `xs`, `md`, `sm`, `lg` props

**Solution:** Use new Grid v2 API with size prop

```typescript
// BEFORE
<Grid item xs={12} md={6}>
  <TextField />
</Grid>

// AFTER
<Grid size={{ xs: 12, md: 6 }}>
  <TextField />
</Grid>
```

**Migration Pattern:**
- Remove `item` prop entirely
- Convert `xs={n}` to `size={{ xs: n }}`
- Convert `md={n}` to `size={{ xs: 12, md: n }}` (include xs for mobile)
- Convert multiple breakpoints to object: `size={{ xs: 12, sm: 6, md: 4 }}`

**Files to Fix:**
- `src/components/ExperimentPanel.tsx` (9 instances)
- `src/components/PanelConfigDialog.tsx` (16 instances)
- `src/components/SceneLayoutEditor.tsx` (6 instances)

---

### 3. Unused Imports Cleanup

**Problem:** Dead code causing compilation errors

**Solution:** Remove unused imports and variables

**Files to Fix:**
- `src/components/ImageGenerationPreviewDialog.tsx` - Remove `Divider`
- `src/components/ImportStoryDialog.tsx` - Remove `Chip`, `DEFAULT_PANEL_CONFIG`, `PanelConfig`
- `src/components/OperationsPanel.tsx` - Remove `Divider`, `Character`, `imageMap`
- `src/components/SceneLayoutEditor.tsx` - Remove unused Grid imports
- `src/components/SceneImageGenerator.tsx` - Remove unused MUI imports
- `src/components/ScenePromptPreview.tsx` - Remove unused PromptBuildingService
- `src/components/SceneEditor.tsx` - Remove unused PromptBuildingService

---

### 4. Type Error Fixes

**Problem:** Missing types, implicit any, possibly undefined

**Solutions:**

#### 4.1 Implicit Any Parameters
```typescript
// BEFORE
const handleClick = (imageId) => { ... }

// AFTER
const handleClick = (imageId: string) => { ... }
```

#### 4.2 Possibly Undefined Properties
```typescript
// BEFORE
character.imageGallery.forEach(...)

// AFTER
character.imageGallery?.forEach(...) || []
```

#### 4.3 Type Mismatches
```typescript
// BEFORE
const story: ModelStory = typeStory; // Type mismatch

// AFTER
const story = Story.fromJSON(typeStory); // Proper conversion
```

**Files to Fix:**
- `src/components/OperationsPanel.tsx` - Add types, fix undefined checks
- `src/components/ImportStoryDialog.tsx` - Fix Character type, Story conversion
- `src/services/FileSystemService.ts` - Add browser API types
- Various other services with type issues

---

### 5. Browser API Type Definitions

**Problem:** `window.showDirectoryPicker` and FileSystemDirectoryHandle not typed

**Solution:** Add type declarations

Create `src/types/browser-apis.d.ts`:
```typescript
// File System Access API types
interface FileSystemDirectoryHandle {
  kind: 'directory';
  name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
  [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>;
}

interface FileSystemFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

type FileSystemHandle = FileSystemDirectoryHandle | FileSystemFileHandle;

interface Window {
  showDirectoryPicker(options?: {
    mode?: 'read' | 'readwrite';
    startIn?: FileSystemHandle | string;
  }): Promise<FileSystemDirectoryHandle>;
}
```

**Files to Create:**
- `src/types/browser-apis.d.ts`

**Files to Update:**
- `tsconfig.app.json` - Include the new type definition file

---

## Data Models

No new data models needed. All fixes work with existing types.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

#### 1.1-1.3 File casing fixes
**Thoughts:** These are build-time checks. We verify by running the build.
**Testable:** yes - example (build succeeds)

#### 2.1-2.4 MUI Grid migration
**Thoughts:** These are about maintaining UI layout behavior. Existing tests cover this.
**Testable:** yes - property (existing tests)

#### 3.1-3.3 Unused imports cleanup
**Thoughts:** These are build-time checks. We verify by running the build.
**Testable:** yes - example (build succeeds)

#### 4.1-4.4 Type error fixes
**Thoughts:** These are build-time checks. We verify by running the build and tests.
**Testable:** yes - property (build succeeds + tests pass)

#### 5.1-5.4 Browser API types
**Thoughts:** These are build-time checks. We verify by running the build.
**Testable:** yes - example (build succeeds)

#### 6.1-6.4 Build verification
**Thoughts:** These are integration tests. We verify by running the full build and test suite.
**Testable:** yes - property (build + tests pass)

#### 7.1-7.4 Code quality
**Thoughts:** These are about code maintainability, verified by linting and review.
**Testable:** yes - example (ESLint passes)

---

## Property Reflection

All properties are about build-time verification and can be combined into:
1. **Build succeeds** - Covers requirements 1, 3, 4, 5, 6
2. **Tests pass** - Covers requirements 2, 4, 6
3. **Linting passes** - Covers requirement 7

---

## Correctness Properties

### Property 1: Build compilation succeeds
*For any* code changes made to fix TypeScript errors, the TypeScript compiler should successfully compile without errors
**Validates: Requirements 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2**

### Property 2: All tests continue to pass
*For any* code changes made to fix build errors, all 819 existing tests should continue to pass without modification
**Validates: Requirements 2.3, 4.4, 6.3, 6.4**

### Property 3: Code quality is maintained
*For any* code changes made, ESLint should not report new warnings and code should follow existing patterns
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

---

## Error Handling

### Build Errors
- If build fails after fixes → Review error messages, identify root cause
- If tests fail after fixes → Revert changes, investigate test failures
- If new errors appear → Fix incrementally, verify after each change

### Runtime Errors
- If Electron app crashes → Add proper error handling for missing APIs
- If UI breaks → Verify Grid migration maintained layout
- If functionality breaks → Check type conversions are correct

---

## Testing Strategy

### Verification Steps

1. **After Each Category Fix:**
   - Run `npm run build` → Should succeed
   - Run `npm test -- --run` → All 819 tests should pass
   - Run `npm run lint` → No new warnings

2. **Final Verification:**
   - Run `npm run electron:build` → Should complete successfully
   - Run `npm test -- --run` → All 819 tests should pass
   - Run `npm run lint` → No new warnings
   - Manual test: Launch Electron app → Should start without errors

### Testing Approach

- **Unit Tests:** Existing 819 tests cover functionality
- **Integration Tests:** Build process verifies integration
- **Manual Testing:** Launch Electron app to verify it works

---

## Implementation Plan Summary

### Fix Order (by priority and dependency)

1. **File Casing** (1 error) - Quick fix, no dependencies
2. **Unused Imports** (10 errors) - Quick cleanup, no dependencies
3. **Browser API Types** (20+ errors) - Enables FileSystemService fixes
4. **Type Errors** (80+ errors) - Most complex, requires careful fixes
5. **MUI Grid Migration** (30+ errors) - UI changes, test carefully

**Estimated Effort:** 4-6 hours

---

## Success Criteria

1. ✅ `npm run electron:build` completes without errors
2. ✅ All 819 tests pass
3. ✅ No new ESLint warnings
4. ✅ Electron app launches successfully
5. ✅ Web build still works
6. ✅ All functionality preserved
