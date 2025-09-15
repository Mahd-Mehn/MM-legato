'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      // Enhanced password validation
      const passwordRequirements = [
        { test: formData.newPassword.length >= 8, message: 'at least 8 characters' },
        { test: /[A-Z]/.test(formData.newPassword), message: 'one uppercase letter' },
        { test: /[a-z]/.test(formData.newPassword), message: 'one lowercase letter' },
        { test: /\d/.test(formData.newPassword), message: 'one number' },
        { test: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword), message: 'one special character' }
      ];
      
      const failedRequirements = passwordRequirements.filter(req => !req.test);
      if (failedRequirements.length > 0) {
        newErrors.newPassword = `Password must contain ${failedRequirements.map(req => req.message).join(', ')}`;
      }
    }

    if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Implement actual password change API call
      console.log('Changing password...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
    } catch (error) {
      console.error('Password change failed:', error);
      setErrors({ submit: 'Failed to change password. Please check your current password and try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card padding="lg">
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Changed Successfully</h1>
                <p className="text-gray-600">
                  Your password has been updated. For security, you'll be signed out of all devices.
                </p>
              </div>
              
              <div className="space-y-3">
                <Link href="/auth/login">
                  <Button fullWidth size="lg">
                    Sign In Again
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" fullWidth>
                    Back to Profile
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link 
            href="/profile"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
        </div>

        <Card padding="lg">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <Shield className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h1>
              <p className="text-gray-600">
                Update your password to keep your account secure
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <Input
                label="Current Password"
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                error={errors.currentPassword}
                placeholder="Enter your current password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required
              />

              {/* New Password */}
              <Input
                label="New Password"
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                error={errors.newPassword}
                placeholder="Create a strong new password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required
              />

              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <PasswordStrengthIndicator password={formData.newPassword} />
              )}

              {/* Confirm New Password */}
              <Input
                label="Confirm New Password"
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={errors.confirmPassword}
                placeholder="Confirm your new password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required
              />

              {/* Security Tips */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Password Security Tips:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use a unique password you don't use elsewhere</li>
                  <li>• Include a mix of letters, numbers, and symbols</li>
                  <li>• Avoid personal information like names or dates</li>
                  <li>• Consider using a password manager</li>
                </ul>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
              >
                Change Password
              </Button>
            </form>

            {/* Additional Security */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center mb-4">
                Want to add extra security to your account?
              </p>
              <Link href="/profile?tab=privacy">
                <Button variant="outline" fullWidth>
                  Enable Two-Factor Authentication
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}