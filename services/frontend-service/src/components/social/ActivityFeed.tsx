'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, User, BookOpen, Trophy, UserPlus, MoreHorizontal, ExternalLink } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';

interface ActivityItem {
  id: string;
  type: 'story_published' | 'story_updated' | 'user_followed' | 'story_liked' | 'story_commented' | 'achievement_earned';
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  story?: {
    id: string;
    title: string;
    coverImage?: string;
    genre: string[];
  };
  targetUser?: {
    id: string;
    username: string;
    displayName: string;
  };
  achievement?: {
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  content: string;
  timestamp: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked: boolean;
  isBookmarked: boolean;
}

interface ActivityFeedProps {
  userId?: string; // If provided, shows user-specific feed
  feedType?: 'following' | 'discover' | 'personal';
}

const activityIcons = {
  story_published: BookOpen,
  story_updated: BookOpen,
  user_followed: UserPlus,
  story_liked: Heart,
  story_commented: MessageCircle,
  achievement_earned: Trophy
};

const activityColors = {
  story_published: 'text-green-600',
  story_updated: 'text-blue-600',
  user_followed: 'text-purple-600',
  story_liked: 'text-red-600',
  story_commented: 'text-orange-600',
  achievement_earned: 'text-yellow-600'
};

export default function ActivityFeed({ userId, feedType = 'following' }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchActivities(1);
  }, [userId, feedType]);

  const fetchActivities = async (pageNum: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        ...(userId && { userId }),
        ...(feedType !== 'following' && { type: feedType })
      });

      const response = await fetch(`/api/social/activity-feed?${params}`);
      if (response.ok) {
        const data = await response.json();
        const newActivities = data.activities.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));

        if (pageNum === 1) {
          setActivities(newActivities);
        } else {
          setActivities(prev => [...prev, ...newActivities]);
        }

        setHasMore(data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEngagement = async (activityId: string, action: 'like' | 'unlike' | 'bookmark' | 'unbookmark' | 'share') => {
    try {
      const response = await fetch('/api/social/activity-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId, action })
      });

      if (response.ok) {
        const result = await response.json();
        
        setActivities(prev => prev.map(activity => {
          if (activity.id === activityId) {
            const updated = { ...activity };
            
            switch (action) {
              case 'like':
                updated.isLiked = true;
                updated.engagement.likes = result.likesCount || updated.engagement.likes + 1;
                break;
              case 'unlike':
                updated.isLiked = false;
                updated.engagement.likes = result.likesCount || Math.max(0, updated.engagement.likes - 1);
                break;
              case 'bookmark':
                updated.isBookmarked = true;
                break;
              case 'unbookmark':
                updated.isBookmarked = false;
                break;
              case 'share':
                updated.engagement.shares = result.sharesCount || updated.engagement.shares + 1;
                break;
            }
            
            return updated;
          }
          return activity;
        }));
      }
    } catch (error) {
      console.error('Engagement action failed:', error);
    }
  };

  const handleShare = async (activity: ActivityItem) => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as any).share({
          title: `${activity.user.displayName} on Legato`,
          text: activity.content,
          url: typeof window !== 'undefined' ? window.location.href : ''
        });
        handleEngagement(activity.id, 'share');
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        if (typeof navigator !== 'undefined' && 'clipboard' in navigator && typeof window !== 'undefined') {
          await (navigator as any).clipboard.writeText(window.location.href);
          handleEngagement(activity.id, 'share');
          // You might want to show a toast notification here
        }
      } catch (error) {
        console.error('Copy to clipboard failed:', error);
      }
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

  const renderActivityContent = (activity: ActivityItem) => {
    const Icon = activityIcons[activity.type];
    const iconColor = activityColors[activity.type];

    return (
      <div className="flex items-start space-x-3">
        {/* Activity Icon */}
        <div className={`flex-shrink-0 ${iconColor} mt-1`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {activity.user.avatar ? (
              <img
                src={activity.user.avatar}
                alt={activity.user.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white">
                  {activity.user.displayName}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  @{activity.user.username}
                </span>
                <span className="text-gray-500 dark:text-gray-500 ml-2">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </p>
              
              <p className="text-gray-800 dark:text-gray-200 mt-1">
                {activity.content}
              </p>

              {/* Story Preview */}
              {activity.story && (
                <div className="mt-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  <div className="flex items-start space-x-3">
                    {activity.story.coverImage && (
                      <div className="flex-shrink-0">
                        <img
                          src={activity.story.coverImage}
                          alt={activity.story.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {activity.story.title}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {activity.story.genre.map(genre => (
                          <span
                            key={genre}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              )}

              {/* Achievement Display */}
              {activity.achievement && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{activity.achievement.icon}</span>
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                        {activity.achievement.name}
                      </h4>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300">
                        {activity.achievement.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Target User (for follow activities) */}
              {activity.targetUser && (
                <div className="mt-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {activity.targetUser.displayName}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      @{activity.targetUser.username}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* More Options */}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Engagement Actions */}
          <div className="flex items-center space-x-6 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => handleEngagement(activity.id, activity.isLiked ? 'unlike' : 'like')}
              className={`flex items-center space-x-2 text-sm transition-colors ${
                activity.isLiked
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${activity.isLiked ? 'fill-current' : ''}`} />
              <span>{activity.engagement.likes}</span>
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/activity/${activity.id}#comments`;
                }
              }}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{activity.engagement.comments}</span>
            </button>

            <button
              onClick={() => handleShare(activity)}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{activity.engagement.shares}</span>
            </button>

            <button
              onClick={() => handleEngagement(activity.id, activity.isBookmarked ? 'unbookmark' : 'bookmark')}
              className={`flex items-center space-x-2 text-sm transition-colors ${
                activity.isBookmarked
                  ? 'text-blue-600 hover:text-blue-700'
                  : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              {activity.isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 fill-current" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id} className="p-6">
          {renderActivityContent(activity)}
        </Card>
      ))}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading activities...</p>
        </div>
      )}

      {!loading && activities.length === 0 && (
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No activities yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {feedType === 'following' 
              ? 'Follow some users to see their activities here!'
              : 'Check back later for new activities.'
            }
          </p>
        </Card>
      )}

      {hasMore && !loading && activities.length > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => fetchActivities(page + 1)}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}