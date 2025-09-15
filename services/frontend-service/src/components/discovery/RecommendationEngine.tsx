'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Clock, Star, BookOpen, Eye, Heart, ChevronRight, Users, Flame, Award, Filter } from 'lucide-react';
import Link from 'next/link';
import { apiService } from '@/lib/api';
import { Story, User } from '@/lib/types';

interface RecommendationData {
    personalizedStories: Story[];
    trendingStories: Story[];
    featuredStories: Story[];
    newReleases: Story[];
    friendActivity: FriendActivity[];
    popularChoices: PopularChoice[];
    curatedCollections: CuratedCollection[];
}

interface FriendActivity {
    id: string;
    user: User;
    action: 'read' | 'liked' | 'bookmarked' | 'reviewed';
    story: Story;
    timestamp: string;
}

interface PopularChoice {
    id: string;
    story: Story;
    readCount: number;
    likeCount: number;
    shareCount: number;
    trendingScore: number;
}

interface CuratedCollection {
    id: string;
    title: string;
    description: string;
    curator: string;
    stories: Story[];
    tags: string[];
    featured: boolean;
}

interface RecommendationFilters {
    genres: string[];
    languages: string[];
    readingTime: 'short' | 'medium' | 'long' | 'any';
    contentType: 'free' | 'premium' | 'all';
    status: 'ongoing' | 'completed' | 'all';
}

export default function RecommendationEngine() {
    const [data, setData] = useState<RecommendationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personalized' | 'trending' | 'social' | 'curated'>('personalized');
    const [filters, setFilters] = useState<RecommendationFilters>({
        genres: [],
        languages: [],
        readingTime: 'any',
        contentType: 'all',
        status: 'all'
    });
    const [showFilters, setShowFilters] = useState(false);

    const fetchRecommendations = useCallback(async () => {
        setLoading(true);
        try {
            // Use existing API methods and create mock data for missing endpoints
            const [recommended, trending, featured] = await Promise.all([
                apiService.getRecommendedStories(),
                apiService.getTrendingStories(),
                apiService.getFeaturedStories()
            ]);

            setData({
                personalizedStories: (recommended as any)?.stories || [],
                trendingStories: (trending as any)?.stories || [],
                featuredStories: (featured as any)?.stories || [],
                newReleases: [], // Mock data will be added
                friendActivity: [], // Mock data will be added
                popularChoices: [], // Mock data will be added
                curatedCollections: [] // Mock data will be added
            });
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
            // Fallback to mock data
            setData({
                personalizedStories: [],
                trendingStories: [],
                featuredStories: [],
                newReleases: [],
                friendActivity: [],
                popularChoices: [],
                curatedCollections: []
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);



    if (loading) {
        return (
            <div className="space-y-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-neutral-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-[3/4] bg-neutral-200 rounded-2xl mb-4"></div>
                            <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                            <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-reading-muted">Failed to load recommendations. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header with Filters */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-reading-text font-crimson">Discover Stories</h2>
                    <p className="text-reading-muted mt-1">Personalized recommendations just for you</p>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-reading-border rounded-xl hover:bg-neutral-50 transition-colors"
                >
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white border border-reading-border rounded-xl p-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-reading-text mb-2">Genres</label>
                            <select className="w-full px-3 py-2 border border-reading-border rounded-lg">
                                <option>All Genres</option>
                                <option>Romance</option>
                                <option>Fantasy</option>
                                <option>Mystery</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-reading-text mb-2">Language</label>
                            <select className="w-full px-3 py-2 border border-reading-border rounded-lg">
                                <option>All Languages</option>
                                <option>English</option>
                                <option>Spanish</option>
                                <option>French</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-reading-text mb-2">Content Type</label>
                            <select className="w-full px-3 py-2 border border-reading-border rounded-lg">
                                <option>All Content</option>
                                <option>Free</option>
                                <option>Premium</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-reading-text mb-2">Status</label>
                            <select className="w-full px-3 py-2 border border-reading-border rounded-lg">
                                <option>All Status</option>
                                <option>Ongoing</option>
                                <option>Completed</option>
                            </select>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-neutral-100 p-1 rounded-xl">
                {[
                    { id: 'personalized', label: 'For You', icon: Sparkles },
                    { id: 'trending', label: 'Trending', icon: TrendingUp },
                    { id: 'social', label: 'Social', icon: Users },
                    { id: 'curated', label: 'Curated', icon: Award }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-reading-muted hover:text-reading-text'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
                {activeTab === 'personalized' && (
                    <PersonalizedSection
                        stories={data.personalizedStories}
                        newReleases={data.newReleases}
                    />
                )}

                {activeTab === 'trending' && (
                    <TrendingSection
                        stories={data.trendingStories}
                        popularChoices={data.popularChoices}
                    />
                )}

                {activeTab === 'social' && (
                    <SocialSection
                        friendActivity={data.friendActivity}
                        popularChoices={data.popularChoices}
                    />
                )}

                {activeTab === 'curated' && (
                    <CuratedSection
                        collections={data.curatedCollections}
                        featured={data.featuredStories}
                    />
                )}
            </div>
        </div>
    );
}

// Personalized Section Component
function PersonalizedSection({ stories, newReleases }: { stories: Story[]; newReleases: Story[] }) {
    return (
        <div className="space-y-8">
            <RecommendationSection
                title="Recommended for You"
                subtitle="Based on your reading history and preferences"
                icon={Sparkles}
                stories={stories}
                type="personalized"
            />

            <RecommendationSection
                title="New Releases"
                subtitle="Fresh stories from your favorite genres"
                icon={Clock}
                stories={newReleases}
                type="new"
            />
        </div>
    );
}

// Trending Section Component
function TrendingSection({ stories, popularChoices }: { stories: Story[]; popularChoices: PopularChoice[] }) {
    return (
        <div className="space-y-8">
            <RecommendationSection
                title="Trending Now"
                subtitle="Stories everyone is talking about"
                icon={TrendingUp}
                stories={stories}
                type="trending"
            />

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-accent-rose/10 text-accent-rose">
                        <Flame className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-reading-text font-crimson">Popular This Week</h3>
                        <p className="text-reading-muted">Most read and loved stories</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {popularChoices.slice(0, 6).map((choice, index) => (
                        <div key={choice.id} className="bg-white rounded-xl p-4 border border-reading-border hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-accent-rose rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-reading-text">{choice.story.title}</h4>
                                    <p className="text-sm text-reading-muted">by {choice.story.author.displayName}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm text-reading-muted">
                                <span>{choice.readCount.toLocaleString()} reads</span>
                                <span>{choice.likeCount.toLocaleString()} likes</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Social Section Component
function SocialSection({ friendActivity, popularChoices }: { friendActivity: FriendActivity[]; popularChoices: PopularChoice[] }) {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary-100 text-primary-600">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-reading-text font-crimson">Friend Activity</h3>
                        <p className="text-reading-muted">See what your friends are reading</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {friendActivity.slice(0, 5).map(activity => (
                        <div key={activity.id} className="bg-white rounded-xl p-4 border border-reading-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    <span className="text-primary-600 font-semibold text-sm">
                                        {activity.user.displayName.charAt(0)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-reading-text">
                                        <span className="font-semibold">{activity.user.displayName}</span>
                                        {' '}
                                        {activity.action === 'read' ? 'started reading' :
                                            activity.action === 'liked' ? 'liked' :
                                                activity.action === 'bookmarked' ? 'bookmarked' :
                                                    'reviewed'}
                                        {' '}
                                        <span className="font-semibold">{activity.story.title}</span>
                                    </p>
                                    <p className="text-xs text-reading-muted">{activity.timestamp}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-accent-emerald/10 text-accent-emerald">
                        <Heart className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-reading-text font-crimson">Community Favorites</h3>
                        <p className="text-reading-muted">Stories loved by the community</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {popularChoices.slice(0, 4).map(choice => (
                        <div key={choice.id} className="bg-white rounded-xl p-4 border border-reading-border hover:shadow-lg transition-shadow">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex-shrink-0"></div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-reading-text mb-1">{choice.story.title}</h4>
                                    <p className="text-sm text-reading-muted mb-2">by {choice.story.author.displayName}</p>
                                    <div className="flex items-center gap-4 text-xs text-reading-muted">
                                        <span className="flex items-center gap-1">
                                            <Heart className="w-3 h-3" />
                                            {choice.likeCount.toLocaleString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {choice.readCount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Curated Section Component
function CuratedSection({ collections, featured }: { collections: CuratedCollection[]; featured: Story[] }) {
    return (
        <div className="space-y-8">
            <RecommendationSection
                title="Editor's Choice"
                subtitle="Handpicked stories by our editorial team"
                icon={Award}
                stories={featured}
                type="featured"
            />

            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-accent-amber/10 text-accent-amber">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-reading-text font-crimson">Curated Collections</h3>
                        <p className="text-reading-muted">Themed story collections</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map(collection => (
                        <div key={collection.id} className="bg-white rounded-xl p-6 border border-reading-border hover:shadow-lg transition-shadow">
                            <div className="mb-4">
                                <h4 className="font-bold text-reading-text mb-2">{collection.title}</h4>
                                <p className="text-sm text-reading-muted mb-3">{collection.description}</p>
                                <p className="text-xs text-reading-muted">Curated by {collection.curator}</p>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-4">
                                {collection.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="bg-accent-amber/10 text-accent-amber px-2 py-1 rounded-full text-xs">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="text-sm text-reading-muted">
                                {collection.stories.length} stories
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Recommendation Section Component
function RecommendationSection({
    title,
    subtitle,
    icon: Icon,
    stories,
    type
}: {
    title: string;
    subtitle: string;
    icon: React.ComponentType<any>;
    stories: Story[];
    type: string;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${type === 'trending' ? 'bg-accent-rose/10 text-accent-rose' :
                            type === 'personalized' ? 'bg-primary-100 text-primary-600' :
                                type === 'featured' ? 'bg-accent-amber/10 text-accent-amber' :
                                    'bg-accent-emerald/10 text-accent-emerald'
                        }`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-reading-text font-crimson">{title}</h3>
                        <p className="text-reading-muted">{subtitle}</p>
                    </div>
                </div>
                <Link
                    href={`/stories?filter=${type}`}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                    View all
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {stories.slice(0, 6).map((story, index) => (
                    <StoryCard key={story.id} story={story} index={index} />
                ))}
            </div>
        </div>
    );
}

// Story Card Component
function StoryCard({ story, index }: { story: Story; index: number }) {
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

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${story.status === 'published' ? 'bg-accent-emerald text-white' :
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
                            <h4 className="text-lg font-bold text-reading-text mb-1 group-hover:text-primary-600 transition-colors font-crimson line-clamp-2">
                                {story.title}
                            </h4>
                            <div className="flex items-center gap-2">
                                <p className="text-reading-muted text-sm">by {story.author.displayName}</p>
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
                                    <span>{story.metadata.rating.toFixed(1)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <BookOpen className="w-3 h-3" />
                                    <span>{story.chapters.length}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{story.metadata.viewCount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}