// src/components/task/TaskProjectCard.tsx
import React, { useState, useEffect } from 'react';
import { TaskProject, TaskProjectStatus, ProjectRisk } from '../../types.js'; 
import Button from '../ui/Button.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import * as taskService from '../../services/taskService.js'; 

interface TaskProjectCardProps {
  project: TaskProject;
  onDelete: (projectId: string) => void;
  onViewDetails: (projectId: string) => void;
  onEdit: (project: TaskProject) => void; 
}

const TaskProjectCard: React.FC<TaskProjectCardProps> = ({ project, onDelete, onViewDetails, onEdit }) => {
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const fetchComments = async () => {
        if (project.id) {
          const comments = await taskService.getTaskProjectComments(project.id);
          setCommentCount(comments.length);
        }
    };
    fetchComments();
  }, [project.id]);

  const getStatusColor = (status: TaskProjectStatus) => {
    switch (status) {
      case TaskProjectStatus.DRAFT: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case TaskProjectStatus.PLANNING: return 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-200';
      case TaskProjectStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-600 dark:text-yellow-100';
      case TaskProjectStatus.COMPLETED: return 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200';
      case TaskProjectStatus.ON_HOLD: return 'bg-orange-100 text-orange-700 dark:bg-orange-600 dark:text-orange-100';
      case TaskProjectStatus.CANCELLED: return 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200';
    }
  };

  const itemsCount = project.itemsNeeded?.length || 0;
  const completedItemsCount = project.itemsNeeded?.filter(item => item.status === 'completed').length || 0;
  const milestonesCount = project.milestones?.length || 0;
  const completedMilestones = project.milestones?.filter(m => m.completed).length || 0;
  const teamMembersCount = project.team?.length || 0;
  const attachmentsCount = project.attachments?.length || 0;
  
  const highSeverityRisks = project.aiIdentifiedRisks?.filter(r => r.severity === 'high').length || 0;
  const mediumSeverityRisks = project.aiIdentifiedRisks?.filter(r => r.severity === 'medium').length || 0;
  const totalRisks = project.aiIdentifiedRisks?.length || 0;

  const budgetAmount = project.budget || 0;
  const spentAmount = project.totalSpent || 0;
  const isOverBudget = budgetAmount > 0 && spentAmount > budgetAmount;

  const criticalPathAnalyzed = project.aiCriticalPathInfo && project.aiCriticalPathInfo.pathItemIds.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5 border border-gray-200 dark:border-gray-700 flex flex-col justify-between hover:shadow-xl transition-shadow duration-200">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 truncate" title={project.title}>
            {project.title}
          </h3>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3" title={project.description}>
          {project.description || 'No description provided.'}
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3">
          <p>Created: {new Date(project.creationDate).toLocaleDateString()}</p>
          {itemsCount > 0 && (
            <p>Items: {completedItemsCount}/{itemsCount} completed</p>
          )}
          {milestonesCount > 0 && <p>Milestones: {completedMilestones}/{milestonesCount} completed</p>}
          {teamMembersCount > 0 && <p>Team: {teamMembersCount} member(s)</p>}
          {attachmentsCount > 0 && <p>Attachments: {attachmentsCount}</p>}
          {commentCount > 0 && <p>Comments: {commentCount}</p>}
          
          {project.budget !== undefined && project.budget > 0 ? (
            <p>
              Spent: <span className={isOverBudget ? 'text-red-500 font-semibold' : 'text-green-600 dark:text-green-400'}>
                ${spentAmount.toFixed(2)}
              </span> of ${project.budget.toFixed(2)} budget
            </p>
          ) : project.totalSpent !== undefined && project.totalSpent > 0 ? (
             <p>Spent: <span className='text-gray-700 dark:text-gray-200'>${spentAmount.toFixed(2)}</span> (No budget set)</p>
          ) : null}
           {totalRisks > 0 && (
            <p className="flex items-center text-yellow-600 dark:text-yellow-400">
              <Icon path={ICON_PATHS.SHIELD_EXCLAMATION} className="w-3.5 h-3.5 mr-1" />
              Risks Found:
              {highSeverityRisks > 0 && <span className="ml-1 font-semibold text-red-500 dark:text-red-400">{highSeverityRisks} High</span>}
              {mediumSeverityRisks > 0 && <span className={`${highSeverityRisks > 0 ? ',' : ''} ml-1 font-medium text-yellow-500 dark:text-yellow-400`}>{mediumSeverityRisks} Medium</span>}
            </p>
          )}
           {criticalPathAnalyzed && (
            <p className="flex items-center text-orange-600 dark:text-orange-400">
              <Icon path={ICON_PATHS.FIRE_ICON} className="w-3.5 h-3.5 mr-1" />
              Critical Path Analyzed
            </p>
          )}
        </div>
      </div>
      <div className="mt-auto pt-3 border-t dark:border-gray-700 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => onViewDetails(project.id)} className="dark:text-gray-300 dark:hover:bg-gray-700">
          Details
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEdit(project)} leftIcon={<Icon path={ICON_PATHS.COG_6_TOOTH} className="w-4 h-4"/>} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(project.id)} leftIcon={<Icon path={ICON_PATHS.TRASH_ICON} className="w-4 h-4"/>}>
          Delete
        </Button>
      </div>
    </div>
  );
};

export default TaskProjectCard;