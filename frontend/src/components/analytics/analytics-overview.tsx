'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/ui/stats-card'
import { DateRangePicker } from '@/components/analytics/date-range-picker'
import { EarningsChart } from '@/components/analytics/earnings-chart'
import { BookPerformanceTable } from '@/components/analytics/book-performance-table'
import { useWriterAnalytics } from '@/hooks/useAnalytics'
import { DateRange } from '@/types/analytics'
import { 
  BookOpen, 
  Eye, 
  DollarSign, 
  ShoppingCart, 
  Download, 
  Loader2,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { toast } from 'sonner'

export function AnalyticsOverview() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null
  })
  
  const { 
    analytics, 
    loading, 
    error, 
    exportEarningsReport, 
    exportAnalyticsReport 
  } = useWriterAnalytics(dateRange)

  const handleExportEarnings = async () => {
    try {
      await exportEarningsReport()
      toast.success('Earnings report downloaded successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to export earnings report')
    }
  }

  const handleExportAnalytics = async () => {
    try {
      await exportAnalyticsReport()
      toast.success('Analytics report downloaded successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to export analytics report')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          No Analytics Data
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Start publishing books to see your analytics data here.
        </p>
      </div>
    )
  }

  const { summary, books, daily_earnings } = analytics

  return (
    <div className="space-y-6">
      {/* Header with Date Range and Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Analytics Overview
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {summary.date_range.start_date} to {summary.date_range.end_date}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportEarnings}>
              <Download className="h-4 w-4 mr-2" />
              Export Earnings
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAnalytics}>
              <Download className="h-4 w-4 mr-2" />
              Export Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Books"
          value={summary.total_books.toString()}
          icon={BookOpen}
          trend={`${books.filter(b => b.views > 0).length} with views`}
          trendUp={books.filter(b => b.views > 0).length > 0}
        />
        <StatsCard
          title="Total Views"
          value={summary.total_views.toLocaleString()}
          icon={Eye}
          trend={summary.total_views > 0 ? 'Growing audience' : 'No views yet'}
          trendUp={summary.total_views > 0}
        />
        <StatsCard
          title="Total Purchases"
          value={summary.total_purchases.toString()}
          icon={ShoppingCart}
          trend={summary.total_purchases > 0 ? 'Revenue generating' : 'No sales yet'}
          trendUp={summary.total_purchases > 0}
        />
        <StatsCard
          title="Total Earnings"
          value={`${summary.total_earnings} coins`}
          icon={DollarSign}
          trend={summary.total_earnings > 0 ? 'From book sales' : 'Start earning'}
          trendUp={summary.total_earnings > 0}
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EarningsChart data={daily_earnings} />
          </CardContent>
        </Card>

        {/* Top Performing Books */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Book Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BookPerformanceTable books={books.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>

      {/* Full Book Performance Table */}
      {books.length > 5 && (
        <Card>
          <CardHeader>
            <CardTitle>All Books Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <BookPerformanceTable books={books} showPagination />
          </CardContent>
        </Card>
      )}
    </div>
  )
}