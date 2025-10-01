'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { bookAPI, settingsAPI } from '@/lib/api'
import { Book, BookFilters, BookListResponse, UserSettings } from '@/types/book'
import { queryKeys, getInvalidationKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

export function useBooks(filters?: BookFilters) {
  const normalizedFilters = {
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
    is_published: true,
    ...filters,
  }

  return useQuery({
    queryKey: queryKeys.books.list(normalizedFilters),
    queryFn: async (): Promise<BookListResponse> => {
      // Convert arrays to comma-separated strings for API
      const apiFilters = {
        ...normalizedFilters,
        tags: normalizedFilters.tags?.join(','),
        excluded_tags: normalizedFilters.excluded_tags?.join(',')
      }

      return await bookAPI.getBooks(apiFilters)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for book lists
  })
}

export function useInfiniteBooks(filters?: BookFilters) {
  const normalizedFilters = {
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
    is_published: true,
    ...filters,
  }

  return useInfiniteQuery({
    queryKey: queryKeys.books.list({ ...normalizedFilters, infinite: true }),
    queryFn: async ({ pageParam = 1 }): Promise<BookListResponse> => {
      const apiFilters = {
        ...normalizedFilters,
        page: pageParam,
        tags: normalizedFilters.tags?.join(','),
        excluded_tags: normalizedFilters.excluded_tags?.join(',')
      }

      return await bookAPI.getBooks(apiFilters)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.has_next ? lastPage.page + 1 : undefined
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useBook(bookId: string, includeChapters: boolean = false) {
  return useQuery({
    queryKey: queryKeys.books.detail(bookId, includeChapters),
    queryFn: () => bookAPI.getBook(bookId, includeChapters),
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes for individual books
  })
}

export function useBookChapters(bookId: string) {
  return useQuery({
    queryKey: queryKeys.books.chapters(bookId),
    queryFn: () => bookAPI.getBookChapters(bookId),
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBookNavigation(bookId: string) {
  return useQuery({
    queryKey: queryKeys.books.navigation(bookId),
    queryFn: () => bookAPI.getBookChapters(bookId), // Use existing method for navigation
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000, // 10 minutes for navigation
  })
}

export function useCreateBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bookAPI.createBook,
    onSuccess: (newBook) => {
      // Invalidate book lists
      queryClient.invalidateQueries({ queryKey: queryKeys.books.lists() })

      // Add the new book to the cache
      queryClient.setQueryData(queryKeys.books.detail(newBook.id), newBook)

      toast.success('Book created successfully!')
    },
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookId, data }: { bookId: string; data: any }) =>
      bookAPI.updateBook(bookId, data),
    onSuccess: (updatedBook, { bookId }) => {
      // Update the book in cache
      queryClient.setQueryData(queryKeys.books.detail(bookId), updatedBook)

      // Invalidate related queries
      getInvalidationKeys.onBookChange(bookId).forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })

      toast.success('Book updated successfully!')
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bookAPI.deleteBook,
    onSuccess: (_, bookId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.books.detail(bookId) })

      // Invalidate book lists
      queryClient.invalidateQueries({ queryKey: queryKeys.books.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.library.all })

      toast.success('Book deleted successfully!')
    },
  })
}

export function useCreateChapter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookId, data }: { bookId: string; data: any }) =>
      bookAPI.createChapter(bookId, data),
    onSuccess: (newChapter, { bookId }) => {
      // Invalidate related queries
      getInvalidationKeys.onChapterChange(bookId, newChapter.id).forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })

      toast.success('Chapter created successfully!')
    },
  })
}

export function useUpdateChapter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chapterId, data }: { chapterId: string; data: any }) =>
      bookAPI.updateChapter(chapterId, data),
    onSuccess: (updatedChapter, { chapterId }) => {
      // Update chapter in cache
      queryClient.setQueryData(queryKeys.chapters.detail(chapterId), updatedChapter)

      // Invalidate related queries
      if (updatedChapter.book_id) {
        getInvalidationKeys.onChapterChange(updatedChapter.book_id, chapterId).forEach(key => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }

      toast.success('Chapter updated successfully!')
    },
  })
}

export function useDeleteChapter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bookAPI.deleteChapter,
    onSuccess: (_, chapterId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.chapters.detail(chapterId) })

      // Invalidate book chapters (we don't know bookId here, so invalidate all)
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all })

      toast.success('Chapter deleted successfully!')
    },
  })
}

export function useUploadBookCover() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookId, file }: { bookId: string; file: File }) =>
      bookAPI.uploadBookCover(bookId, file),
    onSuccess: (result, { bookId }) => {
      // Update book in cache with new cover URL
      queryClient.setQueryData(
        queryKeys.books.detail(bookId),
        (oldBook: Book | undefined) => {
          if (oldBook) {
            return { ...oldBook, cover_image_url: result.url }
          }
          return oldBook
        }
      )

      // Invalidate book lists to show updated cover
      queryClient.invalidateQueries({ queryKey: queryKeys.books.lists() })

      toast.success('Book cover uploaded successfully!')
    },
  })
}

export function useUserSettings() {
  return useQuery({
    queryKey: queryKeys.user.settings(),
    queryFn: settingsAPI.getUserSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes for settings
  })
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: settingsAPI.updateUserSettings,
    onSuccess: (updatedSettings) => {
      // Update settings in cache
      queryClient.setQueryData(queryKeys.user.settings(), updatedSettings)

      // Invalidate book lists as excluded tags might have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.books.lists() })

      toast.success('Settings updated successfully!')
    },
  })
}

export function useUpdateExcludedTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: settingsAPI.updateExcludedTags,
    onSuccess: (_, excludedTags) => {
      // Update settings in cache
      queryClient.setQueryData(
        queryKeys.user.settings(),
        (oldSettings: UserSettings | undefined) => {
          if (oldSettings) {
            return { ...oldSettings, excluded_tags: excludedTags }
          }
          return oldSettings
        }
      )

      // Invalidate book lists as excluded tags changed
      queryClient.invalidateQueries({ queryKey: queryKeys.books.lists() })

      toast.success('Excluded tags updated successfully!')
    },
  })
}