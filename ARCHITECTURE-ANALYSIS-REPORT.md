# Architecture Analysis Report

**Generated:** November 27, 2025  
**Codebase:** Story Prompter (Prompter)  
**Version:** 5.0+

---

## Executive Summary

This report provides a comprehensive analysis of the current codebase architecture, focusing on:
1. **Code Duplication** - Identifying redundant patterns and out-of-sync code
2. **Test Coverage** - Measuring what's tested vs. untested
3. **Architectural Concerns** - Identifying potential issues and improvements

### Key Findings

- 📊 **Codebase Size:** ~17,000+ lines of code
- ✅ **Test Coverage:** 54% of services tested, 0% of components tested
- ⚠️ **High Risk Areas:** 17 untested services, 24 untested components
- 🔄 **Code Duplication:** Multiple critical duplication patterns identified
- 🏗️ **Architecture:** Complex multi-layer storage system with some overlap

---

## 1. Codebase Structure Overview

### 1.1 File Counts

| Category | Count | Lines (Avg) | Total Lines (Est) |
|----------|-------|-------------|-------------------|
| **Models** | 3 | 295 | 885 |
| **Services** | 26 | 400 | 10,400 |
| **Components** | 24 | 660 | 15,840 |
| **Types** | 4 | - | - |
| **Tests** | 17 | - | - |
| **TOTAL** | 74 | - | ~27,000+ |

### 1.2 Largest Files (Complexity Indicators)

#### Services
1. **FileSystemService.ts** - 920 lines ⚠️ (Very complex)
2. **SceneImageGenerationService.ts** - 722 lines ⚠️
3. **BookExportWithImagesService.ts** - 693 lines ⚠️
4. **DiagramRenderer.ts** - 651 lines ⚠️
5. **DiagramRenderService.ts** - 638 lines ⚠️ (DUPLICATE?)
6. **BookService.ts** - 622 lines ⚠️

#### Components
1. **SceneEditor.tsx** - 2,400 lines 🚨 (CRITICAL - God Object)
2. **OperationsPanel.tsx** - 2,164 lines 🚨 (CRITICAL)
3. **StoriesPanel.tsx** - 1,053 lines ⚠️
4. **CharacterAuditionDialog.tsx** - 956 lines ⚠️
5. **SceneLayoutEditor.tsx** - 885 lines ⚠️

---

## 2. Test Coverage Analysis

### 2.1 Services Test Coverage

**Tested Services (9/26 = 35%):**
- ✅ BookCache.test.ts
- ✅ DiagramService.test.ts
- ✅ ImageCache.test.ts
- ✅ LayoutResolver.test.ts
- ✅ MarkdownStoryParser.test.ts
- ✅ PromptService.test.ts
- ✅ SettingsService.test.ts
- ✅ StorageService.test.ts
- ✅ TextMeasurementService.test.ts

Plus specialized serialization tests:
- ✅ BookCacheSerialization.test.ts
- ✅ BookSerialization.test.ts
- ✅ BookServiceConversion.test.ts
- ✅ HierarchicalLayoutSerialization.test.ts
- ✅ LayoutResolverIntegration.test.ts

**Total Service Tests: 14**

### 2.2 Untested Services (17/26 = 65%) 🚨

| Service | Lines | Risk Level | Priority |
|---------|-------|------------|----------|
| **BookService** | 622 | 🔴 CRITICAL | P0 |
| **BookExportWithImagesService** | 693 | 🔴 CRITICAL | P0 |
| **FileSystemService** | 920 | 🔴 CRITICAL | P0 |
| **ImageStorageService** | 422 | 🔴 CRITICAL | P0 |
| **SceneImageGenerationService** | 722 | 🔴 CRITICAL | P0 |
| **ImageGenerationService** | 220 | 🟡 HIGH | P1 |
| **CharacterImageService** | 344 | 🟡 HIGH | P1 |
| **DiagramRenderer** | 651 | 🟡 HIGH | P1 |
| **DiagramRenderService** | 638 | 🟡 HIGH | P1 |
| **ElectronFileSystemService** | 353 | 🟡 HIGH | P2 |
| **OverlayService** | 589 | 🟡 HIGH | P2 |
| **DocxExportService** | 209 | 🟢 MEDIUM | P2 |
| **StoryExportService** | - | 🟢 MEDIUM | P3 |
| **DirectoryMigrationService** | 223 | 🟢 MEDIUM | P3 |
| **ImageMigrationService** | 300 | 🟢 MEDIUM | P3 |
| **TestDirectoryService** | 452 | 🟢 MEDIUM | P3 |
| **LayoutCompositionService** | - | 🟢 MEDIUM | P3 |

### 2.3 Component Test Coverage

**Components Tested: 0/24 (0%)** 🚨🚨🚨

**ZERO component tests exist!**

This is a critical gap. Key components with NO tests:
- SceneEditor.tsx (2,400 lines) - Core feature
- OperationsPanel.tsx (2,164 lines) - Critical UI
- StoriesPanel.tsx (1,053 lines) - Core feature
- CharacterAuditionDialog.tsx (956 lines) - New feature
- All other components...

### 2.4 Model Test Coverage

**Models Tested: 3/3 (100%)** ✅
- ✅ Book.test.ts
- ✅ Scene.test.ts
- ✅ Story.test.ts

---

## 3. Code Duplication Analysis

### 3.1 Critical Duplications

#### 🚨 PRIORITY 1: CastManager Duplication (RECENTLY FIXED)

**Files:**
- `src/components/CastManager.tsx` (483 lines)
- `src/components/BookCastManager.tsx` (441 lines)

**Duplication:** ~70% code overlap

**Similar Code Blocks:**
- Character add/edit/delete logic
- Character audition dialog integration
- Character save/load flows
- UI rendering (accordions, buttons, dialogs)

**Recent Issue:** `handleAuditionUpdate()` was out of sync, causing book-level character auditions to not persist. **FIXED Nov 27, 2025.**

**Recommendation:**
- Extract shared logic into:
  - `hooks/useCharacterManager.ts` - character CRUD operations
  - `hooks/useCharacterAudition.ts` - audition dialog integration
- Keep only book-specific vs story-specific logic in each component
- Add integration tests for both

#### 🚨 PRIORITY 2: Diagram Rendering Duplication

**Files:**
- `src/services/DiagramRenderer.ts` (651 lines)
- `src/services/DiagramRenderService.ts` (638 lines)

**Status:** TWO separate diagram renderers with overlapping functionality

**DiagramRenderer:**
- Standalone class
- Exports: `DiagramType`, `BoardStyle`, `BorderStyle`, `DiagramStyle`, etc.
- Methods: `renderDiagram()`, various rendering helpers
- Described as "can be tested independently"

**DiagramRenderService:**
- Service class
- Similar types: `DiagramPanel`, `DiagramStyle`, `BoardStyle`
- Methods: `renderDiagram()`, `renderDiagramToImageBitmap()`
- Described as "based on tested prototype"

**Issue:** Why do we need TWO diagram renderers?

**Analysis:**
- Both initialize Mermaid, KaTeX, Highlight.js
- Both render to canvas
- Similar configuration logic
- Different export formats (one has ImageBitmap focus)

**Recommendation:**
- **Merge into one** - Keep DiagramRenderService, deprecate DiagramRenderer
- Extract common rendering logic
- Add comprehensive tests
- Document which one is the "source of truth"

#### 🟡 PRIORITY 3: FileSystem Services Duplication

**Files:**
- `src/services/FileSystemService.ts` (920 lines)
- `src/services/ElectronFileSystemService.ts` (353 lines)

**Issue:** Browser vs Electron implementations

**FileSystemService:**
- File System Access API (browser)
- IndexedDB for storing directory handles
- ~920 lines of complex logic

**ElectronFileSystemService:**
- Electron IPC API
- Simpler interface
- ~353 lines

**Status:** This is acceptable duplication (platform-specific)

**Recommendation:**
- Extract common interface/types
- Add tests for both
- Document platform decision logic clearly

#### 🟡 PRIORITY 4: Storage Services Overlap

**Files with overlapping concerns:**
- `StorageService.ts` - App-level data (books, activeBookId)
- `BookCache.ts` - In-memory book cache + filesystem persistence
- `BookService.ts` - Book CRUD operations
- `ImageCache.ts` - In-memory image cache
- `ImageStorageService.ts` - Image filesystem persistence

**Issue:** Complex multi-layer storage architecture

**Data Flow:**
```
User Action
    ↓
BookService (CRUD API)
    ↓
BookCache (In-memory + Filesystem)
    ↓
StorageService (AppData + Active Book)
    ↓
FileSystemService (File I/O)
```

**Concerns:**
1. **5 services** involved in saving a book
2. Multiple caching layers
3. Unclear responsibility boundaries
4. Hard to test in isolation
5. Potential for data inconsistency

**Recommendation:**
- Document the architecture clearly (storage layers diagram)
- Add integration tests for full save/load flows
- Consider consolidating BookService + BookCache
- Add monitoring/logging for cache invalidation

#### 🟡 PRIORITY 5: Prompt Building Duplication

**Multiple services build prompts:**

1. **SceneImageGenerationService.buildScenePrompt()** - Scene images
2. **CharacterImageService.buildCharacterPrompt()** - Character images
3. **PromptService** - Generic prompt operations?

**Common Patterns:**
- All use `formatBookStyleForPrompt(book.style)`
- All include book background setup
- All include story background setup
- Similar formatting and structure

**Recommendation:**
- Create `PromptBuilder` utility class
- Reusable methods:
  - `addBookStyle()`
  - `addBookBackground()`
  - `addStoryBackground()`
  - `addCharacterReferences()`
  - `addInstructions()`
- Services call PromptBuilder instead of duplicating logic

### 3.2 Minor Duplications

#### Image URL Conversion

Multiple services convert blob URLs to data URLs:

**Files:**
- `SceneImageGenerationService.blobUrlToDataUrl()`
- `CharacterAuditionDialog` (inline blob conversion)
- Potentially more...

**Recommendation:**
- Extract to `ImageUtils.blobUrlToDataUrl()`
- Use consistently across codebase

#### Save/Load Patterns

Many services have similar save/load boilerplate:
- Validate data
- Serialize to JSON
- Call FileSystemService
- Handle errors
- Log operations

**Recommendation:**
- Create base class or mixin for services with save/load
- Standard error handling
- Consistent logging

---

## 4. Architectural Concerns

### 4.1 God Objects

#### SceneEditor.tsx (2,400 lines) 🚨

**Responsibilities:**
- Scene editing UI
- Character/element selection
- Image generation
- Prompt building
- Layout management
- Dialog management
- Numerous state variables

**Recommendation:**
- Extract sub-components:
  - `SceneCharacterSelector.tsx`
  - `SceneElementSelector.tsx`
  - `SceneImageGenerator.tsx`
  - `ScenePromptPreview.tsx`
- Extract hooks:
  - `useSceneEditor()`
  - `useImageGeneration()`
- Target: <500 lines per component

#### OperationsPanel.tsx (2,164 lines) 🚨

Similar issues. Needs component extraction.

### 4.2 Testing Strategy

**Current Approach:**
- ✅ Good: Model tests exist
- ✅ Good: Some service tests
- ✅ Good: Serialization tests
- ❌ Bad: NO component tests
- ❌ Bad: 65% of services untested
- ❌ Bad: No integration tests

**Recommended Approach:**

1. **Unit Tests (Expand)**
   - Test all services (especially BookService, ImageStorageService)
   - Test complex utility functions
   - Test type guards and validators

2. **Component Tests (Add)**
   - Add React Testing Library
   - Test critical user flows:
     - Creating a scene
     - Generating an image
     - Character auditions
     - Scene editing
   - Start with smaller components, work up to complex ones

3. **Integration Tests (Add)**
   - Full save/load flows
   - Image generation pipeline
   - Character audition persistence
   - Book export with images

4. **E2E Tests (Future)**
   - Critical user journeys
   - Use Playwright or Cypress

### 4.3 Dependency Management

**Issue:** Some services have unclear dependencies

Example: `SceneImageGenerationService` depends on:
- ImageGenerationService
- ImageStorageService
- CharacterImageService
- FileSystemService
- OverlayService
- DiagramRenderService
- Book, Story, Scene models

**Recommendation:**
- Document service dependency graph
- Identify circular dependencies
- Consider dependency injection for testing

### 4.4 Error Handling

**Current State:**
- Inconsistent error handling across services
- Some services throw, some return null
- Some log, some don't
- User-facing errors not standardized

**Recommendation:**
- Create `AppError` base class with types:
  - `StorageError`
  - `ImageGenerationError`
  - `ValidationError`
  - `NetworkError`
- Consistent error logging strategy
- User-friendly error messages

### 4.5 Type Safety

**Current State:**
- Good use of TypeScript
- Some `any` types exist
- Type conversion in storage layers

**Areas for Improvement:**
- Eliminate remaining `any` types
- Add stricter type guards
- Use branded types for IDs (BookId, SceneId, etc.)

---

## 5. Technical Debt Summary

### 5.1 High Priority Debt

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| **Zero component tests** | 🔴 CRITICAL | 🔶🔶🔶 High | P0 |
| **CastManager duplication** | 🟡 HIGH | 🔶🔶 Medium | P0 |
| **SceneEditor size (2400 lines)** | 🟡 HIGH | 🔶🔶🔶 High | P1 |
| **Diagram renderer duplication** | 🟡 HIGH | 🔶 Low | P1 |
| **17 untested services** | 🟡 HIGH | 🔶🔶🔶 High | P1 |
| **Storage architecture complexity** | 🟢 MEDIUM | 🔶 Low | P2 |
| **Prompt building duplication** | 🟢 MEDIUM | 🔶 Low | P2 |

### 5.2 Estimated Refactoring Effort

| Task | Estimated Time | Priority |
|------|---------------|----------|
| Add component tests (basic coverage) | 40 hours | P0 |
| Refactor CastManager (extract hooks) | 8 hours | P0 |
| Add service tests (critical services) | 24 hours | P1 |
| Break up SceneEditor | 16 hours | P1 |
| Merge diagram renderers | 6 hours | P1 |
| Create PromptBuilder utility | 4 hours | P2 |
| Document storage architecture | 4 hours | P2 |
| Add integration tests | 16 hours | P2 |
| **TOTAL** | **118 hours** | (~3 weeks) |

---

## 6. Recommendations

### 6.1 Immediate Actions (This Sprint)

1. ✅ **DONE:** Fix CastManager synchronization (completed Nov 27, 2025)

2. **Add Tests for Critical Services:**
   - BookService
   - ImageStorageService
   - FileSystemService
   - Target: 80% coverage

3. **Document Storage Architecture:**
   - Create diagram showing all storage layers
   - Document when to use each service
   - Document cache invalidation rules

4. **Start Component Testing:**
   - Set up React Testing Library
   - Add tests for 3-5 small components
   - Create testing patterns/examples

### 6.2 Short Term (Next 2-3 Sprints)

1. **Extract CastManager Shared Logic:**
   - Create `useCharacterManager` hook
   - Create `useCharacterAudition` hook
   - Refactor both CastManagers to use hooks

2. **Merge Diagram Renderers:**
   - Consolidate into DiagramRenderService
   - Deprecate DiagramRenderer
   - Add comprehensive tests

3. **Break Up SceneEditor:**
   - Extract 4-5 sub-components
   - Extract custom hooks
   - Target: <800 lines

4. **Add Integration Tests:**
   - Test save/load flows
   - Test image generation pipeline
   - Test character audition persistence

### 6.3 Long Term (Next Quarter)

1. **Achieve 80% Test Coverage:**
   - All services tested
   - All models tested
   - Critical components tested
   - Integration tests for key flows

2. **Refactor Storage Architecture:**
   - Simplify layer structure if possible
   - Consider event-driven cache invalidation
   - Add monitoring/metrics

3. **Create PromptBuilder Utility:**
   - Extract common prompt logic
   - Standardize prompt formatting
   - Add tests

4. **Add E2E Tests:**
   - Critical user journeys
   - Regression prevention

### 6.4 Best Practices Going Forward

1. **No Component Over 800 Lines:**
   - Extract sub-components
   - Extract hooks
   - Review in PR

2. **No Service Over 600 Lines:**
   - Extract helpers
   - Split responsibilities
   - Review in PR

3. **Test First:**
   - Write test for new services
   - Write test for new components
   - Don't merge without tests

4. **Document Decisions:**
   - Architecture Decision Records (ADRs)
   - Update this report quarterly
   - Document complex flows

5. **Code Review Checklist:**
   - [ ] Tests included?
   - [ ] Documentation updated?
   - [ ] No duplication with existing code?
   - [ ] Component/service size reasonable?
   - [ ] Error handling consistent?

---

## 7. Positive Aspects

Despite the technical debt, the codebase has many strengths:

✅ **Strong TypeScript Usage:**
- Good type safety
- Clear interfaces
- Type exports

✅ **Good Model Layer:**
- Clean domain models (Book, Story, Scene)
- Well-tested
- Clear responsibilities

✅ **Comprehensive Feature Set:**
- Rich functionality
- Well-architected features (when complete)
- Good separation of concerns (in models)

✅ **Modern Stack:**
- React
- TypeScript
- Vite
- Material-UI
- Good tooling

✅ **Documentation:**
- Multiple planning documents
- Feature trackers
- Some inline documentation

---

## 8. Conclusion

The Story Prompter codebase is **functionally rich** but has **significant technical debt**:

### Health Score: 6.5/10

**Strengths:**
- ✅ Working features
- ✅ Good models
- ✅ Some tests
- ✅ Modern tech stack

**Weaknesses:**
- ❌ Low test coverage (especially components)
- ❌ Code duplication
- ❌ Large "god object" components
- ❌ Complex storage architecture

### Priority Focus:

1. **Testing** (P0) - Add tests for critical services and components
2. **Duplication** (P0-P1) - Fix CastManager sync, merge diagram renderers
3. **Refactoring** (P1-P2) - Break up large components, simplify architecture

With focused effort (~3 weeks of refactoring work), the codebase can reach an 8/10 health score.

---

**Next Steps:**
1. Review this report with the team
2. Prioritize immediate actions
3. Create GitHub issues for each refactoring task
4. Schedule regular architecture reviews
5. Update this report quarterly

---

**Report Maintained By:** Architecture Team  
**Last Updated:** November 27, 2025  
**Next Review:** February 2026

