"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { authAPI } from "@/lib/api"

const vaultPasswordSchema = z.object({
  vaultPassword: z.string().min(6, "Vault password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.vaultPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type VaultPasswordFormData = z.infer<typeof vaultPasswordSchema>

interface VaultPasswordDialogProps {
  children: React.ReactNode
}

export function VaultPasswordDialog({ children }: VaultPasswordDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VaultPasswordFormData>({
    resolver: zodResolver(vaultPasswordSchema),
  })

  const onSubmit = async (data: VaultPasswordFormData) => {
    setIsLoading(true)
    
    try {
      await authAPI.setVaultPassword(data.vaultPassword)
      toast.success("Vault password set successfully!")
      setIsOpen(false)
      reset()
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to set vault password"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Vault Password</DialogTitle>
          <DialogDescription>
            Create a secure password for your Secret Vault. This will be used to protect your private books.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vaultPassword">Vault Password</Label>
            <Input
              id="vaultPassword"
              type="password"
              placeholder="Enter vault password"
              {...register("vaultPassword")}
            />
            {errors.vaultPassword && (
              <p className="text-sm text-red-500">{errors.vaultPassword.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm vault password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Setting..." : "Set Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}