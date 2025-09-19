'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, User, BookOpen, PenTool } from 'lucide-react'
import { useCompleteOnboarding, useUploadProfilePicture } from '@/hooks/useProfile'
import { OnboardingData } from '@/types/user'
import { toast } from 'sonner'

const onboardingSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  is_writer: z.boolean(),
})

type OnboardingForm = z.infer<typeof onboardingSchema>

export default function OnboardingPage() {
  const router = useRouter()
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const completeOnboarding = useCompleteOnboarding()
  const uploadProfilePicture = useUploadProfilePicture()
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: '',
      bio: '',
      is_writer: false,
    },
  })
  
  const isWriter = watch('is_writer')
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const onSubmit = async (data: OnboardingForm) => {
    try {
      let profilePictureUrl = ''
      
      // Upload profile picture first if selected
      if (selectedFile) {
        const uploadResult = await uploadProfilePicture.mutateAsync(selectedFile)
        profilePictureUrl = uploadResult.url
      }
      
      // Complete onboarding
      await completeOnboarding.mutateAsync({
        ...data,
        profile_picture_url: profilePictureUrl || undefined,
      })
      
      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh() // Refresh to update the profile data
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to Legato!</CardTitle>
          <CardDescription className="text-lg">
            Let's set up your profile to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profilePicture || undefined} />
                <AvatarFallback>
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="profile-picture" className="cursor-pointer">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload Profile Picture</span>
                  </div>
                </Label>
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
            
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                {...register('username')}
                error={errors.username?.message}
              />
            </div>
            
            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us a bit about yourself..."
                rows={3}
                {...register('bio')}
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              )}
            </div>
            
            {/* Writer Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <PenTool className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="is-writer" className="text-base font-medium">
                      I'm a writer
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable writer features to publish and monetize your stories
                    </p>
                  </div>
                </div>
                <Switch
                  id="is-writer"
                  checked={isWriter}
                  onCheckedChange={(checked) => setValue('is_writer', checked)}
                />
              </div>
              
              {/* Writer-specific info */}
              {isWriter && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Writer Features Unlocked
                      </h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                        <li>• Create and publish books and chapters</li>
                        <li>• Set pricing and monetize your content</li>
                        <li>• Manage character profiles</li>
                        <li>• Access analytics and earnings dashboard</li>
                        <li>• Moderate comments on your content</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || completeOnboarding.isPending || uploadProfilePicture.isPending}
            >
              {isSubmitting || completeOnboarding.isPending || uploadProfilePicture.isPending
                ? 'Setting up your profile...'
                : 'Complete Setup'
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}