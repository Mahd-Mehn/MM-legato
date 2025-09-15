import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService, LoginRequest, RegisterRequest, ChangePasswordRequest } from '@/lib/api/services/auth';
import { queryKeys } from '@/lib/api/queries';
import { User } from '@/lib/api/types';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: AuthService.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginRequest) => AuthService.login(data),
    onSuccess: (authResponse) => {
      // Update user data in cache
      queryClient.setQueryData(queryKeys.auth.user, authResponse.user);
      
      // Show success message
      toast.success('Welcome back!');
      
      // Redirect to dashboard or intended page
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
      router.push(redirectTo);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed');
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterRequest) => AuthService.register(data),
    onSuccess: (authResponse) => {
      // Update user data in cache
      queryClient.setQueryData(queryKeys.auth.user, authResponse.user);
      
      // Show success message
      toast.success('Account created successfully!');
      
      // Redirect to onboarding or dashboard
      router.push('/onboarding');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Registration failed');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: AuthService.logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Redirect to home page
      router.push('/');
    },
    onError: (error: any) => {
      // Even if logout fails on server, clear local data
      queryClient.clear();
      router.push('/');
      toast.error(error.message || 'Logout failed');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => AuthService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change password');
    },
  });
}

export function usePasswordReset() {
  return useMutation({
    mutationFn: (email: string) => AuthService.requestPasswordReset({ email }),
    onSuccess: () => {
      toast.success('Password reset email sent');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reset email');
    },
  });
}

export function usePasswordResetConfirm() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      AuthService.confirmPasswordReset({ token, newPassword }),
    onSuccess: () => {
      toast.success('Password reset successfully');
      router.push('/login');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });
}

export function useEmailVerification() {
  return useMutation({
    mutationFn: (token: string) => AuthService.verifyEmail(token),
    onSuccess: () => {
      toast.success('Email verified successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Email verification failed');
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: AuthService.resendVerificationEmail,
    onSuccess: () => {
      toast.success('Verification email sent');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send verification email');
    },
  });
}

export function useEnable2FA() {
  return useMutation({
    mutationFn: AuthService.enable2FA,
    onError: (error: any) => {
      toast.error(error.message || 'Failed to enable 2FA');
    },
  });
}

export function useConfirm2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => AuthService.confirm2FA(token),
    onSuccess: () => {
      // Refetch user data to get updated 2FA status
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
      toast.success('2FA enabled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to confirm 2FA');
    },
  });
}

export function useDisable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => AuthService.disable2FA(token),
    onSuccess: () => {
      // Refetch user data to get updated 2FA status
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
      toast.success('2FA disabled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to disable 2FA');
    },
  });
}

export function useSocialLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ provider, token }: { provider: string; token: string }) =>
      AuthService.socialLogin(provider, token),
    onSuccess: (authResponse) => {
      // Update user data in cache
      queryClient.setQueryData(queryKeys.auth.user, authResponse.user);
      
      // Show success message
      toast.success('Welcome!');
      
      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Social login failed');
    },
  });
}

// Custom hook to check if user is authenticated
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!user,
    user,
    isLoading,
  };
}

// Custom hook to check user role
export function useUserRole() {
  const { data: user } = useCurrentUser();
  return {
    role: user?.role,
    isWriter: user?.role === 'writer',
    isReader: user?.role === 'reader',
    isStudio: user?.role === 'studio',
    isAdmin: user?.role === 'admin',
  };
}