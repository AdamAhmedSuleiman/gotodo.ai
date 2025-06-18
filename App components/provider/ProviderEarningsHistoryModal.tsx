// src/components/provider/ProviderEarningsHistoryModal.tsx
import React from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Icon from '../ui/Icon.js'; 
import { ICON_PATHS } from '../../constants.js'; 
import { ProviderEarningsHistoryModalProps, RequestData } from '../../types.js'; 

const ProviderEarningsHistoryModal: React.FC<ProviderEarningsHistoryModalProps> = ({
  isOpen,
  onClose,
  completedTasks,
  totalEarnings,
  totalPayouts,
  currentBalance,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Earnings History & Summary"
      size="3xl" // Increased size for summary
      footer={<Button variant="primary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-6 p-1">
        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700 text-center">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-300">Total Earned</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">${(totalEarnings || 0).toFixed(2)}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 text-center">
            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Paid Out</h4>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${(totalPayouts || 0).toFixed(2)}</p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700 text-center">
            <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Current Balance</h4>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${(currentBalance || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Task History Section */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Completed Task Earnings:</h3>
        {completedTasks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-6">
            You have no completed tasks with earnings yet.
          </p>
        ) : (
          <div className="max-h-[45vh] overflow-y-auto border dark:border-gray-600 rounded-md">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Task Summary
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount Earned
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {completedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(task.completionDate || task.creationDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 truncate max-w-xs" title={task.textInput || task.aiAnalysisSummary}>
                      {task.textInput || task.aiAnalysisSummary || `Task ID: ${task.id}`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600 dark:text-green-400">
                      ${(task.earnedAmount || task.suggestedPrice || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProviderEarningsHistoryModal;