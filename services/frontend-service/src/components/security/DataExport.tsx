'use client';

import { useState } from 'react';
import { Download, FileText, Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface ExportRequest {
  id: string;
  type: 'full' | 'stories' | 'profile' | 'activity';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
  fileSize?: string;
}

const exportTypes = [
  {
    id: 'full' as const,
    name: 'Complete Data Export',
    description: 'All your data including profile, stories, comments, reading history, and account settings',
    icon: Package,
    estimatedSize: '~50-200 MB',
  },
  {
    id: 'stories' as const,
    name: 'Stories & Content',
    description: 'Your published stories, drafts, chapters, and related metadata',
    icon: FileText,
    estimatedSize: '~10-50 MB',
  },
  {
    id: 'profile' as const,
    name: 'Profile Data',
    description: 'Profile information, preferences, and account settings',
    icon: FileText,
    estimatedSize: '~1-5 MB',
  },
  {
    id: 'activity' as const,
    name: 'Activity History',
    description: 'Reading history, comments, likes, follows, and interaction data',
    icon: FileText,
    estimatedSize: '~5-20 MB',
  },
];

export default function DataExport() {
  const [requests, setRequests] = useState<ExportRequest[]>([
    {
      id: '1',
      type: 'full',
      status: 'completed',
      requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      downloadUrl: '/api/exports/download/1',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString(),
      fileSize: '127 MB',
    },
    {
      id: '2',
      type: 'stories',
      status: 'processing',
      requestedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ]);
  const [loading, setLoading] = useState<string | null>(null);

  const requestExport = async (type: ExportRequest['type']) => {
    setLoading(type);
    try {
      // TODO: Implement actual export request API call
      console.log('Requesting export:', type);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newRequest: ExportRequest = {
        id: Date.now().toString(),
        type,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };
      
      setRequests(prev => [newRequest, ...prev]);
      alert('Export request submitted! You will receive an email when it\'s ready.');
    } catch (error) {
      console.error('Export request failed:', error);
      alert('Failed to request export. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const downloadExport = async (request: ExportRequest) => {
    try {
      // TODO: Implement actual download
      console.log('Downloading export:', request.id);
      
      // Simulate download
      const link = document.createElement('a');
      link.href = request.downloadUrl || '#';
      link.download = `legato-export-${request.type}-${request.id}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download export. Please try again.');
    }
  };

  const getStatusIcon = (status: ExportRequest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: ExportRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'Queued';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Ready';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Request New Export */}
      <Card padding="lg">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Data Export</h3>
            <p className="text-sm text-gray-600">
              Choose what data you'd like to export. Exports are processed in the background and you'll receive an email when ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportTypes.map((type) => {
              const Icon = type.icon;
              const isLoading = loading === type.id;
              
              return (
                <div
                  key={type.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <Icon className="w-6 h-6 text-primary-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{type.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                      <p className="text-xs text-gray-500">Estimated size: {type.estimatedSize}</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => requestExport(type.id)}
                    loading={isLoading}
                    disabled={loading !== null}
                    size="sm"
                    fullWidth
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Request Export
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="space-y-1">
                  <li>• Exports may take several hours to process depending on data size</li>
                  <li>• Download links expire after 7 days for security</li>
                  <li>• Data is provided in JSON and CSV formats where applicable</li>
                  <li>• You can request a new export at any time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Export History */}
      <Card padding="lg">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Export History</h3>
            <p className="text-sm text-gray-600">
              Your recent export requests and downloads
            </p>
          </div>

          <div className="space-y-4">
            {requests.length > 0 ? (
              requests.map((request) => {
                const exportType = exportTypes.find(t => t.id === request.type);
                const Icon = exportType?.icon || FileText;
                const expired = isExpired(request.expiresAt);
                
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Icon className="w-6 h-6 text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {exportType?.name || 'Unknown Export'}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Requested: {formatDate(request.requestedAt)}</span>
                          {request.completedAt && (
                            <span>Completed: {formatDate(request.completedAt)}</span>
                          )}
                          {request.fileSize && (
                            <span>Size: {request.fileSize}</span>
                          )}
                        </div>
                        {request.expiresAt && (
                          <p className={`text-xs ${expired ? 'text-red-600' : 'text-gray-500'}`}>
                            {expired ? 'Expired' : `Expires: ${formatDate(request.expiresAt)}`}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <span className="text-sm font-medium text-gray-700">
                          {getStatusText(request.status)}
                        </span>
                      </div>
                      
                      {request.status === 'completed' && !expired && (
                        <Button
                          onClick={() => downloadExport(request)}
                          size="sm"
                          variant="outline"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                      
                      {request.status === 'failed' && (
                        <Button
                          onClick={() => requestExport(request.type)}
                          size="sm"
                          variant="outline"
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Export Requests</h4>
                <p className="text-gray-600">
                  You haven't requested any data exports yet. Use the options above to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}