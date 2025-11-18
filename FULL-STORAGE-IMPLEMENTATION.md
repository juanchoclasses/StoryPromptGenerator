# Development Plan: Migrate Images to Disk Feature

**Feature:** Add "Export Images to Disk" functionality to Operations Panel  
**Date:** November 10, 2025  
**Complexity:** Medium  
**Estimated Time:** 2-3 hours

---

## 🎯 Goals

1. Allow users to copy all IndexedDB images to their configured filesystem directory
2. Show progress during migration (578 images could take time)
3. Handle both character images and scene images
4. Organize images on disk in a sensible structure
5. Resume capability if migration is interrupted
6. Don't create duplicates if images already exist on disk

---

## 📋 Requirements

### Functional Requirements

1. **Button Visibility**
   - Only show "Export Images to Disk" button when:
     - File system storage is configured (directory selected)
     - Images exist in IndexedDB
   - Button should be disabled while operation is running

2. **Pre-Migration Check**
   - Count total images in IndexedDB
   - Check available disk space (if possible)
   - Show confirmation dialog with count before starting

3. **Migration Process**
   - Process character images (book-level and story-level)
   - Process scene images
   - Maintain proper directory structure
   - Show real-time progress (X of Y images)
   - Skip images that already exist on disk (avoid duplicates)

4. **Progress Reporting**
   - Progress bar or percentage
   - Current operation (which character/scene)
   - Success/error counts
   - Estimated time remaining (optional)

5. **Error Handling**
   - Continue on individual image failures
   - Log errors but don't stop entire process
   - Show summary at end (X succeeded, Y failed)
   - Option to retry failed images

6. **Post-Migration**
   - Show summary report
   - Don't delete from IndexedDB (keep dual storage)
   - Update diagnostic to show disk vs IndexedDB counts

### Non-Functional Requirements

1. **Performance**
   - Don't block UI during migration
   - Process in batches to avoid memory issues
   - Throttle writes to avoid overwhelming filesystem API

2. **Data Integrity**
   - Verify image was written successfully before marking as done
   - Don't corrupt existing files
   - Atomic writes (use temp file → rename pattern if needed)

---

## 🏗️ Technical Approach

### Directory Structure on Disk

```
[Selected Directory]/
├── .prompter-cache/
│   ├── scenes/
│   │   └── {imageId}.png
│   ├── characters/
│   │   ├── book-{bookId}/
│   │   │   └── {characterName}/
│   │   │       └── {imageId}.png
│   │   └── story-{storyId}/
│   │       └── {characterName}/
│   │           └── {imageId}.png
│   └── migration-status.json  (track progress)
```

### Migration Algorithm

1. **Phase 1: Discovery**
   - Query IndexedDB for all images
   - Group by type (book-character, story-character, scene)
   - Build migration plan with counts

2. **Phase 2: Confirmation**
   - Show dialog with breakdown:
     - X book-level character images
     - Y story-level character images  
     - Z scene images
     - Total: N images (~estimated size MB)
   - User confirms or cancels

3. **Phase 3: Migration (Batch Processing)**
   - Process in batches of 10-20 images
   - For each image:
     - Check if already exists on disk (skip if yes)
     - Load blob from IndexedDB
     - Convert to data URL or blob
     - Write to filesystem using FileSystemService
     - Update progress counter
     - Log success/failure
   
4. **Phase 4: Completion**
   - Save migration log to disk
   - Show summary dialog
   - Update UI state

### State Management

Track in component state:
- `migrationRunning: boolean`
- `migrationProgress: { current: number, total: number }`
- `migrationStatus: string` (current operation description)
- `migrationErrors: Array<{ imageId, error }>`
- `migrationComplete: boolean`

### Resumability

Store migration status in `.prompter-cache/migration-status.json`:
- Timestamp of last run
- List of completed image IDs
- List of failed image IDs
- Can resume from where it left off

---

## 📝 Implementation Steps

### Step 1: Update FileSystemService (if needed)

**Tasks:**
- Add method to check if file exists on disk
- Add method to get file size/stats
- Ensure proper error handling for filesystem writes
- Add batch write capability if not present

**Files:**
- `src/services/FileSystemService.ts`

### Step 2: Add Migration Logic to OperationsPanel

**Tasks:**
- Create `migrateImagesToDisk()` function
- Implement batch processing loop
- Add progress tracking
- Handle errors gracefully
- Create summary report

**State additions:**
- Migration-related state variables
- Progress tracking state

**Files:**
- `src/components/OperationsPanel.tsx`

### Step 3: Create UI Components

**Tasks:**
- Add "Export Images to Disk" button (conditional rendering)
- Create confirmation dialog component
- Add progress indicator (linear progress bar + text)
- Create summary/results dialog
- Add option to view migration log

**UI Elements:**
- Button in Operations Panel
- MUI Dialog for confirmation
- MUI LinearProgress for progress bar
- MUI Alert for errors/warnings

### Step 4: Update Diagnostic to Show Disk Status

**Tasks:**
- Add check for filesystem configuration
- Count images on disk vs IndexedDB
- Show comparison in diagnostic report
- Add warnings if images missing from disk

**Additions to diagnostic:**
- Filesystem configured: Yes/No
- Images on disk: X
- Images in IndexedDB: Y
- Images missing from disk: Z

### Step 5: Add "Copy Report" for Migration Results

**Tasks:**
- Format migration summary as text
- Include success/failure counts
- List any errors with image IDs
- Make copyable to clipboard

### Step 6: Testing

**Test Cases:**
1. Migration with all images (happy path)
2. Migration with some images already on disk (skip duplicates)
3. Migration with filesystem errors (handle gracefully)
4. Interrupt migration (browser refresh) then resume
5. Migration with no directory configured (button hidden)
6. Migration with empty IndexedDB (show message)
7. Large migration (578 images) - performance test

---

## 🎨 UX Considerations

### Button State & Visibility

**Show button when:**
- Filesystem directory is configured ✅
- At least 1 image exists in IndexedDB ✅
- Not currently migrating ✅

**Button states:**
- Normal: "Export Images to Disk"
- Running: "Exporting... (45/578)" with spinner
- Complete: Changes back to normal after 3 seconds

### Confirmation Dialog

**Title:** "Export Images to Disk?"

**Content:**
```
Found 578 images in IndexedDB:
• 38 book-level character images
• 540 scene images

These will be copied to:
  /Users/you/Prompter/

Estimated size: ~150 MB
Estimated time: 2-3 minutes

This will NOT delete images from IndexedDB.
Images already on disk will be skipped.

Continue?
```

**Buttons:** [Cancel] [Export]

### Progress Display

**During migration:**
- Show in alert box below buttons
- Linear progress bar
- Text: "Exporting images to disk... 45 of 578 (7.8%)"
- Current operation: "Copying Professor Fizzwinkle image 3/11"

### Summary Dialog

**Title:** "Export Complete!"

**Content:**
```
✅ Successfully exported: 575 images
⚠️ Skipped (already exist): 2 images
❌ Failed: 1 image

Failed images:
• abc123def456 - Permission denied

All images remain in IndexedDB as backup.
```

**Buttons:** [View Log] [Close]

---

## ⚠️ Edge Cases

### 1. Directory No Longer Accessible
- **Issue:** User configured directory but revoked permission
- **Handle:** Show error, prompt to reconfigure directory

### 2. Disk Full
- **Issue:** Not enough space to write all images
- **Handle:** Catch error, stop gracefully, show how many succeeded

### 3. Browser Refresh During Migration
- **Issue:** Migration interrupted
- **Handle:** Load migration-status.json, offer to resume

### 4. Duplicate Character Names
- **Issue:** Two characters with same name in different contexts
- **Handle:** Already handled by directory structure (book ID / story ID in path)

### 5. Very Large Images
- **Issue:** Some images might be huge (>10MB)
- **Handle:** Set reasonable timeout, continue on failure

### 6. IndexedDB Locked
- **Issue:** Another tab has IndexedDB locked
- **Handle:** Retry with exponential backoff, or show error

---

## 🔍 Testing Strategy

### Unit Tests (Optional)
- Test batch processing logic
- Test progress calculation
- Test duplicate detection
- Test error handling

### Manual Testing Checklist

- [ ] Button shows only when directory configured
- [ ] Button hidden when no images in IndexedDB
- [ ] Confirmation dialog shows correct counts
- [ ] Progress updates in real-time
- [ ] Can cancel mid-migration
- [ ] Skip duplicates correctly
- [ ] Handle individual image failures gracefully
- [ ] Summary shows accurate counts
- [ ] Images on disk are valid and openable
- [ ] Directory structure is correct
- [ ] Migration log is created
- [ ] Can resume interrupted migration
- [ ] Works with both character and scene images
- [ ] Doesn't delete from IndexedDB

### Performance Testing

- [ ] Test with 578 images (current user's count)
- [ ] Monitor memory usage during migration
- [ ] Verify UI stays responsive
- [ ] Check filesystem write speed
- [ ] Test with slow disk (if possible)

---

## 📊 Success Metrics

**Feature is successful when:**

1. ✅ User can export all 578 images in under 5 minutes
2. ✅ Process doesn't crash browser or lock UI
3. ✅ Less than 1% failure rate on individual images
4. ✅ Clear progress indication throughout
5. ✅ Images on disk are valid and match IndexedDB
6. ✅ Can handle interruption and resume
7. ✅ Duplicate detection prevents redundant writes

---

## 🚀 Future Enhancements (Not in Initial Release)

1. **Selective Export**
   - Choose specific books/stories to export
   - Export only character images or only scenes

2. **Sync Feature**
   - Detect images on disk but not in IndexedDB
   - Detect images in IndexedDB but not on disk
   - Two-way sync to keep both in sync

3. **Compression**
   - Option to compress images when writing to disk
   - Save disk space for large collections

4. **Background Migration**
   - Use Web Workers for non-blocking migration
   - Process while user continues working

5. **Export Statistics**
   - Total images exported lifetime
   - Disk space saved by deduplication
   - Average image size by model

---

## 📁 Files to Create/Modify

### New Files
None (all logic goes into existing components)

### Modified Files

1. **`src/components/OperationsPanel.tsx`**
   - Add migration function
   - Add progress state
   - Add confirmation dialog
   - Add summary dialog
   - Add "Export Images to Disk" button

2. **`src/services/FileSystemService.ts`** (maybe)
   - Add `fileExists()` method if not present
   - Ensure robust error handling

3. **`OPERATIONS-PANEL-GUIDE.md`**
   - Document new "Export Images to Disk" feature
   - Add usage instructions
   - Add troubleshooting section

---

## ⏱️ Time Estimates

- **Step 1:** Update FileSystemService - 30 minutes
- **Step 2:** Add migration logic - 1 hour
- **Step 3:** Create UI components - 45 minutes
- **Step 4:** Update diagnostic - 30 minutes
- **Step 5:** Add copy report - 15 minutes
- **Step 6:** Testing - 30 minutes
- **Documentation:** 15 minutes

**Total:** ~3 hours 45 minutes

---

## ✅ Definition of Done

- [ ] Button appears when filesystem configured and images exist
- [ ] Confirmation dialog shows before migration
- [ ] Progress indicator updates smoothly
- [ ] All images copied to correct directory structure
- [ ] Duplicates are skipped
- [ ] Errors handled gracefully
- [ ] Summary report is accurate
- [ ] Migration can be interrupted and resumed
- [ ] Documentation updated
- [ ] Manual testing completed
- [ ] Code committed with clear message

---

## 📚 Related Documentation

- `OPERATIONS-PANEL-GUIDE.md` - Operations Panel user guide
- `FILESYSTEM-STORAGE-GUIDE.md` - File system storage overview
- `IMAGE-CACHE-GUIDE.md` - Image caching strategy

---

**Ready to implement?** This feature will complete the storage story by ensuring users can have their images safely on disk while maintaining IndexedDB for fast access! 🎯



