import { NextRequest, NextResponse } from 'next/server';

// Mock transaction data
const mockTransactions: { [key: string]: any[] } = {
  'user-1': [
    {
      id: 'txn-1',
      transaction_type: 'COIN_PURCHASE',
      status: 'COMPLETED',
      coin_amount: 550,
      fiat_amount: 19.99,
      currency: 'USD',
      description: 'Popular Pack - 500 coins + 50 bonus',
      created_at: '2024-01-15T10:30:00Z',
      completed_at: '2024-01-15T10:30:15Z',
      external_transaction_id: 'pi_1234567890',
    },
    {
      id: 'txn-2',
      transaction_type: 'COIN_SPEND',
      status: 'COMPLETED',
      coin_amount: -50,
      description: 'Premium chapter: "The Dragon\'s Tale - Chapter 5"',
      created_at: '2024-01-14T15:20:00Z',
      completed_at: '2024-01-14T15:20:01Z',
      related_content_id: 'chapter-123',
    },
    {
      id: 'txn-3',
      transaction_type: 'TIP',
      status: 'COMPLETED',
      coin_amount: -25,
      description: 'Tip to @author_jane for "Mystic Adventures"',
      created_at: '2024-01-13T09:15:00Z',
      completed_at: '2024-01-13T09:15:02Z',
    },
    {
      id: 'txn-4',
      transaction_type: 'COIN_PURCHASE',
      status: 'COMPLETED',
      coin_amount: 100,
      fiat_amount: 4.99,
      currency: 'USD',
      description: 'Starter Pack - 100 coins',
      created_at: '2024-01-10T14:45:00Z',
      completed_at: '2024-01-10T14:45:12Z',
      external_transaction_id: 'pi_0987654321',
    },
    {
      id: 'txn-5',
      transaction_type: 'COIN_SPEND',
      status: 'COMPLETED',
      coin_amount: -30,
      description: 'Premium chapter: "Space Odyssey - Chapter 12"',
      created_at: '2024-01-09T20:30:00Z',
      completed_at: '2024-01-09T20:30:01Z',
      related_content_id: 'chapter-456',
    },
  ],
  'user-2': [
    {
      id: 'txn-6',
      transaction_type: 'COIN_PURCHASE',
      status: 'COMPLETED',
      coin_amount: 1150,
      fiat_amount: 34.99,
      currency: 'USD',
      description: 'Premium Pack - 1000 coins + 150 bonus',
      created_at: '2024-01-12T11:20:00Z',
      completed_at: '2024-01-12T11:20:18Z',
      external_transaction_id: 'pi_1122334455',
    },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');

    // Get user transactions
    let transactions = mockTransactions[userId] || [];

    // Apply filters
    if (type && type !== 'all') {
      transactions = transactions.filter(t => t.transaction_type === type);
    }

    if (status && status !== 'all') {
      transactions = transactions.filter(t => t.status === status);
    }

    if (dateFrom) {
      transactions = transactions.filter(t => new Date(t.created_at) >= new Date(dateFrom));
    }

    if (dateTo) {
      transactions = transactions.filter(t => new Date(t.created_at) <= new Date(dateTo));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      transactions = transactions.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        t.external_transaction_id?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by created_at descending
    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination
    const paginatedTransactions = transactions.slice(offset, offset + limit);

    return NextResponse.json(paginatedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}