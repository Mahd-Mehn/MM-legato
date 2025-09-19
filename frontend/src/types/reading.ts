export interface ChapterNavigationInfo {
  id: string
  title: string
  chapter_number: number
  is_published: boolean
}

export interface BookNavigationResponse {
  book_id: string
  book_title: string
  chapters: ChapterNavigationInfo[]
  current_chapter_id?: string
  previous_chapter?: ChapterNavigationInfo
  next_chapter?: ChapterNavigationInfo
}

export interface BookmarkResponse {
  id: string
  user_id: string
  chapter_id: string
  position_percentage: number
  created_at: string
  updated_at: string
}

export interface ChapterReadingResponse {
  id: string
  book_id: string
  title: string
  content: string
  chapter_number: number
  word_count?: number
  audio_url?: string
  created_at: string
  updated_at: string
  
  // Book information
  book_title: string
  book_author: string
  book_cover_url?: string
  
  // Navigation
  previous_chapter?: ChapterNavigationInfo
  next_chapter?: ChapterNavigationInfo
  
  // User-specific data
  bookmark?: BookmarkResponse
  reading_time_minutes?: number
}

export interface ReadingPreferences {
  user_id: string
  font_family: string
  font_size: number
  line_height: number
  background_color: string
  text_color: string
  page_width: number
  brightness: number
  wallpaper_url?: string
  theme_preset: string
}

export interface ReadingPreferencesUpdate {
  font_family?: string
  font_size?: number
  line_height?: number
  background_color?: string
  text_color?: string
  page_width?: number
  brightness?: number
  wallpaper_url?: string
  theme_preset?: string
}

export interface BookmarkCreate {
  chapter_id: string
  position_percentage: number
}