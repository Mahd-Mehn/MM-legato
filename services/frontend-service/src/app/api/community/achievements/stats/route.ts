import { NextRequest, NextResponse } from 'next/server';

// Mock user achievement stats
const mockStats = {
  totalEarned: 3,
  totalPoints: 2450,
  totalPossible: 15,
  recentEarned: [
    {
      id: '1',
      name: 'First Story',
      description: 'Publish your first story on Legato',
      type: 'writing',
      criteria: { target: 1, current: 1, metric: 'stories published' },
      points: 100,
      badgeColor: '#3B82F6',
      rarity: 'common',
      isHidden: false,
      earnedAt: '2024-01-15T10:30:00Z',
      progress: 100
    }
  ],
  nextToEarn: [
    {
      id: '2',
      name: 'Prolific Writer',
      description: 'Publish 10 stories',
      type: 'writing',
      criteria: { target: 10, current: 3, metric: 'stories published' },
      points: 500,
      badgeColor: '#8B5CF6',
      rarity: 'rare',
      isHidden: false,
      progress: 30
    },
    {
      id: '3',
      name: 'Community Helper',
      description: 'Receive 100 likes on your comments',
      type: 'community',
      criteria: { target: 100, current: 45, metric: 'comment likes' },
      points: 250,
      badgeColor: '#10B981',
      rarity: 'common',
      isHidden: false,
      progress: 45
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    // In production, this would call the community service API
    // const response = await fetch(`${process.env.COMMUNITY_SERVICE_URL}/achievements/stats`);
    
    return NextResponse.json({
      success: true,
      ...mockStats
    });
  } catch (error) {
    console.error('Achievement stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch achievement stats' },
      { status: 500 }
    );
  }
}