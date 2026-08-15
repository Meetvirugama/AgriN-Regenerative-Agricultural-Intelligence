import React from 'react';
import { FieldHealthTrend } from '../types/satellite.types';

interface SatelliteTrendChartProps {
  timeline: FieldHealthTrend[];
}

export const SatelliteTrendChart: React.FC<SatelliteTrendChartProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return <div className="p-4 text-center text-text-muted text-sm border border-border">No trend data available.</div>;
  }

  // Simple SVG line chart
  const height = 150;
  const width = 100; // Will use % for responsive width
  
  // Find min/max for scaling
  const values = timeline.map(t => t.ndviValue);
  const minVal = Math.min(...values, 0.2); // Ensure some padding
  const maxVal = Math.max(...values, 0.8);
  const range = maxVal - minVal;
  
  const getX = (index: number) => (index / (timeline.length - 1)) * 100;
  const getY = (value: number) => height - ((value - minVal) / (range || 1)) * height * 0.8 - (height * 0.1);

  // Generate path
  const points = timeline.map((t, i) => `${getX(i)},${getY(t.ndviValue)}`).join(' L ');
  const pathData = `M ${points}`;

  return (
    <div className="w-full bg-background border border-border p-4">
      <div className="flex justify-between items-center mb-4">
         <h4 className="font-bold uppercase text-sm tracking-widest text-text-muted">Vegetation Trend (NDVI)</h4>
      </div>
      
      <div className="relative w-full h-[150px]">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-text-muted py-2">
           <span>High</span>
           <span>Low</span>
        </div>
        
        {/* Chart area */}
        <div className="ml-8 w-[calc(100%-2rem)] h-full relative border-l border-b border-border/30">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
             <path 
               d={pathData} 
               fill="none" 
               stroke="var(--text-main)" 
               strokeWidth="2" 
               vectorEffect="non-scaling-stroke" 
             />
             {timeline.map((t, i) => (
               <circle 
                 key={i}
                 cx={`${getX(i)}%`}
                 cy={getY(t.ndviValue)}
                 r="4"
                 fill="var(--background)"
                 stroke="var(--text-main)"
                 strokeWidth="2"
               />
             ))}
          </svg>
          
          {/* X-axis labels (first and last) */}
          <div className="absolute -bottom-6 w-full flex justify-between text-[10px] text-text-muted">
            <span>{new Date(timeline[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(timeline[timeline.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
      <div className="mt-8 text-xs text-text-muted">
        Based on rolling satellite observations.
      </div>
    </div>
  );
};
