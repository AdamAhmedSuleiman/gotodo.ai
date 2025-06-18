// src/components/provider/RateRequesterModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Textarea from '../ui/Textarea.js';
import StarRating from '../ui/StarRating.js';
import { RateRequesterModalProps } from '../../types.js';

const RateRequesterModal: React.FC<RateRequesterModalProps> = ({
  isOpen,
  onClose,
  onSubmitRating,
  requesterName,
  requestSummary,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (rating === 0) {
      setError('Please select a star rating for the requester.');
      return;
    }
    setError(null);
    onSubmitRating(rating, comment);
    setRating(0);
    setComment('');
  };

  const handleCloseAndReset = () => {
    setRating(0);
    setComment('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseAndReset}
      title={`Rate Requester: ${requesterName}`}
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={handleCloseAndReset} className="dark:bg-gray-600 dark:hover:bg-gray-500">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="primary">
            Submit Rating
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-1">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Your feedback helps maintain a respectful community. Please rate your experience with {requesterName} for the task: "{requestSummary}".
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requester's Rating:</label>
          <StarRating rating={rating} onRatingChange={setRating} size="lg" />
        </div>
        <Textarea
          label="Comments (Optional):"
          name="requesterComment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Any additional feedback about the requester..."
          rows={3}
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </Modal>
  );
};

export default RateRequesterModal;