import { NextRequest, NextResponse } from 'next/server';

interface ActivityItem {
  id: string;
  type: 'story_published' | 'story_updated' | 'user_followed' | 'story_liked' | 'story_commented' | 'achievement_earned';
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  story?: {
    id: string;
    title: string;
    coverImage?: string;
    genre: string[];
  };
  targetUser?: {
    id: string;
    username: string;
    displayName: string;
  };
  achievement?: {
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  content: string;
  timestamp: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked: boolean;
  isBookmarked: boolean;
}

// Mock activity feed data
const mockActivityItems: ActivityItem[] = [
  {
    id: '1',
    type: 'story_published',
    user: {
      id: '1',
      username: 'alice_writer',
      displayName: 'Alice Johnson',
      avatar: '/api/placeholder/40/40'
    },
    story: {
      id: 'story1',
      title: 'The Enchanted Forest',
      coverImage: '/api/placeholder/300/400',
      genre: ['Fantasy', 'Adventure']
    },
    content: 'Just published a new story! Dive into a magical world where ancient trees hold secrets and mystical creatures roam free.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    engagement: {
      likes: 24,
      comments: 8,
      shares: 3
    },
    isLiked: false,
    isBookmarked: true
  },
  {
    id: '2',
    type: 'story_updated',
    user: {
      id: '4',
      username: 'fantasy_master',
      displayName: 'David Wilson',
      avatar: '/api/placeholder/40/40'
    },
    story: {
      id: 'story3',
      title: 'Dragon\'s Quest',
      coverImage: '/api/placeholder/300/400',
      genre: ['Fantasy', 'Epic']
    },
    content: 'Chapter 5 is now live! The dragon awakens and our heroes face their greatest challenge yet. What will happen next?',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    engagement: {
      likes: 45,
      comments: 12,
      shares: 7
    },
    isLiked: true,
    isBookmarked: false
  },
  {
    id: '3',
    type: 'user_followed',
    user: {
      id: '2',
      username: 'bookworm_bob',
      displayName: 'Bob Smith',
      avatar: '/api/placeholder/40/40'
    },
    targetUser: {
      id: '5',
      username: 'sci_fi_queen',
      displayName: 'Emma Davis'
    },
    content: 'Started following Emma Davis for her amazing sci-fi stories!',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    engagement: {
      likes: 12,
      comments: 2,
      shares: 1
    },
    isLiked: false,
    isBookmarked: false
  },
  {
    id: '4',
    type: 'achievement_earned',
    user: {
      id: '3',
      username: 'story_lover',
      displayName: 'Sarah Chen',
      avatar: '/api/placeholder/40/40'
    },
    achievement: {
      id: 'first_1k_reads',
      name: 'Rising Star',
      description: 'Reached 1,000 total reads',
      icon: '⭐'
    },
    content: 'Just earned the "Rising Star" achievement! Thank you to all my readers for the amazing support!',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    engagement: {
      likes: 67,
      comments: 15,
      shares: 4
    },
    isLiked: true,
    isBookmarked: false
  },
  {
    id: '5',
    type: 'story_commented',
    user: {
      id: '5',
      username: 'sci_fi_queen',
      displayName: 'Emma Davis',
      avatar: '/api/placeholder/40/40'
    },
    story: {
      id: 'story2',
      title: 'Mystery of the Lost City',
      coverImage: '/api/placeholder/300/400',
      genre: ['Mystery', 'Thriller']
    },
    content: 'Left a thoughtful review on "Mystery of the Lost City" - the plot twists in this story are incredible!',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    engagement: {
      likes: 18,
      comments: 5,
      shares: 2
    },
    isLiked: false,
    isBookmarked: false
  },
  {
    id: '6',
    type: 'story_liked',
    user: {
      id: '6',
      username: 'mystery_writer',
      displayName: 'James Brown',
      avatar: '/api/placeholder/40/40'
    },
    story: {
      id: 'story4',
      title: 'Shadows in the Night',
      coverImage: '/api/placeholder/300/400',
      genre: ['Mystery', 'Suspense']
    },
    content: 'Really enjoyed reading "Shadows in the Night" - the atmosphere and character development are top-notch!',
    timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000), // 16 hours ago
    engagement: {
      likes: 31,
      comments: 7,
      shares: 3
    },
    isLiked: false,
    isBookmarked: true
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    let filteredItems = mockActivityItems;

    // Filter by type if specified
    if (type) {
      filteredItems = filteredItems.filter(item => item.type === type);
    }

    // Filter by user if specified (for user-specific feeds)
    if (userId) {
      filteredItems = filteredItems.filter(item => item.user.id === userId);
    }

    // Sort by timestamp (most recent first)
    filteredItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    return NextResponse.json({
      activities: paginatedItems,
      pagination: {
        page,
        limit,
        total: filteredItems.length,
        hasMore: endIndex < filteredItems.length
      }
    });
  } catch (error) {
    console.error('Get activity feed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { activityId, action } = await request.json();

    if (!activityId || !action) {
      return NextResponse.json(
        { error: 'Activity ID and action are required' },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    switch (action) {
      case 'like':
        return NextResponse.json({
          success: true,
          message: 'Activity liked',
          isLiked: true,
          likesCount: 25
        });
      
      case 'unlike':
        return NextResponse.json({
          success: true,
          message: 'Activity unliked',
          isLiked: false,
          likesCount: 23
        });
      
      case 'bookmark':
        return NextResponse.json({
          success: true,
          message: 'Activity bookmarked',
          isBookmarked: true
        });
      
      case 'unbookmark':
        return NextResponse.json({
          success: true,
          message: 'Activity unbookmarked',
          isBookmarked: false
        });
      
      case 'share':
        return NextResponse.json({
          success: true,
          message: 'Activity shared',
          sharesCount: 4
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Activity action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}