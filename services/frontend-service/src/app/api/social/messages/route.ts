import { NextRequest, NextResponse } from 'next/server';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  read: boolean;
  edited?: boolean;
  editedAt?: Date;
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: Date;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mock conversations data
const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    participants: [
      {
        id: 'current_user',
        username: 'current_user',
        displayName: 'You',
        avatar: '/api/placeholder/40/40',
        isOnline: true
      },
      {
        id: '1',
        username: 'alice_writer',
        displayName: 'Alice Johnson',
        avatar: '/api/placeholder/40/40',
        isOnline: true,
        lastSeen: new Date()
      }
    ],
    lastMessage: {
      id: 'msg1',
      conversationId: 'conv1',
      senderId: '1',
      receiverId: 'current_user',
      content: 'Thanks for the feedback on my latest story! I really appreciate your insights.',
      type: 'text',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false
    },
    unreadCount: 2,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: 'conv2',
    participants: [
      {
        id: 'current_user',
        username: 'current_user',
        displayName: 'You',
        avatar: '/api/placeholder/40/40',
        isOnline: true
      },
      {
        id: '4',
        username: 'fantasy_master',
        displayName: 'David Wilson',
        avatar: '/api/placeholder/40/40',
        isOnline: false,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    ],
    lastMessage: {
      id: 'msg2',
      conversationId: 'conv2',
      senderId: 'current_user',
      receiverId: '4',
      content: 'Looking forward to the next chapter of Dragon\'s Quest!',
      type: 'text',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'conv3',
    participants: [
      {
        id: 'current_user',
        username: 'current_user',
        displayName: 'You',
        avatar: '/api/placeholder/40/40',
        isOnline: true
      },
      {
        id: '5',
        username: 'sci_fi_queen',
        displayName: 'Emma Davis',
        avatar: '/api/placeholder/40/40',
        isOnline: false,
        lastSeen: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ],
    lastMessage: {
      id: 'msg3',
      conversationId: 'conv3',
      senderId: '5',
      receiverId: 'current_user',
      content: 'Would you be interested in collaborating on a sci-fi anthology?',
      type: 'text',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: true
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  }
];

// Mock messages for a conversation
const mockMessages: { [conversationId: string]: Message[] } = {
  conv1: [
    {
      id: 'msg1-1',
      conversationId: 'conv1',
      senderId: 'current_user',
      receiverId: '1',
      content: 'Hi Alice! I just finished reading your latest chapter. The character development is really impressive!',
      type: 'text',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true
    },
    {
      id: 'msg1-2',
      conversationId: 'conv1',
      senderId: '1',
      receiverId: 'current_user',
      content: 'Thank you so much! That means a lot coming from you. I\'ve been working really hard on making the characters feel more authentic.',
      type: 'text',
      timestamp: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
      read: true
    },
    {
      id: 'msg1-3',
      conversationId: 'conv1',
      senderId: 'current_user',
      receiverId: '1',
      content: 'You\'re definitely succeeding! The dialogue feels natural and the emotional beats hit perfectly.',
      type: 'text',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      read: true
    },
    {
      id: 'msg1-4',
      conversationId: 'conv1',
      senderId: '1',
      receiverId: 'current_user',
      content: 'Thanks for the feedback on my latest story! I really appreciate your insights.',
      type: 'text',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = mockMessages[conversationId] || [];
      
      // Sort by timestamp (oldest first for messages)
      const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMessages = sortedMessages.slice(startIndex, endIndex);

      return NextResponse.json({
        messages: paginatedMessages,
        pagination: {
          page,
          limit,
          total: sortedMessages.length,
          hasMore: endIndex < sortedMessages.length
        }
      });
    } else {
      // Get all conversations
      const sortedConversations = mockConversations.sort((a, b) => 
        b.updatedAt.getTime() - a.updatedAt.getTime()
      );

      const totalUnread = sortedConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

      return NextResponse.json({
        conversations: sortedConversations,
        totalUnread
      });
    }
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, receiverId, content, type = 'text' } = await request.json();

    if (!content || (!conversationId && !receiverId)) {
      return NextResponse.json(
        { error: 'Content and either conversationId or receiverId are required' },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      conversationId: conversationId || `conv_${Date.now()}`,
      senderId: 'current_user',
      receiverId: receiverId || 'unknown',
      content,
      type,
      timestamp: new Date(),
      read: false
    };

    return NextResponse.json({
      success: true,
      message: newMessage,
      conversationId: newMessage.conversationId
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { conversationId, action, messageIds } = await request.json();

    if (!conversationId || !action) {
      return NextResponse.json(
        { error: 'Conversation ID and action are required' },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    switch (action) {
      case 'mark_read':
        return NextResponse.json({
          success: true,
          message: 'Messages marked as read',
          unreadCount: 0
        });
      
      case 'delete_messages':
        if (!messageIds || !Array.isArray(messageIds)) {
          return NextResponse.json(
            { error: 'Message IDs array is required for delete action' },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          message: `Deleted ${messageIds.length} messages`,
          deletedCount: messageIds.length
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Update messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}