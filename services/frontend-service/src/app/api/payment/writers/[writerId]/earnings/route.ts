import { NextRequest, NextResponse } from 'next/server';

// Mock writer earnings data
const mockWriterEarnings: { [key: string]: any } = {
  'user-1': {
    total_earnings: {
      USD: 2450.75,
      NGN: 1837562.50,
      CAD: 3308.51,
    },
    available_for_payout: {
      USD: 1250.30,
      NGN: 937725.00,
      CAD: 1687.91,
    },
    pending_payout: {
      USD: 500.00,
      NGN: 375000.00,
      CAD: 675.00,
    },
    earnings_by_source: {
      content_sales: 1800.50,
      tips: 450.25,
      subscriptions: 150.00,
      licensing: 50.00,
    },
    monthly_earnings: [
      { month: '2024-01', amount: 450.75, currency: 'USD' },
      { month: '2023-12', amount: 380.50, currency: 'USD' },
      { month: '2023-11', amount: 320.25, currency: 'USD' },
      { month: '2023-10', amount: 290.00, currency: 'USD' },
      { month: '2023-09', amount: 275.50, currency: 'USD' },
      { month: '2023-08', amount: 260.75, currency: 'USD' },
    ],
    top_performing_content: [
      {
        id: 'story-1',
        title: 'The Dragon\'s Tale - Complete Series',
        earnings: 850.25,
        views: 15420,
        conversion_rate: 0.12,
      },
      {
        id: 'story-2',
        title: 'Mystic Adventures - Season 1',
        earnings: 620.50,
        views: 12350,
        conversion_rate: 0.08,
      },
      {
        id: 'story-3',
        title: 'Space Odyssey Chronicles',
        earnings: 380.75,
        views: 8900,
        conversion_rate: 0.15,
      },
    ],
    payout_history: [
      {
        id: 'payout-1',
        amount: 500.00,
        currency: 'USD',
        status: 'completed',
        requested_at: '2024-01-01T00:00:00Z',
        processed_at: '2024-01-03T10:30:00Z',
      },
      {
        id: 'payout-2',
        amount: 300.00,
        currency: 'USD',
        status: 'completed',
        requested_at: '2023-12-15T00:00:00Z',
        processed_at: '2023-12-17T14:20:00Z',
      },
      {
        id: 'payout-3',
        amount: 750.00,
        currency: 'USD',
        status: 'pending',
        requested_at: '2024-01-10T00:00:00Z',
      },
    ],
  },
  'user-2': {
    total_earnings: {
      USD: 125.50,
      NGN: 94125.00,
      CAD: 169.43,
    },
    available_for_payout: {
      USD: 125.50,
      NGN: 94125.00,
      CAD: 169.43,
    },
    pending_payout: {
      USD: 0.00,
      NGN: 0.00,
      CAD: 0.00,
    },
    earnings_by_source: {
      content_sales: 100.50,
      tips: 25.00,
      subscriptions: 0.00,
      licensing: 0.00,
    },
    monthly_earnings: [
      { month: '2024-01', amount: 125.50, currency: 'USD' },
    ],
    top_performing_content: [
      {
        id: 'story-4',
        title: 'Romance in the City',
        earnings: 125.50,
        views: 2450,
        conversion_rate: 0.05,
      },
    ],
    payout_history: [],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { writerId: string } }
) {
  try {
    const { writerId } = params;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'month';

    // In production, this would fetch from the payment service
    const earnings = mockWriterEarnings[writerId] || {
      total_earnings: { USD: 0, NGN: 0, CAD: 0 },
      available_for_payout: { USD: 0, NGN: 0, CAD: 0 },
      pending_payout: { USD: 0, NGN: 0, CAD: 0 },
      earnings_by_source: {
        content_sales: 0,
        tips: 0,
        subscriptions: 0,
        licensing: 0,
      },
      monthly_earnings: [],
      top_performing_content: [],
      payout_history: [],
    };

    return NextResponse.json(earnings);
  } catch (error) {
    console.error('Error fetching writer earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch writer earnings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { writerId: string } }
) {
  try {
    const { writerId } = params;
    const body = await request.json();

    // In production, this would update earnings via the payment service
    // This endpoint might be used for manual adjustments or corrections

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating writer earnings:', error);
    return NextResponse.json(
      { error: 'Failed to update writer earnings' },
      { status: 500 }
    );
  }
}