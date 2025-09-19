'use client'

import { Bell, Coins, Search, Settings, Moon, Sun, LogOut, Shield, Menu, Maximize2, Minimize2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { VaultPasswordDialog } from '@/components/auth/vault-password-dialog'
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

export function TopNavigation() {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const { preferences, toggleSidebar, toggleCompactMode } = useLayoutPreferences()
  const isMobile = useIsMobile()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className={cn(
      "min-h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 fixed top-0 right-0 z-40 transition-all duration-200 py-[19px]",
      // Desktop: adjust left margin based on sidebar state
      !isMobile && (preferences.sidebarCollapsed ? "left-16" : "left-64"),
      // Mobile: full width
      isMobile && "left-0"
    )}>
      {/* Left Side - Sidebar Toggle and Search */}
      <div className="flex items-center space-x-4 flex-1">
        {/* Sidebar Toggle - Only show on desktop */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              console.log('Sidebar toggle button clicked')
              console.log('Current sidebar state:', preferences.sidebarCollapsed)
              toggleSidebar()
            }}
            className="shrink-0"
            title={`Sidebar is ${preferences.sidebarCollapsed ? 'collapsed' : 'expanded'}`}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search books, authors, or topics..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Compact Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCompactMode}
            title={preferences.compactMode ? "Exit compact mode" : "Enter compact mode"}
          >
            {preferences.compactMode ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle compact mode</span>
          </Button>
          {/* Coin Balance */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              {session?.user?.coinBalance || 0}
            </span>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {session?.user?.image ? (
                <Avatar className="w-10 h-10 border border-foreground">
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback>
                    <User className="w-10 h-10" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <span className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  {getUserInitials(session?.user?.name || 'User')}
                </span>
              )
              }
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <VaultPasswordDialog>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Set Vault Password</span>
                </DropdownMenuItem>
              </VaultPasswordDialog>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}