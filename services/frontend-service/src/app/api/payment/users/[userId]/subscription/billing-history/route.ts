import { NextRequest, NextResponse } from 'next/server';

// Mock billing history
const mockBillingHistory: { [key: string]: any[] } = {
  'user-1': [
    {
      id: 'inv-1',
      amount: 19.99,
      currency: 'USD',
      status: 'paid',
      invoice_url: 'https://example.com/invoice/inv-1.pdf',
      created_at: '2024-01-01T00:00:00Z',
      description: 'Pro Monthly Subscription',
      period_start: '2024-01-01T00:00:00Z',
      period_end: '2024-02-01T00:00:00Z',
    },
    {
      id: 'inv-2',
      amount: 19.99,
      currency: 'USD',
      status: 'paid',
      invoice_url: 'https://example.com/invoice/inv-2.pdf',
      created_at: '2023-12-01T00:00:00Z',
      description: 'Pro Monthly Subscription',
      period_start: '2023-12-01T00:00:00Z',
      period_end: '2024-01-01T00:00:00Z',
    },
    {
      id: 'inv-3',
      amount: 9.99,
      currency: 'USD',
      status: 'paid',
      invoice_url: 'https://example.com/invoice/inv-3.pdf',
      created_at: '2023-11-01T00:00:00Z',
      description: 'Basic Monthly Subscription',
      period_start: '2023-11-01T00:00:00Z',
      period_end: '2023-12-01T00:00:00Z',
    },
  ],
  'user-2': [],
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // In production, this would fetch from the payment service
    let billingHistory = mockBillingHistory[userId] || [];

    // Sort by created_at descending
    billingHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination
    const paginatedHistory = billingHistory.slice(offset, offset + limit);

    return NextResponse.json(paginatedHistory);
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing history' },
      { status: 500 }
    );
  }
}