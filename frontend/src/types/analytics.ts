export interface AnalyticsSummary {
  total_views: number
  total_earnings: number
  total_purchases: number
  total_books: number
  date_range: {
    start_date: string
    end_date: string
  }
}

export interface BookAnalytics {
  book_id: string
  title: string
  views: number
  unique_viewers: number
  chapter_views: Record<string, number>
  earnings: number
  purchases: number
}

export interface DailyEarning {
  date: string
  amount: number
}

export interface WriterAnalytics {
  summary: AnalyticsSummary
  books: BookAnalytics[]
  daily_earnings: DailyEarning[]
}

export interface ChapterAnalytics {
  id: string
  title: string
  chapter_number: number
  views: number
}

export interface DailyView {
  date: string
  views: number
  unique_viewers: number
}

export interface BookDetailAnalytics {
  book: {
    id: string
    title: string
    description: string
    pricing_model: string
    fixed_price?: number
    per_chapter_price?: number
  }
  summary: {
    total_earnings: number
    total_purchases: number
    total_chapters: number
  }
  daily_views: DailyView[]
  chapters: ChapterAnalytics[]
}

export interface DateRange {
  startDate: Date | null
  endDate: Date | null
}