'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Download, 
  Eye,
  ExternalLink,
  RefreshCw,
  FileText,
  Fingerprint,
  Globe,
  Calendar,
  Award,
  TrendingUp
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import { IPProtectionData, IPCertificate, Story } from '@/lib/types';
import { apiService } from '@/lib/api';

interface IPProtectionDashboardProps {
  stories: Story[];
  onProtectionAction: (storyId: string, action: string) => void;
}

export default function IPProtectionDashboard({ stories, onProtectionAction }: IPProtectionDashboardProps) {
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [protectionData, setProtectionData] = useState<Record<string, IPProtectionData>>({});
  const [certificates, setCertificates] = useState<Record<string, IPCertificate>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'protected' | 'pending' | 'unprotected'>('all');

  useEffect(() => {
    loadProtectionData();
  }, [stories]);

  const loadProtectionData = async () => {
    for (const story of stories) {
      if (story.ipProtection) {
        setProtectionData(prev => ({
          ...prev,
          [story.id]: story.ipProtection
        }));
      }
    }
  };

  const getProtectionStatusColor = (status: string) => {
    switch (status) {
      case 'protected':
      case 'verified':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'disputed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'expired':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getProtectionIcon = (status: string) => {
    switch (status) {
      case 'protected':
      case 'verified':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'disputed':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const handleProtectStory = async (storyId: string) => {
    setLoading(prev => ({ ...prev, [storyId]: true }));
    try {
      await apiService.registerIP(storyId);
      onProtectionAction(storyId, 'protect');
      await loadProtectionData();
    } catch (error) {
      console.error('Failed to protect story:', error);
    } finally {
      setLoading(prev => ({ ...prev, [storyId]: false }));
    }
  };

  const handleVerifyProtection = async (storyId: string) => {
    setLoading(prev => ({ ...prev, [storyId]: true }));
    try {
      // API call to verify protection
      onProtectionAction(storyId, 'verify');
      await loadProtectionData();
    } catch (error) {
      console.error('Failed to verify protection:', error);
    } finally {
      setLoading(prev => ({ ...prev, [storyId]: false }));
    }
  };

  const handleDownloadCertificate = async (storyId: string) => {
    try {
      // API call to download certificate
      const certificate = certificates[storyId];
      if (certificate) {
        // Create download link
        const link = document.createElement('a');
        link.href = certificate.verificationUrl;
        link.download = `IP-Certificate-${certificate.certificateNumber}.pdf`;
        link.click();
      }
    } catch (error) {
      console.error('Failed to download certificate:', error);
    }
  };

  const filteredStories = stories.filter(story => {
    const protection = protectionData[story.id];
    switch (filter) {
      case 'protected':
        return protection?.status === 'protected' || protection?.status === 'verified';
      case 'pending':
        return protection?.status === 'pending';
      case 'unprotected':
        return !protection || protection.status === 'expired';
      default:
        return true;
    }
  });

  const protectionStats = {
    total: stories.length,
    protected: stories.filter(s => {
      const p = protectionData[s.id];
      return p?.status === 'protected' || p?.status === 'verified';
    }).length,
    pending: stories.filter(s => protectionData[s.id]?.status === 'pending').length,
    unprotected: stories.filter(s => !protectionData[s.id] || protectionData[s.id].status === 'expired').length,
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stories</p>
                <p className="text-2xl font-bold text-gray-900">{protectionStats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Protected</p>
                <p className="text-2xl font-bold text-green-600">{protectionStats.protected}</p>
              </div>
              <Shield className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{protectionStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unprotected</p>
                <p className="text-2xl font-bold text-red-600">{protectionStats.unprotected}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>IP Protection Status</CardTitle>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Stories</option>
                <option value="protected">Protected</option>
                <option value="pending">Pending</option>
                <option value="unprotected">Unprotected</option>
              </select>
              <Button
                variant="outline"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={loadProtectionData}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStories.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stories found</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'You haven\'t created any stories yet'
                  : `No stories match the ${filter} filter`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStories.map((story) => {
                const protection = protectionData[story.id];
                const isLoading = loading[story.id];
                
                return (
                  <div key={story.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{story.title}</h3>
                          {protection && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getProtectionStatusColor(protection.status)}`}>
                              {getProtectionIcon(protection.status)}
                              <span className="ml-1 capitalize">{protection.status}</span>
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {story.description}
                        </p>

                        {protection ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-900">Protection Details</h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Registered: {new Date(protection.registrationDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                  <Award className="w-4 h-4 mr-2" />
                                  Level: {protection.protectionLevel}
                                </div>
                                {protection.certificateId && (
                                  <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Certificate: {protection.certificateId}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-900">Verification Status</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center justify-between">
                                  <span>Blockchain</span>
                                  {protection.verificationStatus.blockchain ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Timestamp</span>
                                  {protection.verificationStatus.timestamp ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Content</span>
                                  {protection.verificationStatus.content ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Authorship</span>
                                  {protection.verificationStatus.authorship ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-900">Licensing</h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Globe className="w-4 h-4 mr-2" />
                                  Available: {protection.licenseability.available ? 'Yes' : 'No'}
                                </div>
                                {protection.licenseability.available && (
                                  <>
                                    <div className="flex items-center">
                                      <TrendingUp className="w-4 h-4 mr-2" />
                                      Min Price: ${protection.licenseability.minimumPrice.toLocaleString()}
                                    </div>
                                    <div className="text-xs">
                                      Territories: {protection.licenseability.territories.join(', ')}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center">
                              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                              <div>
                                <h4 className="text-sm font-medium text-yellow-800">Story Not Protected</h4>
                                <p className="text-sm text-yellow-700">
                                  This story is not protected by IP registration. Consider protecting it to secure your rights.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-6">
                        {protection ? (
                          <>
                            {protection.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<RefreshCw className="w-4 h-4" />}
                                onClick={() => handleVerifyProtection(story.id)}
                                disabled={isLoading}
                              >
                                Check Status
                              </Button>
                            )}
                            
                            {(protection.status === 'protected' || protection.status === 'verified') && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={<Download className="w-4 h-4" />}
                                  onClick={() => handleDownloadCertificate(story.id)}
                                >
                                  Certificate
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={<Eye className="w-4 h-4" />}
                                  onClick={() => setSelectedStory(story.id)}
                                >
                                  View Details
                                </Button>
                              </>
                            )}

                            {protection.blockchainHash && (
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<ExternalLink className="w-4 h-4" />}
                                onClick={() => window.open(`https://etherscan.io/tx/${protection.blockchainHash}`, '_blank')}
                              >
                                Blockchain
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            leftIcon={<Shield className="w-4 h-4" />}
                            onClick={() => handleProtectStory(story.id)}
                            disabled={isLoading}
                            size="sm"
                          >
                            {isLoading ? 'Protecting...' : 'Protect Story'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {protection && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Fingerprint className="w-3 h-3 mr-1" />
                            Fingerprint: {protection.forensicFingerprint.substring(0, 16)}...
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Last verified: {new Date(protection.verificationStatus.lastVerified).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}