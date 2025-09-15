'use client';

import { useState } from 'react';
import { 
  GripVertical, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Clock,
  FileText,
  ChevronDown,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

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

interface ChapterOrganizerProps {
  chapters: Chapter[];
  onChapterReorder: (chapters: Chapter[]) => void;
  onChapterEdit: (chapterId: string) => void;
  onChapterDelete: (chapterId: string) => void;
  onChapterAdd: () => void;
  onChapterDuplicate: (chapterId: string) => void;
  selectedChapterId?: string;
  onChapterSelect: (chapterId: string) => void;
}

export default function ChapterOrganizer({
  chapters,
  onChapterReorder,
  onChapterEdit,
  onChapterDelete,
  onChapterAdd,
  onChapterDuplicate,
  selectedChapterId,
  onChapterSelect,
}: ChapterOrganizerProps) {
  const [draggedChapter, setDraggedChapter] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showActions, setShowActions] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDragStart = (e: React.DragEvent, chapterId: string) => {
    setDraggedChapter(chapterId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetChapterId: string) => {
    e.preventDefault();
    
    if (!draggedChapter || draggedChapter === targetChapterId) {
      setDraggedChapter(null);
      return;
    }

    const draggedIndex = chapters.findIndex(ch => ch.id === draggedChapter);
    const targetIndex = chapters.findIndex(ch => ch.id === targetChapterId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newChapters = [...chapters];
    const [draggedItem] = newChapters.splice(draggedIndex, 1);
    newChapters.splice(targetIndex, 0, draggedItem);

    // Update order numbers
    const reorderedChapters = newChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1,
    }));

    onChapterReorder(reorderedChapters);
    setDraggedChapter(null);
  };

  const toggleChapterExpansion = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleActionClick = (chapterId: string, action: string) => {
    setShowActions(null);
    
    switch (action) {
      case 'edit':
        onChapterEdit(chapterId);
        break;
      case 'duplicate':
        onChapterDuplicate(chapterId);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this chapter?')) {
          onChapterDelete(chapterId);
        }
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Chapter Organization</span>
          </CardTitle>
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onChapterAdd}
          >
            Add Chapter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chapters.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No chapters yet</h3>
            <p className="text-gray-500 mb-4">Start writing by creating your first chapter</p>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={onChapterAdd}>
              Create First Chapter
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {chapters
              .sort((a, b) => a.order - b.order)
              .map((chapter) => (
                <div
                  key={chapter.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, chapter.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, chapter.id)}
                  className={`border rounded-lg transition-all ${
                    selectedChapterId === chapter.id
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    draggedChapter === chapter.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-3">
                      {/* Drag Handle */}
                      <div className="cursor-move text-gray-400 hover:text-gray-600">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Chapter Number */}
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                        {chapter.order}
                      </div>

                      {/* Chapter Info */}
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => onChapterSelect(chapter.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleChapterExpansion(chapter.id);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expandedChapters.has(chapter.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {chapter.title || `Chapter ${chapter.order}`}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{chapter.wordCount} words</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(chapter.status)}`}>
                                  {chapter.status}
                                </span>
                                <span>Updated {formatDate(chapter.updatedAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Edit3 className="w-4 h-4" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onChapterEdit(chapter.id);
                              }}
                            >
                              Edit
                            </Button>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowActions(showActions === chapter.id ? null : chapter.id);
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              {showActions === chapter.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleActionClick(chapter.id, 'duplicate')}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Duplicate Chapter
                                    </button>
                                    <button
                                      onClick={() => handleActionClick(chapter.id, 'delete')}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                      Delete Chapter
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedChapters.has(chapter.id) && (
                      <div className="mt-4 pl-11 border-t border-gray-100 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <span className="ml-2 text-gray-900">{formatDate(chapter.createdAt)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Last Updated:</span>
                            <span className="ml-2 text-gray-900">{formatDate(chapter.updatedAt)}</span>
                          </div>
                          {chapter.publishedAt && (
                            <div>
                              <span className="text-gray-500">Published:</span>
                              <span className="ml-2 text-gray-900">{formatDate(chapter.publishedAt)}</span>
                            </div>
                          )}
                        </div>
                        
                        {chapter.notes && (
                          <div className="mt-3">
                            <span className="text-gray-500 text-sm">Notes:</span>
                            <p className="mt-1 text-gray-700 text-sm bg-gray-50 p-2 rounded">
                              {chapter.notes}
                            </p>
                          </div>
                        )}
                        
                        {chapter.content && (
                          <div className="mt-3">
                            <span className="text-gray-500 text-sm">Preview:</span>
                            <p className="mt-1 text-gray-700 text-sm line-clamp-3">
                              {chapter.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Chapter Statistics */}
        {chapters.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{chapters.length}</div>
                <div className="text-sm text-gray-500">Total Chapters</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {chapters.reduce((sum, ch) => sum + ch.wordCount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Words</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {chapters.filter(ch => ch.status === 'published').length}
                </div>
                <div className="text-sm text-gray-500">Published</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {chapters.filter(ch => ch.status === 'draft').length}
                </div>
                <div className="text-sm text-gray-500">Drafts</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}