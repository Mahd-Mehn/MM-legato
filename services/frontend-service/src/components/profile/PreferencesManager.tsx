'use client';

import { useState } from 'react';
import { Globe, Bell, BookOpen, Palette, Volume2, Moon, Sun, Monitor, Save } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface Preferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: {
    newChapters: boolean;
    comments: boolean;
    followers: boolean;
    marketing: boolean;
  };
  pushNotifications: {
    newChapters: boolean;
    comments: boolean;
    followers: boolean;
  };
  readingPreferences: {
    fontSize: 'small' | 'medium' | 'large';
    fontFamily: 'serif' | 'sans-serif' | 'mono';
    lineHeight: 'compact' | 'normal' | 'relaxed';
    autoBookmark: boolean;
    offlineReading: boolean;
  };
  contentPreferences: {
    preferredGenres: string[];
    contentRating: 'all' | 'teen' | 'mature';
    showSpoilers: boolean;
    autoplay: boolean;
  };
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
];

const timezones = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const genres = [
  'Fantasy', 'Science Fiction', 'Romance', 'Mystery', 'Thriller',
  'Horror', 'Adventure', 'Drama', 'Comedy', 'Historical Fiction',
  'Young Adult', 'Literary Fiction', 'Non-Fiction', 'Biography'
];

export default function PreferencesManager() {
  const [preferences, setPreferences] = useState<Preferences>({
    language: 'en',
    timezone: 'UTC',
    theme: 'system',
    emailNotifications: {
      newChapters: true,
      comments: true,
      followers: true,
      marketing: false,
    },
    pushNotifications: {
      newChapters: true,
      comments: false,
      followers: true,
    },
    readingPreferences: {
      fontSize: 'medium',
      fontFamily: 'serif',
      lineHeight: 'normal',
      autoBookmark: true,
      offlineReading: true,
    },
    contentPreferences: {
      preferredGenres: ['Fantasy', 'Science Fiction'],
      contentRating: 'all',
      showSpoilers: false,
      autoplay: false,
    },
  });

  const [loading, setLoading] = useState(false);

  const updatePreference = (section: keyof Preferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [key]: value
      }
    }));
  };

  const toggleGenre = (genre: string) => {
    const currentGenres = preferences.contentPreferences.preferredGenres;
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    
    updatePreference('contentPreferences', 'preferredGenres', newGenres);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // TODO: Implement actual preferences update API call
      console.log('Updating preferences:', preferences);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      alert('Preferences updated successfully!');
    } catch (error) {
      console.error('Preferences update failed:', error);
      alert('Failed to update preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Language & Region */}
      <Card padding="lg">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Globe className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Language & Region</h3>
              <p className="text-sm text-gray-600">Set your language and timezone preferences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Theme */}
      <Card padding="lg">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Palette className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
              <p className="text-sm text-gray-600">Choose your preferred theme</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPreferences(prev => ({ ...prev, theme: value as any }))}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  preferences.theme === value
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">{label}</div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card padding="lg">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600">Manage your notification preferences</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Email Notifications */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Email Notifications</h4>
              <div className="space-y-3">
                {Object.entries(preferences.emailNotifications).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updatePreference('emailNotifications', key, e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Push Notifications */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Push Notifications</h4>
              <div className="space-y-3">
                {Object.entries(preferences.pushNotifications).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updatePreference('pushNotifications', key, e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Reading Preferences */}
      <Card padding="lg">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reading Preferences</h3>
              <p className="text-sm text-gray-600">Customize your reading experience</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
              <select
                value={preferences.readingPreferences.fontSize}
                onChange={(e) => updatePreference('readingPreferences', 'fontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
              <select
                value={preferences.readingPreferences.fontFamily}
                onChange={(e) => updatePreference('readingPreferences', 'fontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="serif">Serif</option>
                <option value="sans-serif">Sans Serif</option>
                <option value="mono">Monospace</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Line Height</label>
              <select
                value={preferences.readingPreferences.lineHeight}
                onChange={(e) => updatePreference('readingPreferences', 'lineHeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="relaxed">Relaxed</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Auto-bookmark progress</span>
              <input
                type="checkbox"
                checked={preferences.readingPreferences.autoBookmark}
                onChange={(e) => updatePreference('readingPreferences', 'autoBookmark', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Enable offline reading</span>
              <input
                type="checkbox"
                checked={preferences.readingPreferences.offlineReading}
                onChange={(e) => updatePreference('readingPreferences', 'offlineReading', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </label>
          </div>
        </div>
      </Card>

      {/* Content Preferences */}
      <Card padding="lg">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Volume2 className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Content Preferences</h3>
              <p className="text-sm text-gray-600">Set your content discovery preferences</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Preferred Genres */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Genres</label>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      preferences.contentPreferences.preferredGenres.includes(genre)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Rating</label>
              <select
                value={preferences.contentPreferences.contentRating}
                onChange={(e) => updatePreference('contentPreferences', 'contentRating', e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Ages</option>
                <option value="teen">Teen+</option>
                <option value="mature">Mature</option>
              </select>
            </div>

            {/* Other Options */}
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Show spoilers in recommendations</span>
                <input
                  type="checkbox"
                  checked={preferences.contentPreferences.showSpoilers}
                  onChange={(e) => updatePreference('contentPreferences', 'showSpoilers', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Autoplay audio content</span>
                <input
                  type="checkbox"
                  checked={preferences.contentPreferences.autoplay}
                  onChange={(e) => updatePreference('contentPreferences', 'autoplay', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          loading={loading}
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </form>
  );
}