import { useQuery } from '@tanstack/react-query'
import { api, readingAPI } from '@/lib/api'

interface DashboardStats {
  books_read: number
  reading_time_hours: number
  comments_made: number
  coin_balance: number
  story_views?: number
}

interface ContinueReadingBook {
  id: string
  book_id: string
  title: string
  author: string
  cover_url?: string
  current_chapter_id: string
  current_chapter_title: string
  current_chapter_number: number
  progress: number
  last_read_at: string
}

interface RecommendedBook {
  id: string
  title: string
  author: string
  price?: number
  is_free: boolean
  cover_url?: string
  rating?: number
}

interface UserStory {
  id: string
  title: string
  cover_url?: string
  chapter_count: number
  is_published: boolean
  views?: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        const response = await api.get('/api/v1/users/dashboard-stats')
        return response.data
      } catch (error) {
        console.error('Dashboard stats API error:', error)
        return {
          books_read: 0,
          reading_time_hours: 0,
          comments_made: 0,
          coin_balance: 0
        }
      }
    },
  })
}

export function useContinueReading() {
  return useQuery({
    queryKey: ['continue-reading'],
    queryFn: async (): Promise<ContinueReadingBook[]> => {
      try {
        const response = await readingAPI.getContinueReading(5)
        return response || []
      } catch (error) {
        console.error('Continue reading API error:', error)
        return []
      }
    },
  })
}

export function useRecommendedBooks() {
  return useQuery({
    queryKey: ['recommended-books'],
    queryFn: async (): Promise<RecommendedBook[]> => {
      try {
        const response = await api.get('/api/v1/books/recommended')
        const books = response.data || []
        return books.map((book: any) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          price: book.price,
          is_free: book.is_free,
          cover_url: book.cover_url, // This should map to coverUrl in BookCard
          rating: book.rating
        }))
      } catch (error) {
        console.error('Recommended books API error:', error)
        return []
      }
    },
  })
}

export function useUserStories() {
  return useQuery({
    queryKey: ['user-stories'],
    queryFn: async (): Promise<UserStory[]> => {
      try {
        // Get both published and unpublished books for the writer
        // Remove is_published filter to get all books
        const response = await api.get('/api/v1/books?author_id=me&limit=10')
        const books = response.data.books || []
        return books.map((book: any) => ({
          id: book.id,
          title: book.title,
          cover_url: book.cover_image_url, // This should map to coverUrl in BookCard
          chapter_count: book.chapter_count || 0,
          is_published: book.is_published,
          views: 0 // Mock data
        }))
      } catch (error) {
        console.error('User stories API error:', error)
        return []
      }
    },
  })
}