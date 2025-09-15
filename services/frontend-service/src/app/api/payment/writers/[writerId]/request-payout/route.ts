import { NextRequest, NextResponse } from 'next/server';

// Mock writer earnings storage
const mockWriterEarnings: { [key: string]: any } = {};

export async function POST(
  request: NextRequest,
  { params }: { params: { writerId: string } }
) {
  try {
    const { writerId } = params;
    const body = await request.json();
    const { amount, currency } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid payout amount' },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: 'Minimum payout amount is $10' },
        { status: 400 }
      );
    }

    if (!currency || !['USD', 'NGN', 'CAD'].includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Verify the writer has sufficient available balance
    // 2. Create a payout request in the payment service
    // 3. Update the writer's available/pending balances
    // 4. Send notification to payment processing team

    const payoutRequest = {
      id: `payout-${Date.now()}`,
      writer_id: writerId,
      amount,
      currency,
      status: 'pending',
      requested_at: new Date().toISOString(),
      estimated_processing_time: '3-5 business days',
    };

    return NextResponse.json(payoutRequest, { status: 201 });
  } catch (error) {
    console.error('Error requesting payout:', error);
    return NextResponse.json(
      { error: 'Failed to request payout' },
      { status: 500 }
    );
  }
}