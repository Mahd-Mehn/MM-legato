import { NextRequest, NextResponse } from 'next/server';

// Mock data for development - in production this would come from the payment service
const mockCoinPackages = [
  {
    id: 'starter-pack',
    name: 'Starter Pack',
    coin_amount: 100,
    base_price_usd: 4.99,
    bonus_percentage: 0,
    total_coins: 100,
    price_in_currency: {
      USD: 4.99,
      NGN: 3743.25,
      CAD: 6.74,
    },
    is_active: true,
    description: 'Perfect for trying out premium content',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'popular-pack',
    name: 'Popular Pack',
    coin_amount: 500,
    base_price_usd: 19.99,
    bonus_percentage: 10,
    total_coins: 550,
    price_in_currency: {
      USD: 19.99,
      NGN: 14992.50,
      CAD: 26.99,
    },
    is_active: true,
    description: 'Most popular choice with bonus coins',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'premium-pack',
    name: 'Premium Pack',
    coin_amount: 1000,
    base_price_usd: 34.99,
    bonus_percentage: 15,
    total_coins: 1150,
    price_in_currency: {
      USD: 34.99,
      NGN: 26242.50,
      CAD: 47.24,
    },
    is_active: true,
    description: 'Great value with 15% bonus coins',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mega-pack',
    name: 'Mega Pack',
    coin_amount: 2500,
    base_price_usd: 79.99,
    bonus_percentage: 20,
    total_coins: 3000,
    price_in_currency: {
      USD: 79.99,
      NGN: 59992.50,
      CAD: 107.99,
    },
    is_active: true,
    description: 'Best value with maximum bonus coins',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') !== 'false';

    let packages = mockCoinPackages;
    
    if (activeOnly) {
      packages = packages.filter(pkg => pkg.is_active);
    }

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching coin packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In production, this would create a new coin package via the payment service
    const newPackage = {
      id: `package-${Date.now()}`,
      ...body,
      total_coins: body.coin_amount + Math.floor(body.coin_amount * (body.bonus_percentage / 100)),
      price_in_currency: {
        USD: body.base_price_usd,
        NGN: body.base_price_usd * 750, // Mock exchange rate
        CAD: body.base_price_usd * 1.35, // Mock exchange rate
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    console.error('Error creating coin package:', error);
    return NextResponse.json(
      { error: 'Failed to create coin package' },
      { status: 500 }
    );
  }
}