'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Clock, Star, BookOpen, Eye, Heart, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { apiService } from '@/lib/api';

interface Story {
  id: string;
  title: string;
  author: {
    id: string;
    name: string;
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
  isPremium: boolean;
  price?: number;
  trending?: boolean;
  featured?: boolean;
}

interface RecommendationSection {
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  stories: Story[];
  type: 'trending' | 'recommended' | 'featured' | 'new';
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default function PersonalizedRecommendations() {
  const [sections, setSections] = useState<RecommendationSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const [trending, recommended, featured] = await Promise.all([
          apiService.getTrendingStories(),
          apiService.getRecommendedStories(),
          apiService.getFeaturedStories(),
        ]);

        const recommendationSections: RecommendationSection[] = [
          {
            title: 'Trending Now',
            subtitle: 'Stories everyone is talking about',
            icon: TrendingUp,
            stories: (trending as any)?.stories || [],
            type: 'trending',
          },
          {
            title: 'Recommended for You',
            subtitle: 'Based on your reading history',
            icon: Sparkles,
            stories: (recommended as any)?.stories || [],
            type: 'recommended',
          },
          {
            title: 'Featured Stories',
            subtitle: 'Handpicked by our editors',
            icon: Star,
            stories: (featured as any)?.stories || [],
            type: 'featured',
          },
        ];

        setSections(recommendationSections.filter(section => section.stories.length > 0));
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        // Mock data fallback
        setSections([
          {
            title: 'Trending Now',
            subtitle: 'Stories everyone is talking about',
            icon: TrendingUp,
            stories: mockTrendingStories,
            type: 'trending',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-48 mb-4" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="flex-shrink-0 w-64">
                  <div className="aspect-[3/4] bg-neutral-200 rounded-2xl mb-3" />
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-12">
      {sections.map((section, sectionIndex) => (
        <motion.div
          key={section.type}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                section.type === 'trending' ? 'bg-accent-rose/10 text-accent-rose' :
                section.type === 'recommended' ? 'bg-primary-100 text-primary-600' :
                section.type === 'featured' ? 'bg-accent-amber/10 text-accent-amber' :
                'bg-accent-emerald/10 text-accent-emerald'
              }`}>
                <section.icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-reading-text font-crimson">
                  {section.title}
                </h2>
                <p className="text-reading-muted">{section.subtitle}</p>
              </div>
            </div>
            <Link
              href={`/stories?filter=${section.type}`}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {section.stories.slice(0, 6).map((story, index) => (
              <RecommendationCard
                key={story.id}
                story={story}
                index={index}
                type={section.type}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function RecommendationCard({ 
  story, 
  index, 
  type 
}: { 
  story: Story; 
  index: number; 
  type: string; 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="flex-shrink-0 w-64"
    >
      <Link href={`/stories/${story.id}`} className="group">
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-reading-border group-hover:-translate-y-1">
          {/* Cover Image */}
          <div className="aspect-[3/4] bg-gradient-to-br from-primary-100 to-primary-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-3 right-3 flex flex-col gap-1">
              {story.trending && (
                <div className="bg-accent-rose text-white px-2 py-1 rounded-full text-xs font-medium">
                  Trending
                </div>
              )}
              {story.featured && (
                <div className="bg-accent-amber text-white px-2 py-1 rounded-full text-xs font-medium">
                  Featured
                </div>
              )}
              {story.isPremium && (
                <div className="bg-primary-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Premium
                </div>
              )}
            </div>
            
            <div className="absolute bottom-3 left-3 right-3">
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                story.status === 'ongoing' ? 'bg-accent-emerald text-white' :
                story.status === 'completed' ? 'bg-primary-500 text-white' :
                'bg-accent-amber text-white'
              }`}>
                {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-reading-text mb-1 group-hover:text-primary-600 transition-colors font-crimson line-clamp-2">
                {story.title}
              </h3>
              <div className="flex items-center gap-2">
                <p className="text-reading-muted text-sm">by {story.author.name}</p>
                {story.author.verified && (
                  <div className="w-3 h-3 bg-primary-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </div>

            <p className="text-reading-muted text-sm mb-3 line-clamp-2">
              {story.description}
            </p>

            {/* Genres */}
            <div className="flex flex-wrap gap-1 mb-3">
              {story.genre.slice(0, 2).map(genre => (
                <span key={genre} className="bg-primary-50 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
                  {genre}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-reading-muted">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-accent-amber fill-current" />
                  <span>{story.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="w-3 h-3" />
                  <span>{story.chapters}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{formatNumber(story.views)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Mock data for fallback
const mockTrendingStories: Story[] = [
  {
    id: 'trending-1',
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
    isPremium: false,
    trending: true,
  },
  {
    id: 'trending-2',
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
    isPremium: true,
    price: 2.99,
    featured: true,
  },
];