import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from './useProfile'

export function useOnboardingRedirect() {
  const router = useRouter()
  const { data: profile, isLoading } = useProfile()
  
  useEffect(() => {
    if (!isLoading && profile) {
      // Check if user needs onboarding
      // A user needs onboarding if they have a temporary username pattern
      const needsOnboarding = !profile.username || 
                             profile.username.startsWith('user_') || 
                             profile.username.startsWith('temp_')
      
      if (needsOnboarding) {
        router.push('/onboarding')
      }
    }
  }, [profile, isLoading, router])
  
  return { 
    profile, 
    isLoading, 
    needsOnboarding: !isLoading && profile && (!profile.username || profile.username.startsWith('user_') || profile.username.startsWith('temp_'))
  }
}