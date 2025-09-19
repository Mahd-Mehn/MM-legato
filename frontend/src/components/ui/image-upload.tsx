'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (file: File | null) => void
  onUpload?: (file: File) => Promise<{ url: string }>
  disabled?: boolean
  className?: string
  label?: string
  accept?: string
  maxSize?: number // in MB
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  disabled = false,
  className,
  label = "Upload Image",
  accept = "image/*",
  maxSize = 5
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Call onChange with file
    onChange(file)

    // If onUpload is provided, upload immediately
    if (onUpload) {
      setUploading(true)
      try {
        const result = await onUpload(file)
        setPreview(result.url)
      } catch (error) {
        console.error('Upload failed:', error)
        setPreview(null)
        onChange(null)
      } finally {
        setUploading(false)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          dragOver 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
            : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!disabled ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-md"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-slate-400 animate-spin mb-4" />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Uploading...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                  {dragOver ? (
                    <Upload className="h-6 w-6 text-blue-500" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  {dragOver ? 'Drop image here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PNG, JPG, GIF up to {maxSize}MB
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}