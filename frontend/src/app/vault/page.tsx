"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { Loader2, Lock, Eye, EyeOff, Shield, BookOpen, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { vaultAPI } from "@/lib/api"

interface VaultBook {
  id: string
  book_id: string
  book_title: string
  book_description: string
  book_cover_image_url: string
  author_username: string
  genre: string
  tags: string[]
  created_at: string
}

export default function VaultPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasVaultPassword, setHasVaultPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [books, setBooks] = useState<VaultBook[]>([])
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>("")

  // Check vault status on component mount
  useEffect(() => {
    checkVaultStatus()
  }, [])

  // Update countdown timer
  useEffect(() => {
    if (!sessionExpiresAt) return

    const interval = setInterval(() => {
      const now = new Date()
      const timeRemaining = sessionExpiresAt.getTime() - now.getTime()
      
      if (timeRemaining <= 0) {
        handleSessionExpired()
        return
      }

      const minutes = Math.floor(timeRemaining / (1000 * 60))
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionExpiresAt])

  const checkVaultStatus = async () => {
    try {
      const response = await vaultAPI.getStatus()
      setHasVaultPassword(response.has_vault_password)
      
      if (response.has_vault_password) {
        // Initialize session from localStorage first
        const hasStoredSession = vaultAPI.initializeSession()
        if (hasStoredSession) {
          try {
            // Check if stored session is still valid
            const sessionStatus = await vaultAPI.checkSession()
            if (sessionStatus.valid) {
              setIsAuthenticated(true)
              setSessionExpiresAt(new Date(sessionStatus.expires_at))
              await loadVaultBooks()
            }
          } catch (error) {
            console.error("Stored session invalid:", error)
            // Clear invalid session
            vaultAPI.logout()
          }
        }
      }
    } catch (error) {
      console.error("Failed to check vault status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setIsVerifying(true)
    try {
      console.log('Verifying vault password...')
      const response = await vaultAPI.verifyPassword(password)
      console.log('Password verification response:', response)
      
      if (response.success && response.session_id) {
        console.log('Setting authenticated state and session info')
        setIsAuthenticated(true)
        setSessionExpiresAt(new Date(response.session_expires_at))
        setPassword("")
        toast.success("Vault access granted")
        
        // Small delay to ensure session is properly set
        setTimeout(async () => {
          await loadVaultBooks()
        }, 100)
      } else {
        console.error('No session ID in response:', response)
        toast.error("Failed to establish vault session")
      }
    } catch (error: any) {
      console.error('Password verification failed:', error)
      const errorMessage = error.response?.data?.detail || "Invalid vault password"
      toast.error(errorMessage)
    } finally {
      setIsVerifying(false)
    }
  }

  const loadVaultBooks = async () => {
    try {
      console.log('Loading vault books...')
      const response = await vaultAPI.getBooks()
      console.log('Vault books loaded:', response)
      setBooks(response.books)
    } catch (error: any) {
      console.error('Failed to load vault books:', error)
      if (error.response?.status === 401) {
        console.log('Session expired while loading books')
        handleSessionExpired()
      } else {
        toast.error("Failed to load vault books")
      }
    }
  }

  const handleSessionExpired = () => {
    setIsAuthenticated(false)
    setSessionExpiresAt(null)
    setTimeLeft("")
    setBooks([])
    toast.warning("Vault session expired. Please re-enter your password.")
  }

  const handleLogout = async () => {
    try {
      await vaultAPI.logout()
      setIsAuthenticated(false)
      setSessionExpiresAt(null)
      setTimeLeft("")
      setBooks([])
      toast.success("Logged out of vault")
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }

  const removeBookFromVault = async (bookId: string) => {
    try {
      await vaultAPI.removeBook(bookId)
      toast.success("Book removed from vault")
      await loadVaultBooks()
    } catch (error: any) {
      if (error.response?.status === 401) {
        handleSessionExpired()
      } else {
        toast.error("Failed to remove book from vault")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading vault...</p>
        </div>
      </div>
    )
  }

  if (!hasVaultPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
              <Shield className="h-8 w-8" />
            </div>
            <CardTitle>Secret Vault Not Set Up</CardTitle>
            <CardDescription>
              You haven't set up a vault password yet. Set one up in your profile to use the Secret Vault feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push("/dashboard/profile")} 
              className="w-full"
            >
              Go to Profile Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard")} 
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
              <Lock className="h-8 w-8" />
            </div>
            <CardTitle>Enter Vault Password</CardTitle>
            <CardDescription>
              Enter your vault password to access your private books
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Vault Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your vault password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={isVerifying || !password.trim()}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Access Vault
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => router.push("/dashboard")} 
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Shield className="h-8 w-8 mr-3" />
                Secret Vault
              </h1>
              <p className="text-muted-foreground">Your private book collection</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {timeLeft && (
              <Badge variant="outline" className="text-sm">
                Session expires in: {timeLeft}
              </Badge>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <Lock className="h-4 w-4 mr-2" />
              Lock Vault
            </Button>
          </div>
        </div>

        {/* Books Grid */}
        {books.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Books in Vault</h3>
              <p className="text-muted-foreground mb-4">
                Your vault is empty. Move books from your library to keep them private.
              </p>
              <Button onClick={() => router.push("/dashboard/library")}>
                Go to Library
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[3/4] relative">
                  {book.book_cover_image_url ? (
                    <img
                      src={book.book_cover_image_url}
                      alt={book.book_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      <Shield className="h-3 w-3 mr-1" />
                      Vault
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                    {book.book_title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    by {book.author_username}
                  </p>
                  
                  {book.book_description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {book.book_description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {book.genre && (
                      <Badge variant="outline" className="text-xs">
                        {book.genre}
                      </Badge>
                    )}
                    {book.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/reading/${book.book_id}`)}
                      className="flex-1"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Read
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeBookFromVault(book.book_id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}