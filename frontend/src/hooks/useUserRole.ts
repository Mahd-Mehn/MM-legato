'use client'

import { useQuery } from '@tanstack/react-query'
import { userAPI } from '@/lib/api'

export interface UserPermissions {
  can_read: boolean
  can_comment: boolean
  can_like: boolean
  can_purchase: boolean
  can_access_vault: boolean
  can_write: boolean
  can_publish: boolean
  can_moderate: boolean
  can_view_analytics: boolean
  can_manage_characters: boolean
}

export interface UserRoleData {
  user_id: string
  username: string
  is_writer: boolean
  theme_preference: string
  permissions: UserPermissions
}

export function useUserRole() {
  return useQuery<UserRoleData>({
    queryKey: ['user-role-permissions'],
    queryFn: userAPI.getRolePermissions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

export function useUserPermissions() {
  const { data, isLoading, error } = useUserRole()
  
  return {
    permissions: data?.permissions,
    isWriter: data?.is_writer || false,
    isLoading,
    error,
    hasPermission: (permission: keyof UserPermissions) => {
      return data?.permissions?.[permission] || false
    }
  }
}