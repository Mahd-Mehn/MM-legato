'use client'

import { useParams } from 'next/navigation'
import { ReadingInterface } from '@/components/reading/reading-interface'
import { useChapterReading } from '../../../../hooks/useReading'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function ReadingPage() {
  const params = useParams()
  const chapterId = params.chapterId as string

  const { data: chapterData, isLoading, error } = useChapterReading(chapterId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2 mt-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load chapter. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!chapterData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Chapter not found or you don't have access to this content.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <ReadingInterface chapterData={chapterData} />
}