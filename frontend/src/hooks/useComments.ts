import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { commentAPI } from '@/lib/api'
import { Comment, CommentCreateRequest, CommentLikeResponse } from '@/types/comment'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

export function useComments(chapterId: string) {
  return useQuery({
    queryKey: queryKeys.comments.chapter(chapterId),
    queryFn: () => commentAPI.getChapterComments(chapterId),
    enabled: !!chapterId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCommentCount(chapterId: string) {
  return useQuery({
    queryKey: queryKeys.comments.count(chapterId),
    queryFn: () => commentAPI.getCommentCount(chapterId),
    enabled: !!chapterId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: commentAPI.createComment,
    onMutate: async (newComment: CommentCreateRequest) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.chapter(newComment.chapter_id) })

      // Create optimistic comment
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        chapter_id: newComment.chapter_id,
        user_id: 'current-user', // This should be replaced with actual user ID
        parent_id: newComment.parent_id || undefined,
        content: newComment.content,
        like_count: 0,
        is_liked_by_user: false,
        is_reported: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: {
          id: 'current-user',
          username: 'You',
          profile_picture_url: undefined,
          is_writer: false,
          is_book_author: false
        },
        replies: [],
        is_liked_by_author: false,
        can_delete: true,
      }

      // Optimistically update comments
      queryClient.setQueryData(
        queryKeys.comments.chapter(newComment.chapter_id),
        (oldData: Comment[] | undefined) => {
          if (!oldData) return [optimisticComment]
          
          // If it's a reply, add to parent's replies
          if (newComment.parent_id) {
            return oldData.map(comment => {
              if (comment.id === newComment.parent_id) {
                return {
                  ...comment,
                  replies: [...comment.replies, optimisticComment]
                }
              }
              return comment
            })
          }
          
          // If it's a top-level comment, add to beginning
          return [optimisticComment, ...oldData]
        }
      )

      // Optimistically update comment count
      queryClient.setQueryData(
        queryKeys.comments.count(newComment.chapter_id),
        (oldData: { count: number } | undefined) => ({
          count: (oldData?.count || 0) + 1
        })
      )

      return { optimisticComment }
    },
    onSuccess: (newComment: Comment, variables, context) => {
      // Replace optimistic comment with real one
      queryClient.setQueryData(
        queryKeys.comments.chapter(newComment.chapter_id),
        (oldData: Comment[] | undefined) => {
          if (!oldData) return [newComment]
          
          const replaceOptimisticComment = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === context?.optimisticComment.id) {
                return newComment
              }
              if (comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: replaceOptimisticComment(comment.replies)
                }
              }
              return comment
            })
          }
          
          return replaceOptimisticComment(oldData)
        }
      )
      
      // Update comment count with real data
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.count(newComment.chapter_id) })
      
      toast.success('Comment posted successfully!')
    },
    onError: (error: any, variables, context) => {
      // Revert optimistic updates
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.chapter(variables.chapter_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.count(variables.chapter_id) })
      
      toast.error(error.response?.data?.detail || 'Failed to post comment')
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentAPI.updateComment(commentId, content),
    onMutate: async ({ commentId, content }) => {
      // Optimistically update comment content
      queryClient.setQueriesData(
        { queryKey: queryKeys.comments.all },
        (oldData: Comment[] | undefined) => {
          if (!oldData) return []
          
          const updateCommentInList = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === commentId) {
                return { ...comment, content }
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
        }
      )
    },
    onSuccess: (updatedComment: Comment) => {
      // Update with real data
      queryClient.setQueryData(
        queryKeys.comments.chapter(updatedComment.chapter_id),
        (oldData: Comment[] | undefined) => {
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
        }
      )
      
      toast.success('Comment updated successfully!')
    },
    onError: (error: any, { commentId }) => {
      // Revert optimistic updates
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
      toast.error(error.response?.data?.detail || 'Failed to update comment')
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: commentAPI.deleteComment,
    onMutate: async (commentId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.all })

      // Find which chapter this comment belongs to for count update
      let chapterId: string | null = null
      queryClient.getQueriesData({ queryKey: queryKeys.comments.all }).forEach(([key, data]) => {
        if (data && Array.isArray(data)) {
          const found = data.find((comment: Comment) => comment.id === commentId)
          if (found) {
            chapterId = found.chapter_id
          }
        }
      })

      // Optimistically remove comment
      queryClient.setQueriesData(
        { queryKey: queryKeys.comments.all },
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

      // Optimistically update comment count
      if (chapterId) {
        queryClient.setQueryData(
          queryKeys.comments.count(chapterId),
          (oldData: { count: number } | undefined) => ({
            count: Math.max(0, (oldData?.count || 0) - 1)
          })
        )
      }

      return { chapterId }
    },
    onSuccess: (_, commentId, context) => {
      // Invalidate to get fresh data
      if (context?.chapterId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.comments.count(context.chapterId) })
      }
      
      toast.success('Comment deleted successfully!')
    },
    onError: (error: any, commentId, context) => {
      // Revert optimistic updates
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
      if (context?.chapterId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.comments.count(context.chapterId) })
      }
      
      toast.error(error.response?.data?.detail || 'Failed to delete comment')
    },
  })
}

export function useLikeComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: commentAPI.likeComment,
    onMutate: async (commentId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.all })

      // Optimistically update like status
      queryClient.setQueriesData(
        { queryKey: queryKeys.comments.all },
        (oldData: Comment[] | undefined) => {
          if (!oldData) return []
          
          const updateCommentLike = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  like_count: comment.is_liked_by_user 
                    ? comment.like_count - 1 
                    : comment.like_count + 1,
                  is_liked_by_user: !comment.is_liked_by_user
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
    onSuccess: (likeResponse: CommentLikeResponse) => {
      // Update with real data
      queryClient.setQueriesData(
        { queryKey: queryKeys.comments.all },
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
    onError: (error: any, commentId) => {
      // Revert optimistic updates
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
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