'use client';

import Link from 'next/link';
import { CheckCircle, Heart, BookOpen } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';

export default function AccountDeletedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card padding="lg">
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Deleted</h1>
              <p className="text-gray-600">
                Your account has been successfully deleted. We're sorry to see you go.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Heart className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Thank you for being part of Legato</p>
                  <p>
                    Your stories and contributions have made our community richer. 
                    While your account is gone, the impact you've had on readers remains.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">What happens next:</p>
                <ul className="space-y-1 text-left">
                  <li>• Your account and data have been permanently deleted</li>
                  <li>• You'll receive a final confirmation email</li>
                  <li>• All associated data has been removed from our systems</li>
                  <li>• This process may take up to 30 days to complete fully</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Changed your mind? You're always welcome back.
                </p>
                <div className="space-y-3">
                  <Link href="/auth/register">
                    <Button fullWidth>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Create New Account
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" fullWidth>
                      Return to Homepage
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If you have any questions or concerns, please{' '}
                <Link href="/support" className="text-primary-600 hover:text-primary-700 underline">
                  contact our support team
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}