import { NextRequest, NextResponse } from 'next/server';

// Mock data for development
const mockFollowData = {
  success: true,
  message: 'Successfully followed user',
  followingCount: 125,
  isFollowing: true
};

const mockUnfollowData = {
  success: true,
  message: 'Successfully unfollowed user',
  followingCount: 124,
  isFollowing: false
};

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (action === 'follow') {
      return NextResponse.json(mockFollowData);
    } else if (action === 'unfollow') {
      return NextResponse.json(mockUnfollowData);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "follow" or "unfollow"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Follow API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'followers' | 'following'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Mock followers/following data
    const mockUsers = [
      {
        id: '1',
        username: 'alice_writer',
        displayName: 'Alice Johnson',
        avatar: '/api/placeholder/40/40',
        isFollowing: true,
        isFollower: true,
        mutualFollowers: 12,
        lastActive: '2 hours ago',
        bio: 'Fantasy writer and storyteller'
      },
      {
        id: '2',
        username: 'bookworm_bob',
        displayName: 'Bob Smith',
        avatar: '/api/placeholder/40/40',
        isFollowing: false,
        isFollower: true,
        mutualFollowers: 5,
        lastActive: '1 day ago',
        bio: 'Avid reader and book reviewer'
      },
      {
        id: '3',
        username: 'story_lover',
        displayName: 'Sarah Chen',
        avatar: '/api/placeholder/40/40',
        isFollowing: true,
        isFollower: true,
        mutualFollowers: 23,
        lastActive: '3 hours ago',
        bio: 'Romance and drama enthusiast'
      }
    ];

    return NextResponse.json({
      users: mockUsers,
      total: mockUsers.length,
      hasMore: false
    });
  } catch (error) {
    console.error('Get follow data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}