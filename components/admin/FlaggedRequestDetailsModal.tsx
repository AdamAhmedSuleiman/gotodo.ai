// src/components/admin/FlaggedRequestDetailsModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import { AdminFlaggedRequestDetailsModalProps } from '../../types.js'; 
import Textarea from '../ui/Textarea.js';

const FlaggedRequestDetailsModal: React.FC<AdminFlaggedRequestDetailsModalProps> = ({
  isOpen,
  onClose,
  request,
  onModerateRequest,
}) => {
  const [moderationNotes, setModerationNotes] = useState('');
  if (!request) return null;

  const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode }> = ({ label, value }) => (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 break-words">{value || 'N/A'}</dd>
    </div>
  );

  const handleModerationAction = (action: 'resolve' | 'warn_user' | 'ban_user' | 'remove_content' | 'dismiss_flag') => {
    onModerateRequest(request.id, action, moderationNotes);
    onClose(); // Close modal after action
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Flagged Content Review: ${request.id.substring(0,8)}`}
      size="2xl" 
      footer={
        <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={onClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
            <Button variant="outline" onClick={() => handleModerationAction('dismiss_flag')} className="dark:text-gray-300 dark:border-gray-500">Dismiss Flag</Button>
            <Button variant="primary" onClick={() => handleModerationAction('resolve')} className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">Resolve/Approve</Button>
            <Button 
                variant="outline" 
                onClick={() => handleModerationAction('warn_user')} 
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-400 dark:text-yellow-300 dark:hover:bg-yellow-700/30"
            >
                Warn User
            </Button>
            <Button variant="danger" onClick={() => handleModerationAction('remove_content')}>Remove Content</Button>
            <Button variant="danger" onClick={() => handleModerationAction('ban_user')} className="bg-red-700 hover:bg-red-800">Ban User</Button>
        </div>
      }
    >
      <div className="p-1 space-y-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          <DetailItem label="Request ID" value={request.id} />
          <DetailItem label="Status" value={request.status} />
          <div className="sm:col-span-2">
            <DetailItem label="Summary / Text Input" value={request.textInput || request.aiAnalysisSummary} />
          </div>
          <DetailItem label="Reason for Flag" value={request.reason} />
          <DetailItem label="Flagged By" value={request.flaggedBy} />
          <DetailItem label="Flag Date" value={request.flagDate ? new Date(request.flagDate).toLocaleString() : undefined} />
          <DetailItem label="Original Creation Date" value={request.creationDate ? new Date(request.creationDate).toLocaleString() : undefined} />
          <DetailItem label="Requester ID" value={request.requesterId} />
          {request.providerId && <DetailItem label="Provider ID" value={request.providerId} />}
          <DetailItem label="Service Type" value={request.type as string} />
          {request.disputeDetails && (
            <div className="sm:col-span-2 bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded">
                <h4 className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">Dispute Details:</h4>
                <DetailItem label="Dispute Reason" value={request.disputeDetails.reason} />
                <DetailItem label="Dispute Description" value={request.disputeDetails.description} />
                <DetailItem label="Reported Date" value={new Date(request.disputeDetails.reportedDate).toLocaleString()} />
            </div>
          )}
          {request.aiExtractedEntities && Object.keys(request.aiExtractedEntities).length > 0 && (
             <div className="sm:col-span-2">
                <DetailItem label="AI Extracted Entities" value={<pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">{JSON.stringify(request.aiExtractedEntities, null, 2)}</pre>} />
             </div>
          )}
        </dl>
        <Textarea
            label="Moderation Notes (Internal)"
            name="moderationNotes"
            value={moderationNotes}
            onChange={(e) => setModerationNotes(e.target.value)}
            placeholder="Add internal notes about this case or actions taken..."
            rows={3}
        />
      </div>
    </Modal>
  );
};

export default FlaggedRequestDetailsModal;