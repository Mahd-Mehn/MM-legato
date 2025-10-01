'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useComments, useCommentCount } from '@/hooks/useComments'
import { useCommentMutations } from '@/hooks/useMutations'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'
import { Comment } from '@/types/comment'
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentSectionProps {
  chapterId: string
  className?: string
}

export function CommentSection({ chapterId, className }: CommentSectionProps) {
  // Check if URL has comment hash to auto-expand
  const hasCommentHash = typeof window !== 'undefined' && window.location.hash.startsWith('#comment-')
  const [isExpanded, setIsExpanded] = useState(hasCommentHash)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [isCommentSectionVisible, setIsCommentSectionVisible] = useState(true)
  
  const { data: comments, isLoading, error } = useComments(chapterId)
  const { data: commentCountData } = useCommentCount(chapterId)
  const { createComment, likeComment, deleteComment } = useCommentMutations()
  
  const commentCount = commentCountData?.comment_count || 0
  const hasComments = comments && comments.length > 0

  // Auto-expand when there's a comment hash in URL
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#comment-') && commentCount > 3) {
      setIsExpanded(true)
    }
  }, [commentCount])

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-slate-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Failed to load comments</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("transition-all duration-200", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle 
            className="flex items-center gap-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            onClick={() => setIsCommentSectionVisible(!isCommentSectionVisible)}
          >
            <MessageCircle className="h-5 w-5" />
            Comments
            {commentCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {commentCount}
              </Badge>
            )}
            {isCommentSectionVisible ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </CardTitle>
          
          {isCommentSectionVisible && hasComments && commentCount > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expand All
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      {isCommentSectionVisible && (
        <CardContent className="space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Comment Form */}
          <div className="space-y-3">
            {!showCommentForm ? (
              <Button
                variant="outline"
                onClick={() => setShowCommentForm(true)}
                className="w-full justify-start text-slate-600"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Write a comment...
              </Button>
            ) : (
              <CommentForm
                chapterId={chapterId}
                onSuccess={() => setShowCommentForm(false)}
                onCancel={() => setShowCommentForm(false)}
                showCancel
              />
            )}
          </div>

          <Separator />

          {/* Comments List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4" />
                    <div className="h-16 bg-slate-200 rounded animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-slate-200 rounded animate-pulse w-16" />
                      <div className="h-6 bg-slate-200 rounded animate-pulse w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : hasComments ? (
            <div className="space-y-6">
              <div className={cn(
                "transition-all duration-300 ease-in-out",
                !isExpanded && hasComments && commentCount > 3 && "max-h-96 overflow-hidden relative"
              )}>
                {comments.map((comment: Comment) => (
                  <div key={comment.id} className="mb-6">
                    <CommentItem comment={comment} />
                  </div>
                ))}
                
                {!isExpanded && hasComments && commentCount > 3 && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-slate-900 via-white/80 dark:via-slate-900/80 to-transparent pointer-events-none" />
                )}
              </div>
              
              {!isExpanded && hasComments && commentCount > 3 && (
                <div className="text-center -mt-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsExpanded(true)}
                    className="bg-white dark:bg-slate-900 shadow-sm"
                  >
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show all {commentCount} comments
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium mb-1">No comments yet</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          )}
        </CardContent>
      )}
      
      {!isCommentSectionVisible && (
        <CardContent className="py-2">
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            {hasComments ? (
              <span>Click to view {commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
            ) : (
              <span>Click to add a comment</span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}