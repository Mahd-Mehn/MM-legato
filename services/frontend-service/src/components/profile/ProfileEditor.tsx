'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, User, Mail, MapPin, Calendar, Link as LinkIcon, Save } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';

interface ProfileData {
  avatar: string | null;
  displayName: string;
  username: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  birthDate: string;
  role: 'reader' | 'writer' | 'studio';
}

export default function ProfileEditor() {
  const [profileData, setProfileData] = useState<ProfileData>({
    avatar: null,
    displayName: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    bio: 'Passionate storyteller and avid reader. Love exploring new worlds through words.',
    location: 'New York, NY',
    website: 'https://johndoe.com',
    birthDate: '1990-01-01',
    role: 'writer'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, avatar: 'Image must be less than 5MB' }));
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, avatar: 'Please select a valid image file' }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        setProfileData(prev => ({ ...prev, avatar: result }));
        setErrors(prev => ({ ...prev, avatar: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setProfileData(prev => ({ ...prev, avatar: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!profileData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!profileData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(profileData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (profileData.website && !/^https?:\/\/.+/.test(profileData.website)) {
      newErrors.website = 'Please enter a valid URL (starting with http:// or https://)';
    }

    if (profileData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Implement actual profile update API call
      console.log('Updating profile:', profileData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message (you might want to use a toast notification)
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update failed:', error);
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="lg">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Information</h2>
          <p className="text-gray-600">Update your profile details and avatar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {avatarPreview || profileData.avatar ? (
                    <img
                      src={avatarPreview || profileData.avatar || ''}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                {(avatarPreview || profileData.avatar) && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Change Photo
                </Button>
                <p className="text-xs text-gray-500">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
                {errors.avatar && (
                  <p className="text-xs text-red-600">{errors.avatar}</p>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Display Name"
              name="displayName"
              value={profileData.displayName}
              onChange={handleInputChange}
              error={errors.displayName}
              placeholder="Your display name"
              required
            />

            <Input
              label="Username"
              name="username"
              value={profileData.username}
              onChange={handleInputChange}
              error={errors.username}
              placeholder="Your unique username"
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="your@email.com"
              required
            />

            <Input
              label="Location"
              name="location"
              value={profileData.location}
              onChange={handleInputChange}
              error={errors.location}
              placeholder="City, Country"
              leftIcon={<MapPin className="w-4 h-4" />}
            />

            <Input
              label="Website"
              name="website"
              value={profileData.website}
              onChange={handleInputChange}
              error={errors.website}
              placeholder="https://yourwebsite.com"
              leftIcon={<LinkIcon className="w-4 h-4" />}
            />

            <Input
              label="Birth Date"
              type="date"
              name="birthDate"
              value={profileData.birthDate}
              onChange={handleInputChange}
              error={errors.birthDate}
              leftIcon={<Calendar className="w-4 h-4" />}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Tell us about yourself..."
            />
            <div className="flex justify-between items-center mt-1">
              {errors.bio && (
                <p className="text-sm text-red-600">{errors.bio}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">
                {profileData.bio.length}/500 characters
              </p>
            </div>
          </div>

          {/* Role Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <div className="inline-flex items-center px-3 py-2 bg-gray-100 rounded-lg">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {profileData.role}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Contact support to change your account type
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={loading}
              size="lg"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}