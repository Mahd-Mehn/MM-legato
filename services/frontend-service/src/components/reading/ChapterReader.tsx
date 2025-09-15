'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    BookOpen,
    Settings,
    Bookmark,
    BookmarkCheck,
    ArrowLeft,
    ArrowRight,
    Play,
    Pause,
    Volume2,
    VolumeX,
    SkipBack,
    SkipForward,
    List,
    MessageCircle,
    Share2,
    Eye,
    EyeOff,
    Maximize,
    Minimize,
    Moon,
    Sun,
    Type,
    Palette,
    RotateCcw,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReadingSettings } from './ReadingSettings';
import { ReadingProgress } from './ReadingProgress';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useOfflineContent } from '@/hooks/useOfflineContent';

interface Chapter {
    id: string;
    title: string;
    content: string;
    storyId: string;
    chapterNumber: number;
    wordCount: number;
    audioUrl?: string;
    estimatedReadTime?: number;
}

type FontSize = 'reading-sm' | 'reading-base' | 'reading-lg' | 'reading-xl' | 'reading-2xl';
type FontFamily = 'serif' | 'sans' | 'mono';
type Theme = 'light' | 'dark' | 'sepia' | 'night' | 'paper';
type LineHeight = 'tight' | 'normal' | 'relaxed' | 'loose';

interface ReadingSettings {
    fontSize: FontSize;
    fontFamily: FontFamily;
    theme: Theme;
    lineHeight: LineHeight;
    textAlign: 'left' | 'center' | 'justify';
    columnWidth: 'narrow' | 'medium' | 'wide' | 'full';
    margins: 'small' | 'medium' | 'large';
    showProgress: boolean;
    autoScroll: boolean;
    scrollSpeed: number;
}

interface ChapterReaderProps {
    chapter: Chapter;
    onNavigate?: (direction: 'prev' | 'next') => void;
    hasNext?: boolean;
    hasPrev?: boolean;
    chapters?: Chapter[];
}

export function ChapterReader({
    chapter,
    onNavigate,
    hasNext = false,
    hasPrev = false,
    chapters = []
}: ChapterReaderProps) {
    // UI State
    const [showSettings, setShowSettings] = useState(false);
    const [showChapterList, setShowChapterList] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showUI, setShowUI] = useState(true);

    // Reading Settings
    const [readingSettings, setReadingSettings] = useState<ReadingSettings>({
        fontSize: 'reading-base',
        fontFamily: 'serif',
        theme: 'light',
        lineHeight: 'normal',
        textAlign: 'left',
        columnWidth: 'medium',
        margins: 'medium',
        showProgress: true,
        autoScroll: false,
        scrollSpeed: 1,
    });

    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [currentHighlight, setCurrentHighlight] = useState<number | null>(null);

    // Auto-scroll State
    const [autoScrolling, setAutoScrolling] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(1);

    // Refs
    const contentRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const autoScrollRef = useRef<number | null>(null);
    const uiTimeoutRef = useRef<number | null>(null);

    const {
        progress,
        updateProgress,
        saveBookmark,
        loadBookmark
    } = useReadingProgress(chapter.id);

    const {
        isOffline,
        saveForOffline,
        isContentCached
    } = useOfflineContent();

    // Auto-hide UI functionality
    const resetUITimeout = useCallback(() => {
        if (uiTimeoutRef.current) {
            clearTimeout(uiTimeoutRef.current);
        }
        setShowUI(true);
        uiTimeoutRef.current = window.setTimeout(() => {
            if (!showSettings && !showChapterList && !showComments) {
                setShowUI(false);
            }
        }, 3000);
    }, [showSettings, showChapterList, showComments]);

    // Auto-scroll functionality
    const startAutoScroll = useCallback(() => {
        if (autoScrollRef.current) return;

        setAutoScrolling(true);
        const scroll = () => {
            if (contentRef.current) {
                contentRef.current.scrollBy(0, scrollSpeed);
                autoScrollRef.current = requestAnimationFrame(scroll);
            }
        };
        autoScrollRef.current = requestAnimationFrame(scroll);
    }, [scrollSpeed]);

    const stopAutoScroll = useCallback(() => {
        if (autoScrollRef.current) {
            cancelAnimationFrame(autoScrollRef.current);
            autoScrollRef.current = null;
        }
        setAutoScrolling(false);
    }, []);

    // Audio playback functionality
    const toggleAudioPlayback = useCallback(() => {
        if (!audioRef.current || !chapter.audioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    }, [isPlaying, chapter.audioUrl]);

    const toggleMute = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    }, [isMuted]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    if (chapter.audioUrl) {
                        toggleAudioPlayback();
                    } else {
                        readingSettings.autoScroll ? stopAutoScroll() : startAutoScroll();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (hasPrev) onNavigate?.('prev');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (hasNext) onNavigate?.('next');
                    break;
                case 'f':
                    e.preventDefault();
                    setIsFullscreen(!isFullscreen);
                    break;
                case 's':
                    e.preventDefault();
                    setShowSettings(!showSettings);
                    break;
                case 'b':
                    e.preventDefault();
                    handleBookmark();
                    break;
                case 'Escape':
                    e.preventDefault();
                    setShowSettings(false);
                    setShowChapterList(false);
                    setShowComments(false);
                    setIsFullscreen(false);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [
        toggleAudioPlayback,
        startAutoScroll,
        stopAutoScroll,
        readingSettings.autoScroll,
        chapter.audioUrl,
        hasPrev,
        hasNext,
        onNavigate,
        isFullscreen,
        showSettings
    ]);

    // Mouse movement detection for UI auto-hide
    useEffect(() => {
        const handleMouseMove = () => resetUITimeout();
        const handleMouseLeave = () => {
            if (uiTimeoutRef.current) {
                clearTimeout(uiTimeoutRef.current);
            }
            setShowUI(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            if (uiTimeoutRef.current) {
                clearTimeout(uiTimeoutRef.current);
            }
        };
    }, [resetUITimeout]);

    // Load saved reading position and settings
    useEffect(() => {
        const savedPosition = loadBookmark();
        if (savedPosition && contentRef.current) {
            contentRef.current.scrollTop = savedPosition.scrollPosition;
        }

        // Load saved reading settings
        const savedSettings = localStorage.getItem('readingSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setReadingSettings(prev => ({ ...prev, ...parsed }));
            } catch (error) {
                console.error('Failed to load reading settings:', error);
            }
        }
    }, [chapter.id, loadBookmark]);

    // Save reading settings
    useEffect(() => {
        localStorage.setItem('readingSettings', JSON.stringify(readingSettings));
    }, [readingSettings]);

    // Track reading progress
    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            const progressPercent = Math.min(
                Math.round((scrollTop / (scrollHeight - clientHeight)) * 100),
                100
            );

            updateProgress(progressPercent);
            resetUITimeout();

            // Auto-save bookmark every 5% progress
            if (progressPercent % 5 === 0) {
                saveBookmark({
                    chapterId: chapter.id,
                    progress: progressPercent,
                    scrollPosition: scrollTop,
                    timestamp: Date.now()
                });
            }
        };

        const contentElement = contentRef.current;
        if (contentElement) {
            contentElement.addEventListener('scroll', handleScroll, { passive: true });
            return () => contentElement.removeEventListener('scroll', handleScroll);
        }
    }, [chapter.id, updateProgress, saveBookmark, resetUITimeout]);

    // Audio synchronization
    useEffect(() => {
        if (!audioRef.current || !chapter.audioUrl) return;

        const audio = audioRef.current;

        const handleTimeUpdate = () => {
            const currentTime = audio.currentTime;
            const duration = audio.duration;
            if (duration) {
                setAudioProgress((currentTime / duration) * 100);

                // Sync text highlighting with audio (mock implementation)
                const wordIndex = Math.floor((currentTime / duration) * 1000);
                setCurrentHighlight(wordIndex);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setAudioProgress(0);
            setCurrentHighlight(null);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [chapter.audioUrl]);

    // Save chapter for offline reading
    useEffect(() => {
        if (!isContentCached(chapter.id)) {
            saveForOffline(chapter);
        }
    }, [chapter, saveForOffline, isContentCached]);

    // Fullscreen handling
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handleBookmark = () => {
        const currentProgress = contentRef.current?.scrollTop || 0;
        saveBookmark({
            chapterId: chapter.id,
            progress,
            scrollPosition: currentProgress,
            timestamp: Date.now()
        });
        setIsBookmarked(true);
        setTimeout(() => setIsBookmarked(false), 2000);
    };

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    };

    const updateReadingSettings = (updates: Partial<ReadingSettings>) => {
        setReadingSettings(prev => ({ ...prev, ...updates }));
    };

    const themeClasses: Record<Theme, string> = {
        light: 'bg-white text-gray-900',
        dark: 'bg-gray-900 text-gray-100',
        sepia: 'bg-amber-50 text-amber-900',
        night: 'bg-black text-green-400',
        paper: 'bg-gray-50 text-gray-800'
    };

    const fontSizeClasses: Record<FontSize, string> = {
        'reading-sm': 'text-sm',
        'reading-base': 'text-base',
        'reading-lg': 'text-lg',
        'reading-xl': 'text-xl',
        'reading-2xl': 'text-2xl'
    };

    const fontFamilyClasses: Record<FontFamily, string> = {
        serif: 'font-serif',
        sans: 'font-sans',
        mono: 'font-mono'
    };

    const lineHeightClasses: Record<LineHeight, string> = {
        tight: 'leading-tight',
        normal: 'leading-normal',
        relaxed: 'leading-relaxed',
        loose: 'leading-loose'
    };

    const columnWidthClasses: Record<string, string> = {
        narrow: 'max-w-2xl',
        medium: 'max-w-4xl',
        wide: 'max-w-6xl',
        full: 'max-w-none'
    };

    const marginClasses: Record<string, string> = {
        small: 'px-4 py-6',
        medium: 'px-6 py-8',
        large: 'px-8 py-12'
    };

    return (
        <div className={`min-h-screen ${themeClasses[readingSettings.theme]} transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
            {/* Audio Element */}
            {chapter.audioUrl && (
                <audio
                    ref={audioRef}
                    src={chapter.audioUrl}
                    preload="metadata"
                    onLoadedMetadata={() => {
                        if (audioRef.current) {
                            audioRef.current.playbackRate = playbackRate;
                        }
                    }}
                />
            )}

            {/* Enhanced Header */}
            <AnimatePresence>
                {showUI && (
                    <motion.header
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-40 bg-inherit/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-3">
                                <BookOpen className="w-6 h-6 text-primary-600" />
                                <div>
                                    <h1 className="font-semibold text-sm truncate max-w-48 font-crimson">
                                        {chapter.title}
                                    </h1>
                                    <p className="text-xs text-gray-500">
                                        Chapter {chapter.chapterNumber} • {chapter.wordCount} words
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                {isOffline && (
                                    <div className="w-2 h-2 bg-orange-500 rounded-full" title="Offline mode" />
                                )}

                                {/* Chapter List Button */}
                                <button
                                    onClick={() => setShowChapterList(!showChapterList)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Chapter list"
                                >
                                    <List className="w-5 h-5" />
                                </button>

                                {/* Comments Button */}
                                <button
                                    onClick={() => setShowComments(!showComments)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Comments"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                </button>

                                {/* Share Button */}
                                <button
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Share"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>

                                {/* Bookmark Button */}
                                <button
                                    onClick={handleBookmark}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Bookmark"
                                >
                                    {isBookmarked ? (
                                        <BookmarkCheck className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Bookmark className="w-5 h-5" />
                                    )}
                                </button>

                                {/* Fullscreen Toggle */}
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Fullscreen"
                                >
                                    {isFullscreen ? (
                                        <Minimize className="w-5 h-5" />
                                    ) : (
                                        <Maximize className="w-5 h-5" />
                                    )}
                                </button>

                                {/* Settings Button */}
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Settings"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {readingSettings.showProgress && <ReadingProgress progress={progress} />}
                    </motion.header>
                )}
            </AnimatePresence>

            {/* Audio Controls */}
            {chapter.audioUrl && (
                <AnimatePresence>
                    {showUI && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="fixed bottom-20 left-4 right-4 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => {
                                            if (audioRef.current) {
                                                audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
                                            }
                                        }}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <SkipBack className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={toggleAudioPlayback}
                                        className="p-3 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-6 h-6" />
                                        ) : (
                                            <Play className="w-6 h-6" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (audioRef.current) {
                                                audioRef.current.currentTime = Math.min(
                                                    audioRef.current.duration,
                                                    audioRef.current.currentTime + 10
                                                );
                                            }
                                        }}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <SkipForward className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={toggleMute}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        {isMuted ? (
                                            <VolumeX className="w-5 h-5" />
                                        ) : (
                                            <Volume2 className="w-5 h-5" />
                                        )}
                                    </button>

                                    <select
                                        value={playbackRate}
                                        onChange={(e) => {
                                            const rate = parseFloat(e.target.value);
                                            setPlaybackRate(rate);
                                            if (audioRef.current) {
                                                audioRef.current.playbackRate = rate;
                                            }
                                        }}
                                        className="text-sm bg-transparent border border-gray-300 rounded px-2 py-1"
                                    >
                                        <option value={0.5}>0.5x</option>
                                        <option value={0.75}>0.75x</option>
                                        <option value={1}>1x</option>
                                        <option value={1.25}>1.25x</option>
                                        <option value={1.5}>1.5x</option>
                                        <option value={2}>2x</option>
                                    </select>
                                </div>
                            </div>

                            {/* Audio Progress */}
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${audioProgress}%` }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Enhanced Reading Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <EnhancedReadingSettings
                        settings={readingSettings}
                        onSettingsChange={updateReadingSettings}
                        onClose={() => setShowSettings(false)}
                        autoScrolling={autoScrolling}
                        onToggleAutoScroll={() => autoScrolling ? stopAutoScroll() : startAutoScroll()}
                        scrollSpeed={scrollSpeed}
                        onScrollSpeedChange={setScrollSpeed}
                    />
                )}
            </AnimatePresence>

            {/* Chapter List Panel */}
            <AnimatePresence>
                {showChapterList && (
                    <ChapterListPanel
                        chapters={chapters}
                        currentChapter={chapter}
                        onChapterSelect={(chapterId) => {
                            // Navigate to selected chapter
                            setShowChapterList(false);
                        }}
                        onClose={() => setShowChapterList(false)}
                    />
                )}
            </AnimatePresence>

            {/* Chapter Content */}
            <main
                ref={contentRef}
                className={`reading-content overflow-y-auto transition-all duration-300 ${showUI ? 'pt-24 pb-20' : 'pt-4 pb-4'
                    }`}
                style={{ height: '100vh' }}
                onClick={resetUITimeout}
            >
                <article className={`
                    ${fontSizeClasses[readingSettings.fontSize]}
                    ${fontFamilyClasses[readingSettings.fontFamily]}
                    ${lineHeightClasses[readingSettings.lineHeight]}
                    ${columnWidthClasses[readingSettings.columnWidth]}
                    ${marginClasses[readingSettings.margins]}
                    mx-auto
                    ${readingSettings.textAlign === 'center' ? 'text-center' :
                        readingSettings.textAlign === 'justify' ? 'text-justify' : 'text-left'}
                `}>
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold mb-4 font-crimson">{chapter.title}</h1>
                        <div className="flex items-center text-sm text-gray-500 space-x-4 flex-wrap">
                            <span>Chapter {chapter.chapterNumber}</span>
                            <span>{chapter.wordCount.toLocaleString()} words</span>
                            <span>~{chapter.estimatedReadTime || Math.ceil(chapter.wordCount / 200)} min read</span>
                            {chapter.audioUrl && <span>Audio available</span>}
                        </div>
                    </header>

                    <div
                        className={`prose prose-lg max-w-none ${readingSettings.theme === 'dark' ? 'prose-invert' : ''
                            }`}
                        dangerouslySetInnerHTML={{ __html: chapter.content }}
                    />
                </article>
            </main>

            {/* Navigation Footer */}
            <AnimatePresence>
                {showUI && (
                    <motion.footer
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-40 bg-inherit/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between p-4">
                            <button
                                onClick={() => onNavigate?.('prev')}
                                disabled={!hasPrev}
                                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-primary-600 text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Previous</span>
                            </button>

                            <div className="text-center">
                                <div className="text-sm text-gray-500 mb-1">
                                    {progress}% complete
                                </div>
                                {autoScrolling && (
                                    <div className="text-xs text-primary-600 flex items-center gap-1">
                                        <RotateCcw className="w-3 h-3 animate-spin" />
                                        Auto-scrolling
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => onNavigate?.('next')}
                                disabled={!hasNext}
                                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-primary-600 text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-medium"
                            >
                                <span>Next</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.footer>
                )}
            </AnimatePresence>
        </div>
    );
}
// Enhanced Reading Settings Component
function EnhancedReadingSettings({
    settings,
    onSettingsChange,
    onClose,
    autoScrolling,
    onToggleAutoScroll,
    scrollSpeed,
    onScrollSpeedChange
}: {
    settings: ReadingSettings;
    onSettingsChange: (updates: Partial<ReadingSettings>) => void;
    onClose: () => void;
    autoScrolling: boolean;
    onToggleAutoScroll: () => void;
    scrollSpeed: number;
    onScrollSpeedChange: (speed: number) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold font-crimson">Reading Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Typography */}
                    <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Type className="w-5 h-5" />
                            Typography
                        </h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Font Size */}
                            <div>
                                <label className="block text-sm font-medium mb-3">Font Size</label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'reading-sm', label: 'Small' },
                                        { value: 'reading-base', label: 'Medium' },
                                        { value: 'reading-lg', label: 'Large' },
                                        { value: 'reading-xl', label: 'Extra Large' },
                                        { value: 'reading-2xl', label: 'Huge' },
                                    ].map(size => (
                                        <button
                                            key={size.value}
                                            onClick={() => onSettingsChange({ fontSize: size.value as FontSize })}
                                            className={`w-full p-3 rounded-lg border text-left transition-colors ${settings.fontSize === size.value
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {size.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font Family */}
                            <div>
                                <label className="block text-sm font-medium mb-3">Font Family</label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'serif', label: 'Serif', example: 'Times New Roman' },
                                        { value: 'sans', label: 'Sans Serif', example: 'Arial' },
                                        { value: 'mono', label: 'Monospace', example: 'Courier' },
                                    ].map(font => (
                                        <button
                                            key={font.value}
                                            onClick={() => onSettingsChange({ fontFamily: font.value as FontFamily })}
                                            className={`w-full p-3 rounded-lg border text-left transition-colors ${settings.fontFamily === font.value
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="font-medium">{font.label}</div>
                                            <div className={`text-sm text-gray-500 ${font.value === 'serif' ? 'font-serif' :
                                                font.value === 'mono' ? 'font-mono' : 'font-sans'
                                                }`}>
                                                {font.example}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Line Height */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium mb-3">Line Height</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { value: 'tight', label: 'Tight' },
                                    { value: 'normal', label: 'Normal' },
                                    { value: 'relaxed', label: 'Relaxed' },
                                    { value: 'loose', label: 'Loose' },
                                ].map(height => (
                                    <button
                                        key={height.value}
                                        onClick={() => onSettingsChange({ lineHeight: height.value as LineHeight })}
                                        className={`p-2 rounded-lg border text-sm transition-colors ${settings.lineHeight === height.value
                                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {height.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Theme */}
                    <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            Theme
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { value: 'light', label: 'Light', bg: 'bg-white', text: 'text-gray-900' },
                                { value: 'dark', label: 'Dark', bg: 'bg-gray-900', text: 'text-gray-100' },
                                { value: 'sepia', label: 'Sepia', bg: 'bg-amber-50', text: 'text-amber-900' },
                                { value: 'night', label: 'Night', bg: 'bg-black', text: 'text-green-400' },
                                { value: 'paper', label: 'Paper', bg: 'bg-gray-50', text: 'text-gray-800' },
                            ].map(theme => (
                                <button
                                    key={theme.value}
                                    onClick={() => onSettingsChange({ theme: theme.value as Theme })}
                                    className={`p-3 rounded-lg border transition-colors ${settings.theme === theme.value
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`w-full h-8 rounded mb-2 ${theme.bg} border border-gray-300`} />
                                    <div className="text-sm font-medium">{theme.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Layout */}
                    <div>
                        <h3 className="font-semibold mb-4">Layout</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Column Width */}
                            <div>
                                <label className="block text-sm font-medium mb-3">Column Width</label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'narrow', label: 'Narrow' },
                                        { value: 'medium', label: 'Medium' },
                                        { value: 'wide', label: 'Wide' },
                                        { value: 'full', label: 'Full Width' },
                                    ].map(width => (
                                        <button
                                            key={width.value}
                                            onClick={() => onSettingsChange({ columnWidth: width.value as 'narrow' | 'medium' | 'wide' | 'full' })}
                                            className={`w-full p-2 rounded-lg border text-sm transition-colors ${settings.columnWidth === width.value
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {width.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Text Alignment */}
                            <div>
                                <label className="block text-sm font-medium mb-3">Text Alignment</label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'left', label: 'Left' },
                                        { value: 'center', label: 'Center' },
                                        { value: 'justify', label: 'Justify' },
                                    ].map(align => (
                                        <button
                                            key={align.value}
                                            onClick={() => onSettingsChange({ textAlign: align.value as any })}
                                            className={`w-full p-2 rounded-lg border text-sm transition-colors ${settings.textAlign === align.value
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {align.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Auto-scroll */}
                    <div>
                        <h3 className="font-semibold mb-4">Auto-scroll</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Enable Auto-scroll</div>
                                    <div className="text-sm text-gray-500">Automatically scroll through the chapter</div>
                                </div>
                                <button
                                    onClick={onToggleAutoScroll}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoScrolling ? 'bg-primary-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoScrolling ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {autoScrolling && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Scroll Speed: {scrollSpeed}x
                                    </label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="3"
                                        step="0.1"
                                        value={scrollSpeed}
                                        onChange={(e) => onScrollSpeedChange(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Other Settings */}
                    <div>
                        <h3 className="font-semibold mb-4">Other Settings</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Show Progress Bar</div>
                                    <div className="text-sm text-gray-500">Display reading progress at the top</div>
                                </div>
                                <button
                                    onClick={() => onSettingsChange({ showProgress: !settings.showProgress })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.showProgress ? 'bg-primary-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showProgress ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => {
                                // Reset to defaults
                                onSettingsChange({
                                    fontSize: 'reading-base',
                                    fontFamily: 'serif',
                                    theme: 'light',
                                    lineHeight: 'normal',
                                    textAlign: 'left',
                                    columnWidth: 'medium',
                                    margins: 'medium',
                                    showProgress: true,
                                    autoScroll: false,
                                    scrollSpeed: 1,
                                });
                            }}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Reset to defaults
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Chapter List Panel Component
function ChapterListPanel({
    chapters,
    currentChapter,
    onChapterSelect,
    onClose
}: {
    chapters: Chapter[];
    currentChapter: Chapter;
    onChapterSelect: (chapterId: string) => void;
    onClose: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold font-crimson">Chapters</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[60vh]">
                    {chapters.map((chapter, index) => (
                        <button
                            key={chapter.id}
                            onClick={() => onChapterSelect(chapter.id)}
                            className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${chapter.id === currentChapter.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-sm mb-1">
                                        Chapter {chapter.chapterNumber}
                                    </div>
                                    <div className="text-gray-900 dark:text-gray-100 font-semibold mb-1 line-clamp-2">
                                        {chapter.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {chapter.wordCount.toLocaleString()} words
                                    </div>
                                </div>
                                {chapter.id === currentChapter.id && (
                                    <div className="w-2 h-2 bg-primary-500 rounded-full ml-3" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}