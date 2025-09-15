import { NextRequest, NextResponse } from 'next/server';

// Mock user subscriptions
const mockUserSubscriptions: { [key: string]: any } = {
  'user-1': {
    id: 'sub-1',
    plan_id: 'pro-monthly',
    plan_name: 'Pro',
    status: 'active',
    current_period_start: '2024-01-01T00:00:00Z',
    current_period_end: '2024-02-01T00:00:00Z',
    cancel_at_period_end: false,
    price: 19.99,
    currency: 'USD',
    period: 'monthly',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  'user-2': null, // No subscription
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // In production, this would fetch from the payment service
    const subscription = mockUserSubscriptions[userId];

    if (!subscription) {
      return NextResponse.json(null);
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // In production, this would cancel the subscription via the payment service
    if (mockUserSubscriptions[userId]) {
      mockUserSubscriptions[userId].cancel_at_period_end = true;
      mockUserSubscriptions[userId].updated_at = new Date().toISOString();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}