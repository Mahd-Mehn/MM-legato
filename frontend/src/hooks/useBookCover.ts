'use client'

import { useState } from 'react'
import { bookAPI } from '@/lib/api'
import { toast } from 'sonner'

export function useBookCoverUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadCover = async (bookId: string, file: File): Promise<{ url: string }> => {
    setUploading(true)
    setError(null)

    try {
      const result = await bookAPI.uploadBookCover(bookId, file)
      toast.success('Book cover uploaded successfully')
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to upload book cover'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setUploading(false)
    }
  }

  return {
    uploadCover,
    uploading,
    error
  }
}