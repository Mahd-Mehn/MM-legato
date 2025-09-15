import { NextRequest, NextResponse } from 'next/server';

// Mock coin stats data
const mockCoinStats = {
  totalCoins: 2450,
  todayEarned: 150,
  weeklyEarned: 680,
  monthlyEarned: 2100,
  lifetimeEarned: 5670,
  currentStreak: 7,
  longestStreak: 15,
  pendingRewards: 3
};

export async function GET(request: NextRequest) {
  try {
    // In production, this would call the community service API
    // const response = await fetch(`${process.env.COMMUNITY_SERVICE_URL}/coins/stats`);
    
    return NextResponse.json({
      success: true,
      ...mockCoinStats
    });
  } catch (error) {
    console.error('Coin stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coin stats' },
      { status: 500 }
    );
  }
}