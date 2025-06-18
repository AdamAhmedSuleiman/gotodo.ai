// src/components/task/AISummaryExportModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import { AISummaryExportModalProps, TaskProject } from '../../types.js';
import { generateProjectSummaryAI } from '../../services/geminiService.js';
import { copyToClipboard } from '../../utils/clipboardUtils.js';
import { useToast } from '../../contexts/ToastContext.js';

const AISummaryExportModal: React.FC<AISummaryExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && project) {
      const fetchSummary = async () => {
        setIsLoading(true);
        setError(null);
        setSummary(null);
        try {
          const aiSummary = await generateProjectSummaryAI(project);
          setSummary(aiSummary);
        } catch (err) {
          const errorMessage = (err as Error).message || "Failed to generate AI summary.";
          setError(errorMessage);
          addToast(errorMessage, 'error');
        } finally {
          setIsLoading(false);
        }
      };
      fetchSummary();
    }
  }, [isOpen, project, addToast]);

  const handleCopySummary = async () => {
    if (summary) {
      try {
        await copyToClipboard(summary);
        addToast("Project summary copied to clipboard!", "success");
      } catch (err) {
        addToast("Failed to copy summary.", "error");
      }
    }
  };
  
  const handleCloseModal = () => {
    setError(null);
    setSummary(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={`AI Project Summary: ${project?.title || 'Loading...'}`}
      size="xl"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={handleCloseModal} className="dark:bg-gray-600 dark:hover:bg-gray-500">
            Close
          </Button>
          {summary && !isLoading && (
            <Button variant="primary" onClick={handleCopySummary} leftIcon={<Icon path={ICON_PATHS.CLIPBOARD_ICON} className="w-4 h-4"/>}>
              Copy Summary
            </Button>
          )}
        </div>
      }
    >
      <div className="p-2 space-y-3 min-h-[200px]">
        {isLoading && (
          <div className="flex justify-center items-center h-full py-10">
            <LoadingSpinner text="Generating AI summary..." />
          </div>
        )}
        {error && !isLoading && (
          <div className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-md">
            <p><strong>Error:</strong> {error}</p>
            <p className="text-xs mt-1">Please try again or ensure your API key is configured correctly.</p>
          </div>
        )}
        {summary && !isLoading && (
          <textarea
            readOnly
            value={summary}
            className="w-full h-64 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            aria-label="AI Generated Project Summary"
          />
        )}
      </div>
    </Modal>
  );
};

export default AISummaryExportModal;