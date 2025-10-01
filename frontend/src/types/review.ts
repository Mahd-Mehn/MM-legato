export interface Review {
  id: string
  book_id: string
  user_id: string
  rating: number
  title: string
  content: string
  is_spoiler: boolean
  like_count: number
  is_reported: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  
  // User info
  user_username?: string
  user_profile_picture?: string
  
  // Whether current user has liked this review
  is_liked_by_current_user?: boolean
  
  // Whether the review author is the book author
  is_author_review?: boolean
}

export interface ReviewCreate {
  book_id: string
  rating: number
  title: string
  content: string
  is_spoiler?: boolean
}

export interface ReviewUpdate {
  rating?: number
  title?: string
  content?: string
  is_spoiler?: boolean
}

export interface BookReviewsResponse {
  reviews: Review[]
  total_count: number
  average_rating?: number
  rating_distribution: Record<number, number>
}

export interface ReviewPermissions {
  can_review: boolean
  has_started_reading: boolean
  has_existing_review: boolean
}