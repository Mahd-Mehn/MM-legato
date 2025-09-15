'use client';

import { useState, useEffect } from 'react';
import { Shield, MapPin, Smartphone, Monitor, AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'password_change' | 'email_change' | '2fa_enabled' | '2fa_disabled' | 'failed_login' | 'account_locked';
  timestamp: string;
  location: {
    city: string;
    country: string;
    ip: string;
  };
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  };
  status: 'success' | 'failed' | 'suspicious';
  details?: string;
}

const eventTypeLabels = {
  login: 'Sign In',
  logout: 'Sign Out',
  password_change: 'Password Changed',
  email_change: 'Email Changed',
  '2fa_enabled': '2FA Enabled',
  '2fa_disabled': '2FA Disabled',
  failed_login: 'Failed Sign In',
  account_locked: 'Account Locked',
};

const eventTypeIcons = {
  login: CheckCircle,
  logout: CheckCircle,
  password_change: Shield,
  email_change: Shield,
  '2fa_enabled': Shield,
  '2fa_disabled': AlertTriangle,
  failed_login: AlertTriangle,
  account_locked: AlertTriangle,
};

const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Smartphone,
};

export default function SecurityAuditLog() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'suspicious' | 'failed'>('all');

  useEffect(() => {
    loadSecurityEvents();
  }, []);

  const loadSecurityEvents = async () => {
    try {
      // TODO: Implement actual security events API call
      console.log('Loading security events...');
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'login',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          location: { city: 'New York', country: 'United States', ip: '192.168.1.1' },
          device: { type: 'desktop', browser: 'Chrome 120', os: 'Windows 11' },
          status: 'success',
        },
        {
          id: '2',
          type: 'failed_login',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          location: { city: 'Unknown', country: 'Unknown', ip: '203.0.113.1' },
          device: { type: 'mobile', browser: 'Safari 17', os: 'iOS 17' },
          status: 'failed',
          details: 'Invalid password attempt',
        },
        {
          id: '3',
          type: 'password_change',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          location: { city: 'New York', country: 'United States', ip: '192.168.1.1' },
          device: { type: 'desktop', browser: 'Chrome 120', os: 'Windows 11' },
          status: 'success',
        },
        {
          id: '4',
          type: '2fa_enabled',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          location: { city: 'New York', country: 'United States', ip: '192.168.1.1' },
          device: { type: 'desktop', browser: 'Chrome 120', os: 'Windows 11' },
          status: 'success',
        },
        {
          id: '5',
          type: 'login',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          location: { city: 'Los Angeles', country: 'United States', ip: '198.51.100.1' },
          device: { type: 'mobile', browser: 'Chrome Mobile 120', os: 'Android 14' },
          status: 'suspicious',
          details: 'Login from new location',
        },
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: SecurityEvent['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'suspicious':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getEventColor = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login':
      case 'logout':
      case 'password_change':
      case 'email_change':
      case '2fa_enabled':
        return 'text-green-600';
      case 'failed_login':
      case 'account_locked':
      case '2fa_disabled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'suspicious') return event.status === 'suspicious';
    if (filter === 'failed') return event.status === 'failed';
    return true;
  });

  if (loading) {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading security events...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Security Activity</h3>
              <p className="text-sm text-gray-600">Recent security events for your account</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Events</option>
              <option value="suspicious">Suspicious</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const EventIcon = eventTypeIcons[event.type];
              const DeviceIcon = deviceIcons[event.device.type];
              
              return (
                <div
                  key={event.id}
                  className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Event Icon */}
                  <div className={`p-2 rounded-full ${getEventColor(event.type)}`}>
                    <EventIcon className="w-5 h-5" />
                  </div>
                  
                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">
                        {eventTypeLabels[event.type]}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimestamp(event.timestamp)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location.city}, {event.location.country}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DeviceIcon className="w-4 h-4" />
                          <span>{event.device.browser} on {event.device.os}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        IP: {event.location.ip}
                      </div>
                      
                      {event.details && (
                        <div className="text-xs text-gray-700 font-medium">
                          {event.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h4>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No security events recorded yet'
                  : `No ${filter} events found`
                }
              </p>
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredEvents.length > 0 && (
          <div className="text-center">
            <Button variant="outline" onClick={loadSecurityEvents}>
              Load More Events
            </Button>
          </div>
        )}

        {/* Security Tips */}
        <div className="pt-6 border-t border-gray-200">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Security Tips:</p>
                <ul className="space-y-1">
                  <li>• Review this log regularly for suspicious activity</li>
                  <li>• Report any unrecognized sign-ins immediately</li>
                  <li>• Enable two-factor authentication for extra security</li>
                  <li>• Use strong, unique passwords</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}