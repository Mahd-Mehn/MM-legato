'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Star, BookOpen, Heart, Download, Filter, Search, Grid, List } from 'lucide-react';
import Link from 'next/link';

export default function LibraryPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'favorites' | 'bookmarks' | 'downloaded'>('favorites');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your library...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Mock data for demonstration
  const libraryItems = [
    {
      id: '1',
      title: 'The Digital Nomad\'s Journey',
      author: 'Sarah Chen',
      genre: 'Adventure',
      rating: 4.8,
      chapters: 15,
      status: 'completed',
      addedDate: '2024-01-15',
      coverUrl: null
    },
    {
      id: '2',
      title: 'Mysteries of the Ancient Code',
      author: 'Marcus Rodriguez', 
      genre: 'Mystery',
      rating: 4.6,
      chapters: 12,
      status: 'reading',
      addedDate: '2024-01-10',
      coverUrl: null
    },
    {
      id: '3',
      title: 'Love in the Time of AI',
      author: 'Emma Thompson',
      genre: 'Romance',
      rating: 4.9,
      chapters: 18,
      status: 'bookmarked',
      addedDate: '2024-01-08',
      coverUrl: null
    }
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case 'favorites':
        return libraryItems.filter(item => item.rating >= 4.5);
      case 'bookmarks':
        return libraryItems.filter(item => item.status === 'bookmarked');
      case 'downloaded':
        return []; // No downloaded items for demo
      default:
        return libraryItems;
    }
  };

  const tabContent = getTabContent();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Star className="w-8 h-8 text-primary-600" />
                <h1 className="text-3xl font-bold text-gray-900">My Library</h1>
              </div>
              <p className="text-gray-600">
                Your personal collection of favorite stories and bookmarks
              </p>
            </div>
            
            {/* View toggle */}
            <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {libraryItems.filter(item => item.rating >= 4.5).length}
                </p>
                <p className="text-sm text-gray-600">Favorites</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {libraryItems.filter(item => item.status === 'bookmarked').length}
                </p>
                <p className="text-sm text-gray-600">Bookmarked</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Download className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Downloaded</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Star className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
                <p className="text-sm text-gray-600">Avg Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'favorites'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Favorites
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'bookmarks'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bookmarks
              </button>
              <button
                onClick={() => setActiveTab('downloaded')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'downloaded'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Downloaded
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search library..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-5 h-5" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Content */}
          {tabContent.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {tabContent.map((item) => (
                <div key={item.id} className={viewMode === 'grid' 
                  ? 'border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200'
                  : 'flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200'
                }>
                  {/* Cover */}
                  <div className={`bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    viewMode === 'grid' ? 'w-full h-48 mb-4' : 'w-16 h-20'
                  }`}>
                    <BookOpen className={`text-white ${viewMode === 'grid' ? 'w-12 h-12' : 'w-6 h-6'}`} />
                  </div>
                  
                  {/* Info */}
                  <div className={viewMode === 'grid' ? '' : 'flex-1 min-w-0'}>
                    <h3 className={`font-semibold text-gray-900 ${viewMode === 'list' ? 'truncate' : 'mb-2'}`}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">by {item.author}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="bg-gray-100 px-2 py-1 rounded">{item.genre}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span>{item.rating}</span>
                      </div>
                      <span>{item.chapters} chapters</span>
                    </div>
                    
                    <div className={`flex items-center ${viewMode === 'grid' ? 'justify-between' : 'space-x-4'}`}>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'reading' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                      
                      <Link
                        href={`/stories/${item.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        {item.status === 'completed' ? 'Read Again' : 'Continue'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {activeTab === 'favorites' && (
                <>
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                  <p className="text-gray-600 mb-6">Heart stories you love to add them to your favorites</p>
                </>
              )}
              {activeTab === 'bookmarks' && (
                <>
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h3>
                  <p className="text-gray-600 mb-6">Bookmark stories to read later</p>
                </>
              )}
              {activeTab === 'downloaded' && (
                <>
                  <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No downloads yet</h3>
                  <p className="text-gray-600 mb-6">Download stories to read offline</p>
                </>
              )}
              
              <Link
                href="/stories"
                className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span>Browse Stories</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}