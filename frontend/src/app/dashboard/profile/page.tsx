'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Separator } from '@/components/ui/separator'
import { Upload, User, Loader2, Coins } from 'lucide-react'
import { useProfile, useUpdateProfile, useUploadProfilePicture } from '@/hooks/useProfile'
import { toast } from 'sonner'

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const uploadProfilePicture = useUploadProfilePicture()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      username: profile?.username || '',
      bio: profile?.bio || '',
    },
  })
  
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
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleUploadPicture = async () => {
    if (!selectedFile) return
    
    try {
      await uploadProfilePicture.mutateAsync(selectedFile)
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  }
  
  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile.mutateAsync(data)
      reset(data)
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }
  
  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your profile details and bio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  {...register('username')}
                  error={errors.username?.message}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  {...register('bio')}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={!isDirty || updateProfile.isPending}
                className="w-full"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Profile Picture & Account Info */}
        <div className="space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Upload a new profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={previewUrl || profile.profile_picture_url || undefined} />
                  <AvatarFallback>
                    <User className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="profile-picture" className="cursor-pointer">
                    <div className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Choose File</span>
                    </div>
                  </Label>
                  <input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {selectedFile && (
                    <Button
                      onClick={handleUploadPicture}
                      disabled={uploadProfilePicture.isPending}
                      size="sm"
                    >
                      {uploadProfilePicture.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Upload Picture'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Email</span>
                <span className="text-sm text-muted-foreground">{profile.email}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Account Type</span>
                <span className="text-sm text-muted-foreground">
                  {profile.is_writer ? 'Writer' : 'Reader'}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Coin Balance</span>
                <div className="flex items-center space-x-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{profile.coin_balance}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Theme</span>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}