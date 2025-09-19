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
  BarChart3
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Explore', href: '/dashboard/explore', icon: Compass },
  { name: 'Library', href: '/dashboard/library', icon: Library },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
]

const writerNavigation = [
  { name: 'Writer', href: '/dashboard/writer', icon: PenTool },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Combine navigation items based on user role
  const allNavigation = [
    ...navigation,
    ...(session?.user?.isWriter ? writerNavigation : [])
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 md:hidden">
      <nav className="flex items-center justify-around px-2 py-2">
        {allNavigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 text-xs font-medium rounded-lg transition-colors min-w-0 flex-1',
                isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}