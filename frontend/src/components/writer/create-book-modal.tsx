'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { useBookCoverUpload } from '@/hooks/useBookCover'
import { Book } from '@/types/book'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreateBookModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (bookData: {
    title: string
    description?: string
    cover_image_url?: string
    pricing_model: 'free' | 'fixed' | 'per_chapter'
    fixed_price?: number
    per_chapter_price?: number
    genre?: string
    tags?: string[]
    is_published?: boolean
  }) => Promise<void>
  editingBook?: Book | null
}

export function CreateBookModal({ isOpen, onClose, onSubmit, editingBook }: CreateBookModalProps) {
  const [formData, setFormData] = useState({
    title: editingBook?.title || '',
    description: editingBook?.description || '',
    cover_image_url: editingBook?.cover_image_url || '',
    pricing_model: (editingBook?.pricing_model || 'free') as 'free' | 'fixed' | 'per_chapter',
    fixed_price: editingBook?.fixed_price?.toString() || '',
    per_chapter_price: editingBook?.per_chapter_price?.toString() || '',
    genre: editingBook?.genre || '',
    tags: editingBook?.tags?.join(', ') || '',
    is_published: editingBook?.is_published || false
  })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { uploadCover, uploading: coverUploading } = useBookCoverUpload()

  // Update form data when editingBook changes
  useEffect(() => {
    if (editingBook) {
      setFormData({
        title: editingBook.title || '',
        description: editingBook.description || '',
        cover_image_url: editingBook.cover_image_url || '',
        pricing_model: editingBook.pricing_model || 'free',
        fixed_price: editingBook.fixed_price?.toString() || '',
        per_chapter_price: editingBook.per_chapter_price?.toString() || '',
        genre: editingBook.genre || '',
        tags: editingBook.tags?.join(', ') || '',
        is_published: editingBook.is_published || false
      })
    } else {
      // Reset form for new book
      setFormData({
        title: '',
        description: '',
        cover_image_url: '',
        pricing_model: 'free',
        fixed_price: '',
        per_chapter_price: '',
        genre: '',
        tags: '',
        is_published: false
      })
    }
    setCoverFile(null)
    setError(null)
  }, [editingBook, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let coverImageUrl = formData.cover_image_url

      const bookData = {
        title: formData.title,
        description: formData.description || undefined,
        cover_image_url: coverImageUrl || undefined,
        pricing_model: formData.pricing_model,
        fixed_price: formData.pricing_model === 'fixed' && formData.fixed_price
          ? parseInt(formData.fixed_price) : undefined,
        per_chapter_price: formData.pricing_model === 'per_chapter' && formData.per_chapter_price
          ? parseInt(formData.per_chapter_price) : undefined,
        genre: formData.genre || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
        is_published: formData.is_published
      }

      // Submit the book first
      const result = await onSubmit(bookData)

      // If there's a cover file and we have a book ID, upload the cover
      if (coverFile && editingBook?.id) {
        try {
          const uploadResult = await uploadCover(editingBook.id, coverFile)
          toast.success('Book cover uploaded successfully')
        } catch (uploadErr: any) {
          console.error('Cover upload failed:', uploadErr)
          toast.error('Book saved but cover upload failed')
        }
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        cover_image_url: '',
        pricing_model: 'free',
        fixed_price: '',
        per_chapter_price: '',
        genre: '',
        tags: '',
        is_published: false
      })
      setCoverFile(null)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save book')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCoverUpload = async (file: File): Promise<{ url: string }> => {
    if (!editingBook?.id) {
      throw new Error('Cannot upload cover for new book. Please save the book first.')
    }

    const result = await uploadCover(editingBook.id, file)
    // Update the form data with the new URL
    setFormData(prev => ({ ...prev, cover_image_url: result.url }))
    return result
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {editingBook ? 'Edit Book' : 'Create New Book'}
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

            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter book title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter book description"
                rows={4}
              />
            </div>

            {/* Cover Image Upload */}
            <div>
              <ImageUpload
                label="Book Cover"
                value={formData.cover_image_url}
                onChange={setCoverFile}
                onUpload={editingBook ? handleCoverUpload : undefined}
                disabled={loading || coverUploading}
                maxSize={5}
              />
              {!editingBook && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Save the book first to upload a cover image, or you can add it later.
                </p>
              )}
            </div>

            {/* Genre */}
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => handleChange('genre', e.target.value)}
                placeholder="e.g., Science Fiction, Fantasy, Romance"
              />
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="Enter tags separated by commas"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Separate multiple tags with commas
              </p>
            </div>

            {/* Pricing Model */}
            <div>
              <Label>Pricing Model *</Label>
              <div className="space-y-3 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pricing_model"
                    value="free"
                    checked={formData.pricing_model === 'free'}
                    onChange={(e) => handleChange('pricing_model', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Free</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pricing_model"
                    value="fixed"
                    checked={formData.pricing_model === 'fixed'}
                    onChange={(e) => handleChange('pricing_model', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Fixed Price</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pricing_model"
                    value="per_chapter"
                    checked={formData.pricing_model === 'per_chapter'}
                    onChange={(e) => handleChange('pricing_model', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Per Chapter</span>
                </label>
              </div>
            </div>

            {/* Price Fields with Preview */}
            {formData.pricing_model === 'fixed' && (
              <div>
                <Label htmlFor="fixed_price">Fixed Price (coins)</Label>
                <Input
                  id="fixed_price"
                  type="number"
                  min="1"
                  value={formData.fixed_price}
                  onChange={(e) => handleChange('fixed_price', e.target.value)}
                  placeholder="Enter price in coins"
                />
                {formData.fixed_price && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Pricing Preview:</strong> Readers will pay {formData.fixed_price} coins to access the entire book, regardless of chapter count.
                    </p>
                  </div>
                )}
              </div>
            )}

            {formData.pricing_model === 'per_chapter' && (
              <div>
                <Label htmlFor="per_chapter_price">Price Per Chapter (coins)</Label>
                <Input
                  id="per_chapter_price"
                  type="number"
                  min="1"
                  value={formData.per_chapter_price}
                  onChange={(e) => handleChange('per_chapter_price', e.target.value)}
                  placeholder="Enter price per chapter in coins"
                />
                {formData.per_chapter_price && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Pricing Preview:</strong> Readers will pay {formData.per_chapter_price} coins per chapter.
                      {editingBook?.chapter_count && (
                        <span> Current book has {editingBook.chapter_count} chapters (total: {parseInt(formData.per_chapter_price) * editingBook.chapter_count} coins).</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {formData.pricing_model === 'free' && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Free Book:</strong> This book will be available to all readers at no cost. Great for building an audience!
                </p>
              </div>
            )}

            {/* Publish Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => handleChange('is_published', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Publish immediately</span>
              </label>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                You can always publish later from your dashboard
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || coverUploading || !formData.title}>
                {(loading || coverUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingBook ? 'Update Book' : 'Create Book'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  )
}