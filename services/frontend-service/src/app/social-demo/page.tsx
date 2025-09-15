'use client';

import { useState } from 'react';
import { Bell, Users, MessageCircle, Share2, Activity } from 'lucide-react';
import { FollowSystem, NotificationCenter, ActivityFeed, SocialSharingWidget, DirectMessaging } from '@/components/social';
import Button from '@/components/Button';
import Card from '@/components/Card';

export default function SocialDemoPage() {
  const [activeTab, setActiveTab] = useState<'follow' | 'notifications' | 'activity' | 'sharing' | 'messaging'>('follow');
  const [showNotifications, setShowNotifications] = useState(false);

  const mockUser = {
    id: '1',
    username: 'alice_writer',
    displayName: 'Alice Johnson',
    avatar: '/api/placeholder/64/64',
    bio: 'Fantasy writer and storyteller passionate about creating immersive worlds and compelling characters.',
    isFollowing: false,
    isFollower: true,
    mutualFollowers: 12,
    lastActive: '2 hours ago',
    followerCount: 1234,
    followingCount: 567
  };

  const tabs = [
    { id: 'follow', label: 'Follow System', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity', label: 'Activity Feed', icon: Activity },
    { id: 'sharing', label: 'Social Sharing', icon: Share2 },
    { id: 'messaging', label: 'Direct Messages', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Social Engagement Features Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Explore Legato's comprehensive social features including user following, notifications, 
            activity feeds, social sharing, and direct messaging.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === 'follow' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  User Following System
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  A comprehensive follow system that allows users to connect with each other, 
                  manage notifications, and track mutual connections.
                </p>
                
                <div className="max-w-2xl">
                  <FollowSystem
                    userId={mockUser.id}
                    initialUser={mockUser}
                    onFollowChange={(isFollowing, followerCount) => {
                      console.log('Follow state changed:', { isFollowing, followerCount });
                    }}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Features
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Follow/unfollow users with real-time updates</li>
                  <li>• Display follower and following counts</li>
                  <li>• Show mutual connections</li>
                  <li>• Toggle notifications for followed users</li>
                  <li>• Display user bio and activity status</li>
                  <li>• Responsive design for all screen sizes</li>
                </ul>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Notification System
                  </h2>
                  <Button
                    onClick={() => setShowNotifications(true)}
                    className="flex items-center space-x-2"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Open Notifications</span>
                  </Button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  A comprehensive notification center that keeps users informed about follows, 
                  likes, comments, story updates, and messages.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Features
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Real-time notifications for all user interactions</li>
                  <li>• Filter notifications by type (follows, likes, comments, etc.)</li>
                  <li>• Bulk actions (mark as read/unread, delete)</li>
                  <li>• Unread count indicators</li>
                  <li>• Click to navigate to relevant content</li>
                  <li>• Responsive slide-out panel design</li>
                </ul>
              </Card>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Activity Feed
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  A personalized activity feed showing updates from followed users including 
                  story publications, achievements, and social interactions.
                </p>
              </Card>

              <ActivityFeed feedType="following" />

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Features
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Personalized feed based on followed users</li>
                  <li>• Multiple activity types (stories, follows, achievements)</li>
                  <li>• Like, comment, and share activities</li>
                  <li>• Bookmark activities for later</li>
                  <li>• Story previews with cover images and genres</li>
                  <li>• Achievement celebrations</li>
                  <li>• Infinite scroll with pagination</li>
                </ul>
              </Card>
            </div>
          )}

          {activeTab === 'sharing' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Social Sharing Widget
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  A comprehensive sharing widget that allows users to share stories and content 
                  across multiple social platforms and messaging apps.
                </p>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src="/api/placeholder/60/80"
                      alt="Story Cover"
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        The Enchanted Forest
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        A magical adventure story by Alice Johnson
                      </p>
                    </div>
                  </div>
                  
                  <SocialSharingWidget
                    url="https://legato.app/stories/enchanted-forest"
                    title="The Enchanted Forest - A Magical Adventure"
                    description="Join the adventure in a mystical world where ancient trees hold secrets and magical creatures roam free."
                    image="/api/placeholder/300/400"
                    hashtags={['fantasy', 'adventure', 'magic', 'legato']}
                    via="LegatoApp"
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Features
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Share to Twitter, Facebook, LinkedIn, WhatsApp, and Email</li>
                  <li>• Native Web Share API support for mobile devices</li>
                  <li>• Copy link to clipboard functionality</li>
                  <li>• Story preview with cover image and metadata</li>
                  <li>• Suggested hashtags for social media</li>
                  <li>• Customizable share text and descriptions</li>
                  <li>• Responsive dropdown design</li>
                </ul>
              </Card>
            </div>
          )}

          {activeTab === 'messaging' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Direct Messaging System
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  A full-featured messaging system that allows users to communicate privately 
                  with other writers and readers on the platform.
                </p>
              </Card>

              <DirectMessaging
                currentUserId="current_user"
                initialConversationId="conv1"
              />

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Features
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Real-time messaging with conversation threads</li>
                  <li>• Online status and last seen indicators</li>
                  <li>• Unread message counts and notifications</li>
                  <li>• Search conversations and participants</li>
                  <li>• Message read receipts and timestamps</li>
                  <li>• Responsive design for desktop and mobile</li>
                  <li>• File attachment support (planned)</li>
                  <li>• Message editing and deletion (planned)</li>
                </ul>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}