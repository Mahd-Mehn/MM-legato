'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth errors
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setErrorMessage(errorDescription || 'Authentication failed');
          setStatus('error');
          return;
        }

        // Handle missing code
        if (!code) {
          setErrorMessage('Authorization code not received');
          setStatus('error');
          return;
        }

        // Parse state parameter
        let stateData: any = {};
        if (state) {
          try {
            stateData = JSON.parse(decodeURIComponent(state));
          } catch (error) {
            console.warn('Failed to parse state parameter:', error);
          }
        }

        // Exchange code for tokens
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/oauth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state: stateData,
            redirectUri: `${window.location.origin}/auth/callback`
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Authentication failed');
        }

        const data = await response.json();

        // Store tokens if provided
        if (data.tokens) {
          localStorage.setItem('legato_access_token', data.tokens.accessToken);
          localStorage.setItem('legato_refresh_token', data.tokens.refreshToken);
          localStorage.setItem('legato_token_expiry', (Date.now() + (data.tokens.expiresIn * 1000)).toString());
        }

        // Refresh user data
        await refreshUser();

        setStatus('success');

        // Show success message
        if (stateData.action === 'register') {
          toast.success('Account created successfully! Welcome to Legato!');
        } else {
          toast.success('Successfully signed in!');
        }

        // Redirect after a short delay
        setTimeout(() => {
          const returnTo = stateData.returnTo || '/dashboard';
          router.push(returnTo);
        }, 2000);

      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setErrorMessage(error.message || 'Authentication failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, router, refreshUser]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="text-center space-y-6">
            <Loader2 className="w-16 h-16 text-primary-600 mx-auto animate-spin" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Completing Authentication</h1>
              <p className="text-gray-600">Please wait while we complete your sign-in...</p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Successful!</h1>
              <p className="text-gray-600">
                You have been successfully signed in. Redirecting you to your dashboard...
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
              <p className="text-gray-600 mb-4">
                {errorMessage || 'We encountered an error while signing you in.'}
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/login')}
                fullWidth
                size="lg"
              >
                Try Again
              </Button>
              <Button
                onClick={() => router.push('/auth/register')}
                variant="outline"
                fullWidth
              >
                Create Account
              </Button>
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
        </Card>
      </div>
    </div>
  );
}