'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  Eye, 
  MessageCircle, 
  DollarSign,
  Globe,
  Calendar,
  Film,
  Book,
  Tv,
  Music,
  Gamepad2,
  TrendingUp,
  Award,
  Users,
  Clock,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import { MarketplaceListing, Story } from '@/lib/types';

interface LicensingMarketplaceProps {
  userStories: Story[];
  onCreateListing: (storyId: string, listingData: any) => void;
  onContactLicensor: (listingId: string) => void;
}

export default function LicensingMarketplace({ 
  userStories, 
  onCreateListing, 
  onContactLicensor 
}: LicensingMarketplaceProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings'>('browse');
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    mediaType: '',
    priceRange: '',
    territory: '',
    exclusivity: '',
    genre: ''
  });
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'popular'>('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<string>('');

  useEffect(() => {
    loadMarketplaceListings();
  }, []);

  const loadMarketplaceListings = async () => {
    // Mock data - replace with actual API call
    const mockListings: MarketplaceListing[] = [
      {
        id: '1',
        storyId: 'story-1',
        story: {
          id: 'story-1',
          title: 'The Digital Nomad Chronicles',
          description: 'A thrilling adventure series following tech entrepreneurs across Africa',
          author: { id: 'author-1', username: 'techwriter', displayName: 'Tech Writer', verified: true },
          genre: ['Adventure', 'Technology', 'Drama'],
          tags: ['africa', 'startup', 'adventure'],
          status: 'completed',
          chapters: [],
          metadata: {
            language: 'English',
            wordCount: 85000,
            readTime: '6 hours',
            rating: 4.7,
            reviewCount: 234,
            viewCount: 15000,
            likeCount: 1200,
            bookmarkCount: 800,
            createdAt: '2024-01-15',
            updatedAt: '2024-03-10'
          },
          monetization: { type: 'premium', revenueShare: 70 },
          ipProtection: {
            id: 'ip-1',
            storyId: 'story-1',
            status: 'verified',
            registrationDate: '2024-01-20',
            protectionLevel: 'premium',
            forensicFingerprint: 'abc123def456',
            verificationStatus: {
              blockchain: true,
              timestamp: true,
              content: true,
              authorship: true,
              lastVerified: '2024-03-15'
            },
            licenseability: {
              available: true,
              exclusiveRights: true,
              territories: ['Global'],
              mediaTypes: ['Film', 'TV', 'Streaming'],
              duration: '5 years',
              minimumPrice: 50000
            }
          },
          stats: {
            totalViews: 15000,
            totalLikes: 1200,
            totalComments: 450,
            totalRevenue: 8500,
            averageRating: 4.7,
            completionRate: 0.85,
            retentionRate: 0.72
          }
        },
        listingType: 'license',
        price: 75000,
        currency: 'USD',
        availableRights: ['Film Rights', 'TV Series Rights', 'Streaming Rights'],
        territories: ['Global'],
        mediaTypes: ['Film', 'TV', 'Streaming'],
        exclusivity: true,
        duration: '5 years',
        description: 'Compelling tech startup story with strong African setting. Perfect for streaming series or feature film adaptation.',
        featured: true,
        createdAt: '2024-03-01',
        updatedAt: '2024-03-15',
        views: 1250,
        inquiries: 8
      }
    ];
    setListings(mockListings);
  };

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType.toLowerCase()) {
      case 'film':
        return <Film className="w-4 h-4" />;
      case 'tv':
        return <Tv className="w-4 h-4" />;
      case 'book':
        return <Book className="w-4 h-4" />;
      case 'music':
        return <Music className="w-4 h-4" />;
      case 'game':
        return <Gamepad2 className="w-4 h-4" />;
      default:
        return <Film className="w-4 h-4" />;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredListings = listings
    .filter(listing => {
      const matchesSearch = listing.story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           listing.story.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesMediaType = !filters.mediaType || listing.mediaTypes.includes(filters.mediaType);
      const matchesTerritory = !filters.territory || listing.territories.includes(filters.territory);
      const matchesGenre = !filters.genre || listing.story.genre.includes(filters.genre);
      
      return matchesSearch && matchesMediaType && matchesTerritory && matchesGenre;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'popular':
          return b.views - a.views;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Licensing Marketplace</h1>
          <p className="text-gray-600 mt-1">Discover and license stories for adaptation</p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Browse Listings
            </button>
            <button
              onClick={() => setActiveTab('my-listings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'my-listings'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Listings
            </button>
          </div>
          
          {activeTab === 'my-listings' && (
            <Button
              onClick={() => setShowCreateModal(true)}
              leftIcon={<TrendingUp className="w-4 h-4" />}
            >
              Create Listing
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search stories, genres, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filters.mediaType}
                    onChange={(e) => setFilters(prev => ({ ...prev, mediaType: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Media Types</option>
                    <option value="Film">Film</option>
                    <option value="TV">TV Series</option>
                    <option value="Streaming">Streaming</option>
                    <option value="Book">Book</option>
                    <option value="Audio">Audio</option>
                  </select>

                  <select
                    value={filters.territory}
                    onChange={(e) => setFilters(prev => ({ ...prev, territory: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Territories</option>
                    <option value="Global">Global</option>
                    <option value="North America">North America</option>
                    <option value="Europe">Europe</option>
                    <option value="Africa">Africa</option>
                    <option value="Asia">Asia</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="newest">Newest</option>
                    <option value="popular">Most Popular</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Story Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {listing.story.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          by {listing.story.author.displayName}
                          {listing.story.author.verified && (
                            <Award className="w-3 h-3 inline ml-1 text-blue-500" />
                          )}
                        </p>
                      </div>
                      {listing.featured && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {listing.description}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 mr-1 text-yellow-400" />
                        {listing.story.metadata.rating}
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {listing.views}
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {listing.inquiries}
                      </div>
                    </div>
                  </div>

                  {/* Licensing Details */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(listing.price, listing.currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {listing.duration}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="w-4 h-4 mr-2" />
                        {listing.territories.join(', ')}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="flex items-center mr-2">
                          {getMediaTypeIcon(listing.mediaTypes[0])}
                        </div>
                        {listing.mediaTypes.join(', ')}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        {listing.exclusivity ? 'Exclusive' : 'Non-exclusive'} rights
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {listing.story.genre.slice(0, 3).map((genre) => (
                        <span
                          key={genre}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        View Story
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        leftIcon={<MessageCircle className="w-4 h-4" />}
                        onClick={() => onContactLicensor(listing.id)}
                      >
                        Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
                <p className="text-gray-500">
                  {searchTerm || Object.values(filters).some(f => f) 
                    ? 'Try adjusting your search or filters'
                    : 'No stories are currently available for licensing'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* My Listings Tab */
        <Card>
          <CardHeader>
            <CardTitle>My Licensing Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first listing to start licensing your stories
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={<TrendingUp className="w-4 h-4" />}
              >
                Create Your First Listing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}