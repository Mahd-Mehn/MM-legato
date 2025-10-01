'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Check, CheckCheck, Trash2, Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationType } from '@/types/notification'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    total,
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    fetchNotifications,
    refetch
  } = useNotifications()
  
  const [activeTab, setActiveTab] = useState('all')
  const [loadingMore, setLoadingMore] = useState(false)

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

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      await fetchNotifications(notifications.length, 50, activeTab === 'unread')
    } finally {
      setLoadingMore(false)
    }
  }

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications

  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let key: string
    if (date.toDateString() === today.toDateString()) {
      key = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday'
    } else {
      key = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
    
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(notification)
    return groups
  }, {} as Record<string, typeof notifications>)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your reading activity
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm text-muted-foreground">Unread</span>
            </div>
            <p className="text-2xl font-bold">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Read</span>
            </div>
            <p className="text-2xl font-bold">{total - unreadCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading && notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Loading notifications...</p>
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {activeTab === 'unread' 
                    ? 'All caught up! 🎉' 
                    : 'We\'ll notify you when something happens!'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([date, dayNotifications]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {date}
                  </h3>
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {dayNotifications.map((notification, index) => {
                          const link = getNotificationLink(notification)
                          const NotificationContent = (
                            <div
                              className={cn(
                                "p-4 hover:bg-muted/50 transition-colors cursor-pointer group",
                                !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
                              )}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start gap-4">
                                <div className="text-xl flex-shrink-0 mt-1">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <p className={cn(
                                        "font-medium",
                                        !notification.is_read && "font-semibold"
                                      )}>
                                        {notification.title}
                                      </p>
                                      <p className="text-muted-foreground mt-1">
                                        {notification.message}
                                      </p>
                                      {/* Show original comment for reply and like notifications */}
                                      {(notification.type === NotificationType.REPLY || notification.type === NotificationType.LIKE) && notification.data && (() => {
                                        try {
                                          const data = JSON.parse(notification.data)
                                          const commentText = data.original_comment || data.comment_content
                                          if (commentText) {
                                            return (
                                              <div className="mt-3 p-3 bg-muted/30 rounded-md text-sm text-muted-foreground border-l-2 border-muted-foreground/20">
                                                <span className="font-medium">Your comment: </span>
                                                <span className="italic">"{commentText}"</span>
                                              </div>
                                            )
                                          }
                                        } catch (e) {
                                          return null
                                        }
                                        return null
                                      })()}
                                      <p className="text-sm text-muted-foreground mt-2">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {!notification.is_read && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteNotification(notification.id)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )

                          return (
                            <div key={notification.id}>
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
                    </CardContent>
                  </Card>
                </div>
              ))}

              {/* Load More */}
              {filteredNotifications.length < total && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}