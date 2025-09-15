import { NextRequest, NextResponse } from 'next/server';

// Mock transaction data (same as in transactions route)
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
    // ... other transactions
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Get user transactions
    let transactions = mockTransactions[userId] || [];

    // Apply filters (same logic as transactions route)
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

    // Sort by created_at descending
    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Generate CSV content
    const csvHeaders = [
      'Transaction ID',
      'Type',
      'Status',
      'Coin Amount',
      'Fiat Amount',
      'Currency',
      'Description',
      'Created At',
      'Completed At',
      'External ID'
    ];

    const csvRows = transactions.map(t => [
      t.id,
      t.transaction_type,
      t.status,
      t.coin_amount,
      t.fiat_amount || '',
      t.currency || '',
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes in description
      t.created_at,
      t.completed_at || '',
      t.external_transaction_id || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${userId}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting transactions:', error);
    return NextResponse.json(
      { error: 'Failed to export transactions' },
      { status: 500 }
    );
  }
}