#!/bin/bash

# Migration script: .prompter-cache -> prompter-cache
# Migrates all data from the old hidden directory to the new visible directory

set -e  # Exit on error

OLD_DIR="/Users/juancho/Documents/AI-Books/cache/.prompter-cache"
NEW_DIR="/Users/juancho/Documents/AI-Books/cache/prompter-cache"

echo "🔄 Prompter Cache Migration Script"
echo "===================================="
echo ""
echo "Source: $OLD_DIR"
echo "Destination: $NEW_DIR"
echo ""

# Check if old directory exists
if [ ! -d "$OLD_DIR" ]; then
    echo "❌ Old directory not found: $OLD_DIR"
    echo "   Nothing to migrate."
    exit 0
fi

# Check if new directory exists
if [ ! -d "$NEW_DIR" ]; then
    echo "⚠️  New directory not found. Creating: $NEW_DIR"
    mkdir -p "$NEW_DIR"
fi

# Count files before migration
OLD_FILE_COUNT=$(find "$OLD_DIR" -type f | wc -l | tr -d ' ')
OLD_SIZE=$(du -sh "$OLD_DIR" | cut -f1)

echo "📊 Pre-migration stats:"
echo "   Files in old directory: $OLD_FILE_COUNT"
echo "   Size: $OLD_SIZE"
echo ""

# List what will be migrated
echo "📁 Contents to migrate:"
find "$OLD_DIR" -type f | while read file; do
    rel_path="${file#$OLD_DIR/}"
    echo "   - $rel_path"
done
echo ""

# Ask for confirmation
read -p "Continue with migration? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled."
    exit 1
fi

# Perform migration
echo ""
echo "🔄 Copying files..."
rsync -av "$OLD_DIR/" "$NEW_DIR/" --exclude=".DS_Store"

# Verify migration
echo ""
echo "✅ Verifying migration..."

NEW_FILE_COUNT=$(find "$NEW_DIR" -type f | wc -l | tr -d ' ')
NEW_SIZE=$(du -sh "$NEW_DIR" | cut -f1)

echo "📊 Post-migration stats:"
echo "   Files in new directory: $NEW_FILE_COUNT"
echo "   Size: $NEW_SIZE"
echo ""

# Check if all files were copied
if [ "$OLD_FILE_COUNT" -eq "$NEW_FILE_COUNT" ]; then
    echo "✅ Migration successful! All $OLD_FILE_COUNT files copied."
    echo ""
    
    # Ask if user wants to delete old directory
    read -p "🗑️  Delete old directory ($OLD_DIR)? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Removing old directory..."
        rm -rf "$OLD_DIR"
        echo "✅ Old directory removed."
    else
        echo "ℹ️  Old directory kept. You can delete it manually later."
    fi
else
    echo "⚠️  Warning: File count mismatch!"
    echo "   Old: $OLD_FILE_COUNT files"
    echo "   New: $NEW_FILE_COUNT files"
    echo "   Please verify manually before deleting old directory."
fi

echo ""
echo "✨ Migration complete!"
echo ""
echo "Your data is now in: $NEW_DIR"
echo "You can verify by running: ls -la $NEW_DIR"

