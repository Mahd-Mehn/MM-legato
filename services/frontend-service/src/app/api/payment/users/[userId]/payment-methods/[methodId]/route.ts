import { NextRequest, NextResponse } from 'next/server';

// Import mock data from parent route
const mockPaymentMethods: { [key: string]: any[] } = {};

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; methodId: string } }
) {
  try {
    const { userId, methodId } = params;

    // In production, this would delete via the payment service
    if (mockPaymentMethods[userId]) {
      const index = mockPaymentMethods[userId].findIndex(method => method.id === methodId);
      if (index !== -1) {
        mockPaymentMethods[userId].splice(index, 1);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string; methodId: string } }
) {
  try {
    const { userId, methodId } = params;
    const body = await request.json();

    // In production, this would update via the payment service
    if (mockPaymentMethods[userId]) {
      const method = mockPaymentMethods[userId].find(method => method.id === methodId);
      if (method) {
        Object.assign(method, body);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}