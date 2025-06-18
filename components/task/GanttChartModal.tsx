// src/components/task/GanttChartModal.tsx
import React from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import { GanttChartModalProps, TaskSubItem, TaskMilestone, MockGanttItem } from '../../types.js';
import { ICON_PATHS } from '../../constants.js';
import Icon from '../ui/Icon.js';

const GanttChartModal: React.FC<GanttChartModalProps> = ({
  isOpen,
  onClose,
  items,
  milestones,
  projectStartDate,
}) => {
  const getGanttItems = (): MockGanttItem[] => {
    const ganttItems: MockGanttItem[] = [];
    let currentDay = 0; // Start from day 0 for relative positioning

    // Helper to parse date or return null
    const parseDate = (dateStr?: string): Date | null => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };
    
    const baseDate = projectStartDate ? parseDate(projectStartDate) : new Date(); // Use project start or today as base

    const getDayOffset = (itemDateStr?: string): number => {
        if (!baseDate) return currentDay++; // Fallback if no base date
        const itemDate = parseDate(itemDateStr);
        if (!itemDate) return currentDay++; // Fallback if item date invalid
        const diffTime = Math.abs(itemDate.getTime() - baseDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };


    items.forEach((item, index) => {
      // Mock duration: if cost, use cost/50, else default to 2-5 days
      const duration = item.estimatedCost ? Math.max(1, Math.ceil(item.estimatedCost / 50)) : Math.floor(Math.random() * 4) + 2;
      const startDay = getDayOffset(projectStartDate); // Simplified: all tasks start after each other for now or from project start

      ganttItems.push({
        id: item.id,
        name: item.name,
        start: startDay,
        duration: duration,
        type: 'task',
        color: item.status === 'completed' ? 'bg-green-500' : (item.status === 'in_progress' ? 'bg-yellow-500' : 'bg-blue-500'),
      });
      currentDay = startDay + duration; // Next task starts after this one
    });

    milestones.forEach((milestone, index) => {
      const milestoneDay = getDayOffset(milestone.date);
      ganttItems.push({
        id: milestone.id,
        name: milestone.name,
        start: milestoneDay,
        duration: 0.5, // Milestones are points, shown as small bar
        type: 'milestone',
        color: milestone.completed ? 'bg-green-700' : 'bg-purple-600',
      });
    });
    
    // Sort by start day to ensure correct rendering order
    return ganttItems.sort((a,b) => a.start - b.start);
  };

  const ganttData = getGanttItems();
  const maxDays = ganttData.length > 0 ? Math.max(...ganttData.map(d => d.start + d.duration), 10) : 10; // Ensure at least 10 days width
  const dayWidthPercentage = 100 / maxDays;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Gantt Chart (Mock View)" size="5xl">
      <div className="p-2 space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This is a simplified visual representation. Durations are mocked.
          {projectStartDate && ` Project Start: ${new Date(projectStartDate).toLocaleDateString()}`}
        </p>
        <div className="relative w-full h-[60vh] overflow-x-auto border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 p-2">
          {/* Timeline Header */}
          <div className="sticky top-0 z-10 flex bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
            {Array.from({ length: Math.ceil(maxDays) }).map((_, dayIndex) => (
              <div
                key={`day-header-${dayIndex}`}
                className="flex-shrink-0 text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1 border-r dark:border-gray-600"
                style={{ width: `${dayWidthPercentage}%` }}
              >
                Day {dayIndex + 1}
              </div>
            ))}
          </div>

          {/* Gantt Rows */}
          <div className="relative mt-2 space-y-1">
            {ganttData.map((item, index) => (
              <div key={item.id} className="flex items-center h-8 text-xs group">
                <div className="w-40 truncate pr-2 text-gray-700 dark:text-gray-200 group-hover:font-semibold" title={item.name}>
                  {item.name}
                </div>
                <div className="flex-grow h-full relative bg-gray-200 dark:bg-gray-600 rounded-sm">
                  <div
                    title={`${item.name} (Day ${item.start + 1} - ${item.start + item.duration + 1})`}
                    className={`absolute h-full rounded-sm transition-all duration-300 ease-in-out ${item.color} ${item.type === 'milestone' ? 'opacity-90' : 'opacity-75'}`}
                    style={{
                      left: `${item.start * dayWidthPercentage}%`,
                      width: `${item.duration * dayWidthPercentage}%`,
                      minWidth: item.type === 'milestone' ? '8px' : '10px', // Ensure milestones are visible
                    }}
                  >
                    {item.type === 'milestone' && (
                      <Icon path={ICON_PATHS.STAR} className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {ganttData.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-10">No items or milestones to display.</p>}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default GanttChartModal;