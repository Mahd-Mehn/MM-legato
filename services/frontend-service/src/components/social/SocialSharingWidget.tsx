'use client';

import { useState } from 'react';
import { Share2, Facebook, Twitter, Linkedin, Link, MessageCircle, Mail, Copy, Check } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';

interface SocialSharingWidgetProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  hashtags?: string[];
  via?: string; // Twitter handle
  className?: string;
}

interface SharePlatform {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  getShareUrl: (props: SocialSharingWidgetProps) => string;
}

const sharePlatforms: SharePlatform[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: 'bg-blue-500 hover:bg-blue-600',
    getShareUrl: ({ url, title, hashtags, via }) => {
      const params = new URLSearchParams({
        url,
        text: title,
        ...(hashtags && { hashtags: hashtags.join(',') }),
        ...(via && { via })
      });
      return `https://twitter.com/intent/tweet?${params}`;
    }
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600 hover:bg-blue-700',
    getShareUrl: ({ url }) => {
      const params = new URLSearchParams({ u: url });
      return `https://www.facebook.com/sharer/sharer.php?${params}`;
    }
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700 hover:bg-blue-800',
    getShareUrl: ({ url, title, description }) => {
      const params = new URLSearchParams({
        url,
        title,
        ...(description && { summary: description })
      });
      return `https://www.linkedin.com/sharing/share-offsite/?${params}`;
    }
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-500 hover:bg-green-600',
    getShareUrl: ({ url, title }) => {
      const text = `${title} ${url}`;
      return `https://wa.me/?text=${encodeURIComponent(text)}`;
    }
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    color: 'bg-gray-600 hover:bg-gray-700',
    getShareUrl: ({ url, title, description }) => {
      const params = new URLSearchParams({
        subject: title,
        body: `${description || title}\n\n${url}`
      });
      return `mailto:?${params}`;
    }
  }
];

export default function SocialSharingWidget({
  url,
  title,
  description,
  image,
  hashtags,
  via,
  className = ''
}: SocialSharingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async (platform: SharePlatform) => {
    const shareUrl = platform.getShareUrl({ url, title, description, image, hashtags, via });
    
    if (platform.id === 'email') {
      if (typeof window !== 'undefined') {
        window.location.href = shareUrl;
      }
    } else {
      if (typeof window !== 'undefined') {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    }
    
    setIsOpen(false);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as any).share({
          title,
          text: description,
          url
        });
      } catch (error) {
        console.error('Native share failed:', error);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
        await (navigator as any).clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Share Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </Button>

      {/* Share Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share Panel */}
          <Card className="absolute top-full right-0 mt-2 w-80 z-50 p-4">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Share this story
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  ×
                </Button>
              </div>

              {/* Story Preview */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  {image && (
                    <img
                      src={image}
                      alt={title}
                      className="w-12 h-16 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                      {title}
                    </h4>
                    {description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Native Share (if available) */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleNativeShare}
                  className="flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share via...</span>
                </Button>
              )}

              {/* Platform Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {sharePlatforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => handleShare(platform)}
                      className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors ${platform.color}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{platform.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Copy Link */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 truncate">
                    {url}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex items-center space-x-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Hashtags */}
              {hashtags && hashtags.length > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Suggested hashtags:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {hashtags.map((hashtag) => (
                      <span
                        key={hashtag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
                            (navigator as any).clipboard.writeText(`#${hashtag}`);
                          }
                        }}
                      >
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}