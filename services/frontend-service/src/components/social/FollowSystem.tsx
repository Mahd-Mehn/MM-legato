'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Users, Bell, BellOff } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isFollowing: boolean;
  isFollower: boolean;
  mutualFollowers: number;
  lastActive: string;
  followerCount: number;
  followingCount: number;
}

interface FollowSystemProps {
  userId: string;
  initialUser?: User;
  onFollowChange?: (isFollowing: boolean, followerCount: number) => void;
}

export default function FollowSystem({ userId, initialUser, onFollowChange }: FollowSystemProps) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (!initialUser) {
      fetchUserData();
    }
  }, [userId, initialUser]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setNotificationsEnabled(userData.notificationsEnabled || false);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: user.isFollowing ? 'unfollow' : 'follow'
        })
      });

      if (response.ok) {
        const result = await response.json();
        const newFollowingState = !user.isFollowing;
        const newFollowerCount = user.followerCount + (newFollowingState ? 1 : -1);
        
        setUser(prev => prev ? {
          ...prev,
          isFollowing: newFollowingState,
          followerCount: newFollowerCount
        } : null);

        onFollowChange?.(newFollowingState, newFollowerCount);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (!user?.isFollowing) return;

    try {
      const response = await fetch('/api/social/notifications/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          enabled: !notificationsEnabled
        })
      });

      if (response.ok) {
        setNotificationsEnabled(!notificationsEnabled);
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    }
  };

  if (loading && !user) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          User not found
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start space-x-4">
        {/* User Avatar */}
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.displayName} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <Users className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {user.displayName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                @{user.username}
              </p>
              
              {user.bio && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                  {user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    {user.followerCount.toLocaleString()}
                  </strong> followers
                </span>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    {user.followingCount.toLocaleString()}
                  </strong> following
                </span>
                {user.mutualFollowers > 0 && (
                  <span className="text-blue-600 dark:text-blue-400">
                    {user.mutualFollowers} mutual
                  </span>
                )}
              </div>

              {/* Relationship Status */}
              <div className="flex items-center space-x-2 mt-2">
                {user.isFollower && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Follows you
                  </span>
                )}
                {user.isFollowing && user.isFollower && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Mutual
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2 ml-4">
              <Button
                variant={user.isFollowing ? 'outline' : 'primary'}
                size="sm"
                onClick={handleFollow}
                loading={loading}
                className="flex items-center space-x-2"
              >
                {user.isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow</span>
                  </>
                )}
              </Button>

              {/* Notification Toggle (only show if following) */}
              {user.isFollowing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNotificationToggle}
                  className="flex items-center space-x-2"
                  title={notificationsEnabled ? 'Turn off notifications' : 'Turn on notifications'}
                >
                  {notificationsEnabled ? (
                    <Bell className="w-4 h-4" />
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Last Active */}
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Last active {user.lastActive}
          </div>
        </div>
      </div>
    </Card>
  );
}