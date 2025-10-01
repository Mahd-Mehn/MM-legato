'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationType } from '@/types/notification'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function NotificationDropdown() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications()
  
  const [showAll, setShowAll] = useState(false)
  
  const displayNotifications = showAll 
    ? notifications 
    : notifications.slice(0, 5)

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LIKE:
        return '❤️'
      case NotificationType.REPLY:
        return '💬'
      case NotificationType.PURCHASE:
        return '💰'
      case NotificationType.NEW_CHAPTER:
        return '📖'
      case NotificationType.REVIEW:
        return '⭐'
      case NotificationType.REVIEW_LIKE:
        return '👍'
      default:
        return '🔔'
    }
  }

  const getNotificationLink = (notification: any) => {
    switch (notification.type) {
      case NotificationType.LIKE:
      case NotificationType.REPLY:
        if (notification.comment_id && notification.book_id) {
          // Parse data to get chapter_id if available
          try {
            const data = notification.data ? JSON.parse(notification.data) : {}
            const chapterId = data.chapter_id || notification.chapter_id
            if (chapterId) {
              return `/reading/${notification.book_id}/${chapterId}#comment-${notification.comment_id}`
            }
          } catch (e) {
            console.error('Failed to parse notification data:', e)
          }
        }
        return null
      case NotificationType.PURCHASE:
        if (notification.book_id) {
          return `/dashboard/library`
        }
        return null
      case NotificationType.NEW_CHAPTER:
        if (notification.book_id && notification.chapter_id) {
          return `/reading/${notification.book_id}/${notification.chapter_id}`
        }
        return null
      case NotificationType.REVIEW:
      case NotificationType.REVIEW_LIKE:
        if (notification.book_id) {
          return `/dashboard/explore/books/${notification.book_id}#reviews`
        }
        return null
      default:
        return null
    }
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Loading notifications...</p>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No notifications yet</p>
        <p className="text-sm">We'll notify you when something happens!</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="max-h-96">
        <div className="divide-y">
          {displayNotifications.map((notification) => {
            const link = getNotificationLink(notification)
            const NotificationContent = (
              <div
                className={cn(
                  "p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                  !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-lg flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-medium",
                          !notification.is_read && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {/* Show original comment for reply and like notifications */}
                        {(notification.type === NotificationType.REPLY || notification.type === NotificationType.LIKE) && notification.data && (() => {
                          try {
                            const data = JSON.parse(notification.data)
                            const commentText = data.original_comment || data.comment_content
                            if (commentText) {
                              return (
                                <div className="mt-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground border-l-2 border-muted-foreground/20">
                                  <span className="font-medium">Your comment: </span>
                                  "{commentText}"
                                </div>
                              )
                            }
                          } catch (e) {
                            return null
                          }
                          return null
                        })()}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )

            return (
              <div key={notification.id} className="group">
                {link ? (
                  <Link href={link} className="block">
                    {NotificationContent}
                  </Link>
                ) : (
                  NotificationContent
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-2">
        {notifications.length > 5 && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowAll(true)}
          >
            Show all {notifications.length} notifications
          </Button>
        )}
        {showAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowAll(false)}
          >
            Show less
          </Button>
        )}
        <Separator className="my-2" />
        <Link href="/dashboard/notifications">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            <ExternalLink className="h-3 w-3 mr-1" />
            View all notifications
          </Button>
        </Link>
      </div>
    </div>
  )
}