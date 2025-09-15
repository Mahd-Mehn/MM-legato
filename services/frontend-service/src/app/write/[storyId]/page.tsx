'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Settings, 
  Users, 
  MessageCircle,
  BookOpen,
  Plus,
  FileText,
  Clock,
  Shield,
  Globe
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
import RichTextEditor from '@/components/editor/RichTextEditor';
import ChapterOrganizer from '@/components/editor/ChapterOrganizer';
import AutoSaveManager from '@/components/editor/AutoSaveManager';
import CollaborativeEditor from '@/components/editor/CollaborativeEditor';

interface Story {
  id: string;
  title: string;
  description: string;
  genre: string;
  status: 'draft' | 'published' | 'completed' | 'paused';
  chapters: Chapter[];
  coverImage?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  totalViews: number;
  totalLikes: number;
  isProtected: boolean;
  monetization: 'free' | 'premium' | 'subscription';
  collaborators: Collaborator[];
  comments: Comment[];
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'published' | 'scheduled';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  order: number;
  notes?: string;
}

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

const mockStory: Story = {
  id: '1',
  title: 'The Digital Awakening',
  description: 'In a world where consciousness can be digitized, Maya discovers she might not be human after all.',
  genre: 'Sci-Fi',
  status: 'published',
  chapters: [
    {
      id: 'ch1',
      title: 'The Beginning',
      content: '<p>Maya stared at the holographic display floating before her, its blue light casting ethereal shadows across her apartment. The data streams flowing past her eyes told a story she wasn\'t sure she wanted to believe.</p><p>"This can\'t be right," she whispered, her fingers trembling as she reached toward the projection. The moment her skin made contact with the light, the world around her shifted.</p>',
      wordCount: 2500,
      status: 'published',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
      publishedAt: '2024-01-15T15:00:00Z',
      order: 1,
      notes: 'Introduction chapter - establish the mystery',
    },
    {
      id: 'ch2',
      title: 'Discovery',
      content: '<p>The revelation hit Maya like a digital tsunami. Every memory, every sensation, every moment of her existence suddenly felt different. Was any of it real?</p>',
      wordCount: 2800,
      status: 'draft',
      createdAt: '2024-01-16T09:00:00Z',
      updatedAt: '2024-01-20T11:45:00Z',
      order: 2,
      notes: 'Maya discovers the truth about her nature',
    },
  ],
  tags: ['AI', 'Cyberpunk', 'Thriller'],
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-20T11:45:00Z',
  totalViews: 15420,
  totalLikes: 1230,
  isProtected: true,
  monetization: 'premium',
  collaborators: [
    {
      id: 'user1',
      name: 'Maya Chen',
      email: 'maya@example.com',
      role: 'owner',
      isOnline: true,
      lastSeen: new Date(),
      color: '#3B82F6',
    },
    {
      id: 'user2',
      name: 'Alex Rodriguez',
      email: 'alex@example.com',
      role: 'editor',
      isOnline: true,
      lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
      color: '#10B981',
    },
    {
      id: 'user3',
      name: 'Sarah Kim',
      email: 'sarah@example.com',
      role: 'viewer',
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
      color: '#F59E0B',
    },
  ],
  comments: [
    {
      id: 'comment1',
      authorId: 'user2',
      content: 'This opening is really compelling! The mystery hooks the reader immediately.',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      position: 150,
      resolved: false,
      replies: [
        {
          id: 'reply1',
          authorId: 'user1',
          content: 'Thanks! I wanted to start with something that would grab attention.',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        },
      ],
    },
    {
      id: 'comment2',
      authorId: 'user3',
      content: 'Consider adding more sensory details here to make the scene more immersive.',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      position: 300,
      resolved: false,
      replies: [],
    },
  ],
};

export default function StoryEditorPage() {
  const params = useParams();
  const storyId = params.storyId as string;
  
  const [story, setStory] = useState<Story | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState<'editor' | 'organizer' | 'collaboration'>('editor');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const loadStory = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStory(mockStory);
        setSelectedChapter(mockStory.chapters[0]);
      } catch (error) {
        console.error('Failed to load story:', error);
      } finally {
        setLoading(false);
      }
    };

    if (storyId) {
      loadStory();
    }
  }, [storyId]);

  const handleSave = async (content: string) => {
    if (!selectedChapter || !story) return;
    
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update chapter content
      const updatedChapters = story.chapters.map(ch => 
        ch.id === selectedChapter.id 
          ? { 
              ...ch, 
              content, 
              updatedAt: new Date().toISOString(),
              wordCount: content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length 
            }
          : ch
      );
      
      setStory(prev => prev ? { ...prev, chapters: updatedChapters } : null);
      setSelectedChapter(prev => prev ? { 
        ...prev, 
        content, 
        updatedAt: new Date().toISOString(),
        wordCount: content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length 
      } : null);
    } catch (error) {
      console.error('Failed to save:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleChapterReorder = (chapters: Chapter[]) => {
    if (!story) return;
    setStory({ ...story, chapters });
  };

  const handleChapterEdit = (chapterId: string) => {
    const chapter = story?.chapters.find(ch => ch.id === chapterId);
    if (chapter) {
      setSelectedChapter(chapter);
      setActiveView('editor');
    }
  };

  const handleChapterDelete = (chapterId: string) => {
    if (!story) return;
    const updatedChapters = story.chapters.filter(ch => ch.id !== chapterId);
    setStory({ ...story, chapters: updatedChapters });
    
    // If deleted chapter was selected, select first available chapter
    if (selectedChapter?.id === chapterId) {
      setSelectedChapter(updatedChapters[0] || null);
    }
  };

  const handleChapterAdd = () => {
    if (!story) return;
    
    const newChapter: Chapter = {
      id: `ch${Date.now()}`,
      title: `Chapter ${story.chapters.length + 1}`,
      content: '<p>Start writing your chapter here...</p>',
      wordCount: 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: story.chapters.length + 1,
    };
    
    const updatedChapters = [...story.chapters, newChapter];
    setStory({ ...story, chapters: updatedChapters });
    setSelectedChapter(newChapter);
    setActiveView('editor');
  };

  const handleChapterDuplicate = (chapterId: string) => {
    if (!story) return;
    
    const originalChapter = story.chapters.find(ch => ch.id === chapterId);
    if (!originalChapter) return;
    
    const duplicatedChapter: Chapter = {
      ...originalChapter,
      id: `ch${Date.now()}`,
      title: `${originalChapter.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: story.chapters.length + 1,
    };
    
    const updatedChapters = [...story.chapters, duplicatedChapter];
    setStory({ ...story, chapters: updatedChapters });
  };

  const handleInviteCollaborator = (email: string, role: 'editor' | 'viewer') => {
    // Simulate API call to invite collaborator
    console.log('Inviting collaborator:', email, role);
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    if (!story) return;
    const updatedCollaborators = story.collaborators.filter(c => c.id !== collaboratorId);
    setStory({ ...story, collaborators: updatedCollaborators });
  };

  const handleAddComment = (content: string, position: number) => {
    if (!story) return;
    
    const newComment: Comment = {
      id: `comment${Date.now()}`,
      authorId: 'user1', // Current user
      content,
      timestamp: new Date(),
      position,
      resolved: false,
      replies: [],
    };
    
    const updatedComments = [...story.comments, newComment];
    setStory({ ...story, comments: updatedComments });
  };

  const handleReplyToComment = (commentId: string, content: string) => {
    if (!story) return;
    
    const newReply: CommentReply = {
      id: `reply${Date.now()}`,
      authorId: 'user1', // Current user
      content,
      timestamp: new Date(),
    };
    
    const updatedComments = story.comments.map(comment =>
      comment.id === commentId
        ? { ...comment, replies: [...comment.replies, newReply] }
        : comment
    );
    
    setStory({ ...story, comments: updatedComments });
  };

  const handleResolveComment = (commentId: string) => {
    if (!story) return;
    
    const updatedComments = story.comments.map(comment =>
      comment.id === commentId
        ? { ...comment, resolved: true }
        : comment
    );
    
    setStory({ ...story, comments: updatedComments });
  };

  const handleSelectionChange = (start: number, end: number) => {
    // Handle text selection for collaborative editing
    console.log('Selection changed:', start, end);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Story not found</h2>
          <p className="text-gray-600 mb-4">The story you're looking for doesn't exist.</p>
          <Link href="/write">
            <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Stories
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/write">
                <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{story.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {story.chapters.length} chapters
                  </span>
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    {story.chapters.reduce((sum, ch) => sum + ch.wordCount, 0).toLocaleString()} words
                  </span>
                  {story.isProtected && (
                    <span className="flex items-center text-green-600">
                      <Shield className="w-4 h-4 mr-1" />
                      IP Protected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Auto-save status */}
              {selectedChapter && (
                <AutoSaveManager
                  content={selectedChapter.content}
                  onSave={handleSave}
                  className="mr-4"
                />
              )}

              <Button variant="outline" leftIcon={<Eye className="w-4 h-4" />}>
                Preview
              </Button>
              <Button variant="outline" leftIcon={<Settings className="w-4 h-4" />}>
                Settings
              </Button>
              <Link href={`/stories/${story.id}`}>
                <Button leftIcon={<Globe className="w-4 h-4" />}>
                  Publish
                </Button>
              </Link>
            </div>
          </div>

          {/* View Tabs */}
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'editor', label: 'Editor', icon: <FileText className="w-4 h-4" /> },
                { id: 'organizer', label: 'Chapters', icon: <BookOpen className="w-4 h-4" /> },
                { id: 'collaboration', label: 'Collaboration', icon: <Users className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeView === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'editor' && selectedChapter && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Chapter Sidebar */}
            <div className={`lg:col-span-1 ${sidebarCollapsed ? 'hidden lg:block' : ''}`}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Chapters</span>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={handleChapterAdd}
                    >
                      Add
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {story.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        onClick={() => setSelectedChapter(chapter)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChapter.id === chapter.id
                            ? 'bg-primary-100 border border-primary-300'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="font-medium text-gray-900 text-sm">
                          {chapter.title}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                          <span>{chapter.wordCount} words</span>
                          <span className={`px-2 py-1 rounded ${
                            chapter.status === 'published' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {chapter.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Editor */}
            <div className="lg:col-span-3">
              <RichTextEditor
                content={selectedChapter.content}
                onChange={(content) => setSelectedChapter({ ...selectedChapter, content })}
                onSave={() => handleSave(selectedChapter.content)}
                placeholder="Start writing your chapter..."
                autoSave={true}
                showPreview={true}
              />
            </div>
          </div>
        )}

        {activeView === 'organizer' && (
          <ChapterOrganizer
            chapters={story.chapters}
            onChapterReorder={handleChapterReorder}
            onChapterEdit={handleChapterEdit}
            onChapterDelete={handleChapterDelete}
            onChapterAdd={handleChapterAdd}
            onChapterDuplicate={handleChapterDuplicate}
            selectedChapterId={selectedChapter?.id}
            onChapterSelect={(chapterId) => {
              const chapter = story.chapters.find(ch => ch.id === chapterId);
              if (chapter) setSelectedChapter(chapter);
            }}
          />
        )}

        {activeView === 'collaboration' && (
          <CollaborativeEditor
            collaborators={story.collaborators}
            comments={story.comments}
            currentUserId="user1"
            onInviteCollaborator={handleInviteCollaborator}
            onRemoveCollaborator={handleRemoveCollaborator}
            onAddComment={handleAddComment}
            onReplyToComment={handleReplyToComment}
            onResolveComment={handleResolveComment}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </div>
    </div>
  );
}