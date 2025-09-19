'use client'

import { useState } from 'react'
import { StatsCard } from '@/components/ui/stats-card'
import { Button } from '@/components/ui/button'
import { CreateBookModal } from '@/components/writer/create-book-modal'
import { WriterBookCard } from '@/components/writer/writer-book-card'
import { useWriterBooks } from '@/hooks/useWriterBooks'
import { Plus, BookOpen, Eye, DollarSign, Users, Loader2 } from 'lucide-react'
import { Book } from '@/types/book'

export default function WriterDashboardPage() {
  const { 
    books, 
    publishedBooks, 
    draftBooks, 
    loading, 
    error, 
    createBook, 
    updateBook, 
    deleteBook
  } = useWriterBooks()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'analytics'>('published')
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  const handleCreateBook = async (bookData: any) => {
    await createBook(bookData)
  }

  const handleEditBook = (book: Book) => {
    setEditingBook(book)
    setShowCreateModal(true)
  }

  const handleUpdateBook = async (bookData: any) => {
    if (editingBook) {
      await updateBook(editingBook.id, bookData)
      setEditingBook(null)
    }
  }

  const handleDeleteBook = async (bookId: string) => {
    await deleteBook(bookId)
  }

  // Calculate stats
  const totalEarnings = books.reduce((sum, book) => {
    // This would come from actual transaction data in a real app
    return sum + (book.is_published ? (book.fixed_price || book.per_chapter_price || 0) * 10 : 0)
  }, 0)

  const totalViews = books.reduce((sum, book) => {
    // This would come from actual analytics data
    return sum + (book.is_published ? Math.floor(Math.random() * 1000) + 100 : 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Book
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Published Books"
          value={publishedBooks.length.toString()}
          icon={BookOpen}
          trend={publishedBooks.length > 0 ? `${publishedBooks.length} published` : 'No books yet'}
          trendUp={publishedBooks.length > 0}
        />
        <StatsCard
          title="Total Views"
          value={totalViews.toLocaleString()}
          icon={Eye}
          trend={totalViews > 0 ? 'Growing audience' : 'Publish to get views'}
          trendUp={totalViews > 0}
        />
        <StatsCard
          title="Earnings"
          value={`${totalEarnings} coins`}
          icon={DollarSign}
          trend={totalEarnings > 0 ? 'From book sales' : 'Start earning'}
          trendUp={totalEarnings > 0}
        />
        <StatsCard
          title="Draft Books"
          value={draftBooks.length.toString()}
          icon={Users}
          trend={draftBooks.length > 0 ? 'Ready to publish' : 'All published'}
          trendUp={false}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('published')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'published'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Published ({publishedBooks.length})
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'drafts'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Drafts ({draftBooks.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      ) : (
        <>
          {/* Published Books Tab */}
          {activeTab === 'published' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedBooks.length > 0 ? (
                publishedBooks.map((book) => (
                  <WriterBookCard
                    key={book.id}
                    book={book}
                    onEdit={handleEditBook}
                    onDelete={handleDeleteBook}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    No published books yet
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Create your first book and publish it to start reaching readers.
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Book
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Drafts Tab */}
          {activeTab === 'drafts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftBooks.length > 0 ? (
                draftBooks.map((book) => (
                  <WriterBookCard
                    key={book.id}
                    book={book}
                    onEdit={handleEditBook}
                    onDelete={handleDeleteBook}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    No draft books
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    All your books are published! Create a new book to start writing.
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Book
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Analytics Coming Soon
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Detailed analytics and insights for your books will be available here.
              </p>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Book Modal */}
      <CreateBookModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingBook(null)
        }}
        onSubmit={editingBook ? handleUpdateBook : handleCreateBook}
        editingBook={editingBook}
      />
    </div>
  )
}