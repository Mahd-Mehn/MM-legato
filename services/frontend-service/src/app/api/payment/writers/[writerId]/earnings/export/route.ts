import { NextRequest, NextResponse } from 'next/server';

// Mock earnings data for export
const mockEarningsData: { [key: string]: any[] } = {
  'user-1': [
    {
      date: '2024-01-15',
      source: 'Content Sales',
      description: 'The Dragon\'s Tale - Chapter 12',
      amount: 25.50,
      currency: 'USD',
      transaction_id: 'txn-001',
    },
    {
      date: '2024-01-14',
      source: 'Tips',
      description: 'Tip from reader @bookworm123',
      amount: 10.00,
      currency: 'USD',
      transaction_id: 'txn-002',
    },
    {
      date: '2024-01-13',
      source: 'Content Sales',
      description: 'Mystic Adventures - Chapter 8',
      amount: 30.00,
      currency: 'USD',
      transaction_id: 'txn-003',
    },
    {
      date: '2024-01-12',
      source: 'Subscription Revenue',
      description: 'Monthly subscription pool distribution',
      amount: 45.25,
      currency: 'USD',
      transaction_id: 'txn-004',
    },
    {
      date: '2024-01-11',
      source: 'Tips',
      description: 'Tip from reader @storyLover',
      amount: 15.00,
      currency: 'USD',
      transaction_id: 'txn-005',
    },
  ],
  'user-2': [
    {
      date: '2024-01-10',
      source: 'Content Sales',
      description: 'Romance in the City - Chapter 1',
      amount: 12.50,
      currency: 'USD',
      transaction_id: 'txn-006',
    },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: { writerId: string } }
) {
  try {
    const { writerId } = params;
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const format = searchParams.get('format') || 'csv';

    // Get earnings data
    let earningsData = mockEarningsData[writerId] || [];

    // Apply date filters if provided
    if (startDate) {
      earningsData = earningsData.filter(item => item.date >= startDate);
    }
    if (endDate) {
      earningsData = earningsData.filter(item => item.date <= endDate);
    }

    // Sort by date descending
    earningsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = [
        'Date',
        'Source',
        'Description',
        'Amount',
        'Currency',
        'Transaction ID'
      ];

      const csvRows = earningsData.map(item => [
        item.date,
        item.source,
        `"${item.description.replace(/"/g, '""')}"`, // Escape quotes
        item.amount,
        item.currency,
        item.transaction_id
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="earnings-report-${writerId}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'json') {
      return NextResponse.json({
        writer_id: writerId,
        generated_at: new Date().toISOString(),
        total_records: earningsData.length,
        total_earnings: earningsData.reduce((sum, item) => sum + item.amount, 0),
        currency: earningsData[0]?.currency || 'USD',
        earnings: earningsData,
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Use csv or json.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting earnings report:', error);
    return NextResponse.json(
      { error: 'Failed to export earnings report' },
      { status: 500 }
    );
  }
}