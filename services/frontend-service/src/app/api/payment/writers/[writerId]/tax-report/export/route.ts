import { NextRequest, NextResponse } from 'next/server';

// Mock tax report data for export
const mockTaxReportData: { [key: string]: any } = {
  'user-1': {
    writer_info: {
      writer_id: 'user-1',
      name: 'John Doe',
      tax_id: '***-**-1234',
      address: '123 Writer St, Author City, AC 12345',
    },
    tax_year: 2024,
    total_income: 2450.75,
    currency: 'USD',
    quarterly_breakdown: [
      { quarter: 'Q1 2024', amount: 650.25 },
      { quarter: 'Q2 2024', amount: 580.50 },
      { quarter: 'Q3 2024', amount: 620.00 },
      { quarter: 'Q4 2024', amount: 600.00 },
    ],
    monthly_breakdown: [
      { month: 'January 2024', amount: 450.75 },
      { month: 'February 2024', amount: 380.50 },
      { month: 'March 2024', amount: 320.25 },
      { month: 'April 2024', amount: 290.00 },
      { month: 'May 2024', amount: 275.50 },
      { month: 'June 2024', amount: 260.75 },
      { month: 'July 2024', amount: 245.00 },
      { month: 'August 2024', amount: 228.50 },
      { month: 'September 2024', amount: 210.25 },
      { month: 'October 2024', amount: 195.00 },
      { month: 'November 2024', amount: 180.75 },
      { month: 'December 2024', amount: 165.50 },
    ],
    income_by_source: {
      content_sales: 1800.50,
      tips: 450.25,
      subscriptions: 150.00,
      licensing: 50.00,
    },
    deductions: {
      platform_fees: 245.08, // 10% of total income
      processing_fees: 73.52, // 3% of total income
    },
    net_income: 2132.15,
  },
  'user-2': {
    writer_info: {
      writer_id: 'user-2',
      name: 'Jane Smith',
      tax_id: 'Not provided',
      address: 'Not provided',
    },
    tax_year: 2024,
    total_income: 125.50,
    currency: 'USD',
    quarterly_breakdown: [
      { quarter: 'Q1 2024', amount: 125.50 },
      { quarter: 'Q2 2024', amount: 0 },
      { quarter: 'Q3 2024', amount: 0 },
      { quarter: 'Q4 2024', amount: 0 },
    ],
    monthly_breakdown: [
      { month: 'January 2024', amount: 125.50 },
    ],
    income_by_source: {
      content_sales: 100.50,
      tips: 25.00,
      subscriptions: 0.00,
      licensing: 0.00,
    },
    deductions: {
      platform_fees: 12.55,
      processing_fees: 3.77,
    },
    net_income: 109.18,
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
    const format = searchParams.get('format') || 'csv';

    // Get tax report data
    const taxData = mockTaxReportData[writerId] || {
      writer_info: {
        writer_id: writerId,
        name: 'Unknown Writer',
        tax_id: 'Not provided',
        address: 'Not provided',
      },
      tax_year: year,
      total_income: 0,
      currency: 'USD',
      quarterly_breakdown: [],
      monthly_breakdown: [],
      income_by_source: {
        content_sales: 0,
        tips: 0,
        subscriptions: 0,
        licensing: 0,
      },
      deductions: {
        platform_fees: 0,
        processing_fees: 0,
      },
      net_income: 0,
    };

    if (format === 'csv') {
      // Generate comprehensive CSV report
      const sections = [
        // Header information
        ['TAX REPORT', year.toString()],
        ['Generated on', new Date().toISOString().split('T')[0]],
        [''],
        
        // Writer information
        ['WRITER INFORMATION'],
        ['Writer ID', taxData.writer_info.writer_id],
        ['Name', taxData.writer_info.name],
        ['Tax ID', taxData.writer_info.tax_id],
        ['Address', taxData.writer_info.address],
        [''],
        
        // Income summary
        ['INCOME SUMMARY'],
        ['Total Gross Income', `${taxData.total_income} ${taxData.currency}`],
        ['Platform Fees', `${taxData.deductions.platform_fees} ${taxData.currency}`],
        ['Processing Fees', `${taxData.deductions.processing_fees} ${taxData.currency}`],
        ['Net Income', `${taxData.net_income} ${taxData.currency}`],
        [''],
        
        // Income by source
        ['INCOME BY SOURCE'],
        ['Content Sales', `${taxData.income_by_source.content_sales} ${taxData.currency}`],
        ['Tips', `${taxData.income_by_source.tips} ${taxData.currency}`],
        ['Subscriptions', `${taxData.income_by_source.subscriptions} ${taxData.currency}`],
        ['Licensing', `${taxData.income_by_source.licensing} ${taxData.currency}`],
        [''],
        
        // Monthly breakdown
        ['MONTHLY BREAKDOWN'],
        ['Month', 'Amount', 'Currency'],
        ...taxData.monthly_breakdown.map((item: any) => [item.month, item.amount.toString(), taxData.currency]),
        [''],
        
        // Quarterly breakdown
        ['QUARTERLY BREAKDOWN'],
        ['Quarter', 'Amount', 'Currency'],
        ...taxData.quarterly_breakdown.map((item: any) => [item.quarter, item.amount.toString(), taxData.currency]),
      ];

      const csvContent = sections.map(row => 
        Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : row
      ).join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tax-report-${writerId}-${year}.csv"`,
        },
      });
    } else if (format === 'json') {
      return NextResponse.json({
        ...taxData,
        generated_at: new Date().toISOString(),
        report_type: 'Annual Tax Report',
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Use csv or json.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting tax report:', error);
    return NextResponse.json(
      { error: 'Failed to export tax report' },
      { status: 500 }
    );
  }
}