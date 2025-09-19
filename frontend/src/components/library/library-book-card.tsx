'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Shield, ShieldOff, Trash2, BookOpen } from 'lucide-react'
import { LibraryBook } from '@/hooks/useLibrary'
import { useRemoveFromLibrary, useToggleVault } from '@/hooks/useLibrary'
import { toast } from 'sonner'

interface LibraryBookCardProps {
  book: LibraryBook
}

export function LibraryBookCard({ book }: LibraryBookCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const removeFromLibrary = useRemoveFromLibrary()
  const toggleVault = useToggleVault()

  const handleRemoveFromLibrary = async () => {
    if (confirm('Are you sure you want to remove this book from your library?')) {
      setIsLoading(true)
      try {
        await removeFromLibrary.mutateAsync(book.book_id)
        toast.success('Book removed from library')
      } catch (error) {
        toast.error('Failed to remove book from library')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleToggleVault = async () => {
    setIsLoading(true)
    try {
      await toggleVault.mutateAsync(book.book_id)
      const action = book.is_in_vault ? 'removed from' : 'moved to'
      toast.success(`Book ${action} vault`)
    } catch (error) {
      toast.error('Failed to update vault status')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="relative">
          {/* Book Cover */}
          <div className="relative aspect-[3/4] mb-3 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            {book.book_cover_image_url ? (
              <Image
                src={book.book_cover_image_url}
                alt={book.book_title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-12 w-12 text-slate-400" />
              </div>
            )}
            
            {/* Vault Badge */}
            {book.is_in_vault && (
              <Badge 
                variant="secondary" 
                className="absolute top-2 left-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              >
                <Shield className="h-3 w-3 mr-1" />
                Vault
              </Badge>
            )}
          </div>

          {/* Book Info */}
          <div className="space-y-2">
            <Link 
              href={`/dashboard/explore/${book.book_id}`}
              className="block"
            >
              <h3 className="font-semibold text-sm line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {book.book_title}
              </h3>
            </Link>
            
            <p className="text-xs text-slate-600 dark:text-slate-400">
              by {book.author_username}
            </p>
            
            {book.genre && (
              <Badge variant="outline" className="text-xs">
                {book.genre}
              </Badge>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                disabled={isLoading}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleVault}>
                {book.is_in_vault ? (
                  <>
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Remove from Vault
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Move to Vault
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleRemoveFromLibrary}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}