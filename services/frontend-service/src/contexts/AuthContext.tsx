'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { authService } from '../lib/api/auth';
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse,
  PasswordChangeRequest,
  TwoFactorVerification 
} from '../lib/api/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  changePassword: (request: PasswordChangeRequest) => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  uploadAvatar: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  deleteAvatar: () => Promise<void>;
  setupTwoFactor: () => Promise<{ secret: string; qrCode: string; backupCodes: string[] }>;
  verifyTwoFactor: (verification: TwoFactorVerification) => Promise<void>;
  disableTwoFactor: (verification: TwoFactorVerification) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state and setup event listeners
  useEffect(() => {
    initializeAuth();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      // Check if user is authenticated and validate session
      if (authService.isAuthenticated()) {
        const isValid = await authService.validateSession();
        if (isValid) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } else {
          // Session is invalid, clear everything
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = () => {
    if (typeof window === 'undefined') return;

    // Setup auth service event listeners
    authService.setupEventListeners();

    // Listen for session expiration
    window.addEventListener('auth:session-expired', handleSessionExpired);
    
    // Listen for logout events (from other tabs)
    window.addEventListener('auth:logout', handleLogout);
  };

  const cleanupEventListeners = () => {
    if (typeof window === 'undefined') return;

    window.removeEventListener('auth:session-expired', handleSessionExpired);
    window.removeEventListener('auth:logout', handleLogout);
  };

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    toast.error('Your session has expired. Please log in again.');
    // You can add navigation logic here if needed
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const authResponse: AuthResponse = await authService.login(credentials);
      setUser(authResponse.user);
      
      if (authResponse.is_first_login) {
        toast.success('Welcome to Legato! Please complete your profile setup.');
      } else {
        toast.success(`Welcome back, ${authResponse.user.name}!`);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.statusCode === 401) {
        throw new Error('Invalid email or password');
      } else if (error.statusCode === 423) {
        throw new Error('Account is locked. Please try again later or reset your password.');
      } else if (error.statusCode === 403 && error.code === 'EMAIL_NOT_VERIFIED') {
        throw new Error('Please verify your email address before logging in');
      } else if (error.statusCode === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      } else {
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const authResponse: AuthResponse = await authService.register(userData);
      
      // Check if user is immediately authenticated (has tokens)
      if (authResponse.tokens && authService.isAuthenticated()) {
        setUser(authResponse.user);
        toast.success('Account created successfully! Welcome to Legato!');
        
        // Check if email verification is required but user is still authenticated
        if (authResponse.requires_email_verification || !authResponse.user.verified) {
          toast('Please check your email to verify your account.', {
            icon: 'ℹ️',
            duration: 5000,
          });
        }
      } else {
        // Registration successful but email verification required before login
        // User is not authenticated yet
        setUser(null);
        toast.success('Account created successfully!');
        toast('Please check your email to verify your account before logging in.', {
          icon: 'ℹ️',
          duration: 8000,
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Re-throw the error with proper structure for the UI to handle
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (!authService.isAuthenticated()) {
        setUser(null);
        return;
      }

      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails due to auth error, clear user
      if ((error as any)?.statusCode === 401) {
        setUser(null);
      }
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  const changePassword = async (request: PasswordChangeRequest) => {
    try {
      await authService.changePassword(request);
      toast.success('Password changed successfully');
    } catch (error: any) {
      console.error('Password change error:', error);
      
      if (error.statusCode === 400) {
        throw new Error('Current password is incorrect');
      } else {
        throw new Error(error.message || 'Failed to change password');
      }
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const uploadAvatar = async (file: File, onProgress?: (progress: number) => void) => {
    try {
      const result = await authService.uploadAvatar(file, onProgress);
      
      // Update user with new avatar URL
      if (user) {
        setUser({ ...user, avatar: result.avatarUrl });
      }
      
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      throw new Error(error.message || 'Failed to upload avatar');
    }
  };

  const deleteAvatar = async () => {
    try {
      await authService.deleteAvatar();
      
      // Remove avatar from user
      if (user) {
        setUser({ ...user, avatar: undefined });
      }
      
      toast.success('Avatar removed successfully');
    } catch (error: any) {
      console.error('Avatar deletion error:', error);
      throw new Error(error.message || 'Failed to remove avatar');
    }
  };

  const setupTwoFactor = async () => {
    try {
      const setup = await authService.setupTwoFactor();
      return setup;
    } catch (error: any) {
      console.error('2FA setup error:', error);
      throw new Error(error.message || 'Failed to setup two-factor authentication');
    }
  };

  const verifyTwoFactor = async (verification: TwoFactorVerification) => {
    try {
      await authService.verifyTwoFactorSetup(verification);
      
      // Refresh user to get updated 2FA status
      await refreshUser();
      
      toast.success('Two-factor authentication enabled successfully');
    } catch (error: any) {
      console.error('2FA verification error:', error);
      throw new Error(error.message || 'Failed to verify two-factor authentication');
    }
  };

  const disableTwoFactor = async (verification: TwoFactorVerification) => {
    try {
      await authService.disableTwoFactor(verification);
      
      // Refresh user to get updated 2FA status
      await refreshUser();
      
      toast.success('Two-factor authentication disabled successfully');
    } catch (error: any) {
      console.error('2FA disable error:', error);
      throw new Error(error.message || 'Failed to disable two-factor authentication');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && authService.isAuthenticated(),
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    changePassword,
    hasRole,
    hasAnyRole,
    uploadAvatar,
    deleteAvatar,
    setupTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}