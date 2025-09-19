'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateChapterModal } from './create-chapter-modal'
import { Chapter } from '@/types/book'
import { 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  FileText,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChapterCardProps {
  chapter: Chapter
  onUpdate?: (chapterId: string, chapterData: any) => Promise<void>
  onDelete: (chapterId: string) => Promise<void>
}

export function ChapterCard({ chapter, onUpdate, onDelete }: ChapterCardProps) {
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (chapterData: any) => {
    if (!onUpdate) return
    
    setLoading(true)
    try {
      await onUpdate(chapter.id, chapterData)
      setShowEditModal(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await onDelete(chapter.id)
      setShowDeleteConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getContentPreview = () => {
    const maxLength = 150
    if (chapter.content.length <= maxLength) {
      return chapter.content
    }
    return chapter.content.substring(0, maxLength) + '...'
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Chapter {chapter.chapter_number}
              </span>
              <Badge variant={chapter.is_published ? "default" : "secondary"}>
                {chapter.is_published ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {chapter.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              {getContentPreview()}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/writer/books/${chapter.book_id}/chapters/${chapter.id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-slate-600 dark:text-slate-300">Word Count</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {chapter.word_count?.toLocaleString() || 0}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-slate-600 dark:text-slate-300">Created</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {formatDate(chapter.created_at)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-slate-600 dark:text-slate-300">Updated</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {formatDate(chapter.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200 mb-3">
              Are you sure you want to delete this chapter? This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Deleting...' : 'Delete Chapter'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Chapter Modal */}
      <CreateChapterModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdate}
        nextChapterNumber={chapter.chapter_number}
        editingChapter={{
          id: chapter.id,
          title: chapter.title,
          content: chapter.content,
          chapter_number: chapter.chapter_number,
          is_published: chapter.is_published
        }}
      />
    </>
  )
}