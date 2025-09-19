'use client'

import { useState, useEffect, useCallback } from 'react'
import { bookAPI } from '@/lib/api'
import { Book } from '@/types/book'
import { useSession } from 'next-auth/react'

export function useWriterBooks() {
  const { data: session, status } = useSession()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)



  const fetchWriterBooks = useCallback(async () => {
    const userId = session?.user?.id
    
    if (!userId) {
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Fetch both published and unpublished books separately
      // since the API defaults to published=true
      const [publishedResponse, draftResponse] = await Promise.all([
        bookAPI.getBooks({
          author_id: userId,
          is_published: true,
          limit: 100
        }),
        bookAPI.getBooks({
          author_id: userId,
          is_published: false,
          limit: 100
        })
      ])
      
      // Combine both published and draft books
      const allBooks = [...publishedResponse.books, ...draftResponse.books]
      setBooks(allBooks)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch books')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  const createBook = useCallback(async (bookData: {
    title: string
    description?: string
    cover_image_url?: string
    pricing_model: 'free' | 'fixed' | 'per_chapter'
    fixed_price?: number
    per_chapter_price?: number
    genre?: string
    tags?: string[]
    is_published?: boolean
  }) => {
    try {
      const newBook = await bookAPI.createBook(bookData)
      // Refresh the entire list to ensure consistency
      await fetchWriterBooks()
      return newBook
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create book')
      throw err
    }
  }, [fetchWriterBooks])

  const updateBook = useCallback(async (bookId: string, bookData: any) => {
    try {
      const updatedBook = await bookAPI.updateBook(bookId, bookData)
      // Refresh the entire list to ensure consistency
      await fetchWriterBooks()
      return updatedBook
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update book')
      throw err
    }
  }, [fetchWriterBooks])

  const deleteBook = useCallback(async (bookId: string) => {
    try {
      await bookAPI.deleteBook(bookId)
      // Refresh the entire list to ensure consistency
      await fetchWriterBooks()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete book')
      throw err
    }
  }, [fetchWriterBooks])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchWriterBooks()
    }
  }, [fetchWriterBooks, session?.user?.id, status])

  const publishedBooks = books.filter(book => book.is_published)
  const draftBooks = books.filter(book => !book.is_published)



  return {
    books,
    publishedBooks,
    draftBooks,
    loading,
    error,
    createBook,
    updateBook,
    deleteBook,
    refresh: fetchWriterBooks
  }
}