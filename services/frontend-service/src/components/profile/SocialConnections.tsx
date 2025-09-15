'use client';

import { useState } from 'react';
import { Users, UserPlus, UserMinus, Search, Filter, MoreHorizontal, MessageCircle, Heart } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isFollowing: boolean;
  isFollower: boolean;
  mutualFollowers: number;
  lastActive: string;
}

interface SocialStats {
  followers: number;
  following: number;
  mutualConnections: number;
}

export default function SocialConnections() {
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'discover'>('followers');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data
  const [stats] = useState<SocialStats>({
    followers: 1234,
    following: 567,
    mutualConnections: 89,
  });

  const [followers] = useState<User[]>([
    {
      id: '1',
      username: 'alice_writer',
      displayName: 'Alice Johnson',
      avatar: '/api/placeholder/40/40',
      isFollowing: true,
      isFollower: true,
      mutualFollowers: 12,
      lastActive: '2 hours ago',
    },
    {
      id: '2',
      username: 'bookworm_bob',
      displayName: 'Bob Smith',
      isFollowing: false,
      isFollower: true,
      mutualFollowers: 5,
      lastActive: '1 day ago',
    },
    {
      id: '3',
      username: 'story_lover',
      displayName: 'Sarah Chen',
      avatar: '/api/placeholder/40/40',
      isFollowing: true,
      isFollower: true,
      mutualFollowers: 23,
      lastActive: '3 hours ago',
    },
  ]);

  const [following] = useState<User[]>([
    {
      id: '4',
      username: 'fantasy_master',
      displayName: 'David Wilson',
      avatar: '/api/placeholder/40/40',
      isFollowing: true,
      isFollower: false,
      mutualFollowers: 8,
      lastActive: '1 hour ago',
    },
    {
      id: '5',
      username: 'sci_fi_queen',
      displayName: 'Emma Davis',
      isFollowing: true,
      isFollower: true,
      mutualFollowers: 15,
      lastActive: '4 hours ago',
    },
  ]);

  const [suggestions] = useState<User[]>([
    {
      id: '6',
      username: 'mystery_writer',
      displayName: 'James Brown',
      avatar: '/api/placeholder/40/40',
      isFollowing: false,
      isFollower: false,
      mutualFollowers: 3,
      lastActive: '2 days ago',
    },
    {
      id: '7',
      username: 'romance_reader',
      displayName: 'Lisa Garcia',
      isFollowing: false,
      isFollower: false,
      mutualFollowers: 7,
      lastActive: '1 day ago',
    },
  ]);

  const handleFollow = async (userId: string) => {
    setLoading(true);
    try {
      // TODO: Implement actual follow API call
      console.log('Following user:', userId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Update user state here
    } catch (error) {
      console.error('Follow failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (userId: string) => {
    setLoading(true);
    try {
      // TODO: Implement actual unfollow API call
      console.log('Unfollowing user:', userId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Update user state here
    } catch (error) {
      console.error('Unfollow failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const UserCard = ({ user, showFollowButton = true }: { user: User; showFollowButton?: boolean }) => (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            <Users className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{user.displayName}</h4>
          <p className="text-sm text-gray-600">@{user.username}</p>
          {user.mutualFollowers > 0 && (
            <p className="text-xs text-gray-500">
              {user.mutualFollowers} mutual connection{user.mutualFollowers !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = `/profile/${user.username}`}
        >
          View Profile
        </Button>
        
        {showFollowButton && (
          <Button
            variant={user.isFollowing ? 'outline' : 'primary'}
            size="sm"
            onClick={() => user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
            loading={loading}
          >
            {user.isFollowing ? (
              <>
                <UserMinus className="w-4 h-4 mr-1" />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1" />
                Follow
              </>
            )}
          </Button>
        )}
        
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const getCurrentUsers = () => {
    switch (activeTab) {
      case 'followers':
        return followers;
      case 'following':
        return following;
      case 'discover':
        return suggestions;
      default:
        return [];
    }
  };

  const filteredUsers = getCurrentUsers().filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.followers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Followers</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.following.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Following</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.mutualConnections}</div>
            <div className="text-sm text-gray-600">Mutual Connections</div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card padding="lg">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Social Connections</h3>
              <p className="text-sm text-gray-600">Manage your followers and discover new connections</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'followers', label: 'Followers', count: stats.followers },
                { id: 'following', label: 'Following', count: stats.following },
                { id: 'discover', label: 'Discover', count: null },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count.toLocaleString()}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* User List */}
          <div className="space-y-3">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  showFollowButton={activeTab !== 'following'}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No users found' : `No ${activeTab} yet`}
                </h4>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : activeTab === 'followers'
                    ? 'Share your profile to gain followers'
                    : activeTab === 'following'
                    ? 'Discover and follow interesting writers'
                    : 'Check back later for new suggestions'
                  }
                </p>
                {!searchQuery && activeTab === 'discover' && (
                  <Button onClick={() => setActiveTab('discover')}>
                    Refresh Suggestions
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Load More */}
          {filteredUsers.length > 0 && (
            <div className="text-center">
              <Button variant="outline">
                Load More
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card padding="lg">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Quick Actions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => window.location.href = '/messages'}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              View Messages
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => window.location.href = '/activity'}
            >
              <Heart className="w-4 h-4 mr-2" />
              Activity Feed
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}