'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface LibraryBook {
  id: string
  book_id: string
  is_in_vault: boolean
  created_at: string
  book_title: string
  book_description?: string
  book_cover_image_url?: string
  author_username: string
  genre?: string
  tags?: string
}

export interface ReadingHistoryBook {
  book_id: string
  book_title: string
  book_description?: string
  book_cover_image_url?: string
  author_username: string
  genre?: string
  last_accessed: string
  is_in_library: boolean
}

export function useLibrary(includeVault: boolean = true) {
  return useQuery({
    queryKey: ['library', includeVault],
    queryFn: async (): Promise<LibraryBook[]> => {
      const response = await api.get('/api/v1/library/', {
        params: { include_vault: includeVault }
      })
      return response.data
    },
  })
}

export function useReadingHistory() {
  return useQuery({
    queryKey: ['reading-history'],
    queryFn: async (): Promise<ReadingHistoryBook[]> => {
      const response = await api.get('/api/v1/library/history')
      return response.data
    },
  })
}

export function useAddToLibrary() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.post('/api/v1/library/add', { book_id: bookId })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
      queryClient.invalidateQueries({ queryKey: ['reading-history'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useRemoveFromLibrary() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.delete(`/api/v1/library/${bookId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
      queryClient.invalidateQueries({ queryKey: ['reading-history'] })
    },
  })
}

export function useToggleVault() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.post(`/api/v1/library/vault/${bookId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
    },
  })
}