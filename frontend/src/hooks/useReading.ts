import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getFromStorage, setToStorage, STORAGE_KEYS } from '@/lib/localStorage'
import { 
  ChapterReadingResponse, 
  BookNavigationResponse, 
  ReadingPreferences, 
  ReadingPreferencesUpdate,
  BookmarkResponse,
  BookmarkCreate
} from '@/types/reading'
import { toast } from 'sonner'

// Chapter reading
export function useChapterReading(chapterId: string) {
  return useQuery({
    queryKey: ['chapter-reading', chapterId],
    queryFn: async (): Promise<ChapterReadingResponse> => {
      try {
        const response = await api.get(`/api/v1/reading/chapters/${chapterId}`)
        return response.data
      } catch (error: any) {
        console.error('Chapter reading error:', error.response?.status, error.response?.data)
        if (error.response?.status === 401) {
          toast.error('Please log in to read this chapter')
        } else if (error.response?.status === 404) {
          toast.error('Chapter not found or access denied')
        }
        throw error
      }
    },
    enabled: !!chapterId,
  })
}

// Book navigation
export function useBookNavigation(bookId: string) {
  return useQuery({
    queryKey: ['book-navigation', bookId],
    queryFn: async (): Promise<BookNavigationResponse> => {
      const response = await api.get(`/api/v1/reading/books/${bookId}/navigation`)
      return response.data
    },
    enabled: !!bookId,
  })
}

// Reading preferences (localStorage-based)
export function useReadingPreferences() {
  const defaultPreferences: ReadingPreferences = {
    user_id: 'local',
    font_family: 'serif',
    font_size: 16,
    line_height: 1.6,
    background_color: '#ffffff',
    text_color: '#000000',
    page_width: 800,
    brightness: 100,
    wallpaper_url: undefined,
    theme_preset: 'light'
  }

  const [preferences, setPreferences] = useState<ReadingPreferences>(() => 
    getFromStorage(STORAGE_KEYS.READING_PREFERENCES, defaultPreferences)
  )

  const updatePreferences = (updates: ReadingPreferencesUpdate, showToast: boolean = true) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)
    setToStorage(STORAGE_KEYS.READING_PREFERENCES, newPreferences)
    if (showToast) {
      toast.success('Reading preferences updated')
    }
  }

  return {
    data: preferences,
    updatePreferences,
    isLoading: false,
    isError: false,
    error: null,
    isUpdating: false,
  }
}

// Bookmark management
export function useBookmark() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (bookmark: BookmarkCreate): Promise<BookmarkResponse> => {
      const response = await api.post('/api/v1/reading/bookmarks', bookmark)
      return response.data
    },
    onSuccess: (data) => {
      // Update the chapter reading data with new bookmark
      queryClient.setQueryData(['chapter-reading', data.chapter_id], (old: ChapterReadingResponse | undefined) => {
        if (old) {
          return { ...old, bookmark: data }
        }
        return old
      })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save bookmark')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (chapterId: string): Promise<void> => {
      await api.delete(`/api/v1/reading/bookmarks/chapter/${chapterId}`)
    },
    onSuccess: (_, chapterId) => {
      // Remove bookmark from chapter reading data
      queryClient.setQueryData(['chapter-reading', chapterId], (old: ChapterReadingResponse | undefined) => {
        if (old) {
          return { ...old, bookmark: undefined }
        }
        return old
      })
      toast.success('Bookmark removed')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to remove bookmark')
    },
  })

  return {
    createBookmark: createMutation.mutate,
    deleteBookmark: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

// Get chapter bookmark
export function useChapterBookmark(chapterId: string) {
  return useQuery({
    queryKey: ['chapter-bookmark', chapterId],
    queryFn: async (): Promise<BookmarkResponse | null> => {
      try {
        const response = await api.get(`/api/v1/reading/bookmarks/chapter/${chapterId}`)
        return response.data
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: !!chapterId,
  })
}