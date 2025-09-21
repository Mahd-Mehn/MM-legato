'use client'

import { ChapterReadingResponse, ReadingPreferences } from '../../types/reading'
import { Badge } from '@/components/ui/badge'
import { CommentSection } from '@/components/community'
import { Clock, BookOpen } from 'lucide-react'

interface ReadingContentProps {
  chapterData: ChapterReadingResponse
  preferences?: ReadingPreferences
}

export function ReadingContent({ chapterData, preferences }: ReadingContentProps) {
  const contentStyle = {
    fontFamily: preferences?.font_family === 'serif' ? 'Georgia, serif' : 
                preferences?.font_family === 'sans-serif' ? 'system-ui, sans-serif' :
                preferences?.font_family === 'monospace' ? 'Monaco, monospace' : 'Georgia, serif',
    fontSize: `${preferences?.font_size || 16}px`,
    lineHeight: preferences?.line_height || 1.6,
    color: preferences?.text_color || '#000000',
    maxWidth: `${preferences?.page_width || 800}px`,
  }

  return (
    <div 
      className="reading-content px-4 sm:px-6 lg:px-8"
      style={{ 
        width: '100%',
        maxWidth: `${preferences?.page_width || 800}px`,
      }}
    >
      {/* Chapter header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Badge variant="outline" className="text-xs">
            Chapter {chapterData.chapter_number}
          </Badge>
          {chapterData.reading_time_minutes && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {chapterData.reading_time_minutes} min read
            </Badge>
          )}
          {chapterData.word_count && (
            <Badge variant="outline" className="text-xs">
              <BookOpen className="h-3 w-3 mr-1" />
              {chapterData.word_count.toLocaleString()} words
            </Badge>
          )}
        </div>
        
        <h1 
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ 
            color: preferences?.text_color || '#000000',
            fontFamily: contentStyle.fontFamily
          }}
        >
          {chapterData.title}
        </h1>
        
        <p className="text-sm text-slate-600 dark:text-slate-400">
          From "{chapterData.book_title}" by {chapterData.book_author}
        </p>
      </div>

      {/* Chapter content */}
      <div 
        className="reading-text"
        style={{
          ...contentStyle,
          width: '100%',
        }}
      >
        {/* Split content into paragraphs and render with proper spacing */}
        {chapterData.content.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-6" style={{ textAlign: 'left' }}>
            {paragraph.trim()}
          </p>
        ))}
      </div>

      {/* Chapter footer with navigation hints */}
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
          <div>
            {chapterData.previous_chapter && (
              <span>← Previous: {chapterData.previous_chapter.title}</span>
            )}
          </div>
          <div>
            {chapterData.next_chapter && (
              <span>Next: {chapterData.next_chapter.title} →</span>
            )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-8">
        <CommentSection chapterId={chapterData.id} />
      </div>
    </div>
  )
}