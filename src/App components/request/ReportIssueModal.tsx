// src/components/request/ReportIssueModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Textarea from '../ui/Textarea.js';
import { ReportIssueModalProps } from '../../types.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';

const issueReasons = [
  "Service not as described",
  "Provider was late or didn't show up",
  "Billing error or incorrect charge",
  "Unprofessional behavior from provider",
  "Damage to property",
  "Safety concern",
  "Other",
];

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
  requestSummary,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selectedReason) {
      setError('Please select a reason for your report.');
      return;
    }
    if (selectedReason === "Other" && !description.trim()) {
        setError('Please provide a description if you select "Other".');
        return;
    }
    if (!description.trim()) {
        setError('Please provide a description of the issue.');
        return;
    }
    setError(null);
    onSubmitReport(selectedReason, description);
    // Reset form for next time
    setSelectedReason('');
    setDescription('');
  };

  const handleCloseAndReset = () => {
    setSelectedReason('');
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseAndReset}
      title={`Report an Issue with: "${requestSummary}"`}
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={handleCloseAndReset} className="dark:bg-gray-600 dark:hover:bg-gray-500">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="danger">
            <Icon path={ICON_PATHS.FLAG} className="w-4 h-4 mr-2" />
            Submit Report
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-1">
        <div>
          <label htmlFor="issueReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reason for Report:
          </label>
          <select
            id="issueReason"
            name="issueReason"
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="" disabled>-- Select a reason --</option>
            {issueReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>
        <Textarea
          label="Describe the Issue in Detail:"
          name="issueDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide as much detail as possible about the issue you experienced..."
          rows={5}
          required
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
         <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Submitting this report will flag the request for review by our support team. We will investigate and contact you if more information is needed.
        </p>
      </div>
    </Modal>
  );
};

export default ReportIssueModal;