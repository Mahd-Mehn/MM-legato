'use client';

import { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  Users, 
  Eye, 
  MousePointer,
  Smartphone,
  Monitor,
  Tablet,
  Globe
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

interface HeatmapData {
  hour: number;
  day: number; // 0 = Sunday, 1 = Monday, etc.
  value: number;
  metadata?: {
    uniqueUsers?: number;
    avgSessionTime?: number;
    bounceRate?: number;
    topContent?: string[];
  };
}

interface ScrollHeatmapData {
  position: number; // 0-100 percentage of page
  intensity: number; // 0-1 intensity
  clicks: number;
  timeSpent: number;
}

interface DeviceHeatmapData {
  device: string;
  hour: number;
  usage: number;
  engagement: number;
}

interface GeographicData {
  country: string;
  lat: number;
  lng: number;
  users: number;
  engagement: number;
}

interface ReaderBehaviorHeatmapProps {
  timeHeatmapData: HeatmapData[];
  scrollHeatmapData: ScrollHeatmapData[];
  deviceHeatmapData: DeviceHeatmapData[];
  geographicData: GeographicData[];
  contentId?: string;
  timeRange: '7d' | '30d' | '90d';
}

export default function ReaderBehaviorHeatmap({
  timeHeatmapData,
  scrollHeatmapData,
  deviceHeatmapData,
  geographicData,
  contentId,
  timeRange
}: ReaderBehaviorHeatmapProps) {
  const [selectedView, setSelectedView] = useState<'time' | 'scroll' | 'device' | 'geographic'>('time');
  const [hoveredCell, setHoveredCell] = useState<any>(null);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const maxTimeValue = useMemo(() => {
    return Math.max(...timeHeatmapData.map(d => d.value));
  }, [timeHeatmapData]);

  const maxScrollValue = useMemo(() => {
    return Math.max(...scrollHeatmapData.map(d => d.intensity));
  }, [scrollHeatmapData]);

  const getTimeHeatmapCell = (day: number, hour: number) => {
    return timeHeatmapData.find(d => d.day === day && d.hour === hour);
  };

  const getIntensityColor = (value: number, maxValue: number) => {
    const intensity = value / maxValue;
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 0.2) return 'bg-blue-100';
    if (intensity < 0.4) return 'bg-blue-200';
    if (intensity < 0.6) return 'bg-blue-400';
    if (intensity < 0.8) return 'bg-blue-600';
    return 'bg-blue-800';
  };

  const renderTimeHeatmap = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Reading Activity by Time</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Less</span>
          <div className="flex space-x-1">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity) => (
              <div
                key={intensity}
                className={`w-3 h-3 rounded ${getIntensityColor(intensity, 1)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-25 gap-1 text-xs">
            {/* Header row with hours */}
            <div></div>
            {hours.map(hour => (
              <div key={hour} className="text-center text-gray-500 p-1">
                {hour}
              </div>
            ))}
            
            {/* Data rows */}
            {days.map((day, dayIndex) => (
              <div key={day} className="contents">
                <div className="text-gray-700 font-medium p-2 flex items-center">
                  {day}
                </div>
                {hours.map(hour => {
                  const cell = getTimeHeatmapCell(dayIndex, hour);
                  const value = cell?.value || 0;
                  
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={`w-8 h-8 rounded cursor-pointer transition-all duration-200 hover:scale-110 ${
                        getIntensityColor(value, maxTimeValue)
                      }`}
                      onMouseEnter={() => setHoveredCell({
                        type: 'time',
                        day: day,
                        hour: hour,
                        value: value,
                        metadata: cell?.metadata
                      })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${day} ${hour}:00 - ${value} readers`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderScrollHeatmap = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Page Scroll Behavior</h3>
      
      <div className="relative">
        <div className="w-full h-96 bg-gray-100 rounded-lg relative overflow-hidden">
          {/* Simulated page content */}
          <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50">
            {scrollHeatmapData.map((data, index) => (
              <div
                key={index}
                className="absolute left-0 right-0 transition-all duration-200 hover:z-10"
                style={{
                  top: `${data.position}%`,
                  height: '2%',
                  backgroundColor: `rgba(59, 130, 246, ${data.intensity})`,
                }}
                onMouseEnter={() => setHoveredCell({
                  type: 'scroll',
                  position: data.position,
                  intensity: data.intensity,
                  clicks: data.clicks,
                  timeSpent: data.timeSpent
                })}
                onMouseLeave={() => setHoveredCell(null)}
              />
            ))}
          </div>
          
          {/* Click indicators */}
          {scrollHeatmapData
            .filter(d => d.clicks > 0)
            .map((data, index) => (
              <div
                key={`click-${index}`}
                className="absolute w-3 h-3 bg-red-500 rounded-full animate-pulse"
                style={{
                  top: `${data.position}%`,
                  left: `${20 + (index % 5) * 15}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={`${data.clicks} clicks at ${data.position}%`}
              />
            ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <span>Low engagement</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span>High engagement</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Click hotspots</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeviceHeatmap = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Device Usage Patterns</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Mobile', 'Desktop', 'Tablet'].map(deviceType => {
          const deviceData = deviceHeatmapData.filter(d => d.device === deviceType);
          const maxUsage = Math.max(...deviceData.map(d => d.usage));
          
          return (
            <Card key={deviceType}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {deviceType === 'Mobile' && <Smartphone className="w-5 h-5" />}
                  {deviceType === 'Desktop' && <Monitor className="w-5 h-5" />}
                  {deviceType === 'Tablet' && <Tablet className="w-5 h-5" />}
                  <span>{deviceType}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-1">
                  {hours.map(hour => {
                    const hourData = deviceData.find(d => d.hour === hour);
                    const usage = hourData?.usage || 0;
                    const engagement = hourData?.engagement || 0;
                    
                    return (
                      <div
                        key={hour}
                        className={`w-8 h-8 rounded cursor-pointer transition-all duration-200 hover:scale-110 ${
                          getIntensityColor(usage, maxUsage)
                        }`}
                        onMouseEnter={() => setHoveredCell({
                          type: 'device',
                          device: deviceType,
                          hour: hour,
                          usage: usage,
                          engagement: engagement
                        })}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`${hour}:00 - ${usage} users, ${engagement}% engagement`}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Hours (0-23)
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderGeographicHeatmap = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* World map placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Global Reader Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
              <Globe className="w-16 h-16 text-gray-400" />
              
              {/* Simulated geographic points */}
              {geographicData.slice(0, 10).map((location, index) => (
                <div
                  key={location.country}
                  className="absolute w-3 h-3 bg-blue-500 rounded-full animate-pulse cursor-pointer"
                  style={{
                    left: `${20 + (index % 5) * 15}%`,
                    top: `${30 + (index % 3) * 20}%`,
                  }}
                  onMouseEnter={() => setHoveredCell({
                    type: 'geographic',
                    country: location.country,
                    users: location.users,
                    engagement: location.engagement
                  })}
                  onMouseLeave={() => setHoveredCell(null)}
                  title={`${location.country}: ${location.users} users`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Top countries list */}
        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geographicData
                .sort((a, b) => b.users - a.users)
                .slice(0, 10)
                .map((location, index) => (
                  <div key={location.country} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <span className="text-gray-900">{location.country}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {location.users.toLocaleString()} users
                      </div>
                      <div className="text-xs text-gray-500">
                        {location.engagement.toFixed(1)}% engagement
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* View selector */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'time', label: 'Time Patterns', icon: <Clock className="w-4 h-4" /> },
              { id: 'scroll', label: 'Scroll Behavior', icon: <MousePointer className="w-4 h-4" /> },
              { id: 'device', label: 'Device Usage', icon: <Smartphone className="w-4 h-4" /> },
              { id: 'geographic', label: 'Geographic', icon: <Globe className="w-4 h-4" /> },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  selectedView === view.id
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {view.icon}
                <span>{view.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap content */}
      <Card>
        <CardContent className="p-6">
          {selectedView === 'time' && renderTimeHeatmap()}
          {selectedView === 'scroll' && renderScrollHeatmap()}
          {selectedView === 'device' && renderDeviceHeatmap()}
          {selectedView === 'geographic' && renderGeographicHeatmap()}
        </CardContent>
      </Card>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-xs">
          {hoveredCell.type === 'time' && (
            <div>
              <div className="font-medium">{hoveredCell.day} {hoveredCell.hour}:00</div>
              <div className="text-sm text-gray-300">{hoveredCell.value} active readers</div>
              {hoveredCell.metadata && (
                <div className="text-xs text-gray-400 mt-1">
                  <div>Avg session: {hoveredCell.metadata.avgSessionTime}m</div>
                  <div>Bounce rate: {hoveredCell.metadata.bounceRate}%</div>
                </div>
              )}
            </div>
          )}
          
          {hoveredCell.type === 'scroll' && (
            <div>
              <div className="font-medium">{hoveredCell.position}% down page</div>
              <div className="text-sm text-gray-300">
                Engagement: {(hoveredCell.intensity * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">
                {hoveredCell.clicks} clicks, {hoveredCell.timeSpent}s spent
              </div>
            </div>
          )}
          
          {hoveredCell.type === 'device' && (
            <div>
              <div className="font-medium">{hoveredCell.device} at {hoveredCell.hour}:00</div>
              <div className="text-sm text-gray-300">{hoveredCell.usage} users</div>
              <div className="text-xs text-gray-400">{hoveredCell.engagement}% engagement</div>
            </div>
          )}
          
          {hoveredCell.type === 'geographic' && (
            <div>
              <div className="font-medium">{hoveredCell.country}</div>
              <div className="text-sm text-gray-300">{hoveredCell.users} users</div>
              <div className="text-xs text-gray-400">{hoveredCell.engagement}% engagement</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}