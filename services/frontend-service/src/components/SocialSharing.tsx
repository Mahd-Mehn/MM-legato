'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, 
  Copy, 
  Twitter, 
  Facebook, 
  MessageCircle, 
  Mail, 
  Link, 
  CheckCircle,
  X,
  Download,
  Bookmark,
  Heart
} from 'lucide-react';

interface SocialSharingProps {
  isOpen: boolean;
  onClose: () => void;
  storyTitle: string;
  chapterTitle?: string;
  storyId: string;
  chapterId?: string;
  authorName: string;
}

export default function SocialSharing({
  isOpen,
  onClose,
  storyTitle,
  chapterTitle,
  storyId,
  chapterId,
  authorName
}: SocialSharingProps) {
  const [copied, setCopied] = useState(false);
  const [shareStats, setShareStats] = useState({
    shares: 1247,
    likes: 8934,
    bookmarks: 2156
  });

  const shareUrl = chapterId 
    ? `${window.location.origin}/stories/${storyId}/chapters/${chapterId}`
    : `${window.location.origin}/stories/${storyId}`;

  const shareText = chapterTitle 
    ? `Just read "${chapterTitle}" from "${storyTitle}" by ${authorName}. Amazing chapter! 📚✨`
    : `Currently reading "${storyTitle}" by ${authorName}. Highly recommend! 📚✨`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this story: ${storyTitle}`);
    const body = encodeURIComponent(`${shareText}\n\nRead it here: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copied ? CheckCircle : Copy,
      action: copyToClipboard,
      color: copied ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100',
      label: copied ? 'Copied!' : 'Copy Link'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      action: shareToTwitter,
      color: 'text-blue-500 bg-blue-100'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      action: shareToFacebook,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      action: shareToWhatsApp,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'Email',
      icon: Mail,
      action: shareViaEmail,
      color: 'text-gray-600 bg-gray-100'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-xl">
                  <Share2 className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-reading-text font-crimson">Share Story</h2>
                  <p className="text-reading-muted text-sm">Spread the word about this amazing story</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Story Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
              <h3 className="font-semibold text-reading-text mb-1 line-clamp-2">{storyTitle}</h3>
              {chapterTitle && (
                <p className="text-sm text-reading-muted mb-2">{chapterTitle}</p>
              )}
              <p className="text-sm text-reading-muted">by {authorName}</p>
            </div>
          </div>

          {/* Share Options */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3 mb-6">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.action}
                  className={`flex items-center gap-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                >
                  <div className={`p-2 rounded-lg ${option.color}`}>
                    <option.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-reading-text">
                    {option.label || option.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Share Stats */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
              <h4 className="font-semibold text-reading-text mb-3">Story Engagement</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary-600 mb-1">
                    <Share2 className="w-4 h-4" />
                    <span className="font-bold">{shareStats.shares.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-600">Shares</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                    <Heart className="w-4 h-4" />
                    <span className="font-bold">{shareStats.likes.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-600">Likes</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                    <Bookmark className="w-4 h-4" />
                    <span className="font-bold">{shareStats.bookmarks.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-600">Bookmarks</div>
                </div>
              </div>
            </div>

            {/* URL Preview */}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate">
                  {shareUrl}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}