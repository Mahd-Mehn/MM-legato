import { NextRequest, NextResponse } from 'next/server';

// Mock user balances for development
const mockUserBalances: { [key: string]: any } = {
  'user-1': {
    id: 'balance-1',
    user_id: 'user-1',
    balance: 1250,
    lifetime_earned: 2500,
    lifetime_spent: 1250,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  'user-2': {
    id: 'balance-2',
    user_id: 'user-2',
    balance: 500,
    lifetime_earned: 1000,
    lifetime_spent: 500,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-15T14:20:00Z',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // In production, this would fetch from the payment service
    const balance = mockUserBalances[userId] || {
      id: `balance-${userId}`,
      user_id: userId,
      balance: 0,
      lifetime_earned: 0,
      lifetime_spent: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(balance);
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user balance' },
      { status: 500 }
    );
  }
}