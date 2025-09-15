'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, BookOpen, Shield } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import SocialLogin from '@/components/auth/SocialLogin';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    twoFactorCode: '',
  });
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'app' | 'backup'>('app');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
      return;
    }

    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Account created successfully! Please sign in.');
    }
    if (searchParams.get('twoFactorEnabled') === 'true') {
      setSuccessMessage('Two-factor authentication enabled successfully!');
    }
    if (searchParams.get('verified') === 'true') {
      setSuccessMessage('Email verified successfully! Please sign in.');
    }
    if (searchParams.get('passwordReset') === 'true') {
      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
    }
  }, [searchParams, isAuthenticated, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setSuccessMessage('');
    setErrors({});
    
    try {
      // Prepare login credentials
      const credentials = {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        ...(showTwoFactor && formData.twoFactorCode && {
          twoFactorCode: formData.twoFactorCode,
          twoFactorMethod: twoFactorMethod
        })
      };

      // Call the authentication service
      await login(credentials);
      
      // Redirect to intended destination or dashboard
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
      
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Handle specific error cases
      if (error.message?.includes('two-factor') || error.code === 'TWO_FACTOR_REQUIRED') {
        setShowTwoFactor(true);
        setErrors({ twoFactorCode: 'Please enter your two-factor authentication code' });
      } else if (error.message?.includes('verification code')) {
        setErrors({ twoFactorCode: error.message });
      } else {
        setErrors({ submit: error.message || 'Login failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'twitter') => {
    try {
      // TODO: Implement social login
      console.log(`Social login with ${provider}`);
      // Redirect to provider OAuth
      window.location.href = `/api/auth/${provider}`;
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      setErrors({ submit: `${provider} login failed. Please try again.` });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BookOpen className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your Legato account</p>
        </div>

        <Card padding="lg">
          {successMessage && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Password */}
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              placeholder="Enter your password"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Two-Factor Authentication */}
            {showTwoFactor && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Two-Factor Authentication</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    {twoFactorMethod === 'app' 
                      ? 'Enter the 6-digit code from your authenticator app'
                      : 'Enter one of your backup codes'
                    }
                  </p>
                </div>

                <Input
                  label={twoFactorMethod === 'app' ? 'Verification Code' : 'Backup Code'}
                  type="text"
                  name="twoFactorCode"
                  value={formData.twoFactorCode}
                  onChange={handleInputChange}
                  error={errors.twoFactorCode}
                  placeholder={twoFactorMethod === 'app' ? '000000' : 'Enter backup code'}
                  maxLength={twoFactorMethod === 'app' ? 6 : 8}
                  className="text-center text-lg tracking-widest"
                />

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setTwoFactorMethod(twoFactorMethod === 'app' ? 'backup' : 'app')}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {twoFactorMethod === 'app' 
                      ? 'Use backup code instead' 
                      : 'Use authenticator app instead'
                    }
                  </button>
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
              {showTwoFactor ? 'Verify & Sign In' : 'Sign In'}
            </Button>
          </form>

          {/* Social Login - only show if not in 2FA mode */}
          {!showTwoFactor && (
            <SocialLogin onSocialLogin={handleSocialLogin} loading={loading} className="mt-6" />
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}