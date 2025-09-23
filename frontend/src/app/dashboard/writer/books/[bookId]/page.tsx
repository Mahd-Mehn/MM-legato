'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CreateBookModal } from '@/components/writer/create-book-modal'
import { ChapterCard } from '@/components/writer/chapter-card'
import { BookCharacterManager } from '@/components/writer/book-character-manager'
import { useChapters } from '@/hooks/useChapters'
import { bookAPI } from '@/lib/api'
import { Book } from '@/types/book'
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Eye,
  Edit,
  Calendar,
  FileText,
  DollarSign,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export default function BookManagementPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.bookId as string

  const [book, setBook] = useState<Book | null>(null)
  const [bookLoading, setBookLoading] = useState(true)
  const [bookError, setBookError] = useState<string | null>(null)
  const [showEditBook, setShowEditBook] = useState(false)

  const {
    chapters,
    loading: chaptersLoading,
    error: chaptersError,
    fetchChapters,
    deleteChapter
  } = useChapters(bookId)

  useEffect(() => {
    fetchBookData()
    fetchChapters()
  }, [bookId, fetchChapters])

  const fetchBookData = async () => {
    try {
      setBookLoading(true)
      setBookError(null)

      const bookResponse = await bookAPI.getBook(bookId)
      setBook(bookResponse)
    } catch (err: any) {
      console.error('Error fetching book data:', err)
      setBookError(err.response?.data?.detail || 'Failed to load book data')
      toast.error('Failed to load book data')
    } finally {
      setBookLoading(false)
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      await deleteChapter(chapterId)
      toast.success('Chapter deleted successfully')
      // Refresh book data to update stats
      await fetchBookData()
    } catch (err: any) {
      console.error('Error deleting chapter:', err)
      toast.error(err.response?.data?.detail || 'Failed to delete chapter')
    }
  }

  const handleUpdateBook = async (bookData: any) => {
    try {
      await bookAPI.updateBook(bookId, bookData)
      toast.success('Book updated successfully')
      await fetchBookData()
    } catch (err: any) {
      console.error('Error updating book:', err)
      toast.error(err.response?.data?.detail || 'Failed to update book')
      throw err
    }
  }

  const getPrice = () => {
    if (!book) return 'N/A'
    if (book.pricing_model === 'free') return 'Free'
    if (book.pricing_model === 'fixed') return `${book.fixed_price} coins`
    if (book.pricing_model === 'per_chapter') return `${book.per_chapter_price} coins/chapter`
    return 'Price not set'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const loading = bookLoading || chaptersLoading
  const error = bookError || chaptersError

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200">{error || 'Book not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {book.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manage your book and chapters
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/explore/${bookId}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => router.push(`/dashboard/writer/books/${bookId}/chapters/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Chapter
          </Button>
        </div>
      </div>

      {/* Book Info Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Book Information
              </h2>
              <Badge variant={book.is_published ? "default" : "secondary"}>
                {book.is_published ? 'Published' : 'Draft'}
              </Badge>
            </div>
            {book.description && (
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                {book.description}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowEditBook(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Book
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Chapters</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {chapters.length}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Word Count</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {book.total_word_count?.toLocaleString() || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Price</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {getPrice()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Created</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {formatDate(book.created_at)}
              </p>
            </div>
          </div>
        </div>

        {book.genre && (
          <div className="mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Genre</p>
            <Badge variant="outline">{book.genre}</Badge>
          </div>
        )}

        {book.tags && book.tags.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {book.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Separator />

      {/* Character Management Section */}
      <BookCharacterManager bookId={bookId} />

      <Separator />

      {/* Chapters Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Chapters ({chapters.length})
          </h2>
          <Button onClick={() => router.push(`/dashboard/writer/books/${bookId}/chapters/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Chapter
          </Button>
        </div>

        {chapters.length > 0 ? (
          <div className="space-y-4">
            {chapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                onDelete={handleDeleteChapter}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No chapters yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Start writing by creating your first chapter.
            </p>
            <Button onClick={() => router.push(`/dashboard/writer/books/${bookId}/chapters/new`)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Chapter
            </Button>
          </Card>
        )}
      </div>

      {/* Edit Book Modal */}
      {book && (
        <CreateBookModal
          isOpen={showEditBook}
          onClose={() => setShowEditBook(false)}
          onSubmit={handleUpdateBook}
          editingBook={book}
        />
      )}
    </div>
  )
}