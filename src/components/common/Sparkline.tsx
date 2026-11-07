import React from 'react';
import { TrendDataPoint } from '../../stores/simulationStore';

interface SparklineProps {
  data?: TrendDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  min?: number;
  max?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data = [],
  width = 90,
  height = 24,
  color = '#00e5ff',
  min,
  max
}) => {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} className="overflow-visible opacity-40">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#4b5563" strokeWidth={1} strokeDasharray="2 2" />
      </svg>
    );
  }

  const values = data.map((d) => d.pv);
  const dataMin = min !== undefined ? min : Math.min(...values);
  const dataMax = max !== undefined ? max : Math.max(...values);
  const range = dataMax - dataMin === 0 ? 1 : dataMax - dataMin;

  const points = data
    .map((d, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((d.pv - dataMin) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth={1.5} points={points} strokeLinecap="round" strokeLinejoin="round" />
      {/* End point dot */}
      {data.length > 0 && (
        <circle
          cx={width}
          cy={height - ((values[values.length - 1] - dataMin) / range) * (height - 4) - 2}
          r={2.5}
          fill={color}
        />
      )}
    </svg>
  );
};
