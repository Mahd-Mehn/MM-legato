'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Target, 
  Users, 
  Clock, 
  Star,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  BookOpen,
  Calendar,
  Filter
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

interface ContentMetrics {
  contentId: string;
  title: string;
  views: number;
  uniqueReaders: number;
  engagementRate: number;
  completionRate: number;
  averageReadTime: number;
  comments: number;
  likes: number;
  shares: number;
  revenue: number;
  publishDate: string;
  lastUpdated: string;
  genre: string;
  tags: string[];
  chapterCount: number;
  wordCount: number;
}

interface RecommendationInsight {
  id: string;
  type: 'optimization' | 'content' | 'timing' | 'audience' | 'monetization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  actionItems: string[];
  expectedOutcome: string;
  metrics: {
    current: number;
    potential: number;
    improvement: number;
  };
  relatedContent?: string[];
}

interface AudienceInsight {
  segment: string;
  size: number;
  engagement: number;
  preferences: string[];
  dropOffPoints: number[];
  peakReadingTimes: string[];
}

interface ContentRecommendationsEngineProps {
  contentMetrics: ContentMetrics[];
  audienceInsights: AudienceInsight[];
  timeRange: '7d' | '30d' | '90d';
  writerId: string;
}

export default function ContentRecommendationsEngine({
  contentMetrics,
  audienceInsights,
  timeRange,
  writerId
}: ContentRecommendationsEngineProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'optimization' | 'content' | 'timing' | 'audience' | 'monetization'>('all');
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [recommendations, setRecommendations] = useState<RecommendationInsight[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate recommendations based on content metrics and audience insights
  const generateRecommendations = useMemo(() => {
    const insights: RecommendationInsight[] = [];

    // Analyze each piece of content
    contentMetrics.forEach(content => {
      // Low engagement rate recommendation
      if (content.engagementRate < 0.3) {
        insights.push({
          id: `engagement-${content.contentId}`,
          type: 'optimization',
          priority: 'high',
          title: `Improve engagement for "${content.title}"`,
          description: `This story has a ${(content.engagementRate * 100).toFixed(1)}% engagement rate, which is below the recommended 30%.`,
          impact: 'Could increase reader retention by 40-60%',
          effort: 'medium',
          actionItems: [
            'Add more interactive elements (polls, questions)',
            'Improve chapter hooks and cliffhangers',
            'Optimize chapter length (aim for 1,500-2,500 words)',
            'Add more dialogue and character interactions'
          ],
          expectedOutcome: 'Increase engagement rate to 35-45%',
          metrics: {
            current: content.engagementRate * 100,
            potential: 40,
            improvement: 40 - (content.engagementRate * 100)
          },
          relatedContent: [content.contentId]
        });
      }

      // Low completion rate recommendation
      if (content.completionRate < 0.5) {
        insights.push({
          id: `completion-${content.contentId}`,
          type: 'content',
          priority: 'high',
          title: `Reduce drop-off in "${content.title}"`,
          description: `Only ${(content.completionRate * 100).toFixed(1)}% of readers complete this story.`,
          impact: 'Could increase story completion by 25-35%',
          effort: 'high',
          actionItems: [
            'Analyze drop-off points and strengthen weak chapters',
            'Improve story pacing in middle chapters',
            'Add subplot or character development',
            'Consider breaking long chapters into shorter ones'
          ],
          expectedOutcome: 'Increase completion rate to 60-70%',
          metrics: {
            current: content.completionRate * 100,
            potential: 65,
            improvement: 65 - (content.completionRate * 100)
          },
          relatedContent: [content.contentId]
        });
      }

      // Revenue optimization
      if (content.revenue < content.views * 0.01) {
        insights.push({
          id: `revenue-${content.contentId}`,
          type: 'monetization',
          priority: 'medium',
          title: `Optimize monetization for "${content.title}"`,
          description: `Revenue per view is $${(content.revenue / content.views).toFixed(4)}, below the $0.01 benchmark.`,
          impact: 'Could increase revenue by 150-200%',
          effort: 'low',
          actionItems: [
            'Add premium chapters or bonus content',
            'Implement strategic paywall placement',
            'Offer exclusive content for subscribers',
            'Add merchandise or related products'
          ],
          expectedOutcome: 'Increase revenue per view to $0.015-0.02',
          metrics: {
            current: (content.revenue / content.views) * 1000,
            potential: 15,
            improvement: 15 - ((content.revenue / content.views) * 1000)
          },
          relatedContent: [content.contentId]
        });
      }
    });

    // Audience-based recommendations
    audienceInsights.forEach(audience => {
      if (audience.engagement < 0.4) {
        insights.push({
          id: `audience-${audience.segment}`,
          type: 'audience',
          priority: 'medium',
          title: `Improve engagement with ${audience.segment} readers`,
          description: `The ${audience.segment} segment (${audience.size} readers) has low engagement at ${(audience.engagement * 100).toFixed(1)}%.`,
          impact: 'Could increase segment engagement by 30-50%',
          effort: 'medium',
          actionItems: [
            `Create content that appeals to ${audience.segment} preferences: ${audience.preferences.join(', ')}`,
            `Publish during peak times: ${audience.peakReadingTimes.join(', ')}`,
            'Engage with this audience through comments and social media',
            'Consider creating a series specifically for this demographic'
          ],
          expectedOutcome: 'Increase segment engagement to 50-60%',
          metrics: {
            current: audience.engagement * 100,
            potential: 55,
            improvement: 55 - (audience.engagement * 100)
          }
        });
      }
    });

    // Timing recommendations
    const totalViews = contentMetrics.reduce((sum, content) => sum + content.views, 0);
    const avgViewsPerContent = totalViews / contentMetrics.length;
    
    insights.push({
      id: 'timing-optimization',
      type: 'timing',
      priority: 'low',
      title: 'Optimize publishing schedule',
      description: 'Analysis shows potential for better timing of content releases.',
      impact: 'Could increase initial views by 20-30%',
      effort: 'low',
      actionItems: [
        'Publish new chapters on Tuesday-Thursday for maximum engagement',
        'Release content between 6-8 PM in your primary audience timezone',
        'Maintain consistent publishing schedule',
        'Use social media to announce new releases 1-2 hours before publishing'
      ],
      expectedOutcome: 'Increase average views per content by 25%',
      metrics: {
        current: avgViewsPerContent,
        potential: avgViewsPerContent * 1.25,
        improvement: avgViewsPerContent * 0.25
      }
    });

    return insights;
  }, [contentMetrics, audienceInsights]);

  useEffect(() => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setRecommendations(generateRecommendations);
      setLoading(false);
    }, 1000);
  }, [generateRecommendations]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(rec => {
      const categoryMatch = selectedCategory === 'all' || rec.type === selectedCategory;
      const priorityMatch = selectedPriority === 'all' || rec.priority === selectedPriority;
      return categoryMatch && priorityMatch;
    });
  }, [recommendations, selectedCategory, selectedPriority]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="w-5 h-5" />;
      case 'content': return <BookOpen className="w-5 h-5" />;
      case 'timing': return <Clock className="w-5 h-5" />;
      case 'audience': return <Users className="w-5 h-5" />;
      case 'monetization': return <Target className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getEffortBadge = (effort: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[effort as keyof typeof colors] || colors.medium;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Analyzing content and generating recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-6 h-6 text-primary-600" />
                <span>Content Optimization Recommendations</span>
              </CardTitle>
              <p className="text-gray-600 mt-1">
                AI-powered insights to improve your content performance
              </p>
            </div>
            <div className="mt-4 sm:mt-0 text-sm text-gray-500">
              {filteredRecommendations.length} recommendations found
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="optimization">Optimization</option>
                <option value="content">Content</option>
                <option value="timing">Timing</option>
                <option value="audience">Audience</option>
                <option value="monetization">Monetization</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.map((recommendation) => (
          <Card key={recommendation.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 p-2 bg-primary-50 rounded-lg">
                    {getTypeIcon(recommendation.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {recommendation.title}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {recommendation.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(recommendation.priority)}`}>
                    {recommendation.priority} priority
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEffortBadge(recommendation.effort)}`}>
                    {recommendation.effort} effort
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Impact and Metrics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Expected Impact</h4>
                  <p className="text-sm text-gray-600 mb-3">{recommendation.impact}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Current</span>
                      <span className="text-sm font-medium">{recommendation.metrics.current.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Potential</span>
                      <span className="text-sm font-medium text-green-600">{recommendation.metrics.potential.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Improvement</span>
                      <span className="text-sm font-medium text-primary-600">+{recommendation.metrics.improvement.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Action Items</h4>
                  <ul className="space-y-2">
                    {recommendation.actionItems.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expected Outcome */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Expected Outcome</h4>
                  <p className="text-sm text-gray-600 mb-4">{recommendation.expectedOutcome}</p>
                  
                  <div className="space-y-2">
                    <Button size="sm" className="w-full">
                      Implement Recommendation
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations found</h3>
            <p className="text-gray-600">
              Try adjusting your filters or check back later for new insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}