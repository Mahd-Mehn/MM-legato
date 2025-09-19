'use client'

import { useState, useEffect, useCallback } from 'react'
import { bookAPI, settingsAPI } from '@/lib/api'
import { Book, BookFilters, BookListResponse, UserSettings } from '@/types/book'

export function useBooks(initialFilters?: BookFilters) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
    has_next: false,
    has_prev: false
  })
  const [filters, setFilters] = useState<BookFilters>(initialFilters || {
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
    is_published: true
  })

  const fetchBooks = useCallback(async (newFilters?: BookFilters, append: boolean = false) => {
    setLoading(true)
    setError(null)
    
    try {
      const currentFilters = newFilters || filters
      
      // Convert arrays to comma-separated strings for API
      const apiFilters = {
        ...currentFilters,
        tags: currentFilters.tags?.join(','),
        excluded_tags: currentFilters.excluded_tags?.join(',')
      }
      
      const response: BookListResponse = await bookAPI.getBooks(apiFilters)
      
      if (append) {
        setBooks(prev => [...prev, ...response.books])
      } else {
        setBooks(response.books)
      }
      
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        total_pages: response.total_pages,
        has_next: response.has_next,
        has_prev: response.has_prev
      })
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch books')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const updateFilters = useCallback((newFilters: Partial<BookFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }
    setFilters(updatedFilters)
    fetchBooks(updatedFilters)
  }, [filters, fetchBooks])

  const loadMore = useCallback(() => {
    if (pagination.has_next && !loading) {
      const nextPageFilters = { ...filters, page: pagination.page + 1 }
      setFilters(nextPageFilters)
      fetchBooks(nextPageFilters, true)
    }
  }, [filters, pagination, loading, fetchBooks])

  const refresh = useCallback(() => {
    fetchBooks(filters)
  }, [fetchBooks, filters])

  useEffect(() => {
    fetchBooks()
  }, []) // Only run on mount

  return {
    books,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    loadMore,
    refresh
  }
}

export function useBook(bookId: string, includeChapters: boolean = false) {
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBook = useCallback(async () => {
    if (!bookId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await bookAPI.getBook(bookId, includeChapters)
      setBook(response)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch book')
    } finally {
      setLoading(false)
    }
  }, [bookId, includeChapters])

  useEffect(() => {
    fetchBook()
  }, [fetchBook])

  return {
    book,
    loading,
    error,
    refresh: fetchBook
  }
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await settingsAPI.getUserSettings()
      setSettings(response)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateExcludedTags = useCallback(async (excludedTags: string[]) => {
    try {
      await settingsAPI.updateExcludedTags(excludedTags)
      if (settings) {
        setSettings({ ...settings, excluded_tags: excludedTags })
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update excluded tags')
    }
  }, [settings])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    updateExcludedTags,
    refresh: fetchSettings
  }
}