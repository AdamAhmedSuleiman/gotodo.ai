// src/components/ui/Modal.tsx
import React, { Fragment } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import Button from './Button.js';
import Icon from './Icon.js';
import { ICON_PATHS } from '../../constants.js';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'xs'| 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  footer?: React.ReactNode;
  hideDefaultCloseButton?: boolean;
  showCloseIcon?: boolean;
  isDismissable?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  hideDefaultCloseButton = false,
  showCloseIcon = true,
  isDismissable = true,
}) => {
  const sizeClasses = {
    xs: 'sm:max-w-xs',
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
  };

  const handleDialogClose = () => {
    if (isDismissable) {
        onClose();
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleDialogClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 dark:bg-opacity-80 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className={`relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full ${sizeClasses[size]}`}>
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  {showCloseIcon && !hideDefaultCloseButton && (
                     <Button variant="ghost" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Close modal">
                        <Icon path={ICON_PATHS.X_MARK_ICON} className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    {/* Optional Icon beside title can go here */}
                    <div className="mt-3 text-center sm:mt-0 sm:ml-0 sm:text-left w-full"> {/* Adjusted ml-0 for title */}
                      {title && (
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100 mb-3">
                          {title}
                        </Dialog.Title>
                      )}
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {children}
                      </div>
                    </div>
                  </div>
                </div>
                {footer && (
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-lg">
                    {footer}
                  </div>
                )}
                 {!footer && !hideDefaultCloseButton && !showCloseIcon && (
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-lg">
                        <Button variant="secondary" onClick={onClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">Close</Button>
                    </div>
                 )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default Modal;