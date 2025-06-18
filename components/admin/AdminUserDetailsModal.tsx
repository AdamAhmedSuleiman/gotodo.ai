// src/components/admin/AdminUserDetailsModal.tsx
import React from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import { AdminUserDetailsModalProps, User } from '../../types.js';

const AdminUserDetailsModal: React.FC<AdminUserDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
  onToggleUserStatus,
}) => {
  if (!user) return null;

  const getStatusChipClass = (status?: 'active' | 'suspended' | 'pending_verification') => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100';
      case 'suspended': return 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100';
      case 'pending_verification': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-600 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200';
    }
  };

  const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 break-words">{value || 'N/A'}</dd>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`User Details: ${user.name}`}
      size="xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <Button
            variant={user.status === 'suspended' ? 'primary' : 'danger'}
            onClick={() => onToggleUserStatus(user.id, user.status)}
            className={user.status === 'suspended' ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600' : ''}
          >
            {user.status === 'suspended' ? 'Unsuspend User' : (user.status === 'pending_verification' ? 'Approve User' : 'Suspend User')}
          </Button>
          <Button variant="secondary" onClick={onClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">Close</Button>
        </div>
      }
    >
      <div className="p-1 space-y-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
          <img
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`}
            alt={`${user.name}'s avatar`}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
          />
          <div className="text-center sm:text-left flex-grow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Role: {user.role}</p>
            <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipClass(user.status)}`}>
              Status: {user.status?.replace('_', ' ') || 'N/A'}
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 border-t dark:border-gray-700 pt-3">
          <DetailItem label="User ID" value={user.id} />
          <DetailItem label="Face ID Registered" value={user.faceIdRegistered ? 'Yes' : 'No'} />
          <DetailItem label="Phone" value={user.phone} />
          <DetailItem label="Registration Date" value={user.registrationDate ? new Date(user.registrationDate).toLocaleString() : 'N/A'} />
          <DetailItem label="Last Login" value={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'} />
          {user.notificationPreferences && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notification Preferences:</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                <ul className="list-disc list-inside">
                  {Object.entries(user.notificationPreferences).map(([key, value]) => (
                    <li key={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {value ? 'Enabled' : 'Disabled'}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </Modal>
  );
};

export default AdminUserDetailsModal;