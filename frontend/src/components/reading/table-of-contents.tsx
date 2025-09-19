'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookOpen, X, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BookNavigationResponse } from '../../types/reading'

interface TableOfContentsProps {
  navigation: BookNavigationResponse
  currentChapterId: string
  onClose: () => void
}

export function TableOfContents({ navigation, currentChapterId, onClose }: TableOfContentsProps) {
  const router = useRouter()

  const handleChapterClick = (chapterId: string) => {
    router.push(`/reading/${navigation.book_id}/${chapterId}`)
    onClose()
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full sm:w-96">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Table of Contents
            </SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="sm" onClick={onClose}>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="mt-6">
          {/* Book title */}
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              {navigation.book_title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {navigation.chapters.length} chapters
            </p>
          </div>

          {/* Chapter list */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2">
              {navigation.chapters.map((chapter) => {
                const isCurrent = chapter.id === currentChapterId
                const isPublished = chapter.is_published

                return (
                  <Button
                    key={chapter.id}
                    variant={isCurrent ? "default" : "ghost"}
                    className={`w-full justify-start h-auto p-4 ${!isPublished ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    onClick={() => isPublished && handleChapterClick(chapter.id)}
                    disabled={!isPublished}
                  >
                    <div className="flex items-start space-x-3 w-full">
                      {/* Chapter number */}
                      <div className="flex-shrink-0">
                        <Badge
                          variant={isCurrent ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {chapter.chapter_number}
                        </Badge>
                      </div>

                      {/* Chapter info */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {chapter.title}
                          </h4>
                          {isCurrent && (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                          {isPublished ? (
                            <Badge variant="outline" className="text-xs">
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}