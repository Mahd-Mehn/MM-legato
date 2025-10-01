'use client'

import { useState } from 'react'
import { Heart, Flag, MoreHorizontal, Star, AlertTriangle, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Review } from '@/types/review'
import { useLikeReview, useDeleteReview } from '@/hooks/useReviews'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'

interface ReviewItemProps {
  review: Review
  onEdit?: (review: Review) => void
  onReport?: (review: Review) => void
}

export function ReviewItem({ review, onEdit, onReport }: ReviewItemProps) {
  const { data: session } = useSession()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSpoiler, setShowSpoiler] = useState(false)
  
  const likeReview = useLikeReview()
  const deleteReview = useDeleteReview()
  
  const isOwnReview = session?.user?.id === review.user_id
  const canEdit = isOwnReview && onEdit
  const canDelete = isOwnReview
  const canReport = !isOwnReview && onReport

  const handleLike = () => {
    likeReview.mutate(review.id)
  }

  const handleDelete = () => {
    deleteReview.mutate(review.id)
    setShowDeleteDialog(false)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-slate-300 dark:text-slate-600'
        }`}
      />
    ))
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.user_profile_picture || ''} />
              <AvatarFallback>
                {review.user_username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900 dark:text-white">
                  {review.user_username || 'Anonymous'}
                </span>
                {review.is_author_review && (
                  <Badge variant="secondary" className="text-xs">
                    Author
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {(canEdit || canDelete || canReport) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit?.(review)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Review
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Review
                  </DropdownMenuItem>
                )}
                {canReport && (
                  <DropdownMenuItem onClick={() => onReport?.(review)}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report Review
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
            {review.title}
          </h4>
          
          {review.is_spoiler && !showSpoiler ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Spoiler Warning
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                This review contains spoilers. Click to reveal.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSpoiler(true)}
                className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-900/30"
              >
                Show Spoiler
              </Button>
            </div>
          ) : (
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {review.content}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeReview.isPending}
            className={`flex items-center gap-2 ${
              review.is_liked_by_current_user 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Heart 
              className={`h-4 w-4 ${
                review.is_liked_by_current_user ? 'fill-current' : ''
              }`} 
            />
            <span>{review.like_count}</span>
          </Button>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}