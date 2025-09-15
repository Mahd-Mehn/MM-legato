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
    const { plan_id } = body;

    // Mock subscription plans for reference
    const plans: { [key: string]: any } = {
      'basic-monthly': { name: 'Basic', price: 9.99, period: 'monthly' },
      'pro-monthly': { name: 'Pro', price: 19.99, period: 'monthly' },
      'pro-yearly': { name: 'Pro Annual', price: 199.99, period: 'yearly' },
    };

    const plan = plans[plan_id];
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // In production, this would create a subscription via Stripe/payment service
    const subscription = {
      id: `sub-${Date.now()}`,
      plan_id,
      plan_name: plan.name,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + (plan.period === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      price: plan.price,
      currency: 'USD',
      period: plan.period,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store in mock data
    mockUserSubscriptions[userId] = subscription;

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}