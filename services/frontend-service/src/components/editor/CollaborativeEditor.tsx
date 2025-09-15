'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageCircle, 
  Send, 
  UserCircle, 
  Eye,
  Edit3,
  Clock,
  Dot
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  lastSeen: Date;
  currentSelection?: {
    start: number;
    end: number;
  };
  color: string;
}

interface Comment {
  id: string;
  authorId: string;
  content: string;
  timestamp: Date;
  position: number;
  resolved: boolean;
  replies: CommentReply[];
}

interface CommentReply {
  id: string;
  authorId: string;
  content: string;
  timestamp: Date;
}

interface CollaborativeEditorProps {
  collaborators: Collaborator[];
  comments: Comment[];
  currentUserId: string;
  onInviteCollaborator: (email: string, role: 'editor' | 'viewer') => void;
  onRemoveCollaborator: (collaboratorId: string) => void;
  onAddComment: (content: string, position: number) => void;
  onReplyToComment: (commentId: string, content: string) => void;
  onResolveComment: (commentId: string) => void;
  onSelectionChange: (start: number, end: number) => void;
  className?: string;
}

export default function CollaborativeEditor({
  collaborators,
  comments,
  currentUserId,
  onInviteCollaborator,
  onRemoveCollaborator,
  onAddComment,
  onReplyToComment,
  onResolveComment,
  onSelectionChange,
  className = "",
}: CollaborativeEditorProps) {
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState(0);

  const currentUser = collaborators.find(c => c.id === currentUserId);
  const onlineCollaborators = collaborators.filter(c => c.isOnline && c.id !== currentUserId);
  const unresolvedComments = comments.filter(c => !c.resolved);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      onInviteCollaborator(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim(), selectionPosition);
      setNewComment('');
      setSelectedText('');
    }
  };

  const handleReply = (commentId: string) => {
    if (replyContent.trim()) {
      onReplyToComment(commentId, replyContent.trim());
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
      setSelectionPosition(selection.anchorOffset);
      onSelectionChange(selection.anchorOffset, selection.focusOffset);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Collaboration Toolbar */}
      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-4">
          {/* Online Collaborators */}
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {onlineCollaborators.slice(0, 3).map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="relative"
                  title={`${collaborator.name} (${collaborator.role})`}
                >
                  {collaborator.avatar ? (
                    <img
                      src={collaborator.avatar}
                      alt={collaborator.name}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: collaborator.color }}
                    >
                      {collaborator.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
              ))}
            </div>
            
            {onlineCollaborators.length > 3 && (
              <span className="text-sm text-gray-500">
                +{onlineCollaborators.length - 3} more
              </span>
            )}
            
            <button
              onClick={() => setShowCollaborators(!showCollaborators)}
              className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              <Users className="w-4 h-4" />
              <span>Manage</span>
            </button>
          </div>

          {/* Comments */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comments</span>
            {unresolvedComments.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {unresolvedComments.length}
              </span>
            )}
          </button>
        </div>

        {/* Add Comment for Selected Text */}
        {selectedText && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}"
            </span>
            <Button
              size="sm"
              leftIcon={<MessageCircle className="w-4 h-4" />}
              onClick={() => setShowComments(true)}
            >
              Add Comment
            </Button>
          </div>
        )}
      </div>

      {/* Collaborators Panel */}
      {showCollaborators && (
        <Card>
          <CardHeader>
            <CardTitle>Collaborators</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Invite New Collaborator */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Invite Collaborator</h4>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Button onClick={handleInvite}>Invite</Button>
              </div>
            </div>

            {/* Collaborator List */}
            <div className="space-y-3">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {collaborator.avatar ? (
                      <img
                        src={collaborator.avatar}
                        alt={collaborator.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: collaborator.color }}
                      >
                        {collaborator.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{collaborator.name}</span>
                        {collaborator.id === currentUserId && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>
                        )}
                        <div className={`w-2 h-2 rounded-full ${
                          collaborator.isOnline ? 'bg-green-400' : 'bg-gray-300'
                        }`} />
                      </div>
                      <div className="text-sm text-gray-500">
                        {collaborator.email} • {collaborator.role}
                        {!collaborator.isOnline && (
                          <span> • Last seen {formatTime(collaborator.lastSeen)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {collaborator.id !== currentUserId && currentUser?.role === 'owner' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveCollaborator(collaborator.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Panel */}
      {showComments && (
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add New Comment */}
            {selectedText && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Add Comment</h4>
                <p className="text-sm text-gray-600 mb-3">
                  On: "{selectedText}"
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <Button onClick={handleAddComment} leftIcon={<Send className="w-4 h-4" />}>
                    Comment
                  </Button>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No comments yet. Select text to add a comment.</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const author = collaborators.find(c => c.id === comment.authorId);
                  
                  return (
                    <div
                      key={comment.id}
                      className={`p-4 border rounded-lg ${
                        comment.resolved ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {author?.avatar ? (
                            <img
                              src={author.avatar}
                              alt={author.name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                              style={{ backgroundColor: author?.color || '#gray' }}
                            >
                              {author?.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{author?.name}</span>
                          <span className="text-sm text-gray-500">{formatTime(comment.timestamp)}</span>
                        </div>
                        
                        {!comment.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onResolveComment(comment.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-3">{comment.content}</p>
                      
                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                          {comment.replies.map((reply) => {
                            const replyAuthor = collaborators.find(c => c.id === reply.authorId);
                            
                            return (
                              <div key={reply.id} className="flex items-start space-x-2">
                                {replyAuthor?.avatar ? (
                                  <img
                                    src={replyAuthor.avatar}
                                    alt={replyAuthor.name}
                                    className="w-5 h-5 rounded-full"
                                  />
                                ) : (
                                  <div 
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                    style={{ backgroundColor: replyAuthor?.color || '#gray' }}
                                  >
                                    {replyAuthor?.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900">{replyAuthor?.name}</span>
                                    <span className="text-xs text-gray-500">{formatTime(reply.timestamp)}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{reply.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Reply Input */}
                      {!comment.resolved && (
                        <div className="mt-3">
                          {replyingTo === comment.id ? (
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                onKeyPress={(e) => e.key === 'Enter' && handleReply(comment.id)}
                              />
                              <Button size="sm" onClick={() => handleReply(comment.id)}>
                                Reply
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setReplyingTo(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyingTo(comment.id)}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              Reply
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}