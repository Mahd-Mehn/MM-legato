export enum NotificationType {
  LIKE = "like",
  REPLY = "reply",
  PURCHASE = "purchase",
  NEW_CHAPTER = "new_chapter",
  REVIEW = "review",
  REVIEW_LIKE = "review_like"
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  book_id?: string
  chapter_id?: string
  comment_id?: string
  review_id?: string
  data?: string
  created_at: string
  updated_at: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unread_count: number
}

export interface NotificationUpdate {
  is_read?: boolean
}