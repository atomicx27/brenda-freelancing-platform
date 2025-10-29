import React from 'react';
import { FaChartLine, FaChartBar, FaChartPie, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const AnalyticsChart = ({ 
  type = 'line', 
  data = [], 
  title, 
  subtitle, 
  height = 200,
  showTrend = false,
  trendValue = 0,
  trendLabel = 'vs last period'
}) => {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return <LineChart data={data} height={height} />;
      case 'bar':
        return <BarChart data={data} height={height} />;
      case 'pie':
        return <PieChart data={data} height={height} />;
      case 'metric':
        return <MetricCard data={data} showTrend={showTrend} trendValue={trendValue} trendLabel={trendLabel} />;
      default:
        return <LineChart data={data} height={height} />;
    }
  };

  const getChartIcon = () => {
    switch (type) {
      case 'line':
        return <FaChartLine className="w-5 h-5" />;
      case 'bar':
        return <FaChartBar className="w-5 h-5" />;
      case 'pie':
        return <FaChartPie className="w-5 h-5" />;
      case 'metric':
        return <FaChartBar className="w-5 h-5" />;
      default:
        return <FaChartLine className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        <div className="text-gray-400">
          {getChartIcon()}
        </div>
      </div>
      
      <div className="relative">
        {renderChart()}
      </div>
    </div>
  );
};

// Line Chart Component
const LineChart = ({ data, height }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500 text-sm">No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0));
  const minValue = Math.min(...data.map(d => d.value || 0));
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height="100%" className="overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={`${y}%`}
            x2="100%"
            y2={`${y}%`}
            stroke="#F3F4F6"
            strokeWidth="1"
          />
        ))}
        
        {/* Area under the line */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="url(#lineGradient)"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((point.value - minValue) / range) * 100;
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="4"
              fill="#3B82F6"
              className="hover:r-6 transition-all cursor-pointer"
            />
          );
        })}
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {data.map((point, index) => (
          <span key={index} className="text-center">
            {point.label || point.month || point.name}
          </span>
        ))}
      </div>
    </div>
  );
};

// Bar Chart Component
const BarChart = ({ data, height }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500 text-sm">No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0));

  return (
    <div className="flex items-end justify-between h-full" style={{ height }}>
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * 100;
        return (
          <div key={index} className="flex flex-col items-center flex-1 mx-1">
            <div className="relative w-full">
              <div
                className="bg-blue-500 rounded-t transition-all hover:bg-blue-600 cursor-pointer"
                style={{ height: `${barHeight}%` }}
                title={`${item.label || item.name}: ${item.value}`}
              />
            </div>
            <div className="mt-2 text-xs text-gray-600 text-center">
              {item.label || item.name}
            </div>
            <div className="text-xs text-gray-500">
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Pie Chart Component
const PieChart = ({ data, height }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500 text-sm">No data available</div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <div className="relative w-32 h-32">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const startAngle = cumulativePercentage * 3.6;
            const endAngle = (cumulativePercentage + percentage) * 3.6;
            
            const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = percentage > 50 ? 1 : 0;
            
            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            cumulativePercentage += percentage;

            return (
              <path
                key={index}
                d={pathData}
                fill={colors[index % colors.length]}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                title={`${item.label || item.name}: ${item.value} (${percentage.toFixed(1)}%)`}
              />
            );
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="ml-6 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm text-gray-700">
              {item.label || item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ data, showTrend, trendValue, trendLabel }) => {
  const value = data.value || data.total || 0;
  const label = data.label || data.name || 'Metric';
  const isPositive = trendValue >= 0;

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-gray-900 mb-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      {showTrend && (
        <div className={`flex items-center justify-center space-x-1 text-sm ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? <FaArrowUp /> : <FaArrowDown />}
          <span>
            {Math.abs(trendValue).toFixed(1)}% {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
};

export default AnalyticsChart;

