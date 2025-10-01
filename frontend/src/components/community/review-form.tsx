'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Review, ReviewCreate, ReviewUpdate } from '@/types/review'
import { useCreateReview, useUpdateReview } from '@/hooks/useReviews'

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  content: z.string().min(10, 'Review must be at least 10 characters long'),
  is_spoiler: z.boolean().default(false)
})

type ReviewFormData = z.infer<typeof reviewSchema>

interface ReviewFormProps {
  bookId: string
  existingReview?: Review
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReviewForm({ bookId, existingReview, onSuccess, onCancel }: ReviewFormProps) {
  const [hoveredRating, setHoveredRating] = useState(0)
  
  const createReview = useCreateReview()
  const updateReview = useUpdateReview()
  
  const isEditing = !!existingReview
  
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating || 0,
      title: existingReview?.title || '',
      content: existingReview?.content || '',
      is_spoiler: existingReview?.is_spoiler || false
    }
  })

  const watchedRating = form.watch('rating')

  const onSubmit = async (data: ReviewFormData) => {
    try {
      if (isEditing && existingReview) {
        await updateReview.mutateAsync({
          reviewId: existingReview.id,
          reviewData: data
        })
      } else {
        await createReview.mutateAsync({
          book_id: bookId,
          ...data
        })
      }
      onSuccess?.()
    } catch (error) {
      // Error handling is done in the hooks
    }
  }

  const handleRatingClick = (rating: number) => {
    form.setValue('rating', rating, { shouldValidate: true })
  }

  const renderStars = () => {
    const rating = hoveredRating || watchedRating
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => handleRatingClick(i + 1)}
        onMouseEnter={() => setHoveredRating(i + 1)}
        onMouseLeave={() => setHoveredRating(0)}
        className="p-1 hover:scale-110 transition-transform"
      >
        <Star
          className={`h-6 w-6 ${
            i < rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-slate-300 dark:text-slate-600 hover:text-yellow-300'
          }`}
        />
      </button>
    ))
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          {isEditing ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Share your thoughts about this book with other readers.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Rating */}
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating *</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-1">
                    {renderStars()}
                    {watchedRating > 0 && (
                      <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                        {watchedRating} star{watchedRating !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review Title *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Summarize your review in a few words..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Content */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review Content *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Share your detailed thoughts about the book..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Minimum 10 characters required
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Spoiler Warning */}
          <FormField
            control={form.control}
            name="is_spoiler"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    This review contains spoilers
                  </FormLabel>
                  <FormDescription>
                    Check this if your review reveals important plot points or story details
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={createReview.isPending || updateReview.isPending}
              className="min-w-[120px]"
            >
              {createReview.isPending || updateReview.isPending 
                ? 'Saving...' 
                : isEditing 
                  ? 'Update Review' 
                  : 'Post Review'
              }
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={createReview.isPending || updateReview.isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </Card>
  )
}