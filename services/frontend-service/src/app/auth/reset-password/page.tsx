'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (resetToken) {
      setToken(resetToken);
      validateToken(resetToken);
    } else {
      setTokenValid(false);
    }
  }, [searchParams]);

  const validateToken = async (token: string) => {
    try {
      // TODO: Implement actual token validation API call
      console.log('Validating token:', token);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, accept any token that's at least 10 characters
      setTokenValid(token.length >= 10);
    } catch (error) {
      console.error('Token validation failed:', error);
      setTokenValid(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      // Enhanced password validation
      const passwordRequirements = [
        { test: formData.password.length >= 8, message: 'at least 8 characters' },
        { test: /[A-Z]/.test(formData.password), message: 'one uppercase letter' },
        { test: /[a-z]/.test(formData.password), message: 'one lowercase letter' },
        { test: /\d/.test(formData.password), message: 'one number' },
        { test: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password), message: 'one special character' }
      ];
      
      const failedRequirements = passwordRequirements.filter(req => !req.test);
      if (failedRequirements.length > 0) {
        newErrors.password = `Password must contain ${failedRequirements.map(req => req.message).join(', ')}`;
      }
    }

    if (formData.password !== formData.confirmPassword) {
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
      // TODO: Implement actual password reset API call
      console.log('Resetting password with token:', token);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
    } catch (error) {
      console.error('Password reset failed:', error);
      setErrors({ submit: 'Failed to reset password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Loading state while validating token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <Card padding="lg">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Validating reset link...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card padding="lg">
            <div className="text-center space-y-6">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
                <p className="text-gray-600">
                  This password reset link is invalid or has expired.
                </p>
              </div>
              
              <div className="space-y-3">
                <Link href="/auth/forgot-password">
                  <Button fullWidth>
                    Request New Reset Link
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" fullWidth>
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card padding="lg">
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h1>
                <p className="text-gray-600">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
              </div>
              
              <Link href="/auth/login">
                <Button fullWidth size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card padding="lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Password</h1>
            <p className="text-gray-600">
              Enter a strong password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              placeholder="Create a strong password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              required
            />

            {/* Password Strength Indicator */}
            {formData.password && (
              <PasswordStrengthIndicator password={formData.password} />
            )}

            {/* Confirm Password */}
            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              placeholder="Confirm your new password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              required
            />

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
              Reset Password
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-sm text-primary-600 hover:text-primary-700">
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}