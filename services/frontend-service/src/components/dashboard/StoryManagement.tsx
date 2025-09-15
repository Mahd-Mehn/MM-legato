'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Edit3, 
  Eye, 
  Heart, 
  DollarSign, 
  MoreVertical,
  Plus,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  Globe,
  Shield
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

interface Story {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  status: 'draft' | 'published' | 'completed' | 'paused';
  chapters: number;
  totalViews: number;
  totalLikes: number;
  revenue: number;
  lastUpdated: string;
  createdAt: string;
  genre: string[];
  language: string;
  isPremium: boolean;
  hasIPProtection: boolean;
  translationStatus: {
    total: number;
    completed: number;
  };
  engagement: {
    averageRating: number;
    comments: number;
    followers: number;
  };
}

interface StoryManagementProps {
  stories: Story[];
  onStoryAction: (storyId: string, action: string) => void;
}

export default function StoryManagement({ stories, onStoryAction }: StoryManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'views' | 'revenue' | 'created'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort stories
  const filteredStories = stories
    .filter(story => {
      const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           story.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.totalViews - a.totalViews;
        case 'revenue':
          return b.revenue - a.revenue;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
        default:
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
    });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Story Management</CardTitle>
            <Link href="/write">
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                New Story
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="updated">Last Updated</option>
                <option value="views">Most Views</option>
                <option value="revenue">Highest Revenue</option>
                <option value="created">Newest</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stories List */}
      <Card>
        <CardContent className="p-0">
          {filteredStories.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stories found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start writing your first story to see it here'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/write">
                  <Button leftIcon={<Plus className="w-4 h-4" />}>
                    Create Your First Story
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredStories.map((story) => (
                <div key={story.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        {/* Cover Image */}
                        <div className="flex-shrink-0">
                          {story.coverImage ? (
                            <img
                              src={story.coverImage}
                              alt={story.title}
                              className="w-16 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Story Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {story.title}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
                              {story.status}
                            </span>
                            {story.isPremium && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Premium
                              </span>
                            )}
                          </div>

                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {story.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <BookOpen className="w-4 h-4 mr-1" />
                              {story.chapters} chapters
                            </span>
                            <span className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {formatNumber(story.totalViews)} views
                            </span>
                            <span className="flex items-center">
                              <Heart className="w-4 h-4 mr-1" />
                              {formatNumber(story.totalLikes)} likes
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {formatCurrency(story.revenue)}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Updated {formatDate(story.lastUpdated)}
                            </span>
                          </div>

                          {/* Additional Info */}
                          <div className="flex items-center space-x-4 mt-3">
                            {story.hasIPProtection && (
                              <div className="flex items-center text-green-600 text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                IP Protected
                              </div>
                            )}
                            {story.translationStatus.total > 0 && (
                              <div className="flex items-center text-blue-600 text-xs">
                                <Globe className="w-3 h-3 mr-1" />
                                {story.translationStatus.completed}/{story.translationStatus.total} translations
                              </div>
                            )}
                            <div className="flex items-center text-purple-600 text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {formatNumber(story.engagement.followers)} followers
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Link href={`/write/${story.id}`}>
                        <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-4 h-4" />}>
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/stories/${story.id}`}>
                        <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                          View
                        </Button>
                      </Link>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {story.engagement.averageRating.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">Avg Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatNumber(story.engagement.comments)}
                        </div>
                        <div className="text-xs text-gray-500">Comments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatNumber(story.totalViews / story.chapters)}
                        </div>
                        <div className="text-xs text-gray-500">Avg Views/Chapter</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(story.revenue / story.chapters)}
                        </div>
                        <div className="text-xs text-gray-500">Revenue/Chapter</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}