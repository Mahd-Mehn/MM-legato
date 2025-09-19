'use client'

import { BookCard } from '@/components/ui/book-card'
import { StatsCard } from '@/components/ui/stats-card'
import { BookOpen, Users, TrendingUp, Clock, Loader2, PenTool, Eye } from 'lucide-react'
import { useOnboardingRedirect } from '@/hooks/useOnboarding'
import { useUserRole } from '@/hooks/useUserRole'
import { useDashboardStats, useContinueReading, useRecommendedBooks, useUserStories } from '@/hooks/useDashboard'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { ErrorBoundary, DashboardErrorFallback } from '@/components/ui/error-boundary'
import Link from 'next/link'

export default function DashboardPage() {
  const { profile, isLoading: profileLoading, needsOnboarding } = useOnboardingRedirect()
  const { data: userRole, isLoading: roleLoading } = useUserRole()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: continueReading, isLoading: continueLoading } = useContinueReading()
  const { data: recommended, isLoading: recommendedLoading } = useRecommendedBooks()
  const { data: userStories, isLoading: storiesLoading } = useUserStories()

  // Show loading while checking onboarding status or user role
  if (profileLoading || roleLoading || needsOnboarding) {
    return <DashboardSkeleton />
  }

  if (!profile || !userRole) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  return (
    <ErrorBoundary fallback={DashboardErrorFallback}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back, {profile.username}!
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            {userRole.is_writer
              ? "Manage your stories and engage with your readers"
              : "Continue your reading journey or discover something new"
            }
          </p>
          {userRole.is_writer && (
            <div className="flex items-center mt-2 text-sm text-green-600 dark:text-green-400">
              <PenTool className="h-4 w-4 mr-1" />
              Writer Account
            </div>
          )}
        </div>

        {/* Dynamic Stats Grid based on user role */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Books Read"
            value={statsLoading ? "..." : (stats?.books_read?.toString() || "0")}
            icon={BookOpen}
            trend={stats?.books_in_progress ? `${stats.books_in_progress} in progress` : "Start reading!"}
            trendUp={true}
          />
          <StatsCard
            title="Reading Time"
            value={statsLoading ? "..." : `${stats?.reading_time_hours || 0}h`}
            icon={Clock}
            trend="Total time spent"
            trendUp={true}
          />
          <StatsCard
            title="Community"
            value={statsLoading ? "..." : (stats?.comments_made?.toString() || "0")}
            icon={Users}
            trend="Comments made"
            trendUp={true}
          />
          {userRole.is_writer ? (
            <StatsCard
              title="Story Views"
              value={statsLoading ? "..." : (stats?.story_views?.toString() || "0")}
              icon={Eye}
              trend="Total views"
              trendUp={true}
            />
          ) : (
            <StatsCard
              title="Coins"
              value={profile.coin_balance?.toString() || "0"}
              icon={TrendingUp}
              trend="Available balance"
              trendUp={true}
            />
          )}
        </div>

        {/* Continue Reading */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Continue Reading</h2>
          {continueLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 dark:bg-slate-700 h-48 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : continueReading && continueReading.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {continueReading.map((book) => (
                <BookCard
                  key={book.id}
                  title={book.title}
                  author={book.author}
                  progress={Number(book.progress)}
                  coverUrl={book.cover_url}
                  href={`/reading/${book.book_id}/${book.current_chapter_id}`}
                  subtitle={`Chapter ${book.current_chapter_number}: ${book.current_chapter_title}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No books in progress</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">Start reading a book to see it here</p>
              <Link href="/dashboard/explore">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Explore Books
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Recommended */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Recommended for You</h2>
          {recommendedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 dark:bg-slate-700 h-48 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recommended && recommended.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommended.slice(0, 4).map((book) => (
                <BookCard
                  key={book.id}
                  title={book.title}
                  author={book.author}
                  price={book.is_free ? undefined : book.price}
                  isFree={book.is_free}
                  rating={book.rating}
                  coverUrl={book.cover_url}
                  href={`/dashboard/explore/${book.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No recommendations yet</h3>
              <p className="text-slate-600 dark:text-slate-300">Start reading to get personalized recommendations</p>
            </div>
          )}
        </div>

        {/* Writer-specific section */}
        {userRole.is_writer && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Your Stories</h2>
            {storiesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-slate-200 dark:bg-slate-700 h-48 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : userStories && userStories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userStories.map((story) => (
                  <BookCard
                    key={story.id}
                    title={story.title}
                    author="You"
                    chapterCount={story.chapter_count}
                    coverUrl={story.cover_url}
                    href={`/dashboard/writer/books/${story.id}`}
                    isPublished={story.is_published}
                  />
                ))}
                {/* Create new story card */}
                <Link href="/dashboard/writer/books/new">
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-blue-400 transition-colors cursor-pointer">
                    <PenTool className="h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                      Create New Story
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Start writing your next masterpiece
                    </p>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/writer/books/new">
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-blue-400 transition-colors cursor-pointer">
                    <PenTool className="h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                      Create Your First Story
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Start writing and share your stories with readers
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}