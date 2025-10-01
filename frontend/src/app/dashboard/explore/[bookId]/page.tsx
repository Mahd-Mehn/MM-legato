'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Clock, Coins, Play, Star, User, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBook } from '@/hooks/useBooks'
import { Skeleton } from '@/components/ui/skeleton'
import { AddToLibraryButton } from '@/components/library/add-to-library-button'
import { ReviewsSection } from '@/components/community/reviews-section'

export default function BookDetailPage() {
  const params = useParams()
  const bookId = params.bookId as string
  const [activeTab, setActiveTab] = useState('overview')
  
  const { book, loading, error } = useBook(bookId, true)

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-32" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Skeleton className="aspect-[3/4] w-full" />
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || 'Book not found'}
          </p>
          <Link href="/dashboard/explore">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explore
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const getPrice = () => {
    if (book.pricing_model === 'free') return 'Free'
    if (book.pricing_model === 'fixed') return `${book.fixed_price} coins`
    if (book.pricing_model === 'per_chapter') return `${book.per_chapter_price} coins per chapter`
    return 'Price not set'
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/explore">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Explore
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Book Cover */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="aspect-[3/4] bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden mb-4">
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-slate-400" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <AddToLibraryButton 
                bookId={bookId} 
                className="w-full" 
                size="lg" 
              />
              
              {book.pricing_model !== 'free' && (
                <Button variant="outline" className="w-full" size="lg">
                  <Coins className="h-4 w-4 mr-2" />
                  Purchase - {getPrice()}
                </Button>
              )}
              
              {book.chapters && book.chapters.length > 0 && (
                <Link href={`/reading/${bookId}/${book.chapters.find(c => c.is_published)?.id || book.chapters[0].id}`}>
                  <Button variant="outline" className="w-full" size="lg">
                    <Play className="h-4 w-4 mr-2" />
                    Start Reading
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Book Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Author */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {book.title}
            </h1>
            <div className="flex items-center gap-2 text-lg text-slate-600 dark:text-slate-300 mb-4">
              <User className="h-5 w-5" />
              <span>by {book.author?.username || 'Unknown Author'}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{book.chapter_count || 0} chapters</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{book.total_word_count?.toLocaleString() || 0} words</span>
              </div>
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4" />
                <span>{getPrice()}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Genre and Tags */}
              {(book.genre || (book.tags && book.tags.length > 0)) && (
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Genre & Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {book.genre && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm rounded-full">
                        {book.genre}
                      </span>
                    )}
                    {book.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {book.description && (
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Description
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}

              {/* Chapters List */}
              {book.chapters && book.chapters.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                    Chapters ({book.chapters.length})
                  </h3>
                  <div className="space-y-2">
                    {book.chapters
                      .sort((a, b) => a.chapter_number - b.chapter_number)
                      .map((chapter) => (
                        <Card key={chapter.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 dark:text-white">
                                Chapter {chapter.chapter_number}: {chapter.title}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                <span>{chapter.word_count?.toLocaleString() || 0} words</span>
                                {chapter.is_published ? (
                                  <span className="text-green-600 dark:text-green-400">Published</span>
                                ) : (
                                  <span className="text-yellow-600 dark:text-yellow-400">Draft</span>
                                )}
                              </div>
                            </div>
                            
                            {chapter.is_published && (
                              <div className="flex items-center gap-2">
                                {book.pricing_model === 'per_chapter' && (
                                  <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {book.per_chapter_price} coins
                                  </span>
                                )}
                                <Link href={`/reading/${bookId}/${chapter.id}`}>
                                  <Button size="sm" variant="outline">
                                    Read
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {/* No Chapters Message */}
              {(!book.chapters || book.chapters.length === 0) && (
                <Card className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                    No chapters available yet
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    The author hasn't published any chapters for this book yet.
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <ReviewsSection bookId={bookId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}