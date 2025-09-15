import { NextRequest, NextResponse } from 'next/server';

// Mock user subscriptions storage
const mockUserSubscriptions: { [key: string]: any } = {};

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const currentSubscription = mockUserSubscriptions[userId];
    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    if (!currentSubscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is not cancelled' },
        { status: 400 }
      );
    }

    // In production, this would reactivate via Stripe/payment service
    const updatedSubscription = {
      ...currentSubscription,
      cancel_at_period_end: false,
      cancelled_at: null,
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    // Store updated subscription
    mockUserSubscriptions[userId] = updatedSubscription;

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}