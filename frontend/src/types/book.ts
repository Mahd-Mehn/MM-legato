export interface Author {
  id: string
  username: string
  profile_picture_url?: string
}

export interface Chapter {
  id: string
  book_id: string
  title: string
  content: string
  chapter_number: number
  word_count?: number
  is_published: boolean
  audio_url?: string
  created_at: string
  updated_at: string
}

export interface Book {
  id: string
  title: string
  description?: string
  cover_image_url?: string
  author_id: string
  pricing_model: 'free' | 'fixed' | 'per_chapter'
  fixed_price?: number
  per_chapter_price?: number
  genre?: string
  tags?: string[]
  is_published: boolean
  license_hash?: string
  created_at: string
  updated_at?: string
  author?: Author
  chapters?: Chapter[]
  chapter_count?: number
  total_word_count?: number
}

export interface BookFilters {
  search?: string
  genre?: string
  tags?: string[]
  excluded_tags?: string[]
  pricing_model?: string
  min_price?: number
  max_price?: number
  min_rating?: number
  author_id?: string
  is_published?: boolean
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'title' | 'rating' | 'price'
  sort_order?: 'asc' | 'desc'
}

export interface BookListResponse {
  books: Book[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface UserSettings {
  user_id: string
  excluded_tags: string[]
  theme_preference: string
  reading_preferences: Record<string, any>
}