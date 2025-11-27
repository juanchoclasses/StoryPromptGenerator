# Refactoring Roadmap - Quick Reference

**For:** Story Prompter Development Team  
**Created:** November 27, 2025  
**Full Analysis:** See `ARCHITECTURE-ANALYSIS-REPORT.md`

---

## 🎯 Quick Stats

- **Total LOC:** ~27,000
- **Test Coverage:** 35% (services), 0% (components)
- **Critical Issues:** 5
- **Estimated Effort:** 118 hours (~3 weeks)

---

## 🚨 Top 5 Critical Issues

### 1. Zero Component Tests 🔴
**Impact:** High | **Effort:** High | **Priority:** P0

- **Problem:** 24 components, 0 tests
- **Risk:** Regressions go unnoticed
- **Action:** 
  - Set up React Testing Library
  - Test 5 small components first
  - Create testing patterns
- **Time:** 40 hours
- **Owner:** TBD

### 2. CastManager Duplication 🟡
**Impact:** High | **Effort:** Medium | **Priority:** P0

- **Problem:** 70% code overlap between CastManager & BookCastManager
- **Risk:** Code gets out of sync (already happened!)
- **Action:**
  - Extract `useCharacterManager` hook
  - Extract `useCharacterAudition` hook
  - Refactor both components
- **Time:** 8 hours
- **Owner:** TBD

### 3. SceneEditor "God Object" 🟡
**Impact:** High | **Effort:** High | **Priority:** P1

- **Problem:** 2,400 lines in single component
- **Risk:** Hard to maintain, test, understand
- **Action:**
  - Extract `SceneCharacterSelector`
  - Extract `SceneElementSelector`
  - Extract `SceneImageGenerator`
  - Extract `useSceneEditor` hook
- **Time:** 16 hours
- **Owner:** TBD

### 4. Untested Critical Services 🟡
**Impact:** High | **Effort:** High | **Priority:** P1

- **Problem:** 17 services with no tests, including:
  - BookService (622 lines)
  - FileSystemService (920 lines)
  - ImageStorageService (422 lines)
  - SceneImageGenerationService (722 lines)
- **Risk:** Core functionality breaks without notice
- **Action:**
  - Add tests for top 5 critical services
  - Target 80% coverage
- **Time:** 24 hours
- **Owner:** TBD

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

### Sprint 1: Testing Foundation (Week 1)
**Goal:** Establish testing infrastructure and cover critical paths

- [x] Fix CastManager sync issue (DONE Nov 27)
- [ ] Set up React Testing Library
- [ ] Add BookService tests
- [ ] Add FileSystemService tests
- [ ] Add ImageStorageService tests
- [ ] Document storage architecture

**Deliverables:**
- 3 services tested (80%+ coverage)
- Testing patterns documented
- Storage architecture diagram

**Effort:** 40 hours

### Sprint 2: Component Testing & Refactoring (Week 2)
**Goal:** Start component tests and reduce duplication

- [ ] Add tests for 5 small components
- [ ] Extract `useCharacterManager` hook
- [ ] Refactor CastManager components
- [ ] Merge diagram renderers
- [ ] Add SceneImageGenerationService tests

**Deliverables:**
- 5 components tested
- CastManager duplication eliminated
- Single diagram renderer

**Effort:** 38 hours

### Sprint 3: Major Refactoring (Week 3)
**Goal:** Break up large components and add integration tests

- [ ] Break up SceneEditor (extract 4 sub-components)
- [ ] Break up OperationsPanel
- [ ] Add integration tests (save/load, image gen)
- [ ] Create PromptBuilder utility
- [ ] Add component tests for complex components

**Deliverables:**
- SceneEditor < 800 lines
- 3 integration tests
- PromptBuilder utility
- 5 more component tests

**Effort:** 40 hours

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
- **Diagrams:** `ARCHITECTURE-DIAGRAMS.md`
- **Testing Docs:** (TBD - create after Sprint 1)
- **Architecture Docs:** (TBD - create after Sprint 1)

### Contacts
- **Architecture Questions:** TBD
- **Testing Questions:** TBD
- **Code Review:** TBD

---

## 📈 Progress Tracking

### Overall Progress

- [x] Architecture analysis complete
- [ ] Sprint 1 complete (0%)
- [ ] Sprint 2 complete (0%)
- [ ] Sprint 3 complete (0%)
- [ ] 80% test coverage achieved
- [ ] All "god objects" refactored
- [ ] All critical duplication eliminated

### Test Coverage Progress

| Category | Current | Sprint 1 | Sprint 2 | Sprint 3 | Target |
|----------|---------|----------|----------|----------|--------|
| Services | 35% | 50% | 60% | 75% | 80% |
| Components | 0% | 0% | 20% | 40% | 60% |
| Models | 100% | 100% | 100% | 100% | 100% |
| **Overall** | **18%** | **30%** | **45%** | **65%** | **75%** |

### Duplication Elimination Progress

- [x] CastManager sync issue (Fixed Nov 27)
- [ ] CastManager hooks extracted
- [ ] Diagram renderers merged
- [ ] Prompt builder unified
- [ ] Image conversion utilities extracted

### Component Size Progress

- [ ] SceneEditor < 800 lines
- [ ] OperationsPanel < 800 lines
- [ ] StoriesPanel < 800 lines
- [ ] CharacterAuditionDialog < 800 lines
- [ ] SceneLayoutEditor < 800 lines

---

**Last Updated:** November 27, 2025  
**Next Review:** December 11, 2025 (after Sprint 1)

