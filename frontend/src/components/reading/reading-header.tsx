'use client'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Settings,
  List,
  Bookmark,
  Share,
  MoreVertical,
  Volume2,
  VolumeX,
  Loader2,
  Languages
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ChapterReadingResponse } from '../../types/reading'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ReadingHeaderProps {
  chapterData: ChapterReadingResponse
  scrollProgress: number
  onSettingsClick: () => void
  onTOCClick: () => void
  isSavingBookmark?: boolean
  onGenerateAudio?: () => void
  onToggleAudio?: () => void
  hasAudio?: boolean
  isGeneratingAudio?: boolean
}

export function ReadingHeader({
  chapterData,
  scrollProgress,
  onSettingsClick,
  onTOCClick,
  isSavingBookmark = false,
  onGenerateAudio,
  onToggleAudio,
  hasAudio = false,
  isGeneratingAudio = false
}: ReadingHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push(`/dashboard/explore/${chapterData.book_id}`)
  }

  const handleBookmark = () => {
    // Bookmark functionality is handled automatically in the main interface
    // This could show a toast or visual feedback
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${chapterData.book_title} - ${chapterData.title}`,
        text: `Reading "${chapterData.title}" from "${chapterData.book_title}" by ${chapterData.book_author}`,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <header className="reading-header fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left section */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="hidden sm:block">
            <h1 className="font-semibold text-slate-900 dark:text-white text-sm truncate max-w-[200px]">
              {chapterData.title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
              {chapterData.book_title} • {chapterData.book_author}
            </p>
          </div>
        </div>

        {/* Center section - Progress bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-600 dark:text-slate-400 min-w-[3rem]">
              {Math.round(scrollProgress)}%
            </span>
            <Progress
              value={scrollProgress}
              className="flex-1 h-2"
            />
            <div className="flex items-center space-x-1">
              {isSavingBookmark && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Saving bookmark..." />
              )}
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {chapterData.reading_time_minutes}min
              </span>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Audio controls */}
          {hasAudio ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAudio}
              className="p-2"
              title="Toggle audio player"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerateAudio}
              disabled={isGeneratingAudio}
              className="p-2"
              title="Generate audio"
            >
              {isGeneratingAudio ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onTOCClick}
            className="p-2"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="p-2"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleBookmark}>
                <Bookmark className="h-4 w-4 mr-2" />
                Bookmark Position
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share Chapter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}