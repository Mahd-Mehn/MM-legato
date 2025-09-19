import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Legato</span>
          </Link>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}