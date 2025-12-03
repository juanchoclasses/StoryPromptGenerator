# Requirements Document - Electron Build Fixes

## Introduction

The Electron build process (`npm run electron:build`) is currently failing with 147 TypeScript errors. These errors prevent the application from being packaged as a desktop application. The errors fall into several categories:

1. **File casing issues** - Import statements with incorrect casing
2. **MUI Grid v2 migration issues** - Deprecated `item`, `xs`, `md` props
3. **Unused imports** - Dead code that needs cleanup
4. **Type errors** - Missing types, implicit any, possibly undefined
5. **File System API types** - Missing browser API type definitions

**Current State:**
- Web build: Works (npm run build)
- Electron build: Fails with 147 TypeScript errors
- Tests: All passing (819 tests)

**Goal:**
- Fix all TypeScript errors to enable successful Electron builds
- Maintain all existing functionality
- Keep all tests passing

## Glossary

- **Electron Build**: The process of compiling and packaging the app as a desktop application
- **MUI Grid v2**: Material-UI's updated Grid component with breaking changes from v1
- **File System Access API**: Browser API for accessing local files (not available in all contexts)
- **Type Safety**: Ensuring all TypeScript types are correctly defined and used

## Requirements

### Requirement 1

**User Story:** As a developer, I want to fix file casing issues, so that the build works on case-sensitive file systems.

#### Acceptance Criteria

1. WHEN the system imports ImageGenerationService THEN the import SHALL use correct casing consistently
2. WHEN TypeScript compiles THEN the system SHALL not report file casing conflicts
3. WHEN files are imported THEN the system SHALL match the actual filename casing exactly

### Requirement 2

**User Story:** As a developer, I want to migrate MUI Grid components to v2, so that the build succeeds with the current MUI version.

#### Acceptance Criteria

1. WHEN Grid components use the `item` prop THEN the system SHALL remove it (no longer needed in v2)
2. WHEN Grid components use `xs`, `md`, `sm`, `lg` props THEN the system SHALL migrate to the new Grid v2 API
3. WHEN Grid components are rendered THEN the system SHALL maintain the same layout behavior
4. WHEN all Grid migrations are complete THEN the system SHALL have no Grid-related TypeScript errors

### Requirement 3

**User Story:** As a developer, I want to remove unused imports and variables, so that the code is clean and the build succeeds.

#### Acceptance Criteria

1. WHEN a variable is declared but never used THEN the system SHALL remove it
2. WHEN an import is declared but never used THEN the system SHALL remove it
3. WHEN cleanup is complete THEN the system SHALL have no unused variable/import errors

### Requirement 4

**User Story:** As a developer, I want to fix type errors, so that TypeScript compilation succeeds.

#### Acceptance Criteria

1. WHEN a parameter has an implicit `any` type THEN the system SHALL add explicit type annotations
2. WHEN a property is possibly undefined THEN the system SHALL add proper null checks or optional chaining
3. WHEN types don't match THEN the system SHALL use correct type conversions or fix the type mismatch
4. WHEN all type errors are fixed THEN TypeScript SHALL compile without errors

### Requirement 5

**User Story:** As a developer, I want to add missing type definitions for browser APIs, so that File System Access API usage compiles correctly.

#### Acceptance Criteria

1. WHEN code uses `window.showDirectoryPicker` THEN the system SHALL have proper type definitions
2. WHEN code uses FileSystemDirectoryHandle THEN the system SHALL have proper type definitions
3. WHEN browser API types are needed THEN the system SHALL use appropriate type declarations or polyfills
4. WHEN Electron-specific code runs THEN the system SHALL handle the absence of browser APIs gracefully

### Requirement 6

**User Story:** As a developer, I want to verify the fixes work, so that I can confidently build the Electron app.

#### Acceptance Criteria

1. WHEN `npm run electron:build` is executed THEN the system SHALL complete without TypeScript errors
2. WHEN the build completes THEN the system SHALL produce a valid Electron application package
3. WHEN all fixes are applied THEN all 819 tests SHALL still pass
4. WHEN the web build runs THEN it SHALL still work correctly (no regressions)

### Requirement 7

**User Story:** As a developer, I want to maintain code quality, so that the codebase remains maintainable.

#### Acceptance Criteria

1. WHEN fixes are applied THEN the system SHALL not introduce new ESLint warnings
2. WHEN code is modified THEN the system SHALL follow existing code patterns and conventions
3. WHEN types are added THEN the system SHALL use precise types (not `any` unless absolutely necessary)
4. WHEN the refactoring is complete THEN the system SHALL have clear, readable code
