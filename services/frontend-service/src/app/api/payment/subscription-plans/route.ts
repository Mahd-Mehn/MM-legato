import { NextRequest, NextResponse } from 'next/server';

// Mock subscription plans data
const mockSubscriptionPlans = [
  {
    id: 'basic-monthly',
    name: 'Basic',
    price: 9.99,
    currency: 'USD',
    period: 'monthly',
    description: 'Perfect for casual readers who want ad-free experience',
    features: [
      'Unlimited reading access',
      'Ad-free experience',
      'Early access to new chapters',
      'Basic reading analytics',
      'Mobile app access',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'pro-monthly',
    name: 'Pro',
    price: 19.99,
    currency: 'USD',
    period: 'monthly',
    description: 'Best for avid readers who want premium features',
    features: [
      'Everything in Basic',
      'Premium stories access',
      'Offline reading (50 downloads/month)',
      'Advanced reading analytics',
      'Priority customer support',
      'Exclusive author content',
      'Early beta features',
    ],
    popular: true,
  },
  {
    id: 'pro-yearly',
    name: 'Pro Annual',
    price: 199.99,
    currency: 'USD',
    period: 'yearly',
    description: 'Save 17% with annual billing',
    savings: 'Save $40/year',
    features: [
      'Everything in Pro Monthly',
      'Unlimited offline downloads',
      'Exclusive annual subscriber perks',
      'Priority feature requests',
      'Annual subscriber badge',
      'Special community access',
    ],
    popular: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // 'monthly' or 'yearly'
    
    let plans = mockSubscriptionPlans;
    
    if (period) {
      plans = plans.filter(plan => plan.period === period);
    }

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In production, this would create a new subscription plan
    const newPlan = {
      id: `plan-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
}