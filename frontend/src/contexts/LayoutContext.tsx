'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { userAPI } from '@/lib/api'
import { useUserRole } from '@/hooks/useUserRole'

export interface LayoutPreferences {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  compactMode: boolean
}

const DEFAULT_PREFERENCES: LayoutPreferences = {
  sidebarCollapsed: false,
  theme: 'light',
  compactMode: false,
}

interface LayoutContextType {
  preferences: LayoutPreferences
  isLoading: boolean
  updatePreferences: (updates: Partial<LayoutPreferences>) => Promise<void>
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleCompactMode: () => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<LayoutPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)
  const { data: userRole } = useUserRole()

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('layout-preferences')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      } catch (error) {
        console.error('Failed to parse layout preferences:', error)
      }
    }
    
    // Set theme from user profile if available
    if (userRole?.theme_preference) {
      setPreferences(prev => ({
        ...prev,
        theme: userRole.theme_preference as 'light' | 'dark' | 'system'
      }))
    }
    
    setIsLoading(false)
  }, [userRole])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('layout-preferences', JSON.stringify(preferences))
      console.log('Saved preferences to localStorage:', preferences)
    }
  }, [preferences, isLoading])

  const updatePreferences = async (updates: Partial<LayoutPreferences>) => {
    console.log('Updating preferences:', updates)
    const newPreferences = { ...preferences, ...updates }
    console.log('New preferences:', newPreferences)
    setPreferences(newPreferences)

    // If theme is updated, also update user profile
    if (updates.theme && updates.theme !== userRole?.theme_preference) {
      try {
        await userAPI.updateProfile({ theme_preference: updates.theme })
      } catch (error) {
        console.error('Failed to update theme preference:', error)
      }
    }
  }

  const toggleSidebar = () => {
    console.log('Toggling sidebar from:', preferences.sidebarCollapsed, 'to:', !preferences.sidebarCollapsed)
    updatePreferences({ sidebarCollapsed: !preferences.sidebarCollapsed })
  }

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    updatePreferences({ theme })
  }

  const toggleCompactMode = () => {
    updatePreferences({ compactMode: !preferences.compactMode })
  }

  return (
    <LayoutContext.Provider
      value={{
        preferences,
        isLoading,
        updatePreferences,
        toggleSidebar,
        setTheme,
        toggleCompactMode,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayoutPreferences() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error('useLayoutPreferences must be used within a LayoutProvider')
  }
  return context
}