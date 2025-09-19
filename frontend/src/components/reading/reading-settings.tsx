'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { X, Palette, Type, Layout, Sun } from 'lucide-react'
import { ReadingPreferences } from '../../types/reading'

interface ReadingSettingsProps {
  preferences?: ReadingPreferences
  onPreferenceChange: (key: string | Record<string, any>, value?: any) => void
  onClose: () => void
}

const THEME_PRESETS = {
  light: { background: '#ffffff', text: '#000000', name: 'Light' },
  dark: { background: '#1e293b', text: '#f1f5f9', name: 'Dark' },
  sepia: { background: '#f7f3e9', text: '#5c4b37', name: 'Sepia' },
  night: { background: '#0f172a', text: '#cbd5e1', name: 'Night' },
}

const FONT_FAMILIES = [
  { value: 'serif', label: 'Serif', preview: 'Georgia, serif' },
  { value: 'sans-serif', label: 'Sans Serif', preview: 'system-ui, sans-serif' },
  { value: 'monospace', label: 'Monospace', preview: 'Monaco, monospace' },
]

export function ReadingSettings({ preferences, onPreferenceChange, onClose }: ReadingSettingsProps) {
  const [activeTab, setActiveTab] = useState('appearance')

  const handleThemePreset = (preset: keyof typeof THEME_PRESETS) => {
    const theme = THEME_PRESETS[preset]
    // Update multiple preferences at once
    onPreferenceChange({
      theme_preset: preset,
      background_color: theme.background,
      text_color: theme.text
    })
  }

  const handleColorChange = (type: 'background' | 'text', color: string) => {
    onPreferenceChange(`${type}_color`, color)
    // Reset theme preset when manually changing colors
    onPreferenceChange('theme_preset', 'custom')
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-96 overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center">
              <Type className="h-5 w-5 mr-2" />
              Reading Settings
            </SheetTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
            <SheetClose asChild>
            </SheetClose>
              </Button>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 px-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance" className="text-xs">
              <Palette className="h-4 w-4 mr-1" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="typography" className="text-xs">
              <Type className="h-4 w-4 mr-1" />
              Text
            </TabsTrigger>
            <TabsTrigger value="layout" className="text-xs">
              <Layout className="h-4 w-4 mr-1" />
              Layout
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6 mt-6 p-4">
            {/* Theme Presets */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Theme Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(THEME_PRESETS).map(([key, theme]) => (
                  <Button
                    key={key}
                    variant={preferences?.theme_preset === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemePreset(key as keyof typeof THEME_PRESETS)}
                    className="h-12 flex flex-col items-center justify-center"
                  >
                    <div
                      className="w-6 h-3 rounded mb-1 border"
                      style={{ backgroundColor: theme.background, borderColor: theme.text }}
                    />
                    <span className="text-xs">{theme.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Custom Colors</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-600 dark:text-slate-400">Background</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      value={preferences?.background_color || '#ffffff'}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600"
                    />
                    <span className="text-sm font-mono">
                      {preferences?.background_color || '#ffffff'}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-600 dark:text-slate-400">Text</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      value={preferences?.text_color || '#000000'}
                      onChange={(e) => handleColorChange('text', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600"
                    />
                    <span className="text-sm font-mono">
                      {preferences?.text_color || '#000000'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Brightness */}
            <div>
              <Label className="text-sm font-medium mb-3 flex items-center">
                <Sun className="h-4 w-4 mr-2" />
                Brightness: {preferences?.brightness || 100}%
              </Label>
              <Slider
                value={[preferences?.brightness || 100]}
                onValueChange={([value]) => onPreferenceChange('brightness', value)}
                min={10}
                max={150}
                step={5}
                className="w-full"
              />
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6 mt-6">
            {/* Font Family */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Font Family</Label>
              <Select
                value={preferences?.font_family || 'serif'}
                onValueChange={(value) => onPreferenceChange('font_family', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.preview }}>
                        {font.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Font Size: {preferences?.font_size || 16}px
              </Label>
              <Slider
                value={[preferences?.font_size || 16]}
                onValueChange={([value]) => onPreferenceChange('font_size', value)}
                min={12}
                max={24}
                step={1}
                className="w-full"
              />
            </div>

            {/* Line Height */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Line Height: {preferences?.line_height || 1.6}
              </Label>
              <Slider
                value={[preferences?.line_height || 1.6]}
                onValueChange={([value]) => onPreferenceChange('line_height', value)}
                min={1.0}
                max={2.5}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Preview */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Preview</Label>
              <div
                className="p-4 border rounded-lg"
                style={{
                  fontFamily: preferences?.font_family === 'serif' ? 'Georgia, serif' :
                    preferences?.font_family === 'sans-serif' ? 'system-ui, sans-serif' :
                      preferences?.font_family === 'monospace' ? 'Monaco, monospace' : 'Georgia, serif',
                  fontSize: `${preferences?.font_size || 16}px`,
                  lineHeight: preferences?.line_height || 1.6,
                  backgroundColor: preferences?.background_color || '#ffffff',
                  color: preferences?.text_color || '#000000',
                }}
              >
                The quick brown fox jumps over the lazy dog. This is a preview of how your text will appear with the current settings.
              </div>
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-6 mt-6">
            {/* Page Width */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Page Width: {preferences?.page_width || 800}px
              </Label>
              <Slider
                value={[preferences?.page_width || 800]}
                onValueChange={([value]) => onPreferenceChange('page_width', value)}
                min={400}
                max={1200}
                step={50}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mt-1">
                <span>Narrow</span>
                <span>Wide</span>
              </div>
            </div>

            {/* Quick presets for page width */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Mobile', width: 400 },
                  { label: 'Tablet', width: 600 },
                  { label: 'Desktop', width: 800 },
                  { label: 'Wide', width: 1000 },
                ].map((preset) => (
                  <Badge
                    key={preset.label}
                    variant={preferences?.page_width === preset.width ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => onPreferenceChange('page_width', preset.width)}
                  >
                    {preset.label}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Reset button */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={() => {
              // Reset to default preferences
              onPreferenceChange({
                font_family: 'serif',
                font_size: 16,
                line_height: 1.6,
                background_color: '#ffffff',
                text_color: '#000000',
                page_width: 800,
                brightness: 100,
                theme_preset: 'light',
                wallpaper_url: undefined
              })
            }}
            className="w-full"
          >
            Reset to Defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}