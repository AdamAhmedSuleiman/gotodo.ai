// src/components/request/RequestStatusTimeline.tsx
import React from 'react';
import { RequestStatus } from '../../types.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';

interface RequestStatusTimelineProps {
  currentStatus: RequestStatus;
}

const RequestStatusTimeline: React.FC<RequestStatusTimelineProps> = ({ currentStatus }) => {
  const statusesInOrder: RequestStatus[] = [
    RequestStatus.PENDING,
    RequestStatus.AWAITING_ACCEPTANCE,
    RequestStatus.PROVIDER_ASSIGNED,
    RequestStatus.EN_ROUTE,
    RequestStatus.SERVICE_IN_PROGRESS,
    RequestStatus.PENDING_PAYMENT,
    RequestStatus.COMPLETED,
  ];

  const cancelledOrDisputed = currentStatus === RequestStatus.CANCELLED || currentStatus === RequestStatus.DISPUTED;
  const currentIndex = cancelledOrDisputed ? -1 : statusesInOrder.indexOf(currentStatus); // -1 if not in primary flow

  const getStatusLabel = (status: RequestStatus): string => {
    switch (status) {
      case RequestStatus.PENDING: return "Pending";
      case RequestStatus.AWAITING_ACCEPTANCE: return "Awaiting Acceptance";
      case RequestStatus.PROVIDER_ASSIGNED: return "Provider Assigned";
      case RequestStatus.EN_ROUTE: return "En Route";
      case RequestStatus.SERVICE_IN_PROGRESS: return "In Progress";
      case RequestStatus.PENDING_PAYMENT: return "Payment Due";
      case RequestStatus.COMPLETED: return "Completed";
      case RequestStatus.CANCELLED: return "Cancelled";
      case RequestStatus.DISPUTED: return "Disputed";
      default: return status;
    }
  };

  if (cancelledOrDisputed) {
    return (
      <div className="flex items-center justify-center p-2 rounded-md bg-gray-100 dark:bg-gray-700">
        <Icon path={currentStatus === RequestStatus.CANCELLED ? ICON_PATHS.X_CIRCLE : ICON_PATHS.FLAG} 
              className={`w-5 h-5 mr-2 ${currentStatus === RequestStatus.CANCELLED ? 'text-red-500 dark:text-red-400' : 'text-pink-500 dark:text-pink-400'}`} />
        <p className={`text-sm font-medium ${currentStatus === RequestStatus.CANCELLED ? 'text-red-600 dark:text-red-400' : 'text-pink-600 dark:text-pink-400'}`}>
          Status: {getStatusLabel(currentStatus)}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex items-center min-w-max">
        {statusesInOrder.map((status, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isFuture = index > currentIndex;

          let circleColor = 'bg-gray-300 dark:bg-gray-600';
          let textColor = 'text-gray-500 dark:text-gray-400';
          let lineColor = 'bg-gray-300 dark:bg-gray-600';

          if (isCompleted) {
            circleColor = 'bg-green-500 dark:bg-green-400';
            textColor = 'text-green-700 dark:text-green-300';
            lineColor = 'bg-green-500 dark:bg-green-400';
          } else if (isActive) {
            circleColor = 'bg-blue-500 dark:bg-blue-400 ring-2 ring-blue-300 dark:ring-blue-500 ring-offset-1 dark:ring-offset-gray-800';
            textColor = 'text-blue-700 dark:text-blue-300 font-semibold';
          }

          return (
            <React.Fragment key={status}>
              <div className="flex flex-col items-center text-center mx-1 sm:mx-2 flex-shrink-0 w-20 sm:w-28">
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${circleColor} transition-colors duration-300`}>
                  {isCompleted && <Icon path={ICON_PATHS.CHECK_CIRCLE} className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                  {isActive && <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>}
                </div>
                <p className={`mt-1 text-xs sm:text-sm ${textColor} transition-colors duration-300`}>{getStatusLabel(status)}</p>
              </div>
              {index < statusesInOrder.length - 1 && (
                <div className={`flex-grow h-0.5 ${isCompleted || isActive ? lineColor : 'bg-gray-300 dark:bg-gray-600'} transition-colors duration-300`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default RequestStatusTimeline;