'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, BookOpen, PenTool, Building2, Shield } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import SocialLogin from '@/components/auth/SocialLogin';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

// Extend Window interface for username check timeout
declare global {
  interface Window {
    usernameCheckTimeout?: NodeJS.Timeout;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'reader' as 'reader' | 'writer' | 'studio',
    acceptTerms: false,
    enableTwoFactor: false,
  });
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear submit error when user makes changes
    if (errors.submit) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.submit;
        return newErrors;
      });
    }

    // Check username availability with debounce
    if (name === 'username' && value.trim().length >= 3) {
      // Clear any existing timeout
      if (window.usernameCheckTimeout) {
        clearTimeout(window.usernameCheckTimeout);
      }
      
      // Set new timeout for username check
      window.usernameCheckTimeout = setTimeout(() => {
        checkUsernameAvailability(value.trim());
      }, 800);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.length > 254) {
      newErrors.email = 'Email address is too long';
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.trim().length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    } else if (/^[_-]|[_-]$/.test(formData.username.trim())) {
      newErrors.username = 'Username cannot start or end with hyphens or underscores';
    } else if (/[_-]{2,}/.test(formData.username.trim())) {
      newErrors.username = 'Username cannot contain consecutive hyphens or underscores';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordRequirements = [
        { test: formData.password.length >= 8, message: 'at least 8 characters' },
        { test: formData.password.length <= 128, message: 'no more than 128 characters' },
        { test: /[A-Z]/.test(formData.password), message: 'one uppercase letter' },
        { test: /[a-z]/.test(formData.password), message: 'one lowercase letter' },
        { test: /\d/.test(formData.password), message: 'one number' },
        { test: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password), message: 'one special character' }
      ];
      
      const failedRequirements = passwordRequirements.filter(req => !req.test);
      if (failedRequirements.length > 0) {
        newErrors.password = `Password must contain ${failedRequirements.map(req => req.message).join(', ')}`;
      }
      
      // Check for common weak passwords
      const commonPasswords = ['password', '12345678', 'qwerty123', 'password123'];
      if (commonPasswords.includes(formData.password.toLowerCase())) {
        newErrors.password = 'Please choose a stronger password';
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms acceptance validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions to create an account';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear any pending username check timeout
      if (window.usernameCheckTimeout) {
        clearTimeout(window.usernameCheckTimeout);
      }
    };
  }, []);

  // Restore form data from session storage (for social login returns)
  useEffect(() => {
    const savedFormData = sessionStorage.getItem('legato_registration_form');
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        setFormData(prev => ({ ...prev, ...parsed }));
        sessionStorage.removeItem('legato_registration_form');
      } catch (error) {
        console.error('Failed to restore form data:', error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    
    try {
      // Prepare registration data according to the backend API schema
      const registrationData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        username: formData.username.trim(),
        role: formData.role,
        display_name: formData.username.trim(), // Use username as display name initially
        acceptTerms: formData.acceptTerms,
      };

      // Call the authentication service
      await register(registrationData);
      
      // If 2FA is enabled, show setup
      if (formData.enableTwoFactor) {
        setShowTwoFactorSetup(true);
      } else {
        // Registration successful - check authentication state
        // Wait a moment for auth context to update
        setTimeout(() => {
          if (isAuthenticated) {
            // User is authenticated, redirect to dashboard
            router.push('/dashboard');
          } else {
            // User needs email verification before being authenticated
            router.push('/auth/login?message=verify-email');
          }
        }, 100);
      }
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Handle specific registration errors based on backend responses
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.statusCode === 400) {
        // Handle validation errors from backend
        if (error.message) {
          if (error.message.includes('Email address is already registered')) {
            setErrors({ email: 'This email address is already registered. Please try logging in instead.' });
            return;
          } else if (error.message.includes('Username is already taken')) {
            setErrors({ username: 'This username is already taken. Please choose another one.' });
            return;
          } else if (error.message.includes('Password must')) {
            setErrors({ password: error.message });
            return;
          } else if (error.message.includes('Username can only contain')) {
            setErrors({ username: error.message });
            return;
          }
        }
        errorMessage = error.message || 'Invalid registration data. Please check your information.';
      } else if (error.statusCode === 409) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
      } else if (error.statusCode === 429) {
        errorMessage = 'Too many registration attempts. Please try again later.';
      } else if (error.statusCode === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.statusCode === 0 || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'twitter') => {
    try {
      setLoading(true);
      setErrors({});
      
      // Build the OAuth URL with proper parameters
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
      const state = encodeURIComponent(JSON.stringify({ 
        action: 'register',
        role: formData.role,
        returnTo: '/dashboard'
      }));
      
      const oauthUrl = `${apiUrl}/auth/oauth/${provider}?redirect_uri=${redirectUri}&state=${state}`;
      
      // Store the current form data in case user returns
      sessionStorage.setItem('legato_registration_form', JSON.stringify({
        role: formData.role,
        enableTwoFactor: formData.enableTwoFactor
      }));
      
      // Redirect to OAuth provider
      window.location.href = oauthUrl;
    } catch (error) {
      console.error(`${provider} registration failed:`, error);
      setErrors({ submit: `${provider} registration failed. Please try again.` });
      setLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) return;
    
    try {
      // Check username availability with the backend using the API client
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/auth/check-username?username=${encodeURIComponent(username.toLowerCase())}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Backend returns success: true/false, with available field
        if (data.success && !data.available) {
          setErrors(prev => ({ ...prev, username: 'This username is already taken' }));
        } else if (data.success && data.available) {
          // Clear username error if it was about availability
          setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors.username === 'This username is already taken') {
              delete newErrors.username;
            }
            return newErrors;
          });
        }
      }
    } catch (error) {
      console.error('Username check failed:', error);
      // Don't show error to user for username check failures
    }
  };

  const handleTwoFactorComplete = (backupCodes: string[]) => {
    console.log('2FA setup completed with backup codes:', backupCodes);
    toast.success('Two-factor authentication enabled successfully!');
    // Redirect to dashboard
    router.push('/dashboard');
  };

  if (showTwoFactorSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <TwoFactorSetup
            onComplete={handleTwoFactorComplete}
            onCancel={() => setShowTwoFactorSetup(false)}
            userEmail={formData.email}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BookOpen className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Legato</h1>
          <p className="text-gray-600">Start your storytelling journey</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I want to join as a:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'reader' }))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.role === 'reader'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mx-auto mb-1" />
                  <div className="font-medium text-sm">Reader</div>
                  <div className="text-xs text-gray-500">Discover</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'writer' }))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.role === 'writer'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <PenTool className="w-5 h-5 mx-auto mb-1" />
                  <div className="font-medium text-sm">Writer</div>
                  <div className="text-xs text-gray-500">Create</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'studio' }))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.role === 'studio'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-5 h-5 mx-auto mb-1" />
                  <div className="font-medium text-sm">Studio</div>
                  <div className="text-xs text-gray-500">License</div>
                </button>
              </div>
            </div>

            {/* Email */}
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="your@email.com"
              required
            />

            {/* Username */}
            <Input
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              error={errors.username}
              placeholder="Choose a unique username"
              required
            />

            {/* Password */}
            <Input
              label="Password"
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
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
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

            {/* Two-Factor Authentication Option */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="enableTwoFactor"
                  checked={formData.enableTwoFactor}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Enable Two-Factor Authentication
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add an extra layer of security to your account (recommended)
                  </p>
                </div>
              </label>
            </div>

            {/* Terms and Conditions */}
            <div>
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary-600 hover:text-primary-700 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary-600 hover:text-primary-700 underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              loading={loading || authLoading}
              fullWidth
              size="lg"
              disabled={loading || authLoading}
            >
              Create Account
            </Button>
          </form>

          {/* Social Login */}
          <SocialLogin onSocialLogin={handleSocialLogin} loading={loading} className="mt-6" />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}