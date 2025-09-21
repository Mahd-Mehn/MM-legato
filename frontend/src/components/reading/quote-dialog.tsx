'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Quote, Download, Share, Loader2, Palette } from 'lucide-react'
import { toast } from 'sonner'

interface QuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedText?: string
  chapterId?: string
  onGenerateQuote: (quoteData: any) => Promise<any>
}

const PRESET_THEMES = [
  { name: 'Dark Blue', bg: '#1e293b', text: '#f1f5f9' },
  { name: 'Sepia', bg: '#f7f3e9', text: '#5c4b37' },
  { name: 'Forest', bg: '#064e3b', text: '#ecfdf5' },
  { name: 'Purple', bg: '#581c87', text: '#faf5ff' },
  { name: 'Crimson', bg: '#7f1d1d', text: '#fef2f2' },
  { name: 'Ocean', bg: '#0c4a6e', text: '#f0f9ff' }
]

export function QuoteDialog({
  open,
  onOpenChange,
  selectedText,
  chapterId,
  onGenerateQuote
}: QuoteDialogProps) {
  const [quoteText, setQuoteText] = useState('')
  const [backgroundColor, setBackgroundColor] = useState('#1e293b')
  const [textColor, setTextColor] = useState('#f1f5f9')
  const [fontSize, setFontSize] = useState(32)
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Update quote text when selectedText changes or dialog opens
  useEffect(() => {
    if (open && selectedText) {
      setQuoteText(selectedText)
    }
  }, [open, selectedText])

  const getTruncatedText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text

    // Find the last complete word before the limit
    const truncated = text.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')

    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...'
    }

    return truncated + '...'
  }

  const handleGenerateQuote = async () => {
    if (!quoteText.trim()) {
      toast.error('Please enter quote text')
      return
    }

    setIsGenerating(true)
    try {
      const quoteData = {
        quote_text: quoteText,
        chapter_id: chapterId,
        background_color: backgroundColor,
        text_color: textColor,
        font_size: fontSize,
        width,
        height
      }

      const result = await onGenerateQuote(quoteData)
      setGeneratedImage(result.image_url)
      toast.success('Quote image generated successfully')
    } catch (error) {
      toast.error('Failed to generate quote image')
      console.error('Quote generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadImage = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = 'quote.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)
      toast.success('Image downloaded')
    } catch (error) {
      toast.error('Failed to download image')
    }
  }

  const handleShareImage = async () => {
    if (!generatedImage) return

    if (navigator.share) {
      try {
        const response = await fetch(generatedImage)
        const blob = await response.blob()
        const file = new File([blob], 'quote.png', { type: 'image/png' })

        await navigator.share({
          title: 'Quote from Legato',
          text: quoteText,
          files: [file]
        })
      } catch (error) {
        // Fallback to copying URL
        try {
          await navigator.clipboard.writeText(generatedImage)
          toast.success('Image URL copied to clipboard')
        } catch (clipboardError) {
          toast.error('Failed to share image')
        }
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(generatedImage)
        toast.success('Image URL copied to clipboard')
      } catch (error) {
        toast.error('Failed to copy image URL')
      }
    }
  }

  const applyPresetTheme = (theme: typeof PRESET_THEMES[0]) => {
    setBackgroundColor(theme.bg)
    setTextColor(theme.text)
  }

  const resetDialog = () => {
    // Don't reset quote text - it should keep the newly selected text
    setGeneratedImage(null)
    // Keep the styling settings as they were
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) resetDialog()
    }}>
      <DialogContent
        className="!max-w-none !w-full h-[95vh] p-8 overflow-y-auto"
        style={{
          width: '98vw',
          maxWidth: '98vw',
          height: '95vh',
          maxHeight: '95vh'
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Quote className="h-5 w-5 mr-2" />
            Generate Quote Image
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 h-full min-h-[70vh]">
          {/* Left side - Configuration */}
          <div className="space-y-8 flex flex-col h-full">
            <Tabs defaultValue="content" className="w-full flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="content" className="text-base">Content</TabsTrigger>
                <TabsTrigger value="style" className="text-base">Style</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6 flex-1 mt-6">
                <div className="space-y-4 flex-1 flex flex-col">
                  <Label className="text-lg font-medium">Selected Quote Text</Label>
                  <div className="min-h-[300px] flex-1 text-base p-4 bg-slate-50 dark:bg-slate-800 border rounded-md overflow-y-auto">
                    <p className="text-slate-900 dark:text-slate-100 leading-relaxed">
                      {quoteText || "No text selected. Please select text from the chapter to generate a quote."}
                    </p>
                  </div>
                  <div className="text-sm text-slate-500 flex justify-between">
                    <span>{quoteText.length} characters</span>
                    <span>{quoteText.split(' ').filter(word => word.length > 0).length} words</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <strong>Note:</strong> Quote text cannot be edited to ensure authenticity. Only text selected from the original chapter can be used.
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-6 flex-1 mt-6">
                {/* Preset themes */}
                <div className="space-y-4">
                  <Label className="text-lg font-medium">Preset Themes</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {PRESET_THEMES.map((theme) => (
                      <Button
                        key={theme.name}
                        variant="outline"
                        size="lg"
                        onClick={() => applyPresetTheme(theme)}
                        className="h-16 flex flex-col items-center justify-center text-sm font-medium"
                        style={{
                          backgroundColor: theme.bg,
                          color: theme.text,
                          borderColor: theme.bg
                        }}
                      >
                        {theme.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom colors */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-lg font-medium">Background Color</Label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-16 h-12 rounded-lg border cursor-pointer"
                      />
                      <Input
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        placeholder="#1e293b"
                        className="flex-1 h-12 text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-lg font-medium">Text Color</Label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-16 h-12 rounded-lg border cursor-pointer"
                      />
                      <Input
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        placeholder="#f1f5f9"
                        className="flex-1 h-12 text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Size settings */}
                <div className="space-y-6">
                  <Label className="text-lg font-medium">Size Settings</Label>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <Label className="text-base">Font Size: {fontSize}px</Label>
                      <Input
                        type="range"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        min={16}
                        max={72}
                        className="w-full h-3"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-base">Width</Label>
                        <Input
                          type="number"
                          value={width}
                          onChange={(e) => setWidth(Number(e.target.value))}
                          min={400}
                          max={1200}
                          className="h-12 text-base"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base">Height</Label>
                        <Input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(Number(e.target.value))}
                          min={300}
                          max={800}
                          className="h-12 text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Generate button */}
            <div className="mt-auto pt-6">
              <Button
                onClick={handleGenerateQuote}
                disabled={!quoteText.trim() || isGenerating}
                className="w-full h-14 text-lg font-medium"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Generating Image...
                  </>
                ) : (
                  <>
                    <Palette className="h-5 w-5 mr-3" />
                    Generate Quote Image
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right side - Preview */}
          <div className="space-y-6 flex flex-col h-full">
            <Label className="text-xl font-semibold">Preview</Label>

            {generatedImage ? (
              <div className="space-y-6 flex-1 flex flex-col">
                <Card className="flex-1">
                  <CardContent className="p-6">
                    <div className="relative">
                      <img
                        src={generatedImage}
                        alt="Generated quote"
                        className="w-full h-auto rounded-xl shadow-2xl"
                      />
                      <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-2 rounded-lg font-medium">
                        {width}×{height}px
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleDownloadImage}
                    variant="outline"
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    <Download className="h-5 w-5 mr-3" />
                    Download
                  </Button>

                  <Button
                    onClick={handleShareImage}
                    variant="outline"
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    <Share className="h-5 w-5 mr-3" />
                    Share
                  </Button>
                </div>

                <Button
                  onClick={() => setGeneratedImage(null)}
                  variant="ghost"
                  className="w-full h-10 text-base"
                >
                  Generate New Image
                </Button>
              </div>
            ) : (
              <Card className="flex-1 flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div
                    className="w-full rounded-xl flex items-center justify-center text-sm relative overflow-hidden flex-1 shadow-inner"
                    style={{
                      backgroundColor: backgroundColor,
                      color: textColor,
                      minHeight: '400px',
                      maxHeight: '600px',
                      aspectRatio: `${width}/${height}`
                    }}
                  >
                    {quoteText ? (
                      <div className="px-12 py-8 text-center max-w-full h-full flex flex-col justify-center">
                        <div className="flex-1 flex items-center justify-center">
                          <div className="space-y-6">
                            <p
                              style={{
                                fontSize: `${Math.min(fontSize * 0.7, 32)}px`,
                                lineHeight: '1.5',
                                wordWrap: 'break-word',
                                hyphens: 'auto'
                              }}
                              className="leading-relaxed font-medium"
                            >
                              "{getTruncatedText(quoteText, 250)}"
                            </p>

                            <div className="space-y-2 text-sm opacity-90">
                              <p>— Sample Book Title, Chapter 1</p>
                              <p>by Sample Author</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8">
                          <p className="text-xs opacity-60 font-medium">from LEGATO</p>
                          {quoteText.length > 250 && (
                            <div className="mt-2 text-xs opacity-70">
                              Text will be optimally sized in final image
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-opacity-60 text-lg">Quote preview will appear here</p>
                    )}
                  </div>
                  <div className="mt-4 text-sm text-slate-500 text-center font-medium">
                    Preview • {width}×{height}px • Font: {fontSize}px
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}