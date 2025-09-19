'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ChapterReadingResponse, BookNavigationResponse } from '../../types/reading'

interface ReadingControlsProps {
  chapterData: ChapterReadingResponse
  navigation?: BookNavigationResponse
}

export function ReadingControls({ chapterData, navigation }: ReadingControlsProps) {
  const router = useRouter()

  const handlePrevious = () => {
    if (chapterData.previous_chapter) {
      router.push(`/reading/${chapterData.book_id}/${chapterData.previous_chapter.id}`)
    }
  }

  const handleNext = () => {
    if (chapterData.next_chapter) {
      router.push(`/reading/${chapterData.book_id}/${chapterData.next_chapter.id}`)
    }
  }

  const handleHome = () => {
    router.push('/dashboard')
  }

  return (
    <div className="reading-controls fixed bottom-0 left-0 right-0 z-40">
      {/* Mobile controls */}
      <div className="sm:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={!chapterData.previous_chapter}
            className="flex-1 mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleHome}
            className="mx-2 px-3"
          >
            <Home className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={!chapterData.next_chapter}
            className="flex-1 ml-2"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Desktop controls - floating buttons */}
      <div className="hidden sm:block">
        {/* Previous chapter button */}
        {chapterData.previous_chapter && (
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Next chapter button */}
        {chapterData.next_chapter && (
          <Button
            variant="outline"
            size="lg"
            onClick={handleNext}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        {/* Home button */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleHome}
          className="fixed bottom-4 right-4 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg"
        >
          <Home className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}