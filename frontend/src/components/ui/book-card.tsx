import Link from 'next/link'
import { Star, Clock, Coins, Heart } from 'lucide-react'
import { Button } from './button'

interface BookCardProps {
  title: string
  author: string
  coverUrl?: string
  href: string
  subtitle?: string
  price?: number
  isFree?: boolean
  rating?: number
  progress?: number
  inLibrary?: boolean
  chapterCount?: number
  wordCount?: number
  genre?: string
  tags?: string[]
  isPublished?: boolean
}

export function BookCard({
  title,
  author,
  coverUrl,
  href,
  subtitle,
  price,
  isFree = false,
  rating,
  progress,
  inLibrary = false,
  chapterCount,
  wordCount,
  genre,
  tags,
  isPublished = true
}: BookCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={href}>
        {/* Cover Image */}
        <div className="aspect-[3/4] bg-slate-200 dark:bg-slate-700 relative">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-slate-400 text-sm">No Cover</span>
            </div>
          )}

          {/* Publication Status Badge */}
          {isPublished !== undefined && (
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                isPublished 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}>
                {isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
          )}

          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={href}>
          <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {title}
          </h3>
        </Link>

        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          by {author}
        </p>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
            {subtitle}
          </p>
        )}

        {/* Genre */}
        {genre && (
          <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded mt-2">
            {genre}
          </span>
        )}

        {/* Chapter and Word Count */}
        {(chapterCount !== undefined || wordCount !== undefined) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
            {chapterCount !== undefined && (
              <span>{chapterCount} chapters</span>
            )}
            {wordCount !== undefined && (
              <span>{wordCount.toLocaleString()} words</span>
            )}
          </div>
        )}

        {/* Rating */}
        {rating && (
          <div className="flex items-center mt-2">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-slate-600 dark:text-slate-300 ml-1">
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Progress */}
        {progress !== undefined && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">
                {progress === 100 ? 'Completed' : `${progress}% complete`}
              </span>
              {progress < 100 && (
                <Clock className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>
        )}

        {/* Price/Actions */}
        <div className="flex items-center justify-between mt-3">
          {isFree ? (
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Free
            </span>
          ) : price ? (
            <div className="flex items-center text-sm font-medium text-slate-900 dark:text-white">
              <Coins className="h-4 w-4 text-yellow-500 mr-1" />
              {price}
            </div>
          ) : (
            <div />
          )}

          {!inLibrary && (
            <Button size="sm" variant="outline">
              <Heart className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}