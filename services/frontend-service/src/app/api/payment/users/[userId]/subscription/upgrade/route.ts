import { NextRequest, NextResponse } from 'next/server';

// Mock user subscriptions storage
const mockUserSubscriptions: { [key: string]: any } = {};

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { new_plan_id } = body;

    // Mock subscription plans for reference
    const plans: { [key: string]: any } = {
      'basic-monthly': { name: 'Basic', price: 9.99, period: 'monthly' },
      'pro-monthly': { name: 'Pro', price: 19.99, period: 'monthly' },
      'pro-yearly': { name: 'Pro Annual', price: 199.99, period: 'yearly' },
    };

    const newPlan = plans[new_plan_id];
    if (!newPlan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    const currentSubscription = mockUserSubscriptions[userId];
    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // In production, this would upgrade via Stripe/payment service
    const updatedSubscription = {
      ...currentSubscription,
      plan_id: new_plan_id,
      plan_name: newPlan.name,
      price: newPlan.price,
      period: newPlan.period,
      updated_at: new Date().toISOString(),
    };

    // Store updated subscription
    mockUserSubscriptions[userId] = updatedSubscription;

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}