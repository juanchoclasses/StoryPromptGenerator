// Run this in the browser console to clear broken image URLs
// while keeping all your story data intact

(function clearBrokenImages() {
  // Get all localStorage keys
  const keys = Object.keys(localStorage);
  
  // Find book data keys
  const bookDataKeys = keys.filter(key => key.startsWith('book-story-data-v2-'));
  
  let clearedCount = 0;
  
  bookDataKeys.forEach(key => {
    const data = JSON.parse(localStorage.getItem(key));
    
    // Clear image data from all scenes
    data.stories.forEach(story => {
      story.scenes.forEach(scene => {
        if (scene.lastGeneratedImage) {
          scene.lastGeneratedImage = undefined;
          clearedCount++;
        }
        if (scene.imageHistory && scene.imageHistory.length > 0) {
          clearedCount += scene.imageHistory.length;
          scene.imageHistory = [];
        }
      });
    });
    
    // Save cleaned data back
    localStorage.setItem(key, JSON.stringify(data));
  });
  
  console.log(`✅ Cleared ${clearedCount} broken image(s)`);
  console.log('Please refresh the page');
})();

