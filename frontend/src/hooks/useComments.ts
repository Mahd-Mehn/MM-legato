import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { commentAPI } from '@/lib/api'
import { Comment, CommentCreateRequest, CommentLikeResponse } from '@/types/comment'
import { toast } from 'sonner'

export function useComments(chapterId: string) {
  return useQuery({
    queryKey: ['comments', chapterId],
    queryFn: () => commentAPI.getChapterComments(chapterId),
    enabled: !!chapterId,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: commentAPI.createComment,
    onSuccess: (newComment: Comment) => {
      // Update the comments cache
      queryClient.setQueryData(['comments', newComment.chapter_id], (oldData: Comment[] | undefined) => {
        if (!oldData) return [newComment]
        
        // If it's a reply, we need to update the parent comment's replies
        if (newComment.parent_id) {
          return oldData.map(comment => {
            if (comment.id === newComment.parent_id) {
              return {
                ...comment,
                replies: [...comment.replies, newComment]
              }
            }
            return comment
          })
        }
        
        // If it's a top-level comment, add it to the beginning
        return [newComment, ...oldData]
      })
      
      toast.success('Comment posted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to post comment')
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentAPI.updateComment(commentId, content),
    onSuccess: (updatedComment: Comment) => {
      // Update the comments cache
      queryClient.setQueryData(['comments', updatedComment.chapter_id], (oldData: Comment[] | undefined) => {
        if (!oldData) return []
        
        const updateCommentInList = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === updatedComment.id) {
              return updatedComment
            }
            if (comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentInList(comment.replies)
              }
            }
            return comment
          })
        }
        
        return updateCommentInList(oldData)
      })
      
      toast.success('Comment updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update comment')
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: commentAPI.deleteComment,
    onSuccess: (_, commentId) => {
      // Remove the comment from all chapter caches
      queryClient.setQueriesData(
        { queryKey: ['comments'] },
        (oldData: Comment[] | undefined) => {
          if (!oldData) return []
          
          const removeCommentFromList = (comments: Comment[]): Comment[] => {
            return comments.filter(comment => {
              if (comment.id === commentId) {
                return false
              }
              if (comment.replies.length > 0) {
                comment.replies = removeCommentFromList(comment.replies)
              }
              return true
            })
          }
          
          return removeCommentFromList(oldData)
        }
      )
      
      toast.success('Comment deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete comment')
    },
  })
}

export function useLikeComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: commentAPI.likeComment,
    onSuccess: (likeResponse: CommentLikeResponse) => {
      // Update the comments cache
      queryClient.setQueriesData(
        { queryKey: ['comments'] },
        (oldData: Comment[] | undefined) => {
          if (!oldData) return []
          
          const updateCommentLike = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === likeResponse.comment_id) {
                return {
                  ...comment,
                  like_count: likeResponse.like_count,
                  is_liked_by_user: likeResponse.is_liked
                }
              }
              if (comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateCommentLike(comment.replies)
                }
              }
              return comment
            })
          }
          
          return updateCommentLike(oldData)
        }
      )
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to like comment')
    },
  })
}

export function useReportComment() {
  return useMutation({
    mutationFn: ({ commentId, reason }: { commentId: string; reason: string }) =>
      commentAPI.reportComment(commentId, reason),
    onSuccess: () => {
      toast.success('Comment reported successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to report comment')
    },
  })
}

export function useCommentCount(chapterId: string) {
  return useQuery({
    queryKey: ['comment-count', chapterId],
    queryFn: () => commentAPI.getCommentCount(chapterId),
    enabled: !!chapterId,
  })
}