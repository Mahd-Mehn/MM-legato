'use client';

import { useState, useEffect } from 'react';
import { 
  TestTube, 
  Play, 
  Pause, 
  BarChart3, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
  Eye,
  Target,
  Calendar,
  Clock
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  trafficPercentage: number;
  configuration: Record<string, any>;
  isControl: boolean;
}

interface ABTestResult {
  variantId: string;
  variantName: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  isWinner: boolean;
  metrics: {
    views: number;
    engagement: number;
    revenue: number;
    completionRate: number;
  };
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  targetMetric: string;
  variants: ABTestVariant[];
  results?: ABTestResult[];
  totalParticipants: number;
  confidence: number;
  winner?: string;
  createdAt: string;
  updatedAt: string;
}

interface ABTestingInterfaceProps {
  tests: ABTest[];
  onCreateTest: (test: Partial<ABTest>) => void;
  onUpdateTest: (testId: string, updates: Partial<ABTest>) => void;
  onDeleteTest: (testId: string) => void;
  onStartTest: (testId: string) => void;
  onPauseTest: (testId: string) => void;
  onStopTest: (testId: string) => void;
}

export default function ABTestingInterface({
  tests,
  onCreateTest,
  onUpdateTest,
  onDeleteTest,
  onStartTest,
  onPauseTest,
  onStopTest
}: ABTestingInterfaceProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'running' | 'completed' | 'create'>('overview');
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTest, setNewTest] = useState<Partial<ABTest>>({
    name: '',
    description: '',
    targetMetric: 'conversion_rate',
    variants: [
      { id: 'control', name: 'Control', description: 'Original version', trafficPercentage: 50, configuration: {}, isControl: true },
      { id: 'variant_a', name: 'Variant A', description: 'Test version', trafficPercentage: 50, configuration: {}, isControl: false }
    ]
  });

  const runningTests = tests.filter(test => test.status === 'running');
  const completedTests = tests.filter(test => test.status === 'completed');
  const draftTests = tests.filter(test => test.status === 'draft');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-50 border-green-200';
      case 'paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'draft': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'draft': return <Settings className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysRunning = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleCreateTest = () => {
    if (newTest.name && newTest.description) {
      onCreateTest({
        ...newTest,
        id: `test_${Date.now()}`,
        status: 'draft',
        totalParticipants: 0,
        confidence: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowCreateModal(false);
      setNewTest({
        name: '',
        description: '',
        targetMetric: 'conversion_rate',
        variants: [
          { id: 'control', name: 'Control', description: 'Original version', trafficPercentage: 50, configuration: {}, isControl: true },
          { id: 'variant_a', name: 'Variant A', description: 'Test version', trafficPercentage: 50, configuration: {}, isControl: false }
        ]
      });
    }
  };

  const renderTestCard = (test: ABTest) => (
    <Card key={test.id} className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-6" onClick={() => setSelectedTest(test)}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
            <p className="text-gray-600 text-sm mt-1">{test.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(test.status)}`}>
              {getStatusIcon(test.status)}
              <span>{test.status}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">{test.variants.length}</div>
            <div className="text-sm text-gray-500">Variants</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{test.totalParticipants.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Participants</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{test.confidence}%</div>
            <div className="text-sm text-gray-500">Confidence</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {test.status === 'running' ? calculateDaysRunning(test.startDate) : 
               test.endDate ? calculateDaysRunning(test.startDate, test.endDate) : 0}
            </div>
            <div className="text-sm text-gray-500">Days</div>
          </div>
        </div>

        {test.results && test.results.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Results Preview:</div>
            <div className="flex space-x-4">
              {test.results.slice(0, 2).map((result) => (
                <div key={result.variantId} className="flex-1 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{result.variantName}</span>
                    {result.isWinner && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="text-lg font-bold text-gray-900">{result.conversionRate.toFixed(2)}%</div>
                  <div className="text-xs text-gray-500">Conversion Rate</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Target: {test.targetMetric.replace('_', ' ')}
          </div>
          <div className="flex space-x-2">
            {test.status === 'draft' && (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); onStartTest(test.id); }}>
                Start Test
              </Button>
            )}
            {test.status === 'running' && (
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onPauseTest(test.id); }}>
                Pause
              </Button>
            )}
            {test.status === 'paused' && (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); onStartTest(test.id); }}>
                Resume
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTestDetails = (test: ABTest) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{test.name}</h2>
          <p className="text-gray-600 mt-1">{test.description}</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-2 ${getStatusColor(test.status)}`}>
            {getStatusIcon(test.status)}
            <span>{test.status}</span>
          </span>
          <Button variant="outline" onClick={() => setSelectedTest(null)}>
            Back to List
          </Button>
        </div>
      </div>

      {/* Test Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{test.totalParticipants.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Participants</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{test.confidence}%</div>
            <div className="text-sm text-gray-500">Confidence Level</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {calculateDaysRunning(test.startDate, test.endDate)}
            </div>
            <div className="text-sm text-gray-500">Days Running</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900">{test.targetMetric.replace('_', ' ')}</div>
            <div className="text-sm text-gray-500">Target Metric</div>
          </CardContent>
        </Card>
      </div>

      {/* Variants and Results */}
      {test.results && test.results.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {test.results.map((result) => (
                <div key={result.variantId} className={`p-4 rounded-lg border-2 ${
                  result.isWinner ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{result.variantName}</h3>
                      {result.isWinner && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Winner
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{result.conversionRate.toFixed(2)}%</div>
                      <div className="text-sm text-gray-500">Conversion Rate</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{result.participants.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Participants</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{result.conversions.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Conversions</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{result.metrics.views.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Views</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{result.metrics.engagement.toFixed(1)}%</div>
                      <div className="text-sm text-gray-500">Engagement</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">${result.metrics.revenue.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">Revenue</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Test Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {test.variants.map((variant) => (
                <div key={variant.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{variant.name}</h3>
                    <span className="text-sm text-gray-500">{variant.trafficPercentage}% traffic</span>
                  </div>
                  <p className="text-gray-600 text-sm">{variant.description}</p>
                  {variant.isControl && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Control
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {!selectedTest ? (
        <>
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <TestTube className="w-6 h-6 text-primary-600" />
                    <span>A/B Testing Dashboard</span>
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Optimize your content with data-driven experiments
                  </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Test
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs */}
          <Card>
            <CardContent className="p-0">
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'overview', label: 'Overview', count: tests.length },
                  { id: 'running', label: 'Running', count: runningTests.length },
                  { id: 'completed', label: 'Completed', count: completedTests.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      selectedTab === tab.id
                        ? 'border-primary-500 text-primary-600 bg-primary-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedTab === 'overview' && tests.map(renderTestCard)}
            {selectedTab === 'running' && runningTests.map(renderTestCard)}
            {selectedTab === 'completed' && completedTests.map(renderTestCard)}
          </div>

          {/* Empty State */}
          {((selectedTab === 'overview' && tests.length === 0) ||
            (selectedTab === 'running' && runningTests.length === 0) ||
            (selectedTab === 'completed' && completedTests.length === 0)) && (
            <Card>
              <CardContent className="p-8 text-center">
                <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
                <p className="text-gray-600 mb-4">
                  {selectedTab === 'overview' 
                    ? 'Create your first A/B test to start optimizing your content.'
                    : `No ${selectedTab} tests at the moment.`}
                </p>
                {selectedTab === 'overview' && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    Create Your First Test
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        renderTestDetails(selectedTest)
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New A/B Test</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Name
                </label>
                <input
                  type="text"
                  value={newTest.name || ''}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Chapter Title Optimization"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTest.description || ''}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Describe what you're testing and why"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Metric
                </label>
                <select
                  value={newTest.targetMetric || 'conversion_rate'}
                  onChange={(e) => setNewTest({ ...newTest, targetMetric: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="conversion_rate">Conversion Rate</option>
                  <option value="engagement_rate">Engagement Rate</option>
                  <option value="completion_rate">Completion Rate</option>
                  <option value="revenue_per_user">Revenue per User</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTest}>
                Create Test
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}