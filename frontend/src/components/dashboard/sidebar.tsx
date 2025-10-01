'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { 
  BookOpen, 
  Compass, 
  Library, 
  User, 
  PenTool, 
  Shield,
  BarChart3,
  Users,
  UserCircle,
  AlertTriangle
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Explore', href: '/dashboard/explore', icon: Compass },
  { name: 'Library', href: '/dashboard/library', icon: Library },
  { name: 'Community', href: '/dashboard/community', icon: Users },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
]

const writerNavigation = [
  { name: 'Writer Dashboard', href: '/dashboard/writer', icon: PenTool },
  { name: 'Characters', href: '/dashboard/writer/characters', icon: UserCircle },
  { name: 'Moderation', href: '/dashboard/writer/moderation', icon: AlertTriangle },
]

const specialNavigation = [
  { name: 'Secret Vault', href: '/vault', icon: Shield },
]

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-200 z-30",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <BookOpen className={cn(
            "text-blue-600",
            "h-8 w-8" // Fixed size
          )} />
          {!collapsed && (
            <span className="text-xl font-bold text-slate-900 dark:text-white">Legato</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800',
                  collapsed && 'justify-center'
                )}
              >
                <item.icon className={cn(
                  "h-6 w-6", // ✅ Fixed size — never changes
                  !collapsed && "mr-3"
                )} />
                {!collapsed && item.name}
              </Link>
            )
          })}
        </div>

        {/* Writer Section */}
        {session?.user?.isWriter && (
          <div className="pt-6">
            {!collapsed && (
              <div className="px-3 mb-2">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Writer Tools
                </h3>
              </div>
            )}
            <div className="space-y-1">
              {writerNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800',
                      collapsed && 'justify-center'
                    )}
                  >
                    <item.icon className={cn(
                      "h-6 w-6", // ✅ Fixed size
                      !collapsed && "mr-3"
                    )} />
                    {!collapsed && item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Special Section */}
        <div className="pt-6">
          {!collapsed && (
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Special
              </h3>
            </div>
          )}
          <div className="space-y-1">
            {specialNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800',
                    collapsed && 'justify-center'
                  )}
                >
                  <item.icon className={cn(
                    "h-6 w-6", // ✅ Fixed size
                    !collapsed && "mr-3"
                  )} />
                  {!collapsed && item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}