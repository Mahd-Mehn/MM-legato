'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, Loader2 } from 'lucide-react'

interface CreateChapterModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (chapterData: {
    title: string
    content: string
    chapter_number: number
    is_published: boolean
  }) => Promise<void>
  nextChapterNumber: number
  editingChapter?: {
    id: string
    title: string
    content: string
    chapter_number: number
    is_published: boolean
  } | null
}

export function CreateChapterModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  nextChapterNumber,
  editingChapter 
}: CreateChapterModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    chapter_number: nextChapterNumber,
    is_published: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update form data when editing chapter changes
  useEffect(() => {
    if (editingChapter) {
      setFormData({
        title: editingChapter.title,
        content: editingChapter.content,
        chapter_number: editingChapter.chapter_number,
        is_published: editingChapter.is_published
      })
    } else {
      setFormData({
        title: '',
        content: '',
        chapter_number: nextChapterNumber,
        is_published: false
      })
    }
  }, [editingChapter, nextChapterNumber])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await onSubmit(formData)
      
      // Reset form if creating new chapter
      if (!editingChapter) {
        setFormData({
          title: '',
          content: '',
          chapter_number: nextChapterNumber + 1,
          is_published: false
        })
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save chapter')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getWordCount = () => {
    return formData.content.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {editingChapter ? 'Edit Chapter' : 'Create New Chapter'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Chapter Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter chapter title"
                  required
                />
              </div>

              {/* Chapter Number */}
              <div>
                <Label htmlFor="chapter_number">Chapter Number *</Label>
                <Input
                  id="chapter_number"
                  type="number"
                  min="1"
                  value={formData.chapter_number}
                  onChange={(e) => handleChange('chapter_number', parseInt(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="content">Chapter Content *</Label>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {getWordCount()} words
                </span>
              </div>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Write your chapter content here..."
                rows={20}
                className="min-h-[400px] font-mono text-sm"
                required
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Write your chapter content. You can use basic formatting and the content will be processed for display.
              </p>
            </div>

            {/* Publish Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => handleChange('is_published', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Publish chapter immediately</span>
              </label>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Published chapters will be visible to readers. You can always change this later.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.title || !formData.content}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingChapter ? 'Update Chapter' : 'Create Chapter'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  )
}