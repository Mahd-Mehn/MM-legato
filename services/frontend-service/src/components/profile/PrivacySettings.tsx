'use client';

import { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, Key, Trash2, Download, AlertTriangle, Save } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';

interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private';
  showReadingActivity: boolean;
  showFollowers: boolean;
  showFollowing: boolean;
  allowDirectMessages: 'everyone' | 'followers' | 'none';
  allowComments: 'everyone' | 'followers' | 'none';
  dataCollection: {
    analytics: boolean;
    personalization: boolean;
    marketing: boolean;
  };
  twoFactorEnabled: boolean;
}

export default function PrivacySettings() {
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showReadingActivity: true,
    showFollowers: true,
    showFollowing: true,
    allowDirectMessages: 'followers',
    allowComments: 'everyone',
    dataCollection: {
      analytics: true,
      personalization: true,
      marketing: false,
    },
    twoFactorEnabled: false,
  });

  const [loading, setLoading] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateSetting = (key: keyof PrivacySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateDataCollection = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      dataCollection: {
        ...prev.dataCollection,
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // TODO: Implement actual privacy settings update API call
      console.log('Updating privacy settings:', settings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Privacy settings updated successfully!');
    } catch (error) {
      console.error('Privacy settings update failed:', error);
      alert('Failed to update privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorComplete = (backupCodes: string[]) => {
    console.log('2FA setup completed');
    setSettings(prev => ({ ...prev, twoFactorEnabled: true }));
    setShowTwoFactorSetup(false);
    alert('Two-factor authentication enabled successfully!');
  };

  const disableTwoFactor = async () => {
    if (confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      try {
        // TODO: Implement actual 2FA disable API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSettings(prev => ({ ...prev, twoFactorEnabled: false }));
        alert('Two-factor authentication disabled.');
      } catch (error) {
        console.error('Failed to disable 2FA:', error);
        alert('Failed to disable two-factor authentication.');
      }
    }
  };

  const exportData = async () => {
    try {
      // TODO: Implement actual data export API call
      console.log('Exporting user data...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Data export request submitted. You will receive an email with your data within 24 hours.');
    } catch (error) {
      console.error('Data export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const deleteAccount = async () => {
    if (confirm('Are you absolutely sure? This action cannot be undone and will permanently delete your account and all associated data.')) {
      try {
        // TODO: Implement actual account deletion API call
        console.log('Deleting account...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        alert('Account deletion initiated. You will receive a confirmation email.');
        // Redirect to home page
        window.location.href = '/';
      } catch (error) {
        console.error('Account deletion failed:', error);
        alert('Failed to delete account. Please contact support.');
      }
    }
  };

  if (showTwoFactorSetup) {
    return (
      <div className="max-w-md mx-auto">
        <TwoFactorSetup
          onComplete={handleTwoFactorComplete}
          onCancel={() => setShowTwoFactorSetup(false)}
          userEmail="user@example.com" // TODO: Get from auth context
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Profile Privacy */}
      <Card padding="lg">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Eye className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Profile Privacy</h3>
              <p className="text-sm text-gray-600">Control who can see your profile and activity</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
              <select
                value={settings.profileVisibility}
                onChange={(e) => updateSetting('profileVisibility', e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="public">Public - Anyone can see</option>
                <option value="followers">Followers only</option>
                <option value="private">Private - Only you</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Show reading activity</span>
                <input
                  type="checkbox"
                  checked={settings.showReadingActivity}
                  onChange={(e) => updateSetting('showReadingActivity', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Show followers list</span>
                <input
                  type="checkbox"
                  checked={settings.showFollowers}
                  onChange={(e) => updateSetting('showFollowers', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Show following list</span>
                <input
                  type="checkbox"
                  checked={settings.showFollowing}
                  onChange={(e) => updateSetting('showFollowing', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Communication Settings */}
      <Card padding="lg">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Lock className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Communication</h3>
              <p className="text-sm text-gray-600">Control who can contact you</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Direct Messages</label>
              <select
                value={settings.allowDirectMessages}
                onChange={(e) => updateSetting('allowDirectMessages', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="everyone">Everyone</option>
                <option value="followers">Followers only</option>
                <option value="none">No one</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comments on Stories</label>
              <select
                value={settings.allowComments}
                onChange={(e) => updateSetting('allowComments', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="everyone">Everyone</option>
                <option value="followers">Followers only</option>
                <option value="none">No one</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Security */}
      <Card padding="lg">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Account Security</h3>
              <p className="text-sm text-gray-600">Secure your account with additional protection</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">
                    {settings.twoFactorEnabled 
                      ? 'Your account is protected with 2FA' 
                      : 'Add an extra layer of security to your account'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  settings.twoFactorEnabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {settings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <Button
                  type="button"
                  variant={settings.twoFactorEnabled ? 'outline' : 'primary'}
                  size="sm"
                  onClick={settings.twoFactorEnabled ? disableTwoFactor : () => setShowTwoFactorSetup(true)}
                >
                  {settings.twoFactorEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-600">Last changed 30 days ago</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/auth/change-password'}
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Data & Privacy */}
      <Card padding="lg">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Data & Privacy</h3>
              <p className="text-sm text-gray-600">Control how your data is used</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Data Collection</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-700">Analytics</span>
                    <p className="text-xs text-gray-500">Help us improve the platform with usage data</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dataCollection.analytics}
                    onChange={(e) => updateDataCollection('analytics', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-700">Personalization</span>
                    <p className="text-xs text-gray-500">Personalize content recommendations</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dataCollection.personalization}
                    onChange={(e) => updateDataCollection('personalization', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-700">Marketing</span>
                    <p className="text-xs text-gray-500">Receive targeted marketing communications</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dataCollection.marketing}
                    onChange={(e) => updateDataCollection('marketing', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Data Management</h4>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={exportData}
                  className="w-full justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export My Data
                </Button>
                <p className="text-xs text-gray-500">
                  Download a copy of all your data including stories, comments, and account information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card padding="lg">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
              <p className="text-sm text-red-600">Irreversible and destructive actions</p>
            </div>
          </div>

          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-900">Delete Account</p>
                <p className="text-sm text-red-700">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={deleteAccount}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
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
          Save Privacy Settings
        </Button>
      </div>
    </form>
  );
}