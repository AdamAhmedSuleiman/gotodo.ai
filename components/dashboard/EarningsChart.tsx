// src/components/dashboard/EarningsChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EarningDataPoint } from '../../types.js'; 

interface EarningsChartProps {
  data: EarningDataPoint[];
}

const EarningsChart: React.FC<EarningsChartProps> = React.memo(({ data }) => {
  // For minimal B&W style, we use shades of gray.
  // Active bar could be darker.
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  return (
    <div className="w-full h-64 md:h-80 bg-white dark:bg-gray-800 p-0"> {/* Minimalist style */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 0, // No right margin
            left: -25, // Adjust to make Y-axis labels fit if needed
            bottom: 5,
          }}
          onMouseMove={(state) => {
            if (state.isTooltipActive && state.activeTooltipIndex !== undefined) {
              setActiveIndex(state.activeTooltipIndex);
            } else {
              setActiveIndex(null);
            }
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} /> {/* Light gray grid lines */}
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'currentColor' }} axisLine={{ stroke: '#9ca3af' }} tickLine={{ stroke: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 12, fill: 'currentColor' }} axisLine={{ stroke: '#9ca3af' }} tickLine={{ stroke: '#9ca3af' }} />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.05)' }} // Very light cursor hover
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', color: '#1f2937' }}
            itemStyle={{ color: '#1f2937' }}
          />
          <Bar dataKey="earnings" name="Earnings" unit="$" radius={[4, 4, 0, 0]}> {/* Moved radius here */}
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === activeIndex ? '#1f2937' : '#6b7280'} // Darker for active, medium gray for others
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default EarningsChart;