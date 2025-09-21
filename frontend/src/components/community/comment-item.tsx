'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Comment } from '@/types/comment'
import { useDeleteComment, useLikeComment, useReportComment, useUpdateComment } from '@/hooks/useComments'
import { CommentForm } from './comment-form'
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Flag,
  Crown,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentItemProps {
  comment: Comment
  depth?: number
  maxDepth?: number
}

export function CommentItem({ comment, depth = 0, maxDepth = 3 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [editContent, setEditContent] = useState(comment.content)

  const likeComment = useLikeComment()
  const deleteComment = useDeleteComment()
  const updateComment = useUpdateComment()
  const reportComment = useReportComment()

  const handleLike = () => {
    likeComment.mutate(comment.id)
  }

  const handleDelete = () => {
    deleteComment.mutate(comment.id)
    setShowDeleteDialog(false)
  }

  const handleEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      updateComment.mutate({ 
        commentId: comment.id, 
        content: editContent.trim() 
      })
    }
    setShowEditForm(false)
  }

  const handleReport = () => {
    if (reportReason.trim()) {
      reportComment.mutate({ 
        commentId: comment.id, 
        reason: reportReason.trim() 
      })
      setShowReportDialog(false)
      setReportReason('')
    }
  }

  const canShowReplies = depth < maxDepth
  const hasReplies = comment.replies && comment.replies.length > 0

  return (
    <div className={cn(
      "space-y-3",
      depth > 0 && "ml-6 pl-4 border-l-2 border-slate-200 dark:border-slate-700"
    )}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author.profile_picture_url} />
          <AvatarFallback>
            {comment.author.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          {/* Comment Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-slate-900 dark:text-white">
              {comment.author.username}
            </span>
            
            {comment.author.is_book_author && (
              <Badge variant="default" className="text-xs bg-purple-600 hover:bg-purple-700">
                <Crown className="h-3 w-3 mr-1" />
                Author
              </Badge>
            )}
            
            {comment.author.is_writer && !comment.author.is_book_author && (
              <Badge variant="secondary" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Writer
              </Badge>
            )}
            
            {comment.is_liked_by_author && (
              <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                ❤️ Liked by Author
              </Badge>
            )}
            
            <span className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {comment.can_delete && (
                  <>
                    <DropdownMenuItem onClick={() => setShowEditForm(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                {!comment.can_delete && (
                  <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Comment Content */}
          {showEditForm ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleEdit}
                  disabled={updateComment.isPending || !editContent.trim()}
                >
                  {updateComment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditForm(false)
                    setEditContent(comment.content)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          {/* Comment Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likeComment.isPending}
              className={cn(
                "h-8 px-2 text-xs",
                comment.is_liked_by_user && "text-red-500"
              )}
            >
              <Heart className={cn(
                "h-4 w-4 mr-1",
                comment.is_liked_by_user && "fill-current"
              )} />
              {comment.like_count}
            </Button>

            {canShowReplies && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="h-8 px-2 text-xs"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && canShowReplies && (
            <div className="mt-3">
              <CommentForm
                chapterId={comment.chapter_id}
                parentId={comment.id}
                placeholder="Write a reply..."
                onSuccess={() => setShowReplyForm(false)}
                onCancel={() => setShowReplyForm(false)}
                showCancel
              />
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {hasReplies && canShowReplies && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
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

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Comment</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting this comment.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for reporting..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReportDialog(false)
                setReportReason('')
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReport}
              disabled={reportComment.isPending || !reportReason.trim()}
            >
              {reportComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}