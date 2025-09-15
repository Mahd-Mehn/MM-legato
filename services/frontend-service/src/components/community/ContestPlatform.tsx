'use client';

import { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, DollarSign, Clock, Star, Award, Target, Flag, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';

interface Contest {
  id: string;
  title: string;
  description: string;
  rules: string;
  theme?: string;
  genreRestrictions?: string[];
  wordLimitMin?: number;
  wordLimitMax?: number;
  registrationStartsAt: string;
  registrationEndsAt: string;
  contestStartsAt: string;
  contestEndsAt: string;
  judgingEndsAt?: string;
  status: 'draft' | 'upcoming' | 'active' | 'judging' | 'completed' | 'cancelled';
  maxParticipants?: number;
  entryFee: number;
  prizePool: number;
  prizeDistribution?: { position: number; amount: number; percentage: number }[];
  organizer: {
    id: string;
    displayName: string;
    avatar: string;
  };
  judges?: { id: string; name: string; avatar: string }[];
  bannerUrl?: string;
  isFeatured: boolean;
  participantCount: number;
  submissionCount: number;
  isParticipating: boolean;
  userSubmission?: {
    id: string;
    title: string;
    status: 'draft' | 'submitted' | 'judged';
    rank?: number;
    score?: number;
  };
}

interface ContestPlatformProps {
  className?: string;
}

export function ContestPlatform({ className = '' }: ContestPlatformProps) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const statusFilters = [
    { id: 'all', name: 'All Contests', color: 'gray' },
    { id: 'upcoming', name: 'Upcoming', color: 'blue' },
    { id: 'active', name: 'Active', color: 'green' },
    { id: 'judging', name: 'Judging', color: 'yellow' },
    { id: 'completed', name: 'Completed', color: 'purple' }
  ];

  useEffect(() => {
    fetchContests();
  }, [filterStatus, searchQuery]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: filterStatus,
        search: searchQuery
      });
      
      const response = await fetch(`/api/community/contests?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContests(data.contests);
      }
    } catch (error) {
      console.error('Failed to fetch contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinContest = async (contestId: string) => {
    try {
      const response = await fetch(`/api/community/contests/${contestId}/join`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Refresh contests to update participation status
        fetchContests();
      }
    } catch (error) {
      console.error('Failed to join contest:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'blue';
      case 'active': return 'green';
      case 'judging': return 'yellow';
      case 'completed': return 'purple';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return Calendar;
      case 'active': return Trophy;
      case 'judging': return Star;
      case 'completed': return Award;
      case 'cancelled': return Flag;
      default: return Clock;
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const filteredContests = contests.filter(contest => {
    if (filterStatus !== 'all' && contest.status !== filterStatus) return false;
    if (searchQuery && !contest.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (selectedContest) {
    return <ContestDetails contest={selectedContest} onBack={() => setSelectedContest(null)} />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Writing Contests & Challenges
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Compete with fellow writers, win prizes, and showcase your talent
        </p>
      </div>

      {/* Featured Contest Banner */}
      {contests.find(c => c.isFeatured && c.status === 'active') && (
        <Card className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="relative p-6">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-sm font-medium">Featured Contest</span>
            </div>
            <h3 className="text-xl font-bold mb-2">
              {contests.find(c => c.isFeatured && c.status === 'active')?.title}
            </h3>
            <p className="text-white/90 mb-4">
              {contests.find(c => c.isFeatured && c.status === 'active')?.description}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{contests.find(c => c.isFeatured && c.status === 'active')?.prizePool} coins prize pool</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{contests.find(c => c.isFeatured && c.status === 'active')?.participantCount} participants</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{getTimeRemaining(contests.find(c => c.isFeatured && c.status === 'active')?.contestEndsAt || '')}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search contests..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Create Contest
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setFilterStatus(filter.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === filter.id
                ? `bg-${filter.color}-100 dark:bg-${filter.color}-900 text-${filter.color}-700 dark:text-${filter.color}-300`
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {filter.name}
          </button>
        ))}
      </div>

      {/* Contests Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading contests...</p>
        </div>
      ) : filteredContests.length === 0 ? (
        <Card className="p-8 text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No contests found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Be the first to create a writing contest!
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Contest
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map(contest => {
            const StatusIcon = getStatusIcon(contest.status);
            const statusColor = getStatusColor(contest.status);
            
            return (
              <motion.div
                key={contest.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className="h-full cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setSelectedContest(contest)}
                >
                  {contest.bannerUrl && (
                    <div className="h-32 bg-cover bg-center rounded-t-lg" 
                         style={{ backgroundImage: `url(${contest.bannerUrl})` }}>
                      <div className="h-full bg-black bg-opacity-40 rounded-t-lg flex items-end p-4">
                        <div className={`px-2 py-1 rounded text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900 dark:text-${statusColor}-200`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    {!contest.bannerUrl && (
                      <div className="flex items-center justify-between mb-3">
                        <div className={`px-2 py-1 rounded text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900 dark:text-${statusColor}-200`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
                        </div>
                        {contest.isFeatured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    )}
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {contest.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {contest.description}
                    </p>
                    
                    {contest.theme && (
                      <div className="mb-3">
                        <span className="inline-block bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">
                          Theme: {contest.theme}
                        </span>
                      </div>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <DollarSign className="w-3 h-3" />
                          <span>Prize Pool</span>
                        </div>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {contest.prizePool.toLocaleString()} coins
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Users className="w-3 h-3" />
                          <span>Participants</span>
                        </div>
                        <span className="font-medium">
                          {contest.participantCount}
                          {contest.maxParticipants && ` / ${contest.maxParticipants}`}
                        </span>
                      </div>
                      
                      {contest.status === 'active' && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>Time Left</span>
                          </div>
                          <span className="font-medium text-orange-600 dark:text-orange-400">
                            {getTimeRemaining(contest.contestEndsAt)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {contest.isParticipating ? (
                        <div className="flex-1">
                          {contest.userSubmission ? (
                            <div className="text-center">
                              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                ✓ Submitted: {contest.userSubmission.title}
                              </div>
                              {contest.userSubmission.rank && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Rank: #{contest.userSubmission.rank}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" className="w-full">
                              Submit Entry
                            </Button>
                          )}
                        </div>
                      ) : contest.status === 'upcoming' || contest.status === 'active' ? (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinContest(contest.id);
                          }}
                        >
                          Join Contest
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="flex-1">
                          View Results
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Contest Details Component
function ContestDetails({ contest, onBack }: { contest: Contest; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          ← Back to Contests
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {contest.title}
        </h1>
      </div>
      
      {/* Contest details implementation */}
      <Card className="p-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {contest.description}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contest Rules</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {contest.rules}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Prize Distribution</h3>
            {contest.prizeDistribution?.map((prize, index) => (
              <div key={index} className="flex justify-between text-sm mb-1">
                <span>#{prize.position}</span>
                <span className="font-medium">{prize.amount} coins ({prize.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}