'use client';

import { X, Type, Palette, Wifi, WifiOff } from 'lucide-react';
import { useDataSaver } from '@/hooks/useDataSaver';

type FontSize = 'reading-sm' | 'reading-base' | 'reading-lg' | 'reading-xl';
type Theme = 'light' | 'dark' | 'sepia';

interface ReadingSettingsProps {
  fontSize: FontSize;
  theme: Theme;
  onFontSizeChange: (size: FontSize) => void;
  onThemeChange: (theme: Theme) => void;
  onClose: () => void;
}

export function ReadingSettings({
  fontSize,
  theme,
  onFontSizeChange,
  onThemeChange,
  onClose
}: ReadingSettingsProps) {
  const { isDataSaverEnabled, toggleDataSaver, compressionLevel } = useDataSaver();

  const fontSizes: Array<{ value: FontSize; label: string; size: string }> = [
    { value: 'reading-sm', label: 'Small', size: '16px' },
    { value: 'reading-base', label: 'Medium', size: '18px' },
    { value: 'reading-lg', label: 'Large', size: '20px' },
    { value: 'reading-xl', label: 'Extra Large', size: '22px' }
  ];

  const themes: Array<{ value: Theme; label: string; bg: string; text: string }> = [
    { value: 'light', label: 'Light', bg: 'bg-white', text: 'text-gray-900' },
    { value: 'dark', label: 'Dark', bg: 'bg-gray-900', text: 'text-gray-100' },
    { value: 'sepia', label: 'Sepia', bg: 'bg-amber-50', text: 'text-amber-900' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Reading Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Font Size */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Type className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium">Font Size</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => onFontSizeChange(size.value)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    fontSize === size.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">{size.label}</div>
                  <div className="text-xs text-gray-500">{size.size}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Palette className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium">Theme</h3>
            </div>
            <div className="space-y-3">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => onThemeChange(themeOption.value)}
                  className={`w-full p-3 rounded-lg border-2 transition-colors ${
                    theme === themeOption.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full ${themeOption.bg} border border-gray-300`} />
                    <div className="text-left">
                      <div className="font-medium">{themeOption.label}</div>
                      <div className="text-sm text-gray-500">
                        {themeOption.value === 'light' && 'Best for bright environments'}
                        {themeOption.value === 'dark' && 'Easy on the eyes in low light'}
                        {themeOption.value === 'sepia' && 'Warm, paper-like reading'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Data Saver */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              {isDataSaverEnabled ? (
                <WifiOff className="w-5 h-5 text-orange-600" />
              ) : (
                <Wifi className="w-5 h-5 text-gray-600" />
              )}
              <h3 className="font-medium">Data Saver</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Enable Data Saver</div>
                  <div className="text-sm text-gray-500">
                    Compress content and reduce data usage
                  </div>
                </div>
                <button
                  onClick={toggleDataSaver}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDataSaverEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDataSaverEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isDataSaverEnabled && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="text-sm text-orange-800">
                    <div className="font-medium mb-1">Data Saver Active</div>
                    <div>
                      Compression level: {compressionLevel}%
                      <br />
                      Images and media are compressed for faster loading
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reading Stats */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium mb-2">Reading Statistics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Words per minute</div>
                <div className="font-medium">200 WPM</div>
              </div>
              <div>
                <div className="text-gray-500">Time saved today</div>
                <div className="font-medium">45 min</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}