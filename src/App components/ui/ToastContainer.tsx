// src/components/ui/ToastContainer.tsx
import React from 'react';
import { useToast } from '../../contexts/ToastContext.js';
import Icon from './Icon.js'; 
import { ICON_PATHS } from '../../constants.js';
import { Transition } from '@headlessui/react';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) {
    return null;
  }

  const getIconForType = (type: 'success' | 'error' | 'info' | 'warning') => {
    switch (type) {
      case 'success': return <Icon path={ICON_PATHS.CHECK_CIRCLE} className="w-6 h-6 text-green-500 dark:text-green-400" />;
      case 'error': return <Icon path={ICON_PATHS.X_CIRCLE} className="w-6 h-6 text-red-500 dark:text-red-400" />;
      case 'info': return <Icon path={ICON_PATHS.INFORMATION_CIRCLE} className="w-6 h-6 text-blue-500 dark:text-blue-400" />;
      case 'warning': return <Icon path={ICON_PATHS.EXCLAMATION_TRIANGLE} className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />;
      default: return null;
    }
  };

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex flex-col items-end justify-start px-4 py-6 pointer-events-none sm:p-6 sm:items-end sm:justify-start z-[10000]" // High z-index
    >
      {toasts.map((toast) => (
        <Transition
          key={toast.id}
          show={true} 
          as={React.Fragment}
          enter="transform ease-out duration-300 transition"
          enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enterTo="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black dark:ring-gray-700 ring-opacity-5 overflow-hidden mt-2">
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getIconForType(toast.type)}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                    {toast.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    type="button"
                    className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                    onClick={() => removeToast(toast.id)}
                  >
                    <span className="sr-only">Close</span>
                    <Icon path={ICON_PATHS.X_MARK_ICON} className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      ))}
    </div>
  );
};

export default ToastContainer;