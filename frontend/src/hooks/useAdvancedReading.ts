'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function useAdvancedReading() {
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`
    }
    
    return headers
  }

  // Audio generation
  const generateAudio = async (chapterId: string, voiceId?: string) => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated')
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/audio/generate/${chapterId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          voice_id: voiceId || 'JBFqnCBsd6RMkjVDRZzb'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate audio')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Audio generation error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Get existing audio
  const getChapterAudio = useCallback(async (chapterId: string) => {
    if (!session?.accessToken) {
      console.log('No session token available')
      return null
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/audio/chapter/${chapterId}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed for audio request')
          return null
        }
        if (response.status === 404) {
          return null // No audio exists
        }
        throw new Error('Failed to get audio')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Get audio error:', error)
      return null
    }
  }, [session?.accessToken])

  // Translation
  const translateChapter = async (chapterId: string, targetLanguage: string) => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated')
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/translation/translate/${chapterId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          target_language: targetLanguage
        })
      })

      if (!response.ok) {
        throw new Error('Failed to translate chapter')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Translation error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Translate selected text
  const translateText = async (text: string, targetLanguage: string) => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated')
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/translation/translate-text`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text,
          target_language: targetLanguage
        })
      })

      if (!response.ok) {
        throw new Error('Failed to translate text')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Text translation error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Get supported languages
  const getSupportedLanguages = async () => {
    if (!session?.accessToken) {
      return {}
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/translation/languages`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get languages')
      }

      const data = await response.json()
      return data.languages
    } catch (error) {
      console.error('Get languages error:', error)
      return {}
    }
  }

  // Quote generation
  const generateQuote = async (quoteData: any) => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated')
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/quotes/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(quoteData)
      })

      if (!response.ok) {
        throw new Error('Failed to generate quote')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Quote generation error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Generate simple quote (without chapter context)
  const generateSimpleQuote = async (quoteText: string) => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated')
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/quotes/generate-simple`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          quote_text: quoteText
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate quote')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Simple quote generation error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    generateAudio,
    getChapterAudio,
    translateChapter,
    translateText,
    getSupportedLanguages,
    generateQuote,
    generateSimpleQuote
  }
}