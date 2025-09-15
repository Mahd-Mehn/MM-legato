'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Smartphone, Shield, AlertCircle } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';

interface TwoFactorSetupProps {
  onComplete: (backupCodes: string[]) => void;
  onCancel: () => void;
  userEmail: string;
}

interface TwoFactorData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export default function TwoFactorSetup({ onComplete, onCancel, userEmail }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);

  useEffect(() => {
    generateTwoFactorSecret();
  }, []);

  const generateTwoFactorSecret = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulating API response
      const mockData: TwoFactorData = {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCodeUrl: `otpauth://totp/Legato:${userEmail}?secret=JBSWY3DPEHPK3PXP&issuer=Legato`,
        backupCodes: [
          '12345678',
          '87654321',
          '11223344',
          '44332211',
          '55667788',
          '88776655',
          '99001122',
          '22110099'
        ]
      };
      setTwoFactorData(mockData);
    } catch (error) {
      console.error('Failed to generate 2FA secret:', error);
      setError('Failed to generate 2FA setup. Please try again.');
    }
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setSecretCopied(true);
        setTimeout(() => setSecretCopied(false), 2000);
      } else {
        setBackupCodesCopied(true);
        setTimeout(() => setBackupCodesCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const verifyTwoFactorCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Replace with actual API call
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo, accept any 6-digit code
      if (verificationCode.length === 6) {
        setStep('backup');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('2FA verification failed:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completeTwoFactorSetup = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call to enable 2FA
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete(twoFactorData?.backupCodes || []);
    } catch (error) {
      console.error('Failed to complete 2FA setup:', error);
      setError('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!twoFactorData) {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up two-factor authentication...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'setup' && 'Set Up Two-Factor Authentication'}
            {step === 'verify' && 'Verify Your Setup'}
            {step === 'backup' && 'Save Your Backup Codes'}
          </h2>
          <p className="text-gray-600 mt-2">
            {step === 'setup' && 'Secure your account with an additional layer of protection'}
            {step === 'verify' && 'Enter the code from your authenticator app'}
            {step === 'backup' && 'Store these codes in a safe place for account recovery'}
          </p>
        </div>

        {/* Setup Step */}
        {step === 'setup' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Smartphone className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Step 1: Install an authenticator app</p>
                  <p>Download Google Authenticator, Authy, or another TOTP app on your phone.</p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="font-medium text-gray-700">Step 2: Scan this QR code</p>
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                <QRCodeSVG value={twoFactorData.qrCodeUrl} size={200} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-medium text-gray-700">Or enter this code manually:</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                  {twoFactorData.secret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(twoFactorData.secret, 'secret')}
                >
                  {secretCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={onCancel} fullWidth>
                Cancel
              </Button>
              <Button onClick={() => setStep('verify')} fullWidth>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Verify Step */}
        {step === 'verify' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Verification Code"
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                  setError('');
                }}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="text-center text-lg tracking-widest"
                error={error}
              />
              <p className="text-sm text-gray-600 text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setStep('setup')} fullWidth>
                Back
              </Button>
              <Button
                onClick={verifyTwoFactorCode}
                loading={loading}
                disabled={verificationCode.length !== 6}
                fullWidth
              >
                Verify
              </Button>
            </div>
          </div>
        )}

        {/* Backup Codes Step */}
        {step === 'backup' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-1">Important: Save these backup codes</p>
                  <p>Use these codes to access your account if you lose your phone. Each code can only be used once.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-700">Backup Codes</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(twoFactorData.backupCodes.join('\n'), 'backup')}
                >
                  {backupCodesCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {twoFactorData.backupCodes.map((code, index) => (
                  <code key={index} className="p-2 bg-gray-100 rounded text-center font-mono text-sm">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setStep('verify')} fullWidth>
                Back
              </Button>
              <Button
                onClick={completeTwoFactorSetup}
                loading={loading}
                fullWidth
              >
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}