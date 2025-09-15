import { NextRequest, NextResponse } from 'next/server';

// Mock spending analytics data
const mockSpendingAnalytics: { [key: string]: any } = {
  'user-1': {
    total_spent_today: 25,
    total_spent_week: 150,
    total_spent_month: 450,
    spending_by_category: {
      premium_chapters: 300,
      tips: 100,
      gifts: 50,
      other: 0,
    },
    recent_purchases: [
      {
        id: 'purchase-1',
        amount: 25,
        description: 'Premium chapter: "The Dragon\'s Tale - Chapter 8"',
        category: 'premium_chapters',
        created_at: '2024-01-15T14:30:00Z',
      },
      {
        id: 'purchase-2',
        amount: 50,
        description: 'Tip to @author_jane for "Mystic Adventures"',
        category: 'tips',
        created_at: '2024-01-14T10:15:00Z',
      },
      {
        id: 'purchase-3',
        amount: 30,
        description: 'Premium chapter: "Space Odyssey - Chapter 15"',
        category: 'premium_chapters',
        created_at: '2024-01-13T16:45:00Z',
      },
      {
        id: 'purchase-4',
        amount: 75,
        description: 'Tip to @writer_bob for "Mystery Novel"',
        category: 'tips',
        created_at: '2024-01-12T09:20:00Z',
      },
      {
        id: 'purchase-5',
        amount: 20,
        description: 'Premium chapter: "Fantasy Quest - Chapter 3"',
        category: 'premium_chapters',
        created_at: '2024-01-11T20:10:00Z',
      },
    ],
    spending_trend: [
      { date: '2024-01-09', amount: 45 },
      { date: '2024-01-10', amount: 30 },
      { date: '2024-01-11', amount: 60 },
      { date: '2024-01-12', amount: 75 },
      { date: '2024-01-13', amount: 30 },
      { date: '2024-01-14', amount: 50 },
      { date: '2024-01-15', amount: 25 },
    ],
  },
  'user-2': {
    total_spent_today: 0,
    total_spent_week: 15,
    total_spent_month: 45,
    spending_by_category: {
      premium_chapters: 45,
      tips: 0,
      gifts: 0,
      other: 0,
    },
    recent_purchases: [
      {
        id: 'purchase-6',
        amount: 15,
        description: 'Premium chapter: "Romance Story - Chapter 1"',
        category: 'premium_chapters',
        created_at: '2024-01-10T12:00:00Z',
      },
    ],
    spending_trend: [
      { date: '2024-01-09', amount: 0 },
      { date: '2024-01-10', amount: 15 },
      { date: '2024-01-11', amount: 0 },
      { date: '2024-01-12', amount: 0 },
      { date: '2024-01-13', amount: 0 },
      { date: '2024-01-14', amount: 0 },
      { date: '2024-01-15', amount: 0 },
    ],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week';

    // In production, this would fetch from the analytics service
    const analytics = mockSpendingAnalytics[userId] || {
      total_spent_today: 0,
      total_spent_week: 0,
      total_spent_month: 0,
      spending_by_category: {
        premium_chapters: 0,
        tips: 0,
        gifts: 0,
        other: 0,
      },
      recent_purchases: [],
      spending_trend: [],
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching spending analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spending analytics' },
      { status: 500 }
    );
  }
}