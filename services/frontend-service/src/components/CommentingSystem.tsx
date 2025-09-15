'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle,
    Heart,
    Reply,
    MoreHorizontal,
    Flag,
    Edit,
    Trash2,
    Send,
    X,
    User,
    ThumbsUp,
    ThumbsDown,
    Share2,
    Bookmark,
    Award
} from 'lucide-react';

interface User {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    role?: 'reader' | 'author' | 'moderator' | 'premium';
}

interface Comment {
    id: string;
    user: User;
    content: string;
    timestamp: string;
    likes: number;
    dislikes: number;
    replies: Comment[];
    isLiked: boolean;
    isDisliked: boolean;
    isEdited: boolean;
    isPinned: boolean;
    isHighlighted: boolean;
    parentId?: string;
    chapterPosition?: number; // Position in chapter for inline comments
}

interface CommentingSystemProps {
    storyId: string;
    chapterId?: string;
    isOpen: boolean;
    onClose: () => void;
    allowInlineComments?: boolean;
    currentUser?: User;
}

export default function CommentingSystem({
    storyId,
    chapterId,
    isOpen,
    onClose,
    allowInlineComments = false,
    currentUser
}: CommentingSystemProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
    const [filterBy, setFilterBy] = useState<'all' | 'author' | 'verified'>('all');

    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    // Mock current user if not provided
    const user = currentUser || {
        id: 'user1',
        name: 'Current User',
        verified: false,
        role: 'reader'
    };

    // Mock comments data
    const mockComments: Comment[] = [
        {
            id: 'comment1',
            user: {
                id: 'user2',
                name: 'Sarah Chen',
                verified: true,
                role: 'author'
            },
            content: 'Thank you all for reading! I love seeing your reactions to this chapter. The next one is going to be even more intense! 🔥',
            timestamp: '2024-01-22T10:30:00Z',
            likes: 45,
            dislikes: 2,
            replies: [
                {
                    id: 'reply1',
                    user: {
                        id: 'user3',
                        name: 'Alex Johnson',
                        verified: false,
                        role: 'premium'
                    },
                    content: 'Can\'t wait! This story has me completely hooked. The character development is incredible.',
                    timestamp: '2024-01-22T11:15:00Z',
                    likes: 12,
                    dislikes: 0,
                    replies: [],
                    isLiked: false,
                    isDisliked: false,
                    isEdited: false,
                    isPinned: false,
                    isHighlighted: false,
                    parentId: 'comment1'
                }
            ],
            isLiked: true,
            isDisliked: false,
            isEdited: false,
            isPinned: true,
            isHighlighted: true
        },
        {
            id: 'comment2',
            user: {
                id: 'user4',
                name: 'Maria Santos',
                verified: true,
                role: 'reader'
            },
            content: 'The plot twist at the end completely caught me off guard! I had to re-read that section twice. Brilliant writing! 👏',
            timestamp: '2024-01-22T09:45:00Z',
            likes: 28,
            dislikes: 1,
            replies: [],
            isLiked: false,
            isDisliked: false,
            isEdited: false,
            isPinned: false,
            isHighlighted: false
        }
    ];

    // Load comments
    useEffect(() => {
        const loadComments = async () => {
            setLoading(true);
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));
                setComments(mockComments);
            } catch (error) {
                console.error('Failed to load comments:', error);
            } finally {
                setLoading(false);
            }
        };

        loadComments();
    }, [storyId, chapterId]);

    // Comment interaction functions
    const handleLikeComment = (commentId: string) => {
        setComments(prev => prev.map(comment => {
            if (comment.id === commentId) {
                const wasLiked = comment.isLiked;
                const wasDisliked = comment.isDisliked;
                return {
                    ...comment,
                    isLiked: !wasLiked,
                    isDisliked: false,
                    likes: wasLiked ? comment.likes - 1 : comment.likes + 1,
                    dislikes: wasDisliked ? comment.dislikes - 1 : comment.dislikes
                };
            }
            // Handle replies
            return {
                ...comment,
                replies: comment.replies.map(reply => {
                    if (reply.id === commentId) {
                        const wasLiked = reply.isLiked;
                        const wasDisliked = reply.isDisliked;
                        return {
                            ...reply,
                            isLiked: !wasLiked,
                            isDisliked: false,
                            likes: wasLiked ? reply.likes - 1 : reply.likes + 1,
                            dislikes: wasDisliked ? reply.dislikes - 1 : reply.dislikes
                        };
                    }
                    return reply;
                })
            };
        }));
    };

    const handleDislikeComment = (commentId: string) => {
        setComments(prev => prev.map(comment => {
            if (comment.id === commentId) {
                const wasLiked = comment.isLiked;
                const wasDisliked = comment.isDisliked;
                return {
                    ...comment,
                    isLiked: false,
                    isDisliked: !wasDisliked,
                    likes: wasLiked ? comment.likes - 1 : comment.likes,
                    dislikes: wasDisliked ? comment.dislikes - 1 : comment.dislikes + 1
                };
            }
            // Handle replies
            return {
                ...comment,
                replies: comment.replies.map(reply => {
                    if (reply.id === commentId) {
                        const wasLiked = reply.isLiked;
                        const wasDisliked = reply.isDisliked;
                        return {
                            ...reply,
                            isLiked: false,
                            isDisliked: !wasDisliked,
                            likes: wasLiked ? reply.likes - 1 : reply.likes,
                            dislikes: wasDisliked ? reply.dislikes - 1 : reply.dislikes + 1
                        };
                    }
                    return reply;
                })
            };
        }));
    };

    const handleSubmitComment = () => {
        if (!newComment.trim()) return;

        const comment: Comment = {
            id: `comment-${Date.now()}`,
            user,
            content: newComment,
            timestamp: new Date().toISOString(),
            likes: 0,
            dislikes: 0,
            replies: [],
            isLiked: false,
            isDisliked: false,
            isEdited: false,
            isPinned: false,
            isHighlighted: false
        };

        if (replyingTo) {
            // Add as reply
            setComments(prev => prev.map(c => {
                if (c.id === replyingTo) {
                    return {
                        ...c,
                        replies: [...c.replies, { ...comment, parentId: replyingTo }]
                    };
                }
                return c;
            }));
            setReplyingTo(null);
        } else {
            // Add as new comment
            setComments(prev => [comment, ...prev]);
        }

        setNewComment('');
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const commentTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-primary-600" />
                        <h3 className="text-lg font-semibold text-reading-text">Comments</h3>
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-sm">
                            {comments.length}
                        </span>
                    </div>
                    {isOpen && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filters and Sort */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="popular">Most Popular</option>
                        </select>
                        <select
                            value={filterBy}
                            onChange={(e) => setFilterBy(e.target.value as any)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="all">All Comments</option>
                            <option value="author">Author Only</option>
                            <option value="verified">Verified Users</option>
                        </select>
                    </div>
                </div>

                {/* New Comment Input */}
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="flex-1">
                            <textarea
                                ref={commentInputRef}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={replyingTo ? "Write a reply..." : "Share your thoughts about this chapter..."}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white dark:bg-gray-700 text-reading-text"
                                rows={3}
                            />
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    {replyingTo && (
                                        <button
                                            onClick={() => setReplyingTo(null)}
                                            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            Cancel Reply
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={!newComment.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                    {replyingTo ? 'Reply' : 'Comment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading comments...</p>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="p-8 text-center">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No comments yet</h3>
                        <p className="text-gray-500">Be the first to share your thoughts!</p>
                    </div>
                ) : (
                    <div className="space-y-4 p-4">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                currentUser={user}
                                onLike={handleLikeComment}
                                onDislike={handleDislikeComment}
                                onReply={setReplyingTo}
                                formatTimeAgo={formatTimeAgo}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
// Individual Comment Component
function CommentItem({
    comment,
    currentUser,
    onLike,
    onDislike,
    onReply,
    formatTimeAgo,
    isReply = false
}: {
    comment: Comment;
    currentUser: User;
    onLike: (id: string) => void;
    onDislike: (id: string) => void;
    onReply: (id: string) => void;
    formatTimeAgo: (timestamp: string) => string;
    isReply?: boolean;
}) {
    const [showReplies, setShowReplies] = useState(true);
    const [showMenu, setShowMenu] = useState(false);

    const getRoleColor = (role?: string) => {
        switch (role) {
            case 'author': return 'text-purple-600 bg-purple-100';
            case 'moderator': return 'text-green-600 bg-green-100';
            case 'premium': return 'text-amber-600 bg-amber-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getRoleLabel = (role?: string) => {
        switch (role) {
            case 'author': return 'Author';
            case 'moderator': return 'Mod';
            case 'premium': return 'Premium';
            default: return '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isReply ? 'ml-8 pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''} ${comment.isPinned ? 'bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4' : ''
                } ${comment.isHighlighted ? 'ring-2 ring-primary-200 rounded-xl' : ''}`}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary-600" />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-reading-text">{comment.user.name}</span>

                        {comment.user.verified && (
                            <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                        )}

                        {comment.user.role && getRoleLabel(comment.user.role) && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(comment.user.role)}`}>
                                {getRoleLabel(comment.user.role)}
                            </span>
                        )}

                        {comment.isPinned && (
                            <div className="flex items-center gap-1 text-primary-600">
                                <Award className="w-3 h-3" />
                                <span className="text-xs font-medium">Pinned</span>
                            </div>
                        )}

                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{formatTimeAgo(comment.timestamp)}</span>

                        {comment.isEdited && (
                            <>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">edited</span>
                            </>
                        )}
                    </div>

                    {/* Content */}
                    <div className="text-reading-text mb-3 leading-relaxed">
                        {comment.content}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onLike(comment.id)}
                            className={`flex items-center gap-1 text-sm transition-colors ${comment.isLiked
                                    ? 'text-primary-600'
                                    : 'text-gray-500 hover:text-primary-600'
                                }`}
                        >
                            <ThumbsUp className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                            {comment.likes > 0 && <span>{comment.likes}</span>}
                        </button>

                        <button
                            onClick={() => onDislike(comment.id)}
                            className={`flex items-center gap-1 text-sm transition-colors ${comment.isDisliked
                                    ? 'text-red-600'
                                    : 'text-gray-500 hover:text-red-600'
                                }`}
                        >
                            <ThumbsDown className={`w-4 h-4 ${comment.isDisliked ? 'fill-current' : ''}`} />
                            {comment.dislikes > 0 && <span>{comment.dislikes}</span>}
                        </button>

                        <button
                            onClick={() => onReply(comment.id)}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition-colors"
                        >
                            <Reply className="w-4 h-4" />
                            Reply
                        </button>

                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition-colors">
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>

                        {/* More Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>

                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-10 min-w-32"
                                    >
                                        {comment.user.id === currentUser.id && (
                                            <>
                                                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                                    <Edit className="w-4 h-4" />
                                                    Edit
                                                </button>
                                                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                            <Flag className="w-4 h-4" />
                                            Report
                                        </button>
                                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                            <Bookmark className="w-4 h-4" />
                                            Save
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                        <div className="mt-4">
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-3"
                            >
                                {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                            </button>

                            <AnimatePresence>
                                {showReplies && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        {comment.replies.map((reply) => (
                                            <CommentItem
                                                key={reply.id}
                                                comment={reply}
                                                currentUser={currentUser}
                                                onLike={onLike}
                                                onDislike={onDislike}
                                                onReply={onReply}
                                                formatTimeAgo={formatTimeAgo}
                                                isReply={true}
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}