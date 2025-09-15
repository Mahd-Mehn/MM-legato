import { NextRequest, NextResponse } from 'next/server';

// Mock usage metrics
const mockUsageMetrics: { [key: string]: any } = {
  'user-1': {
    stories_read: 45,
    premium_chapters_accessed: 23,
    offline_downloads: 12,
    monthly_limit: 50,
    unlimited: false,
    period_start: '2024-01-01T00:00:00Z',
    period_end: '2024-02-01T00:00:00Z',
  },
  'user-2': {
    stories_read: 8,
    premium_chapters_accessed: 0,
    offline_downloads: 0,
    monthly_limit: 0,
    unlimited: false,
    period_start: '2024-01-01T00:00:00Z',
    period_end: '2024-02-01T00:00:00Z',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // In production, this would fetch from the analytics service
    const usage = mockUsageMetrics[userId] || {
      stories_read: 0,
      premium_chapters_accessed: 0,
      offline_downloads: 0,
      monthly_limit: 0,
      unlimited: false,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage metrics' },
      { status: 500 }
    );
  }
}