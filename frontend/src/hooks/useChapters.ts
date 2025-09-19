'use client'

import { useState, useCallback } from 'react'
import { bookAPI } from '@/lib/api'
import { Chapter } from '@/types/book'

export function useChapters(bookId: string) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChapters = useCallback(async () => {
    if (!bookId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await bookAPI.getBookChapters(bookId)
      setChapters(response.sort((a: Chapter, b: Chapter) => a.chapter_number - b.chapter_number))
    } catch (err: any) {
      console.error('Error fetching chapters:', err)
      setError(err.response?.data?.detail || 'Failed to fetch chapters')
    } finally {
      setLoading(false)
    }
  }, [bookId])

  const createChapter = useCallback(async (chapterData: {
    title: string
    content: string
    chapter_number: number
    is_published: boolean
  }) => {
    try {
      const newChapter = await bookAPI.createChapter(bookId, chapterData)
      await fetchChapters() // Refresh the list
      return newChapter
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create chapter')
      throw err
    }
  }, [bookId, fetchChapters])

  const updateChapter = useCallback(async (chapterId: string, chapterData: any) => {
    try {
      const updatedChapter = await bookAPI.updateChapter(chapterId, chapterData)
      await fetchChapters() // Refresh the list
      return updatedChapter
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update chapter')
      throw err
    }
  }, [fetchChapters])

  const deleteChapter = useCallback(async (chapterId: string) => {
    try {
      await bookAPI.deleteChapter(chapterId)
      await fetchChapters() // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete chapter')
      throw err
    }
  }, [fetchChapters])

  const getNextChapterNumber = useCallback(() => {
    if (chapters.length === 0) return 1
    return Math.max(...chapters.map(c => c.chapter_number)) + 1
  }, [chapters])

  return {
    chapters,
    loading,
    error,
    fetchChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    getNextChapterNumber
  }
}