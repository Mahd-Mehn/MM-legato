import { NextRequest, NextResponse } from 'next/server';

// Mock rewards data
const mockRewards = [
  {
    id: '1',
    type: 'daily_login',
    title: 'Daily Login Bonus',
    description: 'Login every day to earn coins',
    coinAmount: 50,
    isAvailable: true,
    icon: 'calendar',
    rarity: 'common',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  },
  {
    id: '2',
    type: 'writing_streak',
    title: '7-Day Writing Streak',
    description: 'Write for 7 consecutive days',
    coinAmount: 200,
    bonusMultiplier: 1.5,
    requirements: { streak: 7, current: 5 },
    isAvailable: true,
    icon: 'star',
    rarity: 'rare'
  },
  {
    id: '3',
    type: 'achievement_bonus',
    title: 'Achievement Unlocked Bonus',
    description: 'Bonus coins for unlocking "Community Helper"',
    coinAmount: 100,
    isAvailable: true,
    icon: 'award',
    rarity: 'common',
    claimedAt: '2024-01-15T10:30:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    // In production, this would call the community service API
    // const response = await fetch(`${process.env.COMMUNITY_SERVICE_URL}/rewards`);
    
    return NextResponse.json({
      success: true,
      rewards: mockRewards
    });
  } catch (error) {
    console.error('Rewards API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}