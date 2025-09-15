'use client';

import { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Calendar,
  User,
  Building,
  Globe,
  Film,
  FileText,
  Send,
  Eye,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import { LicenseRequest, Negotiation, Story } from '@/lib/types';

interface LicensingRequestManagerProps {
  userStories: Story[];
  onRequestAction: (requestId: string, action: 'accept' | 'reject' | 'negotiate', data?: any) => void;
}

export default function LicensingRequestManager({ 
  userStories, 
  onRequestAction 
}: LicensingRequestManagerProps) {
  const [requests, setRequests] = useState<LicenseRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<LicenseRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'negotiating' | 'accepted' | 'rejected'>('all');
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [negotiationMessage, setNegotiationMessage] = useState('');
  const [counterOffer, setCounterOffer] = useState({
    price: 0,
    duration: '',
    territory: [] as string[],
    mediaType: [] as string[],
    exclusivity: false,
    royaltyRate: 0,
    advancePayment: 0
  });

  useEffect(() => {
    loadLicenseRequests();
  }, []);

  const loadLicenseRequests = async () => {
    // Mock data - replace with actual API call
    const mockRequests: LicenseRequest[] = [
      {
        id: 'req-1',
        storyId: 'story-1',
        requesterId: 'studio-1',
        requesterName: 'Nollywood Studios',
        requesterType: 'studio',
        licenseType: {
          type: 'exclusive',
          rights: ['Film Rights', 'TV Series Rights'],
          restrictions: ['No adult content adaptations']
        },
        territory: ['Nigeria', 'Ghana', 'Kenya'],
        duration: '5 years',
        mediaType: ['Film', 'TV'],
        proposedPrice: 45000,
        message: 'We are interested in adapting your story "The Digital Nomad Chronicles" for a Nollywood film series. The story resonates well with our African audience and we believe it has great potential.',
        status: 'pending',
        createdAt: '2024-03-10T10:00:00Z',
        updatedAt: '2024-03-10T10:00:00Z',
        negotiations: []
      },
      {
        id: 'req-2',
        storyId: 'story-2',
        requesterId: 'publisher-1',
        requesterName: 'Global Media Publishers',
        requesterType: 'publisher',
        licenseType: {
          type: 'non-exclusive',
          rights: ['Book Rights', 'Audio Rights'],
          restrictions: ['Must maintain original storyline']
        },
        territory: ['Global'],
        duration: '3 years',
        mediaType: ['Book', 'Audio'],
        proposedPrice: 25000,
        message: 'We would like to publish your story as a physical book and audiobook. We have a strong distribution network globally.',
        status: 'negotiating',
        createdAt: '2024-03-08T14:30:00Z',
        updatedAt: '2024-03-12T09:15:00Z',
        negotiations: [
          {
            id: 'neg-1',
            fromUserId: 'publisher-1',
            message: 'We can increase the offer to $30,000 and include a 15% royalty on sales after the first 10,000 copies.',
            proposedTerms: {
              price: 30000,
              duration: '3 years',
              territory: ['Global'],
              mediaType: ['Book', 'Audio'],
              exclusivity: false,
              royaltyRate: 15,
              advancePayment: 5000
            },
            createdAt: '2024-03-12T09:15:00Z'
          }
        ]
      }
    ];
    setRequests(mockRequests);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'negotiating':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'completed':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'negotiating':
        return <MessageCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getRequesterIcon = (type: string) => {
    switch (type) {
      case 'studio':
        return <Film className="w-4 h-4" />;
      case 'publisher':
        return <FileText className="w-4 h-4" />;
      case 'producer':
        return <Building className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAcceptRequest = (requestId: string) => {
    onRequestAction(requestId, 'accept');
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'accepted' as const } : req
    ));
  };

  const handleRejectRequest = (requestId: string) => {
    onRequestAction(requestId, 'reject');
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' as const } : req
    ));
  };

  const handleStartNegotiation = (request: LicenseRequest) => {
    setSelectedRequest(request);
    setCounterOffer({
      price: request.proposedPrice * 1.2, // Start 20% higher
      duration: request.duration,
      territory: request.territory,
      mediaType: request.mediaType,
      exclusivity: request.licenseType.type === 'exclusive',
      royaltyRate: 10,
      advancePayment: Math.round(request.proposedPrice * 0.2)
    });
    setShowNegotiationModal(true);
  };

  const handleSendNegotiation = () => {
    if (!selectedRequest) return;

    const negotiationData = {
      message: negotiationMessage,
      proposedTerms: counterOffer
    };

    onRequestAction(selectedRequest.id, 'negotiate', negotiationData);
    
    // Update local state
    setRequests(prev => prev.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            status: 'negotiating' as const,
            negotiations: [
              ...req.negotiations,
              {
                id: `neg-${Date.now()}`,
                fromUserId: 'current-user', // Replace with actual user ID
                message: negotiationMessage,
                proposedTerms: counterOffer,
                createdAt: new Date().toISOString()
              }
            ]
          }
        : req
    ));

    setShowNegotiationModal(false);
    setNegotiationMessage('');
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const requestStats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    negotiating: requests.filter(r => r.status === 'negotiating').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{requestStats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{requestStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Negotiating</p>
                <p className="text-2xl font-bold text-blue-600">{requestStats.negotiating}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{requestStats.accepted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{requestStats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>License Requests</CardTitle>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="mt-4 sm:mt-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="negotiating">Negotiating</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'You haven\'t received any licensing requests yet'
                  : `No ${filter} requests found`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const story = userStories.find(s => s.id === request.storyId);
                
                return (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {story?.title || 'Unknown Story'}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status}</span>
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            {getRequesterIcon(request.requesterType)}
                            <span className="ml-1">{request.requesterName}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {formatPrice(request.proposedPrice)}
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4">{request.message}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">License Details</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div>Type: {request.licenseType.type}</div>
                              <div>Duration: {request.duration}</div>
                              <div>Media: {request.mediaType.join(', ')}</div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Territory</h4>
                            <div className="flex items-center text-sm text-gray-600">
                              <Globe className="w-4 h-4 mr-1" />
                              {request.territory.join(', ')}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Rights</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              {request.licenseType.rights.map((right, index) => (
                                <div key={index}>• {right}</div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {request.negotiations.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Latest Negotiation</h4>
                            <p className="text-sm text-blue-800 mb-2">
                              {request.negotiations[request.negotiations.length - 1].message}
                            </p>
                            {request.negotiations[request.negotiations.length - 1].proposedTerms && (
                              <div className="text-sm text-blue-700">
                                New offer: {formatPrice(request.negotiations[request.negotiations.length - 1].proposedTerms!.price)}
                                {request.negotiations[request.negotiations.length - 1].proposedTerms!.royaltyRate && 
                                  ` + ${request.negotiations[request.negotiations.length - 1].proposedTerms!.royaltyRate}% royalty`
                                }
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-6">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              leftIcon={<CheckCircle className="w-4 h-4" />}
                              onClick={() => handleAcceptRequest(request.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<MessageCircle className="w-4 h-4" />}
                              onClick={() => handleStartNegotiation(request)}
                            >
                              Negotiate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<XCircle className="w-4 h-4" />}
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {request.status === 'negotiating' && (
                          <>
                            <Button
                              size="sm"
                              leftIcon={<CheckCircle className="w-4 h-4" />}
                              onClick={() => handleAcceptRequest(request.id)}
                            >
                              Accept Offer
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<MessageCircle className="w-4 h-4" />}
                              onClick={() => handleStartNegotiation(request)}
                            >
                              Counter Offer
                            </Button>
                          </>
                        )}

                        {(request.status === 'accepted' || request.status === 'completed') && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye className="w-4 h-4" />}
                          >
                            View Contract
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Negotiation Modal */}
      {showNegotiationModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Negotiate License Terms
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Counter Offer Price
                  </label>
                  <input
                    type="number"
                    value={counterOffer.price}
                    onChange={(e) => setCounterOffer(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Royalty Rate (%)
                    </label>
                    <input
                      type="number"
                      value={counterOffer.royaltyRate}
                      onChange={(e) => setCounterOffer(prev => ({ ...prev, royaltyRate: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Advance Payment
                    </label>
                    <input
                      type="number"
                      value={counterOffer.advancePayment}
                      onChange={(e) => setCounterOffer(prev => ({ ...prev, advancePayment: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={negotiationMessage}
                    onChange={(e) => setNegotiationMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Explain your counter offer..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowNegotiationModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={handleSendNegotiation}
                  disabled={!negotiationMessage.trim()}
                >
                  Send Counter Offer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}