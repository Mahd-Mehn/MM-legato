import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

export class CacheManager {
    constructor(private queryClient: QueryClient) { }

    // Invalidate all user-related data
    invalidateUserData(userId?: string) {
        this.queryClient.invalidateQueries({
            queryKey: queryKeys.user.profile()
        });
        this.queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.all
        });
        this.queryClient.invalidateQueries({
            queryKey: queryKeys.library.all
        });
    }

    // Invalidate book-related data
    invalidateBookData(bookId?: string) {
        if (bookId) {
            this.queryClient.invalidateQueries({
                queryKey: queryKeys.books.detail(bookId)
            });
            this.queryClient.invalidateQueries({
                queryKey: queryKeys.books.chapters(bookId)
            });
        }
        this.queryClient.invalidateQueries({
            queryKey: queryKeys.books.all
        });
    }

    // Invalidate comment-related data
    invalidateCommentData(chapterId?: string) {
        if (chapterId) {
            this.queryClient.invalidateQueries({
                queryKey: queryKeys.comments.chapter(chapterId)
            });
        }
        this.queryClient.invalidateQueries({
            queryKey: queryKeys.comments.all
        });
    }

    // Invalidate payment-related data
    invalidatePaymentData(userId?: string) {
        this.queryClient.invalidateQueries({
            queryKey: queryKeys.payments.wallet()
        });
        this.queryClient.invalidateQueries({
            queryKey: queryKeys.payments.transactions()
        });
    }

    // Invalidate analytics data
    invalidateAnalyticsData(userId?: string) {
        this.queryClient.invalidateQueries({
            queryKey: queryKeys.analytics.writerOverview()
        });
        this.queryClient.invalidateQueries({
            queryKey: queryKeys.analytics.all
        });
    }

    // Optimistic update helpers
    updateBookInCache(bookId: string, updater: (oldData: any) => any) {
        this.queryClient.setQueryData(
            queryKeys.books.detail(bookId),
            updater
        );
    }

    updateCommentInCache(chapterId: string, commentId: string, updater: (oldData: any) => any) {
        this.queryClient.setQueryData(
            queryKeys.comments.chapter(chapterId),
            (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages?.map((page: any) => ({
                        ...page,
                        comments: page.comments?.map((comment: any) =>
                            comment.id === commentId ? updater(comment) : comment
                        )
                    }))
                };
            }
        );
    }

    updateWalletBalance(userId: string, newBalance: number) {
        this.queryClient.setQueryData(
            queryKeys.payments.wallet(),
            (oldData: any) => ({
                ...oldData,
                balance: newBalance
            })
        );
    }

    // Prefetch helpers
    prefetchBookDetails(bookId: string) {
        return this.queryClient.prefetchQuery({
            queryKey: queryKeys.books.detail(bookId),
            queryFn: () => fetch(`/api/books/${bookId}`).then(res => res.json()),
            staleTime: 5 * 60 * 1000 // 5 minutes
        });
    }

    prefetchChapterComments(chapterId: string) {
        return this.queryClient.prefetchQuery({
            queryKey: queryKeys.comments.chapter(chapterId),
            queryFn: () => fetch(`/api/comments/chapter/${chapterId}`).then(res => res.json()),
            staleTime: 2 * 60 * 1000 // 2 minutes
        });
    }

    // Cache warming for user data
    warmUserCache(userId: string) {
        // Prefetch commonly accessed user data
        this.queryClient.prefetchQuery({
            queryKey: queryKeys.user.profile(),
            queryFn: () => fetch(`/api/users/${userId}/profile`).then(res => res.json())
        });

        this.queryClient.prefetchQuery({
            queryKey: queryKeys.library.books(),
            queryFn: () => fetch(`/api/users/${userId}/library`).then(res => res.json())
        });

        this.queryClient.prefetchQuery({
            queryKey: queryKeys.payments.wallet(),
            queryFn: () => fetch(`/api/payments/wallet`).then(res => res.json())
        });
    }

    // Clear all cache
    clearAllCache() {
        this.queryClient.clear();
    }

    // Remove specific user data (for logout)
    clearUserCache(userId?: string) {
        this.queryClient.removeQueries({
            queryKey: queryKeys.user.profile()
        });
        this.queryClient.removeQueries({
            queryKey: queryKeys.notifications.all
        });
        this.queryClient.removeQueries({
            queryKey: queryKeys.library.all
        });
        this.queryClient.removeQueries({
            queryKey: queryKeys.payments.wallet()
        });
        this.queryClient.removeQueries({
            queryKey: queryKeys.payments.transactions()
        });
    }
}

// Export a singleton instance
export const createCacheManager = (queryClient: QueryClient) =>
    new CacheManager(queryClient);