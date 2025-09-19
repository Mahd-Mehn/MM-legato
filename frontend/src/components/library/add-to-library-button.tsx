'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Check, Loader2 } from 'lucide-react'
import { useAddToLibrary, useRemoveFromLibrary, useLibrary } from '@/hooks/useLibrary'
import { toast } from 'sonner'

interface AddToLibraryButtonProps {
  bookId: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

export function AddToLibraryButton({ 
  bookId, 
  className, 
  size = 'default',
  variant = 'default'
}: AddToLibraryButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { data: libraryBooks } = useLibrary()
  const addToLibrary = useAddToLibrary()
  const removeFromLibrary = useRemoveFromLibrary()

  const isInLibrary = libraryBooks?.some(book => book.book_id === bookId)

  const handleToggleLibrary = async () => {
    setIsLoading(true)
    try {
      if (isInLibrary) {
        await removeFromLibrary.mutateAsync(bookId)
        toast.success('Book removed from library')
      } else {
        await addToLibrary.mutateAsync(bookId)
        toast.success('Book added to library')
      }
    } catch (error: any) {
      const message = error?.response?.data?.detail || 
                     (isInLibrary ? 'Failed to remove book from library' : 'Failed to add book to library')
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleToggleLibrary}
      disabled={isLoading}
      className={className}
      size={size}
      variant={isInLibrary ? 'outline' : variant}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isInLibrary ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Heart className="h-4 w-4 mr-2" />
      )}
      {isInLibrary ? 'In Library' : 'Add to Library'}
    </Button>
  )
}