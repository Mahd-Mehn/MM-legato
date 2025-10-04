# React Query Integration Guide

## Overview

This document outlines the comprehensive React Query setup for the Legato platform, including caching strategies, optimistic updates, and mutation handling.

## Architecture

### Query Client Configuration

The QueryClient is configured with:
- **Default stale time**: 5 minutes for most queries
- **Cache time**: 10 minutes to keep data in memory
- **Retry logic**: 3 attempts with exponential backoff
- **Refetch on window focus**: Enabled for real-time data
- **Background refetching**: Enabled for fresh data

### Query Keys Structure

All query keys follow a hierarchical structure defined in `query-keys.ts`:

```typescript
// Examples:
['users', 'profile', userId]
['books', 'all', filters]
['books', 'detail', bookId]
['comments', 'chapter', chapterId]
['payments', 'wallet', userId]
```

## Implemented Features

### 1. Enhanced Query Provider

**Location**: `src/components/providers/query-provider.tsx`

Features:
- Optimized cache configuration
- Error handling with retry logic
- Development tools integration
- Persistent cache for offline support

### 2. Centralized Query Keys

**Location**: `src/lib/query-keys.ts`

Benefits:
- Consistent cache key management
- Type-safe query key generation
- Easy cache invalidation
- Hierarchical organization

### 3. Comprehensive Hooks

#### Data Fetching Hooks:
- `useBooks` - Book discovery and filtering
- `useComments` - Comment threads with pagination
- `useNotifications` - Real-time notifications
- `useProfile` - User profile management
- `useLibrary` - Personal library management
- `useReadingProgress` - Reading position tracking
- `usePayments` - Wallet and transactions
- `useAnalytics` - Writer analytics dashboard

#### Mutation Hooks:
- `useBookMutations` - Library management, purchases
- `useCommentMutations` - Comment CRUD with optimistic updates
- `useProfileMutations` - Profile updates, vault settings
- `useReadingMutations` - Progress tracking, bookmarks
- `useWriterMutations` - Content creation and editing

### 4. Cache Management Utilities

**Location**: `src/lib/cache-utils.ts`

Features:
- Intelligent cache invalidation
- Optimistic update helpers
- Prefetching strategies
- Cache warming for user data
- Selective cache clearing

## Optimistic Updates

### Comment Interactions

When a user posts a comment:
1. Immediately add optimistic comment to cache
2. Show loading state with temporary ID
3. Replace with server response on success
4. Revert on error with toast notification

```typescript
const { createComment } = useCommentMutations();

// Optimistic update automatically handled
createComment.mutate({
  chapterId: 'chapter-id',
  content: 'Great chapter!',
  parentId: undefined
});
```

### Like Actions

When a user likes a comment:
1. Immediately increment like count
2. Update UI to show liked state
3. Revert on error
4. Background sync with server

### Library Management

When adding/removing books:
1. Immediately update library list
2. Show success feedback
3. Revert on network error
4. Invalidate related queries

## Error Handling

### Network Errors
- Automatic retry with exponential backoff
- Offline detection and queuing
- User-friendly error messages
- Fallback to cached data when possible

### Mutation Errors
- Automatic rollback of optimistic updates
- Toast notifications for user feedback
- Detailed error logging for debugging
- Graceful degradation

## Performance Optimizations

### Caching Strategies

1. **Aggressive Caching**: User profiles, book details (5-10 minutes)
2. **Moderate Caching**: Comments, library data (2-5 minutes)
3. **Fresh Data**: Notifications, wallet balance (30 seconds)
4. **Background Updates**: Analytics, reading progress (automatic)

### Prefetching

- Book details when hovering over book cards
- Chapter comments when opening reading interface
- User library data on dashboard load
- Related books based on reading history

### Cache Warming

- Prefetch commonly accessed data on login
- Warm cache for user's active books
- Background sync for offline-first experience

## Integration Examples

### Component Integration

```typescript
// Using query hooks
const { data: books, isLoading, error } = useBooks(filters);
const { addToLibrary, removeFromLibrary } = useBookMutations();

// Optimistic updates
const handleAddToLibrary = (bookId: string) => {
  addToLibrary.mutate(bookId); // Automatic optimistic update
};
```

### Cache Invalidation

```typescript
// Manual cache management
const cacheManager = createCacheManager(queryClient);

// After successful purchase
cacheManager.invalidatePaymentData(userId);
cacheManager.invalidateUserData(userId);
cacheManager.invalidateBookData(bookId);
```

## Migration Status

### ✅ Completed
- Query client configuration
- Query keys structure
- Book discovery hooks
- Comment system hooks
- Notification hooks
- Payment hooks
- Analytics hooks
- Mutation hooks with optimistic updates
- Cache management utilities

### 🔄 In Progress
- Component integration updates
- Error boundary integration
- Offline support enhancements

### 📋 Remaining
- Performance monitoring
- Cache persistence
- Advanced prefetching strategies
- Real-time subscriptions

## Best Practices

### Query Usage
1. Always use query keys from the centralized file
2. Implement proper loading and error states
3. Use optimistic updates for better UX
4. Leverage background refetching for fresh data

### Mutation Usage
1. Use mutation hooks for all data modifications
2. Implement proper error handling with user feedback
3. Invalidate related queries after mutations
4. Use optimistic updates for immediate feedback

### Cache Management
1. Invalidate related data after mutations
2. Use prefetching for predictable user actions
3. Implement cache warming for critical user data
4. Clear sensitive data on logout

## Monitoring and Debugging

### Development Tools
- React Query DevTools enabled in development
- Query inspection and cache visualization
- Network request monitoring
- Performance profiling

### Production Monitoring
- Error tracking for failed queries
- Performance metrics for cache hit rates
- User experience monitoring
- Background sync success rates

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live comments
2. **Offline Support**: Enhanced cache persistence and sync
3. **Advanced Prefetching**: ML-based prediction of user actions
4. **Performance Optimization**: Query deduplication and batching
5. **Analytics Integration**: Query performance tracking