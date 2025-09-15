import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

interface OptimisticUpdateOptions<T> {
  queryKey: any[];
  updateFn: (oldData: T | undefined, optimisticData: any) => T;
  revertFn?: (oldData: T | undefined, failedData: any) => T;
  onError?: (error: any) => void;
  onSuccess?: (data: T) => void;
}

export function useOptimisticUpdates<T>() {
  const queryClient = useQueryClient();

  const performOptimisticUpdate = useCallback(
    async <TData>(
      mutationFn: () => Promise<TData>,
      options: OptimisticUpdateOptions<T>
    ): Promise<TData> => {
      const { queryKey, updateFn, revertFn, onError, onSuccess } = options;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<T>(queryKey);

      // Optimistically update the cache
      queryClient.setQueryData<T>(queryKey, (oldData) => 
        updateFn(oldData, null)
      );

      try {
        // Perform the actual mutation
        const result = await mutationFn();
        
        // Update cache with real data
        queryClient.setQueryData<T>(queryKey, (oldData) => 
          updateFn(oldData, result)
        );

        onSuccess?.(result as T);
        return result;
      } catch (error) {
        // Revert the optimistic update
        if (revertFn) {
          queryClient.setQueryData<T>(queryKey, (oldData) => 
            revertFn(oldData, error)
          );
        } else {
          queryClient.setQueryData<T>(queryKey, previousData);
        }

        onError?.(error);
        throw error;
      }
    },
    [queryClient]
  );

  return { performOptimisticUpdate };
}

// Specialized hooks for common optimistic update patterns

export function useOptimisticLike() {
  const { performOptimisticUpdate } = useOptimisticUpdates();

  return useCallback(
    (
      storyId: string,
      queryKey: any[],
      likeFn: () => Promise<any>,
      currentLiked: boolean,
      currentLikeCount: number
    ) => {
      return performOptimisticUpdate(likeFn, {
        queryKey,
        updateFn: (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            liked: !currentLiked,
            likeCount: currentLiked ? currentLikeCount - 1 : currentLikeCount + 1,
          };
        },
        revertFn: (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            liked: currentLiked,
            likeCount: currentLikeCount,
          };
        },
      });
    },
    [performOptimisticUpdate]
  );
}

export function useOptimisticFollow() {
  const { performOptimisticUpdate } = useOptimisticUpdates();

  return useCallback(
    (
      userId: string,
      queryKey: any[],
      followFn: () => Promise<any>,
      currentFollowing: boolean,
      currentFollowerCount: number
    ) => {
      return performOptimisticUpdate(followFn, {
        queryKey,
        updateFn: (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            following: !currentFollowing,
            followerCount: currentFollowing 
              ? currentFollowerCount - 1 
              : currentFollowerCount + 1,
          };
        },
        revertFn: (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            following: currentFollowing,
            followerCount: currentFollowerCount,
          };
        },
      });
    },
    [performOptimisticUpdate]
  );
}

export function useOptimisticBookmark() {
  const { performOptimisticUpdate } = useOptimisticUpdates();

  return useCallback(
    (
      storyId: string,
      queryKey: any[],
      bookmarkFn: () => Promise<any>,
      currentBookmarked: boolean
    ) => {
      return performOptimisticUpdate(bookmarkFn, {
        queryKey,
        updateFn: (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            bookmarked: !currentBookmarked,
          };
        },
        revertFn: (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            bookmarked: currentBookmarked,
          };
        },
      });
    },
    [performOptimisticUpdate]
  );
}

export function useOptimisticComment() {
  const { performOptimisticUpdate } = useOptimisticUpdates();

  return useCallback(
    (
      queryKey: any[],
      addCommentFn: () => Promise<any>,
      newComment: any
    ) => {
      return performOptimisticUpdate(addCommentFn, {
        queryKey,
        updateFn: (oldData: any) => {
          if (!oldData) return { comments: [newComment] };
          
          return {
            ...oldData,
            comments: [newComment, ...oldData.comments],
          };
        },
        revertFn: (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            comments: oldData.comments.filter(
              (comment: any) => comment.id !== newComment.id
            ),
          };
        },
      });
    },
    [performOptimisticUpdate]
  );
}