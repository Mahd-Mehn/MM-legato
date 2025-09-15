import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();

    // In production, this would create a payment intent via Stripe/PayPal
    const paymentIntent = {
      payment_intent_id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: body.currency === 'USD' ? 19.99 : 
              body.currency === 'NGN' ? 14992.50 : 26.99,
      currency: body.currency,
      status: 'requires_confirmation',
    };

    return NextResponse.json(paymentIntent);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}