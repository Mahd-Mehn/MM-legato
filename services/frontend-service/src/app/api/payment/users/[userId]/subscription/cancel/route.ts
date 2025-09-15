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
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // In production, this would cancel via Stripe/payment service
    const updatedSubscription = {
      ...currentSubscription,
      cancel_at_period_end: true,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store updated subscription
    mockUserSubscriptions[userId] = updatedSubscription;

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}