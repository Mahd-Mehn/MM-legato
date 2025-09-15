'use client';

import { useState } from 'react';
import { User, Settings, Shield, Bell, Users, Globe, Camera, Edit3 } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ProfileEditor from '@/components/profile/ProfileEditor';
import PreferencesManager from '@/components/profile/PreferencesManager';
import PrivacySettings from '@/components/profile/PrivacySettings';
import SocialConnections from '@/components/profile/SocialConnections';

type TabType = 'profile' | 'preferences' | 'privacy' | 'social';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: User },
    { id: 'preferences' as TabType, label: 'Preferences', icon: Settings },
    { id: 'privacy' as TabType, label: 'Privacy & Security', icon: Shield },
    { id: 'social' as TabType, label: 'Social', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your profile, preferences, and account security</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card padding="sm">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && <ProfileEditor />}
            {activeTab === 'preferences' && <PreferencesManager />}
            {activeTab === 'privacy' && <PrivacySettings />}
            {activeTab === 'social' && <SocialConnections />}
          </div>
        </div>
      </div>
    </div>
  );
}