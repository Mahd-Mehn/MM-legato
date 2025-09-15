'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, Shield, Download, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';

export default function AccountDeletion() {
  const [step, setStep] = useState<'warning' | 'confirm' | 'password'>('warning');
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const requiredConfirmText = 'DELETE MY ACCOUNT';

  const handlePasswordSubmit = async () => {
    if (!password) {
      setErrors({ password: 'Password is required to delete your account' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // TODO: Implement actual account deletion API call
      console.log('Deleting account with password verification...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate password verification failure for demo
      if (password === 'wrongpassword') {
        setErrors({ password: 'Incorrect password. Please try again.' });
        return;
      }
      
      // Success - redirect to goodbye page
      alert('Account deletion initiated. You will receive a confirmation email.');
      window.location.href = '/auth/account-deleted';
    } catch (error) {
      console.error('Account deletion failed:', error);
      setErrors({ password: 'Failed to delete account. Please try again or contact support.' });
    } finally {
      setLoading(false);
    }
  };

  const renderWarningStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-900 mb-2">Delete Your Account</h2>
        <p className="text-red-700">
          This action is permanent and cannot be undone
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-900 mb-3">What will be deleted:</h3>
          <ul className="space-y-2 text-sm text-red-800">
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
              <span>Your profile and account information</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
              <span>All your published stories and drafts</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
              <span>Comments, likes, and interactions</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
              <span>Reading history and bookmarks</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
              <span>Follower and following relationships</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
              <span>All associated data and settings</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-3">Before you delete:</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download your data if you want to keep a copy</span>
            </li>
            <li className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Consider deactivating instead of deleting</span>
            </li>
            <li className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Inform your followers about your departure</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Alternative Options:</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => window.location.href = '/profile/data-export'}
            >
              <Download className="w-4 h-4 mr-2" />
              Export My Data First
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => window.location.href = '/support'}
            >
              Contact Support Instead
            </Button>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          variant="outline"
          fullWidth
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          fullWidth
          onClick={() => setStep('confirm')}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          I Understand, Continue
        </Button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Account Deletion</h2>
        <p className="text-gray-600">
          Type <strong>"{requiredConfirmText}"</strong> to confirm
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Confirmation"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={requiredConfirmText}
          className="text-center font-mono"
        />

        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 text-center">
            This action cannot be undone. Your account and all data will be permanently deleted.
          </p>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          variant="outline"
          fullWidth
          onClick={() => setStep('warning')}
        >
          Back
        </Button>
        <Button
          fullWidth
          onClick={() => setStep('password')}
          disabled={confirmText !== requiredConfirmText}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Continue to Password
        </Button>
      </div>
    </div>
  );

  const renderPasswordStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Your Password</h2>
        <p className="text-gray-600">
          Enter your current password to confirm account deletion
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Current Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors({});
          }}
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

        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 text-center font-medium">
            Final Warning: This will permanently delete your account
          </p>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          variant="outline"
          fullWidth
          onClick={() => setStep('confirm')}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          fullWidth
          onClick={handlePasswordSubmit}
          loading={loading}
          disabled={!password}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete My Account
        </Button>
      </div>
    </div>
  );

  return (
    <Card padding="lg" className="max-w-2xl mx-auto">
      {step === 'warning' && renderWarningStep()}
      {step === 'confirm' && renderConfirmStep()}
      {step === 'password' && renderPasswordStep()}
    </Card>
  );
}