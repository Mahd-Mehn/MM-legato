export interface User {
  id: string
  email: string
  username: string
  profile_picture_url?: string
  bio?: string
  is_writer: boolean
  theme_preference: string
  coin_balance: number
  created_at: string
  updated_at: string
}

export interface UserUpdate {
  username?: string
  bio?: string
  profile_picture_url?: string
  theme_preference?: string
}

export interface OnboardingData {
  username: string
  bio?: string
  is_writer: boolean
  profile_picture_url?: string
}