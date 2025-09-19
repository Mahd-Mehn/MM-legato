'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { bookAPI } from '@/lib/api'
import { Chapter, Book } from '@/types/book'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff,
  FileText,
  Clock,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export default function ChapterWritingPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.bookId as string
  const chapterId = params.chapterId as string
  const isNewChapter = chapterId === 'new'

  const [book, setBook] = useState<Book | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    chapter_number: 1,
    is_published: false
  })

  useEffect(() => {
    fetchData()
  }, [bookId, chapterId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const bookResponse = await bookAPI.getBook(bookId)
      setBook(bookResponse)

      if (!isNewChapter) {
        const chapterResponse = await bookAPI.getChapter(chapterId)
        setChapter(chapterResponse)
        setFormData({
          title: chapterResponse.title,
          content: chapterResponse.content,
          chapter_number: chapterResponse.chapter_number,
          is_published: chapterResponse.is_published
        })
      } else {
        const chaptersResponse = await bookAPI.getBookChapters(bookId)
        const nextChapterNumber = chaptersResponse.length > 0
          ? Math.max(...chaptersResponse.map((c: Chapter) => c.chapter_number)) + 1
          : 1
        setFormData(prev => ({ ...prev, chapter_number: nextChapterNumber }))
      }
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.response?.data?.detail || 'Failed to load data')
      toast.error('Failed to load chapter data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      if (isNewChapter) {
        await bookAPI.createChapter(bookId, formData)
        toast.success('Chapter created successfully')
        router.push(`/dashboard/writer/books/${bookId}`)
      } else {
        await bookAPI.updateChapter(chapterId, formData)
        toast.success('Chapter saved successfully')
        await fetchData()
      }
    } catch (err: any) {
      console.error('Error saving chapter:', err)
      setError(err.response?.data?.detail || 'Failed to save chapter')
      toast.error('Failed to save chapter')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getWordCount = () => {
    return formData.content.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const getReadingTime = () => {
    const wordsPerMinute = 200
    const words = getWordCount()
    return Math.ceil(words / wordsPerMinute)
  }

  const formatPreviewContent = (content: string) => {
    return content
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map((paragraph, index) => (
        <p key={index} className="mb-4 leading-relaxed">
          {paragraph}
        </p>
      ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="space-y-4 p-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200">{error || 'Chapter not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/writer/books/${bookId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Book
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isNewChapter ? 'New Chapter' : 'Edit Chapter'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {book.title}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.title || !formData.content}
            size="sm"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Chapter'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel - Expanded */}
        <div className={`${showPreview ? 'w-2/3' : 'w-full'} flex flex-col border-r border-slate-200 dark:border-slate-700`}>
          {/* Chapter Info */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">Chapter Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter chapter title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="chapter_number" className="text-sm font-medium">Chapter Number</Label>
                <Input
                  id="chapter_number"
                  type="number"
                  min="1"
                  value={formData.chapter_number}
                  onChange={(e) => handleChange('chapter_number', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => handleChange('is_published', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Published</span>
                </label>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center space-x-6 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>{getWordCount()} words</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{getReadingTime()} min read</span>
              </div>
              <Badge variant={formData.is_published ? "default" : "secondary"}>{formData.is_published ? 'Published' : 'Draft'}</Badge>
            </div>
          </div>

          {/* Content Editor */}
          <div className="flex-1 p-4">
            <Label htmlFor="content" className="text-sm font-medium mb-2 block">Chapter Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Start writing your chapter..."
              className="w-full h-full min-h-[500px] font-mono text-sm resize-none border-0 focus:ring-0 p-2 bg-transparent dark:bg-transparent"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        {/* Preview Panel - Responsive */}
        {showPreview && (
          <div className="w-1/3 flex flex-col bg-slate-50 dark:bg-slate-900">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Preview</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <Card className="p-6 max-w-none">
                {formData.title && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Chapter {formData.chapter_number}
                      </span>
                      <Badge variant={formData.is_published ? "default" : "secondary"}>{formData.is_published ? 'Published' : 'Draft'}</Badge>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                      {formData.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300 mb-6">
                      <span>{getWordCount()} words</span>
                      <span>•</span>
                      <span>{getReadingTime()} min read</span>
                    </div>
                    <Separator className="mb-6" />
                  </div>
                )}
                
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  {formData.content ? (
                    formatPreviewContent(formData.content)
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 italic">
                      Start writing to see the preview...
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}