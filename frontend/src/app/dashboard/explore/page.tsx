'use client'

import { useState, useEffect } from 'react'
import { BookCard } from '@/components/ui/book-card'
import { FilterSidebar } from '@/components/explore/filter-sidebar'
import { Search, Loader2 } from 'lucide-react'
import { useBooks, useUserSettings } from '@/hooks/useBooks'
import { BookFilters } from '@/types/book'

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  
  const { books, loading, error, pagination, filters, updateFilters, loadMore } = useBooks()
  const { settings, updateExcludedTags } = useUserSettings()

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      updateFilters({ search: value || undefined })
    }, 500)
    
    setSearchTimeout(timeout)
  }

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-')
    updateFilters({ 
      sort_by: sortBy as any, 
      sort_order: sortOrder as 'asc' | 'desc' 
    })
  }

  // Handle excluded tags change
  const handleExcludedTagsChange = (excludedTags: string[]) => {
    updateExcludedTags(excludedTags)
    updateFilters({ excluded_tags: excludedTags })
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  return (
    <div className="flex gap-6">
      {/* Filter Sidebar */}
      <div className="w-64 flex-shrink-0">
        <FilterSidebar 
          filters={filters}
          onFiltersChange={updateFilters}
          excludedTags={settings?.excluded_tags || []}
          onExcludedTagsChange={handleExcludedTagsChange}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by title, author, or genre..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {loading ? 'Loading...' : `Showing ${pagination.total} books`}
            </h2>
            <select 
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="created_at-desc">Sort by Latest</option>
              <option value="created_at-asc">Sort by Oldest</option>
              <option value="title-asc">Sort by Title A-Z</option>
              <option value="title-desc">Sort by Title Z-A</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {loading && books.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    title={book.title}
                    author={book.author?.username || 'Unknown Author'}
                    price={book.pricing_model === 'free' ? undefined : 
                           book.pricing_model === 'fixed' ? book.fixed_price :
                           book.per_chapter_price}
                    isFree={book.pricing_model === 'free'}
                    coverUrl={book.cover_image_url}
                    href={`/dashboard/explore/${book.id}`}
                    chapterCount={book.chapter_count}
                    wordCount={book.total_word_count}
                    genre={book.genre}
                    tags={book.tags}
                  />
                ))}
              </div>

              {books.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400">
                    No books found matching your criteria.
                  </p>
                </div>
              )}

              {/* Load More */}
              {pagination.has_next && (
                <div className="text-center mt-8">
                  <button 
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Load More Books
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}