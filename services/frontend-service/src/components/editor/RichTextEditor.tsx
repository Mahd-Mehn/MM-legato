'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  Eye,
  Save,
  Undo,
  Redo,
  Type,
  Palette
} from 'lucide-react';
import Button from '@/components/Button';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  showPreview?: boolean;
  className?: string;
}

interface EditorState {
  content: string;
  history: string[];
  historyIndex: number;
  isPreview: boolean;
  wordCount: number;
  characterCount: number;
}

export default function RichTextEditor({
  content,
  onChange,
  onSave,
  placeholder = "Start writing your story...",
  autoSave = true,
  autoSaveInterval = 30000, // 30 seconds
  showPreview = true,
  className = "",
}: RichTextEditorProps) {
  const [editorState, setEditorState] = useState<EditorState>({
    content,
    history: [content],
    historyIndex: 0,
    isPreview: false,
    wordCount: 0,
    characterCount: 0,
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Update word and character count
  useEffect(() => {
    const text = editorState.content.replace(/<[^>]*>/g, '');
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    
    setEditorState(prev => ({
      ...prev,
      wordCount: words,
      characterCount: characters,
    }));
  }, [editorState.content]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && editorState.content !== content) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        onChange(editorState.content);
        if (onSave) onSave();
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editorState.content, autoSave, autoSaveInterval, onChange, onSave, content]);

  const updateContent = (newContent: string) => {
    setEditorState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newContent);
      
      return {
        ...prev,
        content: newContent,
        history: newHistory.slice(-50), // Keep last 50 states
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    });
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      updateContent(editorRef.current.innerHTML);
    }
  };

  const handleUndo = () => {
    if (editorState.historyIndex > 0) {
      const newIndex = editorState.historyIndex - 1;
      const newContent = editorState.history[newIndex];
      
      setEditorState(prev => ({
        ...prev,
        content: newContent,
        historyIndex: newIndex,
      }));
      
      if (editorRef.current) {
        editorRef.current.innerHTML = newContent;
      }
    }
  };

  const handleRedo = () => {
    if (editorState.historyIndex < editorState.history.length - 1) {
      const newIndex = editorState.historyIndex + 1;
      const newContent = editorState.history[newIndex];
      
      setEditorState(prev => ({
        ...prev,
        content: newContent,
        historyIndex: newIndex,
      }));
      
      if (editorRef.current) {
        editorRef.current.innerHTML = newContent;
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      updateContent(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      executeCommand('insertImage', url);
    }
  };

  const togglePreview = () => {
    setEditorState(prev => ({
      ...prev,
      isPreview: !prev.isPreview,
    }));
  };

  const toolbarButtons = [
    { icon: <Undo className="w-4 h-4" />, command: 'undo', action: handleUndo, title: 'Undo' },
    { icon: <Redo className="w-4 h-4" />, command: 'redo', action: handleRedo, title: 'Redo' },
    { type: 'separator' },
    { icon: <Bold className="w-4 h-4" />, command: 'bold', title: 'Bold' },
    { icon: <Italic className="w-4 h-4" />, command: 'italic', title: 'Italic' },
    { icon: <Underline className="w-4 h-4" />, command: 'underline', title: 'Underline' },
    { type: 'separator' },
    { icon: <AlignLeft className="w-4 h-4" />, command: 'justifyLeft', title: 'Align Left' },
    { icon: <AlignCenter className="w-4 h-4" />, command: 'justifyCenter', title: 'Align Center' },
    { icon: <AlignRight className="w-4 h-4" />, command: 'justifyRight', title: 'Align Right' },
    { type: 'separator' },
    { icon: <List className="w-4 h-4" />, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: <ListOrdered className="w-4 h-4" />, command: 'insertOrderedList', title: 'Numbered List' },
    { icon: <Quote className="w-4 h-4" />, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
    { type: 'separator' },
    { icon: <Link className="w-4 h-4" />, action: insertLink, title: 'Insert Link' },
    { icon: <Image className="w-4 h-4" />, action: insertImage, title: 'Insert Image' },
    { icon: <Code className="w-4 h-4" />, command: 'formatBlock', value: 'pre', title: 'Code Block' },
  ];

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {toolbarButtons.map((button, index) => {
              if (button.type === 'separator') {
                return <div key={index} className="w-px h-6 bg-gray-300 mx-2" />;
              }
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (button.action) {
                      button.action();
                    } else if (button.command) {
                      executeCommand(button.command, button.value);
                    }
                  }}
                  className="p-2 rounded hover:bg-gray-200 transition-colors"
                  title={button.title}
                >
                  {button.icon}
                </button>
              );
            })}
          </div>
          
          <div className="flex items-center space-x-2">
            {showPreview && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Eye className="w-4 h-4" />}
                onClick={togglePreview}
              >
                {editorState.isPreview ? 'Edit' : 'Preview'}
              </Button>
            )}
            {onSave && (
              <Button
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={onSave}
              >
                Save
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="relative">
        {editorState.isPreview ? (
          <div 
            className="p-6 min-h-96 prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: editorState.content }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="p-6 min-h-96 focus:outline-none"
            style={{ minHeight: '400px' }}
            dangerouslySetInnerHTML={{ __html: editorState.content }}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>{editorState.wordCount} words</span>
          <span>{editorState.characterCount} characters</span>
          {autoSave && (
            <span className="text-green-600">Auto-save enabled</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span>Last saved: Just now</span>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .prose pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
        }
        
        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        
        .prose a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .prose ul, .prose ol {
          padding-left: 1.5rem;
        }
        
        .prose li {
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}