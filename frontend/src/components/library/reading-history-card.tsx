'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Plus, Check } from 'lucide-react'
import { ReadingHistoryBook } from '@/hooks/useLibrary'
import { useAddToLibrary } from '@/hooks/useLibrary'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface ReadingHistoryCardProps {
  book: ReadingHistoryBook
}

export function ReadingHistoryCard({ book }: ReadingHistoryCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const addToLibrary = useAddToLibrary()

  const handleAddToLibrary = async () => {
    setIsLoading(true)
    try {
      await addToLibrary.mutateAsync(book.book_id)
      toast.success('Book added to library')
    } catch (error) {
      toast.error('Failed to add book to library')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex space-x-4">
          {/* Book Cover */}
          <div className="relative w-16 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            {book.book_cover_image_url ? (
              <Image
                src={book.book_cover_image_url}
                alt={book.book_title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-6 w-6 text-slate-400" />
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <Link 
              href={`/dashboard/explore/${book.book_id}`}
              className="block"
            >
              <h3 className="font-semibold text-sm line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {book.book_title}
              </h3>
            </Link>
            
            <p className="text-xs text-slate-600 dark:text-slate-400">
              by {book.author_username}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {book.genre && (
                  <Badge variant="outline" className="text-xs">
                    {book.genre}
                  </Badge>
                )}
                
                {book.is_in_library ? (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Check className="h-3 w-3 mr-1" />
                    In Library
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddToLibrary}
                    disabled={isLoading}
                    className="h-6 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add to Library
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDistanceToNow(new Date(book.last_accessed), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}