'use client';

import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ZoomIn, 
  Filter,
  Download,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
  breakdown?: Record<string, number>;
}

interface DrillDownLevel {
  level: string;
  data: ChartDataPoint[];
  title: string;
}

interface AdvancedAnalyticsChartProps {
  title: string;
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area' | 'pie' | 'heatmap';
  color?: 'primary' | 'green' | 'blue' | 'purple' | 'red' | 'orange';
  showTrend?: boolean;
  height?: number;
  formatValue?: (value: number) => string;
  drillDownLevels?: DrillDownLevel[];
  enableDrillDown?: boolean;
  enableFilters?: boolean;
  enableExport?: boolean;
  onDrillDown?: (level: string, dataPoint: ChartDataPoint) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onExport?: (format: 'csv' | 'png' | 'pdf') => void;
}

export default function AdvancedAnalyticsChart({
  title,
  data,
  type = 'line',
  color = 'primary',
  showTrend = true,
  height = 300,
  formatValue = (value) => value.toString(),
  drillDownLevels = [],
  enableDrillDown = false,
  enableFilters = false,
  enableExport = false,
  onDrillDown,
  onFilter,
  onExport,
}: AdvancedAnalyticsChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);
  const [currentDrillLevel, setCurrentDrillLevel] = useState<string>('main');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const currentData = useMemo(() => {
    if (currentDrillLevel === 'main') return data;
    const drillLevel = drillDownLevels.find(level => level.level === currentDrillLevel);
    return drillLevel?.data || data;
  }, [currentDrillLevel, data, drillDownLevels]);

  const currentTitle = useMemo(() => {
    if (currentDrillLevel === 'main') return title;
    const drillLevel = drillDownLevels.find(level => level.level === currentDrillLevel);
    return drillLevel?.title || title;
  }, [currentDrillLevel, title, drillDownLevels]);

  if (!currentData || currentData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{currentTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-gray-500">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...currentData.map(d => d.value));
  const minValue = Math.min(...currentData.map(d => d.value));
  const range = maxValue - minValue || 1;

  // Calculate trend
  const firstValue = currentData[0]?.value || 0;
  const lastValue = currentData[currentData.length - 1]?.value || 0;
  const trendPercentage = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  const trendDirection = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'neutral';

  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50 border-primary-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
  };

  const strokeColors = {
    primary: '#2563eb',
    green: '#16a34a',
    blue: '#0ea5e9',
    purple: '#9333ea',
    red: '#dc2626',
    orange: '#ea580c',
  };

  const handlePointClick = (point: ChartDataPoint, index: number) => {
    setSelectedPoint(point);
    if (enableDrillDown && onDrillDown) {
      onDrillDown(currentDrillLevel, point);
    }
  };

  const handleDrillDown = (level: string) => {
    setCurrentDrillLevel(level);
  };

  const handleExport = (format: 'csv' | 'png' | 'pdf') => {
    if (onExport) {
      onExport(format);
    }
  };

  const generatePath = () => {
    if (currentData.length === 0) return '';
    
    const width = 500;
    const chartHeight = height - 60;
    const stepX = width / (currentData.length - 1);
    
    let path = '';
    
    currentData.forEach((point, index) => {
      const x = index * stepX;
      const y = chartHeight - ((point.value - minValue) / range) * chartHeight;
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  const renderHeatmap = () => {
    const cellSize = 20;
    const cols = Math.ceil(Math.sqrt(currentData.length));
    const rows = Math.ceil(currentData.length / cols);
    
    return (
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, ${cellSize}px)` }}>
        {currentData.map((point, index) => {
          const intensity = (point.value - minValue) / range;
          const opacity = Math.max(0.1, intensity);
          
          return (
            <div
              key={index}
              className="cursor-pointer rounded transition-all duration-200 hover:scale-110"
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: strokeColors[color],
                opacity,
              }}
              title={`${point.label || point.date}: ${formatValue(point.value)}`}
              onClick={() => handlePointClick(point, index)}
            />
          );
        })}
      </div>
    );
  };

  const renderPieChart = () => {
    const total = currentData.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    return (
      <svg width="200" height="200" viewBox="0 0 200 200">
        {currentData.map((point, index) => {
          const percentage = point.value / total;
          const angle = percentage * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <path
              key={index}
              d={pathData}
              fill={strokeColors[color]}
              fillOpacity={0.7 + (index * 0.1)}
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80"
              onClick={() => handlePointClick(point, index)}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle>{currentTitle}</CardTitle>
            {showTrend && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${
                trendDirection === 'up' 
                  ? 'text-green-600 bg-green-50' 
                  : trendDirection === 'down' 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-600 bg-gray-50'
              }`}>
                {trendDirection === 'up' && <TrendingUp className="w-4 h-4" />}
                {trendDirection === 'down' && <TrendingDown className="w-4 h-4" />}
                {trendDirection === 'neutral' && <Minus className="w-4 h-4" />}
                <span>{Math.abs(trendPercentage).toFixed(1)}%</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {enableDrillDown && drillDownLevels.length > 0 && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDrillDown('main')}
                  disabled={currentDrillLevel === 'main'}
                >
                  Overview
                </Button>
                {drillDownLevels.map((level) => (
                  <Button
                    key={level.level}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDrillDown(level.level)}
                    disabled={currentDrillLevel === level.level}
                  >
                    {level.title}
                  </Button>
                ))}
              </div>
            )}
            
            {enableFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
              </Button>
            )}
            
            {enableExport && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metric
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Views</option>
                  <option>Engagement</option>
                  <option>Revenue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Segment
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>All Users</option>
                  <option>New Users</option>
                  <option>Returning Users</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="relative" style={{ height }}>
          {type === 'heatmap' ? (
            <div className="flex items-center justify-center h-full">
              {renderHeatmap()}
            </div>
          ) : type === 'pie' ? (
            <div className="flex items-center justify-center h-full">
              {renderPieChart()}
            </div>
          ) : (
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 500 ${height}`}
              className="overflow-visible"
            >
              {/* Grid lines */}
              <defs>
                <pattern id={`grid-${color}`} width="50" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 25" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${color})`} />

              {/* Chart area */}
              {type === 'area' && (
                <path
                  d={`${generatePath()} L 500 ${height - 30} L 0 ${height - 30} Z`}
                  fill={strokeColors[color]}
                  fillOpacity="0.1"
                />
              )}

              {/* Chart line/bars */}
              {type === 'line' || type === 'area' ? (
                <path
                  d={generatePath()}
                  fill="none"
                  stroke={strokeColors[color]}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                currentData.map((point, index) => {
                  const barWidth = 500 / currentData.length * 0.8;
                  const x = (index * 500) / currentData.length + barWidth * 0.1;
                  const barHeight = ((point.value - minValue) / range) * (height - 60);
                  const y = height - 30 - barHeight;
                  
                  return (
                    <rect
                      key={index}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={strokeColors[color]}
                      fillOpacity={hoveredPoint === index ? "1" : "0.8"}
                      rx="4"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredPoint(index)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => handlePointClick(point, index)}
                    />
                  );
                })
              )}

              {/* Data points */}
              {(type === 'line' || type === 'area') && currentData.map((point, index) => {
                const x = (index * 500) / (currentData.length - 1);
                const y = (height - 60) - ((point.value - minValue) / range) * (height - 60);
                
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={hoveredPoint === index ? "8" : "6"}
                    fill={strokeColors[color]}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredPoint(index)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => handlePointClick(point, index)}
                  />
                );
              })}
            </svg>
          )}

          {/* Tooltip */}
          {hoveredPoint !== null && type !== 'heatmap' && type !== 'pie' && (
            <div
              className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm pointer-events-none z-10 shadow-lg"
              style={{
                left: `${(hoveredPoint * 100) / (currentData.length - 1)}%`,
                top: '10px',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-medium">{formatValue(currentData[hoveredPoint].value)}</div>
              <div className="text-xs text-gray-300">{currentData[hoveredPoint].date}</div>
              {currentData[hoveredPoint].metadata && (
                <div className="text-xs text-gray-300 mt-1">
                  {Object.entries(currentData[hoveredPoint].metadata || {}).map(([key, value]) => (
                    <div key={key}>{key}: {value}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* X-axis labels */}
        {type !== 'heatmap' && type !== 'pie' && (
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{currentData[0]?.date}</span>
            {currentData.length > 2 && (
              <span>{currentData[Math.floor(currentData.length / 2)]?.date}</span>
            )}
            <span>{currentData[currentData.length - 1]?.date}</span>
          </div>
        )}

        {/* Selected point details */}
        {selectedPoint && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Selected Data Point</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium">{selectedPoint.date}</span>
              </div>
              <div>
                <span className="text-gray-600">Value:</span>
                <span className="ml-2 font-medium">{formatValue(selectedPoint.value)}</span>
              </div>
              {selectedPoint.breakdown && (
                <div className="col-span-2">
                  <span className="text-gray-600">Breakdown:</span>
                  <div className="mt-1 space-y-1">
                    {Object.entries(selectedPoint.breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">{formatValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}