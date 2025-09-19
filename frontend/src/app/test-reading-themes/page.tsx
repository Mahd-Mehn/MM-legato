'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const THEME_PRESETS = {
  light: { background: '#ffffff', text: '#000000', name: 'Light' },
  dark: { background: '#1e293b', text: '#f1f5f9', name: 'Dark' },
  sepia: { background: '#f7f3e9', text: '#5c4b37', name: 'Sepia' },
  night: { background: '#0f172a', text: '#cbd5e1', name: 'Night' },
}

export default function TestReadingThemesPage() {
  const [currentTheme, setCurrentTheme] = useState(THEME_PRESETS.light)
  const [pageWidth, setPageWidth] = useState(800)

  const applyTheme = (theme: typeof THEME_PRESETS.light) => {
    setCurrentTheme(theme)
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#f3f4f6' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Reading Themes & Layout Test</h1>
        
        {/* Theme Controls */}
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Theme Controls</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(THEME_PRESETS).map(([key, theme]) => (
              <Button
                key={key}
                variant={currentTheme.name === theme.name ? "default" : "outline"}
                onClick={() => applyTheme(theme)}
                className="flex items-center space-x-2"
              >
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: theme.background, borderColor: theme.text }}
                />
                <span>{theme.name}</span>
              </Button>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Page Width:</label>
            <input
              type="range"
              min="400"
              max="1200"
              step="50"
              value={pageWidth}
              onChange={(e) => setPageWidth(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm">{pageWidth}px</span>
          </div>
        </Card>

        {/* Reading Preview */}
        <div className="flex justify-center">
          <div 
            className="reading-preview p-8 rounded-lg shadow-lg"
            style={{
              backgroundColor: currentTheme.background,
              color: currentTheme.text,
              width: '100%',
              maxWidth: `${pageWidth}px`,
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              lineHeight: 1.6,
            }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Chapter 1: The Beginning</h2>
              <p className="text-sm opacity-75">From "Sample Book" by Test Author</p>
            </div>

            <div className="space-y-6">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              
              <p>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, 
                totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
              
              <p>
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos 
                qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t opacity-50" style={{ borderColor: currentTheme.text }}>
              <div className="flex justify-between text-sm">
                <span>← Previous: Prologue</span>
                <span>Next: Chapter 2 →</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-600">
            <span>✅ Centered content layout</span>
            <span>✅ Responsive width control</span>
            <span>✅ Theme color application</span>
            <span>✅ No text-align center on content</span>
          </div>
        </div>
      </div>
    </div>
  )
}