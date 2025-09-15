'use client';

import { useState } from 'react';
import { 
  Globe, 
  Calendar, 
  Clock, 
  Eye, 
  Shield, 
  DollarSign,
  Users,
  Bell,
  Share2,
  CheckCircle,
  AlertCircle,
  X,
  Settings
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

interface PublishingWorkflowProps {
  storyId: string;
  storyTitle: string;
  chapters: Chapter[];
  currentStatus: 'draft' | 'published' | 'scheduled';
  onPublish: (settings: PublishingSettings) => Promise<void>;
  onSchedule: (settings: PublishingSettings) => Promise<void>;
  onCancel: () => void;
}

interface Chapter {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'scheduled';
  wordCount: number;
  order: number;
}

interface PublishingSettings {
  publishNow: boolean;
  scheduledDate?: Date;
  notifyFollowers: boolean;
  socialMediaShare: boolean;
  monetization: {
    type: 'free' | 'premium' | 'subscription';
    coinPrice?: number;
    subscriptionTier?: 'basic' | 'premium' | 'vip';
  };
  ipProtection: boolean;
  contentWarnings: string[];
  targetAudience: 'general' | 'teen' | 'mature';
}

export default function PublishingWorkflow({
  storyId,
  storyTitle,
  chapters,
  currentStatus,
  onPublish,
  onSchedule,
  onCancel,
}: PublishingWorkflowProps) {
  const [settings, setSettings] = useState<PublishingSettings>({
    publishNow: true,
    notifyFollowers: true,
    socialMediaShare: false,
    monetization: {
      type: 'free',
    },
    ipProtection: true,
    contentWarnings: [],
    targetAudience: 'general',
  });

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Publish Story: {storyTitle}</CardTitle>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Publishing Options */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Publishing Options</h3>
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="publishTiming"
                    checked={settings.publishNow}
                    onChange={() => setSettings(prev => ({ ...prev, publishNow: true }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Publish Now</div>
                    <div className="text-sm text-gray-500">Make your story available immediately</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="publishTiming"
                    checked={!settings.publishNow}
                    onChange={() => setSettings(prev => ({ ...prev, publishNow: false }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Schedule for Later</div>
                    <div className="text-sm text-gray-500">Choose when to publish your story</div>
                  </div>
                </label>

                {!settings.publishNow && (
                  <div className="ml-7">
                    <input
                      type="datetime-local"
                      value={settings.scheduledDate ? settings.scheduledDate.toISOString().slice(0, 16) : ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        scheduledDate: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyFollowers}
                    onChange={(e) => setSettings(prev => ({ ...prev, notifyFollowers: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Notify Followers</div>
                    <div className="text-sm text-gray-500">Send notifications to your followers</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.socialMediaShare}
                    onChange={(e) => setSettings(prev => ({ ...prev, socialMediaShare: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Share on Social Media</div>
                    <div className="text-sm text-gray-500">Automatically share on connected accounts</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <div className="space-x-3">
                {!settings.publishNow && (
                  <Button
                    onClick={() => onSchedule(settings)}
                    loading={loading}
                    leftIcon={<Calendar className="w-4 h-4" />}
                  >
                    Schedule
                  </Button>
                )}
                <Button
                  onClick={() => onPublish(settings)}
                  loading={loading}
                  leftIcon={<Globe className="w-4 h-4" />}
                >
                  {settings.publishNow ? 'Publish Now' : 'Publish'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}