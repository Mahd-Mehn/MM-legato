'use client';

import { useMemo } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  type: 'length' | 'uppercase' | 'lowercase' | 'number' | 'special';
}

const requirements: PasswordRequirement[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
    type: 'length'
  },
  {
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password),
    type: 'uppercase'
  },
  {
    label: 'One lowercase letter',
    test: (password) => /[a-z]/.test(password),
    type: 'lowercase'
  },
  {
    label: 'One number',
    test: (password) => /\d/.test(password),
    type: 'number'
  },
  {
    label: 'One special character',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    type: 'special'
  }
];

export default function PasswordStrengthIndicator({ password, className = '' }: PasswordStrengthIndicatorProps) {
  const { strength, score, passedRequirements } = useMemo(() => {
    const passed = requirements.filter(req => req.test(password));
    const score = passed.length;
    
    let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    if (score >= 5) strength = 'strong';
    else if (score >= 4) strength = 'good';
    else if (score >= 2) strength = 'fair';
    
    return {
      strength,
      score,
      passedRequirements: passed.map(req => req.type)
    };
  }, [password]);

  const getStrengthColor = () => {
    switch (strength) {
      case 'strong': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getStrengthBgColor = () => {
    switch (strength) {
      case 'strong': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  if (!password) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <span className={`text-sm font-medium capitalize ${getStrengthColor()}`}>
            {strength}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthBgColor()}`}
            style={{ width: `${(score / requirements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Requirements:</p>
        <div className="space-y-1">
          {requirements.map((requirement) => {
            const isPassed = passedRequirements.includes(requirement.type);
            return (
              <div key={requirement.type} className="flex items-center space-x-2">
                {isPassed ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-sm ${isPassed ? 'text-green-700' : 'text-gray-600'}`}>
                  {requirement.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Tips */}
      {strength !== 'strong' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Security Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Use a mix of letters, numbers, and symbols</li>
                <li>• Avoid common words or personal information</li>
                <li>• Consider using a passphrase with random words</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}