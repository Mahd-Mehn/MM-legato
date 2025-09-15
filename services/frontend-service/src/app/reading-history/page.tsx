'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Clock, BookOpen, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ReadingHistoryPage() {
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
          <p className="mt-4 text-gray-600">Loading your reading history...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Mock data for demonstration
  const recentReads = [
    {
      id: '1',
      title: 'The Digital Nomad\'s Journey',
      author: 'Sarah Chen',
      lastRead: '2 hours ago',
      progress: 75,
      chapter: 'Chapter 12: Remote Work Revolution',
      coverUrl: null
    },
    {
      id: '2', 
      title: 'Mysteries of the Ancient Code',
      author: 'Marcus Rodriguez',
      lastRead: '1 day ago',
      progress: 45,
      chapter: 'Chapter 8: The Hidden Algorithm',
      coverUrl: null
    },
    {
      id: '3',
      title: 'Love in the Time of AI',
      author: 'Emma Thompson',
      lastRead: '3 days ago',
      progress: 90,
      chapter: 'Chapter 15: Digital Hearts',
      coverUrl: null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Reading History</h1>
          </div>
          <p className="text-gray-600">
            Pick up where you left off and continue your reading journey
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{user.stats?.storiesRead || 0}</p>
                <p className="text-sm text-gray-600">Stories Read</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">24h</p>
                <p className="text-sm text-gray-600">Reading Time</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">7</p>
                <p className="text-sm text-gray-600">Day Streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Reading */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Continue Reading</h2>
          
          {recentReads.length > 0 ? (
            <div className="space-y-4">
              {recentReads.map((story) => (
                <div key={story.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200">
                  {/* Cover placeholder */}
                  <div className="w-16 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Story info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{story.title}</h3>
                    <p className="text-sm text-gray-600">by {story.author}</p>
                    <p className="text-sm text-gray-500 mt-1">{story.chapter}</p>
                    
                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>{story.progress}% complete</span>
                        <span>Last read {story.lastRead}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${story.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Continue button */}
                  <Link
                    href={`/stories/${story.id}`}
                    className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reading history yet</h3>
              <p className="text-gray-600 mb-6">Start reading stories to see your progress here</p>
              <Link
                href="/stories"
                className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span>Browse Stories</span>
              </Link>
            </div>
          )}
        </div>

        {/* Reading Goals */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Reading Goals</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Weekly Reading Goal</h3>
                <p className="text-sm text-gray-600">Read 3 stories this week</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-600">2/3</p>
                <p className="text-sm text-gray-500">Stories</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Monthly Challenge</h3>
                <p className="text-sm text-gray-600">Complete 10 stories this month</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">7/10</p>
                <p className="text-sm text-gray-500">Stories</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}