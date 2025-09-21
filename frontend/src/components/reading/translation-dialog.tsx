'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Copy, Languages, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TranslationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedText?: string
  chapterId?: string
  onTranslateChapter?: (language: string) => Promise<any>
  onTranslateText?: (text: string, language: string) => Promise<any>
}

const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese (Simplified)',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish',
  'pl': 'Polish',
  'tr': 'Turkish',
  'th': 'Thai',
  'vi': 'Vietnamese'
}

export function TranslationDialog({
  open,
  onOpenChange,
  selectedText,
  chapterId,
  onTranslateChapter,
  onTranslateText
}: TranslationDialogProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [translationResult, setTranslationResult] = useState<any>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationType, setTranslationType] = useState<'text' | 'chapter'>('text')

  const handleTranslate = async () => {
    if (!selectedLanguage) {
      toast.error('Please select a language')
      return
    }

    setIsTranslating(true)
    try {
      let result
      
      if (translationType === 'text' && selectedText && onTranslateText) {
        result = await onTranslateText(selectedText, selectedLanguage)
      } else if (translationType === 'chapter' && chapterId && onTranslateChapter) {
        result = await onTranslateChapter(selectedLanguage)
      }
      
      setTranslationResult(result)
      toast.success('Translation completed')
    } catch (error) {
      toast.error('Translation failed')
      console.error('Translation error:', error)
    } finally {
      setIsTranslating(false)
    }
  }

  const handleCopyTranslation = async () => {
    if (!translationResult) return
    
    try {
      const textToCopy = translationType === 'text' 
        ? translationResult.translated_text 
        : translationResult.translated_content
      
      await navigator.clipboard.writeText(textToCopy)
      toast.success('Translation copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy translation')
    }
  }

  const resetDialog = () => {
    setTranslationResult(null)
    setSelectedLanguage('')
    setTranslationType(selectedText ? 'text' : 'chapter')
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) resetDialog()
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Languages className="h-5 w-5 mr-2" />
            Translation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Translation type selection */}
          {selectedText && chapterId && (
            <div className="space-y-2">
              <Label>What would you like to translate?</Label>
              <div className="flex space-x-4">
                <Button
                  variant={translationType === 'text' ? 'default' : 'outline'}
                  onClick={() => setTranslationType('text')}
                  size="sm"
                >
                  Selected Text
                </Button>
                <Button
                  variant={translationType === 'chapter' ? 'default' : 'outline'}
                  onClick={() => setTranslationType('chapter')}
                  size="sm"
                >
                  Entire Chapter
                </Button>
              </div>
            </div>
          )}

          {/* Language selection */}
          <div className="space-y-2">
            <Label>Target Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Original text preview */}
          {selectedText && translationType === 'text' && (
            <div className="space-y-2">
              <Label>Selected Text</Label>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                    "{selectedText}"
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Translate button */}
          <Button 
            onClick={handleTranslate} 
            disabled={!selectedLanguage || isTranslating}
            className="w-full"
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4 mr-2" />
                Translate to {selectedLanguage ? SUPPORTED_LANGUAGES[selectedLanguage as keyof typeof SUPPORTED_LANGUAGES] : '...'}
              </>
            )}
          </Button>

          {/* Translation result */}
          {translationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Translation Result</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyTranslation}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  {translationType === 'text' ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Original ({translationResult.source_language}):</p>
                        <p className="text-sm italic">"{translationResult.original_text}"</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Translation ({translationResult.target_language}):</p>
                        <p className="text-sm font-medium">"{translationResult.translated_text}"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-2">
                          Translated from {translationResult.original_language} to {translationResult.target_language}
                        </p>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {translationResult.translated_content.split('\n\n').map((paragraph: string, index: number) => (
                            <p key={index} className="mb-4">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}