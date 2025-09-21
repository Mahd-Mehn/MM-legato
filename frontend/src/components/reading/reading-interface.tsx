'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ReadingHeader } from './reading-header'
import { ReadingContent } from './reading-content'
import { ReadingControls } from './reading-controls'
import { ReadingSettings } from './reading-settings'
import { TableOfContents } from './table-of-contents'
import { useReadingPreferences, useBookNavigation, useBookmark } from '../../hooks/useReading'
import { useReadingProgress } from '../../hooks/useReadingProgress'
import { ChapterReadingResponse } from '../../types/reading'
import { getCachedBookmark, setCachedBookmark } from '../../lib/bookmarkCache'
import { toast } from 'sonner'

interface ReadingInterfaceProps {
  chapterData: ChapterReadingResponse
}

export function ReadingInterface({ chapterData }: ReadingInterfaceProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showTOC, setShowTOC] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [lastSavedProgress, setLastSavedProgress] = useState(0)
  const [isSavingBookmark, setIsSavingBookmark] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { data: preferences, updatePreferences } = useReadingPreferences()
  const { data: navigation } = useBookNavigation(chapterData.book_id)
  const { createBookmark } = useBookmark()
  const { updateProgress } = useReadingProgress()

  // Debounced bookmark and progress save function
  const debouncedSaveProgress = useCallback((progress: number) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Only save if progress has changed significantly (more than 2%)
    const progressDiff = Math.abs(progress - lastSavedProgress)
    if (progressDiff < 2) {
      return
    }

    // Immediately cache the bookmark locally
    setCachedBookmark(chapterData.id, progress)

    // Set new timeout to save both bookmark and reading progress after 3 seconds of no scrolling
    saveTimeoutRef.current = setTimeout(() => {
      setIsSavingBookmark(true)
      
      // Save bookmark
      createBookmark({
        chapter_id: chapterData.id,
        position_percentage: progress
      })
      
      // Update reading progress for continue reading functionality
      updateProgress(chapterData.book_id, chapterData.id, progress)
      
      setLastSavedProgress(progress)
      // Hide saving indicator after a short delay
      setTimeout(() => setIsSavingBookmark(false), 1000)
    }, 3000) // Wait 3 seconds after user stops scrolling
  }, [chapterData.id, chapterData.book_id, createBookmark, updateProgress, lastSavedProgress])

  // Handle scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return
      
      const element = contentRef.current
      const scrollTop = element.scrollTop
      const scrollHeight = element.scrollHeight - element.clientHeight
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      
      setScrollProgress(progress)
      
      // Use debounced progress saving (includes both bookmark and reading progress)
      debouncedSaveProgress(progress)
    }

    const element = contentRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true })
      return () => element.removeEventListener('scroll', handleScroll)
    }
  }, [debouncedSaveProgress])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (preferenceTimeoutRef.current) {
        clearTimeout(preferenceTimeoutRef.current)
      }
    }
  }, [])

  // Initialize last saved progress from existing bookmark or cache
  useEffect(() => {
    const cachedProgress = getCachedBookmark(chapterData.id)
    const serverProgress = chapterData.bookmark ? Number(chapterData.bookmark.position_percentage) : 0
    
    // Use the more recent progress (cached is usually more up-to-date)
    const initialProgress = cachedProgress !== null ? cachedProgress : serverProgress
    setLastSavedProgress(initialProgress)
  }, [chapterData.bookmark, chapterData.id])

  // Restore bookmark position on load
  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current
      const scrollHeight = element.scrollHeight - element.clientHeight
      
      // Use cached bookmark if available, otherwise use server bookmark
      const cachedProgress = getCachedBookmark(chapterData.id)
      const serverProgress = chapterData.bookmark ? Number(chapterData.bookmark.position_percentage) : 0
      const progressToRestore = cachedProgress !== null ? cachedProgress : serverProgress
      
      if (progressToRestore > 0) {
        const targetScroll = (progressToRestore / 100) * scrollHeight
        
        setTimeout(() => {
          element.scrollTo({ top: targetScroll, behavior: 'smooth' })
        }, 100)
      }
    }
  }, [chapterData.bookmark, chapterData.id])

  // Apply reading preferences to document
  useEffect(() => {
    if (!preferences) return

    const root = document.documentElement
    root.style.setProperty('--reading-font-family', preferences.font_family)
    root.style.setProperty('--reading-font-size', `${preferences.font_size}px`)
    root.style.setProperty('--reading-line-height', preferences.line_height.toString())
    root.style.setProperty('--reading-bg-color', preferences.background_color)
    root.style.setProperty('--reading-text-color', preferences.text_color)
    root.style.setProperty('--reading-page-width', `${preferences.page_width}px`)
    root.style.setProperty('--reading-brightness', `${preferences.brightness}%`)
    
    if (preferences.wallpaper_url) {
      root.style.setProperty('--reading-wallpaper', `url(${preferences.wallpaper_url})`)
    } else {
      root.style.removeProperty('--reading-wallpaper')
    }

    // Force re-render by updating a data attribute
    document.body.setAttribute('data-reading-theme', preferences.theme_preset)
  }, [preferences])

  // Debounced preference updates to prevent multiple toasts
  const preferenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const handlePreferenceChange = (key: string | Record<string, any>, value?: any) => {
    // Clear existing timeout
    if (preferenceTimeoutRef.current) {
      clearTimeout(preferenceTimeoutRef.current)
    }

    if (typeof key === 'object') {
      // Handle multiple updates at once - update immediately without toast
      updatePreferences(key, false)
      
      // Show single toast after delay
      preferenceTimeoutRef.current = setTimeout(() => {
        toast.success('Reading preferences updated')
      }, 500)
    } else {
      // Handle single update - update immediately without toast
      updatePreferences({ [key]: value }, false)
      
      // Show single toast after delay
      preferenceTimeoutRef.current = setTimeout(() => {
        toast.success('Reading preferences updated')
      }, 500)
    }
  }

  return (
    <div className="reading-interface min-h-screen relative w-full">
      {/* Background with wallpaper support */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: preferences?.background_color || '#ffffff',
          backgroundImage: preferences?.wallpaper_url ? `url(${preferences.wallpaper_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: `brightness(${preferences?.brightness || 100}%)`
        }}
      />
      
      {/* Reading area background overlay */}
      <div 
        className="fixed inset-0 -z-5"
        style={{
          backgroundColor: preferences?.background_color || '#ffffff',
          opacity: preferences?.wallpaper_url ? 0.9 : 1,
        }}
      />
      
      {/* Header */}
      <ReadingHeader
        chapterData={chapterData}
        scrollProgress={scrollProgress}
        onSettingsClick={() => setShowSettings(true)}
        onTOCClick={() => setShowTOC(true)}
        isSavingBookmark={isSavingBookmark}
      />

      {/* Main content area */}
      <div 
        ref={contentRef}
        className="reading-content-container overflow-y-auto flex justify-center"
        style={{ 
          height: 'calc(100vh - 64px)', // Account for header height
          paddingTop: '2rem',
          paddingBottom: '4rem'
        }}
      >
        <div className="w-full flex justify-center">
          <ReadingContent 
            chapterData={chapterData}
            preferences={preferences}
          />
        </div>
      </div>

      {/* Navigation controls */}
      <ReadingControls
        chapterData={chapterData}
        navigation={navigation}
      />

      {/* Settings panel */}
      {showSettings && (
        <ReadingSettings
          preferences={preferences}
          onPreferenceChange={handlePreferenceChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Table of contents */}
      {showTOC && navigation && (
        <TableOfContents
          navigation={navigation}
          currentChapterId={chapterData.id}
          onClose={() => setShowTOC(false)}
        />
      )}
    </div>
  )
}