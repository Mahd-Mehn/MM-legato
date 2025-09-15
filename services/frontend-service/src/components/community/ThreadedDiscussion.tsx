'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Flag, Reply, MoreHorizontal, Pin, Lock } from 'lucide-react';
import {UserReputationBadge} from './UserReputationBadge';
import {ReplyComposer} from './ReplyComposer';
import {ModerationActions} from './ModerationActions';
import Button from '../Button';
import Card from '../Card';

interface Reply {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    reputation: number;
    badges: string[];
  };
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  dislikes: number;
  userVote?: 'like' | 'dislike';
  parentId?: string;
  replies: Reply[];
  isEdited: boolean;
  isDeleted: boolean;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    reputation: number;
    badges: string[];
  };
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  replyCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
}

interface ThreadedDiscussionProps {
  topic: Topic;
  onBack: () => void;
  onReport: (topicId: string, reason: string) => void;
}

export function ThreadedDiscussion({ topic, onBack, onReport }: ThreadedDiscussionProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showModerationMenu, setShowModerationMenu] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');

  useEffect(() => {
    fetchReplies();
    incrementViewCount();
  }, [topic.id, sortBy]);

  const fetchReplies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/community/topics/${topic.id}/replies?sort=${sortBy}`);
      if (response.ok) {
        const data = await response.json();
        setReplies(data.replies);
      }
    } catch (error) {
      console.error('Failed to fetch replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await fetch(`/api/community/topics/${topic.id}/view`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  };

  const handleVote = async (replyId: string, voteType: 'like' | 'dislike') => {
    try {
      const response = await fetch(`/api/community/replies/${replyId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType })
      });

      if (response.ok) {
        const updatedReply = await response.json();
        setReplies(prev => updateReplyInTree(prev, replyId, updatedReply));
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleReply = async (content: string, parentId?: string) => {
    try {
      const response = await fetch(`/api/community/topics/${topic.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId })
      });

      if (response.ok) {
        const newReply = await response.json();
        if (parentId) {
          setReplies(prev => addReplyToParent(prev, parentId, newReply));
        } else {
          setReplies(prev => [newReply, ...prev]);
        }
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
    }
  };

  const handleReportReply = async (replyId: string, reason: string) => {
    try {
      await fetch(`/api/community/replies/${replyId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
    } catch (error) {
      console.error('Failed to report reply:', error);
    }
  };

  const updateReplyInTree = (replies: Reply[], targetId: string, updatedReply: Reply): Reply[] => {
    return replies.map(reply => {
      if (reply.id === targetId) {
        return updatedReply;
      }
      if (reply.replies.length > 0) {
        return {
          ...reply,
          replies: updateReplyInTree(reply.replies, targetId, updatedReply)
        };
      }
      return reply;
    });
  };

  const addReplyToParent = (replies: Reply[], parentId: string, newReply: Reply): Reply[] => {
    return replies.map(reply => {
      if (reply.id === parentId) {
        return {
          ...reply,
          replies: [newReply, ...reply.replies]
        };
      }
      if (reply.replies.length > 0) {
        return {
          ...reply,
          replies: addReplyToParent(reply.replies, parentId, newReply)
        };
      }
      return reply;
    });
  };

  const renderReply = (reply: Reply, depth: number = 0) => {
    if (reply.isDeleted) {
      return (
        <div key={reply.id} className={`${depth > 0 ? 'ml-8' : ''} mb-4`}>
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400 italic">
              This message has been deleted
            </p>
          </Card>
        </div>
      );
    }

    return (
      <div key={reply.id} className={`${depth > 0 ? 'ml-8' : ''} mb-4`}>
        <Card className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <img
                src={reply.author.avatar}
                alt={reply.author.displayName}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {reply.author.displayName}
                  </span>
                  <UserReputationBadge
                    reputation={reply.author.reputation}
                    badges={reply.author.badges}
                  />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(reply.createdAt).toLocaleString()}
                  {reply.isEdited && <span className="ml-2">(edited)</span>}
                </div>
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowModerationMenu(
                  showModerationMenu === reply.id ? null : reply.id
                )}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {showModerationMenu === reply.id && (
                <ModerationActions
                  onReport={() => handleReportReply(reply.id, 'inappropriate')}
                  onClose={() => setShowModerationMenu(null)}
                />
              )}
            </div>
          </div>
          
          <div className="prose dark:prose-invert max-w-none mb-4">
            <p>{reply.content}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVote(reply.id, 'like')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                  reply.userVote === 'like'
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                {reply.likes}
              </button>
              
              <button
                onClick={() => handleVote(reply.id, 'dislike')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                  reply.userVote === 'dislike'
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                {reply.dislikes}
              </button>
            </div>
            
            {!topic.isLocked && (
              <button
                onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Reply className="w-4 h-4" />
                Reply
              </button>
            )}
          </div>
          
          {replyingTo === reply.id && (
            <div className="mt-4">
              <ReplyComposer
                onSubmit={(content) => handleReply(content, reply.id)}
                onCancel={() => setReplyingTo(null)}
                placeholder={`Reply to ${reply.author.displayName}...`}
              />
            </div>
          )}
        </Card>
        
        {reply.replies.length > 0 && (
          <div className="mt-4">
            {reply.replies.map(childReply => renderReply(childReply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discussions
        </Button>
      </div>

      {/* Topic */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {topic.isPinned && (
                <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-medium">
                  <Pin className="w-3 h-3" />
                  Pinned
                </div>
              )}
              {topic.isLocked && (
                <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs font-medium">
                  <Lock className="w-3 h-3" />
                  Locked
                </div>
              )}
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs">
                {topic.category}
              </span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {topic.title}
            </h1>
            
            <div className="prose dark:prose-invert max-w-none mb-4">
              <p>{topic.description}</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <img
                  src={topic.author.avatar}
                  alt={topic.author.displayName}
                  className="w-6 h-6 rounded-full"
                />
                <span>{topic.author.displayName}</span>
                <UserReputationBadge
                  reputation={topic.author.reputation}
                  badges={topic.author.badges}
                />
              </div>
              <span>•</span>
              <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{topic.replyCount} replies</span>
              <span>•</span>
              <span>{topic.viewCount} views</span>
            </div>
            
            {topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {topic.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => onReport(topic.id, 'inappropriate')}
            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            title="Report topic"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* Reply Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {replies.length} replies
          </span>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'popular')}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
        
        {!topic.isLocked && (
          <Button
            onClick={() => setReplyingTo(replyingTo === 'new' ? null : 'new')}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Reply
          </Button>
        )}
      </div>

      {/* New Reply Composer */}
      {replyingTo === 'new' && !topic.isLocked && (
        <ReplyComposer
          onSubmit={(content) => handleReply(content)}
          onCancel={() => setReplyingTo(null)}
          placeholder="Share your thoughts..."
        />
      )}

      {/* Replies */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading replies...</p>
          </div>
        ) : replies.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No replies yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Be the first to share your thoughts on this topic!
            </p>
            {!topic.isLocked && (
              <Button onClick={() => setReplyingTo('new')}>
                Start the Discussion
              </Button>
            )}
          </Card>
        ) : (
          replies.map(reply => renderReply(reply))
        )}
      </div>
    </div>
  );
}