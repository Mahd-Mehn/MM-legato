'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Quote, Share, Languages, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface TextSelectionHandlerProps {
  onGenerateQuote: (selectedText: string) => void
  onTranslateText: (selectedText: string) => void
  children: React.ReactNode
}

export function TextSelectionHandler({ 
  onGenerateQuote, 
  onTranslateText, 
  children 
}: TextSelectionHandlerProps) {
  const [selectedText, setSelectedText] = useState('')
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 })
  const [showPopover, setShowPopover] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        setShowPopover(false)
        return
      }

      const selectedText = selection.toString().trim()
      if (selectedText.length === 0) {
        setShowPopover(false)
        return
      }

      // Check if selection is within our container
      const range = selection.getRangeAt(0)
      const container = containerRef.current
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setShowPopover(false)
        return
      }

      // Get selection position
      const rect = range.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      
      setSelectedText(selectedText)
      setSelectionPosition({
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top - 10
      })
      setShowPopover(true)
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPopover(false)
      }
    }

    document.addEventListener('selectionchange', handleSelection)
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('selectionchange', handleSelection)
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(selectedText)
      toast.success('Text copied to clipboard')
      setShowPopover(false)
    } catch (error) {
      toast.error('Failed to copy text')
    }
  }

  const handleGenerateQuote = () => {
    onGenerateQuote(selectedText)
    setShowPopover(false)
  }

  const handleTranslateText = () => {
    onTranslateText(selectedText)
    setShowPopover(false)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Quote from Legato',
          text: selectedText
        })
        setShowPopover(false)
      } catch (error) {
        // User cancelled or error occurred
        handleCopyText()
      }
    } else {
      // Fallback to copy
      handleCopyText()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {children}
      
      {showPopover && (
        <div
          className="absolute z-50 bg-white dark:bg-slate-800 border rounded-lg shadow-lg p-2 flex items-center space-x-1"
          style={{
            left: selectionPosition.x,
            top: selectionPosition.y,
            transform: 'translateX(-50%)'
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyText}
            className="h-8 w-8 p-0"
            title="Copy text"
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerateQuote}
            className="h-8 w-8 p-0"
            title="Generate quote image"
          >
            <Quote className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTranslateText}
            className="h-8 w-8 p-0"
            title="Translate text"
          >
            <Languages className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-8 w-8 p-0"
            title="Share text"
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}