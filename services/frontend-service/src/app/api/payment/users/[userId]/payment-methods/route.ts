import { NextRequest, NextResponse } from 'next/server';

// Mock payment methods for development
const mockPaymentMethods: { [key: string]: any[] } = {
  'user-1': [
    {
      id: 'pm-1',
      type: 'card',
      last4: '4242',
      brand: 'visa',
      exp_month: 12,
      exp_year: 2025,
      is_default: true,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'pm-2',
      type: 'paypal',
      email: 'user@example.com',
      is_default: false,
      created_at: '2024-01-05T00:00:00Z',
    },
  ],
  'user-2': [
    {
      id: 'pm-3',
      type: 'card',
      last4: '1234',
      brand: 'mastercard',
      exp_month: 8,
      exp_year: 2026,
      is_default: true,
      created_at: '2024-01-10T00:00:00Z',
    },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // In production, this would fetch from the payment service
    const paymentMethods = mockPaymentMethods[userId] || [];

    return NextResponse.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();

    // In production, this would create a payment method via the payment service
    const newPaymentMethod = {
      id: `pm-${Date.now()}`,
      type: body.type,
      is_default: false,
      created_at: new Date().toISOString(),
    };

    // Add type-specific fields
    if (body.type === 'card') {
      Object.assign(newPaymentMethod, {
        last4: body.card_number.slice(-4),
        brand: getBrandFromCardNumber(body.card_number),
        exp_month: body.exp_month,
        exp_year: body.exp_year,
      });
    } else if (body.type === 'paypal') {
      Object.assign(newPaymentMethod, {
        email: body.email,
      });
    } else if (body.type === 'crypto') {
      Object.assign(newPaymentMethod, {
        wallet_type: 'Bitcoin',
      });
    }

    // Add to mock storage
    if (!mockPaymentMethods[userId]) {
      mockPaymentMethods[userId] = [];
    }
    mockPaymentMethods[userId].push(newPaymentMethod);

    return NextResponse.json(newPaymentMethod, { status: 201 });
  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    );
  }
}

function getBrandFromCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (cleanNumber.startsWith('4')) return 'visa';
  if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'mastercard';
  if (cleanNumber.startsWith('3')) return 'amex';
  return 'unknown';
}