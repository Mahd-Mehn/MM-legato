'use client';

import { useState } from 'react';
import { Flag, Trash2, Edit, Pin, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';
// Removed unused imports - using native HTML elements instead

interface ModerationActionsProps {
  onReport: () => void;
  onClose: () => void;
  canModerate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onLock?: () => void;
  onHide?: () => void;
  isPinned?: boolean;
  isLocked?: boolean;
  isHidden?: boolean;
}

export function ModerationActions({
  onReport,
  onClose,
  canModerate = false,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  onPin,
  onLock,
  onHide,
  isPinned = false,
  isLocked = false,
  isHidden = false
}: ModerationActionsProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const reportReasons = [
    'Spam or unwanted content',
    'Harassment or bullying',
    'Inappropriate content',
    'Copyright violation',
    'Off-topic discussion',
    'Misinformation',
    'Other'
  ];

  const handleReport = () => {
    if (reportReason) {
      onReport();
      setShowReportModal(false);
      onClose();
    }
  };

  return (
    <>
      <Card className="absolute right-0 top-8 w-48 p-2 shadow-lg z-10">
        <div className="space-y-1">
          {/* User Actions */}
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded"
          >
            <Flag className="w-4 h-4" />
            Report
          </button>

          {canEdit && onEdit && (
            <button
              onClick={() => {
                onEdit();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}

          {canDelete && onDelete && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this?')) {
                  onDelete();
                  onClose();
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}

          {/* Moderator Actions */}
          {canModerate && (
            <>
              <hr className="my-2 border-gray-200 dark:border-gray-700" />
              
              {onPin && (
                <button
                  onClick={() => {
                    onPin();
                    onClose();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                >
                  <Pin className="w-4 h-4" />
                  {isPinned ? 'Unpin' : 'Pin'}
                </button>
              )}

              {onLock && (
                <button
                  onClick={() => {
                    onLock();
                    onClose();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900 rounded"
                >
                  <Lock className="w-4 h-4" />
                  {isLocked ? 'Unlock' : 'Lock'}
                </button>
              )}

              {onHide && (
                <button
                  onClick={() => {
                    onHide();
                    onClose();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {isHidden ? 'Show' : 'Hide'}
                </button>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Report Content
              </h3>
              
              <div className="space-y-3 mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Why are you reporting this content?
                </p>
                
                {reportReasons.map(reason => (
                  <label key={reason} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {reason}
                    </span>
                  </label>
                ))}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReportModal(false);
                    onClose();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReport}
                  disabled={!reportReason}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Report
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}