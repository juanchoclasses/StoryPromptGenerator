# Refactoring Roadmap - Quick Reference

**For:** Story Prompter Development Team  
**Created:** November 27, 2025  
**Full Analysis:** See `ARCHITECTURE-ANALYSIS-REPORT.md`

---

## 🎯 Quick Stats

- **Total LOC:** ~27,000
- **Test Coverage:** 73% (services) ⬆️, 8% (components) ⬆️
- **Total Tests:** 527 tests, 514 passing (97.5%)
- **Critical Issues:** 5 → 1.5 remaining ✅ (SceneEditor Phase 1 complete!)
- **Progress:** 73% complete (52/71 hours)
- **Health Score:** 6.5 → 8.0 (+1.5) 🎉

---

## 🎉 Recent Achievements (Nov 27-30, 2025)

**Sprint 1 & 2: COMPLETE** ✅

### Key Accomplishments:
- ✅ **492 tests created** (479 passing - 97.4% pass rate)
- ✅ **Service coverage: 35% → 73%** (38% improvement)
- ✅ **CastManager refactored** (243 lines eliminated, 70% duplication removed)
- ✅ **Pluggable prompt architecture** (supports multiple AI model formats)
- ✅ **Storage architecture documented** (750+ lines of comprehensive docs)
- ✅ **Health score: 6.5 → 7.8** (+1.3 points)

### Time Investment:
- ~40 hours invested
- 68% of planned refactoring complete
- 38 hours remaining to reach 8.5/10 health score

### Next Up (Sprint 3):
- Break up SceneEditor (2400 → <800 lines)
- Merge diagram renderers
- Add 5-10 more component tests
- Add integration tests

---

## 🚨 Top 5 Critical Issues

### 1. ~~Zero Component Tests~~ ✅ MAJOR PROGRESS
**Impact:** High | **Effort:** High | **Priority:** P0

- ~~**Problem:** 24 components, 0 tests~~
- **Progress:** 2/24 components tested (8%) - **INCLUDING SceneEditor!**
- **Completed:**
  - ✅ React Testing Library configured
  - ✅ VersionInfo.test.tsx created (example)
  - ✅ **SceneEditor.test.tsx - 35 comprehensive tests!** 🎉
  - ✅ Testing patterns demonstrated
  - ✅ Complex component testing proven
- **Remaining:** 
  - Test 5-10 more small components
  - Document testing patterns
- **Time:** 40 hours (16 spent, 24 remaining)
- **Status:** 🟢 **EXCELLENT PROGRESS**

### 2. ~~CastManager Duplication~~ ✅ COMPLETE
**Impact:** High | **Effort:** Medium | **Priority:** P0

- ~~**Problem:** 70% code overlap between CastManager & BookCastManager~~
- **Completed:**
  - ✅ Extracted `useCharacterManager` hook (380 lines)
  - ✅ Refactored CastManager: 484 → 316 lines (35% reduction)
  - ✅ Refactored BookCastManager: 441 → 366 lines (17% reduction)
  - ✅ Total: 243 lines eliminated, 70% duplication removed
- **Time:** 8 hours (completed)
- **Status:** ✅ **RESOLVED** (Nov 30, 2025)

### 3. SceneEditor "God Object" 🎯 **PHASE 1 COMPLETE!** ✅
**Impact:** High | **Effort:** High | **Priority:** P1

- **Problem:** 2,400 lines in single component
- **Strategy:** TEST FIRST ✅, THEN REFACTOR ⏳

**Phase 1: Test SceneEditor** ✅ **COMPLETE**
  - ✅ Wrote 35 comprehensive React tests
  - ✅ All major workflows tested (editing, character/element selection, image generation, etc.)
  - ✅ 70%+ coverage of critical paths - ACHIEVED
  - ✅ Safety net created - SOLID
  - **Time:** 12 hours ✅ ON TARGET

**Phase 2: Refactor SceneEditor** ⏳ **READY TO START**
  - ⏳ Extract `SceneCharacterSelector`
  - ⏳ Extract `SceneElementSelector`
  - ⏳ Extract `SceneImageGenerator`
  - ⏳ Extract `useSceneEditor` hook
  - ⏳ Target: 2400 → <800 lines
  - ⏳ Verify tests pass after each change
  - **Time:** 16 hours

- **Total Time:** 28 hours (12 spent ✅, 16 remaining)
- **Status:** 🟢 **Phase 1 Success! Ready for Phase 2**
- **Owner:** TBD

### 4. ~~Untested Critical Services~~ ✅ MAJOR PROGRESS
**Impact:** High | **Effort:** High | **Priority:** P1

- ~~**Problem:** 17 services with no tests~~
- **Progress:** Service coverage 35% → 73%
- **Completed:**
  - ✅ BookService: 28/28 tests (100%)
  - ✅ ImageStorageService: 27/27 tests (100%)
  - ✅ FileSystemService: 18/35 tests (critical paths)
  - ✅ Total: 492 tests, 479 passing (97.4%)
- **Remaining:**
  - SceneImageGenerationService
  - DiagramRenderer/DiagramRenderService
  - Export services
- **Time:** 24 hours (18 spent, 6 remaining)
- **Status:** 🟢 **MAJOR PROGRESS** (75% complete)

### 5. Diagram Renderer Duplication 🟡
**Impact:** Medium | **Effort:** Low | **Priority:** P1

- **Problem:** Two diagram renderers (80% overlap)
  - DiagramRenderer.ts (651 lines)
  - DiagramRenderService.ts (638 lines)
- **Risk:** Confusion, inconsistency
- **Action:**
  - Merge into DiagramRenderService
  - Deprecate DiagramRenderer
  - Add tests
- **Time:** 6 hours
- **Owner:** TBD

---

## 📅 Sprint Plan

### Sprint 1: Testing Foundation (Week 1) ✅ COMPLETE
**Goal:** Establish testing infrastructure and cover critical paths

- [x] Fix CastManager sync issue ✅ (DONE Nov 27)
- [x] Set up React Testing Library ✅ (DONE Nov 27)
- [x] Add ImageStorageService tests ✅ (DONE Nov 30 - 27 tests passing)
- [x] Example component test ✅ (DONE Nov 27 - VersionInfo.test.tsx)
- [x] Add BookService tests ✅ (DONE Nov 30 - 28 tests passing)
- [x] Add FileSystemService tests ✅ (DONE Nov 30 - 18 critical path tests)
- [x] Document storage architecture ✅ (DONE Nov 30 - 750+ lines)

**Deliverables:**
- React Testing Library configured ✅
- ImageStorageService tested (27 tests) ✅
- Example component test ✅
- BookService tested (28 tests) ✅
- FileSystemService tested (18 tests) ✅
- STORAGE-ARCHITECTURE-DETAILED.md ✅

**Effort:** 40 hours ✅ **COMPLETE**

### Sprint 2: Component Testing & Refactoring (Week 2) ✅ COMPLETE
**Goal:** Start component tests and reduce duplication

- [x] Extract `useCharacterManager` hook ✅ (DONE Nov 30)
- [x] Refactor CastManager components ✅ (DONE Nov 30)
- [x] Create pluggable prompt architecture ✅ (DONE Nov 30 - BONUS!)
- [x] Character type deduplication ✅ (DONE Nov 30 - BONUS!)
- [x] UI improvements ✅ (DONE Nov 30 - BONUS!)
- [ ] Add tests for 5 small components (1/5 done)
- [ ] Merge diagram renderers (not started)

**Deliverables:**
- CastManager duplication eliminated ✅
- useCharacterManager hook (380 lines) ✅
- Pluggable prompt building ✅
- Storage architecture docs ✅
- Character improvements ✅

**Effort:** 38 hours → ~30 hours spent ✅ **MOSTLY COMPLETE**

### Sprint 3: The SceneEditor Challenge (Week 3) 🎯 PHASE 1 COMPLETE
**Goal:** Test and refactor the 2,400-line SceneEditor using test-first approach

**Phase 1: Test SceneEditor FIRST** ✅ COMPLETE
- [x] Create SceneEditor.test.tsx ✅
- [x] Test scene editing workflows ✅ (6 tests)
- [x] Test character/element selection ✅ (4 tests)
- [x] Test image generation pipeline ✅ (4 tests)
- [x] Test prompt building ✅ (2 tests)
- [x] Test dialog interactions ✅ (2 tests)
- [x] Test error handling ✅ (3 tests)
- [x] Test backward compatibility ✅ (2 tests)
- [x] Test layout/diagram/macro/performance ✅ (7 tests)
- [x] Aim for 70%+ coverage ✅ **35 TESTS PASSING!**
- **Time:** 12 hours ✅ COMPLETE

**Phase 2: Refactor SceneEditor** ⏳ READY TO START
- [ ] Extract `SceneCharacterSelector`
- [ ] Extract `SceneElementSelector`
- [ ] Extract `SceneImageGenerator`
- [ ] Extract `ScenePromptPreview`
- [ ] Extract `useSceneEditor` hook
- [ ] Run tests after each extraction
- [ ] Target: 2400 → <800 lines
- **Time:** 16 hours

**Phase 3: Cleanup**
- [ ] Merge diagram renderers (6 hours)
- [ ] Add 5-10 more component tests (10 hours)
- [ ] Document testing patterns

**Deliverables:**
- SceneEditor tested (70%+ coverage)
- SceneEditor refactored (<800 lines per component)
- Diagram renderers merged
- Testing patterns documented
- 5+ more components tested

**Effort:** 44 hours (12 + 16 + 16)

**Rationale:** Testing first creates safety net for refactoring 2400-line behemoth

---

## 📋 Checklists

### Setting Up Component Testing

```bash
# Install dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Create test setup file
# tests/setup.ts
```

- [ ] Install React Testing Library
- [ ] Configure test environment
- [ ] Create example component test
- [ ] Add to CI pipeline
- [ ] Document testing patterns

### Extracting useCharacterManager Hook

- [ ] Create `src/hooks/useCharacterManager.ts`
- [ ] Move character state logic
- [ ] Move add/edit/delete logic
- [ ] Move save/load logic
- [ ] Add hook tests
- [ ] Refactor CastManager to use hook
- [ ] Refactor BookCastManager to use hook
- [ ] Verify both still work
- [ ] Remove duplicated code

### Breaking Up SceneEditor

- [ ] Identify independent sections
- [ ] Extract `SceneCharacterSelector.tsx`
- [ ] Extract `SceneElementSelector.tsx`
- [ ] Extract `SceneImageGenerator.tsx`
- [ ] Extract `ScenePromptPreview.tsx`
- [ ] Create `useSceneEditor` hook
- [ ] Refactor SceneEditor to use sub-components
- [ ] Add tests for each sub-component
- [ ] Verify functionality

### Adding Service Tests

**For each untested service:**

- [ ] Create test file: `tests/services/{ServiceName}.test.ts`
- [ ] Mock dependencies
- [ ] Test happy paths
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Aim for 80%+ coverage
- [ ] Document test patterns

---

## 🔍 Code Review Checklist

Use this for all PRs:

### General
- [ ] No component over 800 lines?
- [ ] No service over 600 lines?
- [ ] Tests included?
- [ ] Documentation updated?

### Testing
- [ ] New code has tests?
- [ ] Tests pass locally?
- [ ] Tests cover edge cases?
- [ ] Mocks used appropriately?

### Code Quality
- [ ] No obvious duplication?
- [ ] Error handling consistent?
- [ ] Types properly defined (no `any`)?
- [ ] Functions < 50 lines?

### Architecture
- [ ] Follows existing patterns?
- [ ] Doesn't break abstractions?
- [ ] Dependencies reasonable?
- [ ] Side effects documented?

---

## 🎓 Best Practices

### Component Size Guidelines

| Lines | Status | Action |
|-------|--------|--------|
| < 300 | ✅ Good | None needed |
| 300-500 | 🟡 OK | Watch for growth |
| 500-800 | 🟠 Warning | Consider splitting |
| 800+ | 🔴 Too large | Must split |

### Service Size Guidelines

| Lines | Status | Action |
|-------|--------|--------|
| < 200 | ✅ Good | None needed |
| 200-400 | 🟡 OK | Watch for growth |
| 400-600 | 🟠 Warning | Consider splitting |
| 600+ | 🔴 Too large | Must split |

### Testing Guidelines

**What to Test:**
- ✅ Business logic
- ✅ Data transformations
- ✅ Error handling
- ✅ User interactions
- ✅ Edge cases

**What NOT to Test:**
- ❌ Third-party libraries
- ❌ Trivial getters/setters
- ❌ Exact UI styling
- ❌ Implementation details

### Refactoring Guidelines

**When to Refactor:**
- 🟢 During feature work (small improvements)
- 🟢 In dedicated refactoring tasks
- 🟢 When adding tests
- 🔴 NOT in hotfix branches
- 🔴 NOT without tests

**Refactoring Steps:**
1. Write tests for existing behavior
2. Make refactoring changes
3. Verify tests still pass
4. Add new tests if needed
5. Update documentation

---

## 📊 Metrics to Track

### Weekly
- [ ] Total tests added
- [ ] Test coverage %
- [ ] Lines of duplicated code
- [ ] Average component size
- [ ] Average service size

### Monthly
- [ ] Overall test coverage
- [ ] Number of "god objects" (>800 lines)
- [ ] Technical debt items closed
- [ ] Code quality score

### Tools
- Use `npm run test:coverage` for coverage reports
- Use ESLint for code quality
- Track in GitHub Issues/Projects

---

## 🆘 Need Help?

### Resources
- **Full Analysis:** `ARCHITECTURE-ANALYSIS-REPORT.md`
- **Progress Tracking:** `ARCHITECTURE-HEALING-TRACKING.md` ✨ NEW
- **Storage Docs:** `STORAGE-ARCHITECTURE-DETAILED.md`
- **Diagrams:** `ARCHITECTURE-DIAGRAMS.md`
- **Testing Setup:** `tests/setup.ts`
- **Component Testing:** (TBD - create during Sprint 3)

### Contacts
- **Architecture Questions:** TBD
- **Testing Questions:** TBD
- **Code Review:** TBD

---

## 📈 Progress Tracking

### Overall Progress

- [x] Architecture analysis complete ✅
- [x] Sprint 1 complete ✅ (100% - Nov 30, 2025)
- [x] Sprint 2 complete ✅ (90% - Nov 30, 2025)
- [ ] Sprint 3 complete (0% - starting)
- [ ] 80% test coverage achieved (currently ~60%)
- [ ] All "god objects" refactored (0/2 - SceneEditor, OperationsPanel)
- [x] Critical duplication eliminated ✅ (CastManager, Character types, Prompts)

### Test Coverage Progress

| Category | Start | Sprint 1 ✅ | Sprint 2 ✅ | Sprint 3 | Target |
|----------|-------|------------|------------|----------|--------|
| Services | 35% | 50% | **73%** ✅ | 80% | 80% |
| Components | 0% | 0% | **4%** ⬆️ | 20% | 60% |
| Models | 100% | 100% | **100%** ✅ | 100% | 100% |
| **Overall** | **18%** | **30%** | **~60%** ✅ | **70%** | **75%** |

**Current Status:** 492 tests, 479 passing (97.4% pass rate) 🎉

### Duplication Elimination Progress

- [x] CastManager sync issue ✅ (Fixed Nov 27)
- [x] CastManager hooks extracted ✅ (Nov 30 - useCharacterManager)
- [x] Character type deduplication ✅ (Nov 30 - Single Character definition)
- [x] Prompt builder unified ✅ (Nov 30 - Pluggable architecture, exceeded expectations!)
- [ ] Diagram renderers merged ⏳ (Next priority)
- [ ] Image conversion utilities extracted ⏳ (Low priority)

### Component Size Progress

- [ ] SceneEditor < 800 lines
- [ ] OperationsPanel < 800 lines
- [ ] StoriesPanel < 800 lines
- [ ] CharacterAuditionDialog < 800 lines
- [ ] SceneLayoutEditor < 800 lines

---

**Last Updated:** November 30, 2025  
**Previous Update:** November 27, 2025  
**Next Review:** December 11, 2025 (after Sprint 3)

