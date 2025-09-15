'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Search, Filter, BookOpen, Star, Clock, Eye, Heart, Sparkles, SlidersHorizontal, X, TrendingUp, Users, Award } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import { apiService } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

// Utility function to format numbers (e.g., 1000 -> 1K, 1000000 -> 1M)
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

interface Story {
  id: string;
  title: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  description: string;
  coverImage: string;
  genre: string[];
  rating: number;
  chapters: number;
  views: number;
  likes: number;
  status: 'ongoing' | 'completed' | 'hiatus';
  lastUpdated: string;
  tags: string[];
  isPremium: boolean;
  price?: number;
  language: string;
  readTime: number; // in minutes
  completionRate: number; // percentage
  trending?: boolean;
  featured?: boolean;
  publishedAt: string;
}

interface FilterOptions {
  genres: string[];
  languages: string[];
  status: string[];
  priceRange: [number, number];
  rating: number;
  sortBy: 'popular' | 'newest' | 'rating' | 'trending' | 'updated';
  showPremiumOnly: boolean;
  showFreeOnly: boolean;
}

interface SearchSuggestion {
  type: 'story' | 'author' | 'genre' | 'tag';
  value: string;
  count?: number;
}

const mockStories: Story[] = [
  {
    id: '1',
    title: 'The Digital Awakening',
    author: { id: 'author1', name: 'Sarah Chen', verified: true },
    description: 'In a world where consciousness can be digitized, Maya discovers she might not be human after all.',
    coverImage: '/covers/digital-awakening.jpg',
    genre: ['Sci-Fi', 'Thriller'],
    rating: 4.8,
    chapters: 45,
    views: 125000,
    likes: 8900,
    status: 'ongoing',
    lastUpdated: '2 days ago',
    tags: ['AI', 'Cyberpunk', 'Thriller'],
    isPremium: false,
    language: 'English',
    readTime: 180,
    completionRate: 85,
    trending: true,
    publishedAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Hearts in Lagos',
    author: { id: 'author2', name: 'Adebayo Okafor', verified: false },
    description: 'A romantic tale set in modern Lagos, where tradition meets contemporary love.',
    coverImage: '/covers/hearts-lagos.jpg',
    genre: ['Romance', 'Drama'],
    rating: 4.6,
    chapters: 32,
    views: 89000,
    likes: 6700,
    status: 'completed',
    lastUpdated: '1 week ago',
    tags: ['Contemporary', 'African', 'Drama'],
    isPremium: true,
    price: 2.99,
    language: 'English',
    readTime: 120,
    completionRate: 92,
    featured: true,
    publishedAt: '2024-02-01',
  },
  {
    id: '3',
    title: 'The Last Mage',
    author: { id: 'author3', name: 'Elena Rodriguez', verified: true },
    description: 'When magic fades from the world, one young mage must find a way to restore it.',
    coverImage: '/covers/last-mage.jpg',
    genre: ['Fantasy', 'Adventure'],
    rating: 4.9,
    chapters: 28,
    views: 156000,
    likes: 12400,
    status: 'ongoing',
    lastUpdated: '3 days ago',
    tags: ['Magic', 'Adventure', 'Coming of Age'],
    isPremium: false,
    language: 'English',
    readTime: 140,
    completionRate: 88,
    trending: true,
    publishedAt: '2024-01-20',
  },
  {
    id: '4',
    title: 'Midnight in Mumbai',
    author: { id: 'author4', name: 'Priya Sharma', verified: false },
    description: 'A detective story set in the bustling streets of Mumbai, where every shadow hides a secret.',
    coverImage: '/covers/midnight-mumbai.jpg',
    genre: ['Mystery', 'Thriller'],
    rating: 4.7,
    chapters: 38,
    views: 94000,
    likes: 7200,
    status: 'completed',
    lastUpdated: '5 days ago',
    tags: ['Detective', 'Urban', 'Suspense'],
    isPremium: true,
    price: 1.99,
    language: 'English',
    readTime: 160,
    completionRate: 90,
    publishedAt: '2024-01-10',
  },
  // Add more mock stories for infinite scroll testing
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `story-${i + 5}`,
    title: `Story Title ${i + 5}`,
    author: { id: `author-${i + 5}`, name: `Author ${i + 5}`, verified: Math.random() > 0.5 },
    description: `This is a compelling description for story ${i + 5} that will captivate readers.`,
    coverImage: `/covers/story-${i + 5}.jpg`,
    genre: [['Romance', 'Fantasy', 'Sci-Fi', 'Mystery', 'Thriller'][Math.floor(Math.random() * 5)]],
    rating: 3.5 + Math.random() * 1.5,
    chapters: Math.floor(Math.random() * 50) + 10,
    views: Math.floor(Math.random() * 200000) + 10000,
    likes: Math.floor(Math.random() * 15000) + 1000,
    status: ['ongoing', 'completed', 'hiatus'][Math.floor(Math.random() * 3)] as 'ongoing' | 'completed' | 'hiatus',
    lastUpdated: `${Math.floor(Math.random() * 30) + 1} days ago`,
    tags: ['Tag1', 'Tag2', 'Tag3'].slice(0, Math.floor(Math.random() * 3) + 1),
    isPremium: Math.random() > 0.6,
    price: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 0.99 : undefined,
    language: 'English',
    readTime: Math.floor(Math.random() * 200) + 60,
    completionRate: Math.floor(Math.random() * 30) + 70,
    trending: Math.random() > 0.8,
    publishedAt: `2024-0${Math.floor(Math.random() * 2) + 1}-${Math.floor(Math.random() * 28) + 1}`,
  }))
];

const mockSuggestions: SearchSuggestion[] = [
  { type: 'story', value: 'The Digital Awakening' },
  { type: 'author', value: 'Sarah Chen' },
  { type: 'genre', value: 'Sci-Fi', count: 45 },
  { type: 'tag', value: 'AI', count: 23 },
  { type: 'tag', value: 'Romance', count: 67 },
];

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [displayedStories, setDisplayedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    genres: [],
    languages: [],
    status: [],
    priceRange: [0, 10],
    rating: 0,
    sortBy: 'popular',
    showPremiumOnly: false,
    showFreeOnly: false,
  });

  const genres = ['Romance', 'Sci-Fi', 'Fantasy', 'Mystery', 'Drama', 'Thriller', 'Adventure', 'Horror', 'Comedy'];
  const languages = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Hindi'];
  const statusOptions = ['ongoing', 'completed', 'hiatus'];

  // Fetch initial stories
  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        const response = await apiService.getStories({ page: 1, limit: 12 });
        const fetchedStories = (response as any)?.stories || mockStories.slice(0, 12);
        setStories(fetchedStories);
        setDisplayedStories(fetchedStories);
      } catch (error) {
        console.error('Failed to fetch stories from API, using mock data:', error);
        await new Promise(resolve => setTimeout(resolve, 800));
        const initialStories = mockStories.slice(0, 12);
        setStories(initialStories);
        setDisplayedStories(initialStories);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreStories();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  const loadMoreStories = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await apiService.getStories({ page: nextPage, limit: 12 });
      const newStories = (response as any)?.stories || mockStories.slice(nextPage * 12 - 12, nextPage * 12);
      
      if (newStories.length === 0) {
        setHasMore(false);
      } else {
        setStories(prev => [...prev, ...newStories]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more stories:', error);
      // Simulate loading more from mock data
      const newStories = mockStories.slice(page * 12, (page + 1) * 12);
      if (newStories.length === 0) {
        setHasMore(false);
      } else {
        setStories(prev => [...prev, ...newStories]);
        setPage(prev => prev + 1);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore]);

  // Search suggestions
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (value.length > 2) {
      // Simulate API call for suggestions
      const filteredSuggestions = mockSuggestions.filter(s => 
        s.value.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  // Apply filters and search
  const filteredStories = useMemo(() => {
    let filtered = stories.filter(story => {
      // Search filter
      const matchesSearch = !searchTerm || 
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Genre filter
      const matchesGenre = filters.genres.length === 0 || 
        filters.genres.some(genre => story.genre.includes(genre));

      // Language filter
      const matchesLanguage = filters.languages.length === 0 || 
        filters.languages.includes(story.language);

      // Status filter
      const matchesStatus = filters.status.length === 0 || 
        filters.status.includes(story.status);

      // Price filter
      const matchesPrice = (!filters.showPremiumOnly || story.isPremium) &&
        (!filters.showFreeOnly || !story.isPremium);

      // Rating filter
      const matchesRating = story.rating >= filters.rating;

      return matchesSearch && matchesGenre && matchesLanguage && matchesStatus && matchesPrice && matchesRating;
    });

    // Sort stories
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'trending':
        filtered.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
        break;
      case 'updated':
        filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
      default: // popular
        filtered.sort((a, b) => b.views - a.views);
    }

    return filtered;
  }, [stories, searchTerm, filters]);

  // Update displayed stories when filters change
  useEffect(() => {
    setDisplayedStories(filteredStories);
  }, [filteredStories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-reading-bg p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <LoadingSpinner size="lg" className="mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-reading-text mb-2">Discovering Stories</h2>
            <p className="text-reading-muted">Finding the perfect tales for you...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-reading-bg">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-reading-text mb-4 font-crimson">
              Discover Amazing Stories
            </h1>
            <p className="text-xl text-reading-muted max-w-2xl mx-auto">
              Immerse yourself in captivating tales from talented writers around the world
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Personalized Recommendations */}
        <div className="mb-12">
          <PersonalizedRecommendations />
        </div>

        {/* Enhanced Search and Filters */}
        <div className="mb-10 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-reading-muted z-10" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search stories, authors, genres, or tags..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchTerm.length > 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-reading-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-reading-text placeholder-reading-muted"
              />
              
              {/* Search Suggestions */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 bg-white border border-reading-border rounded-2xl shadow-lg mt-2 z-20 max-h-64 overflow-y-auto"
                  >
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchTerm(suggestion.value);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-primary-50 flex items-center gap-3 border-b border-reading-border last:border-b-0"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          suggestion.type === 'story' ? 'bg-primary-500' :
                          suggestion.type === 'author' ? 'bg-accent-emerald' :
                          suggestion.type === 'genre' ? 'bg-accent-amber' :
                          'bg-accent-rose'
                        }`} />
                        <span className="text-reading-text">{suggestion.value}</span>
                        {suggestion.count && (
                          <span className="text-reading-muted text-sm ml-auto">{suggestion.count}</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-4 border rounded-2xl transition-colors flex items-center justify-center gap-2 font-medium ${
                  showFilters 
                    ? 'bg-primary-500 text-white border-primary-500' 
                    : 'bg-white border-reading-border text-reading-text hover:bg-primary-50'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filters
              </button>
            </div>
          </div>

          {/* Quick Sort Options */}
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'popular', label: 'Popular', icon: TrendingUp },
              { key: 'newest', label: 'Newest', icon: Clock },
              { key: 'rating', label: 'Top Rated', icon: Star },
              { key: 'trending', label: 'Trending', icon: Sparkles },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilters(prev => ({ ...prev, sortBy: key as any }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  filters.sortBy === key
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-white text-reading-text hover:bg-primary-100 border border-reading-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-2xl border border-reading-border shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-reading-text">Advanced Filters</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-reading-muted" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Genre Filter */}
                    <div>
                      <h4 className="font-medium text-reading-text mb-3">Genres</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {genres.map(genre => (
                          <label key={genre} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.genres.includes(genre)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters(prev => ({ ...prev, genres: [...prev.genres, genre] }));
                                } else {
                                  setFilters(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }));
                                }
                              }}
                              className="rounded border-reading-border text-primary-500 focus:ring-primary-400"
                            />
                            <span className="text-sm text-reading-text">{genre}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <h4 className="font-medium text-reading-text mb-3">Status</h4>
                      <div className="space-y-2">
                        {statusOptions.map(status => (
                          <label key={status} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.status.includes(status)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters(prev => ({ ...prev, status: [...prev.status, status] }));
                                } else {
                                  setFilters(prev => ({ ...prev, status: prev.status.filter(s => s !== status) }));
                                }
                              }}
                              className="rounded border-reading-border text-primary-500 focus:ring-primary-400"
                            />
                            <span className="text-sm text-reading-text capitalize">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Price and Rating Filters */}
                    <div>
                      <h4 className="font-medium text-reading-text mb-3">Price & Rating</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.showFreeOnly}
                            onChange={(e) => setFilters(prev => ({ 
                              ...prev, 
                              showFreeOnly: e.target.checked,
                              showPremiumOnly: e.target.checked ? false : prev.showPremiumOnly
                            }))}
                            className="rounded border-reading-border text-primary-500 focus:ring-primary-400"
                          />
                          <span className="text-sm text-reading-text">Free only</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.showPremiumOnly}
                            onChange={(e) => setFilters(prev => ({ 
                              ...prev, 
                              showPremiumOnly: e.target.checked,
                              showFreeOnly: e.target.checked ? false : prev.showFreeOnly
                            }))}
                            className="rounded border-reading-border text-primary-500 focus:ring-primary-400"
                          />
                          <span className="text-sm text-reading-text">Premium only</span>
                        </label>
                        <div>
                          <label className="block text-sm text-reading-text mb-2">
                            Minimum Rating: {filters.rating.toFixed(1)}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.1"
                            value={filters.rating}
                            onChange={(e) => setFilters(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-reading-border">
                    <button
                      onClick={() => setFilters({
                        genres: [],
                        languages: [],
                        status: [],
                        priceRange: [0, 10],
                        rating: 0,
                        sortBy: 'popular',
                        showPremiumOnly: false,
                        showFreeOnly: false,
                      })}
                      className="text-reading-muted hover:text-reading-text transition-colors"
                    >
                      Clear all filters
                    </button>
                    <div className="text-sm text-reading-muted">
                      {displayedStories.length} stories found
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stories Grid with Virtual Scrolling */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {displayedStories.map((story, index) => (
            <StoryCard key={story.id} story={story} index={index} />
          ))}
        </div>

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="text-center py-8">
            <LoadingSpinner size="md" className="mx-auto mb-4" />
            <p className="text-reading-muted">Loading more stories...</p>
          </div>
        )}

        {/* Infinite Scroll Observer */}
        <div ref={observerRef} className="h-4" />

        {/* No Results */}
        {displayedStories.length === 0 && !loading && (
          <div className="text-center py-20">
            <BookOpen className="w-20 h-20 text-primary-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-reading-text mb-3">No stories found</h3>
            <p className="text-reading-muted text-lg">Try adjusting your search or explore different genres</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StoryCard({ story, index }: { story: Story; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (index || 0) * 0.1 }}
    >
      <Link href={`/stories/${story.id}`} className="group">
        <div className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-reading-border group-hover:-translate-y-2">
          {/* Cover Image */}
          <div className="aspect-[3/4] bg-gradient-to-br from-primary-100 to-primary-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {story.trending && (
                <div className="bg-accent-rose text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Trending
                </div>
              )}
              {story.featured && (
                <div className="bg-accent-amber text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Featured
                </div>
              )}
              {story.isPremium && (
                <div className="bg-primary-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Premium {story.price && `$${story.price}`}
                </div>
              )}
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                story.status === 'ongoing' ? 'bg-accent-emerald text-white' :
                story.status === 'completed' ? 'bg-primary-500 text-white' :
                'bg-accent-amber text-white'
              }`}>
                {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
              </div>
              
              <div className="text-white text-xs bg-black/50 px-2 py-1 rounded-full">
                {story.readTime}min read
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-3">
              <h3 className="text-xl font-bold text-reading-text mb-1 group-hover:text-primary-600 transition-colors font-crimson line-clamp-2">
                {story.title}
              </h3>
              <div className="flex items-center gap-2">
                <p className="text-reading-muted font-medium">by {story.author.name}</p>
                {story.author.verified && (
                  <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </div>

            <p className="text-reading-muted text-sm mb-4 line-clamp-3">
              {story.description}
            </p>

            {/* Genres and Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {story.genre.slice(0, 2).map(genre => (
                <span key={genre} className="bg-primary-50 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
                  {genre}
                </span>
              ))}
              {story.tags.slice(0, 1).map(tag => (
                <span key={tag} className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-reading-muted">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-accent-amber fill-current" />
                  <span className="font-medium">{story.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{story.chapters}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{formatNumber(story.views)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4 text-accent-rose" />
                  <span>{formatNumber(story.likes)}</span>
                </div>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="mt-3 pt-3 border-t border-reading-border">
              <div className="flex items-center justify-between text-xs text-reading-muted">
                <span>Completion Rate</span>
                <span>{story.completionRate}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${story.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}