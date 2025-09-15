import { NextRequest, NextResponse } from 'next/server';

// Mock tax report data
const mockTaxReports: { [key: string]: any } = {
  'user-1': {
    year: 2024,
    total_income: 2450.75,
    currency: 'USD',
    breakdown_by_source: {
      content_sales: 1800.50,
      tips: 450.25,
      subscriptions: 150.00,
      licensing: 50.00,
    },
    breakdown_by_month: [
      { month: 'January', amount: 450.75 },
      { month: 'December', amount: 380.50 },
      { month: 'November', amount: 320.25 },
      { month: 'October', amount: 290.00 },
      { month: 'September', amount: 275.50 },
      { month: 'August', amount: 260.75 },
      { month: 'July', amount: 245.00 },
      { month: 'June', amount: 228.50 },
    ],
    tax_documents: [
      {
        type: '1099-MISC Form',
        url: 'https://example.com/tax-docs/1099-misc-2024.pdf',
        generated_at: '2024-01-31T00:00:00Z',
      },
      {
        type: 'Annual Income Summary',
        url: 'https://example.com/tax-docs/income-summary-2024.pdf',
        generated_at: '2024-01-31T00:00:00Z',
      },
      {
        type: 'Monthly Breakdown Report',
        url: 'https://example.com/tax-docs/monthly-breakdown-2024.pdf',
        generated_at: '2024-01-31T00:00:00Z',
      },
    ],
    tax_information: {
      tax_id_required: true,
      tax_id_on_file: true,
      backup_withholding: false,
      foreign_tax_status: false,
    },
  },
  'user-2': {
    year: 2024,
    total_income: 125.50,
    currency: 'USD',
    breakdown_by_source: {
      content_sales: 100.50,
      tips: 25.00,
      subscriptions: 0.00,
      licensing: 0.00,
    },
    breakdown_by_month: [
      { month: 'January', amount: 125.50 },
    ],
    tax_documents: [],
    tax_information: {
      tax_id_required: false,
      tax_id_on_file: false,
      backup_withholding: false,
      foreign_tax_status: false,
    },
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { writerId: string } }
) {
  try {
    const { writerId } = params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // In production, this would fetch from the payment/tax service
    const taxReport = mockTaxReports[writerId] || {
      year,
      total_income: 0,
      currency: 'USD',
      breakdown_by_source: {
        content_sales: 0,
        tips: 0,
        subscriptions: 0,
        licensing: 0,
      },
      breakdown_by_month: [],
      tax_documents: [],
      tax_information: {
        tax_id_required: false,
        tax_id_on_file: false,
        backup_withholding: false,
        foreign_tax_status: false,
      },
    };

    return NextResponse.json(taxReport);
  } catch (error) {
    console.error('Error fetching tax report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax report' },
      { status: 500 }
    );
  }
}