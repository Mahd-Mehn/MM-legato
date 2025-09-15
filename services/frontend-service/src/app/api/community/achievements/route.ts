import { NextRequest, NextResponse } from 'next/server';

// Mock achievements data
const mockAchievements = [
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
  },
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
  },
  {
    id: '4',
    name: 'Reading Marathon',
    description: 'Read 50 chapters in a single day',
    type: 'reading',
    criteria: { target: 50, current: 23, metric: 'chapters read today' },
    points: 300,
    badgeColor: '#F59E0B',
    rarity: 'epic',
    isHidden: false,
    progress: 46
  },
  {
    id: '5',
    name: 'Legend',
    description: 'Reach 10,000 total points',
    type: 'milestone',
    criteria: { target: 10000, current: 2450, metric: 'total points' },
    points: 1000,
    badgeColor: '#EF4444',
    rarity: 'legendary',
    isHidden: false,
    progress: 24.5
  }
];

export async function GET(request: NextRequest) {
  try {
    // In production, this would call the community service API
    // const response = await fetch(`${process.env.COMMUNITY_SERVICE_URL}/achievements`);
    
    return NextResponse.json({
      success: true,
      achievements: mockAchievements
    });
  } catch (error) {
    console.error('Achievements API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}