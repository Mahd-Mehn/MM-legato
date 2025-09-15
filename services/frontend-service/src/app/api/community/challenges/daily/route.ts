import { NextRequest, NextResponse } from 'next/server';

// Mock daily challenges data
const mockChallenges = [
  {
    id: '1',
    title: 'Write 500 Words',
    description: 'Write at least 500 words today',
    type: 'write',
    target: 500,
    current: 234,
    coinReward: 100,
    isCompleted: false,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString() // End of today
  },
  {
    id: '2',
    title: 'Read 5 Chapters',
    description: 'Read 5 chapters from any story',
    type: 'read',
    target: 5,
    current: 3,
    coinReward: 75,
    isCompleted: false,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
  },
  {
    id: '3',
    title: 'Leave 3 Comments',
    description: 'Leave helpful comments on 3 different stories',
    type: 'engage',
    target: 3,
    current: 3,
    coinReward: 50,
    isCompleted: true,
    completedAt: new Date().toISOString(),
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
  },
  {
    id: '4',
    title: 'Share a Story',
    description: 'Share a story on social media',
    type: 'social',
    target: 1,
    current: 0,
    coinReward: 25,
    isCompleted: false,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    // In production, this would call the community service API
    // const response = await fetch(`${process.env.COMMUNITY_SERVICE_URL}/challenges/daily`);
    
    return NextResponse.json({
      success: true,
      challenges: mockChallenges
    });
  } catch (error) {
    console.error('Daily challenges API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch daily challenges' },
      { status: 500 }
    );
  }
}