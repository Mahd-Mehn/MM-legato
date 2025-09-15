'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  Flag,
  X,
  RefreshCw
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

interface ContentModerationProps {
  storyId: string;
  chapters: Chapter[];
  onApprovalStatusChange: (chapterId: string, status: ModerationStatus) => void;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  moderationStatus: ModerationStatus;
  moderationNotes?: string;
  flaggedContent?: FlaggedContent[];
}

interface ModerationStatus {
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  reviewedAt?: Date;
  reviewedBy?: string;
  reason?: string;
}

interface FlaggedContent {
  type: 'language' | 'violence' | 'adult_content' | 'copyright' | 'spam';
  severity: 'low' | 'medium' | 'high';
  description: string;
  position: number;
  suggestion?: string;
}

export default function ContentModeration({
  storyId,
  chapters,
  onApprovalStatusChange,
}: ContentModerationProps) {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoScanResults, setAutoScanResults] = useState<Record<string, FlaggedContent[]>>({});

  useEffect(() => {
    // Simulate auto-scan results
    const mockResults: Record<string, FlaggedContent[]> = {};
    chapters.forEach(chapter => {
      mockResults[chapter.id] = [
        {
          type: 'language',
          severity: 'low',
          description: 'Mild profanity detected',
          position: 150,
          suggestion: 'Consider using alternative language for broader audience appeal',
        },
      ];
    });
    setAutoScanResults(mockResults);
  }, [chapters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'needs_review':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending':
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <X className="w-4 h-4" />;
      case 'needs_review':
        return <AlertTriangle className="w-4 h-4" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const handleStatusChange = async (chapterId: string, newStatus: 'approved' | 'rejected' | 'needs_review') => {
    setLoading(true);
    try {
      const status: ModerationStatus = {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: 'current_user',
        reason: newStatus === 'rejected' ? 'Content violates community guidelines' : undefined,
      };
      
      onApprovalStatusChange(chapterId, status);
    } finally {
      setLoading(false);
    }
  };

  const runAutoScan = async (chapterId: string) => {
    setLoading(true);
    try {
      // Simulate API call for content scanning
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock scan results
      const mockFlags: FlaggedContent[] = [
        {
          type: 'language',
          severity: 'low',
          description: 'Mild profanity detected',
          position: 150,
          suggestion: 'Consider using alternative language',
        },
        {
          type: 'violence',
          severity: 'medium',
          description: 'Graphic violence description',
          position: 450,
          suggestion: 'Add content warning or tone down description',
        },
      ];
      
      setAutoScanResults(prev => ({
        ...prev,
        [chapterId]: mockFlags,
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Content Moderation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                    <p className="text-sm text-gray-500">{chapter.wordCount} words</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chapter.moderationStatus.status)}`}>
                      {getStatusIcon(chapter.moderationStatus.status)}
                      <span className="ml-1 capitalize">{chapter.moderationStatus.status.replace('_', ' ')}</span>
                    </span>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runAutoScan(chapter.id)}
                      loading={loading}
                      leftIcon={<RefreshCw className="w-3 h-3" />}
                    >
                      Scan
                    </Button>
                  </div>
                </div>

                {/* Flagged Content */}
                {autoScanResults[chapter.id] && autoScanResults[chapter.id].length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Flagged Content</h4>
                    <div className="space-y-2">
                      {autoScanResults[chapter.id].map((flag, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Flag className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {flag.type.replace('_', ' ')}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(flag.severity)}`}>
                                {flag.severity}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">Position: {flag.position}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{flag.description}</p>
                          {flag.suggestion && (
                            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                              <strong>Suggestion:</strong> {flag.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Moderation Actions */}
                {chapter.moderationStatus.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(chapter.id, 'approved')}
                      leftIcon={<CheckCircle className="w-4 h-4" />}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(chapter.id, 'needs_review')}
                      leftIcon={<AlertTriangle className="w-4 h-4" />}
                      className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                    >
                      Needs Review
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(chapter.id, 'rejected')}
                      leftIcon={<X className="w-4 h-4" />}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {/* Moderation Notes */}
                {chapter.moderationStatus.reason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Reason:</strong> {chapter.moderationStatus.reason}
                    </p>
                  </div>
                )}

                {chapter.moderationStatus.reviewedAt && (
                  <div className="mt-2 text-xs text-gray-500">
                    Reviewed on {chapter.moderationStatus.reviewedAt.toLocaleDateString()} 
                    {chapter.moderationStatus.reviewedBy && ` by ${chapter.moderationStatus.reviewedBy}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}