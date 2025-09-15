import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '@/lib/api';

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
  readTime: number;
  completionRate: number;
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

export function useStoryDiscovery() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch initial stories
  const fetchStories = useCallback(async (resetPage = false) => {
    const currentPage = resetPage ? 1 : page;
    setLoading(resetPage);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: 12,
        genre: filters.genres.length > 0 ? filters.genres : undefined,
        search: searchTerm || undefined,
        sortBy: filters.sortBy,
        status: filters.status.length > 0 ? filters.status : undefined,
        language: filters.languages.length > 0 ? filters.languages : undefined,
        minRating: filters.rating > 0 ? filters.rating : undefined,
        isPremium: filters.showPremiumOnly ? true : filters.showFreeOnly ? false : undefined,
      };

      const response = await apiService.getStories(params);
      const fetchedStories = (response as any)?.stories || [];

      if (resetPage) {
        setStories(fetchedStories);
        setPage(1);
      } else {
        setStories(prev => [...prev, ...fetchedStories]);
      }

      setHasMore(fetchedStories.length === 12);
    } catch (err) {
      setError('Failed to fetch stories');
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, filters, searchTerm]);

  // Load more stories for infinite scroll
  const loadMoreStories = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    setPage(prev => prev + 1);
  }, [loadingMore, hasMore]);

  // Fetch search suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await apiService.getSearchSuggestions(query);
      setSuggestions((response as any)?.suggestions || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    }
  }, []);

  // Update search term and fetch suggestions
  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
    fetchSuggestions(term);
  }, [fetchSuggestions]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      genres: [],
      languages: [],
      status: [],
      priceRange: [0, 10],
      rating: 0,
      sortBy: 'popular',
      showPremiumOnly: false,
      showFreeOnly: false,
    });
  }, []);

  // Apply filters and search (trigger refetch)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStories(true);
    }, 300); // Debounce

    return () => clearTimeout(timeoutId);
  }, [filters, searchTerm]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchStories(false);
    }
  }, [page]);

  // Filter stories client-side for immediate feedback
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
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
  }, [stories, searchTerm, filters]);

  return {
    stories: filteredStories,
    loading,
    loadingMore,
    searchTerm,
    suggestions,
    hasMore,
    error,
    filters,
    updateSearchTerm,
    updateFilters,
    resetFilters,
    loadMoreStories,
    refetch: () => fetchStories(true),
  };
}