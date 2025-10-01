import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsAPI } from '@/lib/api'
import { WriterAnalytics, BookDetailAnalytics, DateRange } from '@/types/analytics'
import { queryKeys } from '@/lib/query-keys'
import { format } from 'date-fns'
import { toast } from 'sonner'

export function useWriterAnalytics(dateRange?: DateRange) {
  const startDate = dateRange?.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : undefined
  const endDate = dateRange?.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : undefined

  return useQuery({
    queryKey: queryKeys.analytics.writerOverview(startDate, endDate),
    queryFn: (): Promise<WriterAnalytics> => 
      analyticsAPI.getWriterOverview(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes - analytics can be slightly stale
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })
}

export function useBookAnalytics(bookId: string, dateRange?: DateRange) {
  const startDate = dateRange?.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : undefined
  const endDate = dateRange?.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : undefined

  return useQuery({
    queryKey: queryKeys.analytics.bookAnalytics(bookId, startDate, endDate),
    queryFn: (): Promise<BookDetailAnalytics> => 
      analyticsAPI.getBookAnalytics(bookId, startDate, endDate),
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })
}

export function useExportEarningsReport() {
  return useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate?: string; endDate?: string }) => {
      return analyticsAPI.exportEarningsReport(startDate, endDate)
    },
    onSuccess: () => {
      toast.success('Earnings report exported successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to export earnings report')
    },
  })
}

export function useExportAnalyticsReport() {
  return useMutation({
    mutationFn: async ({ 
      bookId, 
      startDate, 
      endDate 
    }: { 
      bookId?: string; 
      startDate?: string; 
      endDate?: string 
    }) => {
      return analyticsAPI.exportAnalyticsReport(bookId, startDate, endDate)
    },
    onSuccess: () => {
      toast.success('Analytics report exported successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to export analytics report')
    },
  })
}

export function useTrackBookView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: analyticsAPI.trackBookView,
    onSuccess: (_, bookId) => {
      // Invalidate analytics queries to reflect new view
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.bookAnalytics(bookId) })
    },
    onError: (error) => {
      // Don't show error toast for tracking failures
      console.error('Error tracking book view:', error)
    },
    // Don't retry tracking mutations
    retry: false,
  })
}

export function useTrackChapterView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: analyticsAPI.trackChapterView,
    onSuccess: () => {
      // Invalidate analytics queries to reflect new view
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
    },
    onError: (error) => {
      // Don't show error toast for tracking failures
      console.error('Error tracking chapter view:', error)
    },
    // Don't retry tracking mutations
    retry: false,
  })
}

// Convenience hook for view tracking with automatic calls
export function useViewTracking() {
  const trackBookViewMutation = useTrackBookView()
  const trackChapterViewMutation = useTrackChapterView()

  const trackBookView = (bookId: string) => {
    trackBookViewMutation.mutate(bookId)
  }

  const trackChapterView = (chapterId: string) => {
    trackChapterViewMutation.mutate(chapterId)
  }

  return {
    trackBookView,
    trackChapterView,
    isTrackingBookView: trackBookViewMutation.isPending,
    isTrackingChapterView: trackChapterViewMutation.isPending,
  }
}