'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  Eye, 
  Heart, 
  BookOpen, 
  Clock, 
  Share2, 
  Bookmark, 
  Play,
  Download,
  MessageCircle,
  ThumbsUp,
  Flag,
  User,
  Calendar,
  Globe,
  Award,
  TrendingUp,
  Users,
  ChevronRight,
  X
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { apiService } from '@/lib/api';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  verified: boolean;
  bio: string;
  followers: number;
  storiesCount: number;
  joinedDate: string;
}

interface Chapter {
  id: string;
  title: string;
  number: number;
  wordCount: number;
  readTime: number;
  publishedAt: string;
  isLocked: boolean;
  price?: number;
  preview?: string;
}

interface Story {
  id: string;
  title: string;
  author: Author;
  description: string;
  coverImage: string;
  genre: string[];
  rating: number;
  ratingCount: number;
  chapters: Chapter[];
  totalChapters: number;
  views: number;
  likes: number;
  bookmarks: number;
  comments: number;
  status: 'ongoing' | 'completed' | 'hiatus';
  lastUpdated: string;
  publishedAt: string;
  tags: string[];
  isPremium: boolean;
  price?: number;
  language: string;
  readTime: number;
  completionRate: number;
  trending: boolean;
  featured: boolean;
  mature: boolean;
  summary: string;
  warnings: string[];
}

// Utility function to format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Utility function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Mock data function
function getMockStory(id: string): Story {
  return {
    id,
    title: 'The Digital Awakening',
    author: {
      id: 'author1',
      name: 'Sarah Chen',
      verified: true,
      bio: 'Award-winning science fiction author with over 2 million readers worldwide. Passionate about exploring the intersection of technology and humanity.',
      followers: 45000,
      storiesCount: 12,
      joinedDate: '2022-03-15',
    },
    description: 'In a world where consciousness can be digitized, Maya discovers she might not be human after all. As she unravels the truth about her existence, she must navigate a complex web of corporate espionage, digital warfare, and the fundamental question of what it means to be alive.',
    coverImage: '/covers/digital-awakening.jpg',
    genre: ['Sci-Fi', 'Thriller', 'Cyberpunk'],
    rating: 4.8,
    ratingCount: 2847,
    chapters: [
      {
        id: 'ch1',
        title: 'The Glitch',
        number: 1,
        wordCount: 2500,
        readTime: 12,
        publishedAt: '2024-01-15',
        isLocked: false,
      },
      {
        id: 'ch2',
        title: 'Digital Shadows',
        number: 2,
        wordCount: 3200,
        readTime: 15,
        publishedAt: '2024-01-18',
        isLocked: false,
      },
      {
        id: 'ch3',
        title: 'The Corporation',
        number: 3,
        wordCount: 2800,
        readTime: 13,
        publishedAt: '2024-01-22',
        isLocked: true,
        price: 0.99,
        preview: 'Maya stared at the corporate logo floating in her vision...',
      },
    ],
    totalChapters: 45,
    views: 125000,
    likes: 8900,
    bookmarks: 3400,
    comments: 1250,
    status: 'ongoing',
    lastUpdated: '2024-01-22',
    publishedAt: '2024-01-15',
    tags: ['AI', 'Cyberpunk', 'Thriller', 'Strong Female Lead', 'Corporate Dystopia'],
    isPremium: true,
    price: 4.99,
    language: 'English',
    readTime: 180,
    completionRate: 85,
    trending: true,
    featured: true,
    mature: false,
    summary: 'A thrilling journey through a digital landscape where the line between human and artificial intelligence blurs. Maya Chen, a data analyst, begins experiencing strange glitches in her perception of reality. As she investigates, she uncovers a conspiracy that challenges everything she believes about consciousness, identity, and what it means to be human in an increasingly digital world.',
    warnings: ['Violence', 'Strong Language'],
  };
}

export default function StoryDetailPage() {
  const params = useParams();
  const storyId = params.storyId as string;
  
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chapters' | 'reviews' | 'about'>('chapters');

  // Fetch story data
  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiService.getStory(storyId);
        setStory((response as any)?.story || getMockStory(storyId));
      } catch (err) {
        console.error('Failed to fetch story:', err);
        // Fallback to mock data
        setStory(getMockStory(storyId));
      } finally {
        setLoading(false);
      }
    };

    if (storyId) {
      fetchStory();
    }
  }, [storyId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-reading-bg flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-reading-muted">Loading story details...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-reading-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-reading-text mb-4">Story Not Found</h2>
          <p className="text-reading-muted mb-6">The story you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/stories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-reading-bg">
      {/* Navigation */}
      <div className="bg-white border-b border-reading-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link 
            href="/stories" 
            className="inline-flex items-center gap-2 text-reading-muted hover:text-reading-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stories
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Story Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Cover Image */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="aspect-[3/4] bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl overflow-hidden relative shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {story.trending && (
                    <div className="bg-accent-rose text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Trending
                    </div>
                  )}
                  {story.featured && (
                    <div className="bg-accent-amber text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      Featured
                    </div>
                  )}
                  {story.isPremium && (
                    <div className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Premium ${story.price}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="absolute bottom-4 left-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    story.status === 'ongoing' ? 'bg-accent-emerald text-white' :
                    story.status === 'completed' ? 'bg-primary-500 text-white' :
                    'bg-accent-amber text-white'
                  }`}>
                    {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button className="w-full bg-primary-500 text-white py-4 rounded-2xl font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Start Reading
                </button>
                
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-3 rounded-xl border transition-colors flex items-center justify-center ${
                      isLiked 
                        ? 'bg-accent-rose text-white border-accent-rose' 
                        : 'bg-white border-reading-border text-reading-muted hover:text-accent-rose'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button 
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`p-3 rounded-xl border transition-colors flex items-center justify-center ${
                      isBookmarked 
                        ? 'bg-primary-500 text-white border-primary-500' 
                        : 'bg-white border-reading-border text-reading-muted hover:text-primary-500'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button className="p-3 rounded-xl border bg-white border-reading-border text-reading-muted hover:text-reading-text transition-colors flex items-center justify-center">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                <button 
                  onClick={() => setShowPreview(true)}
                  className="w-full bg-white border border-reading-border text-reading-text py-3 rounded-2xl font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Preview Story
                </button>
              </div>
            </div>
          </div>

          {/* Story Info */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Title and Author */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-reading-text mb-4 font-crimson">
                  {story.title}
                </h1>
                
                <div className="flex items-center gap-4 mb-4">
                  <Link 
                    href={`/authors/${story.author.id}`}
                    className="flex items-center gap-3 hover:bg-primary-50 p-2 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-reading-text">{story.author.name}</span>
                        {story.author.verified && (
                          <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-reading-muted">{formatNumber(story.author.followers)} followers</p>
                    </div>
                  </Link>
                  
                  <button 
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      isFollowing 
                        ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' 
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-reading-muted">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent-amber fill-current" />
                    <span className="font-medium">{story.rating.toFixed(1)}</span>
                    <span>({formatNumber(story.ratingCount)} ratings)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{formatNumber(story.views)} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{formatNumber(story.likes)} likes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bookmark className="w-4 h-4" />
                    <span>{formatNumber(story.bookmarks)} bookmarks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{formatNumber(story.comments)} comments</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-lg text-reading-text leading-relaxed">
                  {story.description}
                </p>
              </div>

              {/* Genres and Tags */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-reading-text mb-2">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {story.genre.map(genre => (
                      <span key={genre} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-reading-text mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {story.tags.map(tag => (
                      <span key={tag} className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-sm font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Story Details */}
              <div className="grid md:grid-cols-2 gap-6 p-6 bg-white rounded-2xl border border-reading-border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-reading-muted">Chapters</span>
                    <span className="font-medium text-reading-text">{story.chapters.length} / {story.totalChapters}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-reading-muted">Read Time</span>
                    <span className="font-medium text-reading-text">{story.readTime} minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-reading-muted">Language</span>
                    <span className="font-medium text-reading-text">{story.language}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-reading-muted">Published</span>
                    <span className="font-medium text-reading-text">{formatDate(story.publishedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-reading-muted">Last Updated</span>
                    <span className="font-medium text-reading-text">{formatDate(story.lastUpdated)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-reading-muted">Completion Rate</span>
                    <span className="font-medium text-reading-text">{story.completionRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-reading-border mb-8">
          <div className="flex space-x-8">
            {[
              { key: 'chapters', label: 'Chapters', count: story.chapters.length },
              { key: 'reviews', label: 'Reviews', count: story.ratingCount },
              { key: 'about', label: 'About' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-reading-muted hover:text-reading-text'
                }`}
              >
                {tab.label}
                {tab.count && (
                  <span className="ml-2 bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full text-xs">
                    {formatNumber(tab.count)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'chapters' && <ChaptersList story={story} />}
          {activeTab === 'reviews' && <ReviewsSection story={story} />}
          {activeTab === 'about' && <AboutSection story={story} />}
        </div>
      </div>

      {/* Preview Modal */}
      <StoryPreviewModal 
        story={story} 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)} 
      />
    </div>
  );
}
// Chapters List Component
function ChaptersList({ story }: { story: Story }) {
  return (
    <div className="space-y-4">
      {story.chapters.map((chapter, index) => (
        <motion.div
          key={chapter.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white rounded-2xl border border-reading-border overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                    Chapter {chapter.number}
                  </span>
                  {chapter.isLocked && (
                    <span className="bg-accent-amber text-white px-3 py-1 rounded-full text-sm font-medium">
                      Premium ${chapter.price}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-reading-text mb-2 font-crimson">
                  {chapter.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-reading-muted">
                  <span>{chapter.wordCount.toLocaleString()} words</span>
                  <span>{chapter.readTime} min read</span>
                  <span>Published {formatDate(chapter.publishedAt)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {chapter.isLocked ? (
                  <button className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
                    Unlock ${chapter.price}
                  </button>
                ) : (
                  <Link
                    href={`/stories/${story.id}/chapters/${chapter.id}`}
                    className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Read
                  </Link>
                )}
              </div>
            </div>
            
            {chapter.preview && (
              <div className="bg-neutral-50 p-4 rounded-xl">
                <p className="text-reading-muted text-sm italic">
                  "{chapter.preview}..."
                </p>
              </div>
            )}
          </div>
        </motion.div>
      ))}
      
      {story.chapters.length < story.totalChapters && (
        <div className="text-center py-8">
          <div className="bg-white rounded-2xl border border-reading-border p-8">
            <Clock className="w-12 h-12 text-primary-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-reading-text mb-2">More chapters coming soon!</h3>
            <p className="text-reading-muted">
              {story.totalChapters - story.chapters.length} more chapters planned
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Reviews Section Component
function ReviewsSection({ story }: { story: Story }) {
  const [reviews] = useState([
    {
      id: '1',
      user: { name: 'Alex Johnson', avatar: '', verified: false },
      rating: 5,
      comment: 'Absolutely incredible story! The world-building is phenomenal and the characters feel so real.',
      date: '2024-01-20',
      likes: 23,
    },
    {
      id: '2',
      user: { name: 'Maria Santos', avatar: '', verified: true },
      rating: 4,
      comment: 'Great concept and execution. Looking forward to seeing where this goes!',
      date: '2024-01-18',
      likes: 15,
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <div className="bg-white rounded-2xl border border-reading-border p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-reading-text mb-2">{story.rating.toFixed(1)}</div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  className={`w-5 h-5 ${star <= story.rating ? 'text-accent-amber fill-current' : 'text-neutral-300'}`} 
                />
              ))}
            </div>
            <p className="text-reading-muted">{formatNumber(story.ratingCount)} ratings</p>
          </div>
          
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm text-reading-muted w-8">{rating}★</span>
                <div className="flex-1 bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-accent-amber h-2 rounded-full" 
                    style={{ width: `${Math.random() * 80 + 10}%` }}
                  />
                </div>
                <span className="text-sm text-reading-muted w-12">{Math.floor(Math.random() * 500)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-reading-border p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-reading-text">{review.user.name}</span>
                  {review.user.verified && (
                    <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                  <span className="text-reading-muted text-sm">•</span>
                  <span className="text-reading-muted text-sm">{formatDate(review.date)}</span>
                </div>
                
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${star <= review.rating ? 'text-accent-amber fill-current' : 'text-neutral-300'}`} 
                    />
                  ))}
                </div>
                
                <p className="text-reading-text mb-3">{review.comment}</p>
                
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-reading-muted hover:text-reading-text transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">{review.likes}</span>
                  </button>
                  <button className="text-reading-muted hover:text-reading-text transition-colors">
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Write Review */}
      <div className="bg-white rounded-2xl border border-reading-border p-6">
        <h3 className="text-lg font-semibold text-reading-text mb-4">Write a Review</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-reading-text mb-2">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} className="text-neutral-300 hover:text-accent-amber transition-colors">
                  <Star className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-reading-text mb-2">Comment</label>
            <textarea 
              className="w-full p-3 border border-reading-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
              rows={4}
              placeholder="Share your thoughts about this story..."
            />
          </div>
          <button className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

// About Section Component
function AboutSection({ story }: { story: Story }) {
  return (
    <div className="space-y-8">
      {/* Story Summary */}
      <div className="bg-white rounded-2xl border border-reading-border p-6">
        <h3 className="text-xl font-semibold text-reading-text mb-4 font-crimson">Story Summary</h3>
        <p className="text-reading-text leading-relaxed">{story.summary}</p>
      </div>

      {/* Author Info */}
      <div className="bg-white rounded-2xl border border-reading-border p-6">
        <h3 className="text-xl font-semibold text-reading-text mb-4 font-crimson">About the Author</h3>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-lg font-semibold text-reading-text">{story.author.name}</h4>
              {story.author.verified && (
                <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-reading-muted mb-3">
              <span>{formatNumber(story.author.followers)} followers</span>
              <span>{story.author.storiesCount} stories</span>
              <span>Joined {formatDate(story.author.joinedDate)}</span>
            </div>
            <p className="text-reading-text">{story.author.bio}</p>
            <div className="mt-4">
              <Link
                href={`/authors/${story.author.id}`}
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                View Profile
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content Warnings */}
      {story.warnings.length > 0 && (
        <div className="bg-accent-amber/10 border border-accent-amber/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-accent-amber mb-3">Content Warnings</h3>
          <div className="flex flex-wrap gap-2">
            {story.warnings.map(warning => (
              <span key={warning} className="bg-accent-amber/20 text-accent-amber px-3 py-1 rounded-full text-sm font-medium">
                {warning}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Story Statistics */}
      <div className="bg-white rounded-2xl border border-reading-border p-6">
        <h3 className="text-xl font-semibold text-reading-text mb-4 font-crimson">Statistics</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">{formatNumber(story.views)}</div>
            <div className="text-sm text-reading-muted">Total Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-rose mb-1">{formatNumber(story.likes)}</div>
            <div className="text-sm text-reading-muted">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-emerald mb-1">{formatNumber(story.bookmarks)}</div>
            <div className="text-sm text-reading-muted">Bookmarks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-amber mb-1">{story.completionRate}%</div>
            <div className="text-sm text-reading-muted">Completion Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Story Preview Modal Component
function StoryPreviewModal({ story, isOpen, onClose }: { story: Story; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-reading-border flex items-center justify-between">
            <h2 className="text-xl font-semibold text-reading-text font-crimson">Story Preview</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-reading-muted" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-reading-text mb-2">Chapter 1: The Glitch</h3>
                <div className="prose prose-reading max-w-none">
                  <p className="text-reading-text leading-relaxed">
                    Maya Chen stared at the holographic display floating inches from her face, the blue light casting ethereal shadows across her cramped apartment. The data streams flowed like digital waterfalls, each number a piece of the puzzle she'd been trying to solve for months.
                  </p>
                  <p className="text-reading-text leading-relaxed">
                    Something was wrong with the neural network. The patterns didn't match anything in the corporate databases, yet they felt familiar—hauntingly so. As she reached out to manipulate the data with her neural interface, a sharp pain shot through her skull.
                  </p>
                  <p className="text-reading-text leading-relaxed">
                    The world flickered.
                  </p>
                  <p className="text-reading-text leading-relaxed">
                    For a split second, Maya saw herself from the outside—sitting in a sterile white room, cables snaking from her skull to a massive computer terminal. Then reality snapped back, leaving her gasping in her familiar apartment.
                  </p>
                  <p className="text-reading-muted italic">
                    [Preview ends here. Unlock the full chapter to continue reading...]
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-reading-border">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-reading-border text-reading-text rounded-xl font-medium hover:bg-neutral-50 transition-colors"
              >
                Close Preview
              </button>
              <Link
                href={`/stories/${story.id}/chapters/${story.chapters[0]?.id}`}
                className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors text-center"
                onClick={onClose}
              >
                Start Reading
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}