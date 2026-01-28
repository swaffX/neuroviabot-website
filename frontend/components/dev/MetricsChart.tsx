'use client';

import { useEffect, useState } from 'react';

interface MetricsChartProps {
  data: Array<{ time: number; value: number }>;
  title: string;
  unit: string;
  color?: string;
  threshold?: number;
}

export default function MetricsChart({
  data,
  title,
  unit,
  color = '#8B5CF6',
  threshold
}: MetricsChartProps) {
  const [maxValue, setMaxValue] = useState(100);

  useEffect(() => {
    if (data.length > 0) {
      const max = Math.max(...data.map(d => d.value));
      setMaxValue(Math.ceil(max * 1.2)); // 20% padding
    }
  }, [data]);

  const getColor = (value: number) => {
    if (!threshold) return color;
    
    if (value >= threshold * 0.9) return '#EF4444'; // red
    if (value >= threshold * 0.7) return '#F59E0B'; // amber
    return '#10B981'; // green
  };

  const currentValue = data.length > 0 ? data[data.length - 1].value : 0;
  const currentColor = getColor(currentValue);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
          <p className="text-2xl font-bold" style={{ color: currentColor }}>
            {currentValue.toFixed(1)} {unit}
          </p>
        </div>
        {threshold && (
          <div className="text-sm text-gray-500">
            Threshold: {threshold} {unit}
          </div>
        )}
      </div>

      <div className="relative h-32 bg-gray-900 rounded">
        <svg className="w-full h-full" viewBox="0 0 400 128" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1="0"
              y1={128 - (percent / 100) * 128}
              x2="400"
              y2={128 - (percent / 100) * 128}
              stroke="#374151"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}

          {/* Threshold line */}
          {threshold && (
            <line
              x1="0"
              y1={128 - (threshold / maxValue) * 128}
              x2="400"
              y2={128 - (threshold / maxValue) * 128}
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="4,4"
            />
          )}

          {/* Data line */}
          {data.length > 1 && (
            <polyline
              points={data
                .map((point, index) => {
                  const x = (index / (data.length - 1)) * 400;
                  const y = 128 - (point.value / maxValue) * 128;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke={currentColor}
              strokeWidth="2"
            />
          )}

          {/* Area under curve */}
          {data.length > 1 && (
            <polygon
              points={
                data
                  .map((point, index) => {
                    const x = (index / (data.length - 1)) * 400;
                    const y = 128 - (point.value / maxValue) * 128;
                    return `${x},${y}`;
                  })
                  .join(' ') + ` 400,128 0,128`
              }
              fill={currentColor}
              fillOpacity="0.1"
            />
          )}
        </svg>
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>-{data.length * 5}s</span>
        <span>now</span>
      </div>
    </div>
  );
}

