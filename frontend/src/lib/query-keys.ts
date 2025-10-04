/**
 * Centralized query keys for React Query
 * This ensures consistent cache key management across the application
 */

export const queryKeys = {
  // User-related queries
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
    rolePermissions: () => [...queryKeys.user.all, 'role-permissions'] as const,
  },

  // Book-related queries
  books: {
    all: ['books'] as const,
    lists: () => [...queryKeys.books.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.books.lists(), filters] as const,
    details: () => [...queryKeys.books.all, 'detail'] as const,
    detail: (id: string, includeChapters?: boolean) => 
      [...queryKeys.books.details(), id, { includeChapters }] as const,
    chapters: (bookId: string) => [...queryKeys.books.all, 'chapters', bookId] as const,
    navigation: (bookId: string) => [...queryKeys.books.all, 'navigation', bookId] as const,
  },

  // Chapter-related queries
  chapters: {
    all: ['chapters'] as const,
    detail: (id: string) => [...queryKeys.chapters.all, 'detail', id] as const,
    reading: (id: string) => [...queryKeys.chapters.all, 'reading', id] as const,
  },

  // Library-related queries
  library: {
    all: ['library'] as const,
    books: (includeVault?: boolean) => [...queryKeys.library.all, 'books', { includeVault }] as const,
    history: () => [...queryKeys.library.all, 'history'] as const,
  },

  // Reading-related queries
  reading: {
    all: ['reading'] as const,
    progress: (bookId: string) => [...queryKeys.reading.all, 'progress', bookId] as const,
    continueReading: (limit?: number) => [...queryKeys.reading.all, 'continue', { limit }] as const,
    bookmarks: () => [...queryKeys.reading.all, 'bookmarks'] as const,
    bookmark: (chapterId: string) => [...queryKeys.reading.bookmarks(), chapterId] as const,
  },

  // Comment-related queries
  comments: {
    all: ['comments'] as const,
    chapter: (chapterId: string) => [...queryKeys.comments.all, 'chapter', chapterId] as const,
    count: (chapterId: string) => [...queryKeys.comments.all, 'count', chapterId] as const,
  },

  // Character-related queries
  characters: {
    all: ['characters'] as const,
    lists: () => [...queryKeys.characters.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.characters.all, 'detail', id] as const,
    byBook: (bookId: string) => [...queryKeys.characters.all, 'book', bookId] as const,
  },

  // Notification-related queries
  notifications: {
    all: ['notifications'] as const,
    list: (skip?: number, limit?: number, unreadOnly?: boolean) => 
      [...queryKeys.notifications.all, 'list', { skip, limit, unreadOnly }] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },

  // Analytics-related queries
  analytics: {
    all: ['analytics'] as const,
    writerOverview: (startDate?: string, endDate?: string) => 
      [...queryKeys.analytics.all, 'writer-overview', { startDate, endDate }] as const,
    bookAnalytics: (bookId: string, startDate?: string, endDate?: string) => 
      [...queryKeys.analytics.all, 'book', bookId, { startDate, endDate }] as const,
  },

  // Vault-related queries
  vault: {
    all: ['vault'] as const,
    status: () => [...queryKeys.vault.all, 'status'] as const,
    books: () => [...queryKeys.vault.all, 'books'] as const,
    session: () => [...queryKeys.vault.all, 'session'] as const,
  },

  // Moderation-related queries
  moderation: {
    all: ['moderation'] as const,
    dashboard: () => [...queryKeys.moderation.all, 'dashboard'] as const,
    reports: (page?: number, pageSize?: number) => 
      [...queryKeys.moderation.all, 'reports', { page, pageSize }] as const,
    logs: (page?: number, pageSize?: number) => 
      [...queryKeys.moderation.all, 'logs', { page, pageSize }] as const,
  },

  // Payment-related queries
  payments: {
    all: ['payments'] as const,
    wallet: () => [...queryKeys.payments.all, 'wallet'] as const,
    transactions: (page?: number, limit?: number) => 
      [...queryKeys.payments.all, 'transactions', { page, limit }] as const,
  },
} as const

/**
 * Helper function to invalidate related queries after mutations
 */
export const getInvalidationKeys = {
  // When a book is created/updated/deleted
  onBookChange: (bookId?: string) => [
    queryKeys.books.all,
    queryKeys.library.all,
    ...(bookId ? [queryKeys.books.detail(bookId, true)] : []),
  ],

  // When a chapter is created/updated/deleted
  onChapterChange: (bookId: string, chapterId?: string) => [
    queryKeys.books.chapters(bookId),
    queryKeys.books.detail(bookId, true),
    ...(chapterId ? [queryKeys.chapters.detail(chapterId)] : []),
  ],

  // When a comment is created/updated/deleted
  onCommentChange: (chapterId: string) => [
    queryKeys.comments.chapter(chapterId),
    queryKeys.comments.count(chapterId),
  ],

  // When library changes
  onLibraryChange: () => [
    queryKeys.library.all,
    queryKeys.reading.continueReading(),
  ],

  // When reading progress changes
  onReadingProgressChange: (bookId: string) => [
    queryKeys.reading.progress(bookId),
    queryKeys.reading.continueReading(),
  ],

  // When notifications change
  onNotificationChange: () => [
    queryKeys.notifications.all,
  ],

  // When user profile changes
  onProfileChange: () => [
    queryKeys.user.profile(),
    queryKeys.user.settings(),
  ],
}