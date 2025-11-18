# Book Characters Recovery Guide

**Issue:** Book characters disappeared after file-based storage changes  
**Status:** ⚠️ CRITICAL - Data Loss Detected  
**Date:** November 10, 2025

---

## 🔍 Root Cause Analysis

### Initial Issue (Fixed)
The issue was in `src/App.tsx`. When the app loaded, it was only loading `bookData` (the StoryData format) but **not** the `activeBook` (Book model instance).

### Critical Discovery
Further investigation revealed **IndexedDB is completely empty (0 bytes)**. This indicates:

- ❌ **localStorage is empty** - all book/character metadata lost
- ❌ **IndexedDB is empty** - all scene and character images lost
- ⚠️ **Complete data loss** - not just a loading issue

### Possible Causes

1. **Browser Data Cleared**
   - User manually cleared browser data
   - Browser security settings auto-cleared storage
   - "Clear all site data" was triggered

2. **IndexedDB Version Upgrade Issue**
   - DB version was upgraded from 1 to 2 (for character images)
   - If multiple tabs were open, upgrade could have failed
   - If browser crashed during upgrade, data could be lost

3. **Incognito/Private Mode**
   - Data doesn't persist after closing window
   - Each session starts fresh

4. **Different Browser/Profile**
   - Data is browser-specific
   - Different Chrome profiles have separate storage
   - Using a different browser won't have the data

## ✅ Fix Applied

Updated `src/App.tsx` to load **both** `bookData` AND `activeBook` on initialization:

```typescript
// Load initial book data
React.useEffect(() => {
  const loadData = async () => {
    const data = await BookService.getActiveBookData();
    setBookData(data);
    
    // Also load the active Book instance (not just StoryData format)
    const activeBookId = await BookService.getActiveBookId();
    if (activeBookId) {
      const book = await BookService.getBook(activeBookId);
      setActiveBook(book);
    }
  };
  loadData();
}, []);
```

---

## 📊 Diagnostic Tools

### Built-In Operations Panel (NEW!)

The app now has a **built-in Operations tab** with storage diagnostics:

**Features:**
- ✅ Analyzes localStorage (books, characters, metadata)
- ✅ Scans IndexedDB (scene images, character images)
- ✅ Detects mismatches between metadata and actual images
- ✅ **One-click fix** for missing imageGallery metadata
- ✅ Detailed reports with drill-down capabilities

**How to Use:**
1. Run the app: `npm run dev`
2. Go to **Operations** tab
3. Click **"Run Storage Analysis"**
4. Review the diagnostic report
5. If issues found, click **"Fix Missing Metadata"** to auto-repair

**Why This Works:**
- Runs in the same origin as your app (localhost:5173)
- Has full access to localStorage and IndexedDB
- Can read AND write to fix issues
- No sandboxing problems!

---

## 🔧 Recovery Steps

### CRITICAL: Step 1 - Check Your Data

1. **Run the app and open the Operations tab**:
   ```bash
   npm run dev
   # Then go to: Operations tab → Run Storage Analysis
   ```

2. Review the complete diagnostic results
3. Determine your situation:

#### Scenario A: Data Found ✅
- localStorage has data (books/characters exist)
- The App.tsx fix will resolve loading issues
- Proceed to Step 2

#### Scenario B: Partial Data ⚠️
- localStorage has some data but missing some books/characters
- IndexedDB empty (images lost, but metadata intact)
- Proceed to Step 3 (Partial Recovery)

#### Scenario C: Complete Data Loss ❌
- localStorage empty (no books/characters/metadata)
- IndexedDB empty (no images)
- Proceed to Step 4 (Emergency Recovery)

### Step 2: Test the Fix (If Data Found)

1. Build and run the app:
   ```bash
   npm run dev
   ```

2. Open the app in your browser
3. Go to the **Book Characters** tab
4. Your book-level characters should now appear!
5. If they appear, you're all set! Create a backup immediately.

### Step 3: Partial Recovery (Some Data Lost)

**If you have metadata but lost images:**

1. Your character definitions are safe (names, descriptions)
2. Character image galleries are empty
3. **Recovery Action**: Use Character Audition to regenerate images
   - Go to **Book Characters** tab
   - For each character, click **Audition** (🎭)
   - Generate new images for each character
   - Select the best ones for your gallery

4. Scene images will need to be regenerated:
   - Go to each scene
   - Regenerate the image using the scene editor
   - The prompt will still work (uses character descriptions)

### Step 4: Emergency Recovery (Complete Loss)

**If both localStorage AND IndexedDB are empty:**

#### Check 1: Other Browsers/Profiles
```
1. Open the diagnostic tool in OTHER browsers you might have used:
   - Chrome
   - Edge  
   - Firefox
   - Safari
   - Opera
   
2. Try different Chrome profiles if you have multiple

3. Check if you were using incognito/private mode
```

#### Check 2: Look for Backups
```
1. Search your computer for *.json files
   - Look in Downloads folder
   - Search for "prompter" or "story" in filename
   
2. Check if you exported any books previously
   - File extension: .json
   - File name pattern: [BookTitle].json or prompter-backup-*.json

3. Check cloud storage (Dropbox, Google Drive, OneDrive)
   - You may have saved exports there
```

#### Check 3: Browser History/Cache
```
1. Open browser DevTools (F12)
2. Go to Application → Storage
3. Check all IndexedDB databases
4. Check all localStorage entries
5. Look for ANY Prompter-related data

6. Check if browser has any automatic backups:
   - Chrome: chrome://settings/syncSetup
   - Check if sync was enabled
```

#### Last Resort: Data is Gone
If you've exhausted all recovery options:

1. **Accept data loss** - the data cannot be recovered
2. **Start fresh** with these protections:
   - ⚠️ **Always use the same browser** (don't switch)
   - ⚠️ **Never use incognito mode** for production work
   - ⚠️ **Export regularly** (weekly or after major work)
   - ⚠️ **Use file-based storage** (Settings → Configure storage directory)
   - ⚠️ **Keep backup files** in multiple locations

3. **Recreate your work**:
   - Redefine books and characters
   - Use Character Audition to regenerate character images
   - Recreate stories and scenes
   - Generate new images

---

## 🆘 If Characters Are Still Missing

### Scenario A: Characters at Story Level Instead of Book Level

**Diagnosis**: `diagnose-storage.html` shows characters under "Story-Level Characters" but not "Book-Level Characters"

**Solution**: Use the **Book Cast Manager** to promote characters:
1. Open the app
2. Go to **Books** tab → Select your book
3. Go to **Stories** tab → Select the story with the characters
4. Go to **Story Characters** tab
5. For each character, click the **"Promote to Book"** button (↑)
6. This moves the character (and all its images) to book level

### Scenario B: Characters Completely Missing

**Diagnosis**: `diagnose-storage.html` shows 0 characters at both levels

**Possible Causes:**
- Data was accidentally cleared
- Browser storage was cleared
- Storage corruption during migration

**Recovery Options:**

1. **Check for Backups:**
   - Do you have any `.json` export files from the app?
   - Check browser DevTools → Application → IndexedDB for any backups

2. **Restore from Export:**
   - If you have a backup JSON file:
     - Open the app → **Books** tab
     - Click **Import Book** button
     - Select your backup file

3. **Recreate Characters:**
   - If no backup exists, characters will need to be recreated:
     - Go to **Book Characters** tab
     - Click **Add Character**
     - Recreate each character with name and description
     - Use **Character Audition** to regenerate character images

---

## 🔒 Preventing Future Data Loss

### CRITICAL: What Likely Caused This Issue

Based on the symptoms (both localStorage and IndexedDB empty), the most likely causes are:

1. **Browser Data Was Cleared** (Most Likely)
   - Chrome: Settings → Privacy → Clear browsing data
   - Clicking "Clear all" wipes both localStorage and IndexedDB
   - Can happen accidentally or automatically

2. **IndexedDB Version Upgrade Failure** (Possible)
   - DB version changed from 1 → 2 (character images feature)
   - If multiple tabs were open, upgrade can fail silently
   - Browser may have deleted corrupted database

3. **Browser Security/Privacy Settings**
   - Some browsers auto-clear storage for "inactive" sites
   - Privacy extensions can block/clear storage
   - Antivirus software may have flagged storage as suspicious

4. **Incognito/Private Mode** (If Used)
   - All data is temporary and wiped on window close
   - Never use for production work!

### How to Prevent This in the Future

#### Level 1: Mandatory (DO THIS!)
```
1. ✅ Export your book(s) weekly
   - Books tab → Select book → Export
   - Save to Desktop or Documents folder
   - Keep multiple dated backups

2. ✅ Use file-based storage (NEW!)
   - Settings → Configure Save Directory
   - Images saved to your disk (can't be browser-evicted)
   - Back up that directory regularly

3. ✅ Always use the same browser
   - Don't switch between browsers
   - localStorage/IndexedDB is browser-specific
   - Different profiles = different storage
```

#### Level 2: Recommended
```
1. 📋 Export after major changes
   - Added new characters? Export.
   - Generated character images? Export.
   - Completed a story? Export.

2. 📋 Keep backups in cloud storage
   - Google Drive, Dropbox, OneDrive, etc.
   - Sync your exports folder
   - Version history protects against accidental deletion

3. 📋 Use automatic backup scripts
   - Run check-all-storage.html weekly
   - Export data automatically
   - Store in dated folders
```

#### Level 3: Advanced Protection
```
1. 🔐 Browser sync (with caution)
   - Chrome sync can back up some data
   - But: Storage limits apply
   - But: Sync can propagate deletion

2. 🔐 Git version control
   - Store exports in a Git repo
   - Full version history
   - Can revert to any previous state

3. 🔐 Multiple browser backups
   - Keep a copy in Chrome AND Edge
   - Import your book into multiple browsers
   - If one loses data, others are safe
```

### What NOT to Do
```
❌ Never rely solely on browser storage
❌ Never use incognito mode for production work
❌ Never clear browser data without exporting first
❌ Never work in only one browser without backups
❌ Never go weeks without exporting
❌ Never trust "auto-save" as your only protection
```

### Recommended Workflow
```
1. Monday: Export all books (weekly backup)
2. Daily: Use file-based storage for auto-save
3. Major changes: Manual export immediately
4. End of project: Export + cloud backup
5. Monthly: Verify backups can be imported
```

---

## 📝 Understanding the Data Structure

### Version 4.0+ Architecture:

```
Book (localStorage: prompter-app-data-v4)
├── characters[]          ← Book-level characters (shared across all stories)
│   ├── Character
│   │   ├── name
│   │   ├── description
│   │   ├── imageGallery[]    (v4.1+)
│   │   └── selectedImageId   (v4.1+)
│   └── ...
│
└── stories[]
    └── Story
        ├── characters[]  ← Story-level characters (story-specific)
        ├── elements[]
        └── scenes[]
            ├── characters: string[]  (character names used in scene)
            └── elements: string[]    (element names used in scene)
```

### Character Images Storage:

**Book-level character images:**
- IndexedDB key: `book:{bookId}:character:{characterName}:{imageId}`
- Filesystem: `.prompter-cache/book-characters/{bookId}/{characterName}/{imageId}.png`

**Story-level character images:**
- IndexedDB key: `{storyId}:character:{characterName}:{imageId}`
- Filesystem: `.prompter-cache/characters/{storyId}/{characterName}/{imageId}.png`

---

## ✅ Verification Checklist

After applying the fix and recovering data:

- [ ] Run `diagnose-storage.html` - confirms characters are present
- [ ] Open app - **Book Characters** tab shows your characters
- [ ] Navigate to a story - **Story Editor** shows book characters in dropdown
- [ ] Generate an image - prompt includes book-level character descriptions
- [ ] Export backup - download current state as backup
- [ ] Characters persist after browser refresh

---

## 📞 Need Help?

If you're still experiencing issues:

1. **Export your data first!** (`diagnose-storage.html` → Export All Data)
2. Check browser console for any error messages
3. Verify you're using a supported browser (Chrome, Edge, or Opera recommended)
4. Make sure you're using the same browser where you originally created the data

---

## 🔄 Related Changes

This fix is related to the recent file-based storage feature for images. The file-based storage changes affected:
- ✅ **Images**: Now optionally saved to user's local filesystem
- ✅ **Image references**: Still tracked in localStorage/IndexedDB
- ❌ **Book/character data**: Always in localStorage (not affected by filesystem changes)

The issue was a side effect of code refactoring, not the file-based storage itself.

