import axios from 'axios'
import { getSession } from 'next-auth/react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  } else {
    console.warn('No session or access token found for API request')
  }
  return config
})

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed - user may need to log in again')
    }
    return Promise.reject(error)
  }
)

// General API endpoints
export const apiEndpoints = {
  health: async () => {
    const response = await api.get('/api/v1/health')
    return response
  }
}

// Auth API functions
export const authAPI = {
  register: async (userData: {
    email: string
    username: string
    password: string
    is_writer: boolean
  }) => {
    const response = await api.post('/api/v1/auth/register', userData)
    return response.data
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/api/v1/auth/login', credentials)
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/api/v1/auth/me')
    return response.data
  },

  setVaultPassword: async (vaultPassword: string) => {
    const response = await api.post('/api/v1/auth/vault-password', {
      vault_password: vaultPassword
    })
    return response.data
  }
}

// User API functions
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/api/v1/users/profile')
    return response.data
  },

  updateProfile: async (profileData: {
    username?: string
    bio?: string
    profile_picture_url?: string
    theme_preference?: string
  }) => {
    const response = await api.put('/api/v1/users/profile', profileData)
    return response.data
  },

  getRolePermissions: async () => {
    const response = await api.get('/api/v1/users/role-permissions')
    return response.data
  },

  uploadProfilePicture: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/api/v1/users/profile/upload-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  completeOnboarding: async (onboardingData: {
    username: string
    bio?: string
    is_writer: boolean
    profile_picture_url?: string
  }) => {
    const response = await api.post('/api/v1/users/onboarding', onboardingData)
    return response.data
  }
}

// Book API functions
export const bookAPI = {
  getBooks: async (filters?: {
    search?: string
    genre?: string
    tags?: string
    excluded_tags?: string
    pricing_model?: string
    min_price?: number
    max_price?: number
    min_rating?: number
    author_id?: string
    is_published?: boolean
    page?: number
    limit?: number
    sort_by?: string
    sort_order?: string
  }) => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
    }
    
    const response = await api.get(`/api/v1/books?${params.toString()}`)
    return response.data
  },

  getBook: async (bookId: string, includeChapters: boolean = false) => {
    const response = await api.get(`/api/v1/books/${bookId}?include_chapters=${includeChapters}`)
    return response.data
  },

  createBook: async (bookData: {
    title: string
    description?: string
    cover_image_url?: string
    pricing_model: string
    fixed_price?: number
    per_chapter_price?: number
    genre?: string
    tags?: string[]
    is_published?: boolean
  }) => {
    const response = await api.post('/api/v1/books', bookData)
    return response.data
  },

  updateBook: async (bookId: string, bookData: any) => {
    const response = await api.put(`/api/v1/books/${bookId}`, bookData)
    return response.data
  },

  deleteBook: async (bookId: string) => {
    const response = await api.delete(`/api/v1/books/${bookId}`)
    return response.data
  },

  getBookChapters: async (bookId: string) => {
    const response = await api.get(`/api/v1/books/${bookId}/chapters`)
    return response.data
  },

  createChapter: async (bookId: string, chapterData: {
    title: string
    content: string
    chapter_number: number
    is_published?: boolean
  }) => {
    const response = await api.post(`/api/v1/books/${bookId}/chapters`, chapterData)
    return response.data
  },

  getChapter: async (chapterId: string) => {
    const response = await api.get(`/api/v1/books/chapters/${chapterId}`)
    return response.data
  },

  updateChapter: async (chapterId: string, chapterData: any) => {
    const response = await api.put(`/api/v1/books/chapters/${chapterId}`, chapterData)
    return response.data
  },

  deleteChapter: async (chapterId: string) => {
    const response = await api.delete(`/api/v1/books/chapters/${chapterId}`)
    return response.data
  },

  uploadBookCover: async (bookId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(`/api/v1/books/${bookId}/upload-cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}

// Settings API functions
export const settingsAPI = {
  getUserSettings: async () => {
    const response = await api.get('/api/v1/settings')
    return response.data
  },

  updateUserSettings: async (settingsData: {
    excluded_tags?: string[]
    theme_preference?: string
    reading_preferences?: Record<string, any>
  }) => {
    const response = await api.put('/api/v1/settings', settingsData)
    return response.data
  },

  updateExcludedTags: async (excludedTags: string[]) => {
    const response = await api.put('/api/v1/settings/excluded-tags', excludedTags)
    return response.data
  },

  getExcludedTags: async () => {
    const response = await api.get('/api/v1/settings/excluded-tags')
    return response.data
  }
}

// Reading API functions
export const readingAPI = {
  getChapterForReading: async (chapterId: string) => {
    const response = await api.get(`/api/v1/reading/chapters/${chapterId}`)
    return response.data
  },

  getBookNavigation: async (bookId: string) => {
    const response = await api.get(`/api/v1/reading/books/${bookId}/navigation`)
    return response.data
  },

  createBookmark: async (chapterId: string, positionPercentage: number) => {
    const response = await api.post('/api/v1/reading/bookmarks', {
      chapter_id: chapterId,
      position_percentage: positionPercentage
    })
    return response.data
  },

  getChapterBookmark: async (chapterId: string) => {
    const response = await api.get(`/api/v1/reading/bookmarks/chapter/${chapterId}`)
    return response.data
  },

  deleteBookmark: async (chapterId: string) => {
    const response = await api.delete(`/api/v1/reading/bookmarks/chapter/${chapterId}`)
    return response.data
  },

  updateReadingProgress: async (bookId: string, chapterId: string, positionPercentage: number) => {
    const response = await api.post('/api/v1/reading/progress', {
      book_id: bookId,
      chapter_id: chapterId,
      position_percentage: positionPercentage
    })
    return response.data
  },

  getContinueReading: async (limit: number = 5) => {
    const response = await api.get(`/api/v1/reading/continue-reading?limit=${limit}`)
    return response.data
  },

  getReadingProgress: async (bookId: string) => {
    const response = await api.get(`/api/v1/reading/progress/book/${bookId}`)
    return response.data
  }
}

// Comment API functions
export const commentAPI = {
  createComment: async (commentData: {
    chapter_id: string
    content: string
    parent_id?: string
  }) => {
    const response = await api.post('/api/v1/comments', commentData)
    return response.data
  },

  getChapterComments: async (chapterId: string, page: number = 1, pageSize: number = 50) => {
    const response = await api.get(`/api/v1/comments/chapter/${chapterId}?page=${page}&page_size=${pageSize}`)
    return response.data
  },

  updateComment: async (commentId: string, content: string) => {
    const response = await api.put(`/api/v1/comments/${commentId}`, { content })
    return response.data
  },

  deleteComment: async (commentId: string) => {
    const response = await api.delete(`/api/v1/comments/${commentId}`)
    return response.data
  },

  likeComment: async (commentId: string) => {
    const response = await api.post(`/api/v1/comments/${commentId}/like`)
    return response.data
  },

  reportComment: async (commentId: string, reason: string) => {
    const response = await api.post(`/api/v1/comments/${commentId}/report`, { reason })
    return response.data
  },

  getCommentCount: async (chapterId: string) => {
    const response = await api.get(`/api/v1/comments/chapter/${chapterId}/count`)
    return response.data
  }
}

// Character API functions
export const characterAPI = {
  getCharacters: async () => {
    const response = await api.get('/api/v1/characters')
    return response.data
  },

  getCharacter: async (characterId: string) => {
    const response = await api.get(`/api/v1/characters/${characterId}`)
    return response.data
  },

  createCharacter: async (characterData: {
    name: string
    image_url?: string
    description?: string
    title?: string
    gender?: string
    age?: number
    relationships?: Record<string, any>
  }) => {
    const response = await api.post('/api/v1/characters', characterData)
    return response.data
  },

  updateCharacter: async (characterId: string, characterData: {
    name?: string
    image_url?: string
    description?: string
    title?: string
    gender?: string
    age?: number
    relationships?: Record<string, any>
  }) => {
    const response = await api.put(`/api/v1/characters/${characterId}`, characterData)
    return response.data
  },

  deleteCharacter: async (characterId: string) => {
    const response = await api.delete(`/api/v1/characters/${characterId}`)
    return response.data
  },

  associateCharacterWithBook: async (characterId: string, bookId: string) => {
    const response = await api.post(`/api/v1/characters/${characterId}/books`, { book_id: bookId })
    return response.data
  },

  removeCharacterFromBook: async (characterId: string, bookId: string) => {
    const response = await api.delete(`/api/v1/characters/${characterId}/books/${bookId}`)
    return response.data
  },

  getCharactersByBook: async (bookId: string) => {
    const response = await api.get(`/api/v1/characters/book/${bookId}`)
    return response.data
  },

  uploadCharacterImage: async (characterId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(`/api/v1/characters/${characterId}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}

// Moderation API functions
export const moderationAPI = {
  getDashboard: async () => {
    const response = await api.get('/api/v1/moderation/dashboard')
    return response.data
  },

  getPendingReports: async (page: number = 1, pageSize: number = 20) => {
    const response = await api.get(`/api/v1/moderation/reports?page=${page}&page_size=${pageSize}`)
    return response.data
  },

  resolveReport: async (reportId: string, action: string, resolutionNotes?: string) => {
    const response = await api.post(`/api/v1/moderation/reports/${reportId}/resolve`, {
      action,
      resolution_notes: resolutionNotes
    })
    return response.data
  },

  getModerationLogs: async (page: number = 1, pageSize: number = 20) => {
    const response = await api.get(`/api/v1/moderation/logs?page=${page}&page_size=${pageSize}`)
    return response.data
  },

  reportComment: async (commentId: string, reason: string, description?: string) => {
    const response = await api.post(`/api/v1/comments/${commentId}/report`, {
      reason,
      description
    })
    return response.data
  }
}

// Notification API functions
export const notificationAPI = {
  getNotifications: async (skip: number = 0, limit: number = 50, unreadOnly: boolean = false) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      unread_only: unreadOnly.toString()
    })
    const response = await api.get(`/api/v1/notifications?${params.toString()}`)
    return response.data
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/v1/notifications/unread-count')
    return response.data
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.put(`/api/v1/notifications/${notificationId}/read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await api.put('/api/v1/notifications/mark-all-read')
    return response.data
  },

  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/api/v1/notifications/${notificationId}`)
    return response.data
  },

  // Create SSE connection for real-time notifications
  createNotificationStream: async () => {
    const session = await getSession()
    if (!session?.accessToken) {
      throw new Error('No access token available for SSE connection')
    }
    
    return new EventSource(`${API_BASE_URL}/api/v1/notifications/stream?token=${session.accessToken}`, {
      withCredentials: true
    })
  }
}
// 

export const vaultAPI = {
  getStatus: async () => {
    const response = await api.get('/api/v1/vault/status')
    return response.data
  },

  verifyPassword: async (password: string) => {
    const response = await api.post('/api/v1/vault/verify', {
      password: password
    })
    
    console.log('Vault verify response:', response.data)
    
    // Store session ID in header for future requests
    if (response.data.session_id) {
      console.log('Storing vault session:', response.data.session_id)
      api.defaults.headers['X-Vault-Session'] = response.data.session_id
      // Also store in localStorage for persistence
      localStorage.setItem('vault_session_id', response.data.session_id)
      localStorage.setItem('vault_session_expires', response.data.session_expires_at)
      console.log('Session stored in localStorage and headers')
    } else {
      console.error('No session_id in response')
    }
    
    return response.data
  },

  getBooks: async () => {
    // Ensure session header is set
    const sessionId = localStorage.getItem('vault_session_id')
    if (sessionId) {
      api.defaults.headers['X-Vault-Session'] = sessionId
      console.log('Using vault session for getBooks:', sessionId)
    } else {
      console.error('No vault session ID found in localStorage')
    }
    
    const response = await api.get('/api/v1/vault/books')
    console.log('Vault books response:', response.data)
    return response.data
  },

  addBook: async (bookId: string) => {
    const response = await api.post('/api/v1/vault/add-book', {
      book_id: bookId
    })
    return response.data
  },

  removeBook: async (bookId: string) => {
    const response = await api.post('/api/v1/vault/remove-book', {
      book_id: bookId
    })
    return response.data
  },

  logout: async () => {
    const response = await api.post('/api/v1/vault/logout')
    // Remove session header and localStorage
    delete api.defaults.headers['X-Vault-Session']
    localStorage.removeItem('vault_session_id')
    localStorage.removeItem('vault_session_expires')
    return response.data
  },

  checkSession: async () => {
    // Make sure we have the session ID in headers
    const storedSessionId = localStorage.getItem('vault_session_id')
    if (storedSessionId) {
      api.defaults.headers['X-Vault-Session'] = storedSessionId
    }
    
    try {
      const response = await api.get('/api/v1/vault/session-status')
      return response.data
    } catch (error) {
      console.error('Session check failed:', error)
      // Clean up invalid session
      localStorage.removeItem('vault_session_id')
      localStorage.removeItem('vault_session_expires')
      delete api.defaults.headers['X-Vault-Session']
      return { valid: false }
    }
  },

  // Initialize vault session from localStorage on app start
  initializeSession: () => {
    try {
      const storedSessionId = localStorage.getItem('vault_session_id')
      const storedExpires = localStorage.getItem('vault_session_expires')
      
      console.log('Initializing vault session:', { storedSessionId, storedExpires })
      
      if (storedSessionId && storedExpires) {
        const expiresAt = new Date(storedExpires)
        const now = new Date()
        
        console.log('Session expires at:', expiresAt, 'Current time:', now)
        
        if (expiresAt > now) {
          api.defaults.headers['X-Vault-Session'] = storedSessionId
          console.log('Vault session restored:', storedSessionId)
          return true
        } else {
          console.log('Stored session expired, cleaning up')
          localStorage.removeItem('vault_session_id')
          localStorage.removeItem('vault_session_expires')
          delete api.defaults.headers['X-Vault-Session']
        }
      }
      return false
    } catch (error) {
      console.error('Error initializing vault session:', error)
      return false
    }
  }
}

// Analytics API functions
export const analyticsAPI = {
  getWriterOverview: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const response = await api.get(`/api/v1/analytics/writer/overview?${params}`)
    return response.data
  },

  getBookAnalytics: async (bookId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const response = await api.get(`/api/v1/analytics/book/${bookId}?${params}`)
    return response.data
  },

  trackBookView: async (bookId: string) => {
    const response = await api.post(`/api/v1/analytics/track/book-view/${bookId}`)
    return response.data
  },

  trackChapterView: async (chapterId: string) => {
    const response = await api.post(`/api/v1/analytics/track/chapter-view/${chapterId}`)
    return response.data
  },

  exportEarningsReport: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const response = await api.get(`/api/v1/analytics/export/earnings?${params}`, {
      responseType: 'blob'
    })
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `earnings_report_${startDate || 'all'}_${endDate || 'all'}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response.data
  },

  exportAnalyticsReport: async (bookId?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (bookId) params.append('book_id', bookId)
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const response = await api.get(`/api/v1/analytics/export/analytics?${params}`, {
      responseType: 'blob'
    })
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const filename = bookId 
      ? `book_analytics_${bookId}_${startDate || 'all'}_${endDate || 'all'}.csv`
      : `writer_analytics_${startDate || 'all'}_${endDate || 'all'}.csv`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response.data
  }
}