'use client';

import { useState } from 'react';
import { Send, X, Bold, Italic, Link, List, Quote } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';
// Removed unused imports - using native HTML elements instead

interface ReplyComposerProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  placeholder?: string;
  initialContent?: string;
}

export function ReplyComposer({ 
  onSubmit, 
  onCancel, 
  placeholder = "Write your reply...",
  initialContent = ""
}: ReplyComposerProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById('reply-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      before + 
      selectedText + 
      after + 
      content.substring(end);
    
    setContent(newContent);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const formatButtons = [
    { icon: Bold, action: () => insertFormatting('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertFormatting('*', '*'), title: 'Italic' },
    { icon: Link, action: () => insertFormatting('[', '](url)'), title: 'Link' },
    { icon: Quote, action: () => insertFormatting('> '), title: 'Quote' },
    { icon: List, action: () => insertFormatting('- '), title: 'List' }
  ];

  const renderPreview = (text: string) => {
    // Simple markdown-like preview (in a real app, use a proper markdown parser)
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 underline">$1</a>')
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '<br>')
      .join('');
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          {formatButtons.map(({ icon: Icon, action, title }) => (
            <button
              key={title}
              type="button"
              onClick={action}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title={title}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
          
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-1 text-sm rounded ${
                showPreview
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {showPreview ? (
          <div className="min-h-[120px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
            {content.trim() ? (
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">Nothing to preview</p>
            )}
          </div>
        ) : (
          <textarea
            id="reply-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
        )}

        {/* Character Count */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div>
            {content.length}/2000 characters
          </div>
          <div className="text-xs">
            Supports basic markdown: **bold**, *italic*, [links](url), &gt; quotes, - lists
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={!content.trim() || isSubmitting || content.length > 2000}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Posting...' : 'Post Reply'}
          </Button>
        </div>
      </form>
    </Card>
  );
}