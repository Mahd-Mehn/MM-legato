'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, Filter, Flag, Star, Users, TrendingUp } from 'lucide-react';
import {ThreadedDiscussion} from './ThreadedDiscussion';
import {TopicCreationModal} from './TopicCreationModal';
import ModerationTools from './ModerationTools';
import { UserReputationBadge } from './UserReputationBadge';

import Card from '../Card';
import Button from '../Button';
import Input from '../Input';

interface Topic {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    reputation: number;
    badges: string[];
  };
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  replyCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  lastReply?: {
    author: string;
    timestamp: Date;
  };
}

interface CommunityStats {
  totalTopics: number;
  totalReplies: number;
  activeUsers: number;
  onlineUsers: number;
}

export function CommunityDiscussionPlatform() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [stats, setStats] = useState<CommunityStats>({
    totalTopics: 0,
    totalReplies: 0,
    activeUsers: 0,
    onlineUsers: 0
  });
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All Topics', icon: MessageSquare },
    { id: 'writing-tips', name: 'Writing Tips', icon: Star },
    { id: 'story-feedback', name: 'Story Feedback', icon: MessageSquare },
    { id: 'publishing', name: 'Publishing', icon: TrendingUp },
    { id: 'community', name: 'Community', icon: Users },
    { id: 'announcements', name: 'Announcements', icon: Flag }
  ];

  useEffect(() => {
    fetchTopics();
    fetchCommunityStats();
  }, [selectedCategory, sortBy, searchQuery]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category: selectedCategory,
        sort: sortBy,
        search: searchQuery
      });
      
      const response = await fetch(`/api/community/topics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics);
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityStats = async () => {
    try {
      const response = await fetch('/api/community/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch community stats:', error);
    }
  };

  const handleCreateTopic = async (topicData: {
    title: string;
    description: string;
    category: string;
    tags: string[];
  }) => {
    try {
      const response = await fetch('/api/community/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData)
      });

      if (response.ok) {
        const newTopic = await response.json();
        setTopics(prev => [newTopic, ...prev]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to create topic:', error);
    }
  };

  const handleReportTopic = async (topicId: string, reason: string) => {
    try {
      await fetch(`/api/community/topics/${topicId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
    } catch (error) {
      console.error('Failed to report topic:', error);
    }
  };

  const filteredTopics = topics.filter(topic => {
    if (selectedCategory !== 'all' && topic.category !== selectedCategory) {
      return false;
    }
    if (searchQuery && !topic.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (selectedTopic) {
    return (
      <ThreadedDiscussion
        topic={selectedTopic}
        onBack={() => setSelectedTopic(null)}
        onReport={handleReportTopic}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Community Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalTopics.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Topics</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.totalReplies.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Replies</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.activeUsers.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.onlineUsers.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Online Now</div>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'recent' | 'popular' | 'trending')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="trending">Trending</option>
          </select>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Topic
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading discussions...</p>
          </div>
        ) : filteredTopics.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No discussions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Be the first to start a conversation in this category!
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create First Topic
            </Button>
          </Card>
        ) : (
          filteredTopics.map(topic => (
            <Card
              key={topic.id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTopic(topic)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {topic.isPinned && (
                      <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-medium">
                        Pinned
                      </div>
                    )}
                    {topic.isLocked && (
                      <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs font-medium">
                        Locked
                      </div>
                    )}
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs">
                      {categories.find(c => c.id === topic.category)?.name}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {topic.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {topic.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <img
                        src={topic.author.avatar}
                        alt={topic.author.displayName}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{topic.author.displayName}</span>
                      <UserReputationBadge
                        reputation={topic.author.reputation}
                        badges={topic.author.badges}
                      />
                    </div>
                    <span>•</span>
                    <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{topic.replyCount} replies</span>
                    <span>•</span>
                    <span>{topic.viewCount} views</span>
                  </div>
                  
                  {topic.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {topic.tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="ml-4 text-right">
                  {topic.lastReply && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div>Last reply by</div>
                      <div className="font-medium">{topic.lastReply.author}</div>
                      <div>{new Date(topic.lastReply.timestamp).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Topic Modal */}
      {showCreateModal && (
        <TopicCreationModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTopic}
        />
      )}
    </div>
  );
}