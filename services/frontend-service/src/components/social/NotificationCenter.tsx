'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, Eye, EyeOff, Filter, MoreHorizontal, User, Heart, MessageCircle, BookOpen, Star } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';
import Input from '../Input';

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'story_update' | 'message';
  title: string;
  message: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  story?: {
    id: string;
    title: string;
  };
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const notificationIcons = {
  follow: User,
  like: Heart,
  comment: MessageCircle,
  mention: MessageCircle,
  story_update: BookOpen,
  message: MessageCircle
};

const notificationColors = {
  follow: 'text-blue-500',
  like: 'text-red-500',
  comment: 'text-green-500',
  mention: 'text-purple-500',
  story_update: 'text-orange-500',
  message: 'text-indigo-500'
};

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        ...(filter === 'unread' && { unreadOnly: 'true' }),
        ...(filter !== 'all' && filter !== 'unread' && { type: filter })
      });

      const response = await fetch(`/api/social/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        })));
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/social/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds,
          action: 'mark_read'
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
        setSelectedNotifications([]);
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleMarkAsUnread = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/social/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds,
          action: 'mark_unread'
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, read: false } : n
          )
        );
        setUnreadCount(prev => prev + notificationIds.length);
        setSelectedNotifications([]);
      }
    } catch (error) {
      console.error('Failed to mark notifications as unread:', error);
    }
  };

  const handleDeleteNotifications = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/social/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(n => !notificationIds.includes(n.id))
        );
        const deletedUnreadCount = notifications
          .filter(n => notificationIds.includes(n.id) && !n.read)
          .length;
        setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
        setSelectedNotifications([]);
      }
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead([notification.id]);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="follow">Follows</option>
                <option value="like">Likes</option>
                <option value="comment">Comments</option>
                <option value="story_update">Story Updates</option>
                <option value="message">Messages</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedNotifications.length === notifications.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsRead(selectedNotifications)}
                  className="text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Mark Read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsUnread(selectedNotifications)}
                  className="text-xs"
                >
                  <EyeOff className="w-3 h-3 mr-1" />
                  Mark Unread
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteNotifications(selectedNotifications)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  <X className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No notifications
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'unread' ? 'All caught up!' : 'You\'ll see notifications here when you have them.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type];
                  const iconColor = notificationColors[notification.type];
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectNotification(notification.id);
                          }}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />

                        {/* Notification Icon */}
                        <div className={`flex-shrink-0 ${iconColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* User Avatar */}
                        {notification.user && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {notification.user.avatar ? (
                                <img
                                  src={notification.user.avatar}
                                  alt={notification.user.displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Notification Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              {notification.story && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  "{notification.story.title}"
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAsRead(notifications.filter(n => !n.read).map(n => n.id))}
                disabled={unreadCount === 0}
                className="flex-1"
              >
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/notifications'}
                className="flex-1"
              >
                View All
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}