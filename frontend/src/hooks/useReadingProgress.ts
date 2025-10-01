import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { readingAPI } from '@/lib/api'
import { queryKeys, getInvalidationKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

export function useReadingProgress(bookId?: string) {
  return useQuery({
    queryKey: queryKeys.reading.progress(bookId!),
    queryFn: () => readingAPI.getReadingProgress(bookId!),
    enabled: !!bookId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useContinueReading(limit = 5) {
  return useQuery({
    queryKey: queryKeys.reading.continueReading(limit),
    queryFn: () => readingAPI.getContinueReading(limit),
    staleTime: 1 * 60 * 1000, // 1 minute for continue reading
  })
}

export function useUpdateReadingProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookId, chapterId, positionPercentage }: {
      bookId: string
      chapterId: string
      positionPercentage: number
    }) => {
      return readingAPI.updateReadingProgress(bookId, chapterId, positionPercentage)
    },
    onMutate: async ({ bookId, chapterId, positionPercentage }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.reading.progress(bookId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.reading.continueReading() })

      // Optimistically update reading progress
      queryClient.setQueryData(
        queryKeys.reading.progress(bookId),
        (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              current_chapter_id: chapterId,
              position_percentage: positionPercentage,
              last_read_at: new Date().toISOString(),
            }
          }
          return oldData
        }
      )

      // Optimistically update continue reading
      queryClient.setQueryData(
        queryKeys.reading.continueReading(),
        (oldData: any[]) => {
          if (oldData) {
            return oldData.map(item => 
              item.book_id === bookId 
                ? {
                    ...item,
                    current_chapter_id: chapterId,
                    position_percentage: positionPercentage,
                    last_read_at: new Date().toISOString(),
                  }
                : item
            )
          }
          return oldData
        }
      )
    },
    onSuccess: (_, { bookId }) => {
      // Invalidate related queries to ensure consistency
      getInvalidationKeys.onReadingProgressChange(bookId).forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
    onError: (error, { bookId }) => {
      // Revert optimistic updates on error
      queryClient.invalidateQueries({ queryKey: queryKeys.reading.progress(bookId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.reading.continueReading() })
      
      console.error('Failed to update reading progress:', error)
      // Don't show toast for reading progress errors as they happen frequently
    }
  })
}

export function useBookmarks() {
  return useQuery({
    queryKey: queryKeys.reading.bookmarks(),
    queryFn: () => {
      // This would need to be implemented in the API
      // For now, return empty array
      return Promise.resolve([])
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useChapterBookmark(chapterId: string) {
  return useQuery({
    queryKey: queryKeys.reading.bookmark(chapterId),
    queryFn: () => readingAPI.getChapterBookmark(chapterId),
    enabled: !!chapterId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chapterId, positionPercentage }: { chapterId: string; positionPercentage: number }) => 
      readingAPI.createBookmark(chapterId, positionPercentage),
    onSuccess: (bookmark) => {
      // Update bookmark cache
      queryClient.setQueryData(
        queryKeys.reading.bookmark(bookmark.chapter_id),
        bookmark
      )
      
      // Invalidate bookmarks list
      queryClient.invalidateQueries({ queryKey: queryKeys.reading.bookmarks() })
      
      toast.success('Bookmark saved!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save bookmark')
    },
  })
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: readingAPI.deleteBookmark,
    onSuccess: (_, chapterId) => {
      // Remove bookmark from cache
      queryClient.removeQueries({ queryKey: queryKeys.reading.bookmark(chapterId) })
      
      // Invalidate bookmarks list
      queryClient.invalidateQueries({ queryKey: queryKeys.reading.bookmarks() })
      
      toast.success('Bookmark removed!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to remove bookmark')
    },
  })
}