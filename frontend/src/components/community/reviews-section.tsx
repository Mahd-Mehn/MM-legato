'use client'

import { useState } from 'react'
import { Star, MessageSquare, Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ReviewItem } from './review-item'
import { ReviewForm } from './review-form'
import { useBookReviews, useReviewPermissions } from '@/hooks/useReviews'
import { Review } from '@/types/review'
import { useSession } from 'next-auth/react'

interface ReviewsSectionProps {
  bookId: string
}

export function ReviewsSection({ bookId }: ReviewsSectionProps) {
  const { data: session } = useSession()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  
  const { data: reviewsData, isLoading, error } = useBookReviews(bookId)
  const { data: permissions } = useReviewPermissions(bookId)

  const canWriteReview = permissions?.can_review && session?.user
  const hasStartedReading = permissions?.has_started_reading
  const hasExistingReview = permissions?.has_existing_review

  const handleEditReview = (review: Review) => {
    setEditingReview(review)
    setShowReviewForm(true)
  }

  const handleReviewSuccess = () => {
    setShowReviewForm(false)
    setEditingReview(null)
  }

  const handleCancelReview = () => {
    setShowReviewForm(false)
    setEditingReview(null)
  }

  const renderRatingDistribution = () => {
    if (!reviewsData?.rating_distribution) return null

    const total = reviewsData.total_count
    if (total === 0) return null

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviewsData.rating_distribution[rating] || 0
          const percentage = total > 0 ? (count / total) * 100 : 0
          
          return (
            <div key={rating} className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 w-12">
                <span>{rating}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-slate-500 dark:text-slate-400 w-8 text-right">
                {count}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  const sortedReviews = reviewsData?.reviews ? [...reviewsData.reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'highest':
        return b.rating - a.rating
      case 'lowest':
        return a.rating - b.rating
      default:
        return 0
    }
  }) : []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-16 w-full" />
              </Card>
            ))}
          </div>
          <div>
            <Card className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-2 flex-1" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="font-medium text-slate-900 dark:text-white mb-2">
          Failed to load reviews
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          There was an error loading the reviews. Please try again later.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Reviews
          </h2>
          {reviewsData && (
            <Badge variant="secondary">
              {reviewsData.total_count} review{reviewsData.total_count !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {canWriteReview && !showReviewForm && (
          <Button onClick={() => setShowReviewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Write Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          bookId={bookId}
          existingReview={editingReview || undefined}
          onSuccess={handleReviewSuccess}
          onCancel={handleCancelReview}
        />
      )}

      {/* Cannot Review Message */}
      {session?.user && !canWriteReview && !hasExistingReview && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {!hasStartedReading 
                  ? "Start reading to write a review" 
                  : "You've already reviewed this book"
                }
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {!hasStartedReading 
                  ? "You need to start reading this book before you can write a review."
                  : "You can edit your existing review using the menu options."
                }
              </p>
            </div>
          </div>
        </Card>
      )}

      {reviewsData && reviewsData.total_count > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sort Controls */}
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest">Highest Rated</SelectItem>
                  <SelectItem value="lowest">Lowest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reviews */}
            <div className="space-y-4">
              {sortedReviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  onEdit={handleEditReview}
                />
              ))}
            </div>
          </div>

          {/* Rating Summary */}
          <div className="space-y-6">
            {/* Overall Rating */}
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Overall Rating
              </h3>
              
              {reviewsData.average_rating ? (
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    {reviewsData.average_rating}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(reviewsData.average_rating!) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Based on {reviewsData.total_count} review{reviewsData.total_count !== 1 ? 's' : ''}
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-500 dark:text-slate-400">
                    No ratings yet
                  </p>
                </div>
              )}

              {/* Rating Distribution */}
              {renderRatingDistribution()}
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-medium text-slate-900 dark:text-white mb-2">
            No reviews yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Be the first to share your thoughts about this book!
          </p>
        </Card>
      )}
    </div>
  )
}