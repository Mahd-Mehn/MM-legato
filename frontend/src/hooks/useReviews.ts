import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Review, ReviewCreate, ReviewUpdate, BookReviewsResponse, ReviewPermissions } from '@/types/review'
import { toast } from 'sonner'

export function useBookReviews(bookId: string, page: number = 1, limit: number = 20) {
  return useQuery<BookReviewsResponse>({
    queryKey: ['book-reviews', bookId, page, limit],
    queryFn: async () => {
      const response = await api.get(`/api/v1/reviews/book/${bookId}?page=${page}&limit=${limit}`)
      return response.data
    },
    enabled: !!bookId
  })
}

export function useReviewPermissions(bookId: string) {
  return useQuery<ReviewPermissions>({
    queryKey: ['review-permissions', bookId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/reviews/can-review/${bookId}`)
      return response.data
    },
    enabled: !!bookId
  })
}

export function useUserReview(userId: string, bookId: string) {
  return useQuery<Review | null>({
    queryKey: ['user-review', userId, bookId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/reviews/user/${userId}/book/${bookId}`)
      return response.data
    },
    enabled: !!userId && !!bookId
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (reviewData: ReviewCreate) => {
      const response = await api.post('/api/v1/reviews/', reviewData)
      return response.data
    },
    onSuccess: (data, variables) => {
      toast.success('Review created successfully!')
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['book-reviews', variables.book_id] })
      queryClient.invalidateQueries({ queryKey: ['review-permissions', variables.book_id] })
      queryClient.invalidateQueries({ queryKey: ['user-review'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create review'
      toast.error(message)
    }
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ reviewId, reviewData }: { reviewId: string, reviewData: ReviewUpdate }) => {
      const response = await api.put(`/api/v1/reviews/${reviewId}`, reviewData)
      return response.data
    },
    onSuccess: (data) => {
      toast.success('Review updated successfully!')
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['book-reviews', data.book_id] })
      queryClient.invalidateQueries({ queryKey: ['user-review'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to update review'
      toast.error(message)
    }
  })
}

export function useDeleteReview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await api.delete(`/api/v1/reviews/${reviewId}`)
      return response.data
    },
    onSuccess: (_, reviewId) => {
      toast.success('Review deleted successfully!')
      // Invalidate all review queries
      queryClient.invalidateQueries({ queryKey: ['book-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['user-review'] })
      queryClient.invalidateQueries({ queryKey: ['review-permissions'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to delete review'
      toast.error(message)
    }
  })
}

export function useLikeReview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await api.post(`/api/v1/reviews/${reviewId}/like`)
      return response.data
    },
    onSuccess: () => {
      // Invalidate review queries to update like counts
      queryClient.invalidateQueries({ queryKey: ['book-reviews'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to like review'
      toast.error(message)
    }
  })
}