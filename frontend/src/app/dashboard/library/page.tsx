'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Grid, List, BookOpen, History, Shield } from 'lucide-react'
import { LibraryBookCard } from '@/components/library/library-book-card'
import { ReadingHistoryCard } from '@/components/library/reading-history-card'
import { useLibrary, useReadingHistory } from '@/hooks/useLibrary'
import Link from 'next/link'

type ViewMode = 'grid' | 'list'
type ActiveTab = 'library' | 'history'

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<ActiveTab>('library')
  
  const { data: libraryBooks, isLoading: libraryLoading, error: libraryError } = useLibrary()
  const { data: historyBooks, isLoading: historyLoading, error: historyError } = useReadingHistory()

  const regularBooks = libraryBooks?.filter(book => !book.is_in_vault) || []
  const vaultBooks = libraryBooks?.filter(book => book.is_in_vault) || []

  if (libraryError || historyError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Failed to load library data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {activeTab === 'library' 
            ? `Showing ${libraryBooks?.length || 0} books in your library`
            : `Showing ${historyBooks?.length || 0} books in your reading history`
          }
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button 
            onClick={() => setActiveTab('library')}
            className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
              activeTab === 'library'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="h-4 w-4 inline mr-2" />
            My Library ({libraryBooks?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <History className="h-4 w-4 inline mr-2" />
            Reading History ({historyBooks?.length || 0})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'library' && (
        <>
          {libraryLoading ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? "h-64 w-full" : "h-24 w-full"} />
              ))}
            </div>
          ) : libraryBooks && libraryBooks.length > 0 ? (
            <div className="space-y-8">
              {/* Regular Library Books */}
              {regularBooks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Library Books</h3>
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                  }>
                    {regularBooks.map((book) => (
                      <LibraryBookCard key={book.id} book={book} />
                    ))}
                  </div>
                </div>
              )}

              {/* Vault Books Preview */}
              {vaultBooks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-purple-600" />
                      Secret Vault ({vaultBooks.length} books)
                    </h3>
                    <Link href="/vault">
                      <Button variant="outline" size="sm">
                        <Shield className="h-4 w-4 mr-2" />
                        Access Vault
                      </Button>
                    </Link>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-6 text-center">
                    <Shield className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      You have {vaultBooks.length} book{vaultBooks.length !== 1 ? 's' : ''} in your Secret Vault
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Enter your vault password to view and access these private books
                    </p>
                    <Link href="/vault">
                      <Button size="sm">
                        <Shield className="h-4 w-4 mr-2" />
                        Open Vault
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No books in your library</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">Start building your collection by exploring new books</p>
              <Link href="/dashboard/explore">
                <Button>Explore Books</Button>
              </Link>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <>
          {historyLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : historyBooks && historyBooks.length > 0 ? (
            <div className="space-y-4">
              {historyBooks.map((book) => (
                <ReadingHistoryCard key={book.book_id} book={book} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No reading history</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">Start reading books to build your history</p>
              <Link href="/dashboard/explore">
                <Button>Explore Books</Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}