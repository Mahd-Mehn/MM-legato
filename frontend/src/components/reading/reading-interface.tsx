'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ReadingHeader } from './reading-header'
import { ReadingContent } from './reading-content'
import { ReadingControls } from './reading-controls'
import { ReadingSettings } from './reading-settings'
import { TableOfContents } from './table-of-contents'
import { AudioPlayer } from './audio-player'
import { TextSelectionHandler } from './text-selection-handler'
import { TranslationDialog } from './translation-dialog'
import { QuoteDialog } from './quote-dialog'
import { useReadingPreferences, useBookNavigation, useBookmark } from '../../hooks/useReading'
import { useReadingProgress } from '../../hooks/useReadingProgress'
import { useAdvancedReading } from '../../hooks/useAdvancedReading'
import { useReadingMutations } from '../../hooks/useMutations'
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
  
  // Advanced reading features state
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)
  const [chapterAudio, setChapterAudio] = useState<any>(null)
  const [showTranslationDialog, setShowTranslationDialog] = useState(false)
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)
  const [selectedTextForAction, setSelectedTextForAction] = useState('')
  
  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { data: preferences, updatePreferences } = useReadingPreferences()
  const { data: navigation } = useBookNavigation(chapterData.book_id)
  const { createBookmark } = useBookmark()
  const { updateReadingProgress, createBookmark: createBookmarkMutation } = useReadingMutations()
  const {
    generateAudio,
    getChapterAudio,
    translateChapter,
    translateText,
    generateQuote,
    isLoading: isAdvancedLoading
  } = useAdvancedReading()

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
      
      // Save bookmark using mutation
      createBookmarkMutation.mutate({
        chapterId: chapterData.id,
        position: progress
      })
      
      // Update reading progress for continue reading functionality
      updateReadingProgress.mutate({
        chapterId: chapterData.id,
        position: progress,
        percentage: progress
      })
      
      setLastSavedProgress(progress)
      // Hide saving indicator after a short delay
      setTimeout(() => setIsSavingBookmark(false), 1000)
    }, 3000) // Wait 3 seconds after user stops scrolling
  }, [chapterData.id, chapterData.book_id, createBookmark, lastSavedProgress, createBookmarkMutation, updateReadingProgress])

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

  // Load existing audio when component mounts (only once per chapter)
  useEffect(() => {
    let isMounted = true
    
    const loadChapterAudio = async () => {
      try {
        const audioData = await getChapterAudio(chapterData.id)
        if (audioData && isMounted) {
          setChapterAudio(audioData)
        }
      } catch (error) {
        console.error('Failed to load chapter audio:', error)
      }
    }

    // Reset audio state when chapter changes
    setChapterAudio(null)
    setShowAudioPlayer(false)
    
    // Load audio data for new chapter
    loadChapterAudio()
    
    return () => {
      isMounted = false
    }
  }, [chapterData.id]) // Only depend on chapter ID

  // Advanced reading feature handlers
  const handleGenerateAudio = async () => {
    try {
      toast.loading('Generating audio...', { id: 'audio-generation' })
      const audioData = await generateAudio(chapterData.id)
      setChapterAudio(audioData)
      setShowAudioPlayer(true)
      toast.success('Audio generated successfully', { id: 'audio-generation' })
    } catch (error) {
      toast.error('Failed to generate audio', { id: 'audio-generation' })
    }
  }

  const handleToggleAudio = async () => {
    if (!chapterAudio) {
      // Try to load audio first
      try {
        const audioData = await getChapterAudio(chapterData.id)
        if (audioData) {
          setChapterAudio(audioData)
          setShowAudioPlayer(true)
        }
      } catch (error) {
        console.error('Failed to load audio:', error)
      }
    } else {
      setShowAudioPlayer(!showAudioPlayer)
    }
  }

  const handleTextSelection = (selectedText: string) => {
    setSelectedTextForAction(selectedText)
    setShowQuoteDialog(true)
  }

  const handleTranslateSelection = (selectedText: string) => {
    setSelectedTextForAction(selectedText)
    setShowTranslationDialog(true)
  }

  const handleTranslateChapter = async (language: string) => {
    return await translateChapter(chapterData.id, language)
  }

  const handleTranslateText = async (text: string, language: string) => {
    return await translateText(text, language)
  }

  const handleGenerateQuote = async (quoteData: any) => {
    return await generateQuote({
      ...quoteData,
      chapter_id: chapterData.id
    })
  }

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

  // Handle scrolling to comments from notification links
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.startsWith('#comment-')) {
      let attempts = 0
      const maxAttempts = 10
      
      const scrollToComment = () => {
        const commentElement = document.querySelector(hash)
        if (commentElement) {
          // Scroll to the comment with some offset for the header
          commentElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
          
          // Add a highlight effect to the comment
          commentElement.classList.add('highlight-comment')
          setTimeout(() => {
            commentElement.classList.remove('highlight-comment')
          }, 3000)
          
          return true // Success
        } else {
          attempts++
          if (attempts < maxAttempts) {
            // Try again with increasing delay
            setTimeout(scrollToComment, 500 * attempts)
          }
          return false
        }
      }
      
      // Start trying to scroll after initial render
      setTimeout(scrollToComment, 100)
      
      // Also listen for DOM changes in case comments load later
      const observer = new MutationObserver(() => {
        if (scrollToComment()) {
          observer.disconnect()
        }
      })
      
      // Observe the document for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
      
      // Clean up observer after max attempts
      setTimeout(() => {
        observer.disconnect()
      }, 15000) // 15 seconds max
    }
  }, [])

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
        onGenerateAudio={handleGenerateAudio}
        onToggleAudio={handleToggleAudio}
        hasAudio={!!chapterAudio}
        isGeneratingAudio={isAdvancedLoading}
      />

      {/* Audio Player */}
      {showAudioPlayer && chapterAudio && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4">
          <AudioPlayer
            audioUrl={chapterAudio.audio_url}
            className="shadow-lg"
          />
        </div>
      )}

      {/* Main content area */}
      <div 
        ref={contentRef}
        className="reading-content-container overflow-y-auto flex justify-center"
        style={{ 
          height: 'calc(100vh - 64px)', // Account for header height
          paddingTop: showAudioPlayer && chapterAudio ? '10rem' : '2rem',
          paddingBottom: '4rem'
        }}
      >
        <div className="w-full flex justify-center">
          <TextSelectionHandler
            onGenerateQuote={handleTextSelection}
            onTranslateText={handleTranslateSelection}
          >
            <ReadingContent 
              chapterData={chapterData}
              preferences={preferences}
            />
          </TextSelectionHandler>
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

      {/* Translation Dialog */}
      <TranslationDialog
        open={showTranslationDialog}
        onOpenChange={setShowTranslationDialog}
        selectedText={selectedTextForAction}
        chapterId={chapterData.id}
        onTranslateChapter={handleTranslateChapter}
        onTranslateText={handleTranslateText}
      />

      {/* Quote Generation Dialog */}
      <QuoteDialog
        open={showQuoteDialog}
        onOpenChange={setShowQuoteDialog}
        selectedText={selectedTextForAction}
        chapterId={chapterData.id}
        onGenerateQuote={handleGenerateQuote}
      />
    </div>
  )
}