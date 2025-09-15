'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  BookOpen, 
  PenTool, 
  Building2, 
  TrendingUp, 
  Users, 
  Star,
  Clock,
  Settings,
  Mail,
  CheckCircle,
  AlertCircle,
  Heart,
  User
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to login
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'writer':
        return <PenTool className="w-8 h-8 text-primary-600" />;
      case 'studio':
        return <Building2 className="w-8 h-8 text-primary-600" />;
      default:
        return <BookOpen className="w-8 h-8 text-primary-600" />;
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'writer':
        return 'Writer Dashboard';
      case 'studio':
        return 'Studio Dashboard';
      default:
        return 'Reader Dashboard';
    }
  };

  const getWelcomeMessage = (role: string) => {
    switch (role) {
      case 'writer':
        return 'Ready to create your next masterpiece?';
      case 'studio':
        return 'Discover your next big IP opportunity';
      default:
        return 'Discover amazing stories waiting for you';
    }
  };

  const getQuickActions = (role: string) => {
    // Base actions available to all users
    const baseActions = [
      {
        icon: BookOpen,
        title: 'Browse Stories',
        description: 'Discover new stories to read',
        href: '/stories',
        color: 'text-blue-600',
        available: true
      },
      {
        icon: Heart,
        title: 'Community',
        description: 'Connect with other readers and writers',
        href: '/community',
        color: 'text-pink-600',
        available: true
      }
    ];

    if (role === 'writer') {
      return [
        {
          icon: PenTool,
          title: 'Create Story',
          description: 'Start writing your next story',
          href: '/write',
          color: 'text-primary-600',
          available: true
        },
        {
          icon: TrendingUp,
          title: 'Analytics',
          description: 'View your story performance',
          href: '/analytics',
          color: 'text-green-600',
          available: true
        },
        ...baseActions
      ];
    }

    if (role === 'studio') {
      return [
        {
          icon: Building2,
          title: 'IP Protection',
          description: 'Protect and manage your intellectual property',
          href: '/ip-protection',
          color: 'text-primary-600',
          available: true
        },
        ...baseActions,
        {
          icon: Star,
          title: 'Trending IP',
          description: 'Coming soon - See what\'s hot in the market',
          href: '#',
          color: 'text-gray-400',
          available: false
        }
      ];
    }

    // Reader actions
    return [
      ...baseActions,
      {
        icon: Clock,
        title: 'Reading History',
        description: 'Pick up where you left off',
        href: '/reading-history',
        color: 'text-purple-600',
        available: true
      },
      {
        icon: Star,
        title: 'My Library',
        description: 'Your saved and bookmarked stories',
        href: '/library',
        color: 'text-yellow-600',
        available: true
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl">
                {getRoleIcon(user.role)}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-primary-100 text-lg">
                  {getWelcomeMessage(user.role)}
                </p>
              </div>
            </div>
            {user.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full border-4 border-white/20 object-cover"
              />
            )}
          </div>
        </div>

        {/* Email Verification Notice */}
        {!user.verified && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Email Verification Required
                </h3>
                <p className="text-yellow-700 mb-4">
                  Please verify your email address to unlock all features and ensure account security.
                </p>
                <div className="flex space-x-3">
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                    Resend Verification Email
                  </button>
                  <button className="text-yellow-800 hover:text-yellow-900 px-4 py-2 border border-yellow-300 rounded-lg hover:bg-yellow-100 transition-colors">
                    Update Email (Coming Soon)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getQuickActions(user.role).map((action, index) => {
                  const Icon = action.icon;
                  
                  if (action.available) {
                    return (
                      <Link
                        key={index}
                        href={action.href}
                        className="group p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all duration-200"
                      >
                        <Icon className={`w-8 h-8 ${action.color} mb-3 group-hover:scale-110 transition-transform`} />
                        <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </Link>
                    );
                  }
                  
                  return (
                    <div
                      key={index}
                      className="p-6 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed opacity-60"
                    >
                      <Icon className={`w-8 h-8 ${action.color} mb-3`} />
                      <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Account created successfully</p>
                    <p className="text-sm text-gray-600">Welcome to Legato! Start exploring stories.</p>
                  </div>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>More activity will appear here as you use Legato</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{user.email}</span>
                    {user.verified ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Mail className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Username</span>
                  <span className="text-sm font-medium text-gray-900">@{user.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{user.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member since</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
              <div className="space-y-4">
                {user.role === 'writer' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Stories Written</span>
                      <span className="text-lg font-bold text-primary-600">{user.stats?.storiesWritten || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Views</span>
                      <span className="text-lg font-bold text-green-600">{user.stats?.totalViews || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Followers</span>
                      <span className="text-lg font-bold text-blue-600">{user.stats?.followers || 0}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Stories Read</span>
                      <span className="text-lg font-bold text-primary-600">{user.stats?.storiesRead || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Following</span>
                      <span className="text-lg font-bold text-blue-600">{user.stats?.following || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className="text-lg font-bold text-green-600">{user.stats?.completionRate || 0}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Getting Started */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Account created</span>
                </div>
                <div className="flex items-center space-x-3">
                  {user.verified ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  )}
                  <span className={`text-sm ${user.verified ? 'text-gray-700' : 'text-gray-500'}`}>
                    Verify email address
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-500">Complete profile setup</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-500">
                    {user.role === 'writer' ? 'Write your first story' : 'Read your first story'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}