'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useReadingPreferences } from '../../hooks/useReading'

export default function TestReadingPreferencesPage() {
  const { data: preferences, updatePreferences } = useReadingPreferences()

  const testUpdates = [
    { name: 'Dark Theme', updates: { theme_preset: 'dark', background_color: '#1e293b', text_color: '#f1f5f9' } },
    { name: 'Large Font', updates: { font_size: 20, line_height: 1.8 } },
    { name: 'Sepia Theme', updates: { theme_preset: 'sepia', background_color: '#f7f3e9', text_color: '#5c4b37' } },
    { name: 'Wide Layout', updates: { page_width: 1000 } },
    { name: 'Reset to Default', updates: { 
      theme_preset: 'light', 
      background_color: '#ffffff', 
      text_color: '#000000',
      font_size: 16,
      line_height: 1.6,
      page_width: 800
    }},
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Reading Preferences Test (localStorage)</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Current Preferences */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Current Preferences</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Theme:</strong> {preferences.theme_preset}</div>
            <div><strong>Font Family:</strong> {preferences.font_family}</div>
            <div><strong>Font Size:</strong> {preferences.font_size}px</div>
            <div><strong>Line Height:</strong> {preferences.line_height}</div>
            <div><strong>Background:</strong> {preferences.background_color}</div>
            <div><strong>Text Color:</strong> {preferences.text_color}</div>
            <div><strong>Page Width:</strong> {preferences.page_width}px</div>
            <div><strong>Brightness:</strong> {preferences.brightness}%</div>
          </div>
        </Card>

        {/* Test Controls */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Test Updates</h2>
          <div className="space-y-2">
            {testUpdates.map((test) => (
              <Button
                key={test.name}
                variant="outline"
                onClick={() => updatePreferences(test.updates)}
                className="w-full justify-start"
              >
                {test.name}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Preview Area */}
      <Card className="p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Preview</h2>
        <div 
          className="p-6 rounded border"
          style={{
            backgroundColor: preferences.background_color,
            color: preferences.text_color,
            fontFamily: preferences.font_family === 'serif' ? 'Georgia, serif' : 
                       preferences.font_family === 'sans-serif' ? 'system-ui, sans-serif' :
                       preferences.font_family === 'monospace' ? 'Monaco, monospace' : 'Georgia, serif',
            fontSize: `${preferences.font_size}px`,
            lineHeight: preferences.line_height,
            maxWidth: `${preferences.page_width}px`,
            filter: `brightness(${preferences.brightness}%)`
          }}
        >
          <h3 className="font-bold mb-2">Sample Reading Content</h3>
          <p>
            This is a preview of how your reading preferences will look. The quick brown fox jumps over the lazy dog. 
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <p className="mt-4">
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
        </div>
      </Card>

      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ localStorage Implementation</h3>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• Preferences are saved instantly to localStorage</li>
          <li>• No API calls required for reading customization</li>
          <li>• Settings persist across browser sessions</li>
          <li>• Immediate UI updates without network delays</li>
        </ul>
      </div>
    </div>
  )
}