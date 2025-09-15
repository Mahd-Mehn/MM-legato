import { NextRequest, NextResponse } from 'next/server';

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'story_update' | 'message';
  title: string;
  message: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  story?: {
    id: string;
    title: string;
  };
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'follow',
    title: 'New Follower',
    message: 'Alice Johnson started following you',
    user: {
      id: '1',
      username: 'alice_writer',
      displayName: 'Alice Johnson',
      avatar: '/api/placeholder/40/40'
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    actionUrl: '/profile/alice_writer'
  },
  {
    id: '2',
    type: 'like',
    title: 'Story Liked',
    message: 'Bob Smith liked your story "The Enchanted Forest"',
    user: {
      id: '2',
      username: 'bookworm_bob',
      displayName: 'Bob Smith',
      avatar: '/api/placeholder/40/40'
    },
    story: {
      id: 'story1',
      title: 'The Enchanted Forest'
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: false,
    actionUrl: '/stories/story1'
  },
  {
    id: '3',
    type: 'comment',
    title: 'New Comment',
    message: 'Sarah Chen commented on your story "Mystery of the Lost City"',
    user: {
      id: '3',
      username: 'story_lover',
      displayName: 'Sarah Chen',
      avatar: '/api/placeholder/40/40'
    },
    story: {
      id: 'story2',
      title: 'Mystery of the Lost City'
    },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    read: true,
    actionUrl: '/stories/story2#comments'
  },
  {
    id: '4',
    type: 'story_update',
    title: 'Story Update',
    message: 'David Wilson published a new chapter in "Dragon\'s Quest"',
    user: {
      id: '4',
      username: 'fantasy_master',
      displayName: 'David Wilson',
      avatar: '/api/placeholder/40/40'
    },
    story: {
      id: 'story3',
      title: 'Dragon\'s Quest'
    },
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    read: true,
    actionUrl: '/stories/story3/chapter/5'
  },
  {
    id: '5',
    type: 'message',
    title: 'New Message',
    message: 'Emma Davis sent you a message',
    user: {
      id: '5',
      username: 'sci_fi_queen',
      displayName: 'Emma Davis',
      avatar: '/api/placeholder/40/40'
    },
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    read: false,
    actionUrl: '/messages/5'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');

    let filteredNotifications = mockNotifications;

    // Filter by type if specified
    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }

    // Filter by unread if specified
    if (unreadOnly) {
      filteredNotifications = filteredNotifications.filter(n => !n.read);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    const unreadCount = mockNotifications.filter(n => !n.read).length;

    return NextResponse.json({
      notifications: paginatedNotifications,
      pagination: {
        page,
        limit,
        total: filteredNotifications.length,
        hasMore: endIndex < filteredNotifications.length
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { notificationIds, action } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    if (action === 'mark_read') {
      // Simulate marking notifications as read
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return NextResponse.json({
        success: true,
        message: `Marked ${notificationIds.length} notifications as read`,
        updatedCount: notificationIds.length
      });
    } else if (action === 'mark_unread') {
      // Simulate marking notifications as unread
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return NextResponse.json({
        success: true,
        message: `Marked ${notificationIds.length} notifications as unread`,
        updatedCount: notificationIds.length
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "mark_read" or "mark_unread"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    // Simulate deleting notifications
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json({
      success: true,
      message: `Deleted ${notificationIds.length} notifications`,
      deletedCount: notificationIds.length
    });
  } catch (error) {
    console.error('Delete notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}