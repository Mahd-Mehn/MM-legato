'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  BookOpen, 
  Edit3, 
  Eye, 
  Calendar, 
  Clock, 
  Save, 
  Settings,
  Shield,
  Globe,
  DollarSign
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Story {
  id: string;
  title: string;
  description: string;
  genre: string;
  status: 'draft' | 'published' | 'completed' | 'hiatus';
  chapters: Chapter[];
  coverImage?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  totalViews: number;
  totalLikes: number;
  isProtected: boolean;
  monetization: 'free' | 'premium' | 'subscription';
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'published';
  publishedAt?: string;
  chapterNumber: number;
}

const mockStories: Story[] = [
  {
    id: '1',
    title: 'The Digital Awakening',
    description: 'In a world where consciousness can be digitized, Maya discovers she might not be human after all.',
    genre: 'Sci-Fi',
    status: 'published',
    chapters: [
      {
        id: 'ch1',
        title: 'The Beginning',
        content: '<p>This is the first chapter content...</p>',
        wordCount: 2500,
        status: 'published',
        publishedAt: '2024-01-15',
        chapterNumber: 1,
      },
      {
        id: 'ch2',
        title: 'Discovery',
        content: '<p>This is the second chapter content...</p>',
        wordCount: 2800,
        status: 'draft',
        chapterNumber: 2,
      },
    ],
    tags: ['AI', 'Cyberpunk', 'Thriller'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    totalViews: 15420,
    totalLikes: 1230,
    isProtected: true,
    monetization: 'premium',
  },
  {
    id: '2',
    title: 'Hearts in Lagos',
    description: 'A romantic tale set in modern Lagos, where tradition meets contemporary love.',
    genre: 'Romance',
    status: 'completed',
    chapters: [
      {
        id: 'ch3',
        title: 'First Meeting',
        content: '<p>Chapter content here...</p>',
        wordCount: 2200,
        status: 'published',
        publishedAt: '2023-12-01',
        chapterNumber: 1,
      },
    ],
    tags: ['Contemporary', 'African', 'Drama'],
    createdAt: '2023-11-15',
    updatedAt: '2024-01-10',
    totalViews: 12800,
    totalLikes: 980,
    isProtected: true,
    monetization: 'free',
  },
];

export default function WritePage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showNewStoryModal, setShowNewStoryModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'completed'>('all');

  useEffect(() => {
    const loadStories = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStories(mockStories);
      setLoading(false);
    };

    loadStories();
  }, []);

  const filteredStories = stories.filter(story => {
    if (filter === 'all') return true;
    return story.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'hiatus':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Stories</h1>
              <p className="text-gray-600 mt-1">Manage your stories and chapters</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button 
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowNewStoryModal(true)}
              >
                New Story
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200 w-fit">
            {[
              { value: 'all', label: 'All Stories' },
              { value: 'draft', label: 'Drafts' },
              { value: 'published', label: 'Published' },
              { value: 'completed', label: 'Completed' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stories Grid */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No stories found
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "You haven't created any stories yet. Start writing your first story!"
                : `No ${filter} stories found.`
              }
            </p>
            <Button 
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowNewStoryModal(true)}
            >
              Create Your First Story
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}

        {/* New Story Modal */}
        {showNewStoryModal && (
          <NewStoryModal 
            onClose={() => setShowNewStoryModal(false)}
            onSubmit={(storyData) => {
              // TODO: Create new story
              console.log('Creating new story:', storyData);
              setShowNewStoryModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

function StoryCard({ story }: { story: Story }) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'hiatus':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      <div className="aspect-[3/4] bg-gradient-to-br from-primary-100 to-primary-200 rounded-t-lg relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-primary-400" />
        </div>
        <div className="absolute top-2 right-2 flex space-x-1">
          {story.isProtected && (
            <div className="bg-green-500 text-white p-1 rounded" title="IP Protected">
              <Shield className="w-3 h-3" />
            </div>
          )}
          {story.monetization === 'premium' && (
            <div className="bg-yellow-500 text-white p-1 rounded" title="Premium Content">
              <DollarSign className="w-3 h-3" />
            </div>
          )}
        </div>
        <div className="absolute bottom-2 left-2">
          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(story.status)}`}>
            {story.status}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {story.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {story.description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>{formatNumber(story.totalViews)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpen className="w-3 h-3" />
              <span>{story.chapters.length} chapters</span>
            </div>
          </div>
          <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded">
            {story.genre}
          </span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Link href={`/write/${story.id}`} className="flex-1">
            <Button variant="outline" size="sm" fullWidth leftIcon={<Edit3 className="w-4 h-4" />}>
              Edit
            </Button>
          </Link>
          <Link href={`/stories/${story.id}`}>
            <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
              View
            </Button>
          </Link>
        </div>

        {/* Last Updated */}
        <p className="text-xs text-gray-400 mt-3 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          Updated {new Date(story.updatedAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

function NewStoryModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void; 
  onSubmit: (data: any) => void; 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    tags: '',
    monetization: 'free',
  });
  const [loading, setLoading] = useState(false);

  const genres = [
    'Romance', 'Fantasy', 'Sci-Fi', 'Mystery', 'Drama', 
    'Adventure', 'Horror', 'Comedy', 'Historical', 'Contemporary'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSubmit({
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create New Story</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Story Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter your story title"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your story..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Genre
              </label>
              <select
                value={formData.genre}
                onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select a genre</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            <Input
              label="Tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Enter tags separated by commas"
              helperText="e.g., romance, contemporary, drama"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Monetization
              </label>
              <div className="space-y-2">
                {[
                  { value: 'free', label: 'Free', description: 'Anyone can read for free' },
                  { value: 'premium', label: 'Premium', description: 'Readers pay coins to unlock chapters' },
                  { value: 'subscription', label: 'Subscription', description: 'Only subscribers can read' },
                ].map((option) => (
                  <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="monetization"
                      value={option.value}
                      checked={formData.monetization === option.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, monetization: e.target.value }))}
                      className="mt-1 w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                fullWidth
                loading={loading}
              >
                Create Story
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}