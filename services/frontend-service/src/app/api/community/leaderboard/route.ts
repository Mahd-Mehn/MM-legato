import { NextRequest, NextResponse } from 'next/server';

// Mock data for development - replace with actual API calls to community service
const mockLeaderboardData = {
  writers: [
    {
      id: '1',
      user: {
        id: '1',
        username: 'storyteller_jane',
        displayName: 'Jane Smith',
        avatar: '/api/placeholder/40/40',
        verified: true
      },
      rank: 1,
      score: 25,
      change: 2,
      data: { storiesPublished: 25, chaptersPublished: 150 }
    },
    {
      id: '2',
      user: {
        id: '2',
        username: 'writer_mike',
        displayName: 'Mike Johnson',
        avatar: '/api/placeholder/40/40',
        verified: false
      },
      rank: 2,
      score: 18,
      change: -1,
      data: { storiesPublished: 18, chaptersPublished: 95 }
    },
    {
      id: '3',
      user: {
        id: '3',
        username: 'creative_sarah',
        displayName: 'Sarah Wilson',
        avatar: '/api/placeholder/40/40',
        verified: true
      },
      rank: 3,
      score: 15,
      change: 1,
      data: { storiesPublished: 15, chaptersPublished: 78 }
    }
  ],
  readers: [
    {
      id: '4',
      user: {
        id: '4',
        username: 'bookworm_alex',
        displayName: 'Alex Chen',
        avatar: '/api/placeholder/40/40',
        verified: false
      },
      rank: 1,
      score: 342,
      change: 0,
      data: { chaptersRead: 342, storiesCompleted: 45 }
    }
  ],
  community: [
    {
      id: '5',
      user: {
        id: '5',
        username: 'helpful_emma',
        displayName: 'Emma Davis',
        avatar: '/api/placeholder/40/40',
        verified: true
      },
      rank: 1,
      score: 156,
      change: 3,
      data: { commentsPosted: 156, likesReceived: 892 }
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'writers';
    const period = searchParams.get('period') || 'monthly';

    // In production, this would call the community service API
    // const response = await fetch(`${process.env.COMMUNITY_SERVICE_URL}/leaderboard?category=${category}&period=${period}`);
    
    const entries = mockLeaderboardData[category as keyof typeof mockLeaderboardData] || [];
    
    // Mock user rank (would come from authenticated user context)
    const userRank = entries.find(entry => entry.user.id === '1') || null;

    return NextResponse.json({
      success: true,
      entries,
      userRank,
      category,
      period
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}