import { NextRequest, NextResponse } from 'next/server';

// Mock contests data
const mockContests = [
  {
    id: '1',
    title: 'Winter Writing Challenge 2024',
    description: 'Write a compelling winter-themed short story that captures the magic and mystery of the season.',
    rules: 'Stories must be between 1,000-5,000 words. Original content only. Must include winter theme.',
    theme: 'Winter Magic',
    genreRestrictions: ['Fantasy', 'Romance', 'Mystery'],
    wordLimitMin: 1000,
    wordLimitMax: 5000,
    registrationStartsAt: '2024-01-01T00:00:00Z',
    registrationEndsAt: '2024-01-15T23:59:59Z',
    contestStartsAt: '2024-01-16T00:00:00Z',
    contestEndsAt: '2024-02-15T23:59:59Z',
    judgingEndsAt: '2024-02-28T23:59:59Z',
    status: 'active',
    maxParticipants: 100,
    entryFee: 0,
    prizePool: 5000,
    prizeDistribution: [
      { position: 1, amount: 2500, percentage: 50 },
      { position: 2, amount: 1500, percentage: 30 },
      { position: 3, amount: 1000, percentage: 20 }
    ],
    organizer: {
      id: 'admin',
      displayName: 'Legato Team',
      avatar: '/api/placeholder/40/40'
    },
    judges: [
      { id: 'judge1', name: 'Sarah Mitchell', avatar: '/api/placeholder/40/40' },
      { id: 'judge2', name: 'David Chen', avatar: '/api/placeholder/40/40' }
    ],
    bannerUrl: '/api/placeholder/400/200',
    isFeatured: true,
    participantCount: 67,
    submissionCount: 45,
    isParticipating: true,
    userSubmission: {
      id: 'sub1',
      title: 'The Frozen Library',
      status: 'submitted',
      rank: 12,
      score: 8.5
    }
  },
  {
    id: '2',
    title: 'Flash Fiction Friday',
    description: 'Weekly flash fiction challenge - tell a complete story in under 500 words.',
    rules: 'Maximum 500 words. Any genre welcome. Must be complete story with beginning, middle, end.',
    wordLimitMax: 500,
    registrationStartsAt: '2024-01-19T00:00:00Z',
    registrationEndsAt: '2024-01-19T18:00:00Z',
    contestStartsAt: '2024-01-19T18:00:00Z',
    contestEndsAt: '2024-01-21T23:59:59Z',
    status: 'upcoming',
    entryFee: 0,
    prizePool: 1000,
    prizeDistribution: [
      { position: 1, amount: 500, percentage: 50 },
      { position: 2, amount: 300, percentage: 30 },
      { position: 3, amount: 200, percentage: 20 }
    ],
    organizer: {
      id: 'admin',
      displayName: 'Legato Team',
      avatar: '/api/placeholder/40/40'
    },
    isFeatured: false,
    participantCount: 23,
    submissionCount: 0,
    isParticipating: false
  },
  {
    id: '3',
    title: 'Romance Novel Competition',
    description: 'Write the opening chapter of your next great romance novel.',
    rules: 'First chapter only, 2,000-4,000 words. Must establish romantic tension and main characters.',
    theme: 'New Beginnings',
    genreRestrictions: ['Romance'],
    wordLimitMin: 2000,
    wordLimitMax: 4000,
    registrationStartsAt: '2023-12-01T00:00:00Z',
    registrationEndsAt: '2023-12-15T23:59:59Z',
    contestStartsAt: '2023-12-16T00:00:00Z',
    contestEndsAt: '2024-01-15T23:59:59Z',
    judgingEndsAt: '2024-01-30T23:59:59Z',
    status: 'completed',
    entryFee: 100,
    prizePool: 10000,
    prizeDistribution: [
      { position: 1, amount: 5000, percentage: 50 },
      { position: 2, amount: 3000, percentage: 30 },
      { position: 3, amount: 2000, percentage: 20 }
    ],
    organizer: {
      id: 'publisher1',
      displayName: 'Romance Publishers Inc',
      avatar: '/api/placeholder/40/40'
    },
    isFeatured: false,
    participantCount: 156,
    submissionCount: 142,
    isParticipating: false
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    // Filter contests based on parameters
    let filteredContests = mockContests;
    
    if (status !== 'all') {
      filteredContests = filteredContests.filter(contest => contest.status === status);
    }
    
    if (search) {
      filteredContests = filteredContests.filter(contest => 
        contest.title.toLowerCase().includes(search.toLowerCase()) ||
        contest.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // In production, this would call the community service API
    // const response = await fetch(`${process.env.COMMUNITY_SERVICE_URL}/contests?status=${status}&search=${search}`);
    
    return NextResponse.json({
      success: true,
      contests: filteredContests
    });
  } catch (error) {
    console.error('Contests API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contests' },
      { status: 500 }
    );
  }
}