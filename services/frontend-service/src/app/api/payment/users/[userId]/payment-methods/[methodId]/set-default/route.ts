import { NextRequest, NextResponse } from 'next/server';

// Mock payment methods storage
const mockPaymentMethods: { [key: string]: any[] } = {};

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string; methodId: string } }
) {
  try {
    const { userId, methodId } = params;

    // In production, this would update via the payment service
    if (mockPaymentMethods[userId]) {
      // Set all methods to non-default
      mockPaymentMethods[userId].forEach(method => {
        method.is_default = false;
      });

      // Set the specified method as default
      const method = mockPaymentMethods[userId].find(method => method.id === methodId);
      if (method) {
        method.is_default = true;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json(
      { error: 'Failed to set default payment method' },
      { status: 500 }
    );
  }
}