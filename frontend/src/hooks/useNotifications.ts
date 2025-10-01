'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { notificationAPI } from '@/lib/api'
import { Notification, NotificationListResponse } from '@/types/notification'
import { queryKeys, getInvalidationKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

export function useNotifications(skip = 0, limit = 50, unreadOnly = false) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: queryKeys.notifications.list(skip, limit, unreadOnly),
    queryFn: (): Promise<NotificationListResponse> => 
      notificationAPI.getNotifications(skip, limit, unreadOnly),
    enabled: !!session,
    staleTime: 30 * 1000, // 30 seconds for notifications
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

export function useInfiniteNotifications(limit = 50, unreadOnly = false) {
  const { data: session } = useSession()

  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(undefined, limit, unreadOnly),
    queryFn: ({ pageParam = 0 }): Promise<NotificationListResponse> => 
      notificationAPI.getNotifications(pageParam, limit, unreadOnly),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((sum, page) => sum + page.notifications.length, 0)
      return totalFetched < lastPage.total ? totalFetched : undefined
    },
    enabled: !!session,
    staleTime: 30 * 1000,
  })
}

export function useUnreadNotificationCount() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationAPI.getUnreadCount(),
    enabled: !!session,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationAPI.markAsRead,
    onMutate: async (notificationId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })

      // Optimistically update notification lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.all },
        (oldData: NotificationListResponse | undefined) => {
          if (!oldData) return oldData

          return {
            ...oldData,
            notifications: oldData.notifications.map(notification =>
              notification.id === notificationId
                ? { ...notification, is_read: true }
                : notification
            ),
            unread_count: Math.max(0, oldData.unread_count - 1),
          }
        }
      )

      // Optimistically update unread count
      queryClient.setQueryData(
        queryKeys.notifications.unreadCount(),
        (oldData: { unread_count: number } | undefined) => {
          if (!oldData) return oldData
          return { unread_count: Math.max(0, oldData.unread_count - 1) }
        }
      )
    },
    onError: (error, notificationId, context) => {
      // Revert optimistic updates on error
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      toast.error('Failed to mark notification as read')
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationAPI.markAllAsRead,
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })

      // Optimistically update all notification lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.all },
        (oldData: NotificationListResponse | undefined) => {
          if (!oldData) return oldData

          return {
            ...oldData,
            notifications: oldData.notifications.map(notification => ({
              ...notification,
              is_read: true,
            })),
            unread_count: 0,
          }
        }
      )

      // Optimistically update unread count
      queryClient.setQueryData(
        queryKeys.notifications.unreadCount(),
        () => ({ unread_count: 0 })
      )
    },
    onSuccess: () => {
      toast.success('All notifications marked as read')
    },
    onError: () => {
      // Revert optimistic updates on error
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      toast.error('Failed to mark all notifications as read')
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationAPI.deleteNotification,
    onMutate: async (notificationId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })

      // Get the notification being deleted to check if it's unread
      let wasUnread = false
      queryClient.getQueriesData({ queryKey: queryKeys.notifications.all }).forEach(([, data]) => {
        if (data && typeof data === 'object' && 'notifications' in data) {
          const notificationData = data as NotificationListResponse
          const notification = notificationData.notifications.find(n => n.id === notificationId)
          if (notification && !notification.is_read) {
            wasUnread = true
          }
        }
      })

      // Optimistically remove notification from all lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.notifications.all },
        (oldData: NotificationListResponse | undefined) => {
          if (!oldData) return oldData

          return {
            ...oldData,
            notifications: oldData.notifications.filter(n => n.id !== notificationId),
            total: oldData.total - 1,
            unread_count: wasUnread ? Math.max(0, oldData.unread_count - 1) : oldData.unread_count,
          }
        }
      )

      // Update unread count if notification was unread
      if (wasUnread) {
        queryClient.setQueryData(
          queryKeys.notifications.unreadCount(),
          (oldData: { unread_count: number } | undefined) => {
            if (!oldData) return oldData
            return { unread_count: Math.max(0, oldData.unread_count - 1) }
          }
        )
      }

      return { wasUnread }
    },
    onSuccess: () => {
      toast.success('Notification deleted')
    },
    onError: (error, notificationId, context) => {
      // Revert optimistic updates on error
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      toast.error('Failed to delete notification')
    },
  })
}

// Hook for real-time notification updates via SSE
export function useNotificationStream() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!session) return

    const setupSSE = async () => {
      try {
        eventSourceRef.current = await notificationAPI.createNotificationStream()
        
        eventSourceRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            switch (data.type) {
              case 'connected':
                console.log('Connected to notification stream')
                break
                
              case 'new_notification':
                // Add new notification to cache
                queryClient.setQueriesData(
                  { queryKey: queryKeys.notifications.all },
                  (oldData: NotificationListResponse | undefined) => {
                    if (!oldData) return oldData
                    
                    return {
                      ...oldData,
                      notifications: [data.notification, ...oldData.notifications],
                      total: oldData.total + 1,
                      unread_count: oldData.unread_count + 1,
                    }
                  }
                )
                
                // Update unread count
                queryClient.setQueryData(
                  queryKeys.notifications.unreadCount(),
                  (oldData: { unread_count: number } | undefined) => ({
                    unread_count: (oldData?.unread_count || 0) + 1
                  })
                )
                
                // Show toast notification
                toast.info(data.notification.title, {
                  description: data.notification.message
                })
                break
                
              case 'notification_read':
                // Update notification as read in cache
                queryClient.setQueriesData(
                  { queryKey: queryKeys.notifications.all },
                  (oldData: NotificationListResponse | undefined) => {
                    if (!oldData) return oldData
                    
                    return {
                      ...oldData,
                      notifications: oldData.notifications.map(notification =>
                        notification.id === data.notification_id
                          ? { ...notification, is_read: true }
                          : notification
                      ),
                      unread_count: Math.max(0, oldData.unread_count - 1),
                    }
                  }
                )
                
                // Update unread count
                queryClient.setQueryData(
                  queryKeys.notifications.unreadCount(),
                  (oldData: { unread_count: number } | undefined) => ({
                    unread_count: Math.max(0, (oldData?.unread_count || 0) - 1)
                  })
                )
                break
                
              case 'all_notifications_read':
                // Mark all as read in cache
                queryClient.setQueriesData(
                  { queryKey: queryKeys.notifications.all },
                  (oldData: NotificationListResponse | undefined) => {
                    if (!oldData) return oldData
                    
                    return {
                      ...oldData,
                      notifications: oldData.notifications.map(notification => ({
                        ...notification,
                        is_read: true,
                      })),
                      unread_count: 0,
                    }
                  }
                )
                
                // Update unread count
                queryClient.setQueryData(
                  queryKeys.notifications.unreadCount(),
                  () => ({ unread_count: 0 })
                )
                break
                
              case 'notification_deleted':
                // Remove notification from cache
                queryClient.setQueriesData(
                  { queryKey: queryKeys.notifications.all },
                  (oldData: NotificationListResponse | undefined) => {
                    if (!oldData) return oldData
                    
                    const deletedNotification = oldData.notifications.find(n => n.id === data.notification_id)
                    const wasUnread = deletedNotification && !deletedNotification.is_read
                    
                    return {
                      ...oldData,
                      notifications: oldData.notifications.filter(n => n.id !== data.notification_id),
                      total: oldData.total - 1,
                      unread_count: wasUnread ? Math.max(0, oldData.unread_count - 1) : oldData.unread_count,
                    }
                  }
                )
                break
                
              case 'heartbeat':
                // Keep connection alive
                break
                
              default:
                console.log('Unknown SSE event type:', data.type)
            }
          } catch (err) {
            console.error('Failed to parse SSE message:', err)
          }
        }
        
        eventSourceRef.current.onerror = (error) => {
          console.error('SSE connection error:', error)
          // Reconnect after a delay
          setTimeout(() => {
            if (eventSourceRef.current) {
              eventSourceRef.current.close()
              setupSSE()
            }
          }, 5000)
        }
        
      } catch (err) {
        console.error('Failed to create SSE connection:', err)
      }
    }

    setupSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [session, queryClient])

  return eventSourceRef.current
}