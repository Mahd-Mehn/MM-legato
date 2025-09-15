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

// Mock transactions storage
const mockTransactions: { [key: string]: any[] } = {
  'user-1': [],
};

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { recipient_user_id, coin_amount, message, content_id } = body;

    if (!recipient_user_id) {
      return NextResponse.json(
        { error: 'Recipient user ID is required' },
        { status: 400 }
      );
    }

    if (!coin_amount || coin_amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid coin amount' },
        { status: 400 }
      );
    }

    if (coin_amount > 1000) {
      return NextResponse.json(
        { error: 'Maximum tip amount is 1000 coins' },
        { status: 400 }
      );
    }

    if (userId === recipient_user_id) {
      return NextResponse.json(
        { error: 'Cannot send tip to yourself' },
        { status: 400 }
      );
    }

    // Get user balance
    const userBalance = mockUserBalances[userId];
    if (!userBalance) {
      return NextResponse.json(
        { error: 'User balance not found' },
        { status: 404 }
      );
    }

    if (userBalance.balance < coin_amount) {
      return NextResponse.json(
        { error: 'Insufficient coins' },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = {
      id: `txn-${Date.now()}`,
      user_id: userId,
      transaction_type: 'TIP',
      status: 'COMPLETED',
      coin_amount: -coin_amount,
      description: `Tip to user ${recipient_user_id}${message ? `: ${message}` : ''}`,
      related_content_id: content_id,
      recipient_user_id,
      message,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    // Update sender balance
    userBalance.balance -= coin_amount;
    userBalance.lifetime_spent += coin_amount;

    // In a real implementation, we would also update the recipient's balance
    // and create a corresponding earning transaction for them

    // Store transaction
    if (!mockTransactions[userId]) {
      mockTransactions[userId] = [];
    }
    mockTransactions[userId].unshift(transaction);

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error sending tip:', error);
    return NextResponse.json(
      { error: 'Failed to send tip' },
      { status: 500 }
    );
  }
}