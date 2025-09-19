import { useMutation, useQueryClient } from '@tanstack/react-query'
import { readingAPI } from '@/lib/api'

export function useReadingProgress() {
  const queryClient = useQueryClient()

  const updateProgressMutation = useMutation({
    mutationFn: async ({ bookId, chapterId, positionPercentage }: {
      bookId: string
      chapterId: string
      positionPercentage: number
    }) => {
      return readingAPI.updateReadingProgress(bookId, chapterId, positionPercentage)
    },
    onSuccess: () => {
      // Invalidate continue reading query to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ['continue-reading'] })
    },
    onError: (error) => {
      console.error('Failed to update reading progress:', error)
      // TODO: Add proper error notification
    }
  })

  const updateProgress = (bookId: string, chapterId: string, positionPercentage: number) => {
    updateProgressMutation.mutate({ bookId, chapterId, positionPercentage })
  }

  return {
    updateProgress,
    isUpdating: updateProgressMutation.isPending
  }
}