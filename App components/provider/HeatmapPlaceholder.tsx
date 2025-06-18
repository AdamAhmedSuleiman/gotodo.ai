// src/components/provider/HeatmapPlaceholder.tsx
import React, { useMemo } from 'react';
import { HeatmapPlaceholderProps, HeatmapTile } from '../../types.js';

const HeatmapPlaceholder: React.FC<HeatmapPlaceholderProps> = ({ tiles }) => {
  const getTileColor = (intensity: number): string => {
    if (intensity > 0.8) return 'bg-red-600 dark:bg-red-500';
    if (intensity > 0.6) return 'bg-orange-500 dark:bg-orange-400';
    if (intensity > 0.4) return 'bg-yellow-400 dark:bg-yellow-300';
    if (intensity > 0.2) return 'bg-green-500 dark:bg-green-400';
    if (intensity > 0) return 'bg-blue-400 dark:bg-blue-300';
    return 'bg-gray-200 dark:bg-gray-700'; // No demand
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Demand Heatmap (Mock)</h3>
      <div 
        className="grid gap-0.5 aspect-video" // Maintain aspect ratio, gap for grid lines
        style={{ gridTemplateColumns: `repeat(${tiles[0]?.length || 1}, minmax(0, 1fr))` }}
        aria-label="Demand heatmap showing areas of high and low service requests"
      >
        {tiles.map((row, rowIndex) =>
          row.map((tile) => (
            <div
              key={tile.id}
              className={`w-full h-full ${getTileColor(tile.intensity)} rounded-sm transition-colors duration-300`}
              title={`Demand intensity: ${(tile.intensity * 100).toFixed(0)}%`}
              role="img"
              aria-label={`Map area ${tile.id} with demand intensity ${ (tile.intensity * 100).toFixed(0)}%`}
            >
              {/* Optionally, render a very small number or dot for high intensity */}
              {/* {tile.intensity > 0.7 && <span className="text-xs text-white opacity-50">🔥</span>} */}
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        Red indicates high demand, blue/green indicates lower demand. (This is a mock representation)
      </p>
    </div>
  );
};

// Generate some mock heatmap data if needed for direct use
export const generateMockHeatmapTiles = (rows: number, cols: number): HeatmapTile[][] => {
  const mockTiles: HeatmapTile[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: HeatmapTile[] = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        id: `cell-${i}-${j}`,
        intensity: Math.random(), // Random intensity
      });
    }
    mockTiles.push(row);
  }
  return mockTiles;
};


export default HeatmapPlaceholder;