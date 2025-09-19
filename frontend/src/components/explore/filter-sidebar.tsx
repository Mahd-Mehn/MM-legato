'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { BookFilters } from '@/types/book'

const genres = [
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Romance',
  'Thriller',
  'Horror',
  'Historical Fiction',
  'Biography',
  'Self-Help',
  'Business'
]

const priceRanges = [
  { label: 'Free', value: 'free' },
  { label: 'Under 10 coins', value: '0-10' },
  { label: '10-25 coins', value: '10-25' },
  { label: '25-50 coins', value: '25-50' },
  { label: '50+ coins', value: '50+' }
]

interface FilterSidebarProps {
  filters: BookFilters
  onFiltersChange: (filters: Partial<BookFilters>) => void
  excludedTags?: string[]
  onExcludedTagsChange?: (tags: string[]) => void
}

export function FilterSidebar({ 
  filters, 
  onFiltersChange, 
  excludedTags = [], 
  onExcludedTagsChange 
}: FilterSidebarProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('')
  const [minRating, setMinRating] = useState<number>(0)
  const [localExcludedTags, setLocalExcludedTags] = useState<string[]>(excludedTags)
  const [newTag, setNewTag] = useState<string>('')

  // Update local state when filters change
  useEffect(() => {
    if (filters.genre) {
      setSelectedGenres([filters.genre])
    }
    if (filters.min_rating) {
      setMinRating(filters.min_rating)
    }
  }, [filters])

  useEffect(() => {
    setLocalExcludedTags(excludedTags)
  }, [excludedTags])

  const toggleGenre = (genre: string) => {
    const newGenres = selectedGenres.includes(genre) 
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre]
    
    setSelectedGenres(newGenres)
    
    // Update filters - for simplicity, we'll use the first selected genre
    onFiltersChange({ 
      genre: newGenres.length > 0 ? newGenres[0] : undefined 
    })
  }

  const handlePriceRangeChange = (range: string) => {
    setSelectedPriceRange(range)
    
    // Convert price range to min/max values
    let pricingModel: string | undefined
    let minPrice: number | undefined
    let maxPrice: number | undefined
    
    switch (range) {
      case 'free':
        pricingModel = 'free'
        break
      case '0-10':
        minPrice = 0
        maxPrice = 10
        break
      case '10-25':
        minPrice = 10
        maxPrice = 25
        break
      case '25-50':
        minPrice = 25
        maxPrice = 50
        break
      case '50+':
        minPrice = 50
        break
      default:
        break
    }
    
    onFiltersChange({ pricing_model: pricingModel, min_price: minPrice, max_price: maxPrice })
  }

  const handleRatingChange = (rating: number) => {
    setMinRating(rating)
    onFiltersChange({ min_rating: rating > 0 ? rating : undefined })
  }

  const addExcludedTag = () => {
    if (newTag.trim() && !localExcludedTags.includes(newTag.trim())) {
      const updatedTags = [...localExcludedTags, newTag.trim()]
      setLocalExcludedTags(updatedTags)
      onExcludedTagsChange?.(updatedTags)
      setNewTag('')
    }
  }

  const removeExcludedTag = (tag: string) => {
    const updatedTags = localExcludedTags.filter(t => t !== tag)
    setLocalExcludedTags(updatedTags)
    onExcludedTagsChange?.(updatedTags)
  }

  const clearFilters = () => {
    setSelectedGenres([])
    setSelectedPriceRange('')
    setMinRating(0)
    onFiltersChange({ 
      genre: undefined, 
      pricing_model: undefined, 
      min_price: undefined, 
      max_price: undefined, 
      min_rating: undefined 
    })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear All
        </Button>
      </div>

      {/* Genre Filter */}
      <div>
        <h4 className="font-medium text-slate-900 dark:text-white mb-3">Genre</h4>
        <div className="space-y-2">
          {genres.map((genre) => (
            <label key={genre} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedGenres.includes(genre)}
                onChange={() => toggleGenre(genre)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                {genre}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div>
        <h4 className="font-medium text-slate-900 dark:text-white mb-3">Price Range</h4>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label key={range.value} className="flex items-center">
              <input
                type="radio"
                name="priceRange"
                value={range.value}
                checked={selectedPriceRange === range.value}
                onChange={(e) => handlePriceRangeChange(e.target.value)}
                className="border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <h4 className="font-medium text-slate-900 dark:text-white mb-3">Minimum Rating</h4>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center">
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={minRating === rating}
                onChange={() => handleRatingChange(rating)}
                className="border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-700 dark:text-slate-300 flex items-center">
                {rating}+ ⭐
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Excluded Tags */}
      <div>
        <h4 className="font-medium text-slate-900 dark:text-white mb-3">Excluded Tags</h4>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addExcludedTag()}
              placeholder="Add tag to exclude..."
              className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <Button size="sm" onClick={addExcludedTag}>
              Add
            </Button>
          </div>
          {localExcludedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {localExcludedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => removeExcludedTag(tag)}
                    className="ml-1 hover:text-red-600 dark:hover:text-red-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {(selectedGenres.length > 0 || selectedPriceRange || minRating > 0) && (
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white mb-3">Active Filters</h4>
          <div className="flex flex-wrap gap-2">
            {selectedGenres.map((genre) => (
              <span
                key={genre}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full"
              >
                {genre}
                <button
                  onClick={() => toggleGenre(genre)}
                  className="ml-1 hover:text-blue-600 dark:hover:text-blue-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {selectedPriceRange && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
                {priceRanges.find(r => r.value === selectedPriceRange)?.label}
                <button
                  onClick={() => handlePriceRangeChange('')}
                  className="ml-1 hover:text-green-600 dark:hover:text-green-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {minRating > 0 && (
              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs rounded-full">
                {minRating}+ ⭐
                <button
                  onClick={() => handleRatingChange(0)}
                  className="ml-1 hover:text-yellow-600 dark:hover:text-yellow-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}