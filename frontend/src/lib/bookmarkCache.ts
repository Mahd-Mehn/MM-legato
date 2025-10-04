// Bookmark caching utility to reduce API calls

interface CachedBookmark {
  chapter_id: string
  position_percentage: number
  timestamp: number
}

const CACHE_KEY = 'legato-bookmark-cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function getCachedBookmark(chapterId: string): number | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const bookmarks: CachedBookmark[] = JSON.parse(cached)
    const bookmark = bookmarks.find(b => b.chapter_id === chapterId)
    
    if (!bookmark) return null

    // Check if cache is still valid
    const isExpired = Date.now() - bookmark.timestamp > CACHE_DURATION
    if (isExpired) {
      // Remove expired bookmark from cache
      const filtered = bookmarks.filter(b => b.chapter_id !== chapterId)
      localStorage.setItem(CACHE_KEY, JSON.stringify(filtered))
      return null
    }

    return bookmark.position_percentage
  } catch (error) {
    console.error('Error reading bookmark cache:', error)
    return null
  }
}

export function setCachedBookmark(chapterId: string, position: number): void {
  if (typeof window === 'undefined') return

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    let bookmarks: CachedBookmark[] = cached ? JSON.parse(cached) : []

    // Remove existing bookmark for this chapter
    bookmarks = bookmarks.filter(b => b.chapter_id !== chapterId)

    // Add new bookmark
    bookmarks.push({
      chapter_id: chapterId,
      position_percentage: position,
      timestamp: Date.now()
    })

    // Keep only last 10 bookmarks to prevent localStorage bloat
    if (bookmarks.length > 10) {
      bookmarks = bookmarks
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(bookmarks))
  } catch (error) {
    console.error('Error caching bookmark:', error)
  }
}

export function clearBookmarkCache(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CACHE_KEY)
}