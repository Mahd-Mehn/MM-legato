import { NextRequest, NextResponse } from 'next/server';

// Mock user balances
const mockUserBalances: { [key: string]: any } = {
  'user-1': {
    id: 'balance-1',
    user_id: 'user-1',
    balance: 1250,
    lifetime_earned: 2500,
    lifetime_spent: 1250,
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();

    // In production, this would confirm payment via Stripe/PayPal and update user balance
    const coinsAdded = 550; // Mock value based on popular pack
    
    // Update mock balance
    if (!mockUserBalances[userId]) {
      mockUserBalances[userId] = {
        id: `balance-${userId}`,
        user_id: userId,
        balance: 0,
        lifetime_earned: 0,
        lifetime_spent: 0,
      };
    }

    mockUserBalances[userId].balance += coinsAdded;
    mockUserBalances[userId].lifetime_earned += coinsAdded;

    const confirmation = {
      transaction_id: `txn_${Date.now()}`,
      status: 'COMPLETED',
      coins_added: coinsAdded,
      new_balance: mockUserBalances[userId].balance,
      payment_intent_id: body.payment_intent_id,
    };

    return NextResponse.json(confirmation);
  } catch (error) {
    console.error('Error confirming purchase:', error);
    return NextResponse.json(
      { error: 'Failed to confirm purchase' },
      { status: 500 }
    );
  }
}