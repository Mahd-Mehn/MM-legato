import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useUserStore } from '@/lib/store'
import { toast } from 'sonner'
import { User, UserUpdate, OnboardingData } from '@/types/user'

export function useProfile() {
    const { setUser } = useUserStore()

    return useQuery({
        queryKey: ['profile'],
        queryFn: async (): Promise<User> => {
            const response = await api.get('/api/v1/users/profile')
            const user = response.data
            setUser(user)
            return user
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

export function useUpdateProfile() {
    const queryClient = useQueryClient()
    const { updateUser } = useUserStore()

    return useMutation({
        mutationFn: async (data: UserUpdate): Promise<User> => {
            const response = await api.put('/api/v1/users/profile', data)
            return response.data
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['profile'], data)
            updateUser(data)
            toast.success('Profile updated successfully')
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || 'Failed to update profile'
            toast.error(message)
        },
    })
}

export function useUploadProfilePicture() {
    const queryClient = useQueryClient()
    const { updateUser } = useUserStore()

    return useMutation({
        mutationFn: async (file: File): Promise<{ message: string; url: string }> => {
            const formData = new FormData()
            formData.append('file', file)

            const response = await api.post('/api/v1/users/profile/upload-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            return response.data
        },
        onSuccess: (data) => {
            // Update the profile query cache
            queryClient.setQueryData(['profile'], (old: User | undefined) => {
                if (old) {
                    const updated = { ...old, profile_picture_url: data.url }
                    updateUser(updated)
                    return updated
                }
                return old
            })
            toast.success('Profile picture updated successfully')
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || 'Failed to upload profile picture'
            toast.error(message)
        },
    })
}

export function useCompleteOnboarding() {
    const queryClient = useQueryClient()
    const { setUser } = useUserStore()

    return useMutation({
        mutationFn: async (data: OnboardingData): Promise<User> => {
            const response = await api.post('/api/v1/users/onboarding', data)
            return response.data
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['profile'], data)
            setUser(data)
            toast.success('Onboarding completed successfully')
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || 'Failed to complete onboarding'
            toast.error(message)
        },
    })
}