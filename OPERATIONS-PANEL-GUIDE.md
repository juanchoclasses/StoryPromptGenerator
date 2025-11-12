# Operations Panel Guide

**Created:** November 10, 2025  
**Purpose:** Built-in storage diagnostics and repair tools

---

## 🎯 What Is This?

The **Operations Panel** is a built-in diagnostic and maintenance tool for your Prompter app. It helps you:

✅ Diagnose storage issues  
✅ Find mismatches between metadata and actual data  
✅ Automatically fix common problems  
✅ Understand what's stored where

---

## 🚀 How to Access

1. Run your app:
   ```bash
   npm run dev
   ```

2. Navigate to the **Operations** tab in the main navigation

3. You'll see the Storage Operations panel

---

## 🔧 Features

### 1. Run Storage Analysis

**What it does:**
- Scans all books, stories, and characters in localStorage
- Checks IndexedDB for all stored images
- Compares metadata (imageGallery arrays) with actual images in database
- Identifies mismatches and issues

**How to use:**
1. Click **"Run Storage Analysis"** button
2. Wait for scan to complete (usually 1-2 seconds)
3. Review the results

**What you'll see:**
- Summary chips showing counts (books, characters, images, issues)
- Issues section highlighting any problems found
- Detailed reports in expandable accordions

### 2. Fix Missing Metadata

**What it does:**
- Automatically rebuilds `imageGallery` metadata from IndexedDB
- Fixes the issue where images exist but don't show in the UI
- Updates character objects with correct image references

**When to use:**
- After ZIP import if character images don't show
- When diagnostic shows "missing metadata" errors
- If audition gallery is empty but you know images exist

**How to use:**
1. Run Storage Analysis first
2. If issues are found, click **"Fix Missing Metadata"** button
3. Wait for fix to complete
4. Diagnostic will auto-run again to verify

---

## 📊 Understanding the Reports

### Summary Section

Shows quick stats:
- **Books**: Total number of books
- **Book Characters**: Characters at book level
- **Story Characters**: Characters at story level  
- **Images in DB**: Total images in IndexedDB
- **Issues Found**: Number of problems detected

### Issues Section

Each issue shows:
- **Character name** and location (book or story)
- **Problem description** (what's wrong)
- **Severity**: Error (red), Warning (yellow), Info (blue)
- **Counts**: Metadata count vs IndexedDB count

**Common Issues:**

1. **Missing Metadata** (🔴 Error)
   - Character has images in IndexedDB but imageGallery is empty
   - **Fix**: Click "Fix Missing Metadata" button
   - **Cause**: Usually from ZIP import with auto-promotion

2. **Missing Images** (🟡 Warning)
   - Character has imageGallery metadata but no images in IndexedDB
   - **Fix**: Regenerate images using Character Audition
   - **Cause**: IndexedDB was cleared or data was lost

3. **Count Mismatch** (🟡 Warning)
   - Numbers don't match between metadata and IndexedDB
   - **Fix**: Depends on which has more - either re-import or fix metadata

### Detailed Reports

Three expandable sections:

1. **Book-Level Characters**
   - Shows all characters at book level
   - Gallery size for each
   - Whether they have a selected image

2. **Story-Level Characters**
   - Shows all characters at story level
   - Same details as book-level

3. **IndexedDB Character Images**
   - Raw data from IndexedDB
   - Shows storage keys (book: prefix or story ID)
   - Image IDs and model names

---

## 🎬 Common Workflows

### After ZIP Import

If character images don't show after importing a ZIP:

1. Go to **Operations** tab
2. Click **"Run Storage Analysis"**
3. Look for "missing metadata" errors
4. Click **"Fix Missing Metadata"**
5. Wait for fix to complete
6. Go back to Book Characters tab
7. Open Character Audition - images should now appear!

### Checking Data Integrity

To verify everything is working:

1. Run Storage Analysis
2. Check Summary section - should show:
   - All your books
   - All your characters
   - All your images
3. Issues section should be empty or show only minor warnings
4. If all green ✅ - you're good!

### Before Clearing Browser Data

**ALWAYS** export your book(s) before clearing browser data:

1. Go to Books tab
2. Click Export on each book
3. Save the ZIP files somewhere safe
4. Then you can safely clear browser data
5. Re-import the ZIPs afterward

---

## 🔍 Technical Details

### Storage Architecture

**localStorage** (`prompter-app-data-v4`):
- Stores book/story/scene/character **metadata**
- Includes imageGallery arrays (IDs only, no actual images)
- Small size (~KB to low MB)

**IndexedDB** (`StoryPromptImages`):
- Stores actual **image blobs**
- Scene images in `images` object store
- Character images in `character-images` object store
- Can be large (MB to GB)

### Storage Keys

**Book-level characters:**
- Key format: `book:{bookId}:{characterName}:{imageId}`
- Example: `book:abc123:Professor Fizzwinkle:img456`

**Story-level characters:**
- Key format: `{storyId}:{characterName}:{imageId}`
- Example: `story789:Alice:img012`

### The Fix Process

When you click "Fix Missing Metadata":

1. Finds all characters with empty imageGallery but images in IndexedDB
2. For each character:
   - Queries IndexedDB for all their images
   - Rebuilds imageGallery array with correct image IDs
   - Sets minimal metadata (ID, timestamp, model)
3. Saves updated book(s) to localStorage
4. Re-runs diagnostic to verify

**Why URLs are empty:**
- Image URLs are blob URLs (temporary)
- We don't store them in metadata
- They're loaded from IndexedDB on-demand
- This saves localStorage space

---

## ⚠️ Limitations

**What it can fix:**
- ✅ Missing imageGallery metadata
- ✅ Empty galleries when images exist
- ✅ Broken references after import

**What it can't fix:**
- ❌ Actually deleted images (need regeneration)
- ❌ Corrupted image blobs
- ❌ Browser storage quota exceeded
- ❌ Lost data from cleared storage (need backups)

---

## 🆘 Troubleshooting

### "No books found"
- **Cause**: localStorage is empty
- **Fix**: Import a book from ZIP or JSON backup

### "IndexedDB character-images store not found"
- **Cause**: Database hasn't been upgraded to v2
- **Fix**: Generate one character image to trigger upgrade

### "Fix doesn't work"
- **Cause**: Images actually don't exist in IndexedDB
- **Fix**: Use Character Audition to regenerate images

### Images still don't show after fix
- **Cause**: Component caching or stale state
- **Fix**: Refresh the page (F5) or close/reopen Character Audition dialog

---

## 📝 Best Practices

1. **Run diagnostics regularly** - weekly or after major changes
2. **Fix issues immediately** - don't let them accumulate
3. **Export after fixes** - backup your repaired state
4. **Check before and after imports** - verify data integrity
5. **Use file-based storage** - reduces risk of IndexedDB loss

---

## 🔮 Future Enhancements

Planned features for Operations panel:

- 🔄 Bulk image regeneration
- 📊 Storage quota monitoring
- 🗑️ Orphaned data cleanup
- 📦 Backup/restore workflows
- 🔍 Detailed image inspection
- 📈 Usage statistics

---

## 📞 When to Use This

**Use Operations Panel when:**
- ✅ Character images don't show in Audition dialog
- ✅ After importing a ZIP file
- ✅ Suspecting data inconsistency
- ✅ Troubleshooting storage issues
- ✅ Verifying data integrity

**Use Browser DevTools when:**
- 🔍 Need to see raw data
- 🔍 Investigating app bugs
- 🔍 Checking network requests
- 🔍 Debugging component state

---

## ✅ Summary

The Operations Panel is your **mission control** for storage:
- Diagnoses problems automatically
- Fixes common issues with one click
- Provides detailed insights into your data
- Helps prevent data loss

**Always accessible** - runs in the same origin as your app, so it has full access to all storage systems.

**Safe to use** - only fixes metadata, never deletes data unless you explicitly confirm.

**Educational** - helps you understand how the app stores data.

---

**Remember:** Regular exports are still your best protection against data loss!


