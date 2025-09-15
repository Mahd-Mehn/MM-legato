'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface AnalyticsChartProps {
  title: string;
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area';
  color?: 'primary' | 'green' | 'blue' | 'purple' | 'red';
  showTrend?: boolean;
  height?: number;
  formatValue?: (value: number) => string;
}

export default function AnalyticsChart({
  title,
  data,
  type = 'line',
  color = 'primary',
  showTrend = true,
  height = 200,
  formatValue = (value) => value.toString(),
}: AnalyticsChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  // Calculate trend
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const trendPercentage = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  const trendDirection = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'neutral';

  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50 border-primary-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    red: 'text-red-600 bg-red-50 border-red-200',
  };

  const strokeColors = {
    primary: '#2563eb',
    green: '#16a34a',
    blue: '#0ea5e9',
    purple: '#9333ea',
    red: '#dc2626',
  };

  // Generate SVG path for line chart
  const generatePath = () => {
    if (data.length === 0) return '';
    
    const width = 400;
    const chartHeight = height - 40;
    const stepX = width / (data.length - 1);
    
    let path = '';
    
    data.forEach((point, index) => {
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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

      <div className="relative" style={{ height }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 400 ${height}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Chart area */}
          {type === 'area' && (
            <path
              d={`${generatePath()} L 400 ${height - 20} L 0 ${height - 20} Z`}
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
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            data.map((point, index) => {
              const width = 400 / data.length * 0.8;
              const x = (index * 400) / data.length + width * 0.1;
              const barHeight = ((point.value - minValue) / range) * (height - 40);
              const y = height - 20 - barHeight;
              
              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width={width}
                  height={barHeight}
                  fill={strokeColors[color]}
                  fillOpacity="0.8"
                  rx="2"
                />
              );
            })
          )}

          {/* Data points */}
          {(type === 'line' || type === 'area') && data.map((point, index) => {
            const x = (index * 400) / (data.length - 1);
            const y = (height - 40) - ((point.value - minValue) / range) * (height - 40);
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={hoveredPoint === index ? "6" : "4"}
                fill={strokeColors[color]}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredPoint !== null && (
          <div
            className="absolute bg-gray-900 text-white px-2 py-1 rounded text-sm pointer-events-none z-10"
            style={{
              left: `${(hoveredPoint * 100) / (data.length - 1)}%`,
              top: '10px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-medium">{formatValue(data[hoveredPoint].value)}</div>
            <div className="text-xs text-gray-300">{data[hoveredPoint].date}</div>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{data[0]?.date}</span>
        {data.length > 2 && (
          <span>{data[Math.floor(data.length / 2)]?.date}</span>
        )}
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}