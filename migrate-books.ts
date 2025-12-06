#!/usr/bin/env node
/**
 * Book Migration Script
 * 
 * One-time migration script to convert books from monolithic JSON files
 * to directory-based structure with separate story files.
 * 
 * OLD FORMAT: prompter-cache/books/{bookId}.json
 * NEW FORMAT: prompter-cache/books/{book-slug}/
 *             ├── book.json
 *             └── stories/
 *                 ├── {story-slug-1}.json
 *                 ├── {story-slug-2}.json
 *                 └── ...
 * 
 * Usage: npx tsx migrate-books.ts [--dry-run] [--cache-dir <path>]
 * 
 * Options:
 *   --dry-run       Show what would be migrated without making changes
 *   --cache-dir     Specify custom cache directory (default: ./prompter-cache)
 * 
 * This is throwaway code - delete after successful migration!
 */

import * as fs from 'fs';
import * as path from 'path';
import { SlugService } from './src/services/SlugService';

interface MigrationStats {
  booksFound: number;
  booksMigrated: number;
  storiesMigrated: number;
  errors: string[];
}

interface BookData {
  id: string;
  title: string;
  description?: string;
  backgroundSetup?: string;
  aspectRatio?: string;
  style?: any;
  defaultLayout?: any;
  characters?: any[];
  stories?: StoryData[];
  createdAt?: string;
  updatedAt?: string;
}

interface StoryData {
  id: string;
  title: string;
  description?: string;
  backgroundSetup?: string;
  diagramStyle?: string;
  layout?: any;
  characters?: any[];
  elements?: any[];
  scenes?: any[];
  createdAt?: string;
  updatedAt?: string;
}

class BookMigration {
  private cacheDir: string;
  private booksDir: string;
  private backupDir: string;
  private dryRun: boolean;
  private stats: MigrationStats;

  constructor(cacheDir: string = './prompter-cache', dryRun: boolean = false) {
    this.cacheDir = cacheDir;
    this.booksDir = path.join(cacheDir, 'books');
    this.backupDir = path.join(cacheDir, `books-backup-${Date.now()}`);
    this.dryRun = dryRun;
    this.stats = {
      booksFound: 0,
      booksMigrated: 0,
      storiesMigrated: 0,
      errors: []
    };
  }

  /**
   * Run the migration
   */
  async migrate(): Promise<void> {
    console.log('📚 Book Migration Script');
    console.log('========================\n');
    
    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Check if books directory exists
    if (!fs.existsSync(this.booksDir)) {
      console.log(`❌ Books directory not found: ${this.booksDir}`);
      console.log('Nothing to migrate.');
      return;
    }

    // Find all old-format book files
    const bookFiles = this.findOldFormatBooks();
    
    if (bookFiles.length === 0) {
      console.log('✅ No old-format books found. All books are already migrated!');
      return;
    }

    this.stats.booksFound = bookFiles.length;
    console.log(`Found ${bookFiles.length} book(s) to migrate:\n`);
    
    bookFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${path.basename(file)}`);
    });
    console.log();

    // Create backup
    if (!this.dryRun) {
      this.createBackup(bookFiles);
    }

    // Migrate each book
    for (const bookFile of bookFiles) {
      await this.migrateBook(bookFile);
    }

    // Print summary
    this.printSummary();
  }

  /**
   * Find all old-format book JSON files
   */
  private findOldFormatBooks(): string[] {
    const files = fs.readdirSync(this.booksDir);
    
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(this.booksDir, file))
      .filter(filePath => {
        // Make sure it's a file, not a directory
        return fs.statSync(filePath).isFile();
      });
  }

  /**
   * Create backup of old books
   */
  private createBackup(bookFiles: string[]): void {
    console.log('💾 Creating backup...');
    
    fs.mkdirSync(this.backupDir, { recursive: true });
    
    for (const bookFile of bookFiles) {
      const fileName = path.basename(bookFile);
      const backupPath = path.join(this.backupDir, fileName);
      fs.copyFileSync(bookFile, backupPath);
    }
    
    console.log(`✅ Backup created: ${this.backupDir}\n`);
  }

  /**
   * Migrate a single book
   */
  private async migrateBook(bookFile: string): Promise<void> {
    const fileName = path.basename(bookFile);
    console.log(`\n📖 Migrating: ${fileName}`);
    
    try {
      // Read old book file
      const bookJson = fs.readFileSync(bookFile, 'utf-8');
      const bookData: BookData = JSON.parse(bookJson);
      
      console.log(`   Title: "${bookData.title}"`);
      console.log(`   Stories: ${bookData.stories?.length || 0}`);
      
      // Generate book slug
      const bookSlug = SlugService.generateSlug(bookData.title, 'book');
      const bookDir = path.join(this.booksDir, bookSlug);
      
      // Check for slug conflicts
      let finalBookSlug = bookSlug;
      if (fs.existsSync(bookDir)) {
        const existingSlugs = new Set<string>();
        const dirs = fs.readdirSync(this.booksDir);
        dirs.forEach(dir => {
          const dirPath = path.join(this.booksDir, dir);
          if (fs.statSync(dirPath).isDirectory()) {
            existingSlugs.add(dir);
          }
        });
        finalBookSlug = SlugService.generateUniqueSlug(bookSlug, existingSlugs);
        console.log(`   ⚠️  Slug conflict - using: ${finalBookSlug}`);
      }
      
      const finalBookDir = path.join(this.booksDir, finalBookSlug);
      const storiesDir = path.join(finalBookDir, 'stories');
      
      console.log(`   Directory: ${finalBookSlug}/`);
      
      if (this.dryRun) {
        console.log('   [DRY RUN] Would create directory structure');
        this.stats.booksMigrated++;
        this.stats.storiesMigrated += bookData.stories?.length || 0;
        return;
      }
      
      // Create directory structure
      fs.mkdirSync(finalBookDir, { recursive: true });
      fs.mkdirSync(storiesDir, { recursive: true });
      
      // Extract book metadata (without stories)
      const bookMetadata = {
        id: bookData.id,
        title: bookData.title,
        description: bookData.description,
        backgroundSetup: bookData.backgroundSetup,
        aspectRatio: bookData.aspectRatio,
        style: bookData.style,
        defaultLayout: bookData.defaultLayout,
        characters: bookData.characters,
        createdAt: bookData.createdAt,
        updatedAt: bookData.updatedAt
      };
      
      // Write book.json
      const bookJsonPath = path.join(finalBookDir, 'book.json');
      fs.writeFileSync(bookJsonPath, JSON.stringify(bookMetadata, null, 2));
      console.log(`   ✅ Created book.json`);
      
      // Migrate stories
      const stories = bookData.stories || [];
      const existingSlugs = new Set<string>();
      
      for (const story of stories) {
        const storySlug = SlugService.generateSlug(story.title, 'story');
        const uniqueSlug = SlugService.generateUniqueSlug(storySlug, existingSlugs);
        existingSlugs.add(uniqueSlug);
        
        const storyPath = path.join(storiesDir, `${uniqueSlug}.json`);
        fs.writeFileSync(storyPath, JSON.stringify(story, null, 2));
        
        console.log(`   ✅ Created stories/${uniqueSlug}.json`);
        this.stats.storiesMigrated++;
      }
      
      // Validate migration
      this.validateMigration(bookData, finalBookDir);
      
      // Note: Old file is kept - user will delete manually
      console.log(`   ℹ️  Old file kept: ${fileName} (delete manually after verification)`);
      
      this.stats.booksMigrated++;
      console.log(`   ✅ Migration complete!`);
      
    } catch (error) {
      const errorMsg = `Failed to migrate ${fileName}: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      this.stats.errors.push(errorMsg);
    }
  }

  /**
   * Validate that migrated data matches original
   */
  private validateMigration(originalBook: BookData, bookDir: string): void {
    try {
      // Read migrated book.json
      const bookJsonPath = path.join(bookDir, 'book.json');
      const migratedBookJson = fs.readFileSync(bookJsonPath, 'utf-8');
      const migratedBook = JSON.parse(migratedBookJson);
      
      // Check book metadata
      if (migratedBook.id !== originalBook.id) {
        throw new Error('Book ID mismatch');
      }
      if (migratedBook.title !== originalBook.title) {
        throw new Error('Book title mismatch');
      }
      
      // Read all story files
      const storiesDir = path.join(bookDir, 'stories');
      const storyFiles = fs.readdirSync(storiesDir).filter(f => f.endsWith('.json'));
      
      // Check story count
      const originalStoryCount = originalBook.stories?.length || 0;
      if (storyFiles.length !== originalStoryCount) {
        throw new Error(`Story count mismatch: expected ${originalStoryCount}, got ${storyFiles.length}`);
      }
      
      // Validate each story
      const migratedStoryIds = new Set<string>();
      for (const storyFile of storyFiles) {
        const storyPath = path.join(storiesDir, storyFile);
        const storyJson = fs.readFileSync(storyPath, 'utf-8');
        const story = JSON.parse(storyJson);
        migratedStoryIds.add(story.id);
      }
      
      // Check all original story IDs are present
      const originalStoryIds = new Set(originalBook.stories?.map(s => s.id) || []);
      for (const id of originalStoryIds) {
        if (!migratedStoryIds.has(id)) {
          throw new Error(`Missing story ID: ${id}`);
        }
      }
      
      console.log(`   ✅ Validation passed`);
      
    } catch (error) {
      throw new Error(`Validation failed: ${error}`);
    }
  }

  /**
   * Print migration summary
   */
  private printSummary(): void {
    console.log('\n\n📊 Migration Summary');
    console.log('===================\n');
    console.log(`Books found:     ${this.stats.booksFound}`);
    console.log(`Books migrated:  ${this.stats.booksMigrated}`);
    console.log(`Stories migrated: ${this.stats.storiesMigrated}`);
    console.log(`Errors:          ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.stats.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    if (!this.dryRun && this.stats.booksMigrated > 0) {
      console.log(`\n💾 Backup location: ${this.backupDir}`);
      console.log('   Keep this backup until you verify everything works!');
    }
    
    if (this.stats.booksMigrated === this.stats.booksFound && this.stats.errors.length === 0) {
      console.log('\n✅ Migration completed successfully!');
      if (!this.dryRun) {
        console.log('\nNext steps:');
        console.log('1. Test your app with the migrated data');
        console.log('2. Verify all books and stories load correctly');
        console.log('3. Once confident, manually delete the old .json files');
        console.log('4. Delete the backup directory');
        console.log('5. Delete this migration script (it\'s throwaway code!)');
      }
    } else if (this.stats.errors.length > 0) {
      console.log('\n⚠️  Migration completed with errors. Check the backup and fix issues.');
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const cacheDirIndex = args.indexOf('--cache-dir');
const cacheDir = cacheDirIndex >= 0 && args[cacheDirIndex + 1] 
  ? args[cacheDirIndex + 1] 
  : './prompter-cache';

// Run migration
const migration = new BookMigration(cacheDir, dryRun);
migration.migrate().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
