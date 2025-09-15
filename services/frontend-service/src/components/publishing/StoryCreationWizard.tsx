'use client';

import { useState } from 'react';
import { 
  BookOpen, 
  Image, 
  Tag, 
  DollarSign, 
  Shield, 
  Globe, 
  Eye,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  X
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Input from '@/components/Input';

interface StoryMetadata {
  title: string;
  description: string;
  genre: string;
  subGenres: string[];
  tags: string[];
  language: string;
  targetAudience: 'general' | 'teen' | 'mature';
  contentWarnings: string[];
  coverImage?: File;
  coverImageUrl?: string;
}

interface MonetizationSettings {
  type: 'free' | 'premium' | 'subscription' | 'mixed';
  premiumChapters: number[];
  coinPrice: number;
  subscriptionTier: 'basic' | 'premium' | 'vip';
  freeChapters: number;
}

interface PublishingSettings {
  publishNow: boolean;
  scheduledDate?: Date;
  autoPublish: boolean;
  publishFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  notifyFollowers: boolean;
  socialMediaShare: boolean;
}

interface IPProtectionSettings {
  enableProtection: boolean;
  copyrightNotice: string;
  allowDerivatives: boolean;
  commercialUse: boolean;
  attribution: boolean;
}

interface StoryCreationWizardProps {
  onComplete: (data: {
    metadata: StoryMetadata;
    monetization: MonetizationSettings;
    publishing: PublishingSettings;
    ipProtection: IPProtectionSettings;
  }) => void;
  onCancel: () => void;
  initialData?: Partial<StoryMetadata>;
}

export default function StoryCreationWizard({
  onComplete,
  onCancel,
  initialData,
}: StoryCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [metadata, setMetadata] = useState<StoryMetadata>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    genre: initialData?.genre || '',
    subGenres: initialData?.subGenres || [],
    tags: initialData?.tags || [],
    language: initialData?.language || 'English',
    targetAudience: 'general',
    contentWarnings: [],
    coverImageUrl: initialData?.coverImageUrl,
  });

  const [monetization, setMonetization] = useState<MonetizationSettings>({
    type: 'free',
    premiumChapters: [],
    coinPrice: 10,
    subscriptionTier: 'basic',
    freeChapters: 3,
  });

  const [publishing, setPublishing] = useState<PublishingSettings>({
    publishNow: false,
    autoPublish: false,
    notifyFollowers: true,
    socialMediaShare: false,
  });

  const [ipProtection, setIPProtection] = useState<IPProtectionSettings>({
    enableProtection: true,
    copyrightNotice: `© ${new Date().getFullYear()} All rights reserved.`,
    allowDerivatives: false,
    commercialUse: false,
    attribution: true,
  });

  const steps = [
    { id: 1, title: 'Story Details', icon: <BookOpen className="w-5 h-5" /> },
    { id: 2, title: 'Monetization', icon: <DollarSign className="w-5 h-5" /> },
    { id: 3, title: 'Publishing', icon: <Globe className="w-5 h-5" /> },
    { id: 4, title: 'IP Protection', icon: <Shield className="w-5 h-5" /> },
    { id: 5, title: 'Review', icon: <Eye className="w-5 h-5" /> },
  ];

  const genres = [
    'Romance', 'Fantasy', 'Sci-Fi', 'Mystery', 'Drama', 'Adventure',
    'Horror', 'Comedy', 'Historical', 'Contemporary', 'Thriller', 'Action'
  ];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian'
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete({
      metadata,
      monetization,
      publishing,
      ipProtection,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMetadata(prev => ({ ...prev, coverImage: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setMetadata(prev => ({ ...prev, coverImageUrl: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !metadata.tags.includes(tag.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Create New Story</CardTitle>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-primary-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* Step 1: Story Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Input
                label="Story Title"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your story title"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={metadata.description}
                  onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your story..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Genre
                  </label>
                  <select
                    value={metadata.genre}
                    onChange={(e) => setMetadata(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select a genre</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={metadata.language}
                    onChange={(e) => setMetadata(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {languages.map(language => (
                      <option key={language} value={language}>{language}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Image
                </label>
                <div className="flex items-center space-x-4">
                  {metadata.coverImageUrl ? (
                    <div className="relative">
                      <img
                        src={metadata.coverImageUrl}
                        alt="Cover preview"
                        className="w-24 h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={() => setMetadata(prev => ({ ...prev, coverImageUrl: undefined, coverImage: undefined }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label
                      htmlFor="cover-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Cover
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 300x400px, max 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tags (press Enter)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Target Audience
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'general', label: 'General Audience', description: 'Suitable for all ages' },
                    { value: 'teen', label: 'Teen (13+)', description: 'May contain mild language and themes' },
                    { value: 'mature', label: 'Mature (18+)', description: 'Contains adult content' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="targetAudience"
                        value={option.value}
                        checked={metadata.targetAudience === option.value}
                        onChange={(e) => setMetadata(prev => ({ ...prev, targetAudience: e.target.value as any }))}
                        className="mt-1 w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Monetization */}
          {currentStep === 2 && (
            <MonetizationStep
              monetization={monetization}
              onChange={setMonetization}
            />
          )}

          {/* Step 3: Publishing */}
          {currentStep === 3 && (
            <PublishingStep
              publishing={publishing}
              onChange={setPublishing}
            />
          )}

          {/* Step 4: IP Protection */}
          {currentStep === 4 && (
            <IPProtectionStep
              ipProtection={ipProtection}
              onChange={setIPProtection}
            />
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <ReviewStep
              metadata={metadata}
              monetization={monetization}
              publishing={publishing}
              ipProtection={ipProtection}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            
            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Create Story
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}// Monetization Step Component
function MonetizationStep({
  monetization,
  onChange,
}: {
  monetization: MonetizationSettings;
  onChange: (settings: MonetizationSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monetization Strategy</h3>
        <div className="space-y-4">
          {[
            {
              value: 'free',
              label: 'Free',
              description: 'All chapters are free to read',
              icon: <BookOpen className="w-5 h-5" />,
            },
            {
              value: 'premium',
              
         label: 'Premium Chapters',
              description: 'Readers pay coins to unlock specific chapters',
              icon: <DollarSign className="w-5 h-5" />,
            },
            {
              value: 'subscription',
              label: 'Subscription Only',
              description: 'Only subscribers can read your story',
              icon: <Shield className="w-5 h-5" />,
            },
            {
              value: 'mixed',
              label: 'Mixed Model',
              description: 'Combination of free and premium chapters',
              icon: <Globe className="w-5 h-5" />,
            },
          ].map((option) => (
            <label key={option.value} className="flex items-start space-x-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="radio"
                name="monetizationType"
                value={option.value}
                checked={monetization.type === option.value}
                onChange={(e) => onChange({ ...monetization, type: e.target.value as any })}
                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {option.icon}
                  <div className="font-medium text-gray-900">{option.label}</div>
                </div>
                <div className="text-sm text-gray-500 mt-1">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Premium Settings */}
      {(monetization.type === 'premium' || monetization.type === 'mixed') && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">Premium Settings</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coin Price per Chapter
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={monetization.coinPrice}
              onChange={(e) => onChange({ ...monetization, coinPrice: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {monetization.type === 'mixed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Free Chapters
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={monetization.freeChapters}
                onChange={(e) => onChange({ ...monetization, freeChapters: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                First few chapters will be free, rest will require coins
              </p>
            </div>
          )}
        </div>
      )}

      {/* Subscription Settings */}
      {monetization.type === 'subscription' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">Subscription Tier</h4>
          <div className="space-y-2">
            {[
              { value: 'basic', label: 'Basic ($4.99/month)', description: 'Access to basic subscriber content' },
              { value: 'premium', label: 'Premium ($9.99/month)', description: 'Access to premium subscriber content' },
              { value: 'vip', label: 'VIP ($19.99/month)', description: 'Access to all exclusive content' },
            ].map((tier) => (
              <label key={tier.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="subscriptionTier"
                  value={tier.value}
                  checked={monetization.subscriptionTier === tier.value}
                  onChange={(e) => onChange({ ...monetization, subscriptionTier: e.target.value as any })}
                  className="mt-1 w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-gray-900">{tier.label}</div>
                  <div className="text-sm text-gray-500">{tier.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Publishing Step Component
function PublishingStep({
  publishing,
  onChange,
}: {
  publishing: PublishingSettings;
  onChange: (settings: PublishingSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Publishing Options</h3>
        
        {/* Publish Now or Schedule */}
        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={publishing.publishNow}
              onChange={(e) => onChange({ ...publishing, publishNow: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <div className="font-medium text-gray-900">Publish Immediately</div>
              <div className="text-sm text-gray-500">Make your story available to readers right away</div>
            </div>
          </label>

          {!publishing.publishNow && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Publication Date
              </label>
              <input
                type="datetime-local"
                value={publishing.scheduledDate ? publishing.scheduledDate.toISOString().slice(0, 16) : ''}
                onChange={(e) => onChange({ 
                  ...publishing, 
                  scheduledDate: e.target.value ? new Date(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
        </div>

        {/* Auto-publish Settings */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={publishing.autoPublish}
              onChange={(e) => onChange({ ...publishing, autoPublish: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <div className="font-medium text-gray-900">Auto-publish New Chapters</div>
              <div className="text-sm text-gray-500">Automatically publish chapters on a schedule</div>
            </div>
          </label>

          {publishing.autoPublish && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publishing Frequency
              </label>
              <select
                value={publishing.publishFrequency || 'weekly'}
                onChange={(e) => onChange({ ...publishing, publishFrequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Notifications</h4>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={publishing.notifyFollowers}
              onChange={(e) => onChange({ ...publishing, notifyFollowers: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <div className="font-medium text-gray-900">Notify Followers</div>
              <div className="text-sm text-gray-500">Send notifications to your followers when you publish</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={publishing.socialMediaShare}
              onChange={(e) => onChange({ ...publishing, socialMediaShare: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <div className="font-medium text-gray-900">Share on Social Media</div>
              <div className="text-sm text-gray-500">Automatically share new chapters on connected social accounts</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

// IP Protection Step Component
function IPProtectionStep({
  ipProtection,
  onChange,
}: {
  ipProtection: IPProtectionSettings;
  onChange: (settings: IPProtectionSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Intellectual Property Protection</h3>
        
        <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-200 rounded-lg">
          <input
            type="checkbox"
            checked={ipProtection.enableProtection}
            onChange={(e) => onChange({ ...ipProtection, enableProtection: e.target.checked })}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <div>
            <div className="font-medium text-gray-900">Enable IP Protection</div>
            <div className="text-sm text-gray-500">
              Protect your story with blockchain-based copyright verification
            </div>
          </div>
        </label>

        {ipProtection.enableProtection && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Copyright Notice
              </label>
              <textarea
                value={ipProtection.copyrightNotice}
                onChange={(e) => onChange({ ...ipProtection, copyrightNotice: e.target.value })}
                placeholder="Enter your copyright notice..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Usage Rights</h4>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ipProtection.allowDerivatives}
                  onChange={(e) => onChange({ ...ipProtection, allowDerivatives: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Allow Derivative Works</div>
                  <div className="text-sm text-gray-500">Allow others to create works based on your story</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ipProtection.commercialUse}
                  onChange={(e) => onChange({ ...ipProtection, commercialUse: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Allow Commercial Use</div>
                  <div className="text-sm text-gray-500">Allow others to use your work for commercial purposes</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ipProtection.attribution}
                  onChange={(e) => onChange({ ...ipProtection, attribution: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Require Attribution</div>
                  <div className="text-sm text-gray-500">Require others to credit you when using your work</div>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Review Step Component
function ReviewStep({
  metadata,
  monetization,
  publishing,
  ipProtection,
}: {
  metadata: StoryMetadata;
  monetization: MonetizationSettings;
  publishing: PublishingSettings;
  ipProtection: IPProtectionSettings;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Story Settings</h3>
      
      {/* Story Details */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Story Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Title:</span>
            <span className="ml-2 font-medium">{metadata.title}</span>
          </div>
          <div>
            <span className="text-gray-500">Genre:</span>
            <span className="ml-2 font-medium">{metadata.genre}</span>
          </div>
          <div>
            <span className="text-gray-500">Language:</span>
            <span className="ml-2 font-medium">{metadata.language}</span>
          </div>
          <div>
            <span className="text-gray-500">Target Audience:</span>
            <span className="ml-2 font-medium capitalize">{metadata.targetAudience}</span>
          </div>
        </div>
        {metadata.description && (
          <div className="mt-3">
            <span className="text-gray-500 text-sm">Description:</span>
            <p className="mt-1 text-gray-700 text-sm">{metadata.description}</p>
          </div>
        )}
        {metadata.tags.length > 0 && (
          <div className="mt-3">
            <span className="text-gray-500 text-sm">Tags:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {metadata.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monetization */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Monetization</h4>
        <div className="text-sm">
          <div>
            <span className="text-gray-500">Type:</span>
            <span className="ml-2 font-medium capitalize">{monetization.type}</span>
          </div>
          {(monetization.type === 'premium' || monetization.type === 'mixed') && (
            <div className="mt-2">
              <span className="text-gray-500">Coin Price:</span>
              <span className="ml-2 font-medium">{monetization.coinPrice} coins per chapter</span>
            </div>
          )}
          {monetization.type === 'mixed' && (
            <div className="mt-2">
              <span className="text-gray-500">Free Chapters:</span>
              <span className="ml-2 font-medium">{monetization.freeChapters}</span>
            </div>
          )}
          {monetization.type === 'subscription' && (
            <div className="mt-2">
              <span className="text-gray-500">Subscription Tier:</span>
              <span className="ml-2 font-medium capitalize">{monetization.subscriptionTier}</span>
            </div>
          )}
        </div>
      </div>

      {/* Publishing */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Publishing</h4>
        <div className="text-sm space-y-2">
          <div>
            <span className="text-gray-500">Publish:</span>
            <span className="ml-2 font-medium">
              {publishing.publishNow ? 'Immediately' : 'Scheduled'}
            </span>
          </div>
          {!publishing.publishNow && publishing.scheduledDate && (
            <div>
              <span className="text-gray-500">Scheduled Date:</span>
              <span className="ml-2 font-medium">
                {publishing.scheduledDate.toLocaleDateString()} at {publishing.scheduledDate.toLocaleTimeString()}
              </span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Auto-publish:</span>
            <span className="ml-2 font-medium">
              {publishing.autoPublish ? `Yes (${publishing.publishFrequency})` : 'No'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Notify Followers:</span>
            <span className="ml-2 font-medium">{publishing.notifyFollowers ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>

      {/* IP Protection */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">IP Protection</h4>
        <div className="text-sm">
          <div>
            <span className="text-gray-500">Protection Enabled:</span>
            <span className="ml-2 font-medium">{ipProtection.enableProtection ? 'Yes' : 'No'}</span>
          </div>
          {ipProtection.enableProtection && (
            <>
              <div className="mt-2">
                <span className="text-gray-500">Copyright Notice:</span>
                <p className="mt-1 text-gray-700 text-sm">{ipProtection.copyrightNotice}</p>
              </div>
              <div className="mt-2 space-y-1">
                <div>
                  <span className="text-gray-500">Allow Derivatives:</span>
                  <span className="ml-2 font-medium">{ipProtection.allowDerivatives ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Commercial Use:</span>
                  <span className="ml-2 font-medium">{ipProtection.commercialUse ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Require Attribution:</span>
                  <span className="ml-2 font-medium">{ipProtection.attribution ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}