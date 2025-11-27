# Architecture Documentation Index

**Story Prompter (Prompter) - Architecture & Refactoring Documentation**

---

## 📚 Documentation Overview

This folder contains comprehensive architecture analysis and refactoring plans for the Story Prompter codebase. These documents were created on **November 27, 2025** following the discovery of code duplication issues.

---

## 📄 Document Guide

### 1. 🏗️ ARCHITECTURE-ANALYSIS-REPORT.md
**Purpose:** Comprehensive codebase analysis  
**Audience:** All developers, technical leads  
**Read Time:** 20-30 minutes

**Contains:**
- Executive summary with key findings
- Codebase structure overview
- Detailed test coverage analysis
- Code duplication patterns
- Architectural concerns
- Technical debt summary
- Prioritized recommendations

**When to Read:**
- 📌 START HERE - First time reviewing the architecture
- Before planning refactoring work
- During architecture reviews
- When onboarding new developers

### 2. 📊 ARCHITECTURE-DIAGRAMS.md
**Purpose:** Visual representations of the architecture  
**Audience:** Visual learners, architects, new developers  
**Read Time:** 15-20 minutes

**Contains:**
- Storage architecture diagram
- Code duplication heat map
- Component size visualization
- Test coverage heat map
- Dependency graphs
- Proposed refactoring diagrams
- Testing pyramid

**When to Read:**
- After reading the main report
- When you need to understand system flow
- When planning refactoring work
- For quick visual reference

### 3. 🗺️ REFACTORING-ROADMAP.md
**Purpose:** Actionable refactoring plan  
**Audience:** Developers actively working on refactoring  
**Read Time:** 10-15 minutes

**Contains:**
- Top 5 critical issues
- 3-sprint refactoring plan
- Detailed checklists
- Best practices and guidelines
- Code review checklist
- Progress tracking

**When to Read:**
- 📌 READ THIS for day-to-day refactoring work
- Before starting a refactoring task
- During sprint planning
- When tracking progress

### 4. 🐛 CHARACTER-AUDITION-SYNC-FIX.md
**Purpose:** Documentation of the CastManager bug fix  
**Audience:** Developers, maintainers  
**Read Time:** 5 minutes

**Contains:**
- Bug description
- Root cause analysis
- The fix applied
- Data flow explanation

**When to Read:**
- When working on CastManager components
- To understand the character audition persistence issue
- As an example of duplication bugs

---

## 🚀 Quick Start Guide

### For New Developers

1. **Read:** ARCHITECTURE-ANALYSIS-REPORT.md (Executive Summary + Section 1-2)
2. **Review:** ARCHITECTURE-DIAGRAMS.md (Sections 1-4)
3. **Bookmark:** REFACTORING-ROADMAP.md (for reference)

**Time:** ~30 minutes

### For Developers Starting Refactoring Work

1. **Review:** ARCHITECTURE-ANALYSIS-REPORT.md (Section 3: Code Duplication)
2. **Check:** REFACTORING-ROADMAP.md (Sprint Plan + Checklists)
3. **Reference:** ARCHITECTURE-DIAGRAMS.md (as needed)

**Time:** ~15 minutes

### For Technical Leads / Architects

1. **Read:** Full ARCHITECTURE-ANALYSIS-REPORT.md
2. **Study:** ARCHITECTURE-DIAGRAMS.md (Sections 1-2)
3. **Review:** REFACTORING-ROADMAP.md (Progress Tracking)

**Time:** ~1 hour

---

## 🎯 Key Findings (TL;DR)

### The Good ✅
- Codebase is functional and feature-rich
- Good TypeScript usage
- Models are well-designed and tested
- Modern tech stack

### The Bad ❌
- **0% component test coverage** (critical)
- **65% of services untested** (high risk)
- **Code duplication** in CastManager, Diagram Renderers
- **"God objects"** - SceneEditor (2,400 lines), OperationsPanel (2,164 lines)

### The Plan 📋
- **3-week refactoring sprint**
- Add tests for critical services
- Extract shared logic into hooks
- Break up large components
- Eliminate code duplication

---

## 📊 Current Status

**Date:** November 27, 2025

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Test Coverage (Services)** | 35% | 80% | 🔴 |
| **Test Coverage (Components)** | 0% | 60% | 🔴 |
| **Test Coverage (Overall)** | 18% | 75% | 🔴 |
| **Largest Component** | 2,400 lines | <800 lines | 🔴 |
| **Code Duplication Issues** | 5 critical | 0 critical | 🟡 |
| **Untested Critical Services** | 17 | 0 | 🔴 |

**Health Score:** 6.5/10

---

## 🔥 Critical Issues (Top 5)

1. **Zero Component Tests** - P0, 40 hours
2. **CastManager Duplication** - P0, 8 hours (partially fixed)
3. **SceneEditor "God Object"** - P1, 16 hours
4. **Untested Critical Services** - P1, 24 hours
5. **Diagram Renderer Duplication** - P1, 6 hours

**Total Estimated Effort:** 118 hours (~3 weeks)

---

## 📅 Milestones

### Completed ✅
- [x] Architecture analysis completed (Nov 27, 2025)
- [x] CastManager sync bug fixed (Nov 27, 2025)
- [x] Documentation created (Nov 27, 2025)

### Sprint 1 (Week 1)
- [ ] Testing infrastructure setup
- [ ] 3 critical services tested
- [ ] Storage architecture documented

### Sprint 2 (Week 2)
- [ ] 5 components tested
- [ ] CastManager refactored
- [ ] Diagram renderers merged

### Sprint 3 (Week 3)
- [ ] SceneEditor refactored
- [ ] Integration tests added
- [ ] PromptBuilder utility created

---

## 🛠️ Tools & Resources

### Testing
- **Framework:** Vitest (already configured)
- **Component Testing:** React Testing Library (to be added)
- **Coverage:** `npm run test:coverage`

### Code Quality
- **Linting:** ESLint
- **Type Checking:** TypeScript
- **Formatting:** (TBD)

### Documentation
- **Architecture Docs:** This folder
- **API Docs:** (TBD)
- **Component Docs:** (TBD)

---

## 👥 Ownership & Contacts

### Architecture
- **Owner:** TBD
- **Reviewers:** TBD

### Testing
- **Owner:** TBD
- **Reviewers:** TBD

### Refactoring
- **Coordinator:** TBD
- **Sprint Lead:** TBD

---

## 📝 Related Documents

### Planning Documents (Already Existing)
- `CHARACTER-AUDITION.md` - Character audition feature plan
- `CHARACTER-AUDITION-TRACKER.md` - Feature progress tracker
- `UNIFIED_IMAGE_GENERATION.md` - Image generation architecture
- `CHARACTERS_TO_BOOK_PLAN.md` - Move characters to book level
- Various other feature plans...

### Bug Fixes & Tracking
- `CHARACTER-AUDITION-SYNC-FIX.md` - Recent bug fix
- `DATA-LOSS-SUMMARY.md` - Data loss issues
- `TEST-FIXES-SUMMARY.md` - Test fixing summary

### Guides
- `FILESYSTEM-STORAGE-GUIDE.md` - Storage system guide
- `IMAGE-CACHE-GUIDE.md` - Image caching guide
- `STORY_DEFINITION_GUIDE.md` - Story definition guide

---

## 🔄 Review Schedule

### Weekly
- Progress check against roadmap
- Update progress tracking in REFACTORING-ROADMAP.md
- Review new technical debt

### Monthly
- Review all architecture documents
- Update metrics and status
- Adjust priorities if needed

### Quarterly
- Full architecture review
- Update recommendations
- Revise health score

**Next Review:** December 11, 2025 (after Sprint 1)

---

## 📢 Communication

### When to Update These Docs

**ARCHITECTURE-ANALYSIS-REPORT.md:**
- Quarterly reviews
- After major architectural changes
- When new patterns emerge

**ARCHITECTURE-DIAGRAMS.md:**
- When architecture changes
- After refactoring major components
- When adding new services

**REFACTORING-ROADMAP.md:**
- Weekly (progress tracking)
- After completing sprint items
- When priorities change

### How to Contribute

1. Create a PR with changes
2. Tag architecture team for review
3. Update "Last Updated" date
4. Add to git with descriptive commit message

---

## 🎓 Learning Resources

### Understanding the Codebase
1. Start with Model classes (`src/models/`)
2. Review Service interfaces (`src/services/`)
3. Study component hierarchy (`src/components/`)
4. Follow data flow diagrams in ARCHITECTURE-DIAGRAMS.md

### Testing Best Practices
- (TBD - will be added after Sprint 1)

### Refactoring Patterns
- (TBD - will be documented as we refactor)

---

## 🏆 Success Criteria

We'll consider the refactoring successful when:

- [ ] Test coverage > 75% overall
- [ ] No component > 800 lines
- [ ] No service > 600 lines
- [ ] All critical duplication eliminated
- [ ] Health score > 8.0/10
- [ ] Zero "god objects"
- [ ] All critical services tested

**Target Completion:** End of Q1 2026

---

## ❓ FAQ

### Q: Where do I start?
**A:** Read the ARCHITECTURE-ANALYSIS-REPORT.md Executive Summary, then check REFACTORING-ROADMAP.md for current sprint tasks.

### Q: Which document should I update?
**A:** Depends on the change:
- Architecture changes → ARCHITECTURE-ANALYSIS-REPORT.md
- Visual updates → ARCHITECTURE-DIAGRAMS.md
- Progress tracking → REFACTORING-ROADMAP.md
- Bug fixes → Create new {BUG-NAME}-FIX.md

### Q: How do I track my refactoring work?
**A:** Use the checklists in REFACTORING-ROADMAP.md and update progress tracking section.

### Q: Can I skip writing tests?
**A:** No. Tests are now required for all new code and refactoring work.

### Q: What if I find new duplication?
**A:** Document it in ARCHITECTURE-ANALYSIS-REPORT.md Section 3 and add to REFACTORING-ROADMAP.md.

---

**Documentation Maintained By:** Architecture Team  
**Last Updated:** November 27, 2025  
**Version:** 1.0

---

## 📎 Quick Links

- [Main Report](./ARCHITECTURE-ANALYSIS-REPORT.md)
- [Diagrams](./ARCHITECTURE-DIAGRAMS.md)
- [Roadmap](./REFACTORING-ROADMAP.md)
- [Recent Fix](./CHARACTER-AUDITION-SYNC-FIX.md)

