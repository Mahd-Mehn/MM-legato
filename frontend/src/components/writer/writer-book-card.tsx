'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Book } from '@/types/book'
import { Edit, Eye, Trash2, BookOpen, Calendar } from 'lucide-react'

interface WriterBookCardProps {
  book: Book
  onEdit: (book: Book) => void
  onDelete: (bookId: string) => void
}

export function WriterBookCard({ book, onEdit, onDelete }: WriterBookCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    onDelete(book.id)
    setShowDeleteConfirm(false)
  }

  const getPrice = () => {
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white truncate">
            {book.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {book.genre && `${book.genre} • `}
            {book.chapter_count || 0} chapters
          </p>
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {book.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
              {book.tags.length > 3 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  +{book.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            book.is_published
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          }`}
        >
          {book.is_published ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* Description */}
      {book.description && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
          {book.description}
        </p>
      )}

      {/* Stats */}
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-300">Price:</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {getPrice()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-300">Word Count:</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {book.total_word_count?.toLocaleString() || 0}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-600 dark:text-slate-300">Created:</span>
          <div className="flex items-center text-slate-900 dark:text-white">
            <Calendar className="h-3 w-3 mr-1" />
            <span className="font-medium">{formatDate(book.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!showDeleteConfirm ? (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(book)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            
            <Link href={`/dashboard/writer/books/${book.id}`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full">
                <BookOpen className="h-4 w-4 mr-1" />
                Manage
              </Button>
            </Link>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <Link href={`/dashboard/explore/${book.id}`} className="w-full">
            <Button size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-1" />
              Preview Book
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-red-600 dark:text-red-400 text-center">
            Are you sure you want to delete this book?
          </p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}