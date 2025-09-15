'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
    }

    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const verifyEmail = async (token: string) => {
    try {
      // Call the auth service to verify email
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 400 && errorData.code === 'TOKEN_EXPIRED') {
          setStatus('expired');
        } else {
          setStatus('error');
        }
      }
    } catch (error) {
      console.error('Email verification failed:', error);
      setStatus('error');
    }
  };

  const resendVerification = async () => {
    if (!email) {
      alert('Email address not found. Please try registering again.');
      return;
    }

    setResendLoading(true);
    try {
      // Call the auth service to resend verification email
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert('Verification email sent! Please check your inbox.');
        setResendCooldown(60); // 60 second cooldown
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Failed to resend verification email. Please try again.');
      }
    } catch (error) {
      console.error('Resend verification failed:', error);
      alert('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Email</h1>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified Successfully!</h1>
              <p className="text-gray-600">
                Your email address has been verified. You can now access all features of your account.
              </p>
            </div>
            
            <div className="space-y-3">
              <Link href="/dashboard">
                <Button fullWidth size="lg">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" fullWidth>
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Link Expired</h1>
              <p className="text-gray-600">
                This verification link has expired. Please request a new verification email.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={resendVerification}
                loading={resendLoading}
                disabled={resendCooldown > 0}
                fullWidth
                size="lg"
              >
                {resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Send New Verification Email
                  </>
                )}
              </Button>
              
              <Link href="/auth/register">
                <Button variant="outline" fullWidth>
                  Create New Account
                </Button>
              </Link>
            </div>
          </div>
        );

      case 'error':
      default:
        return (
          <div className="text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-gray-600">
                We couldn't verify your email address. The link may be invalid or expired.
              </p>
            </div>
            
            <div className="space-y-4">
              {email && (
                <Button
                  onClick={resendVerification}
                  loading={resendLoading}
                  disabled={resendCooldown > 0}
                  fullWidth
                  size="lg"
                >
                  {resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Send New Verification Email
                    </>
                  )}
                </Button>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/auth/register">
                  <Button variant="outline" fullWidth>
                    Create Account
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" fullWidth>
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card padding="lg">
          {renderContent()}
          
          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>Having trouble?</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  • Check your spam/junk folder
                </p>
                <p className="text-gray-600">
                  • Make sure you're using the latest email
                </p>
                <p className="text-gray-600">
                  • Contact support if issues persist
                </p>
              </div>
              <Link 
                href="/support" 
                className="text-primary-600 hover:text-primary-700 text-sm underline"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}